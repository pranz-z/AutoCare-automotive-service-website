// Throwaway harness: run a real staff "daily brief" through runAgent with timing on.
import { readFileSync } from "node:fs";

async function main() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  process.env.AGENT_TIMING = "1";

  const { getDb } = await import("../src/lib/db/client");
  const { createRepository } = await import("../src/lib/db/repository");
  const { runAgent } = await import("../src/lib/agent/runtime");
  const { createGeminiAgentModel } = await import("../src/lib/agent/model");

  const repo = createRepository(await getDb());
  const session = await repo.createChatSession({
    id: `timing-${Date.now()}`,
    channel: "staff",
    customerName: "Timing",
    conversationType: "ai",
    messages: [],
  });

  const t0 = Date.now();
  const result = await runAgent({
    model: createGeminiAgentModel(),
    ctx: { role: "staff", actor: "staff", sessionId: session.id },
    message: "Give me today's daily brief.",
    system: "You are the AutoCare staff operations assistant. Use the tools to answer.",
  });
  console.log(`\nTOTAL: ${Date.now() - t0}ms  ok=${result.ok} steps=${result.steps}`);
  console.log("REPLY:", result.reply.slice(0, 400));
  process.exit(0);
}

main();
