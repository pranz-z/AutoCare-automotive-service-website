export async function GET() {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({ ok: false, model, status: "offline", message: "Ollama is not responding." });
    }

    const payload = await response.json();
    const models: string[] = Array.isArray(payload?.models)
      ? (payload.models as Array<{ name?: string } | undefined>).map((item) => item?.name ?? "")
      : [];
    const isAvailable = models.some((item: string) => item === model || item.startsWith(`${model}:`));

    return Response.json({
      ok: true,
      model,
      status: isAvailable ? "ready" : "model-missing",
      availableModels: models,
    });
  } catch (error) {
    console.error("Ollama status check failed", error);
    return Response.json({ ok: false, model, status: "offline", message: "Ollama is not available." });
  }
}
