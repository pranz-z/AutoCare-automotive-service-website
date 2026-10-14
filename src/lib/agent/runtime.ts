import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { createRepository, type Repository } from "@/lib/db/repository";
import { validateArgs } from "./schema";
import { canCall, getTool, getToolsForRole } from "./tools";
import type {
  AgentContent,
  AgentContext,
  AgentCard,
  AgentModel,
  AgentResult,
  ModelToolCall,
  ModelTurn,
  PendingConfirmation,
  ToolCallRecord,
  ToolResult,
} from "./types";

export const AGENT_MAX_STEPS = 6;
export const AGENT_TIMEOUT_MS = 20_000;
/** Per model-call ceiling — a single generate() can never outlast this or the run deadline. */
export const AGENT_MODEL_TIMEOUT_MS = 12_000;
export const PENDING_TTL_MINUTES = 15;

const STEP_LIMIT_REASON = "That needed more steps than I'm allowed to take";
const TIMEOUT_REASON = "That took too long — I hit the time limit";
const REPEAT_REASON = "I already ran that check, so I stopped to avoid looping";
const FALLBACK_REPLY = "I couldn't produce an answer for that. Please try rephrasing or contact us for help.";

function timingEnabled() {
  const flag = process.env.AGENT_TIMING;
  return flag === "1" || flag === "true" || process.env.NODE_ENV === "development";
}

function tlog(enabled: boolean, msg: string) {
  if (enabled) console.info(`[agent] ${msg}`);
}

/** Deterministic key for detecting a repeated identical tool call. */
function callKey(call: ModelToolCall): string {
  const stable = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])]))
        : v;
  return `${call.name}:${JSON.stringify(stable(call.args ?? {}))}`;
}

/** Rejects when the signal aborts — bounds a model call that ignores its signal. */
function abortRace(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error("model call aborted"));
      return;
    }
    signal.addEventListener(
      "abort",
      () => reject(signal.reason instanceof Error ? signal.reason : new Error("model call aborted")),
      { once: true },
    );
  });
}

/** User-facing partial answer for a stopped run: what we gathered before stopping. */
function partialReply(reason: string, toolCalls: ToolCallRecord[], pendingActions: PendingConfirmation[]): string {
  const lines = toolCalls
    .filter((t) => t.success && t.output !== undefined)
    .slice(-6)
    .map((t) => {
      const json = JSON.stringify(t.output);
      return `- ${t.name}: ${json.length > 220 ? `${json.slice(0, 217)}...` : json}`;
    });
  for (const p of pendingActions.slice(-3)) {
    lines.push(`- awaiting confirmation: ${p.summary}`);
  }
  const header = `${reason}. `;
  return lines.length ? `${header}Here's what I found so far:\n${lines.join("\n")}` : `${header.trimEnd()} — please try again or contact us directly.`;
}

interface DispatchOutcome {
  record: ToolCallRecord;
  /** Result payload fed back to the model as the function response. */
  forModel: unknown;
  pending?: PendingConfirmation;
}

async function logCall(
  repo: Repository,
  ctx: AgentContext,
  toolName: string,
  input: unknown,
  output: unknown,
  success: boolean,
) {
  try {
    await repo.logAgentAction({
      sessionId: ctx.sessionId,
      actorType: ctx.actor ? `${ctx.role}:${ctx.actor}` : ctx.role,
      toolName,
      input,
      output,
      success,
    });
  } catch {
    // Audit must never break the agent loop.
  }
}

async function dispatch(
  call: ModelToolCall,
  ctx: AgentContext,
  repo: Repository,
): Promise<DispatchOutcome> {
  const tool = getTool(call.name);
  if (!tool) {
    const output: ToolResult = { success: false, error: `Unknown tool: ${call.name}` };
    await logCall(repo, ctx, call.name, call.args, output, false);
    return { record: { name: call.name, input: call.args, success: false, error: output.error }, forModel: output };
  }

  if (!canCall(tool, ctx.role)) {
    const output: ToolResult = { success: false, error: `Tool ${tool.name} is not available for this role.` };
    await logCall(repo, ctx, tool.name, call.args, output, false);
    return { record: { name: tool.name, input: call.args, success: false, error: output.error }, forModel: output };
  }

  const argError = validateArgs(tool.inputSchema, call.args ?? {});
  if (argError) {
    const output: ToolResult = { success: false, error: argError };
    await logCall(repo, ctx, tool.name, call.args, output, false);
    return { record: { name: tool.name, input: call.args, success: false, error: argError }, forModel: output };
  }

  const input = (call.args ?? {}) as Record<string, unknown>;

  if (tool.tier === "write") {
    const preview = await tool.execute(ctx, input).catch((e: unknown) => ({
      success: false,
      error: e instanceof Error ? e.message : "Validation failed",
    }) as ToolResult);
    if (!preview.success) {
      await logCall(repo, ctx, tool.name, input, preview, false);
      return { record: { name: tool.name, input, success: false, error: preview.error }, forModel: preview };
    }
    const token = randomBytes(20).toString("hex");
    const summary = tool.summarize ? tool.summarize(input) : `${tool.name} with provided arguments`;
    const pending = await repo.createPendingAction({
      sessionId: ctx.sessionId,
      action: tool.name,
      payload: { args: input, token, summary },
      expiresInMinutes: PENDING_TTL_MINUTES,
    });
    const output = {
      success: true,
      pending: true,
      pendingActionId: pending.id,
      summary,
      message: "This action requires confirmation. Ask the staff member to approve it.",
    };
    await logCall(repo, ctx, tool.name, input, output, true);
    return {
      record: { name: tool.name, input, success: true, pending: true, output: { summary } },
      forModel: output,
      pending: { id: pending.id, tool: tool.name, summary, expiresAt: pending.expiresAt, token },
    };
  }

  try {
    const output = await tool.execute(ctx, input);
    await logCall(repo, ctx, tool.name, input, output, output.success);
    return {
      record: {
        name: tool.name,
        input,
        success: output.success,
        output: output.data,
        error: output.error,
        ...(output.cards?.length ? { cards: output.cards } : {}),
      },
      forModel: output,
    };
  } catch (error) {
    const output: ToolResult = {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
    await logCall(repo, ctx, tool.name, input, output, false);
    return { record: { name: tool.name, input, success: false, error: output.error }, forModel: output };
  }
}

export interface RunAgentOptions {
  model: AgentModel;
  ctx: AgentContext;
  message: string;
  history?: { role: string; content: string }[];
  system: string;
  repo?: Repository;
  maxSteps?: number;
  timeoutMs?: number;
}

export async function runAgent(options: RunAgentOptions): Promise<AgentResult> {
  const {
    model,
    ctx,
    message,
    history = [],
    system,
    maxSteps = AGENT_MAX_STEPS,
    timeoutMs = AGENT_TIMEOUT_MS,
  } = options;
  const repo = options.repo ?? createRepository(getDb());
  const started = Date.now();
  const deadline = started + timeoutMs;
  const timing = timingEnabled();
  // Fires at the overall deadline — aborts any in-flight model call.
  const runAbort = new AbortController();
  const runTimer = setTimeout(() => runAbort.abort(new Error(`agent run exceeded ${timeoutMs}ms`)), timeoutMs);

  const contents: AgentContent[] = [
    ...history.map((h) => ({
      role: h.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: h.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const declarations = getToolsForRole(ctx.role).map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.inputSchema,
  }));

  const toolCalls: ToolCallRecord[] = [];
  const pendingActions: PendingConfirmation[] = [];
  const cards: AgentCard[] = [];
  const seenCalls = new Set<string>();
  const finish = (result: Omit<AgentResult, "cards">): AgentResult => {
    clearTimeout(runTimer);
    tlog(timing, `done steps=${result.steps} ok=${result.ok}${result.truncated ? " truncated" : ""} total=${Date.now() - started}ms`);
    return { ...result, cards };
  };
  const stop = (reason: string, steps: number): AgentResult =>
    finish({ ok: false, reply: partialReply(reason, toolCalls, pendingActions), toolCalls, pendingActions, steps, truncated: true });

  try {
    for (let step = 1; step <= maxSteps; step++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return stop(TIMEOUT_REASON, step - 1);

      // Per-call cap: the smaller of the per-call budget and the time left.
      // abortSignal covers compliant models; abortRace bounds even a hung one.
      const callCap = Math.min(remaining, AGENT_MODEL_TIMEOUT_MS);
      const callSignal = AbortSignal.any([runAbort.signal, AbortSignal.timeout(callCap)]);

      const modelStart = Date.now();
      let turn: ModelTurn;
      try {
        turn = await Promise.race([
          model.generate({ system, contents, tools: declarations, signal: callSignal, timeoutMs: callCap }),
          abortRace(callSignal),
        ]);
      } catch (error) {
        if (callSignal.aborted || Date.now() >= deadline) return stop(TIMEOUT_REASON, step - 1);
        throw error;
      }
      const modelMs = Date.now() - modelStart;
      const calls = turn.toolCalls ?? [];
      tlog(timing, `step=${step} model=${modelMs}ms calls=${calls.map((c) => c.name).join(",") || "none"}`);

      if (!calls.length) {
        const reply = turn.text?.trim();
        if (reply) return finish({ ok: true, reply, toolCalls, pendingActions, steps: step });
        return finish({ ok: false, reply: FALLBACK_REPLY, toolCalls, pendingActions, steps: step });
      }

      contents.push({
        role: "model",
        parts: [
          ...(turn.text ? [{ text: turn.text }] : []),
          ...((turn.extraParts ?? []) as AgentContent["parts"]),
          ...calls.map((c) => ({ functionCall: { name: c.name, args: c.args }, ...c.partExtras })),
        ],
      });

      const responseParts: AgentContent["parts"] = [];
      let repeated = false;
      for (const call of calls) {
        const key = callKey(call);
        if (seenCalls.has(key)) {
          tlog(timing, `step=${step} repeated call ${call.name} — stopping`);
          repeated = true;
          break;
        }
        seenCalls.add(key);
        if (deadline - Date.now() <= 0) return stop(TIMEOUT_REASON, step - 1);

        const toolStart = Date.now();
        const outcome = await dispatch(call, ctx, repo);
        tlog(
          timing,
          `step=${step} tool=${call.name} ${outcome.record.success ? "ok" : "err"}${outcome.pending ? " pending" : ""} ${Date.now() - toolStart}ms`,
        );
        toolCalls.push(outcome.record);
        if (outcome.record.cards) cards.push(...outcome.record.cards);
        if (outcome.pending) pendingActions.push(outcome.pending);
        responseParts.push({
          functionResponse: { name: call.name, response: { result: outcome.forModel } },
        });
      }
      if (repeated) return stop(REPEAT_REASON, step);
      contents.push({ role: "user", parts: responseParts });
    }

    return stop(STEP_LIMIT_REASON, maxSteps);
  } finally {
    clearTimeout(runTimer);
  }
}
