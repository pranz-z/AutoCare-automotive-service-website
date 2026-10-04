import { NextRequest } from "next/server";
import { generateGeminiReply, getGeminiModel, isGeminiConfigured } from "@/lib/ai/gemini";
import { getServices, getVehicleBrands } from "@/lib/content";
import { answerPublicQuestion, MAX_CHAT_MESSAGE, MAX_CHAT_HISTORY } from "@/lib/ai/public-grounding";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 4096;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const requests = new Map<string, { count: number; expires: number }>();

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = requests.get(key);
  if (entry && entry.expires > now && entry.count >= MAX_REQUESTS) {
    return Response.json({ ok: false, reply: "Please wait a minute before asking again." }, { status: 429 });
  }
  requests.set(key, entry && entry.expires > now ? { ...entry, count: entry.count + 1 } : { count: 1, expires: now + WINDOW_MS });

  let body: unknown;
  try {
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) throw new Error("Request too large");
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error("Request too large");
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid or oversized request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  if (typeof value.message !== "string" || !value.message.trim() || value.message.length > MAX_CHAT_MESSAGE) {
    return Response.json({ ok: false, error: "Enter a message of up to 800 characters." }, { status: 400 });
  }
  if (value.history !== undefined && (!Array.isArray(value.history) || value.history.length > MAX_CHAT_HISTORY ||
    value.history.some((item) => !item || typeof item !== "object" || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || item.content.length > MAX_CHAT_MESSAGE))) {
    return Response.json({ ok: false, error: "Invalid conversation history." }, { status: 400 });
  }
  const result = await answerPublicQuestion(value.message.trim(), (value.history as { role: string; content: string }[] | undefined) ?? [], generateGeminiReply);
  return Response.json({ ok: true, ...result });
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
