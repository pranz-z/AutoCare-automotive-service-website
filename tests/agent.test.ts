process.env.DATABASE_URL = ":memory:";

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getDb } from "../src/lib/db/client";
import { createRepository } from "../src/lib/db/repository";
import { runAgent } from "../src/lib/agent/runtime";
import type { AgentContext, AgentModel, ModelTurn } from "../src/lib/agent/types";
import { containsPersonalData } from "../src/lib/ai/demo-privacy";
import { createSessionToken, ADMIN_COOKIE } from "../src/lib/admin-auth";
import { POST as confirmPOST } from "../src/app/api/agent/confirm/route";
import { POST as rejectPOST } from "../src/app/api/agent/reject/route";
import { POST as postContact } from "../src/app/api/contact/route";
import { POST as postQuote } from "../src/app/api/quote/route";
import { getTool } from "../src/lib/agent/tools";
import { classifyUrgency, suggestService } from "../src/lib/agent/triage";

/** A model that replays a scripted list of turns and records each request. */
class ScriptedModel implements AgentModel {
  calls: { contents: unknown[]; tools: { name: string }[] }[] = [];
  constructor(private script: ModelTurn[], private delayMs = 0) {}
  async generate(input: Parameters<AgentModel["generate"]>[0]): Promise<ModelTurn> {
    this.calls.push(input);
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    return this.script.shift() ?? { text: "fallback answer" };
  }
}

const staffCtx: AgentContext = { role: "staff", actor: "staff", sessionId: "test-session" };
const publicCtx: AgentContext = { role: "public", sessionId: "pub-session" };

let sessionsReady = false;
async function ensureSessions() {
  if (sessionsReady) return;
  const repo = createRepository(await getDb());
  for (const [id, channel] of [["test-session", "staff"], ["pub-session", "public"]] as const) {
    if (!(await repo.getChatSession(id))) {
      await repo.createChatSession({ id, channel, customerName: "Test", conversationType: "ai", messages: [] });
    }
  }
  sessionsReady = true;
}

function staffRequest(body: unknown) {
  return new Request("http://localhost/api/agent/confirm", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${ADMIN_COOKIE}=${createSessionToken("staff", undefined, 3600, "staff")}` },
    body: JSON.stringify(body),
  });
}

describe("agent runtime", () => {
  test("returns a direct answer when the model calls no tools", async () => {
    const model = new ScriptedModel([{ text: "Hello from the model" }]);
    const result = await runAgent({ model, ctx: publicCtx, message: "hi", system: "sys" });
    assert.equal(result.ok, true);
    assert.equal(result.reply, "Hello from the model");
    assert.equal(result.steps, 1);
    assert.equal(result.toolCalls.length, 0);
  });

  test("runs a multi-step loop: tool call, result fed back, then final answer", async () => {
    const model = new ScriptedModel([
      { toolCalls: [{ name: "search_services", args: { query: "change oil" } }] },
      { text: "Oil change services include..." },
    ]);
    await ensureSessions();
    const result = await runAgent({ model, ctx: publicCtx, message: "oil change?", system: "sys" });
    assert.equal(result.ok, true);
    assert.equal(result.steps, 2);
    assert.equal(result.toolCalls[0].name, "search_services");
    assert.equal(result.toolCalls[0].success, true);
    // Turn 2 must include the function response for the model.
    const secondCall = model.calls[1];
    const last = secondCall.contents.at(-1) as { parts: { functionResponse?: { name: string } }[] };
    assert.equal(last.parts[0].functionResponse?.name, "search_services");
    // Audit log was written.
    const repo = createRepository(await getDb());
    const actions = await repo.listAgentActions();
    assert.ok(actions.some((a) => a.toolName === "search_services" && a.sessionId === "pub-session" && a.success));
  });

  test("enforces the step limit", async () => {
    // Distinct args each turn — identical repeats are stopped earlier by
    // repeat detection, so unique calls are needed to reach the step cap.
    const model = new ScriptedModel(
      Array.from({ length: 10 }, (_, i) => ({ toolCalls: [{ name: "search_faqs", args: { query: `x${i}` } }] })),
    );
    const result = await runAgent({ model, ctx: publicCtx, message: "loop", system: "sys" });
    assert.equal(result.ok, false);
    assert.equal(result.truncated, true);
    assert.equal(result.steps, 6);
    assert.equal(model.calls.length, 6);
    assert.match(result.reply, /more steps|what I found/i);
  });

  test("enforces the wall-clock timeout", async () => {
    const model = new ScriptedModel(
      Array.from({ length: 6 }, () => ({ toolCalls: [{ name: "search_faqs", args: { query: "x" } }] })),
      60,
    );
    const result = await runAgent({
      model, ctx: publicCtx, message: "slow", system: "sys", timeoutMs: 10,
    });
    assert.equal(result.ok, false);
    assert.equal(result.truncated, true);
    assert.ok(model.calls.length < 6);
    assert.match(result.reply, /too long|time limit/i);
  });

  test("aborts an in-flight model call that never resolves", async () => {
    // A model that hangs forever and ignores its signal — the runtime's
    // deadline race must still stop it.
    const hung: AgentModel = {
      generate: () => new Promise<ModelTurn>(() => {}),
    };
    const start = Date.now();
    const result = await runAgent({ model: hung, ctx: publicCtx, message: "hang", system: "sys", timeoutMs: 200 });
    const elapsed = Date.now() - start;
    assert.equal(result.ok, false);
    assert.equal(result.truncated, true);
    assert.match(result.reply, /too long|time limit/i);
    assert.ok(elapsed < 2000, `hung call escaped the deadline: ${elapsed}ms`);
  });

  test("signal-respecting models are aborted at the deadline too", async () => {
    let sawAbort = false;
    const model: AgentModel = {
      generate: (input) =>
        new Promise<ModelTurn>((_, reject) => {
          input.signal?.addEventListener("abort", () => {
            sawAbort = true;
            reject(new Error("aborted"));
          }, { once: true });
        }),
    };
    const result = await runAgent({ model, ctx: publicCtx, message: "hang", system: "sys", timeoutMs: 150 });
    assert.ok(sawAbort, "model should receive a firing AbortSignal");
    assert.equal(result.truncated, true);
  });

  test("stops the loop on a repeated identical tool call", async () => {
    const model = new ScriptedModel([
      { toolCalls: [{ name: "search_faqs", args: { query: "brakes" } }] },
      { toolCalls: [{ name: "search_faqs", args: { query: "brakes" } }] },
      { text: "should never reach this" },
    ]);
    const result = await runAgent({ model, ctx: publicCtx, message: "loop", system: "sys" });
    assert.equal(result.truncated, true);
    assert.equal(model.calls.length, 2, "loop must stop when the model repeats itself");
    assert.equal(result.toolCalls.length, 1, "the duplicate call must not execute again");
    assert.match(result.reply, /already ran|found so far/i);
  });

  test("passes a signal and per-call timeout to the model", async () => {
    let captured: { signal?: AbortSignal; timeoutMs?: number } = {};
    const model: AgentModel = {
      async generate(input) {
        captured = { signal: input.signal, timeoutMs: input.timeoutMs };
        return { text: "done" };
      },
    };
    await runAgent({ model, ctx: publicCtx, message: "hi", system: "sys" });
    assert.ok(captured.signal instanceof AbortSignal);
    assert.ok(typeof captured.timeoutMs === "number" && captured.timeoutMs <= 12_000);
  });

  test("rejects invalid tool arguments and reports the error back to the model", async () => {
    const model = new ScriptedModel([
      { toolCalls: [{ name: "get_booking_status", args: {} }] },
      { text: "I could not find that booking." },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "lookup", system: "sys" });
    assert.equal(result.toolCalls[0].success, false);
    assert.match(result.toolCalls[0].error ?? "", /reference/);
    assert.equal(result.ok, true);
  });

  test("rejects unknown tools", async () => {
    const model = new ScriptedModel([
      { toolCalls: [{ name: "drop_tables", args: {} }] },
      { text: "done" },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "x", system: "sys" });
    assert.equal(result.toolCalls[0].success, false);
    assert.match(result.toolCalls[0].error ?? "", /Unknown tool/);
  });

  test("forged role: a public caller cannot invoke staff/admin tools", async () => {
    const model = new ScriptedModel([
      { toolCalls: [
        { name: "search_customers", args: {} },
        { name: "reset_demo_data", args: {} },
      ] },
      { text: "sorry" },
    ]);
    const result = await runAgent({ model, ctx: publicCtx, message: "x", system: "sys" });
    assert.equal(result.toolCalls.length, 2);
    assert.ok(result.toolCalls.every((t) => !t.success && /not available for this role/.test(t.error ?? "")));
    // And the registry never exposed them as callable declarations.
    const declared = model.calls[0].tools.map((t) => t.name);
    assert.ok(!declared.includes("search_customers"));
    assert.ok(!declared.includes("reset_demo_data"));
  });

  test("admin tools are declared for admin sessions", async () => {
    const model = new ScriptedModel([{ text: "ok" }]);
    await runAgent({ model, ctx: { role: "admin", actor: "admin" }, message: "x", system: "sys" });
    const declared = model.calls[0].tools.map((t) => t.name);
    assert.ok(declared.includes("reset_demo_data"));
    assert.ok(declared.includes("list_agent_actions"));
  });

  test("write-tier tools stage a pending action instead of mutating data", async () => {
    await ensureSessions();
    const repo = createRepository(await getDb());
    const before = await repo.getAppointmentByReference("AC-2025-00043");
    const model = new ScriptedModel([
      { toolCalls: [{ name: "cancel_appointment", args: { id: "AC-2025-00043" } }] },
      { text: "Staged for confirmation." },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "cancel AC-2025-00043", system: "sys" });
    assert.equal(result.pendingActions.length, 1);
    assert.match(result.pendingActions[0].summary, /AC-2025-00043/);
    // No mutation yet.
    const after = await repo.getAppointmentByReference("AC-2025-00043");
    assert.equal(after?.status, before?.status);
    const pending = await repo.getPendingAction(result.pendingActions[0].id);
    assert.equal(pending?.status, "pending");
  });
});

describe("booking tools", () => {
  const pubCtx: AgentContext = { role: "public", sessionId: "pub-session" };

  test("get_booking_status requires contact verification", async () => {
    const tool = getTool("get_booking_status")!;
    // Correct email verifies.
    const good = await tool.execute(pubCtx, {
      reference: "AC-2025-00042",
      contact: "marco.demo@autocare.test",
    });
    assert.equal(good.success, true);
    assert.equal((good.data as { status: string }).status, "confirmed");

    // Phone suffix match also verifies.
    const byPhone = await tool.execute(pubCtx, { reference: "AC-2025-00042", contact: "345 6701" });
    assert.equal(byPhone.success, true);

    // Wrong contact cannot read the booking.
    const wrong = await tool.execute(pubCtx, { reference: "AC-2025-00042", contact: "nobody@example.com" });
    assert.equal(wrong.success, false);
  });

  test("find_service returns a config-grounded match", async () => {
    const tool = getTool("find_service")!;
    const result = await tool.execute(pubCtx, { query: "squeaky brakes" });
    assert.equal(result.success, true);
    const match = (result.data as { match: { id: string } }).match;
    assert.equal(match.id, "brake-service");

    const none = await tool.execute(pubCtx, { query: "zxqwv phonics" });
    assert.equal((none.data as { match: unknown }).match, null);
  });

  test("check_availability reflects real bookings and date ranges", async () => {
    const tool = getTool("check_availability")!;
    const repo = createRepository(await getDb());

    // Fill a specific slot at branch-bgc to capacity (2).
    for (const n of [1, 2]) {
      await repo.createAppointment({
        customer: { name: `Test ${n}`, email: `t${n}@example.com`, phone: "" },
        vehicleInfo: "Test Car", serviceId: "oil-change",
        branchId: "branch-bgc", date: "2027-03-09", time: "09:00",
      });
    }
    const result = await tool.execute(pubCtx, {
      branchId: "branch-bgc", dateFrom: "2027-03-09", dateTo: "2027-03-09",
    });
    const slots = (result.data as { branches: { slots: { time: string; available: boolean }[] }[] }).branches[0].slots;
    const booked = slots.find((sl) => sl.time === "09:00");
    assert.equal(booked?.available, false);
    // Untouched slot on the same day stays available.
    assert.equal(slots.find((sl) => sl.time === "10:00")?.available, true);
  });

  test("availability is deterministic across calls", async () => {
    const tool = getTool("check_availability")!;
    const a = await tool.execute(pubCtx, { branchId: "branch-bgc" });
    const b = await tool.execute(pubCtx, { branchId: "branch-bgc" });
    assert.deepEqual(a.data, b.data);
  });

  async function stageAndConfirm(name: string, args: Record<string, unknown>) {
    await ensureSessions();
    const model = new ScriptedModel([
      { toolCalls: [{ name, args }] },
      { text: "staged" },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "x", system: "sys" });
    const repo = createRepository(await getDb());
    const pending = await repo.getPendingAction(result.pendingActions[0].id);
    const token = (JSON.parse(pending!.payload) as { token: string }).token;
    const res = await confirmPOST(staffRequest({ id: pending!.id, token }));
    return { res, pending: pending! };
  }

  test("create_booking stages then creates a real appointment", async () => {
    const { res } = await stageAndConfirm("create_booking", {
      customerName: "Ana Reyes", customerEmail: "ana@example.com", customerPhone: "09171234567",
      vehicleInfo: "Toyota Vios 2022", serviceId: "oil-change",
      branchId: "branch-bgc", date: "2027-03-10", time: "11:00",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.result.reference, /^AC-\d{4}-\d{5}$/);
    const repo = createRepository(await getDb());
    const appt = await repo.getAppointmentByReference(body.result.reference);
    assert.equal(appt?.customerName, "Ana Reyes");
  });

  test("reschedule_appointment moves the appointment after confirmation", async () => {
    const { res } = await stageAndConfirm("reschedule_appointment", {
      id: "AC-2025-00043", date: "2027-03-11", time: "14:00",
    });
    assert.equal(res.status, 200);
    const repo = createRepository(await getDb());
    const appt = await repo.getAppointmentByReference("AC-2025-00043");
    assert.equal(appt?.date, "2027-03-11");
    assert.equal(appt?.time, "14:00");
  });

  test("reschedule_appointment rejects a full slot", async () => {
    const tool = getTool("reschedule_appointment")!;
    const result = await tool.execute(staffCtx, {
      id: "AC-2025-00042", date: "2027-03-09", time: "09:00",
    });
    // branch-bgc 2027-03-09 09:00 was filled to capacity by the earlier test.
    assert.equal(result.success, false);
    assert.match(result.error ?? "", /fully booked/);
  });

  test("cancel_appointment cancels after confirmation", async () => {
    const { res } = await stageAndConfirm("cancel_appointment", { id: "AC-2025-00043" });
    assert.equal(res.status, 200);
    const repo = createRepository(await getDb());
    const appt = await repo.getAppointmentByReference("AC-2025-00043");
    assert.equal(appt?.status, "cancelled");
  });

  test("create_quote_request stages then creates a quote", async () => {
    const { res } = await stageAndConfirm("create_quote_request", {
      customerName: "Jose Cruz", customerEmail: "jose@example.com",
      serviceId: "brake-service", vehicleMake: "Honda", vehicleModel: "City", vehicleYear: "2019",
      issue: "Brakes feel soft",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.result.reference, /^QT-\d{4}-\d{5}$/);
  });
});

describe("POST /api/agent/confirm", () => {
  async function stageUpdate() {
    await ensureSessions();
    const repo = createRepository(await getDb());
    // Fresh inquiries so this test's mutations can't interfere with seed assertions.
    const a = await repo.createInquiry({ customerName: "Stage A", customerEmail: "a@example.com", subject: "one", category: "general", message: "m1" });
    const b = await repo.createInquiry({ customerName: "Stage B", customerEmail: "b@example.com", subject: "two", category: "general", message: "m2" });
    const model = new ScriptedModel([
      { toolCalls: [{ name: "set_inquiry_status", args: { ids: [a.id, b.id], status: "resolved" } }] },
      { text: "staged" },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "x", system: "sys" });
    const pending = await repo.getPendingAction(result.pendingActions[0].id);
    const token = (JSON.parse(pending!.payload) as { token: string }).token;
    return { id: result.pendingActions[0].id, token, refs: [a.reference, b.reference] };
  }

  test("rejects unauthenticated requests", async () => {
    const res = await confirmPOST(new Request("http://localhost/api/agent/confirm", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "x", token: "y" }),
    }));
    assert.equal(res.status, 401);
  });

  test("rejects forged session cookies", async () => {
    const res = await confirmPOST(new Request("http://localhost/api/agent/confirm", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `${ADMIN_COOKIE}=admin` },
      body: JSON.stringify({ id: "x", token: "y" }),
    }));
    assert.equal(res.status, 401);
  });

  test("executes a valid action exactly once", async () => {
    const { id, token, refs } = await stageUpdate();
    const repo = createRepository(await getDb());

    const res = await confirmPOST(staffRequest({ id, token }));
    assert.equal(res.status, 200);
    for (const ref of refs) {
      assert.equal((await repo.getInquiry(ref))?.status, "resolved");
    }

    // Reuse of the consumed token must fail.
    const replay = await confirmPOST(staffRequest({ id, token }));
    assert.equal(replay.status, 409);
  });

  test("rejects a wrong token", async () => {
    const { id } = await stageUpdate();
    const res = await confirmPOST(staffRequest({ id, token: "deadbeef" }));
    assert.equal(res.status, 403);
  });

  test("rejects expired actions", async () => {
    const repo = createRepository(await getDb());
    const expired = await repo.createPendingAction({
      sessionId: "test-session",
      action: "set_inquiry_status",
      payload: { args: { id: "inq-003", status: "resolved" }, token: "tok", summary: "x" },
      expiresInMinutes: -1,
    });
    const res = await confirmPOST(staffRequest({ id: expired.id, token: "tok" }));
    assert.equal(res.status, 410);
    const inquiry = await repo.getInquiry("QI-2025-00154");
    assert.equal(inquiry?.status, "responded");
  });

  test("writes an audit record for the confirmed action", async () => {
    const { id, token } = await stageUpdate();
    await confirmPOST(staffRequest({ id, token }));
    const repo = createRepository(await getDb());
    const actions = await repo.listAgentActions();
    assert.ok(actions.some((a) => a.toolName === "set_inquiry_status#confirm" && a.sessionId === "test-session" && a.success));
  });
});

describe("admin agent tools", () => {
  test("triage_inquiry returns urgency, suggested service, and draft reply", async () => {
    const tool = getTool("triage_inquiry")!;
    const result = await tool.execute(staffCtx, { id: "inq-002" });
    assert.equal(result.success, true);
    const data = result.data as { urgency: string; suggestedServiceId: string | null; draftReply: string };
    assert.ok(["urgent", "high", "medium", "low"].includes(data.urgency));
    assert.ok(data.draftReply.length > 20);
    // aircon complaint → air-conditioning service
    assert.equal(data.suggestedServiceId, "air-conditioning");
  });

  test("draft_reply produces a draft for an inquiry and a quote", async () => {
    const tool = getTool("draft_reply")!;
    const forInquiry = await tool.execute(staffCtx, { id: "QI-2025-00156" });
    assert.equal(forInquiry.success, true);
    assert.match((forInquiry.data as { draft: string }).draft, /AutoCare Team/);

    const missing = await tool.execute(staffCtx, { id: "nope-999" });
    assert.equal(missing.success, false);
  });

  test("summarize_conversation summarizes a stored session", async () => {
    await ensureSessions();
    const tool = getTool("summarize_conversation")!;
    const result = await tool.execute(staffCtx, { sessionId: "pub-session" });
    assert.equal(result.success, true);
    const data = result.data as { channel: string; messageCount: number };
    assert.equal(data.channel, "public");
  });

  test("daily_brief returns operations counts", async () => {
    const tool = getTool("daily_brief")!;
    const result = await tool.execute(staffCtx, {});
    assert.equal(result.success, true);
    const data = result.data as { openInquiries: number; newQuotes: number; pendingApprovals: number };
    assert.ok(data.openInquiries >= 0 && data.newQuotes >= 0 && data.pendingApprovals >= 0);
  });

  test("reschedule_appointment stages a pending action that executes on approval", async () => {
    await ensureSessions();
    const model = new ScriptedModel([
      { toolCalls: [{ name: "reschedule_appointment", args: { id: "AC-2025-00042", date: "2027-04-14", time: "15:00", reason: "customer request" } }] },
      { text: "proposed" },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "x", system: "sys" });
    assert.equal(result.pendingActions.length, 1);
    assert.match(result.pendingActions[0].summary, /AC-2025-00042/);

    const repo = createRepository(await getDb());
    const pending = await repo.getPendingAction(result.pendingActions[0].id);
    const token = (JSON.parse(pending!.payload) as { token: string }).token;
    const res = await confirmPOST(staffRequest({ id: pending!.id, token }));
    assert.equal(res.status, 200);
    const appt = await repo.getAppointmentByReference("AC-2025-00042");
    assert.equal(appt?.date, "2027-04-14");
    assert.equal(appt?.time, "15:00");
  });

  test("admin-only: public callers cannot reach the admin tools", async () => {
    for (const name of ["triage_inquiry", "draft_reply", "summarize_conversation", "daily_brief", "reschedule_appointment"]) {
      const tool = getTool(name)!;
      assert.ok(!tool.roles.includes("public"), `${name} must not be public`);
    }
  });
});

describe("auto-triage hook", () => {
  test("classifyUrgency and suggestService are deterministic", () => {
    assert.equal(classifyUrgency("My car won't start and there's smoke").urgency, "urgent");
    assert.equal(classifyUrgency("How much is an oil change?").urgency, "low");
    assert.equal(suggestService("my brakes are squeaking")?.id, "brake-service");
  });

  test("POST /api/contact stores triage on the inquiry", async () => {
    const res = await postContact(new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Tina Urgency",
        email: "tina@example.com",
        topic: "service",
        message: "My brakes are failing and the pedal goes to the floor — I can't stop safely!",
      }),
    }));
    assert.equal(res.status, 200);
    const { reference } = await res.json();
    const repo = createRepository(await getDb());
    const inquiry = await repo.getInquiry(reference);
    assert.ok(inquiry?.triage, "triage must be stored on the record");
    const triage = JSON.parse(inquiry!.triage!) as { urgency: string; suggestedServiceId: string };
    assert.equal(triage.urgency, "urgent");
    assert.equal(triage.suggestedServiceId, "brake-service");
    assert.equal(inquiry?.priority, "urgent");
  });

  test("POST /api/quote stores triage on the quote", async () => {
    const res = await postQuote(new Request("http://localhost/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        service: "brake-service", make: "honda", model: "City", year: "2022",
        issue: "Squeaking when braking", name: "Maria Test", phone: "+63 917 000 0002",
        email: "maria.test@example.com", province: "metro-manila", city: "Makati",
        address: "2 Test Ave",
      }),
    }));
    assert.equal(res.status, 200);
    const { reference } = await res.json();
    const repo = createRepository(await getDb());
    const quote = (await repo.listQuotes()).find((q) => q.reference === reference);
    assert.ok(quote?.triage, "triage must be stored on the quote");
    const triage = JSON.parse(quote!.triage!) as { urgency: string; draftReply: string };
    assert.ok(triage.urgency && triage.draftReply.length > 20);
  });
});

describe("POST /api/agent/reject", () => {
  test("rejects a pending action so it cannot be confirmed", async () => {
    await ensureSessions();
    const repo = createRepository(await getDb());
    // Fresh booking so earlier tests' mutations can't interfere.
    const appt = await repo.createAppointment({
      customer: { name: "Reject Me", email: "reject@example.com", phone: "" },
      vehicleInfo: "Test Car", serviceId: "oil-change",
      branchId: "branch-bgc", date: "2027-05-05", time: "10:00",
    });
    const model = new ScriptedModel([
      { toolCalls: [{ name: "cancel_appointment", args: { id: appt.reference } }] },
      { text: "staged" },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "x", system: "sys" });
    const pending = await repo.getPendingAction(result.pendingActions[0].id);
    const token = (JSON.parse(pending!.payload) as { token: string }).token;

    const rej = await rejectPOST(staffRequest({ id: pending!.id }));
    assert.equal(rej.status, 200);
    assert.equal((await repo.getPendingAction(pending!.id))?.status, "rejected");

    // Confirm after reject must fail — the action stays unexecuted.
    const conf = await confirmPOST(staffRequest({ id: pending!.id, token }));
    assert.equal(conf.status, 409);
    const after = await repo.getAppointmentByReference(appt.reference);
    assert.notEqual(after?.status, "cancelled");
  });

  test("rejects unauthenticated requests", async () => {
    const res = await rejectPOST(new Request("http://localhost/api/agent/reject", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "x" }),
    }));
    assert.equal(res.status, 401);
  });
});

describe("PII filter regression", () => {
  test("does not flag ordinary words followed by a year", () => {
    assert.equal(containsPersonalData("I need service for 2024"), false);
    assert.equal(containsPersonalData("the 2024 model year"), false);
    assert.equal(containsPersonalData("any 2026 updates?"), false);
  });

  test("still flags real plate numbers", () => {
    assert.equal(containsPersonalData("my plate is ABC 123"), true);
    assert.equal(containsPersonalData("NGA-1234"), true);
  });
});
