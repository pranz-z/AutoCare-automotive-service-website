import { getService } from "@/lib/content";
import { formatPrice } from "@/lib/content";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";

/**
 * Admin view adapter — maps canonical database records to the display shapes
 * the admin pages render. Statuses are stored lowercase-snake and presented
 * in the admin UI's Title Case vocabulary.
 */

export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "In Service"
  | "Completed"
  | "Cancelled"
  | "No Show"
  | "Rescheduled";

export type InquiryPriority = "Low" | "Normal" | "High" | "Urgent";
export type InquiryCategory =
  | "Maintenance"
  | "Booking"
  | "Pricing"
  | "Branch"
  | "Warranty"
  | "Complaint"
  | "Other";

export type Appointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicle: string;
  make: string;
  model: string;
  year: string;
  variant: string;
  mileage?: string;
  service: string;
  serviceDescription: string;
  price: string;
  duration: string;
  branch: string;
  branchAddress: string;
  branchContact: string;
  operatingHours: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  customerNotes: string;
  aiSummary?: string;
  activities: Array<{
    time: string;
    actorType: "customer" | "staff" | "admin" | "ai" | "system";
    action: string;
  }>;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicles: Array<{ make: string; model: string; year: string; variant: string; mileage?: string }>;
  totalBookings: number;
  lastBooking: string;
  upcomingBooking: string;
  conversationStatus: "AI Handling" | "Needs Staff" | "Assigned" | "Resolved" | "Closed";
};

export type ConversationMessage = {
  id: string;
  sender: "customer" | "ai" | "staff" | "system";
  senderLabel: string;
  content: string;
  time: string;
  metadata?: string;
};

export type ChatConversation = {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  lastMessage: string;
  timestamp: string;
  status: "AI Handling" | "Needs Staff" | "Assigned" | "Resolved" | "Closed";
  assignedStaff: string;
  conversationType: "AI" | "Staff" | "Mixed";
  priority: "Normal" | "High" | "Urgent";
  messages: ConversationMessage[];
  customerContext: {
    phone: string;
    email: string;
    vehicle: string;
    bookingsTotal: number;
    upcomingBooking: string;
    branch: string;
  };
};

export type Inquiry = {
  id: string;
  customer: string;
  vehicle: string;
  category: InquiryCategory;
  description: string;
  branch: string;
  priority: InquiryPriority;
  status: "Open" | "Assigned" | "Resolved" | "Closed";
  assignedStaff: string;
  /** Auto-triage summary from the submission hook, if present. */
  triageSummary?: string;
  createdAt: string;
};

const APPOINTMENT_STATUS: Record<string, AppointmentStatus> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_service: "In Service",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  rescheduled: "Rescheduled",
};

const CONVERSATION_STATUS: Record<string, CustomerProfile["conversationStatus"]> = {
  ai_handling: "AI Handling",
  needs_staff: "Needs Staff",
  assigned: "Assigned",
  resolved: "Resolved",
  closed: "Closed",
};

const INQUIRY_STATUS: Record<string, Inquiry["status"]> = {
  new: "Open",
  reviewed: "Assigned",
  contacted: "Assigned",
  responded: "Resolved",
  resolved: "Resolved",
  closed: "Closed",
};

const INQUIRY_CATEGORY: Record<string, InquiryCategory> = {
  quote: "Pricing",
  booking: "Booking",
  general: "Other",
  maintenance: "Maintenance",
  complaint: "Complaint",
  branch: "Branch",
  warranty: "Warranty",
};

const PRIORITY: Record<string, InquiryPriority> = {
  low: "Low",
  normal: "Normal",
  medium: "Normal",
  high: "High",
  urgent: "Urgent",
};

const CONVERSATION_TYPE: Record<string, ChatConversation["conversationType"]> = {
  ai: "AI",
  staff: "Staff",
  mixed: "Mixed",
};

function to12h(time: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m[2]} ${suffix}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 16).replace("T", " ");
}

export async function getAdminAppointments(): Promise<Appointment[]> {
  const repo = createRepository(getDb());
  const rows = await repo.listAppointmentsDetailed();
  const vehicleRows = await repo.listVehicles();
  const vehicleById = new Map(vehicleRows.map((v) => [v.id, v]));

  return rows.map((row) => {
    const service = getService(row.serviceId);
    const vehicle = row.vehicleId ? vehicleById.get(row.vehicleId) : undefined;
    return {
      id: row.reference,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail,
      vehicle: row.vehicleInfo,
      make: vehicle?.make ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? "",
      variant: vehicle?.variant ?? "",
      mileage: vehicle?.mileage || undefined,
      service: service?.name ?? row.serviceId,
      serviceDescription: service?.shortDescription ?? "",
      price: service ? formatPrice(service.priceFrom) : "",
      duration: service?.duration ?? "",
      branch: row.branchName.replace(/^AutoCare\s*/, ""),
      branchAddress: row.branchAddress,
      branchContact: row.branchPhone,
      operatingHours: row.branchHours,
      date: row.date,
      time: to12h(row.time),
      status: APPOINTMENT_STATUS[row.status] ?? "Pending",
      createdAt: shortDate(row.createdAt),
      customerNotes: row.notes,
      activities: [
        { time: shortDate(row.createdAt), actorType: "customer" as const, action: "Customer submitted booking" },
        ...(row.status !== "pending"
          ? [{ time: "", actorType: "system" as const, action: `Status: ${APPOINTMENT_STATUS[row.status] ?? row.status}` }]
          : []),
      ],
    };
  });
}

export async function getAdminCustomers(): Promise<CustomerProfile[]> {
  const repo = createRepository(getDb());
  const [customers, vehicles, appointments] = await Promise.all([
    repo.listCustomers(),
    repo.listVehicles(),
    repo.listAppointmentsDetailed(),
  ]);
  const vehiclesByCustomer = new Map<string, typeof vehicles>();
  for (const v of vehicles) {
    vehiclesByCustomer.set(v.customerId, [...(vehiclesByCustomer.get(v.customerId) ?? []), v]);
  }

  return customers.map((c) => {
    const theirs = appointments.filter((a) => a.customerId === c.id);
    const upcoming = theirs.find((a) => a.status === "pending" || a.status === "confirmed");
    const latest = theirs[0];
    const svc = (id: string) => getService(id)?.name ?? id;
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      vehicles: (vehiclesByCustomer.get(c.id) ?? []).map((v) => ({
        make: v.make,
        model: v.model,
        year: v.year,
        variant: v.variant,
        mileage: v.mileage || undefined,
      })),
      totalBookings: theirs.length,
      lastBooking: latest ? `${svc(latest.serviceId)} | ${latest.date}` : "—",
      upcomingBooking: upcoming ? `${svc(upcoming.serviceId)} | ${upcoming.date}` : "—",
      conversationStatus: CONVERSATION_STATUS[c.conversationStatus] ?? "AI Handling",
    };
  });
}

export async function getAdminChats(): Promise<ChatConversation[]> {
  const repo = createRepository(getDb());
  const sessions = await repo.listChatSessions();
  return sessions.map((s) => {
    const ctx = s.customerContext as Partial<ChatConversation["customerContext"]>;
    return {
      id: s.id,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      vehicle: s.vehicle,
      lastMessage: s.lastMessage,
      timestamp: s.lastMessageAt,
      status: CONVERSATION_STATUS[s.status] ?? "AI Handling",
      assignedStaff: s.assignedStaff || "Unassigned",
      conversationType: CONVERSATION_TYPE[s.conversationType] ?? "AI",
      priority: (PRIORITY[s.priority] ?? "Normal") as ChatConversation["priority"],
      messages: s.messages,
      customerContext: {
        phone: ctx.phone ?? s.customerPhone,
        email: ctx.email ?? "",
        vehicle: ctx.vehicle ?? s.vehicle,
        bookingsTotal: ctx.bookingsTotal ?? 0,
        upcomingBooking: ctx.upcomingBooking ?? "—",
        branch: ctx.branch ?? "—",
      },
    };
  });
}

export async function getAdminInquiries(): Promise<Inquiry[]> {
  const repo = createRepository(getDb());
  const rows = await repo.listInquiriesDetailed();
  return rows.map((row) => {
    let triageSummary: string | undefined;
    if (row.triage) {
      try {
        const t = JSON.parse(row.triage) as { urgency?: string; suggestedServiceName?: string | null };
        triageSummary = `${t.urgency ?? "?"}${t.suggestedServiceName ? ` · ${t.suggestedServiceName}` : ""}`;
      } catch { /* no triage */ }
    }
    return {
      id: row.reference,
      customer: row.customerName,
      vehicle: row.vehicle,
      category: INQUIRY_CATEGORY[row.category] ?? "Other",
      description: row.message || row.subject,
      branch: "Website",
      priority: PRIORITY[row.priority] ?? "Normal",
      status: INQUIRY_STATUS[row.status] ?? "Open",
      assignedStaff: "Unassigned",
      triageSummary,
      createdAt: shortDate(row.createdAt),
    };
  });
}

export async function getAdminDashboardStats() {
  const [appointments, chats] = await Promise.all([getAdminAppointments(), getAdminChats()]);
  const count = (status: AppointmentStatus) => appointments.filter((a) => a.status === status).length;
  return {
    totalAppointments: appointments.length,
    pending: count("Pending"),
    confirmed: count("Confirmed"),
    inService: count("In Service"),
    completed: count("Completed"),
    customerConversations: chats.length,
    aiConversations: chats.filter((c) => c.conversationType !== "Staff").length,
    escalations: chats.filter((c) => c.status === "Needs Staff" || c.priority === "Urgent").length,
  };
}

export async function getRecentAppointments(limit = 4) {
  return (await getAdminAppointments()).slice(0, limit);
}

export async function getAppointmentsByStatus(status?: string) {
  const all = await getAdminAppointments();
  if (!status || status === "All") return all;
  return all.filter((item) => item.status === status);
}

export async function getAdminChatsByStatus(status?: string) {
  const all = await getAdminChats();
  if (!status || status === "All") return all;
  return all.filter((item) => item.status === status);
}

export async function getAdminAppointment(id: string) {
  // Accepts either the internal row id (appt-…) or the display reference
  // (AC-YYYY-NNNNN). Adapter rows expose the reference as `id`, so resolve
  // against the detailed rows first.
  const repo = createRepository(getDb());
  const row = (await repo.listAppointmentsDetailed()).find(
    (a) => a.id === id || a.reference === id,
  );
  if (!row) return undefined;
  return (await getAdminAppointments()).find((item) => item.id === row.reference);
}
