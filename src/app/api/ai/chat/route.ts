import { NextRequest } from "next/server";
import { getGeminiModel, isGeminiConfigured } from "@/lib/ai/gemini";
import { getServices, getVehicleBrands } from "@/lib/content";
import {
  getUnsupportedReply,
  getUnavailableReply,
  isPrivateRequest,
  MAX_CHAT_HISTORY,
  MAX_CHAT_MESSAGE,
  MAX_CHAT_REPLY,
  selectPublicSources,
} from "@/lib/ai/public-grounding";
import { detectSafetyIssue } from "@/lib/ai/assistant";
import { containsPersonalData, DEMO_PRIVACY_ERROR } from "@/lib/ai/demo-privacy";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { attachCallerCookie, callerKey, takeRateLimit } from "@/lib/rate-limit";
import { runAgent } from "@/lib/agent/runtime";
import { createGeminiAgentModel } from "@/lib/agent/model";
import { PUBLIC_SYSTEM_PREFIX, STAFF_SYSTEM } from "@/lib/agent/prompts";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import type { AgentRole, OpenRecord } from "@/lib/agent/types";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_BODY_BYTES = 4096;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

/** Re-resolves the client's claimed open record — output is server-verified. */
async function resolveOpenRecord(
  repo: ReturnType<typeof createRepository>,
  raw: unknown,
): Promise<OpenRecord | undefined> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const { type, id } = raw as { type?: unknown; id?: unknown };
  if (typeof type !== "string" || typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    return undefined;
  }
  switch (type) {
    case "appointment": {
      const row = (await repo.listAppointmentsDetailed()).find((a) => a.id === id || a.reference === id.toUpperCase());
      return row ? { type, id: row.id, reference: row.reference } : undefined;
    }
    case "inquiry": {
      const row = (await repo.listInquiriesDetailed()).find((i) => i.id === id || i.reference === id.toUpperCase());
      return row ? { type, id: row.id, reference: row.reference } : undefined;
    }
    case "customer": {
      const row = (await repo.listCustomers()).find((c) => c.id === id);
      return row ? { type, id: row.id, reference: row.name } : undefined;
    }
    case "chat": {
      const row = await repo.getChatSession(id);
      return row ? { type, id: row.id, reference: row.customerName ?? row.id } : undefined;
    }
    default:
      return undefined;
  }
}

function filterPublicReply(reply: string): string {
  if (
    !reply ||
    reply.length > MAX_CHAT_REPLY ||
    /(?:\bhttps?:\/\/|\b\/(?:admin|api)\/|\b(?:booking (?:is|was) confirmed|appointment (?:is|was) available)\b)/i.test(reply)
  ) {
    return getUnavailableReply();
  }
  return reply;
}

export async function POST(request: NextRequest) {
  // Rate limit keyed on the verified staff session or a signed anonymous
  // cookie — never on client-controlled headers like x-forwarded-for.
  const { key, setAnonCookie } = callerKey(request);
  const respond = (body: unknown, init?: ResponseInit) =>
    attachCallerCookie(Response.json(body, init), setAnonCookie);

  if (!takeRateLimit(key, MAX_REQUESTS, WINDOW_MS)) {
    return respond({ ok: false, reply: "Please wait a minute before asking again. You can still browse public pages or contact us for help." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) throw new Error("Request too large");
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error("Request too large");
    body = JSON.parse(raw);
  } catch {
    return respond({ ok: false, error: "Invalid or oversized request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return respond({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.message !== "string" || !body.message.trim() || body.message.length > MAX_CHAT_MESSAGE) {
    return respond({ ok: false, error: "Enter a message of up to 800 characters." }, { status: 400 });
  }
  if (body.history !== undefined && (!Array.isArray(body.history) || body.history.length > MAX_CHAT_HISTORY ||
    body.history.some((item) => !item || typeof item !== "object" || !["user", "assistant"].includes(String((item as { role?: unknown }).role)) || typeof (item as { content?: unknown }).content !== "string" || ((item as { content: string }).content).length > MAX_CHAT_MESSAGE))) {
    return respond({ ok: false, error: "Invalid conversation history." }, { status: 400 });
  }
  const history = (body.history as { role: string; content: string }[] | undefined) ?? [];
  const message = body.message.trim();

  // The mode is decided by the signed server session — never by the request body.
  const session = getAdminSessionFromRequest(request);
  const role: AgentRole = session?.role ?? "public";

  const repo = createRepository(await getDb());
  const rawConvId = typeof body.conversationId === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(body.conversationId)
    ? body.conversationId
    : undefined;
  let chatSession = rawConvId ? await repo.getChatSession(rawConvId) : undefined;
  if (!chatSession) {
    chatSession = await repo.createChatSession({
      id: rawConvId,
      channel: role === "public" ? "public" : "staff",
      customerName: role === "public" ? "Site visitor" : (session?.sub ?? "Staff"),
      conversationType: "ai",
      messages: [],
    });
  }

  if (role === "public") {
    if (containsPersonalData(message) || history.some((item) => containsPersonalData(item.content))) {
      return respond({ ok: false, reply: DEMO_PRIVACY_ERROR, sources: [] }, { status: 400 });
    }
    const safety = detectSafetyIssue(message);
    if (safety.isCritical) {
      return respond({
        ok: true,
        reply: `${safety.reason}: ${safety.recommendation} Please contact us for professional assistance.`,
        sources: [],
        safety,
      });
    }
    if (isPrivateRequest(message)) {
      return respond({ ok: true, reply: getUnsupportedReply(), sources: [], safety });
    }

    const sources = selectPublicSources(message);
    const system = `${PUBLIC_SYSTEM_PREFIX}\nPublic excerpts: ${JSON.stringify(
      sources.map(({ label, text }) => ({ label, text })),
    )}`;

    try {
      const result = await runAgent({
        model: createGeminiAgentModel(),
        ctx: { role, sessionId: chatSession.id },
        message,
        history,
        system,
      });
      const reply = filterPublicReply(result.reply);
      await persistMessages(repo, chatSession.id, message, reply, chatSession.messages.length);
      return respond({
        ok: result.ok,
        reply,
        cards: result.cards,
        sources: result.ok ? sources.map(({ label, href }) => ({ label, href })) : [],
        safety,
        conversationId: chatSession.id,
      });
    } catch {
      return respond({ ok: true, reply: getUnavailableReply(), sources: [], safety });
    }
  }

  // Staff / manager / admin — tools audited, writes staged for confirmation.
  try {
    // The client's claimed open record is only a hint — re-resolve it against
    // the DB so injected ids/references can never leak into the agent context.
    const openRecord = await resolveOpenRecord(repo, body.openRecord);
    const system = openRecord
      ? `${STAFF_SYSTEM}\nRecord context: the staff member has ${openRecord.type} "${openRecord.reference ?? openRecord.id}" open (internal id: ${openRecord.id}). "This ${openRecord.type}" refers to it.`
      : STAFF_SYSTEM;
    const result = await runAgent({
      model: createGeminiAgentModel(),
      ctx: { role, actor: session?.sub, sessionId: chatSession.id, openRecord },
      message,
      history,
      system,
    });
    await persistMessages(repo, chatSession.id, message, result.reply, chatSession.messages.length);
    return respond({
      ok: result.ok,
      reply: result.reply,
      toolCalls: result.toolCalls,
      pendingActions: result.pendingActions,
      cards: result.cards,
      quickReplies: result.quickReplies,
      conversationId: chatSession.id,
      steps: result.steps,
    });
  } catch {
    return respond({ ok: false, error: "The assistant is temporarily unavailable." }, { status: 503 });
  }
}

async function persistMessages(
  repo: ReturnType<typeof createRepository>,
  sessionId: string,
  userMessage: string,
  assistantReply: string,
  startIndex: number,
) {
  try {
    await repo.addChatMessage(sessionId, {
      id: `m-${startIndex}`, sender: "customer", senderLabel: "Customer",
      content: userMessage, time: new Date().toISOString().slice(11, 16),
    });
    await repo.addChatMessage(sessionId, {
      id: `m-${startIndex + 1}`, sender: "ai", senderLabel: "AI Assistant",
      content: assistantReply, time: new Date().toISOString().slice(11, 16),
    });
  } catch {
    // Transcript persistence is best-effort and must not break replies.
  }
}

export async function GET() {
  const configured = isGeminiConfigured();
  return Response.json({
    ok: configured,
    status: configured ? "ready" : "offline",
    provider: "google-gemini",
    model: getGeminiModel(),
    servicesCount: getServices().length,
    brandCount: getVehicleBrands().length,
  });
}
