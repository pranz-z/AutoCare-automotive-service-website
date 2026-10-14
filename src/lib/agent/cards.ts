import { getService } from "@/lib/content";
import type { AgentCard, AgentCardField } from "./types";

/**
 * Deterministic record → card mapping. Values are formatted here (dates as
 * "Oct 4, 2025", statuses Title Cased) so the UI never depends on how the
 * model happened to phrase a reply.
 */

/** "in_service" → "In Service", "urgent" → "Urgent". */
export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "2025-10-04" or an ISO datetime → "Oct 4, 2025". Timezone-safe for date-only input. */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const field = (label: string, value: string | null | undefined): AgentCardField[] =>
  value ? [{ label, value }] : [];

/**
 * Fixed route map for record deep-links. hrefs are built here — never from
 * model output — and only for server-verified staff contexts. Ids must match
 * the internal id shape; anything else yields no link (never an encoded
 * traversal or protocol URL).
 */
const RECORD_ROUTES = {
  appointment: "/admin/appointments?open=",
  inquiry: "/admin/inquiries?open=",
  customer: "/admin/customers?open=",
  chat: "/admin/chats?open=",
} as const;

export function adminHref(
  kind: keyof typeof RECORD_ROUTES,
  id: unknown,
  staff: boolean,
): string | undefined {
  if (!staff || typeof id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(id)) return undefined;
  return `${RECORD_ROUTES[kind]}${encodeURIComponent(id)}`;
}

export function appointmentCard(
  a: {
    id?: string;
    reference: string;
    customerName?: string;
    serviceId?: string;
    serviceName?: string;
    branchName?: string;
    branch?: string;
    date: string;
    time: string;
    status: string;
  },
  staff = false,
): AgentCard {
  const serviceName = a.serviceName ?? (a.serviceId ? getService(a.serviceId)?.name : undefined);
  return {
    title: `${a.customerName ?? "Appointment"} - ${serviceName ?? a.serviceId ?? "service"}`,
    fields: [
      ...field("Reference", a.reference),
      ...field("Branch", a.branchName ?? a.branch),
      ...field("Date", fmtDate(a.date)),
      ...field("Time", a.time),
      ...field("Status", titleCase(a.status)),
    ],
    href: adminHref("appointment", a.id, staff),
  };
}

export function inquiryCard(
  i: {
    id?: string;
    reference: string;
    customerName?: string;
    subject?: string;
    category?: string;
    priority?: string;
    status?: string;
    createdAt?: string;
  },
  staff = false,
): AgentCard {
  return {
    title: `${i.customerName ?? "Inquiry"} - ${i.subject ?? titleCase(i.category ?? "message")}`,
    href: adminHref("inquiry", i.id, staff),
    fields: [
      ...field("Reference", i.reference),
      ...field("Category", i.category ? titleCase(i.category) : undefined),
      ...field("Priority", i.priority ? titleCase(i.priority) : undefined),
      ...field("Status", i.status ? titleCase(i.status) : undefined),
      ...field("Created", fmtDate(i.createdAt)),
    ],
  };
}

export function customerCard(
  c: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    vehicle?: string;
    createdAt?: string;
  },
  staff = false,
): AgentCard {
  return {
    title: c.name,
    href: adminHref("customer", c.id, staff),
    fields: [
      ...field("Email", c.email),
      ...field("Phone", c.phone),
      ...field("Vehicle", c.vehicle),
      ...field("Since", fmtDate(c.createdAt)),
    ],
  };
}

/** One card per branch; each open date is one "Label: times" row. */
export function availabilityCard(entry: {
  branch: { name: string; city?: string };
  slots: { date: string; time: string; available: boolean }[];
}): AgentCard | null {
  const byDate = new Map<string, string[]>();
  for (const slot of entry.slots) {
    if (!slot.available) continue;
    const key = fmtDate(slot.date);
    byDate.set(key, [...(byDate.get(key) ?? []), slot.time]);
  }
  if (!byDate.size) return null;
  return {
    title: entry.branch.name,
    subtitle: entry.branch.city,
    fields: [...byDate.entries()].map(([date, times]) => ({ label: date, value: times.join(", ") })),
  };
}

export function chatCard(
  s: {
    id: string;
    customerName?: string;
    channel?: string;
    messageCount?: number;
    createdAt?: string;
    lastMessageAt?: string;
  },
  staff = false,
): AgentCard {
  return {
    title: `${s.customerName ?? "Visitor"} - ${titleCase(s.channel ?? "chat")} conversation`,
    href: adminHref("chat", s.id, staff),
    fields: [
      ...field("Channel", s.channel ? titleCase(s.channel) : undefined),
      ...field("Messages", typeof s.messageCount === "number" ? String(s.messageCount) : undefined),
      ...field("Started", fmtDate(s.createdAt)),
      ...field("Last activity", fmtDate(s.lastMessageAt)),
    ],
  };
}

export function dashboardCard(s: {
  branches: number;
  appointments: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  inquiries: { total: number; new: number };
}): AgentCard {
  return {
    title: "Dashboard summary",
    fields: [
      ...field("Branches", String(s.branches)),
      ...field("Appointments", String(s.appointments.total)),
      ...field("Pending", String(s.appointments.pending)),
      ...field("Confirmed", String(s.appointments.confirmed)),
      ...field("Completed", String(s.appointments.completed)),
      ...field("Cancelled", String(s.appointments.cancelled)),
      ...field("Inquiries", String(s.inquiries.total)),
      ...field("New inquiries", String(s.inquiries.new)),
    ],
  };
}
