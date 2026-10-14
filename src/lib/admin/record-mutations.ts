import { getDb } from "@/lib/db/client";
import { createRepository, type Repository } from "@/lib/db/repository";
import { isAllowed, type SessionPayload } from "@/lib/admin-auth";
import { getService } from "@/lib/content";

export type MutationResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const fail = (error: string): MutationResult => ({ ok: false, error });
const ok = (message: string): MutationResult => ({ ok: true, message });

const actorOf = (s: SessionPayload) => (s.sub ? `${s.role}:${s.sub}` : s.role);

async function audit(
  repo: Repository,
  session: SessionPayload,
  toolName: string,
  input: unknown,
  output: unknown,
  success: boolean,
) {
  await repo.logAgentAction({
    actorType: actorOf(session),
    toolName,
    input,
    output,
    success,
  });
}

// ---------- appointments ----------

/**
 * Valid staff transitions. `reschedule` is special-cased (needs date+time and
 * lands on the "rescheduled" status until re-confirmed).
 */
export const APPOINTMENT_ACTIONS = {
  confirm: { to: "confirmed", from: ["pending", "rescheduled"] },
  in_service: { to: "in_service", from: ["pending", "confirmed"] },
  complete: { to: "completed", from: ["in_service"] },
  cancel: { to: "cancelled", from: ["pending", "confirmed", "in_service", "rescheduled"] },
  reschedule: { to: "rescheduled", from: ["pending", "confirmed", "rescheduled"] },
} as const;

export type AppointmentAction = keyof typeof APPOINTMENT_ACTIONS;

export function appointmentActionsFor(status: string): AppointmentAction[] {
  return (Object.keys(APPOINTMENT_ACTIONS) as AppointmentAction[]).filter((a) =>
    APPOINTMENT_ACTIONS[a].from.includes(status as never),
  );
}

export async function mutateAppointment(
  session: SessionPayload,
  idOrRef: string,
  action: string,
  extra?: { date?: string; time?: string },
): Promise<MutationResult> {
  if (!isAllowed(session.role, "appointments.update")) {
    return fail("Your role cannot update appointments.");
  }
  const t = APPOINTMENT_ACTIONS[action as AppointmentAction];
  if (!t) return fail("Unknown appointment action.");

  const repo = createRepository(getDb());
  const row = (await repo.listAppointmentsDetailed()).find(
    (a) => a.id === idOrRef || a.reference === idOrRef,
  );
  if (!row) return fail("Appointment not found.");
  if (!t.from.includes(row.status as never)) {
    return fail(`Cannot ${action} an appointment that is "${row.status}".`);
  }

  if (action === "reschedule") {
    const date = extra?.date ?? "";
    const time = extra?.time ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return fail("Reschedule needs a date (YYYY-MM-DD) and time (HH:MM).");
    }
    await repo.updateAppointmentSchedule(row.id, date, time);
  }
  await repo.updateAppointmentStatus(row.id, t.to);
  const detail = action === "reschedule" ? ` to ${extra?.date} ${extra?.time}` : "";
  await audit(
    repo, session, `panel:appointment.${action}`,
    { appointment: row.reference, from: row.status, to: t.to, ...extra },
    { reference: row.reference, status: t.to },
    true,
  );
  return ok(`${row.reference} ${t.to.replace("_", " ")}${detail}.`);
}

// ---------- inquiries ----------

export const INQUIRY_TRANSITIONS: Record<string, { to: string; from: string[]; label: string }> = {
  mark_contacted: { to: "contacted", from: ["new"], label: "Mark contacted" },
  resolve: { to: "resolved", from: ["new", "contacted", "reviewed", "responded"], label: "Resolve" },
};

export const INQUIRY_PRIORITIES = ["low", "normal", "medium", "high", "urgent"] as const;

export function inquiryActionsFor(status: string): string[] {
  return Object.keys(INQUIRY_TRANSITIONS).filter((a) =>
    INQUIRY_TRANSITIONS[a].from.includes(status),
  );
}

export async function mutateInquiryStatus(
  session: SessionPayload,
  idOrRef: string,
  action: string,
): Promise<MutationResult> {
  if (!isAllowed(session.role, "ai.view")) return fail("Your role cannot update inquiries.");
  const t = INQUIRY_TRANSITIONS[action];
  if (!t) return fail("Unknown inquiry action.");

  const repo = createRepository(getDb());
  const row = (await repo.listInquiriesDetailed()).find(
    (i) => i.id === idOrRef || i.reference === idOrRef,
  );
  if (!row) return fail("Inquiry not found.");
  if (!t.from.includes(row.status)) {
    return fail(`Cannot ${t.label.toLowerCase()} an inquiry that is "${row.status}".`);
  }
  await repo.updateInquiryStatus(row.id, t.to);
  await audit(repo, session, `panel:inquiry.${action}`,
    { inquiry: row.reference, from: row.status, to: t.to },
    { reference: row.reference, status: t.to }, true);
  return ok(`${row.reference}: ${t.label.toLowerCase()}.`);
}

export async function mutateInquiryPriority(
  session: SessionPayload,
  idOrRef: string,
  priority: string,
): Promise<MutationResult> {
  if (!isAllowed(session.role, "ai.view")) return fail("Your role cannot update inquiries.");
  if (!INQUIRY_PRIORITIES.includes(priority as never)) return fail("Unknown priority.");

  const repo = createRepository(getDb());
  const row = (await repo.listInquiriesDetailed()).find(
    (i) => i.id === idOrRef || i.reference === idOrRef,
  );
  if (!row) return fail("Inquiry not found.");
  if (row.status === "closed") return fail("Closed inquiries cannot be reprioritized.");
  await repo.updateInquiryPriority(row.id, priority);
  await audit(repo, session, "panel:inquiry.priority",
    { inquiry: row.reference, from: row.priority, to: priority },
    { reference: row.reference, priority }, true);
  return ok(`${row.reference} priority → ${priority}.`);
}

export async function approveInquiryDraft(
  session: SessionPayload,
  idOrRef: string,
): Promise<MutationResult> {
  if (!isAllowed(session.role, "ai.view")) return fail("Your role cannot update inquiries.");

  const repo = createRepository(getDb());
  const row = (await repo.listInquiriesDetailed()).find(
    (i) => i.id === idOrRef || i.reference === idOrRef,
  );
  if (!row) return fail("Inquiry not found.");
  let triage: { draftReply?: string; draftApprovedAt?: string } = {};
  try { triage = row.triage ? JSON.parse(row.triage) : {}; } catch { /* malformed */ }
  if (!triage.draftReply) return fail("No draft reply stored on this inquiry.");
  if (triage.draftApprovedAt) return fail("Draft reply was already approved.");

  triage.draftApprovedAt = new Date().toISOString();
  await repo.setInquiryTriage(row.id, JSON.stringify(triage));
  await audit(repo, session, "panel:inquiry.approve_draft",
    { inquiry: row.reference }, { approved: true }, true);
  return ok(`Draft reply approved for ${row.reference}.`);
}

export async function convertInquiryToAppointment(
  session: SessionPayload,
  idOrRef: string,
  input: { serviceId: string; branchId: string; date: string; time: string },
): Promise<MutationResult> {
  if (!isAllowed(session.role, "ai.view")) return fail("Your role cannot update inquiries.");
  if (!getService(input.serviceId)) return fail("Unknown service.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
    return fail("Convert needs a date (YYYY-MM-DD) and time (HH:MM).");
  }

  const repo = createRepository(getDb());
  const row = (await repo.listInquiriesDetailed()).find(
    (i) => i.id === idOrRef || i.reference === idOrRef,
  );
  if (!row) return fail("Inquiry not found.");
  if (row.status === "closed" || row.status === "resolved") {
    return fail(`Cannot convert an inquiry that is "${row.status}".`);
  }

  const appointment = await repo.createAppointment({
    customer: {
      name: row.customerName,
      email: row.customerEmail || "unknown@example.invalid",
      phone: row.customerPhone || "n/a",
    },
    vehicleInfo: row.vehicle,
    serviceId: input.serviceId,
    branchId: input.branchId,
    date: input.date,
    time: input.time,
    notes: `Converted from inquiry ${row.reference}: ${row.subject}`,
  });
  await repo.updateInquiryStatus(row.id, "resolved");
  await audit(repo, session, "panel:inquiry.convert",
    { inquiry: row.reference, ...input },
    { appointment: appointment.reference, inquiry: row.reference, status: "resolved" }, true);
  return ok(`${row.reference} converted → booking ${appointment.reference}.`);
}

// ---------- pending actions on a record ----------

export interface PendingForRecord {
  id: string;
  action: string;
  summary: string;
  token: string;
  expiresAt: string;
  expired: boolean;
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

/**
 * Pending agent proposals whose args reference this record — matched by any
 * internal id or display reference appearing anywhere in the stored args.
 */
export async function pendingActionsForRecord(
  repo: Repository,
  identifiers: (string | undefined | null)[],
): Promise<PendingForRecord[]> {
  const wanted = new Set(identifiers.filter((v): v is string => Boolean(v)));
  if (!wanted.size) return [];
  const rows = await repo.listPendingActions();
  const out: PendingForRecord[] = [];
  for (const r of rows) {
    if (r.status !== "pending") continue;
    let args: unknown;
    let summary = r.action;
    let token = "";
    try {
      const payload = JSON.parse(r.payload) as { args?: unknown; summary?: string; token?: string };
      args = payload.args;
      if (payload.summary) summary = payload.summary;
      token = payload.token ?? "";
    } catch { /* malformed payload — can't match */ continue; }
    if (!collectStrings(args).some((v) => wanted.has(v))) continue;
    out.push({
      id: r.id,
      action: r.action,
      summary,
      token,
      expiresAt: r.expiresAt,
      expired: new Date(r.expiresAt).getTime() < Date.now(),
    });
  }
  return out;
}
