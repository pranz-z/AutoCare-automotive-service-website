process.env.DATABASE_URL = ":memory:";

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getDb } from "../src/lib/db/client";
import { createRepository } from "../src/lib/db/repository";
import type { SessionPayload, AdminRole } from "../src/lib/admin-auth";
import {
  appointmentActionsFor,
  approveInquiryDraft,
  convertInquiryToAppointment,
  inquiryActionsFor,
  mutateAppointment,
  mutateInquiryPriority,
  mutateInquiryStatus,
  pendingActionsForRecord,
} from "../src/lib/admin/record-mutations";
import { getOpenInquiry } from "../src/app/admin/inquiries/page";
import { getOpenAppointment } from "../src/app/admin/appointments/page";
import { getOpenCustomer } from "../src/app/admin/customers/page";
import { getOpenChat } from "../src/app/admin/chats/page";
import { RecordDrawer, RecordNotice } from "../src/components/admin/RecordDrawer";
import {
  AppointmentPanelActions,
  PendingDecision,
} from "../src/components/admin/RecordActions";

const staff: SessionPayload = { role: "staff", sub: "demo-staff", iat: 0, exp: 0 };
const outsider: SessionPayload = { role: "viewer" as AdminRole, sub: "nobody", iat: 0, exp: 0 };

describe("open-param record resolution", () => {
  test("inquiry resolves by internal id and by display reference", async () => {
    const byId = await getOpenInquiry("inq-001");
    assert.equal(byId.inquiry?.reference.startsWith("QI-"), true);
    assert.equal(byId.missing, false);
    const byRef = await getOpenInquiry(byId.inquiry!.reference);
    assert.equal(byRef.inquiry?.id, "inq-001");
  });

  test("appointment resolves by internal id and reference", async () => {
    const byId = await getOpenAppointment("appt-001");
    assert.equal(byId.appointment?.reference, "AC-2025-00042");
    const byRef = await getOpenAppointment("AC-2025-00042");
    assert.equal(byRef.appointment?.id, "appt-001");
  });

  test("customer and chat resolve by internal id", async () => {
    assert.ok((await getOpenCustomer("cust-001")).customer?.name);
    assert.equal((await getOpenChat("chat-001")).chat?.id, "chat-001");
  });

  test("unknown id reports missing (notice, not a 404) and absent param is neutral", async () => {
    for (const loader of [getOpenInquiry, getOpenAppointment, getOpenCustomer, getOpenChat]) {
      const res = await loader("does-not-exist");
      assert.equal(res.missing, true);
      const blank = await loader(undefined);
      assert.equal(blank.missing, false);
    }
  });
});

describe("drawer rendering", () => {
  test("drawer renders the record title and a close link dropping ?open=", async () => {
    const { inquiry } = await getOpenInquiry("inq-001");
    const html = renderToStaticMarkup(
      createElement(RecordDrawer, {
        title: `Inquiry ${inquiry!.reference}`,
        subtitle: inquiry!.customerName,
        closeHref: "/admin/inquiries",
      }, createElement("p", null, "body")),
    );
    assert.ok(html.includes(inquiry!.reference), html);
    assert.ok(html.includes('href="/admin/inquiries"'), "close link drops the param");
  });

  test("notice renders the not-found message", () => {
    const html = renderToStaticMarkup(
      createElement(RecordNotice, { message: "Record not found.", closeHref: "/admin/inquiries" }),
    );
    assert.ok(html.includes("Record not found"), html);
  });

  test("appointment action buttons reflect the status's allowed transitions", () => {
    const html = renderToStaticMarkup(
      createElement(AppointmentPanelActions, { id: "appt-001", allowed: appointmentActionsFor("confirmed") }),
    );
    assert.ok(html.includes("Mark in service"), html);
    assert.ok(html.includes("Cancel"), html);
    assert.ok(!/>\s*Complete\s*</.test(html), "confirmed cannot complete yet");
    const terminal = renderToStaticMarkup(
      createElement(AppointmentPanelActions, { id: "appt-001", allowed: appointmentActionsFor("cancelled") }),
    );
    assert.ok(terminal.includes("No actions available"), terminal);
  });
});

describe("record mutations", () => {
  test("status change writes the record and an audit row with the staff actor", async () => {
    const repo = createRepository(getDb());
    const appt = await repo.createAppointment({
      customer: { name: "Test Person", email: "t@t.dev", phone: "0917" },
      vehicleInfo: "Test car",
      serviceId: "oil-change",
      branchId: "branch-bgc",
      date: "2025-10-20",
      time: "09:00",
    });
    const res = await mutateAppointment(staff, appt.id, "confirm");
    assert.equal(res.ok, true);
    const updated = (await repo.listAppointmentsDetailed()).find((a) => a.id === appt.id);
    assert.equal(updated?.status, "confirmed");
    const actions = await repo.listAgentActions();
    const last = actions[0];
    assert.equal(last.toolName, "panel:appointment.confirm");
    assert.equal(last.actorType, "staff:demo-staff");
  });

  test("invalid transition is refused and nothing changes", async () => {
    const res = await mutateAppointment(staff, "appt-001", "complete"); // confirmed → complete not allowed
    assert.equal(res.ok, false);
    const row = (await createRepository(getDb()).listAppointmentsDetailed()).find((a) => a.id === "appt-001");
    assert.equal(row?.status, "confirmed");
  });

  test("reschedule moves date/time and lands on rescheduled", async () => {
    const repo = createRepository(getDb());
    const res = await mutateAppointment(staff, "appt-001", "reschedule", { date: "2025-11-01", time: "14:00" });
    assert.equal(res.ok, true);
    const row = (await repo.listAppointmentsDetailed()).find((a) => a.id === "appt-001");
    assert.equal(row?.status, "rescheduled");
    assert.equal(row?.date, "2025-11-01");
    assert.equal(row?.time, "14:00");
  });

  test("a role without permission cannot run the action", async () => {
    const res = await mutateAppointment(outsider, "appt-001", "cancel");
    assert.equal(res.ok, false);
    assert.match(res.ok ? "" : res.error, /role cannot/i);
    const res2 = await mutateInquiryStatus(outsider, "inq-001", "resolve");
    assert.equal(res2.ok, false);
  });

  test("inquiry mark_contacted → resolve flow updates status each step", async () => {
    const repo = createRepository(getDb());
    const res1 = await mutateInquiryStatus(staff, "inq-001", "mark_contacted");
    assert.equal(res1.ok, true);
    let row = await repo.getInquiryById("inq-001");
    assert.equal(row?.status, "contacted");
    const res2 = await mutateInquiryStatus(staff, "inq-001", "resolve");
    assert.equal(res2.ok, true);
    row = await repo.getInquiryById("inq-001");
    assert.equal(row?.status, "resolved");
    // terminal-ish: contact again is invalid now
    const res3 = await mutateInquiryStatus(staff, "inq-001", "mark_contacted");
    assert.equal(res3.ok, false);
    assert.deepEqual(inquiryActionsFor("resolved"), []);
  });

  test("priority change validates the enum and writes", async () => {
    const bad = await mutateInquiryPriority(staff, "inq-002", "super-urgent");
    assert.equal(bad.ok, false);
    const res = await mutateInquiryPriority(staff, "inq-002", "urgent");
    assert.equal(res.ok, true);
    assert.equal((await createRepository(getDb()).getInquiryById("inq-002"))?.priority, "urgent");
  });

  test("approve draft requires a stored draft and stamps it once", async () => {
    const repo = createRepository(getDb());
    const inq = await repo.createInquiry({
      customerName: "Test Customer",
      subject: "Brakes",
      category: "general",
    });
    const noDraft = await approveInquiryDraft(staff, inq.id);
    assert.equal(noDraft.ok, false);
    await repo.setInquiryTriage(inq.id, JSON.stringify({ draftReply: "We'll take a look." }));
    const res = await approveInquiryDraft(staff, inq.id);
    assert.equal(res.ok, true);
    const triage = JSON.parse((await repo.getInquiryById(inq.id))!.triage!);
    assert.ok(triage.draftApprovedAt);
    const again = await approveInquiryDraft(staff, inq.id);
    assert.equal(again.ok, false);
  });

  test("convert creates a booking and resolves the inquiry", async () => {
    const repo = createRepository(getDb());
    const inq = await repo.createInquiry({
      customerName: "Convert Me",
      customerEmail: "conv@t.dev",
      customerPhone: "0917",
      vehicle: "Toyota Vios",
      subject: "Full service quote",
      category: "quote",
    });
    const res = await convertInquiryToAppointment(staff, inq.id, {
      serviceId: "oil-change",
      branchId: "branch-bgc",
      date: "2025-11-05",
      time: "10:00",
    });
    assert.equal(res.ok, true);
    assert.match(res.ok ? res.message : "", /AC-\d{4}-\d{5}/);
    assert.equal((await repo.getInquiryById(inq.id))?.status, "resolved");
  });
});

describe("pending actions on a record", () => {
  test("matches pending rows whose args contain the record id or reference", async () => {
    const repo = createRepository(getDb());
    await repo.createPendingAction({
      action: "reschedule_booking",
      payload: { args: { reference: "AC-2025-00042", date: "2025-11-02", time: "09:00" }, token: "tok-1", summary: "Move AC-2025-00042" },
    });
    const matched = await pendingActionsForRecord(repo, ["appt-001", "AC-2025-00042"]);
    assert.equal(matched.length, 1);
    assert.equal(matched[0].action, "reschedule_booking");
    assert.equal(matched[0].token, "tok-1");
    const unrelated = await pendingActionsForRecord(repo, ["inq-999"]);
    assert.equal(unrelated.length, 0);
  });

  test("decision buttons render the pending summary with hidden token", () => {
    const html = renderToStaticMarkup(
      createElement(PendingDecision, {
        pendingId: "pend-1", token: "tok-1",
        summary: "Move AC-2025-00042 to 2025-11-02", action: "reschedule_booking", expired: false,
      }),
    );
    assert.ok(html.includes("Move AC-2025-00042"), html);
    assert.ok(html.includes('value="tok-1"'), html);
    assert.ok(html.includes("Approve"), html);
    assert.ok(html.includes("Reject"), html);
  });
});
