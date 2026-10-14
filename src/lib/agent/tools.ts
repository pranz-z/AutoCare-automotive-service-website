import { getArticles, getFaqs, getLocations, getService, getServices } from "@/lib/content";
import { currentTxDb, getDb } from "@/lib/db/client";
import { createRepository, withTransaction, type Repository } from "@/lib/db/repository";
import { APPOINTMENT_ACTIONS, INQUIRY_PRIORITIES } from "@/lib/admin/record-mutations";
import { triageSubmission, type TriageResult } from "./triage";
import {
  appointmentCard,
  availabilityCard,
  chatCard,
  customerCard,
  dashboardCard,
  inquiryCard,
  fmtDate,
} from "./cards";
import type { AgentCard, AgentContext, AgentRole, AgentTool, JsonSchema, ToolResult } from "./types";

/**
 * Tool registry for the agent runtime. All data access goes through the
 * real repository (src/lib/db) — no in-memory demo store.
 */

const EVERYONE: AgentRole[] = ["public", "staff", "manager", "admin"];
const STAFF: AgentRole[] = ["staff", "manager", "admin"];
const ADMIN: AgentRole[] = ["admin"];

async function repo(): Promise<Repository> {
  const h = await getDb();
  // Inside withTransaction, join the in-flight transaction scope.
  return createRepository({ client: h.client, db: currentTxDb() ?? h.db, url: h.url });
}

const ok = <T>(
  data: T,
  cards?: AgentCard[],
  quickReplies?: { label: string; message: string }[],
): ToolResult<T> => ({
  success: true,
  data,
  ...(cards?.length ? { cards } : {}),
  ...(quickReplies?.length ? { quickReplies } : {}),
});
const fail = (error: string): ToolResult => ({ success: false, error });

function cleanQuery(query: unknown): string | undefined {
  if (typeof query !== "string") return undefined;
  const q = query.trim().slice(0, 100);
  return /^[a-zA-Z0-9\s\-]*$/.test(q) ? q.toLowerCase() : undefined;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

const object = (properties: Record<string, JsonSchema>, required: string[] = []): JsonSchema => ({
  type: "object",
  properties,
  required,
});
const s = (description: string, extra: Partial<JsonSchema> = {}): JsonSchema => ({
  type: "string",
  ...extra,
});

// ---------- staff record-op helpers ----------

type InquiryRow = Awaited<ReturnType<Repository["listInquiriesDetailed"]>>[number];
type AppointmentRow = Awaited<ReturnType<Repository["listAppointmentsDetailed"]>>[number];

/** Bulk edit ceiling — one confirm card never covers more records than this. */
export const BULK_CAP = 20;

/** Words that mean "the record I have open" — resolved server-side, never guessed. */
const OPEN_WORDS = /^(this|current|open|it|that|the open)\b/i;

/**
 * Resolves a tool's record identifier. A bare/"this"-style value resolves to
 * the server-verified open record (type must match); a concrete value is used
 * as an internal id or display reference.
 */
function targetId(
  ctx: AgentContext,
  raw: unknown,
  kind: "appointment" | "inquiry",
): { id?: string; error?: string } {
  const v = str(raw).trim();
  if (!v || OPEN_WORDS.test(v)) {
    if (ctx.openRecord?.type === kind) return { id: ctx.openRecord.id };
    return {
      error: `Which ${kind}? Give its ID or reference — or open the record drawer and ask about "this ${kind}".`,
    };
  }
  return { id: v };
}

async function findInquiry(id: string): Promise<InquiryRow | undefined> {
  const rows = await (await repo()).listInquiriesDetailed();
  return rows.find((i) => i.id === id || i.reference === id.toUpperCase() || i.reference === id);
}

async function findAppointment(id: string): Promise<AppointmentRow | undefined> {
  const rows = await (await repo()).listAppointmentsDetailed();
  const up = id.toUpperCase();
  return rows.find((a) => a.id === id || a.reference === up || a.reference === id);
}

/** Per-record audit detail written inside the mutation's transaction. */
async function auditTool(
  r: Repository,
  ctx: AgentContext,
  toolName: string,
  input: unknown,
  output: unknown,
) {
  await r.logAgentAction({
    sessionId: ctx.sessionId,
    actorType: ctx.actor ? `${ctx.role}:${ctx.actor}` : ctx.role,
    toolName: `agent:${toolName}`,
    input,
    output,
    success: true,
  });
}

/**
 * Resolves the set of inquiries an operation targets: explicit id(s) — where a
 * lone "this"-style word resolves via the open record — unioned with an
 * optional status filter. Fails on any unmatched id (never skips silently)
 * and refuses sets over BULK_CAP.
 */
async function resolveInquiryTargets(
  ctx: AgentContext,
  input: Record<string, unknown>,
): Promise<{ rows: InquiryRow[] } | { error: string }> {
  const all = await (await repo()).listInquiriesDetailed();
  const wanted = new Map<string, InquiryRow>();
  const missing: string[] = [];

  let ids = [
    ...(input.id !== undefined ? [input.id] : []),
    ...(Array.isArray(input.ids) ? input.ids : []),
  ]
    .map((v) => str(v).trim())
    .filter(Boolean);
  if (ids.length === 1 && OPEN_WORDS.test(ids[0])) {
    if (ctx.openRecord?.type === "inquiry") ids = [ctx.openRecord.id];
    else {
      return {
        error: `Which inquiry? Give its ID or reference — or open the record drawer and say "this inquiry".`,
      };
    }
  }
  for (const v of ids) {
    const row = all.find((i) => i.id === v || i.reference === v || i.reference === v.toUpperCase());
    if (row) wanted.set(row.id, row);
    else missing.push(v);
  }
  const where = str(input.whereStatus);
  if (where) for (const row of all.filter((i) => i.status === where)) wanted.set(row.id, row);

  if (missing.length) {
    return { error: `No inquiry matches: ${[...new Set(missing)].join(", ")}` };
  }
  const rows = [...wanted.values()];
  if (!rows.length) {
    return { error: "No inquiries matched — pass an id, an ids list, or a whereStatus filter." };
  }
  if (rows.length > BULK_CAP) {
    return {
      error: `${rows.length} inquiries match — the limit is ${BULK_CAP} per action. Narrow the filter or pass explicit IDs.`,
    };
  }
  return { rows };
}

/** One-line list of references for summaries/previews, truncated for bulk. */
function refList(refs: string[]): string {
  return refs.length > 8 ? `${refs.slice(0, 8).join(", ")} +${refs.length - 8} more` : refs.join(", ");
}

/** Shared preview+apply for the reversible appointment status flips. */
function appointmentTransition(action: "confirm" | "in_service" | "complete") {
  const t = APPOINTMENT_ACTIONS[action];
  const label = action === "in_service" ? "mark in service" : action;
  return {
    async execute(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult> {
      const t0 = targetId(ctx, input.id, "appointment");
      if (t0.error) return fail(t0.error);
      const row = await findAppointment(t0.id!);
      if (!row) return fail("Appointment not found");
      if (!(t.from as readonly string[]).includes(row.status)) {
        return fail(`Cannot ${label} an appointment that is "${row.status}".`);
      }
      return ok({
        reference: row.reference,
        currentStatus: row.status,
        restores: [{ id: row.id, reference: row.reference, status: row.status }],
      });
    },
    async apply(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult> {
      const t0 = targetId(ctx, input.id, "appointment");
      if (t0.error) return fail(t0.error);
      const row = await findAppointment(t0.id!);
      if (!row) return fail("Appointment not found");
      if (!(t.from as readonly string[]).includes(row.status)) {
        return fail(`Cannot ${label} an appointment that is "${row.status}".`);
      }
      const r = await repo();
      await withTransaction(r, async (tx) => {
        await tx.updateAppointmentStatus(row.id, t.to);
        await auditTool(
          tx, ctx, `appointment.${action}`,
          { appointment: row.reference, from: row.status, to: t.to },
          { reference: row.reference, status: t.to },
        );
      });
      return ok(
        { reference: row.reference, status: t.to, previousStatus: row.status },
        [appointmentCard({ ...row, status: t.to }, true)],
      );
    },
    undo(_input: Record<string, unknown>, preview: unknown) {
      const restores = (preview as { restores?: { id: string; reference: string; status: string }[] } | undefined)?.restores;
      if (!restores?.length) return undefined;
      const r0 = restores[0];
      return {
        tool: "revert_appointment_status",
        args: { restores: restores.map(({ id, status }) => ({ id, status })) },
        summary: `Undo: restore ${r0.reference} to "${r0.status}"`,
      };
    },
  };
}

/** Shared preview+apply for a bulk-capable inquiry field update. */
function inquiryBulkUpdate(opts: {
  toolName: string;
  field: "status" | "priority";
  describe: (value: string, count: number, refs: string[]) => string;
  undoTool: string;
  write: (tx: Repository, id: string, value: string) => Promise<unknown>;
}) {
  const valueKey = opts.field;
  const blockedReason = (row: InquiryRow, value: string): string | undefined => {
    if (row.status === "closed") return `"${row.reference}" is closed`;
    if (valueKey === "status" && row.status === value) return `"${row.reference}" is already "${value}"`;
    if (valueKey === "priority" && row.priority === value) return `"${row.reference}" is already "${value}"`;
    return undefined;
  };
  return {
    async execute(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult> {
      const targets = await resolveInquiryTargets(ctx, input);
      if ("error" in targets) return fail(targets.error);
      const value = str(input[valueKey]);
      const blocked = targets.rows.map((i) => blockedReason(i, value)).filter(Boolean);
      if (blocked.length) return fail(`Skipped nothing — fix these first: ${blocked.join(", ")}`);
      const refs = targets.rows.map((i) => i.reference);
      // Multi-record sets and any status-filter sweep always confirm — even a
      // 1-row whereStatus match was bulk intent.
      const bulk = targets.rows.length > 1 || Boolean(str(input.whereStatus));
      return ok({
        count: targets.rows.length,
        requiresConfirm: bulk,
        summary: opts.describe(value, refs.length, refs),
        references: refs,
        restores: targets.rows.map((i) => ({ id: i.id, reference: i.reference, [valueKey]: i[valueKey] })),
      });
    },
    async apply(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult> {
      const targets = await resolveInquiryTargets(ctx, input);
      if ("error" in targets) return fail(targets.error);
      const value = str(input[valueKey]);
      const blocked = targets.rows.map((i) => blockedReason(i, value)).filter(Boolean);
      if (blocked.length) return fail(`Nothing applied — blocked: ${blocked.join(", ")}`);
      const r = await repo();
      await withTransaction(r, async (tx) => {
        for (const i of targets.rows) await opts.write(tx, i.id, value);
        await auditTool(
          tx, ctx, opts.toolName,
          { references: targets.rows.map((i) => i.reference), [valueKey]: value },
          { applied: targets.rows.length },
        );
      });
      return ok({ applied: targets.rows.length, references: targets.rows.map((i) => i.reference), [valueKey]: value });
    },
    undo(_input: Record<string, unknown>, preview: unknown) {
      const restores = (preview as { restores?: { id: string; reference: string }[] } | undefined)?.restores;
      if (!restores?.length) return undefined;
      return {
        tool: opts.undoTool,
        args: { restores: restores.map((r) => ({ id: r.id, [valueKey]: (r as Record<string, string>)[valueKey] })) },
        summary: `Undo: restore ${refList(restores.map((r) => r.reference))} to previous ${opts.field}`,
      };
    },
  };
}

const setInquiryStatus = inquiryBulkUpdate({
  toolName: "set_inquiry_status",
  field: "status",
  describe: (value, count, refs) =>
    count > 1 ? `Set ${count} inquiries to "${value}": ${refList(refs)}` : `Set inquiry ${refs[0]} to "${value}"`,
  undoTool: "revert_inquiry_status",
  write: (tx, id, value) => tx.updateInquiryStatus(id, value),
});

const setInquiryPriority = inquiryBulkUpdate({
  toolName: "set_inquiry_priority",
  field: "priority",
  describe: (value, count, refs) =>
    count > 1 ? `Set ${count} inquiries to "${value}" priority: ${refList(refs)}` : `Set inquiry ${refs[0]} to "${value}" priority`,
  undoTool: "revert_inquiry_priority",
  write: (tx, id, value) => tx.updateInquiryPriority(id, value),
});

/** Hidden revert tools — applied only through an Undo pending action. */
function revertTool(opts: {
  name: string;
  field: "status" | "priority";
  list: () => Promise<(InquiryRow | AppointmentRow)[]>;
  write: (tx: Repository, id: string, value: string) => Promise<unknown>;
}) {
  const parse = (input: Record<string, unknown>): { id: string; value: string }[] =>
    (Array.isArray(input.restores) ? input.restores : [])
      .map((r) => {
        const rec = r as Record<string, unknown>;
        return { id: str(rec.id), value: str(rec[opts.field] ?? rec.value) };
      })
      .filter((r) => r.id && r.value);
  return {
    name: opts.name,
    description: "Internal revert tool — runs only via an Undo confirmation",
    inputSchema: object({ restores: { type: "array", items: s("record restore entry") } }, ["restores"]),
    tier: "write" as const,
    hidden: true,
    roles: STAFF,
    summarize: () => "Restore previous values",
    async execute(_ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult> {
      const restores = parse(input);
      if (!restores.length) return fail("Nothing to restore");
      const rows = await opts.list();
      const missing = restores.filter((r) => !rows.some((row) => row.id === r.id)).map((r) => r.id);
      if (missing.length) return fail(`Records no longer exist: ${missing.join(", ")}`);
      return ok({ count: restores.length });
    },
    async apply(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult> {
      const restores = parse(input);
      if (!restores.length) return fail("Nothing to restore");
      const rows = await opts.list();
      const missing = restores.filter((r) => !rows.some((row) => row.id === r.id)).map((r) => r.id);
      if (missing.length) return fail(`Nothing restored — missing records: ${missing.join(", ")}`);
      const r = await repo();
      await withTransaction(r, async (tx) => {
        for (const rest of restores) await opts.write(tx, rest.id, rest.value);
        await auditTool(tx, ctx, opts.name, { restores }, { restored: restores.length });
      });
      return ok({ restored: restores.length });
    },
  } satisfies AgentTool;
}

export const agentTools: AgentTool[] = [
  // ---------- public read tools ----------
  {
    name: "search_services",
    description: "Search automotive services by name, description, or category",
    inputSchema: object({ query: s("Search term", { maxLength: 100 }), category: s("Service category") }),
    tier: "read",
    roles: EVERYONE,
    async execute(_ctx, input) {
      const query = cleanQuery(input.query);
      let results = getServices();
      const category = str(input.category);
      if (category) results = results.filter((i) => i.category.toLowerCase() === category.toLowerCase());
      if (input.query && !query) return fail("Invalid search query");
      if (query) {
        results = results.filter((i) =>
          [i.name, i.shortDescription, i.description].join(" ").toLowerCase().includes(query),
        );
      }
      return ok({
        results: results.slice(0, 10).map((i) => ({
          id: i.id, name: i.name, category: i.category, priceFrom: i.priceFrom,
          currency: i.currency, duration: i.duration, href: `/services/${i.slug}`,
        })),
        total: results.length,
      });
    },
  },
  {
    name: "search_locations",
    description: "Search service areas and branches by city or province",
    inputSchema: object({ query: s("Search term (city or province)", { maxLength: 100 }) }),
    tier: "read",
    roles: EVERYONE,
    async execute(_ctx, input) {
      const query = cleanQuery(input.query);
      if (input.query && !query) return fail("Invalid search query");
      let results = getLocations();
      if (query) {
        results = results.filter(
          (l) => l.province.toLowerCase().includes(query) || l.cities.some((c) => c.name.toLowerCase().includes(query)),
        );
      }
      return ok({
        results: results.slice(0, 10).map((l) => ({
          id: l.id, province: l.province, region: l.region,
          cities: l.cities.map((c) => ({ name: c.name, available: c.available })),
        })),
        total: results.length,
      });
    },
  },
  {
    name: "check_availability",
    description: "Check real appointment slot availability at branches for a service, optionally within a date range",
    inputSchema: object({
      branchId: s("Branch ID"),
      serviceId: s("Service ID"),
      date: s("Single date (YYYY-MM-DD)"),
      dateFrom: s("Range start (YYYY-MM-DD)"),
      dateTo: s("Range end (YYYY-MM-DD)"),
    }),
    tier: "read",
    roles: EVERYONE,
    async execute(ctx, input) {
      const branchId = str(input.branchId);
      const serviceId = str(input.serviceId);
      const date = str(input.date);
      const dateFrom = str(input.dateFrom);
      const dateTo = str(input.dateTo);
      for (const [label, value] of [["date", date], ["dateFrom", dateFrom], ["dateTo", dateTo]] as const) {
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail(`Invalid ${label} format (use YYYY-MM-DD)`);
      }
      if (serviceId && !getService(serviceId)) return fail("Service not found");
      if (branchId && !(await (await repo()).getBranch(branchId))) return fail("Branch not found");

      const availability = await (await repo()).getAvailability(
        branchId || undefined,
        serviceId || undefined,
        date ? { from: date, to: date } : { from: dateFrom || undefined, to: dateTo || undefined },
      );
      const branches = availability.map((entry) => ({
        branch: { id: entry.branch.id, name: entry.branch.name, city: entry.branch.city },
        slots: entry.days
          .flatMap((d) => d.slots.map((slot) => ({ date: d.date, ...slot })))
          .slice(0, 14),
      }));
      // Staff get tappable slot chips so a missing date/time is one tap, not a retype.
      const slotChips = STAFF.includes(ctx.role)
        ? branches
            .flatMap((b) => b.slots.filter((sl) => sl.available).map((sl) => ({ ...sl, branch: b.branch.name })))
            .slice(0, 3)
            .map((sl) => ({
              label: `${fmtDate(sl.date)} · ${sl.time} — ${sl.branch}`,
              message: `Use the ${sl.date} ${sl.time} slot at ${sl.branch}`,
            }))
        : undefined;
      return ok(
        { branches, note: "Availability is computed from current bookings (2 slots per time)." },
        branches
          .map((entry) => availabilityCard(entry))
          .filter((c): c is AgentCard => c !== null),
        slotChips,
      );
    },
  },
  {
    name: "get_branch_info",
    description: "Get details about a specific branch",
    inputSchema: object({ branchId: s("Branch ID") }, ["branchId"]),
    tier: "read",
    roles: EVERYONE,
    async execute(_ctx, input) {
      const branch = await (await repo()).getBranch(str(input.branchId));
      if (!branch) return fail("Branch not found");
      return ok({ ...branch, href: `/locations?branch=${branch.id}`, note: "Demo branch — synthetic data only" });
    },
  },
  {
    name: "search_faqs",
    description: "Search frequently asked questions",
    inputSchema: object({ query: s("Search term", { maxLength: 100 }) }),
    tier: "read",
    roles: EVERYONE,
    async execute(_ctx, input) {
      const query = cleanQuery(input.query);
      if (input.query && !query) return fail("Invalid search query");
      let results = getFaqs();
      if (query) {
        results = results.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(query));
      }
      return ok({ results: results.slice(0, 10).map((f) => ({ question: f.question, answer: f.answer })), total: results.length });
    },
  },
  {
    name: "search_articles",
    description: "Search blog articles and resources",
    inputSchema: object({ query: s("Search term", { maxLength: 100 }) }),
    tier: "read",
    roles: EVERYONE,
    async execute(_ctx, input) {
      const query = cleanQuery(input.query);
      if (input.query && !query) return fail("Invalid search query");
      let results = getArticles();
      if (query) {
        results = results.filter((a) => `${a.title} ${a.excerpt}`.toLowerCase().includes(query));
      }
      return ok({
        results: results.slice(0, 10).map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, href: `/resources/${a.slug}` })),
        total: results.length,
      });
    },
  },
  {
    name: "get_booking_status",
    description:
      "Look up a booking by reference. Requires the phone number or email on the booking for verification — never skip this check.",
    inputSchema: object(
      {
        reference: s("Booking reference (AC-YYYY-NNNNN)"),
        contact: s("Customer phone number or email on the booking"),
      },
      ["reference", "contact"],
    ),
    tier: "read",
    roles: EVERYONE,
    async execute(ctx, input) {
      const reference = str(input.reference).trim().toUpperCase();
      if (!/^AC-\d{4}-\d{5}$/.test(reference)) {
        return fail("Invalid reference format. Use AC-YYYY-NNNNN (e.g., AC-2025-00042)");
      }
      const appointment = await (await repo()).getAppointmentByReference(reference);
      if (!appointment) {
        return fail("No booking matches that reference and contact detail.");
      }
      const contact = str(input.contact).trim().toLowerCase();
      const digits = contact.replace(/\D/g, "");
      const emailMatch =
        contact.includes("@") && appointment.customerEmail.toLowerCase() === contact;
      const phoneMatch =
        digits.length >= 7 &&
        appointment.customerPhone.replace(/\D/g, "").endsWith(digits.slice(-10));
      if (!emailMatch && !phoneMatch) {
        return fail("No booking matches that reference and contact detail.");
      }
      const service = getService(appointment.serviceId);
      // Public callers get the card without an admin href; staff get the link.
      const card = appointmentCard(
        { ...appointment, serviceName: service?.name },
        STAFF.includes(ctx.role),
      );
      return ok(
        {
          verified: true,
          reference: appointment.reference,
          status: appointment.status,
          service: service?.name ?? appointment.serviceId,
          branch: appointment.branchName,
          date: appointment.date,
          time: appointment.time,
          vehicle: appointment.vehicleInfo,
        },
        [card],
      );
    },
  },
  {
    name: "find_service",
    description: "Find the best-matching published service for a described need or symptom (grounded in the service catalog)",
    inputSchema: object({ query: s("Need or symptom, e.g. 'squeaky brakes'", { maxLength: 160 }) }, ["query"]),
    tier: "read",
    roles: EVERYONE,
    async execute(_ctx, input) {
      const query = str(input.query).trim().toLowerCase();
      if (!query) return fail("Missing query");
      const words = query.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const scored = getServices()
        .map((svc) => {
          const haystack = `${svc.id} ${svc.slug} ${svc.name} ${svc.category} ${svc.shortDescription} ${svc.description}`.toLowerCase();
          let score = 0;
          if (svc.id === query || svc.slug === query) score += 100;
          if (svc.name.toLowerCase().includes(query)) score += 40;
          if (svc.category.toLowerCase().includes(query)) score += 15;
          for (const w of words) {
            if (haystack.includes(w) || haystack.includes(w.replace(/s$/, ""))) score += 3;
          }
          return { svc, score };
        })
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best || best.score === 0) {
        return ok({
          match: null,
          suggestions: getServices().slice(0, 3).map((sv) => ({ id: sv.id, name: sv.name, category: sv.category })),
          message: "No service matched; suggest these catalog options.",
        });
      }
      const { svc } = best;
      return ok({
        match: {
          id: svc.id, name: svc.name, category: svc.category,
          description: svc.shortDescription, priceFrom: svc.priceFrom, currency: svc.currency,
          duration: svc.duration, href: `/services/${svc.slug}`,
        },
        alternatives: scored.slice(1, 3).filter((r) => r.score > 0).map((r) => ({ id: r.svc.id, name: r.svc.name })),
      });
    },
  },

  // ---------- staff read tools ----------
  {
    name: "search_appointments",
    description: "Search appointment records",
    inputSchema: object({
      query: s("Search by reference, customer, or vehicle", { maxLength: 100 }),
      status: s("Filter by status", { enum: ["pending", "confirmed", "in_service", "completed", "cancelled"] }),
      branchId: s("Filter by branch"),
    }),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const query = cleanQuery(input.query);
      if (input.query && !query) return fail("Invalid search query");
      const rows = await (await repo()).listAppointmentsDetailed({
        status: str(input.status) || undefined,
        branchId: str(input.branchId) || undefined,
        query,
      });
      return ok(
        {
          results: rows.slice(0, 20).map((a) => ({
            id: a.id, reference: a.reference, customerName: a.customerName, vehicle: a.vehicleInfo,
            serviceId: a.serviceId, branch: a.branchName, date: a.date, time: a.time,
            status: a.status, createdAt: a.createdAt,
          })),
          total: rows.length,
        },
        rows.slice(0, 8).map((a) => appointmentCard(a, STAFF.includes(ctx.role))),
      );
    },
  },
  {
    name: "get_appointment_detail",
    description: "Get full appointment details by ID or reference",
    inputSchema: object({ id: s("Appointment ID or reference") }, ["id"]),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const wanted = str(input.id);
      const rows = await (await repo()).listAppointmentsDetailed();
      const appointment = rows.find((a) => a.id === wanted || a.reference === wanted);
      if (!appointment) return fail("Appointment not found");
      const serviceName = getService(appointment.serviceId)?.name;
      return ok(
        { ...appointment, serviceName },
        [appointmentCard({ ...appointment, serviceName }, STAFF.includes(ctx.role))],
      );
    },
  },
  {
    name: "search_inquiries",
    description: "Search quote inquiries and contact messages",
    inputSchema: object({
      query: s("Search by reference, customer, or message", { maxLength: 100 }),
      status: s("Filter by status", { enum: ["new", "reviewed", "responded", "resolved", "closed"] }),
      category: s("Filter by category", { enum: ["quote", "booking", "general", "complaint", "branch"] }),
      priority: s("Filter by priority", { enum: ["low", "medium", "high", "urgent"] }),
    }),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const query = cleanQuery(input.query);
      if (input.query && !query) return fail("Invalid search query");
      const rows = await (await repo()).listInquiriesDetailed({
        status: str(input.status) || undefined,
        category: str(input.category) || undefined,
        priority: str(input.priority) || undefined,
        query,
      });
      return ok(
        {
          results: rows.slice(0, 20).map((i) => ({
            id: i.id, reference: i.reference, customerName: i.customerName, subject: i.subject,
            category: i.category, priority: i.priority, status: i.status, createdAt: i.createdAt,
          })),
          total: rows.length,
        },
        rows.slice(0, 8).map((i) => inquiryCard(i, STAFF.includes(ctx.role))),
      );
    },
  },
  {
    name: "get_inquiry_detail",
    description: "Get full inquiry details by ID or reference",
    inputSchema: object({ id: s("Inquiry ID or reference") }, ["id"]),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const wanted = str(input.id);
      const rows = await (await repo()).listInquiriesDetailed();
      const inquiry = rows.find((i) => i.id === wanted || i.reference === wanted);
      return inquiry ? ok(inquiry, [inquiryCard(inquiry, STAFF.includes(ctx.role))]) : fail("Inquiry not found");
    },
  },
  {
    name: "search_customers",
    description: "Search customer records by name, email, vehicle, or plate",
    inputSchema: object({ query: s("Search term", { maxLength: 100 }) }),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const query = cleanQuery(input.query);
      if (input.query && !query) return fail("Invalid search query");
      const [customers, vehicles] = await Promise.all([(await repo()).listCustomers(), (await repo()).listVehicles()]);
      const vehicleByCustomer = new Map<string, string>();
      for (const v of vehicles) {
        if (!vehicleByCustomer.has(v.customerId)) {
          vehicleByCustomer.set(v.customerId, `${v.make} ${v.model} ${v.year} ${v.plate}`.trim());
        }
      }
      let results = customers.map((c) => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        vehicle: vehicleByCustomer.get(c.id) ?? "", createdAt: c.createdAt,
      }));
      if (query) {
        results = results.filter((c) => [c.name, c.email, c.phone, c.vehicle].join(" ").toLowerCase().includes(query));
      }
      return ok(
        { results: results.slice(0, 20), total: results.length },
        results.slice(0, 8).map((c) => customerCard(c, STAFF.includes(ctx.role))),
      );
    },
  },
  {
    name: "get_customer_detail",
    description: "Get a customer record with recent appointments",
    inputSchema: object({ id: s("Customer ID") }, ["id"]),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const customers = await (await repo()).listCustomers();
      const customer = customers.find((c) => c.id === str(input.id));
      if (!customer) return fail("Customer not found");
      const rows = await (await repo()).listAppointmentsDetailed();
      const recentAppointments = rows
        .filter((a) => a.customerId === customer.id)
        .slice(0, 5)
        .map((a) => ({ reference: a.reference, serviceId: a.serviceId, date: a.date, status: a.status }));
      const vehicles = await (await repo()).listVehicles();
      const vehicle = vehicles.find((v) => v.customerId === customer.id);
      return ok(
        { ...customer, recentAppointments },
        [customerCard({ ...customer, vehicle: vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.plate}`.trim() : "" }, STAFF.includes(ctx.role))],
      );
    },
  },
  {
    name: "get_dashboard_summary",
    description: "Get dashboard summary counts for branches, appointments, and inquiries",
    inputSchema: object({}),
    tier: "read",
    roles: STAFF,
    async execute() {
      const summary = await (await repo()).getSummary();
      return ok(summary, [dashboardCard(summary)]);
    },
  },

  // ---------- staff record ops ----------
  // Direct tier: low-risk flips execute immediately and auto-stage an Undo.
  // ids[]/whereStatus (bulk) or any customer-touching change stays confirm-gated.
  {
    name: "set_inquiry_status",
    description:
      "Set inquiry status to new/contacted/resolved. Pass one id (or 'this' for the open record), ids[] for a named list, or whereStatus to target every inquiry in a status. Single changes apply immediately with an Undo option; multi-record changes stage one confirmation listing every record.",
    inputSchema: object(
      {
        id: s("Inquiry ID or reference — or 'this' for the open record"),
        ids: { type: "array", items: s("Inquiry ID or reference") },
        whereStatus: s("Target every inquiry currently in this status", {
          enum: ["new", "contacted", "reviewed", "responded", "resolved", "closed"],
        }),
        status: s("New status", { enum: ["new", "contacted", "resolved"] }),
      },
      ["status"],
    ),
    tier: "direct",
    roles: STAFF,
    ...setInquiryStatus,
  },
  {
    name: "set_inquiry_priority",
    description:
      "Set inquiry priority (low/normal/medium/high/urgent). Same targeting as set_inquiry_status — 'this', ids[], or whereStatus; single applies with Undo, multi stages one confirmation.",
    inputSchema: object(
      {
        id: s("Inquiry ID or reference — or 'this' for the open record"),
        ids: { type: "array", items: s("Inquiry ID or reference") },
        whereStatus: s("Target every inquiry currently in this status", {
          enum: ["new", "contacted", "reviewed", "responded", "resolved", "closed"],
        }),
        priority: s("New priority", { enum: [...INQUIRY_PRIORITIES] }),
      },
      ["priority"],
    ),
    tier: "direct",
    roles: STAFF,
    ...setInquiryPriority,
  },
  {
    name: "approve_draft_reply",
    description:
      "Approve the stored AI draft reply on an inquiry — stamps approval only, sends nothing. Requires confirmation.",
    inputSchema: object({ id: s("Inquiry ID or reference — or 'this' for the open record") }, ["id"]),
    tier: "write",
    roles: STAFF,
    summarize: (input) => `Approve the draft reply on inquiry ${str(input.id)}`,
    async execute(ctx, input) {
      const t = targetId(ctx, input.id, "inquiry");
      if (t.error) return fail(t.error);
      const row = await findInquiry(t.id!);
      if (!row) return fail("Inquiry not found");
      let triage: { draftReply?: string; draftApprovedAt?: string } = {};
      try { triage = row.triage ? (JSON.parse(row.triage) as typeof triage) : {}; } catch { /* malformed */ }
      if (!triage.draftReply) return fail("No draft reply stored on this inquiry");
      if (triage.draftApprovedAt) return fail("Draft reply was already approved");
      return ok({ reference: row.reference, draftPreview: triage.draftReply.slice(0, 160) });
    },
    async apply(ctx, input) {
      const t = targetId(ctx, input.id, "inquiry");
      if (t.error) return fail(t.error);
      const row = await findInquiry(t.id!);
      if (!row) return fail("Inquiry not found");
      let triage: { draftReply?: string; draftApprovedAt?: string } = {};
      try { triage = row.triage ? (JSON.parse(row.triage) as typeof triage) : {}; } catch { /* malformed */ }
      if (!triage.draftReply) return fail("No draft reply stored on this inquiry");
      if (triage.draftApprovedAt) return fail("Draft reply was already approved");
      triage.draftApprovedAt = new Date().toISOString();
      const r = await repo();
      await withTransaction(r, async (tx) => {
        await tx.setInquiryTriage(row.id, JSON.stringify(triage));
        await auditTool(tx, ctx, "approve_draft_reply", { inquiry: row.reference }, { approved: true });
      });
      return ok({ reference: row.reference, approved: true }, [inquiryCard(row, true)]);
    },
  },
  {
    name: "convert_inquiry_to_appointment",
    description:
      "Convert an inquiry into a booking: needs serviceId, branchId, date, time. Checks slot availability first and requires confirmation.",
    inputSchema: object(
      {
        id: s("Inquiry ID or reference — or 'this' for the open record"),
        serviceId: s("Service ID"),
        branchId: s("Branch ID"),
        date: s("Date (YYYY-MM-DD)"),
        time: s("Time (HH:MM, 24h)"),
      },
      ["id", "serviceId", "branchId", "date", "time"],
    ),
    tier: "write",
    roles: STAFF,
    summarize: (input) =>
      `Convert inquiry ${str(input.id)} into a ${str(input.serviceId)} booking at ${str(input.branchId)} on ${str(input.date)} ${str(input.time)}`,
    async execute(ctx, input) {
      const t = targetId(ctx, input.id, "inquiry");
      if (t.error) return fail(t.error);
      const row = await findInquiry(t.id!);
      if (!row) return fail("Inquiry not found");
      if (row.status === "closed" || row.status === "resolved") {
        return fail(`Cannot convert an inquiry that is "${row.status}".`);
      }
      if (!getService(str(input.serviceId))) return fail("Service not found");
      const branch = await (await repo()).getBranch(str(input.branchId));
      if (!branch) return fail("Branch not found");
      const date = str(input.date);
      const time = str(input.time);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Invalid date format (use YYYY-MM-DD)");
      if (!/^\d{2}:\d{2}$/.test(time)) return fail("Invalid time format (use HH:MM)");
      const taken = await (await repo()).countBooked(branch.id, date, time);
      if (taken >= 2) return fail(`Slot ${date} ${time} is fully booked at ${branch.name} — pick another`);
      return ok({ reference: row.reference, service: getService(str(input.serviceId))!.name, branch: branch.name });
    },
    async apply(ctx, input) {
      const t = targetId(ctx, input.id, "inquiry");
      if (t.error) return fail(t.error);
      const row = await findInquiry(t.id!);
      if (!row) return fail("Inquiry not found");
      if (row.status === "closed" || row.status === "resolved") {
        return fail(`Cannot convert an inquiry that is "${row.status}".`);
      }
      const branch = await (await repo()).getBranch(str(input.branchId));
      if (!branch) return fail("Branch not found");
      const taken = await (await repo()).countBooked(branch.id, str(input.date), str(input.time));
      if (taken >= 2) return fail(`Slot ${str(input.date)} ${str(input.time)} is now fully booked`);
      const r = await repo();
      const appt = await withTransaction(r, async (tx) => {
        const created = await tx.createAppointment({
          customer: {
            name: row.customerName,
            email: row.customerEmail || "unknown@example.invalid",
            phone: row.customerPhone || "n/a",
          },
          vehicleInfo: row.vehicle,
          serviceId: str(input.serviceId),
          branchId: branch.id,
          date: str(input.date),
          time: str(input.time),
          notes: `Converted from inquiry ${row.reference}: ${row.subject}`,
        });
        await tx.updateInquiryStatus(row.id, "resolved");
        await auditTool(
          tx, ctx, "convert_inquiry_to_appointment",
          { inquiry: row.reference, serviceId: input.serviceId, branchId: branch.id, date: input.date, time: input.time },
          { appointment: created.reference, inquiryResolved: row.reference },
        );
        return created;
      });
      return ok({ appointment: appt.reference, inquiry: row.reference, status: "resolved" }, [appointmentCard({ ...appt, branchName: branch.name }, true)]);
    },
  },
  {
    name: "confirm_appointment",
    description: "Confirm a pending or rescheduled appointment — applies immediately with an Undo option.",
    inputSchema: object({ id: s("Appointment ID or reference — or 'this' for the open record") }, ["id"]),
    tier: "direct",
    roles: STAFF,
    ...appointmentTransition("confirm"),
  },
  {
    name: "mark_in_service",
    description: "Mark a pending/confirmed appointment as in service — applies immediately with an Undo option.",
    inputSchema: object({ id: s("Appointment ID or reference — or 'this' for the open record") }, ["id"]),
    tier: "direct",
    roles: STAFF,
    ...appointmentTransition("in_service"),
  },
  {
    name: "complete_appointment",
    description: "Mark an in-service appointment completed — applies immediately with an Undo option.",
    inputSchema: object({ id: s("Appointment ID or reference — or 'this' for the open record") }, ["id"]),
    tier: "direct",
    roles: STAFF,
    ...appointmentTransition("complete"),
  },
  {
    name: "cancel_appointment",
    description: "Cancel an appointment — requires confirmation.",
    inputSchema: object(
      {
        id: s("Appointment ID or reference — or 'this' for the open record"),
        reason: s("Cancellation reason", { maxLength: 200 }),
      },
      ["id"],
    ),
    tier: "write",
    roles: STAFF,
    summarize: (input) => `Cancel appointment ${str(input.id)}`,
    async execute(ctx, input) {
      const t = targetId(ctx, input.id, "appointment");
      if (t.error) return fail(t.error);
      const row = await findAppointment(t.id!);
      if (!row) return fail("Appointment not found");
      const tdef = APPOINTMENT_ACTIONS.cancel;
      if (!(tdef.from as readonly string[]).includes(row.status)) {
        return fail(`Cannot cancel an appointment that is "${row.status}".`);
      }
      return ok({ reference: row.reference, currentStatus: row.status, date: row.date, time: row.time });
    },
    async apply(ctx, input) {
      const t = targetId(ctx, input.id, "appointment");
      if (t.error) return fail(t.error);
      const row = await findAppointment(t.id!);
      if (!row) return fail("Appointment not found");
      const tdef = APPOINTMENT_ACTIONS.cancel;
      if (!(tdef.from as readonly string[]).includes(row.status)) {
        return fail(`Cannot cancel an appointment that is "${row.status}".`);
      }
      const r = await repo();
      await withTransaction(r, async (tx) => {
        await tx.updateAppointmentStatus(row.id, "cancelled");
        await auditTool(
          tx, ctx, "cancel_appointment",
          { appointment: row.reference, from: row.status, reason: str(input.reason) },
          { reference: row.reference, status: "cancelled" },
        );
      });
      return ok({ reference: row.reference, status: "cancelled" }, [appointmentCard({ ...row, status: "cancelled" }, true)]);
    },
  },
  {
    name: "reschedule_appointment",
    description: "Move an appointment to a new date/time — checks availability, requires confirmation.",
    inputSchema: object(
      {
        id: s("Appointment ID or reference — or 'this' for the open record"),
        date: s("New date (YYYY-MM-DD)"),
        time: s("New time (HH:MM, 24h)"),
        reason: s("Reason", { maxLength: 200 }),
      },
      ["id", "date", "time"],
    ),
    tier: "write",
    roles: STAFF,
    summarize: (input) => `Reschedule ${str(input.id)} to ${str(input.date)} ${str(input.time)}`,
    async execute(ctx, input) {
      const t = targetId(ctx, input.id, "appointment");
      if (t.error) return fail(t.error);
      const row = await findAppointment(t.id!);
      if (!row) return fail("Appointment not found");
      const tdef = APPOINTMENT_ACTIONS.reschedule;
      if (!(tdef.from as readonly string[]).includes(row.status)) {
        return fail(`Cannot reschedule an appointment that is "${row.status}".`);
      }
      const date = str(input.date);
      const time = str(input.time);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Invalid date format (use YYYY-MM-DD)");
      if (!/^\d{2}:\d{2}$/.test(time)) return fail("Invalid time format (use HH:MM)");
      const taken = await (await repo()).countBooked(row.branchId, date, time, row.id);
      if (taken >= 2) return fail(`Slot ${date} ${time} is fully booked at that branch — pick another`);
      return ok({ reference: row.reference, current: `${row.date} ${row.time}`, requested: `${date} ${time}` });
    },
    async apply(ctx, input) {
      const t = targetId(ctx, input.id, "appointment");
      if (t.error) return fail(t.error);
      const row = await findAppointment(t.id!);
      if (!row) return fail("Appointment not found");
      const tdef = APPOINTMENT_ACTIONS.reschedule;
      if (!(tdef.from as readonly string[]).includes(row.status)) {
        return fail(`Cannot reschedule an appointment that is "${row.status}".`);
      }
      const date = str(input.date);
      const time = str(input.time);
      const taken = await (await repo()).countBooked(row.branchId, date, time, row.id);
      if (taken >= 2) return fail(`Slot ${date} ${time} is now fully booked`);
      const r = await repo();
      await withTransaction(r, async (tx) => {
        await tx.updateAppointmentSchedule(row.id, date, time);
        await tx.updateAppointmentStatus(row.id, tdef.to);
        await auditTool(
          tx, ctx, "reschedule_appointment",
          { appointment: row.reference, from: row.status, date, time, reason: str(input.reason) },
          { reference: row.reference, date, time, status: tdef.to },
        );
      });
      const updated = { ...row, date, time, status: tdef.to };
      return ok({ reference: row.reference, date, time, status: tdef.to }, [appointmentCard(updated, true)]);
    },
  },
  // Hidden revert tools — reachable only through an Undo pending action.
  revertTool({
    name: "revert_inquiry_status",
    field: "status",
    list: () => repo().then((r) => r.listInquiriesDetailed()),
    write: (tx, id, value) => tx.updateInquiryStatus(id, value),
  }),
  revertTool({
    name: "revert_inquiry_priority",
    field: "priority",
    list: () => repo().then((r) => r.listInquiriesDetailed()),
    write: (tx, id, value) => tx.updateInquiryPriority(id, value),
  }),
  revertTool({
    name: "revert_appointment_status",
    field: "status",
    list: () => repo().then((r) => r.listAppointmentsDetailed()),
    write: (tx, id, value) => tx.updateAppointmentStatus(id, value),
  }),
  {
    name: "create_booking",
    description: "Create a booking on behalf of a customer (requires staff confirmation)",
    inputSchema: object(
      {
        customerName: s("Customer full name"),
        customerEmail: s("Customer email"),
        customerPhone: s("Customer phone"),
        vehicleInfo: s("Vehicle description, e.g. 'Toyota Vios 2020 (ABC 1234)'"),
        serviceId: s("Service ID"),
        branchId: s("Branch ID"),
        date: s("Date (YYYY-MM-DD)"),
        time: s("Time (HH:MM, 24h)"),
        notes: s("Optional notes", { maxLength: 300 }),
      },
      ["customerName", "customerEmail", "vehicleInfo", "serviceId", "branchId", "date", "time"],
    ),
    tier: "write",
    roles: STAFF,
    summarize: (input) =>
      `Book ${str(input.serviceId)} for ${str(input.customerName)} at ${str(input.branchId)} on ${str(input.date)} ${str(input.time)}`,
    async execute(_ctx, input) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str(input.date))) return fail("Invalid date format (use YYYY-MM-DD)");
      if (!/^\d{2}:\d{2}$/.test(str(input.time))) return fail("Invalid time format (use HH:MM)");
      if (!getService(str(input.serviceId))) return fail("Service not found");
      const branch = await (await repo()).getBranch(str(input.branchId));
      if (!branch) return fail("Branch not found");
      return ok({ branchName: branch.name });
    },
    async apply(_ctx, input) {
      const appointment = await (await repo()).createAppointment({
        customer: { name: str(input.customerName), email: str(input.customerEmail), phone: str(input.customerPhone) },
        vehicleInfo: str(input.vehicleInfo),
        serviceId: str(input.serviceId),
        branchId: str(input.branchId),
        date: str(input.date),
        time: str(input.time),
        notes: str(input.notes),
      });
      return ok({ reference: appointment.reference, status: appointment.status });
    },
  },

  {
    name: "create_quote_request",
    description: "Create a quote request on behalf of a customer (requires staff confirmation)",
    inputSchema: object(
      {
        customerName: s("Customer full name"),
        customerEmail: s("Customer email"),
        customerPhone: s("Customer phone"),
        serviceId: s("Service ID"),
        vehicleMake: s("Vehicle make"),
        vehicleModel: s("Vehicle model"),
        vehicleYear: s("Vehicle year"),
        issue: s("Described issue or requested work", { maxLength: 500 }),
      },
      ["customerName", "customerEmail", "serviceId"],
    ),
    tier: "write",
    roles: STAFF,
    summarize: (input) => `Create quote request for ${str(input.customerName)} — ${str(input.serviceId)}`,
    async execute(_ctx, input) {
      if (!getService(str(input.serviceId))) return fail("Service not found");
      const email = str(input.customerEmail);
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Invalid email");
      return ok({ serviceName: getService(str(input.serviceId))?.name });
    },
    async apply(_ctx, input) {
      const quote = await (await repo()).createQuote({
        customer: {
          name: str(input.customerName),
          email: str(input.customerEmail),
          phone: str(input.customerPhone),
        },
        serviceId: str(input.serviceId),
        vehicle: {
          make: str(input.vehicleMake),
          model: str(input.vehicleModel),
          year: str(input.vehicleYear),
        },
        issue: str(input.issue),
      });
      return ok({ reference: quote.reference, status: quote.status });
    },
  },
  {
    name: "create_inquiry",
    description: "Record a new inquiry on behalf of a customer (requires staff confirmation)",
    inputSchema: object(
      {
        customerName: s("Customer full name"),
        customerEmail: s("Customer email"),
        customerPhone: s("Customer phone"),
        subject: s("Subject", { maxLength: 160 }),
        category: s("Category", { enum: ["quote", "booking", "general", "complaint", "branch"] }),
        message: s("Message", { maxLength: 2000 }),
      },
      ["customerName", "subject", "category"],
    ),
    tier: "write",
    roles: STAFF,
    summarize: (input) => `Create ${str(input.category)} inquiry "${str(input.subject)}" for ${str(input.customerName)}`,
    async execute() {
      return ok({});
    },
    async apply(_ctx, input) {
      const inquiry = await (await repo()).createInquiry({
        customerName: str(input.customerName),
        customerEmail: str(input.customerEmail),
        customerPhone: str(input.customerPhone),
        subject: str(input.subject),
        category: str(input.category),
        message: str(input.message),
      });
      return ok({ reference: inquiry.reference, status: inquiry.status });
    },
  },

  // ---------- admin-agent tools (/admin assistant) ----------
  {
    name: "triage_inquiry",
    description: "Run triage analysis on an inquiry: urgency, suggested service, rationale, and a draft reply",
    inputSchema: object({ id: s("Inquiry ID or reference") }, ["id"]),
    tier: "read",
    roles: STAFF,
    async execute(_ctx, input) {
      const rows = await (await repo()).listInquiriesDetailed();
      const inquiry = rows.find((i) => i.id === str(input.id) || i.reference === str(input.id));
      if (!inquiry) return fail("Inquiry not found");
      if (inquiry.triage) {
        try {
          const stored = JSON.parse(inquiry.triage) as TriageResult;
          return ok({ reference: inquiry.reference, stored: true, ...stored });
        } catch { /* fall through to fresh analysis */ }
      }
      const triage = triageSubmission({
        customerName: inquiry.customerName,
        subject: inquiry.subject,
        message: inquiry.message,
        vehicle: inquiry.vehicle,
      });
      return ok({ reference: inquiry.reference, stored: false, ...triage });
    },
  },
  {
    name: "draft_reply",
    description: "Draft a customer-facing reply for an inquiry or quote request",
    inputSchema: object({ id: s("Inquiry or quote ID/reference") }, ["id"]),
    tier: "read",
    roles: STAFF,
    async execute(_ctx, input) {
      const wanted = str(input.id);
      const inquiries = await (await repo()).listInquiriesDetailed();
      const inquiry = inquiries.find((i) => i.id === wanted || i.reference === wanted);
      if (inquiry) {
        let draft: string | undefined;
        if (inquiry.triage) {
          try { draft = (JSON.parse(inquiry.triage) as TriageResult).draftReply; } catch { /* recompute */ }
        }
        if (!draft) {
          draft = triageSubmission({
            customerName: inquiry.customerName,
            subject: inquiry.subject,
            message: inquiry.message,
            vehicle: inquiry.vehicle,
          }).draftReply;
        }
        return ok({ reference: inquiry.reference, kind: "inquiry", draft });
      }
      const quote = (await (await repo()).listQuotes()).find((q) => q.id === wanted || q.reference === wanted);
      if (quote) {
        let draft: string | undefined;
        if (quote.triage) {
          try { draft = (JSON.parse(quote.triage) as TriageResult).draftReply; } catch { /* recompute */ }
        }
        if (!draft) {
          const service = getService(quote.serviceId);
          draft = triageSubmission({
            customerName: quote.name,
            subject: `Quote request: ${service?.name ?? quote.serviceId}`,
            message: quote.issue,
            vehicle: `${quote.make} ${quote.model} ${quote.year}`.trim(),
          }).draftReply;
        }
        return ok({ reference: quote.reference, kind: "quote", draft });
      }
      return fail("No inquiry or quote matches that ID.");
    },
  },
  {
    name: "summarize_conversation",
    description: "Summarize a stored chat session transcript",
    inputSchema: object({ sessionId: s("Chat session ID") }, ["sessionId"]),
    tier: "read",
    roles: STAFF,
    async execute(ctx, input) {
      const session = await (await repo()).getChatSession(str(input.sessionId));
      if (!session) return fail("Conversation not found");
      const msgs = session.messages;
      const bySender = msgs.reduce<Record<string, number>>((acc, m) => {
        acc[m.sender] = (acc[m.sender] ?? 0) + 1;
        return acc;
      }, {});
      const firstUser = msgs.find((m) => m.sender === "customer")?.content ?? "";
      return ok(
        {
          sessionId: session.id,
          channel: session.channel,
          customer: session.customerName,
          messageCount: msgs.length,
          bySender,
          startedAt: session.createdAt,
          lastMessageAt: session.lastMessageAt ?? session.createdAt,
          openingRequest: firstUser.slice(0, 200),
          summary:
            `${msgs.length} messages in a ${session.channel} conversation with ${session.customerName}. ` +
            `Opening request: "${firstUser.slice(0, 120)}".`,
        },
        [chatCard({ ...session, messageCount: msgs.length }, STAFF.includes(ctx.role))],
      );
    },
  },
  {
    name: "daily_brief",
    description: "Today's operations brief: appointments, open inquiries, new quotes, pending approvals",
    inputSchema: object({}),
    tier: "read",
    roles: STAFF,
    async execute(ctx) {
      const r = await repo();
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const [appointments, inquiries, quotes, pending] = await Promise.all([
        r.listAppointmentsDetailed(),
        r.listInquiriesDetailed(),
        r.listQuotes(),
        r.listPendingActions(),
      ]);
      const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "cancelled");
      const openInquiries = inquiries.filter((i) => !["resolved", "closed"].includes(i.status));
      const newQuotes = quotes.filter((q) => q.status === "new");
      const awaitingApproval = pending.filter((p) => p.status === "pending");
      const briefCard: AgentCard = {
        title: `Today's brief - ${fmtDate(todayStr)}`,
        fields: [
          { label: "Appointments today", value: String(todayAppts.length) },
          { label: "Open inquiries", value: String(openInquiries.length) },
          { label: "Urgent inquiries", value: String(openInquiries.filter((i) => i.priority === "urgent").length) },
          { label: "New quotes", value: String(newQuotes.length) },
          { label: "Pending approvals", value: String(awaitingApproval.length) },
        ],
      };
      return ok(
        {
          date: todayStr,
          appointmentsToday: todayAppts.map((a) => ({
            reference: a.reference, customer: a.customerName, serviceId: a.serviceId,
            branch: a.branchName, time: a.time, status: a.status,
          })),
          openInquiries: openInquiries.length,
          urgentInquiries: openInquiries.filter((i) => i.priority === "urgent").length,
          newQuotes: newQuotes.length,
          pendingApprovals: awaitingApproval.length,
        },
        [
          briefCard,
          ...todayAppts.slice(0, 8).map((a) => appointmentCard(a, STAFF.includes(ctx.role))),
        ],
      );
    },
  },
  // ---------- admin tools ----------
  {
    name: "list_agent_actions",
    description: "List recent agent tool-call audit entries",
    inputSchema: object({ limit: { type: "integer" } }),
    tier: "read",
    roles: ADMIN,
    async execute(_ctx, input) {
      const limit = typeof input.limit === "number" ? Math.min(Math.max(input.limit, 1), 50) : 20;
      const rows = await (await repo()).listAgentActions();
      return ok({
        results: rows.slice(0, limit).map((a) => ({
          id: a.id, tool: a.toolName, actorType: a.actorType, success: a.success === 1, createdAt: a.createdAt,
        })),
        total: rows.length,
      });
    },
  },
  {
    name: "reset_demo_data",
    description: "Reset all records to the seeded demo dataset",
    inputSchema: object({}),
    tier: "admin",
    roles: ADMIN,
    async execute() {
      const { demoResetAllowed } = await import("@/lib/admin-auth");
      if (!demoResetAllowed()) return fail("Demo reset is disabled in production.");
      await (await repo()).resetData();
      return ok({ message: "Demo data has been reset to the seeded state" });
    },
  },
];

const toolIndex = new Map(agentTools.map((t) => [t.name, t]));

export function getTool(name: string): AgentTool | undefined {
  return toolIndex.get(name);
}

export function getToolsForRole(role: AgentRole): AgentTool[] {
  // Hidden tools (revert targets) are apply-only — never declared to the model.
  return agentTools.filter((t) => !t.hidden && t.roles.includes(role));
}

export function canCall(tool: AgentTool, role: AgentRole): boolean {
  return tool.roles.includes(role);
}
