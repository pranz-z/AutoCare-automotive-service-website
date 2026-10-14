import test from "node:test";
import assert from "node:assert/strict";
import { getDemoBranches, createDemoAppointment } from "../src/lib/ai/demo-repository";
import { executeTool } from "../src/lib/ai/tool-router";

// Type helper for accessing tool results
interface SearchResult {
  results?: unknown[];
}
interface BranchResult {
  name?: string;
  city?: string;
  branches?: unknown[];
}
interface BookingResult {
  found?: boolean;
}
interface DashboardResult {
  appointments?: { total?: number };
  inquiries?: { total?: number };
  customers?: number;
}

test("public tool: search_services returns results", async () => {
  const result = await executeTool("search_services", { query: "oil" }, false);
  assert.strictEqual(result.tool, "search_services");
  assert.strictEqual(result.result.success, true);
  const data = result.result.data as SearchResult | undefined;
  assert.ok(Array.isArray(data?.results));
});

test("public tool: search_locations returns results", async () => {
  const result = await executeTool("search_locations", { query: "taguig" }, false);
  assert.strictEqual(result.tool, "search_locations");
  assert.strictEqual(result.result.success, true);
});

test("public tool: check_availability returns slots", async () => {
  const branches = getDemoBranches();
  if (branches.length > 0) {
    const result = await executeTool("check_availability", { branchId: branches[0].id }, false);
    assert.strictEqual(result.tool, "check_availability");
    assert.strictEqual(result.result.success, true);
    const data = result.result.data as BranchResult | undefined;
    assert.ok(Array.isArray(data?.branches));
  }
});

test("public tool: get_branch_info returns branch details", async () => {
  const branches = getDemoBranches();
  if (branches.length > 0) {
    const result = await executeTool("get_branch_info", { branchId: branches[0].id }, false);
    assert.strictEqual(result.tool, "get_branch_info");
    assert.strictEqual(result.result.success, true);
    const data = result.result.data as BranchResult | undefined;
    assert.ok(data?.name);
    assert.ok(data?.city);
  }
});

test("public tool: search_faqs returns results", async () => {
  const result = await executeTool("search_faqs", { query: "oil change" }, false);
  assert.strictEqual(result.tool, "search_faqs");
  assert.strictEqual(result.result.success, true);
});

test("public tool: search_articles returns results", async () => {
  const result = await executeTool("search_articles", { query: "engine" }, false);
  assert.strictEqual(result.tool, "search_articles");
  assert.strictEqual(result.result.success, true);
});

test("public tool: lookup_booking with valid reference", async () => {
  // First create an appointment to get a valid reference
  const appt = createDemoAppointment({
    customerName: "Test User",
    customerEmail: "test@example.com",
    customerPhone: "+63 912 345 6789",
    vehicleInfo: "Toyota Camry 2020",
    serviceId: "oil-change",
    branchId: "branch-bgc",
    date: "2025-12-01",
    time: "10:00",
  });

  const result = await executeTool("lookup_booking", { reference: appt.reference }, false);
  assert.strictEqual(result.tool, "lookup_booking");
  assert.strictEqual(result.result.success, true);
  const data = result.result.data as BookingResult | undefined;
  assert.ok(data?.found);
});

test("public tool: lookup_booking with invalid format", async () => {
  const result = await executeTool("lookup_booking", { reference: "INVALID" }, false);
  assert.strictEqual(result.tool, "lookup_booking");
  assert.strictEqual(result.result.success, false);
});

test("staff tool: search_appointments returns results", async () => {
  const result = await executeTool("search_appointments", { query: "test" }, true);
  assert.strictEqual(result.tool, "search_appointments");
  assert.strictEqual(result.result.success, true);
});

test("staff tool: search_inquiries returns results", async () => {
  const result = await executeTool("search_inquiries", { query: "test" }, true);
  assert.strictEqual(result.tool, "search_inquiries");
  assert.strictEqual(result.result.success, true);
});

test("staff tool: search_customers returns results", async () => {
  const result = await executeTool("search_customers", { query: "test" }, true);
  assert.strictEqual(result.tool, "search_customers");
  assert.strictEqual(result.result.success, true);
});

test("staff tool: get_dashboard_summary returns counts", async () => {
  const result = await executeTool("get_dashboard_summary", {}, true);
  assert.strictEqual(result.tool, "get_dashboard_summary");
  assert.strictEqual(result.result.success, true);
  const data = result.result.data as DashboardResult | undefined;
  assert.ok(data?.appointments);
  assert.ok(data?.inquiries);
  assert.ok(data?.customers);
});

test("staff tool: update_inquiry_status changes status", async () => {
  const inquiries = await executeTool("search_inquiries", { status: "new" }, true);
  const data = inquiries.result.data as SearchResult | undefined;
  if (inquiries.result.success && data?.results && data.results.length > 0) {
    const inquiryId = (data.results as { id: string }[])[0].id;
    const result = await executeTool("update_inquiry_status", { id: inquiryId, status: "reviewed" }, true);
    assert.strictEqual(result.tool, "update_inquiry_status");
    assert.strictEqual(result.result.success, true);
  }
});

test("tool execution rejects unknown tools", async () => {
  const result = await executeTool("unknown_tool", {}, false);
  assert.strictEqual(result.result.success, false);
  assert.ok(result.result.error?.includes("Unknown tool"));
});

test("tool execution validates required parameters", async () => {
  const result = await executeTool("get_branch_info", {}, false);
  assert.strictEqual(result.result.success, false);
});

test("tools work with empty query parameters", async () => {
  const result = await executeTool("search_services", {}, false);
  assert.strictEqual(result.result.success, true);
  const data = result.result.data as SearchResult | undefined;
  assert.ok(Array.isArray(data?.results));
});