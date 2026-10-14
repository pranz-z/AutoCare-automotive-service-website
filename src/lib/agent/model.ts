import { GoogleGenAI, type Content } from "@google/genai";
import { GEMINI_HTTP_OPTIONS, GEMINI_REQUEST_TIMEOUT_MS, getGeminiApiKey, getGeminiModel } from "@/lib/ai/gemini";
import type { AgentModel, ModelToolCall } from "./types";

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API key is not configured.");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Gemini-native function-calling adapter. Keeps the contents in Gemini's
 * Content/Part shape so the runtime can append function calls and responses
 * verbatim across turns.
 *
 * Never reads response.text: the getter warns ("non-text parts functionCall")
 * and concatenates when function calls are present. Parts are iterated
 * directly — text parts (minus thoughts) form the answer, functionCall parts
 * become tool calls, everything else (thoughtSignature…) is preserved in
 * extraParts so it can be echoed back on the next turn.
 */
export function createGeminiAgentModel(): AgentModel {
  return {
    async generate({ system, contents, tools, signal, timeoutMs }) {
      const response = await getClient().models.generateContent({
        model: getGeminiModel(),
        contents: contents as unknown as Content[],
        config: {
          systemInstruction: system,
          temperature: 0.3,
          topP: 0.9,
          tools: tools.length
            ? [{ functionDeclarations: tools.map((t) => ({ ...t })) }]
            : undefined,
          abortSignal: signal,
          httpOptions: {
            ...GEMINI_HTTP_OPTIONS,
            // The API rejects deadlines below 10s — clamp the server-side
            // timeout; the caller's AbortSignal still enforces the real cap.
            timeout: Math.max(timeoutMs ?? GEMINI_REQUEST_TIMEOUT_MS, 10_000),
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const textParts: string[] = [];
      const toolCalls: ModelToolCall[] = [];
      const extraParts: Record<string, unknown>[] = [];
      for (const part of parts) {
        const fcName = part.functionCall?.name;
        if (fcName) {
          // Gemini 3.x rejects echoed functionCall parts missing their
          // thoughtSignature — carry all sibling fields back verbatim.
          const { functionCall, ...partExtras } = part;
          delete (partExtras as Record<string, unknown>).text;
          toolCalls.push({
            name: fcName,
            args: (functionCall?.args ?? {}) as Record<string, unknown>,
            partExtras: Object.keys(partExtras).length ? partExtras : undefined,
          });
        } else if (typeof part.text === "string" && !part.thought) {
          textParts.push(part.text);
        } else {
          extraParts.push(part as Record<string, unknown>);
        }
      }
      const text = textParts.join("").trim();
      return {
        text: text || undefined,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        extraParts: extraParts.length ? extraParts : undefined,
      };
    },
  };
}
