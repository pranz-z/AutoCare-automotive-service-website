/**
 * Synthetic demo data facade — backed by the SQLite database in src/lib/db.
 * Kept as a synchronous compatibility layer for the demo tool router and tests.
 * All seeded data is fictional; NOT real business data.
 */

import { getLocations, getServices } from "@/lib/content";
import { getDb } from "@/lib/db/client";
import { seedIfEmpty } from "@/lib/db/seed";

export interface DemoBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  operatingHours: string;
  availableServices: string[];
}

export interface DemoSlot {
  id: string;
  branchId: string;
  date: string;
  time: string;
  available: boolean;
}

export interface DemoAppointment {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleInfo: string;
  serviceId: string;
  branchId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  notes: string;
}

export interface DemoInquiry {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  category: "quote" | "booking" | "general" | "complaint";
  priority: "low" | "medium" | "high";
  status: "new" | "reviewed" | "responded" | "resolved";
  message: string;
  createdAt: string;
}

export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  plateNumber: string;
  totalVisits: number;
  createdAt: string;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function q(sql: string, params: (string | number | null)[] = []): Row[] {
  return getDb().sqlite.prepare(sql).all(...params) as Row[];
}

function run(sql: string, params: (string | number | null)[] = []) {
  getDb().sqlite.prepare(sql).run(...params);
}

function nextReference(prefix: string, table: "appointments" | "inquiries"): string {
  const year = new Date().getFullYear();
  const rows = q(`SELECT reference FROM ${table} WHERE reference LIKE ?`, [`${prefix}-${year}-%`]);
  const max = rows.reduce((acc, r) => {
    const tail = Number.parseInt(str(r.reference).split("-")[2] ?? "0", 10);
    return Number.isFinite(tail) && tail > acc ? tail : acc;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(5, "0")}`;
}

function findOrCreateCustomerSync(name: string, email: string, phone: string): string {
  const existing = q("SELECT id FROM customers WHERE email = ? LIMIT 1", [email])[0]
    ?? (phone ? q("SELECT id FROM customers WHERE phone = ? LIMIT 1", [phone])[0] : undefined);
  if (existing) return str(existing.id);
  const customerId = id("cust");
  run(
    "INSERT INTO customers (id,name,email,phone,conversation_status,created_at) VALUES (?,?,?,?,?,?)",
    [customerId, name, email, phone, "ai_handling", new Date().toISOString()],
  );
  return customerId;
}

function toDemoAppointment(r: Row): DemoAppointment {
  return {
    id: str(r.id),
    reference: str(r.reference),
    customerName: str(r.customer_name),
    customerEmail: str(r.customer_email),
    customerPhone: str(r.customer_phone),
    vehicleInfo: str(r.vehicle_info),
    serviceId: str(r.service_id),
    branchId: str(r.branch_id),
    date: str(r.date),
    time: str(r.time),
    status: str(r.status) as DemoAppointment["status"],
    createdAt: str(r.created_at),
    notes: str(r.notes),
  };
}

const APPOINTMENT_SELECT = `
  SELECT a.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
  FROM appointments a JOIN customers c ON a.customer_id = c.id`;

function toDemoInquiry(r: Row): DemoInquiry {
  return {
    id: str(r.id),
    reference: str(r.reference),
    customerName: str(r.customer_name),
    customerEmail: str(r.customer_email),
    customerPhone: str(r.customer_phone),
    subject: str(r.subject),
    category: str(r.category) as DemoInquiry["category"],
    priority: str(r.priority) as DemoInquiry["priority"],
    status: str(r.status) as DemoInquiry["status"],
    message: str(r.message),
    createdAt: str(r.created_at),
  };
}

/**
 * Seeds the database if empty. Kept for compatibility with the previous
 * in-memory implementation (tests and reset route call it).
 */
export function initializeDemoData() {
  seedIfEmpty(getDb());
}

// Branch operations
export function getDemoBranches(): DemoBranch[] {
  return q("SELECT * FROM branches").map((r) => ({
    id: str(r.id),
    name: str(r.name),
    address: str(r.address),
    city: str(r.city),
    phone: str(r.phone),
    operatingHours: str(r.operating_hours),
    availableServices: JSON.parse(str(r.available_services) || "[]") as string[],
  }));
}

export function getDemoBranch(branchId: string): DemoBranch | undefined {
  return getDemoBranches().find((b) => b.id === branchId);
}

// Availability operations — derived from real appointment rows: a slot is
// unavailable once 2 active (non-cancelled) bookings exist for it.
export function getDemoAvailability(branchId?: string, serviceId?: string): DemoSlot[] {
  const branches = branchId ? getDemoBranches().filter((b) => b.id === branchId) : getDemoBranches();
  const slots: DemoSlot[] = [];
  const today = new Date();
  const SLOT_CAPACITY = 2;

  for (const branch of branches) {
    if (serviceId && !branch.availableServices.includes(serviceId)) continue;

    const taken = new Map<string, number>();
    for (const r of q(
      "SELECT date, time FROM appointments WHERE branch_id = ? AND status != 'cancelled'",
      [branch.id],
    )) {
      const key = `${str(r.date)}T${str(r.time)}`;
      taken.set(key, (taken.get(key) ?? 0) + 1);
    }

    for (let d = 1; d <= 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (date.getDay() === 0) continue;

      const times = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
      for (const time of times) {
        slots.push({
          id: `slot-${branch.id}-${dateStr}-${time}`,
          branchId: branch.id,
          date: dateStr,
          time,
          available: (taken.get(`${dateStr}T${time}`) ?? 0) < SLOT_CAPACITY,
        });
      }
    }
  }

  return slots.sort((a, b) => {
    if (a.branchId !== b.branchId) return a.branchId.localeCompare(b.branchId);
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

// Appointment operations
export function getDemoAppointments(filters?: {
  status?: DemoAppointment["status"];
  branchId?: string;
  customerEmail?: string;
}): DemoAppointment[] {
  let rows = q(`${APPOINTMENT_SELECT} ORDER BY a.created_at DESC`).map(toDemoAppointment);
  if (filters?.status) rows = rows.filter((a) => a.status === filters.status);
  if (filters?.branchId) rows = rows.filter((a) => a.branchId === filters.branchId);
  if (filters?.customerEmail) rows = rows.filter((a) => a.customerEmail === filters.customerEmail);
  return rows;
}

export function getDemoAppointment(appointmentId: string): DemoAppointment | undefined {
  const rows = q(`${APPOINTMENT_SELECT} WHERE a.id = ? OR a.reference = ? LIMIT 1`, [appointmentId, appointmentId]);
  return rows[0] ? toDemoAppointment(rows[0]) : undefined;
}

export function createDemoAppointment(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleInfo: string;
  serviceId: string;
  branchId: string;
  date: string;
  time: string;
  notes?: string;
}): DemoAppointment {
  const customerId = findOrCreateCustomerSync(data.customerName, data.customerEmail, data.customerPhone);
  const appointment: DemoAppointment = {
    id: id("appt"),
    reference: nextReference("AC", "appointments"),
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    vehicleInfo: data.vehicleInfo,
    serviceId: data.serviceId,
    branchId: data.branchId,
    date: data.date,
    time: data.time,
    status: "pending",
    createdAt: new Date().toISOString(),
    notes: data.notes || "",
  };
  run(
    `INSERT INTO appointments (id,reference,customer_id,vehicle_id,vehicle_info,service_id,branch_id,location,date,time,status,notes,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      appointment.id, appointment.reference, customerId, null, appointment.vehicleInfo,
      appointment.serviceId, appointment.branchId, "", appointment.date, appointment.time,
      appointment.status, appointment.notes, appointment.createdAt,
    ],
  );
  return appointment;
}

export function updateDemoAppointmentStatus(
  appointmentId: string,
  status: DemoAppointment["status"],
): DemoAppointment | null {
  const found = getDemoAppointment(appointmentId);
  if (!found) return null;
  run("UPDATE appointments SET status = ? WHERE id = ?", [status, found.id]);
  return { ...found, status };
}

// Inquiry operations
export function getDemoInquiries(filters?: {
  status?: DemoInquiry["status"];
  category?: DemoInquiry["category"];
  priority?: DemoInquiry["priority"];
}): DemoInquiry[] {
  let rows = q("SELECT * FROM inquiries").map(toDemoInquiry);
  if (filters?.status) rows = rows.filter((i) => i.status === filters.status);
  if (filters?.category) rows = rows.filter((i) => i.category === filters.category);
  if (filters?.priority) rows = rows.filter((i) => i.priority === filters.priority);
  const priorityOrder = { high: 0, medium: 1, low: 2 } as Record<string, number>;
  return rows.sort((a, b) => {
    if ((priorityOrder[a.priority] ?? 1) !== (priorityOrder[b.priority] ?? 1)) {
      return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getDemoInquiry(inquiryId: string): DemoInquiry | undefined {
  const rows = q("SELECT * FROM inquiries WHERE id = ? OR reference = ? LIMIT 1", [inquiryId, inquiryId]);
  return rows[0] ? toDemoInquiry(rows[0]) : undefined;
}

export function createDemoInquiry(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  category: DemoInquiry["category"];
  message: string;
}): DemoInquiry {
  const customerId = data.customerEmail
    ? findOrCreateCustomerSync(data.customerName, data.customerEmail, data.customerPhone)
    : null;
  const inquiry: DemoInquiry = {
    id: id("inq"),
    reference: nextReference("QI", "inquiries"),
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    subject: data.subject,
    category: data.category,
    priority: "medium",
    status: "new",
    message: data.message,
    createdAt: new Date().toISOString(),
  };
  run(
    `INSERT INTO inquiries (id,reference,customer_id,customer_name,customer_email,customer_phone,vehicle,subject,category,priority,status,message,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      inquiry.id, inquiry.reference, customerId, inquiry.customerName, inquiry.customerEmail,
      inquiry.customerPhone, "", inquiry.subject, inquiry.category, inquiry.priority,
      inquiry.status, inquiry.message, inquiry.createdAt,
    ],
  );
  return inquiry;
}

export function updateDemoInquiryStatus(
  inquiryId: string,
  status: DemoInquiry["status"],
): DemoInquiry | null {
  const found = getDemoInquiry(inquiryId);
  if (!found) return null;
  run("UPDATE inquiries SET status = ? WHERE id = ?", [status, found.id]);
  return { ...found, status };
}

// Customer operations (staff only)
export function getDemoCustomers(search?: string): DemoCustomer[] {
  const rows = q(`
    SELECT c.*, (
      SELECT COUNT(*) FROM appointments a WHERE a.customer_id = c.id
    ) AS total_visits
    FROM customers c`);
  let customers = rows.map((r): DemoCustomer => {
    const vehicles = q(
      "SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at LIMIT 1",
      [str(r.id)],
    );
    const v = vehicles[0];
    return {
      id: str(r.id),
      name: str(r.name),
      email: str(r.email),
      phone: str(r.phone),
      vehicle: v ? `${v.make} ${v.model} ${v.year}`.trim() : "",
      plateNumber: v ? str(v.plate) : "",
      totalVisits: Number(r.total_visits) || 0,
      createdAt: str(r.created_at),
    };
  });
  if (search) {
    const s = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.vehicle.toLowerCase().includes(s) ||
        c.plateNumber.toLowerCase().includes(s),
    );
  }
  return customers.sort((a, b) => b.totalVisits - a.totalVisits);
}

export function getDemoCustomer(customerId: string): DemoCustomer | undefined {
  return getDemoCustomers().find((c) => c.id === customerId);
}

// Service operations (for availability checking)
export function getDemoServiceById(serviceId: string) {
  return getServices().find((s) => s.id === serviceId || s.slug === serviceId);
}

// Location operations (for availability checking)
export function getDemoLocationById(locationId: string) {
  return getLocations().find((l) => l.id === locationId);
}

/** Reset all demo data to the seeded state. */
export function resetDemoData() {
  const { sqlite } = getDb();
  sqlite.exec(`
    DELETE FROM pending_actions; DELETE FROM agent_actions; DELETE FROM chat_sessions;
    DELETE FROM quotes; DELETE FROM inquiries; DELETE FROM appointments;
    DELETE FROM vehicles; DELETE FROM customers; DELETE FROM branches;
  `);
  seedIfEmpty(getDb());
  return { success: true, message: "Demo data has been reset to seeded state" };
}

/** Summary of demo data counts (for staff dashboard). */
export function getDemoSummary() {
  const appointments = q("SELECT status FROM appointments").map((r) => str(r.status));
  const inquiries = q("SELECT status FROM inquiries").map((r) => str(r.status));
  return {
    branches: (q("SELECT COUNT(*) AS n FROM branches")[0]?.n as number) ?? 0,
    appointments: {
      total: appointments.length,
      pending: appointments.filter((s) => s === "pending").length,
      confirmed: appointments.filter((s) => s === "confirmed").length,
      completed: appointments.filter((s) => s === "completed").length,
      cancelled: appointments.filter((s) => s === "cancelled").length,
    },
    inquiries: {
      total: inquiries.length,
      new: inquiries.filter((s) => s === "new").length,
      reviewed: inquiries.filter((s) => s === "reviewed").length,
      responded: inquiries.filter((s) => s === "responded").length,
      resolved: inquiries.filter((s) => s === "resolved").length,
    },
    customers: (q("SELECT COUNT(*) AS n FROM customers")[0]?.n as number) ?? 0,
  };
}
