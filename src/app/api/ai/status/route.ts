import { getGeminiModel, isGeminiConfigured } from "@/lib/ai/gemini";

export async function GET() {
  const model = getGeminiModel();

  if (!isGeminiConfigured()) {
    return Response.json({
      ok: false,
      provider: "google-gemini",
      model,
      status: "offline",
      message: "Gemini API key is not configured.",
    });
  }

  return Response.json({
    ok: true,
    provider: "google-gemini",
    model,
    status: "ready",
  });
}
