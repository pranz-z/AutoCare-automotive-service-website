import { loadEnv } from "./env";

/**
 * Live smoke test: 10 real prompts against Gemini exercising the staff record
 * ops tools. Runs on an isolated :memory: database (auto-seeded) so it never
 * touches dev/production data. Requires GEMINI_API_KEY in .env.local.
 *
 *   npm run smoke:live
 *
 * Intentionally NOT part of CI — it hits a live model and is nondeterministic.
 * Prints expected vs actual tool calls and exits 1 if fewer than 7/10 match.
 */

loadEnv();
process.env.DATABASE_URL = ":memory:";

async function main() {
  const { getDb } = await import("../src/lib/db/client");
  const { createRepository } = await import("../src/lib/db/repository");
  const { runAgent } = await import("../src/lib/agent/runtime");
  const { createGeminiAgentModel } = await import("../src/lib/agent/model");
  const { STAFF_SYSTEM } = await import("../src/lib/agent/prompts");
  const { getGeminiApiKey, getGeminiModel } = await import("../src/lib/ai/gemini");

  if (!getGeminiApiKey()) {
    console.error("GEMINI_API_KEY is not configured — add it to .env.local.");
    process.exit(1);
  }

  const repo = createRepository(await getDb());
  await repo.createChatSession({
    id: "smoke-session", channel: "staff", customerName: "Smoke", conversationType: "ai", messages: [],
  });
  const ctx = { role: "staff" as const, actor: "smoke", sessionId: "smoke-session" };
  const model = createGeminiAgentModel();

  type Expect = { anyOf: string[] } | "ask";
  const scenarios: { prompt: string; expect: Expect; openRecord?: { type: "inquiry"; id: string; reference: string } }[] = [
    { prompt: "Set inquiry QI-2025-00156 to contacted.", expect: { anyOf: ["set_inquiry_status"] } },
    { prompt: "Raise the priority of inquiry inq-001 to urgent.", expect: { anyOf: ["set_inquiry_priority"] } },
    { prompt: "Approve the stored draft reply for inquiry inq-001.", expect: { anyOf: ["approve_draft_reply"] } },
    {
      prompt: "Convert inquiry inq-001 into an oil change appointment at branch-bgc on 2027-09-01 at 09:00.",
      expect: { anyOf: ["convert_inquiry_to_appointment"] },
    },
    { prompt: "Confirm appointment AC-2025-00043.", expect: { anyOf: ["confirm_appointment"] } },
    { prompt: "Cancel appointment AC-2025-00042, customer asked to postpone indefinitely.", expect: { anyOf: ["cancel_appointment"] } },
    { prompt: "Reschedule appointment AC-2025-00042 to 2027-09-05 at 14:00.", expect: { anyOf: ["reschedule_appointment"] } },
    { prompt: "Mark appointment AC-2025-00042 as completed.", expect: { anyOf: ["complete_appointment", "mark_in_service"] } },
    {
      prompt: "Resolve this inquiry.",
      expect: { anyOf: ["set_inquiry_status"] },
      openRecord: { type: "inquiry", id: "inq-002", reference: "QI-2025-00155" },
    },
    // Missing details: no service/branch/date given — the agent must ask, not mutate.
    { prompt: "Can you book Maria Santos in for a visit next week?", expect: "ask" },
  ];

  console.log(`smoke:live — ${scenarios.length} prompts against ${getGeminiModel()} (staff role, :memory: db)\n`);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let matches = 0;
  for (const [i, s] of scenarios.entries()) {
    const openRecord = s.openRecord;
    const system = openRecord
      ? `${STAFF_SYSTEM}\nRecord context: the staff member has ${openRecord.type} "${openRecord.reference}" open (internal id: ${openRecord.id}). "This ${openRecord.type}" refers to it.`
      : STAFF_SYSTEM;
    let actual: string[] = [];
    let pending: string[] = [];
    let reply = "";
    let errored = false;
    // Each scenario can make multiple model calls (tool results loop back), so
    // pace under the free-tier per-minute quota and retry once on 429.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await runAgent({
          model,
          ctx: { ...ctx, openRecord },
          message: s.prompt,
          system,
        });
        actual = result.toolCalls.map((c) => c.name);
        pending = result.pendingActions.map((p) => p.tool);
        reply = result.reply.slice(0, 110).replace(/\n/g, " ");
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errored = true;
        actual = [`ERROR: ${msg.slice(0, 160)}`];
        if (attempt === 0 && /quota|429|RESOURCE_EXHAUSTED/i.test(msg)) {
          const retryMs = Number(/retry in ([\d.]+)s/i.exec(msg)?.[1] ?? 60) * 1000;
          console.log(`    …rate limited, retrying in ${Math.ceil(retryMs / 1000)}s`);
          await sleep(retryMs + 1000);
          continue;
        }
        break;
      }
    }

    const expected = s.expect === "ask" ? "ask (no mutation)" : s.expect.anyOf.join(" | ");
    const ok =
      !errored &&
      (s.expect === "ask"
        ? !actual.some((n) => /^(set_|confirm_|cancel_|complete_|reschedule_|approve_|convert_|create_|mark_|revert_)/.test(n))
        : actual.some((n) => (s.expect as { anyOf: string[] }).anyOf.includes(n)));
    if (ok) matches++;
    console.log(`${ok ? "PASS" : "FAIL"} #${i + 1} "${s.prompt.slice(0, 60)}"`);
    console.log(`    expected: ${expected}`);
    console.log(`    actual:   ${actual.join(", ") || "(none)"}${pending.length ? `  staged: ${pending.join(", ")}` : ""}`);
    console.log(`    reply:    ${reply || "(none)"}\n`);
    await sleep(4000); // stay under the per-minute quota across scenarios
  }

  console.log(`${matches}/${scenarios.length} matched`);
  process.exit(matches >= 7 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
