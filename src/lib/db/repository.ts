import { desc, eq, like, sql } from "drizzle-orm";
import type { Client } from "@libsql/client";
import type { Db, DbLike, DbHandle } from "./client";
import { txScope } from "./client";
import {
  agentActions,
  appointments,
  branches,
  chatSessions,
  customers,
  inquiries,
  pendingActions,
  quotes,
  vehicles,
} from "./schema";

export type BranchRecord = typeof branches.$inferSelect;
export type CustomerRecord = typeof customers.$inferSelect;
export type VehicleRecord = typeof vehicles.$inferSelect;
export type AppointmentRecord = typeof appointments.$inferSelect;
export type InquiryRecord = typeof inquiries.$inferSelect;
export type QuoteRecord = typeof quotes.$inferSelect;
export type ChatSessionRecord = typeof chatSessions.$inferSelect;
export type AgentActionRecord = typeof agentActions.$inferSelect;
export type PendingActionRecord = typeof pendingActions.$inferSelect;

export interface AppointmentDetail extends AppointmentRecord {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchHours: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "ai" | "staff" | "system";
  senderLabel: string;
  content: string;
  time: string;
  metadata?: string;
}

export interface ChatSessionParsed extends Omit<ChatSessionRecord, "messages" | "customerContext"> {
  messages: ChatMessage[];
  customerContext: Record<string, unknown>;
}

export interface BookingInput {
  customer: { name: string; email: string; phone: string };
  vehicle?: Partial<VehicleRecord> & { make?: string; model?: string; year?: string; variant?: string; plate?: string; mileage?: string };
  vehicleInfo?: string;
  serviceId: string;
  branchId: string;
  location?: string;
  date: string;
  time: string;
  notes?: string;
}

const VALID_SERVICES = new Set([
  "preventive-maintenance",
  "oil-change",
  "brake-service",
  "car-diagnostics",
  "battery-service",
  "air-conditioning",
  "tire-wheel-service",
  "pre-purchase-inspection",
]);

const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

function refNumber(count: number): number {
  return count + 1;
}

const REPO_HANDLES = new WeakMap<object, { client: Client; db: DbLike; url?: string }>();
const TX_DEPTH = new WeakMap<Client, number>();

/**
 * Runs fn on a transaction. @libsql/client's `transaction()`/`batch()`
 * variants that open a transaction-bound connection must NOT be used on
 * `:memory:` — a fresh connection means a fresh empty database. In-memory
 * databases are single-connection anyway, so BEGIN/COMMIT (+SAVEPOINT when
 * nested) on the base connection gives the same atomicity there.
 */
async function runTx<T>(
  client: Client,
  db: DbLike,
  url: string | undefined,
  fn: (txDb: DbLike) => Promise<T>,
): Promise<T> {
  if (url !== ":memory:") return (db as Db).transaction(fn);
  const depth = TX_DEPTH.get(client) ?? 0;
  const sp = `autocare_sp_${depth}`;
  await client.execute(depth === 0 ? "BEGIN IMMEDIATE" : `SAVEPOINT ${sp}`);
  TX_DEPTH.set(client, depth + 1);
  try {
    const result = await fn(db);
    await client.execute(depth === 0 ? "COMMIT" : `RELEASE ${sp}`);
    return result;
  } catch (e) {
    try {
      await client.execute(depth === 0 ? "ROLLBACK" : `ROLLBACK TO ${sp}`);
      if (depth > 0) await client.execute(`RELEASE ${sp}`);
    } catch { /* connection already rolled back */ }
    throw e;
  } finally {
    TX_DEPTH.set(client, depth);
  }
}

export function createRepository(handle: DbHandle | { client: Client; db: DbLike; url?: string }) {
  const { client, db } = handle;
  const url = "url" in handle ? handle.url : undefined;

  async function nextReference(
    executor: DbLike,
    prefix: string,
    table: "appointments" | "inquiries" | "quotes",
  ): Promise<string> {
    const year = new Date().getFullYear();
    const likePrefix = `${prefix}-${year}-%`;
    const rows = await executor
      .select({ reference: (table === "appointments" ? appointments : table === "inquiries" ? inquiries : quotes).reference })
      .from(table === "appointments" ? appointments : table === "inquiries" ? inquiries : quotes)
      .where(like((table === "appointments" ? appointments : table === "inquiries" ? inquiries : quotes).reference, likePrefix));
    const max = rows.reduce((acc, r) => {
      const tail = Number.parseInt(r.reference.split("-")[2] ?? "0", 10);
      return Number.isFinite(tail) && tail > acc ? tail : acc;
    }, 0);
    return `${prefix}-${year}-${String(refNumber(max)).padStart(5, "0")}`;
  }

  const repo = {
    // ----- read -----
    async listBranches() {
      const rows = await db.select().from(branches);
      return rows.map((r) => ({ ...r, availableServices: JSON.parse(r.availableServices) as string[] }));
    },
    async getBranch(idOrName: string) {
      const all = await this.listBranches();
      return all.find(
        (b) => b.id === idOrName || b.name === idOrName || b.city.toLowerCase() === idOrName.toLowerCase(),
      );
    },
    async listCustomers() {
      return db.select().from(customers);
    },
    async listVehicles() {
      return db.select().from(vehicles);
    },
    async getCustomerByPhone(phone: string) {
      const rows = await db.select().from(customers).where(eq(customers.phone, phone));
      return rows[0];
    },
    async getCustomer(idv: string) {
      const rows = await db.select().from(customers).where(eq(customers.id, idv));
      return rows[0];
    },
    async findOrCreateCustomer(input: { name: string; email: string; phone?: string }) {
      const byEmail = await db.select().from(customers).where(eq(customers.email, input.email));
      if (byEmail[0]) return byEmail[0];
      if (input.phone) {
        const byPhone = await db.select().from(customers).where(eq(customers.phone, input.phone));
        if (byPhone[0]) return byPhone[0];
      }
      const row = {
        id: id("cust"),
        name: input.name,
        email: input.email,
        phone: input.phone ?? "",
        conversationStatus: "ai_handling",
        createdAt: now(),
      };
      await db.insert(customers).values(row);
      return row;
    },
    async createVehicle(input: Omit<VehicleRecord, "id" | "createdAt">) {
      const row = { ...input, id: id("veh"), createdAt: now() };
      await db.insert(vehicles).values(row);
      return row;
    },

    async listAppointmentsDetailed(filter?: { status?: string; branchId?: string; query?: string }) {
      const rows = await db
        .select({
          appointment: appointments,
          customerName: sql<string>`${customers.name}`.as("customer_name"),
          customerEmail: sql<string>`${customers.email}`.as("customer_email"),
          customerPhone: sql<string>`${customers.phone}`.as("customer_phone"),
          branchName: sql<string>`${branches.name}`.as("branch_name"),
          branchAddress: sql<string>`${branches.address}`.as("branch_address"),
          branchPhone: sql<string>`${branches.phone}`.as("branch_phone"),
          branchHours: sql<string>`${branches.operatingHours}`.as("branch_hours"),
        })
        .from(appointments)
        .innerJoin(customers, eq(appointments.customerId, customers.id))
        .innerJoin(branches, eq(appointments.branchId, branches.id))
        .orderBy(desc(appointments.createdAt));
      let list: AppointmentDetail[] = rows.map((r) => ({
        ...r.appointment,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        customerPhone: r.customerPhone,
        branchName: r.branchName,
        branchAddress: r.branchAddress,
        branchPhone: r.branchPhone,
        branchHours: r.branchHours,
      }));
      if (filter?.status && filter.status !== "all") list = list.filter((a) => a.status === filter.status);
      if (filter?.branchId && filter.branchId !== "all") list = list.filter((a) => a.branchId === filter.branchId);
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        list = list.filter((a) =>
          [a.reference, a.customerName, a.vehicleInfo, a.branchName, a.serviceId].join(" ").toLowerCase().includes(q),
        );
      }
      return list;
    },
    async getAppointmentByReference(reference: string) {
      const all = await this.listAppointmentsDetailed();
      return all.find((a) => a.reference === reference);
    },
    async updateAppointmentStatus(idv: string, status: string) {
      await db.update(appointments).set({ status }).where(eq(appointments.id, idv));
      const rows = await db.select().from(appointments).where(eq(appointments.id, idv));
      return rows[0];
    },
    async updateAppointmentSchedule(idv: string, date: string, time: string) {
      await db.update(appointments).set({ date, time }).where(eq(appointments.id, idv));
      const rows = await db.select().from(appointments).where(eq(appointments.id, idv));
      return rows[0];
    },

    async createAppointment(input: BookingInput) {
      if (!VALID_SERVICES.has(input.serviceId)) throw new Error(`unknown service: ${input.serviceId}`);
      const branch = await this.getBranch(input.branchId);
      if (!branch) throw new Error(`unknown branch: ${input.branchId}`);

      let created!: AppointmentRecord;
      await runTx(client, db, url, async (tx) => {
        const txRepo = createRepository({ client, db: tx, url });
        const reference = await nextReference(tx, "AC", "appointments");
        const row = {
          id: id("appt"),
          reference,
          customerId: "",
          vehicleId: null as string | null,
          vehicleInfo: input.vehicleInfo ?? "",
          serviceId: input.serviceId,
          branchId: branch.id,
          location: input.location ?? "",
          date: input.date,
          time: input.time,
          status: "pending",
          notes: input.notes ?? "",
          createdAt: now(),
        };
        const customer = await txRepo.findOrCreateCustomer(input.customer);
        row.customerId = customer.id;
        if (input.vehicle?.make) {
          const veh = await txRepo.createVehicle({
            customerId: customer.id,
            make: input.vehicle.make ?? "",
            model: input.vehicle.model ?? "",
            year: input.vehicle.year ?? "",
            variant: input.vehicle.variant ?? "",
            plate: input.vehicle.plate ?? "",
            mileage: input.vehicle.mileage ?? "",
          });
          row.vehicleId = veh.id;
          if (!row.vehicleInfo) {
            row.vehicleInfo = [veh.make, veh.model, veh.year].filter(Boolean).join(" ") + (veh.plate ? ` (${veh.plate})` : "");
          }
        }
        await tx.insert(appointments).values(row);
        created = { ...row };
      });
      return created;
    },

    async listInquiriesDetailed(filter?: { status?: string; category?: string; priority?: string; query?: string }) {
      let rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
      if (filter?.status && filter.status !== "all") rows = rows.filter((i) => i.status === filter.status);
      if (filter?.category && filter.category !== "all") rows = rows.filter((i) => i.category === filter.category);
      if (filter?.priority && filter.priority !== "all") rows = rows.filter((i) => i.priority === filter.priority);
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        rows = rows.filter((i) =>
          [i.reference, i.customerName, i.subject, i.message].join(" ").toLowerCase().includes(q),
        );
      }
      return rows;
    },
    async getInquiry(reference: string) {
      const rows = await db.select().from(inquiries).where(eq(inquiries.reference, reference));
      return rows[0];
    },
    async getInquiryById(idv: string) {
      const rows = await db.select().from(inquiries).where(eq(inquiries.id, idv));
      return rows[0];
    },
    async createInquiry(input: {
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      vehicle?: string;
      subject: string;
      category: string;
      message?: string;
      priority?: string;
    }) {
      let created!: InquiryRecord;
      await runTx(client, db, url, async (tx) => {
        const txRepo = createRepository({ client, db: tx, url });
        const reference = await nextReference(tx, "QI", "inquiries");
        let customerId: string | null = null;
        if (input.customerEmail) {
          const c = await txRepo.findOrCreateCustomer({
            name: input.customerName,
            email: input.customerEmail,
            phone: input.customerPhone ?? "",
          });
          customerId = c.id;
        }
        const row = {
          id: id("inq"),
          reference,
          customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail ?? "",
          customerPhone: input.customerPhone ?? "",
          vehicle: input.vehicle ?? "",
          subject: input.subject,
          category: input.category,
          priority: input.priority ?? "medium",
          status: "new",
          message: input.message ?? "",
          triage: null,
          createdAt: now(),
        };
        await tx.insert(inquiries).values(row);
        created = row;
      });
      return created;
    },
    async updateInquiryStatus(idv: string, status: string) {
      await db.update(inquiries).set({ status }).where(eq(inquiries.id, idv));
      const rows = await db.select().from(inquiries).where(eq(inquiries.id, idv));
      return rows[0];
    },
    async updateInquiryPriority(idv: string, priority: string) {
      await db.update(inquiries).set({ priority }).where(eq(inquiries.id, idv));
    },
    async setInquiryTriage(idv: string, triageJson: string) {
      await db.update(inquiries).set({ triage: triageJson }).where(eq(inquiries.id, idv));
    },
    async setQuoteTriage(idv: string, triageJson: string) {
      await db.update(quotes).set({ triage: triageJson }).where(eq(quotes.id, idv));
    },

    async listQuotes(filter?: { status?: string }) {
      let rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
      if (filter?.status && filter.status !== "all") rows = rows.filter((q) => q.status === filter.status);
      return rows;
    },
    async createQuote(input: {
      customer: { name: string; email: string; phone?: string };
      serviceId: string;
      vehicle?: { make?: string; model?: string; year?: string; variant?: string };
      issue?: string;
      province?: string;
      city?: string;
      barangay?: string;
      address?: string;
      notes?: string;
    }) {
      if (!VALID_SERVICES.has(input.serviceId)) throw new Error(`unknown service: ${input.serviceId}`);
      let created!: QuoteRecord;
      await runTx(client, db, url, async (tx) => {
        const txRepo = createRepository({ client, db: tx, url });
        const customer = await txRepo.findOrCreateCustomer(input.customer);
        const reference = await nextReference(tx, "QT", "quotes");
        const row = {
          id: id("quote"),
          reference,
          customerId: customer.id,
          serviceId: input.serviceId,
          make: input.vehicle?.make ?? "",
          model: input.vehicle?.model ?? "",
          year: input.vehicle?.year ?? "",
          variant: input.vehicle?.variant ?? "",
          issue: input.issue ?? "",
          name: input.customer.name,
          phone: input.customer.phone ?? "",
          email: input.customer.email,
          province: input.province ?? "",
          city: input.city ?? "",
          barangay: input.barangay ?? "",
          address: input.address ?? "",
          notes: input.notes ?? "",
          status: "new",
          triage: null,
          createdAt: now(),
        };
        await tx.insert(quotes).values(row);
        created = row;
      });
      return created;
    },

    // ----- chat sessions -----
    parseSession(r: ChatSessionRecord): ChatSessionParsed {
      return {
        ...r,
        messages: JSON.parse(r.messages) as ChatMessage[],
        customerContext: JSON.parse(r.customerContext) as Record<string, unknown>,
      };
    },
    async listChatSessions() {
      const rows = await db.select().from(chatSessions).orderBy(desc(chatSessions.createdAt));
      return rows.map((r) => this.parseSession(r));
    },
    async getChatSession(idv: string) {
      const rows = await db.select().from(chatSessions).where(eq(chatSessions.id, idv));
      return rows[0] ? this.parseSession(rows[0]) : undefined;
    },
    async createChatSession(input: {
      id?: string;
      channel?: string;
      customerId?: string;
      customerName: string;
      customerPhone?: string;
      vehicle?: string;
      status?: string;
      conversationType?: string;
      priority?: string;
      messages: ChatMessage[];
      customerContext?: Record<string, unknown>;
    }) {
      const last = input.messages[input.messages.length - 1];
      const row = {
        id: input.id ?? id("chat"),
        channel: input.channel ?? "public",
        customerId: input.customerId ?? null,
        customerName: input.customerName,
        customerPhone: input.customerPhone ?? "",
        vehicle: input.vehicle ?? "",
        status: input.status ?? "ai_handling",
        assignedStaff: "",
        conversationType: input.conversationType ?? "ai",
        priority: input.priority ?? "normal",
        lastMessage: last?.content ?? "",
        lastMessageAt: last?.time ?? "",
        messages: JSON.stringify(input.messages),
        customerContext: JSON.stringify(input.customerContext ?? {}),
        createdAt: now(),
      };
      await db.insert(chatSessions).values(row);
      return this.parseSession(row);
    },
    async addChatMessage(sessionId: string, message: ChatMessage) {
      await runTx(client, db, url, async (tx) => {
        const rows = await tx.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
        if (!rows[0]) return;
        const messages = [...(JSON.parse(rows[0].messages) as ChatMessage[]), message];
        await tx
          .update(chatSessions)
          .set({ messages: JSON.stringify(messages), lastMessage: message.content, lastMessageAt: message.time })
          .where(eq(chatSessions.id, sessionId));
      });
      return this.getChatSession(sessionId);
    },

    // ----- agent audit -----
    async logAgentAction(input: {
      sessionId?: string;
      actorType?: string;
      toolName: string;
      input?: unknown;
      output?: unknown;
      success?: boolean;
    }) {
      const row = {
        id: id("act"),
        sessionId: input.sessionId ?? null,
        actorType: input.actorType ?? "ai",
        toolName: input.toolName,
        input: JSON.stringify(input.input ?? {}),
        output: JSON.stringify(input.output ?? {}),
        success: input.success === false ? 0 : 1,
        createdAt: now(),
      };
      await db.insert(agentActions).values(row);
      return row;
    },
    async listAgentActions() {
      return db.select().from(agentActions).orderBy(desc(agentActions.createdAt));
    },

    // ----- pending actions -----
    async createPendingAction(input: {
      sessionId?: string;
      action: string;
      payload?: unknown;
      expiresInMinutes?: number;
    }) {
      const row = {
        id: id("pend"),
        sessionId: input.sessionId ?? null,
        action: input.action,
        payload: JSON.stringify(input.payload ?? {}),
        status: "pending",
        expiresAt: new Date(Date.now() + (input.expiresInMinutes ?? 30) * 60_000).toISOString(),
        createdAt: now(),
      };
      await db.insert(pendingActions).values(row);
      return row;
    },
    async listPendingActions() {
      return db.select().from(pendingActions);
    },
    async getPendingAction(idv: string) {
      const rows = await db.select().from(pendingActions).where(eq(pendingActions.id, idv));
      return rows[0];
    },
    async resolvePendingAction(idv: string, status: string) {
      await db.update(pendingActions).set({ status }).where(eq(pendingActions.id, idv));
      const rows = await db.select().from(pendingActions).where(eq(pendingActions.id, idv));
      return rows[0];
    },

    // ----- availability -----
    /**
     * Availability is computed from real appointment records: each
     * (branch, date, time) slot has a fixed capacity, and a slot is
     * unavailable once that many active (non-cancelled) bookings exist.
     */
    async getAvailability(branchId?: string, serviceId?: string, range?: { from?: string; to?: string }) {
      const SLOT_CAPACITY = 2;
      const all = await this.listBranches();
      const targets = branchId ? all.filter((b) => b.id === branchId) : all;
      if (branchId && !targets.length) return [];
      const out: {
        branch: Omit<BranchRecord, "availableServices"> & { availableServices: string[] };
        days: { date: string; slots: { time: string; available: boolean }[] }[];
      }[] = [];
      for (const branch of targets) {
        if (serviceId && !branch.availableServices.includes(serviceId)) continue;
        const booked = await db
          .select()
          .from(appointments)
          .where(eq(appointments.branchId, branch.id));
        const takenBySlot = new Map<string, number>();
        for (const a of booked) {
          if (a.status === "cancelled") continue;
          const key = `${a.date}T${a.time}`;
          takenBySlot.set(key, (takenBySlot.get(key) ?? 0) + 1);
        }
        const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
        const days: { date: string; slots: { time: string; available: boolean }[] }[] = [];
        const fmt = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        // Date range: default tomorrow..+7 days; honour from/to when supplied,
        // bounded to 14 days of output.
        const start = range?.from ? new Date(`${range.from}T00:00:00`) : new Date(Date.now() + 86_400_000);
        const endLimit = range?.to
          ? new Date(`${range.to}T00:00:00`)
          : new Date(start.getTime() + 6 * 86_400_000);
        const day = new Date(start);
        for (let d = 0; d < 14 && day.getTime() <= endLimit.getTime(); d++) {
          const dateStr = fmt(day);
          if (day.getDay() !== 0) {
            days.push({
              date: dateStr,
              slots: times.map((t) => ({
                time: t,
                available: (takenBySlot.get(`${dateStr}T${t}`) ?? 0) < SLOT_CAPACITY,
              })),
            });
          }
          day.setTime(day.getTime() + 86_400_000);
        }
        out.push({ branch, days });
      }
      return out;
    },
    async countBooked(branchId: string, date: string, time: string, excludeId?: string) {
      const rows = await db.select().from(appointments).where(eq(appointments.branchId, branchId));
      return rows.filter(
        (a) => a.date === date && a.time === time && a.status !== "cancelled" && a.id !== excludeId,
      ).length;
    },
    // ----- summary / reset -----
    async getSummary() {
      const appts = await db.select().from(appointments);
      const inqs = await db.select().from(inquiries);
      const brs = await db.select().from(branches);
      return {
        branches: brs.length,
        appointments: {
          total: appts.length,
          pending: appts.filter((a) => a.status === "pending").length,
          confirmed: appts.filter((a) => a.status === "confirmed").length,
          completed: appts.filter((a) => a.status === "completed").length,
          cancelled: appts.filter((a) => a.status === "cancelled").length,
        },
        inquiries: {
          total: inqs.length,
          new: inqs.filter((i) => i.status === "new").length,
        },
      };
    },
    async resetData() {
      const { seedIfEmpty } = await import("./seed");
      await client.executeMultiple(`
        DELETE FROM pending_actions; DELETE FROM agent_actions; DELETE FROM chat_sessions;
        DELETE FROM quotes; DELETE FROM inquiries; DELETE FROM appointments;
        DELETE FROM vehicles; DELETE FROM customers; DELETE FROM branches;
      `);
      await seedIfEmpty(handle);
    },
  };
  REPO_HANDLES.set(repo, { client, db, url });
  return repo;
}

export type Repository = ReturnType<typeof createRepository>;

/**
 * Runs fn against a transaction-scoped repository — all writes commit
 * together or roll back together (libsql "write" transaction). Nested calls
 * become savepoints.
 */
export function withTransaction<T>(
  repo: Repository,
  fn: (txRepo: Repository) => Promise<T>,
): Promise<T> {
  const h = REPO_HANDLES.get(repo);
  if (!h) throw new Error("repository handle not found");
  return runTx(h.client, h.db, h.url, (tx) =>
    txScope.run(tx, () => fn(createRepository({ client: h.client, db: tx, url: h.url }))),
  );
}
