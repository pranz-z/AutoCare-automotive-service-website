import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured() {
  return getGeminiApiKey().trim().length > 0;
}

export async function generateGeminiReply(prompt: string) {
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
    },
  });

  const text = response.text?.trim();
  return text || "I’m ready to help with your maintenance or booking question.";
}
