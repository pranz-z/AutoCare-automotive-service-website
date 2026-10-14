import { NextRequest } from "next/server";
import { getServices } from "@/lib/content";
import { generateGeminiReply } from "@/lib/ai/gemini";
import { attachCallerCookie, callerKey, takeRateLimit } from "@/lib/rate-limit";
import {
  createServiceGuideResponse,
  GuideInputError,
  validateGuideInput,
} from "@/lib/ai/service-guide";

export const runtime = "nodejs";
const GUIDE_MAX_REQUESTS = 10;
const GUIDE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const { key, setAnonCookie } = callerKey(request);
  if (!takeRateLimit(key, GUIDE_MAX_REQUESTS, GUIDE_WINDOW_MS)) {
    return attachCallerCookie(
      Response.json({ error: "Too many service guide requests. Please try again shortly; you can still submit your quote without guidance." }, { status: 429 }),
      setAnonCookie,
    );
  }

  const respond = (body: unknown, init?: ResponseInit) =>
    attachCallerCookie(Response.json(body, init), setAnonCookie);

  let input;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 8192) throw new GuideInputError("Request is too large.");
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 8192) throw new GuideInputError("Request is too large.");
    input = validateGuideInput(JSON.parse(rawBody));
  } catch (error) {
    return respond({ error: error instanceof GuideInputError ? error.message : "Invalid request." }, { status: 400 });
  }

  try {
    const result = await createServiceGuideResponse(input, getServices(), generateGeminiReply);
    return respond(result);
  } catch {
    return respond({ error: "The service guide is temporarily unavailable. You can still submit your quote request." }, { status: 503 });
  }
}
