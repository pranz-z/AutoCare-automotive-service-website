import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { getTool } from "./tools";
import type { AgentRole, ToolResult } from "./types";
import type { SessionPayload } from "@/lib/admin-auth";

export type DecisionResult =
  | { ok: true; result: unknown; summary?: string }
  | { ok: false; status: number; error: string };

/**
 * Approves a pending write-tier action: validates the pending row, the
 * capability token, expiry, and the approver's role, then executes the
 * tool's apply() exactly once. Used by POST /api/agent/confirm and by the
 * /admin/approvals server actions.
 */
export async function approvePendingAction(
  id: string,
  token: string,
  session: SessionPayload,
): Promise<DecisionResult> {
  const repo = createRepository(getDb());
  const pending = await repo.getPendingAction(id);
  if (!pending) return { ok: false, status: 404, error: "Pending action not found." };
  if (pending.status !== "pending") {
    return { ok: false, status: 409, error: "This action has already been resolved." };
  }
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    await repo.resolvePendingAction(pending.id, "expired");
    return { ok: false, status: 410, error: "This confirmation has expired." };
  }

  let payload: { args?: Record<string, unknown>; token?: string; summary?: string };
  try {
    payload = JSON.parse(pending.payload) as typeof payload;
  } catch {
    return { ok: false, status: 500, error: "Stored action is malformed." };
  }
  if (payload.token !== token) {
    return { ok: false, status: 403, error: "Confirmation token does not match." };
  }

  const tool = getTool(pending.action);
  if (!tool || tool.tier !== "write" || !tool.apply) {
    return { ok: false, status: 400, error: "Unknown or non-executable action." };
  }
  const role = session.role as AgentRole;
  if (!tool.roles.includes(role)) {
    return { ok: false, status: 403, error: "Your role cannot confirm this action." };
  }

  const ctx = { role, actor: session.sub, sessionId: pending.sessionId ?? undefined };
  const result: ToolResult = await tool.apply(ctx, payload.args ?? {});

  await repo.logAgentAction({
    sessionId: pending.sessionId ?? undefined,
    actorType: session.sub ? `${role}:${session.sub}` : role,
    toolName: `${pending.action}#confirm`,
    input: payload.args ?? {},
    output: result,
    success: result.success,
  });
  await repo.resolvePendingAction(pending.id, result.success ? "confirmed" : "failed");

  if (!result.success) {
    return { ok: false, status: 400, error: result.error ?? "The action failed." };
  }
  return { ok: true, result: result.data, summary: payload.summary };
}

/**
 * Rejects a pending action without executing it. Single-use, same expiry
 * semantics as approval.
 */
export async function rejectPendingAction(
  id: string,
  session: SessionPayload,
  reason?: string,
): Promise<DecisionResult> {
  const repo = createRepository(getDb());
  const pending = await repo.getPendingAction(id);
  if (!pending) return { ok: false, status: 404, error: "Pending action not found." };
  if (pending.status !== "pending") {
    return { ok: false, status: 409, error: "This action has already been resolved." };
  }

  let summary = pending.action;
  try {
    const payload = JSON.parse(pending.payload) as { summary?: string; args?: unknown };
    summary = payload.summary ?? pending.action;
    await repo.logAgentAction({
      sessionId: pending.sessionId ?? undefined,
      actorType: session.sub ? `${session.role}:${session.sub}` : session.role,
      toolName: `${pending.action}#reject`,
      input: payload.args ?? {},
      output: { rejected: true, reason: reason ?? "" },
      success: true,
    });
  } catch { /* malformed payload — still reject */ }

  await repo.resolvePendingAction(pending.id, "rejected");
  return { ok: true, result: { rejected: true }, summary };
}
