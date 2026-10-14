import { GoogleGenAI, type HttpOptions } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/**
 * Default per-request ceiling for a single Gemini HTTP call. The agent runtime
 * may pass a tighter cap per call; this bounds every other caller.
 */
export const GEMINI_REQUEST_TIMEOUT_MS = 12_000;

/**
 * Shared HTTP options. The SDK defaults to 5 attempts with up to 60s backoff —
 * on a 429/overloaded endpoint that alone can burn ~4 minutes. Cap retries so
 * they cannot blow the agent's 20s budget or hang a route handler.
 */
export const GEMINI_HTTP_OPTIONS: HttpOptions = {
  timeout: GEMINI_REQUEST_TIMEOUT_MS,
  retryOptions: {
    attempts: 2,
    initialDelay: 0.5,
    maxDelay: 4,
    expBase: 2,
    jitter: 0.25,
  },
};

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured() {
  return getGeminiApiKey().trim().length > 0;
}

export async function generateGeminiReply(prompt: string, options?: { signal?: AbortSignal; timeoutMs?: number }) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.9,
      abortSignal: options?.signal,
      httpOptions: {
        ...GEMINI_HTTP_OPTIONS,
        // API rejects deadlines under 10s — clamp; AbortSignal enforces tighter caps.
        timeout: Math.max(options?.timeoutMs ?? GEMINI_REQUEST_TIMEOUT_MS, 10_000),
      },
    },
  });

  // Plain-text prompt path — no tools are declared, so parts are text-only.
  // Still iterate parts instead of the .text getter for consistent handling.
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  return text || "I’m ready to help with your maintenance or booking question.";
}
