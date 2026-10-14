/**
 * Demo tools - typed, allowlisted server-side tools for the AI assistant.
 * Tools are organized by permission level (public vs staff).
 */

import {
  getDemoBranches,
  getDemoBranch,
  getDemoAvailability,
  getDemoAppointments,
  getDemoAppointment,
  getDemoInquiries,
  getDemoInquiry,
  getDemoCustomers,
  getDemoCustomer,
  getDemoServiceById,
  getDemoSummary,
  resetDemoData,
  updateDemoInquiryStatus,
  type DemoAppointment,
  type DemoInquiry,
  type DemoCustomer,
} from "./demo-repository";
import { getServices, getLocations, getFaqs, getArticles } from "@/lib/content";

// Tool result types
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Public tools (available to all users)
export type PublicToolName =
  | "search_services"
  | "search_locations"
  | "check_availability"
  | "get_branch_info"
  | "search_faqs"
  | "search_articles"
  | "lookup_booking";

// Staff tools (admin mode only)
export type StaffToolName =
  | "search_appointments"
  | "get_appointment_detail"
  | "search_inquiries"
  | "get_inquiry_detail"
  | "search_customers"
  | "get_customer_detail"
  | "update_inquiry_status"
  | "get_dashboard_summary";

// Tool definitions
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  permission: "public" | "staff";
}

// Validate search query to prevent injection
function sanitizeSearchQuery(query: unknown): string | undefined {
  if (typeof query !== "string") return undefined;
  const sanitized = query.trim().slice(0, 100);
  // Only allow alphanumeric, spaces, hyphens
  return /^[a-zA-Z0-9\s\-]*$/.test(sanitized) ? sanitized : undefined;
}

// Validate date format (YYYY-MM-DD)
function validateDate(date: unknown): string | undefined {
  if (typeof date !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
}

// Validate time format (HH:MM)
function validateTime(time: unknown): string | undefined {
  if (typeof time !== "string") return undefined;
  return /^\d{2}:\d{2}$/.test(time) ? time : undefined;
}

// ============================================
// PUBLIC TOOLS
// ============================================

async function searchServicesTool(args: { query?: string; category?: string }): Promise<ToolResult> {
  const { query, category } = args;

  // Validate inputs
  if (query && typeof query !== "string") {
    return { success: false, error: "Invalid query parameter" };
  }
  if (category && typeof category !== "string") {
    return { success: false, error: "Invalid category parameter" };
  }

  const services = getServices();

  let results = services;

  if (category && typeof category === "string") {
    results = results.filter(
      (s) => s.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    const qLower = q.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(qLower) ||
        s.shortDescription.toLowerCase().includes(qLower) ||
        s.description.toLowerCase().includes(qLower)
    );
  }

  const mapped = results.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    priceFrom: s.priceFrom,
    currency: s.currency,
    duration: s.duration,
    href: `/services/${s.slug}`,
  }));

  return { success: true, data: { results: mapped.slice(0, 10), total: mapped.length } };
}

async function searchLocationsTool(args: { query?: string }): Promise<ToolResult> {
  const { query } = args;

  // Validate inputs
  if (query && typeof query !== "string") {
    return { success: false, error: "Invalid query parameter" };
  }

  const locations = getLocations();

  let results = locations;

  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    const qLower = q.toLowerCase();
    results = results.filter(
      (l) =>
        l.province.toLowerCase().includes(qLower) ||
        l.cities.some((c) => c.name.toLowerCase().includes(qLower))
    );
  }

  const mapped = results.map((l) => ({
    id: l.id,
    province: l.province,
    region: l.region,
    cities: l.cities.map((c) => ({ name: c.name, available: c.available })),
  }));

  return { success: true, data: { results: mapped.slice(0, 10), total: mapped.length } };
}

async function checkAvailabilityTool(args: {
  branchId?: string;
  serviceId?: string;
  date?: string;
}): Promise<ToolResult> {
  const { branchId, serviceId, date } = args;

  // Validate inputs
  if (branchId && typeof branchId !== "string") {
    return { success: false, error: "Invalid branch ID" };
  }
  if (serviceId && typeof serviceId !== "string") {
    return { success: false, error: "Invalid service ID" };
  }
  if (date && !validateDate(date)) {
    return { success: false, error: "Invalid date format (use YYYY-MM-DD)" };
  }

  // Verify branch exists if provided
  if (branchId) {
    const branch = getDemoBranch(branchId);
    if (!branch) {
      return { success: false, error: "Branch not found" };
    }
  }

  // Verify service exists if provided
  if (serviceId) {
    const service = getDemoServiceById(serviceId);
    if (!service) {
      return { success: false, error: "Service not found" };
    }
  }

  const slots = getDemoAvailability(branchId, serviceId);

  // Filter by date if provided
  let filteredSlots = slots;
  if (date) {
    filteredSlots = slots.filter((s) => s.date === date);
  }

  // Group by branch and date
  const grouped: Record<string, { date: string; time: string; available: boolean }[]> = {};
  for (const slot of filteredSlots) {
    if (!grouped[slot.branchId]) grouped[slot.branchId] = [];
    grouped[slot.branchId].push({
      date: slot.date,
      time: slot.time,
      available: slot.available,
    });
  }

  const branchInfo = branchId ? [getDemoBranch(branchId)].filter(Boolean) : getDemoBranches();
  const result = branchInfo.map((b) => ({
    branch: { id: b!.id, name: b!.name, city: b!.city },
    slots: grouped[b!.id]?.slice(0, 14) || [],
  }));

  return { success: true, data: { branches: result, note: "Demo availability - not real-time data" } };
}

async function getBranchInfoTool(args: { branchId: string }): Promise<ToolResult> {
  const { branchId } = args;

  if (!branchId || typeof branchId !== "string") {
    return { success: false, error: "Branch ID is required" };
  }

  const branch = getDemoBranch(branchId);
  if (!branch) {
    return { success: false, error: "Branch not found" };
  }

  return {
    success: true,
    data: {
      ...branch,
      href: `/locations?branch=${branchId}`,
      note: "Demo branch - synthetic data only",
    },
  };
}

async function searchFaqsTool(args: { query?: string }): Promise<ToolResult> {
  const { query } = args;

  // Validate inputs
  if (query && typeof query !== "string") {
    return { success: false, error: "Invalid query parameter" };
  }

  const faqs = getFaqs();

  let results = faqs;

  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    const qLower = q.toLowerCase();
    results = results.filter(
      (f) =>
        f.question.toLowerCase().includes(qLower) ||
        f.answer.toLowerCase().includes(qLower)
    );
  }

  const mapped = results.slice(0, 10).map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  return { success: true, data: { results: mapped, total: results.length } };
}

async function searchArticlesTool(args: { query?: string }): Promise<ToolResult> {
  const { query } = args;

  // Validate inputs
  if (query && typeof query !== "string") {
    return { success: false, error: "Invalid query parameter" };
  }

  const articles = getArticles();

  let results = articles;

  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    const qLower = q.toLowerCase();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(qLower) ||
        a.excerpt.toLowerCase().includes(qLower)
    );
  }

  const mapped = results.slice(0, 10).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    href: `/resources/${a.slug}`,
  }));

  return { success: true, data: { results: mapped, total: results.length } };
}

async function lookupBookingTool(args: { reference: string }): Promise<ToolResult> {
  const { reference } = args;

  if (!reference || typeof reference !== "string") {
    return { success: false, error: "Reference number is required" };
  }

  // Sanitize - only allow AC-YYYY-NNNNN format
  const sanitized = reference.trim().toUpperCase();
  if (!/^AC-\d{4}-\d{5}$/.test(sanitized)) {
    return { success: false, error: "Invalid reference format. Use AC-YYYY-NNNNN (e.g., AC-2025-00042)" };
  }

  const appointment = getDemoAppointment(sanitized);
  if (!appointment) {
    return {
      success: true,
      data: {
        found: false,
        message: "No appointment found with this reference. This is a demo - use AC-2025-00042 for a sample.",
        demoHint: "Try reference AC-2025-00042 for a confirmed appointment or AC-2025-00043 for pending",
      },
    };
  }

  const branch = getDemoBranch(appointment.branchId);
  const service = getDemoServiceById(appointment.serviceId);

  return {
    success: true,
    data: {
      found: true,
      reference: appointment.reference,
      status: appointment.status,
      service: service?.name || appointment.serviceId,
      branch: branch?.name,
      date: appointment.date,
      time: appointment.time,
      vehicle: appointment.vehicleInfo,
      note: "Demo booking - synthetic data only",
    },
  };
}

// ============================================
// STAFF TOOLS
// ============================================

async function searchAppointmentsTool(args: {
  query?: string;
  status?: string;
  branchId?: string;
}): Promise<ToolResult> {
  const { query, status, branchId } = args;

  // Validate status
  const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
  const statusFilter = status && validStatuses.includes(status) ? status as DemoAppointment["status"] : undefined;

  let appointments = getDemoAppointments({ status: statusFilter, branchId });

  // Filter by query if provided
  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    const qLower = q.toLowerCase();
    appointments = appointments.filter(
      (a) =>
        a.reference.toLowerCase().includes(qLower) ||
        a.customerName.toLowerCase().includes(qLower) ||
        a.vehicleInfo.toLowerCase().includes(qLower)
    );
  }

  const mapped = appointments.slice(0, 20).map((a) => {
    const branch = getDemoBranch(a.branchId);
    return {
      id: a.id,
      reference: a.reference,
      customerName: a.customerName,
      vehicle: a.vehicleInfo,
      serviceId: a.serviceId,
      branch: branch?.name,
      date: a.date,
      time: a.time,
      status: a.status,
      createdAt: a.createdAt,
    };
  });

  return { success: true, data: { results: mapped, total: mapped.length } };
}

async function getAppointmentDetailTool(args: { id: string }): Promise<ToolResult> {
  const { id } = args;

  if (!id || typeof id !== "string") {
    return { success: false, error: "Appointment ID is required" };
  }

  const appointment = getDemoAppointment(id);
  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  const branch = getDemoBranch(appointment.branchId);
  const service = getDemoServiceById(appointment.serviceId);

  return {
    success: true,
    data: {
      ...appointment,
      branchName: branch?.name,
      serviceName: service?.name,
      note: "Demo data - synthetic records only",
    },
  };
}

async function searchInquiriesTool(args: {
  query?: string;
  status?: string;
  category?: string;
  priority?: string;
}): Promise<ToolResult> {
  const { query, status, category, priority } = args;

  // Validate filters
  const validStatuses = ["new", "reviewed", "responded", "resolved"];
  const validCategories = ["quote", "booking", "general", "complaint"];
  const validPriorities = ["low", "medium", "high"];

  const statusFilter = status && validStatuses.includes(status) ? status as DemoInquiry["status"] : undefined;
  const categoryFilter = category && validCategories.includes(category) ? category as DemoInquiry["category"] : undefined;
  const priorityFilter = priority && validPriorities.includes(priority) ? priority as DemoInquiry["priority"] : undefined;

  let inquiries = getDemoInquiries({ status: statusFilter, category: categoryFilter, priority: priorityFilter });

  // Filter by query if provided
  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    const qLower = q.toLowerCase();
    inquiries = inquiries.filter(
      (i) =>
        i.reference.toLowerCase().includes(qLower) ||
        i.customerName.toLowerCase().includes(qLower) ||
        i.subject.toLowerCase().includes(qLower) ||
        i.message.toLowerCase().includes(qLower)
    );
  }

  const mapped = inquiries.slice(0, 20).map((i) => ({
    id: i.id,
    reference: i.reference,
    customerName: i.customerName,
    subject: i.subject,
    category: i.category,
    priority: i.priority,
    status: i.status,
    createdAt: i.createdAt,
  }));

  return { success: true, data: { results: mapped, total: mapped.length } };
}

async function getInquiryDetailTool(args: { id: string }): Promise<ToolResult> {
  const { id } = args;

  if (!id || typeof id !== "string") {
    return { success: false, error: "Inquiry ID is required" };
  }

  const inquiry = getDemoInquiry(id);
  if (!inquiry) {
    return { success: false, error: "Inquiry not found" };
  }

  return {
    success: true,
    data: {
      ...inquiry,
      note: "Demo data - synthetic records only",
    },
  };
}

async function searchCustomersTool(args: { query?: string }): Promise<ToolResult> {
  const { query } = args;

  let customers = getDemoCustomers();

  if (query) {
    const q = sanitizeSearchQuery(query);
    if (!q) return { success: false, error: "Invalid search query" };
    customers = getDemoCustomers(q);
  }

  const mapped = customers.slice(0, 20).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    vehicle: c.vehicle,
    plateNumber: c.plateNumber,
    totalVisits: c.totalVisits,
  }));

  return { success: true, data: { results: mapped, total: mapped.length } };
}

async function getCustomerDetailTool(args: { id: string }): Promise<ToolResult> {
  const { id } = args;

  if (!id || typeof id !== "string") {
    return { success: false, error: "Customer ID is required" };
  }

  const customer = getDemoCustomer(id);
  if (!customer) {
    return { success: false, error: "Customer not found" };
  }

  // Get customer's appointments
  const appointments = getDemoAppointments({ customerEmail: customer.email });

  return {
    success: true,
    data: {
      ...customer,
      recentAppointments: appointments.slice(0, 5).map((a) => ({
        reference: a.reference,
        serviceId: a.serviceId,
        date: a.date,
        status: a.status,
      })),
      note: "Demo data - synthetic records only",
    },
  };
}

async function updateInquiryStatusTool(args: { id: string; status: string }): Promise<ToolResult> {
  const { id, status } = args;

  if (!id || typeof id !== "string") {
    return { success: false, error: "Inquiry ID is required" };
  }

  const validStatuses = ["new", "reviewed", "responded", "resolved"];
  if (!status || !validStatuses.includes(status)) {
    return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
  }

  const inquiry = updateDemoInquiryStatus(id, status as DemoInquiry["status"]);
  if (!inquiry) {
    return { success: false, error: "Inquiry not found" };
  }

  return {
    success: true,
    data: {
      id: inquiry.id,
      reference: inquiry.reference,
      status: inquiry.status,
      message: `Inquiry marked as "${status}". This is a demo action - no real email was sent.`,
      demoNotice: "SIMULATED ACTION - Demo mode only",
    },
  };
}

async function getDashboardSummaryTool(): Promise<ToolResult> {
  const summary = getDemoSummary();

  return {
    success: true,
    data: {
      ...summary,
      note: "Demo dashboard summary - synthetic data only",
    },
  };
}

// ============================================
// TOOL REGISTRY
// ============================================

export const publicTools: Record<string, (args: unknown) => Promise<ToolResult>> = {
  search_services: searchServicesTool as (args: unknown) => Promise<ToolResult>,
  search_locations: searchLocationsTool as (args: unknown) => Promise<ToolResult>,
  check_availability: checkAvailabilityTool as (args: unknown) => Promise<ToolResult>,
  get_branch_info: getBranchInfoTool as (args: unknown) => Promise<ToolResult>,
  search_faqs: searchFaqsTool as (args: unknown) => Promise<ToolResult>,
  search_articles: searchArticlesTool as (args: unknown) => Promise<ToolResult>,
  lookup_booking: lookupBookingTool as (args: unknown) => Promise<ToolResult>,
};

export const staffTools: Record<string, (args: unknown) => Promise<ToolResult>> = {
  ...publicTools,
  search_appointments: searchAppointmentsTool as (args: unknown) => Promise<ToolResult>,
  get_appointment_detail: getAppointmentDetailTool as (args: unknown) => Promise<ToolResult>,
  search_inquiries: searchInquiriesTool as (args: unknown) => Promise<ToolResult>,
  get_inquiry_detail: getInquiryDetailTool as (args: unknown) => Promise<ToolResult>,
  search_customers: searchCustomersTool as (args: unknown) => Promise<ToolResult>,
  get_customer_detail: getCustomerDetailTool as (args: unknown) => Promise<ToolResult>,
  update_inquiry_status: updateInquiryStatusTool as (args: unknown) => Promise<ToolResult>,
  get_dashboard_summary: getDashboardSummaryTool as (args: unknown) => Promise<ToolResult>,
};

// Tool definitions for AI to know what's available
export const toolDefinitions: ToolDefinition[] = [
  {
    name: "search_services",
    description: "Search for automotive services by name, description, or category",
    parameters: { query: { type: "string", description: "Search term" }, category: { type: "string", description: "Filter by category (e.g., Maintenance, Repair)" } },
    permission: "public",
  },
  {
    name: "search_locations",
    description: "Search service areas and branches by city or province",
    parameters: { query: { type: "string", description: "Search term (city or province name)" } },
    permission: "public",
  },
  {
    name: "check_availability",
    description: "Check available appointment slots at branches for a service",
    parameters: { branchId: { type: "string", description: "Optional branch ID" }, serviceId: { type: "string", description: "Service ID to check availability for" }, date: { type: "string", description: "Optional date (YYYY-MM-DD)" } },
    permission: "public",
  },
  {
    name: "get_branch_info",
    description: "Get details about a specific branch",
    parameters: { branchId: { type: "string", description: "Branch ID" } },
    permission: "public",
  },
  {
    name: "search_faqs",
    description: "Search frequently asked questions",
    parameters: { query: { type: "string", description: "Search term" } },
    permission: "public",
  },
  {
    name: "search_articles",
    description: "Search blog articles and resources",
    parameters: { query: { type: "string", description: "Search term" } },
    permission: "public",
  },
  {
    name: "lookup_booking",
    description: "Look up a booking by reference number",
    parameters: { reference: { type: "string", description: "Booking reference (AC-YYYY-NNNNN)" } },
    permission: "public",
  },
  {
    name: "search_appointments",
    description: "Search appointment records (staff only)",
    parameters: { query: { type: "string", description: "Search by reference, customer, or vehicle" }, status: { type: "string", description: "Filter by status (pending, confirmed, completed, cancelled)" }, branchId: { type: "string", description: "Filter by branch" } },
    permission: "staff",
  },
  {
    name: "get_appointment_detail",
    description: "Get full appointment details (staff only)",
    parameters: { id: { type: "string", description: "Appointment ID or reference" } },
    permission: "staff",
  },
  {
    name: "search_inquiries",
    description: "Search quote inquiries and messages (staff only)",
    parameters: { query: { type: "string", description: "Search by reference, customer, or message" }, status: { type: "string", description: "Filter by status" }, category: { type: "string", description: "Filter by category (quote, booking, general, complaint)" }, priority: { type: "string", description: "Filter by priority (low, medium, high)" } },
    permission: "staff",
  },
  {
    name: "get_inquiry_detail",
    description: "Get full inquiry details (staff only)",
    parameters: { id: { type: "string", description: "Inquiry ID or reference" } },
    permission: "staff",
  },
  {
    name: "search_customers",
    description: "Search customer records (staff only)",
    parameters: { query: { type: "string", description: "Search by name, email, vehicle, or plate number" } },
    permission: "staff",
  },
  {
    name: "get_customer_detail",
    description: "Get customer details and history (staff only)",
    parameters: { id: { type: "string", description: "Customer ID" } },
    permission: "staff",
  },
  {
    name: "update_inquiry_status",
    description: "Update inquiry status (staff only)",
    parameters: { id: { type: "string", description: "Inquiry ID or reference" }, status: { type: "string", description: "New status (new, reviewed, responded, resolved)" } },
    permission: "staff",
  },
  {
    name: "get_dashboard_summary",
    description: "Get dashboard summary with counts (staff only)",
    parameters: {},
    permission: "staff",
  },
];

// Reset function exposed for API
export function resetDemoDataExternal() {
  return resetDemoData();
}