import test, { before } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "../src/lib/db/client";
import { migrate } from "../src/lib/db/migrate";
import { seedIfEmpty } from "../src/lib/db/seed";
import { createRepository } from "../src/lib/db/repository";

const handle = createDb(":memory:");
const repo = createRepository(handle);
before(async () => {
  await migrate(handle);
  await seedIfEmpty(handle);
});

test("seedIfEmpty seeds branches, customers, appointments, inquiries and chat sessions", async () => {
  const branches = await repo.listBranches();
  assert.ok(branches.length >= 3);
  assert.ok(branches[0].availableServices.includes("oil-change"));

  const appointments = await repo.listAppointmentsDetailed();
  assert.ok(appointments.length >= 3);
  const seeded = appointments.find((a) => a.reference === "AC-2025-00042");
  assert.ok(seeded, "seeded appointment AC-2025-00042 should exist");
  assert.ok(seeded.customerName.length > 0);

  const inquiries = await repo.listInquiriesDetailed();
  assert.ok(inquiries.length >= 3);

  const chats = await repo.listChatSessions();
  assert.ok(chats.length >= 1);
  assert.ok(Array.isArray(chats[0].messages));
});

test("createAppointment persists customer, vehicle and appointment; reference is lookup-able", async () => {
  const appt = await repo.createAppointment({
    customer: { name: "Test User", email: "test.user@example.com", phone: "+63 900 000 0001" },
    vehicle: { make: "Toyota", model: "Vios", year: "2020", variant: "1.3 E", plate: "TST 001", mileage: "30,000 km" },
    serviceId: "oil-change",
    branchId: "branch-bgc",
    date: "2026-11-01",
    time: "10:00",
    notes: "unit test booking",
  });
  assert.match(appt.reference, /^AC-\d{4}-\d{5}$/);
  assert.equal(appt.status, "pending");

  const found = await repo.getAppointmentByReference(appt.reference);
  assert.ok(found, "appointment must be retrievable by reference");
  assert.equal(found.customerName, "Test User");
  assert.equal(found.vehicleInfo.includes("Vios"), true);
  assert.equal(found.branchName, "AutoCare BGC");
});

test("appointment references are unique and sequential within the year", async () => {
  const first = await repo.createAppointment({
    customer: { name: "Seq One", email: "seq1@example.com", phone: "+63 900 100 0001" },
    vehicleInfo: "Honda City 2021",
    serviceId: "brake-service",
    branchId: "branch-makati",
    date: "2026-11-02",
    time: "09:00",
  });
  const second = await repo.createAppointment({
    customer: { name: "Seq Two", email: "seq2@example.com", phone: "+63 900 100 0002" },
    vehicleInfo: "Honda City 2022",
    serviceId: "brake-service",
    branchId: "branch-makati",
    date: "2026-11-03",
    time: "09:00",
  });
  assert.notEqual(first.reference, second.reference);
  const year = new Date().getFullYear();
  const seq = (r: string) => Number.parseInt(r.split("-")[2], 10);
  assert.equal(first.reference.startsWith(`AC-${year}-`), true);
  assert.equal(seq(second.reference), seq(first.reference) + 1);
});

test("findOrCreateCustomer dedupes by email and phone", async () => {
  const a = await repo.findOrCreateCustomer({ name: "Dupe", email: "dupe@example.com", phone: "+63 900 200 0001" });
  const b = await repo.findOrCreateCustomer({ name: "Dupe Renamed", email: "dupe@example.com", phone: "+63 900 200 0001" });
  assert.equal(a.id, b.id);
});

test("createAppointment rejects unknown branch and service", async () => {
  await assert.rejects(() =>
    repo.createAppointment({
      customer: { name: "Bad", email: "bad@example.com", phone: "+63 900 300 0001" },
      vehicleInfo: "Car",
      serviceId: "not-a-service",
      branchId: "branch-bgc",
      date: "2026-11-01",
      time: "10:00",
    }),
  );
  await assert.rejects(() =>
    repo.createAppointment({
      customer: { name: "Bad", email: "bad@example.com", phone: "+63 900 300 0001" },
      vehicleInfo: "Car",
      serviceId: "oil-change",
      branchId: "not-a-branch",
      date: "2026-11-01",
      time: "10:00",
    }),
  );
});

test("listAppointmentsDetailed filters by status, branch and query", async () => {
  const byBranch = await repo.listAppointmentsDetailed({ branchId: "branch-bgc" });
  assert.ok(byBranch.length > 0);
  assert.ok(byBranch.every((a) => a.branchId === "branch-bgc"));

  const byQuery = await repo.listAppointmentsDetailed({ query: "marco" });
  assert.ok(byQuery.length > 0);

  const byStatus = await repo.listAppointmentsDetailed({ status: "pending" });
  assert.ok(byStatus.every((a) => a.status === "pending"));
});

test("inquiries: create, update status, filter", async () => {
  const inq = await repo.createInquiry({
    customerName: "New Contact",
    customerEmail: "contact@example.com",
    customerPhone: "+63 900 400 0001",
    subject: "Contact: service",
    category: "general",
    message: "Hello, testing.",
  });
  assert.match(inq.reference, /^QI-\d{4}-\d{5}$/);
  assert.equal(inq.status, "new");

  const updated = await repo.updateInquiryStatus(inq.id, "reviewed");
  assert.equal(updated?.status, "reviewed");

  const filtered = await repo.listInquiriesDetailed({ status: "reviewed" });
  assert.ok(filtered.some((i) => i.id === inq.id));
});

test("createQuote stores the request with a QT reference", async () => {
  const quote = await repo.createQuote({
    customer: { name: "Quote User", email: "quote@example.com", phone: "+63 900 500 0001" },
    serviceId: "battery-service",
    vehicle: { make: "Honda", model: "City", year: "2022", variant: "RS" },
    issue: "Battery warning light",
    province: "Metro Manila",
    city: "Taguig",
    barangay: "Ususan",
    address: "1 Test St",
    notes: "",
  });
  assert.match(quote.reference, /^QT-\d{4}-\d{5}$/);
  assert.equal(quote.status, "new");
});

test("chat sessions store and extend message transcripts", async () => {
  const session = await repo.createChatSession({
    channel: "public",
    customerName: "Chat User",
    customerPhone: "+63 900 600 0001",
    vehicle: "Toyota Vios 2020",
    conversationType: "ai",
    priority: "normal",
    messages: [{ id: "m-1", sender: "customer", senderLabel: "Customer", content: "Hi", time: "09:00" }],
    customerContext: { phone: "+63 900 600 0001" },
  });
  await repo.addChatMessage(session.id, { id: "m-2", sender: "ai", senderLabel: "AI", content: "Hello", time: "09:01" });
  const loaded = await repo.getChatSession(session.id);
  assert.equal(loaded?.messages.length, 2);
  assert.equal(loaded?.lastMessage, "Hello");
});

test("agent actions audit log round-trips", async () => {
  const action = await repo.logAgentAction({
    actorType: "ai",
    toolName: "search_services",
    input: { query: "oil" },
    output: { total: 2 },
    success: true,
  });
  const actions = await repo.listAgentActions();
  const stored = actions.find((a) => a.id === action.id);
  assert.ok(stored);
  assert.deepEqual(JSON.parse(stored.input), { query: "oil" });
});

test("pending actions lifecycle: create, list, resolve", async () => {
  const pending = await repo.createPendingAction({
    action: "confirm_booking",
    payload: { reference: "AC-2026-00001" },
    expiresInMinutes: 30,
  });
  assert.equal(pending.status, "pending");
  const listed = await repo.listPendingActions();
  assert.ok(listed.some((p) => p.id === pending.id));
  const resolved = await repo.resolvePendingAction(pending.id, "confirmed");
  assert.equal(resolved?.status, "confirmed");
});

test("getAvailability is deterministic per branch/date/time", async () => {
  const a = await repo.getAvailability("branch-bgc", "oil-change");
  const b = await repo.getAvailability("branch-bgc", "oil-change");
  assert.deepEqual(a, b);
  assert.ok(a.length > 0);
});

test("getSummary returns counts; resetData reseeds", async () => {
  const summary = await repo.getSummary();
  assert.ok(summary.branches >= 3);
  assert.ok(summary.appointments.total >= 3);
  assert.ok(summary.inquiries.total >= 3);

  await repo.createInquiry({
    customerName: "Temp",
    customerEmail: "temp@example.com",
    customerPhone: "",
    subject: "x",
    category: "general",
    message: "temp",
  });
  await repo.resetData();
  const after = await repo.getSummary();
  assert.equal(after.inquiries.total, 3); // back to seed count
  const gone = await repo.getInquiry("Temp");
  assert.equal(gone, undefined);
});
