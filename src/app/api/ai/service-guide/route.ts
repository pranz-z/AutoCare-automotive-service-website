import { NextRequest } from "next/server";
import { getServices } from "@/lib/content";
import { generateGeminiReply } from "@/lib/ai/gemini";
import {
  createServiceGuideResponse,
  GuideInputError,
  takeGuideRateLimit,
  validateGuideInput,
} from "@/lib/ai/service-guide";

export const runtime = "nodejs";

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  if (!takeGuideRateLimit(getClientKey(request))) {
    return Response.json({ error: "Too many service guide requests. Please try again shortly." }, { status: 429 });
  }

  let input;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 8192) throw new GuideInputError("Request is too large.");
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 8192) throw new GuideInputError("Request is too large.");
    input = validateGuideInput(JSON.parse(rawBody));
  } catch (error) {
    return Response.json({ error: error instanceof GuideInputError ? error.message : "Invalid request." }, { status: 400 });
  }

  try {
    const result = await createServiceGuideResponse(input, getServices(), generateGeminiReply);
    return Response.json(result);
  } catch {
    return Response.json({ error: "The service guide is temporarily unavailable. You can still submit your quote request." }, { status: 503 });
  }
}
