import test from "node:test";
import assert from "node:assert/strict";
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
  createDemoAppointment,
  createDemoInquiry,
  updateDemoInquiryStatus,
  initializeDemoData,
} from "../src/lib/ai/demo-repository";
import {
  executeTool,
  executeTools,
  getToolsForRole,
} from "../src/lib/ai/tool-router";
import { toolDefinitions } from "../src/lib/ai/demo-tools";

test("synthetic data is properly initialized", () => {
  const branches = getDemoBranches();
  assert.ok(branches.length > 0, "Branches should be initialized");
  assert.ok(branches.every((b) => b.id.startsWith("branch-")), "Branch IDs should start with 'branch-'");
});

test("demo branches are valid", () => {
  const branches = getDemoBranches();
  for (const branch of branches) {
    assert.ok(branch.id, "Branch should have ID");
    assert.ok(branch.name, "Branch should have name");
    assert.ok(branch.city, "Branch should have city");
    assert.ok(Array.isArray(branch.availableServices), "Branch should have services array");
  }
});

test("getDemoBranch returns valid branch by ID", () => {
  const branches = getDemoBranches();
  const branch = getDemoBranch(branches[0].id);
  assert.ok(branch, "Should find branch by ID");
  assert.equal(branch?.id, branches[0].id);
  assert.equal(branch?.name, branches[0].name);
});

test("getDemoBranch returns undefined for invalid ID", () => {
  const branch = getDemoBranch("invalid-branch-id");
  assert.strictEqual(branch, undefined);
});

test("availability slots are generated for branches", () => {
  const slots = getDemoAvailability();
  assert.ok(slots.length > 0, "Slots should be generated");

  // Check slot structure
  for (const slot of slots) {
    assert.ok(slot.id.startsWith("slot-"), "Slot ID should start with 'slot-'");
    assert.ok(slot.branchId, "Slot should have branch ID");
    assert.ok(slot.date, "Slot should have date");
    assert.ok(slot.time, "Slot should have time");
    assert.strictEqual(typeof slot.available, "boolean");
  }
});

test("availability can be filtered by branch", () => {
  const branches = getDemoBranches();
  const branchId = branches[0].id;
  const slots = getDemoAvailability(branchId);
  assert.ok(slots.every((s) => s.branchId === branchId), "All slots should be for the filtered branch");
});

test("appointments are properly initialized", () => {
  const appointments = getDemoAppointments();
  assert.ok(appointments.length > 0, "Appointments should be initialized");

  for (const appt of appointments) {
    assert.ok(appt.id, "Appointment should have ID");
    assert.ok(appt.reference.startsWith("AC-"), "Reference should start with AC-");
    assert.ok(["pending", "confirmed", "completed", "cancelled"].includes(appt.status), "Status should be valid");
  }
});

test("getDemoAppointment finds by ID and reference", () => {
  const appointments = getDemoAppointments();
  const appt = appointments[0];

  const byId = getDemoAppointment(appt.id);
  assert.ok(byId, "Should find by ID");

  const byRef = getDemoAppointment(appt.reference);
  assert.ok(byRef, "Should find by reference");
});

test("appointments can be filtered", () => {
  const appointments = getDemoAppointments();
  const pending = getDemoAppointments({ status: "pending" });
  assert.ok(pending.every((a) => a.status === "pending"), "All should be pending");

  const confirmed = getDemoAppointments({ status: "confirmed" });
  assert.ok(confirmed.every((a) => a.status === "confirmed"), "All should be confirmed");
});

test("inquiries are properly initialized", () => {
  const inquiries = getDemoInquiries();
  assert.ok(inquiries.length > 0, "Inquiries should be initialized");

  for (const inquiry of inquiries) {
    assert.ok(inquiry.id, "Inquiry should have ID");
    assert.ok(inquiry.reference.startsWith("QI-"), "Reference should start with QI-");
    assert.ok(["quote", "booking", "general", "complaint"].includes(inquiry.category), "Category should be valid");
    assert.ok(["low", "medium", "high"].includes(inquiry.priority), "Priority should be valid");
  }
});

test("inquiries can be filtered by status", () => {
  const newInquiries = getDemoInquiries({ status: "new" });
  assert.ok(newInquiries.every((i) => i.status === "new"), "All should be new");
});

test("customers are properly initialized", () => {
  const customers = getDemoCustomers();
  assert.ok(customers.length > 0, "Customers should be initialized");

  for (const customer of customers) {
    assert.ok(customer.id.startsWith("cust-"), "Customer ID should start with cust-");
    assert.ok(customer.email.includes("@"), "Email should be valid");
  }
});

test("customer search works", () => {
  const customers = getDemoCustomers();
  const searchResults = getDemoCustomers("demo");
  assert.ok(searchResults.length > 0, "Search should return results");
  assert.ok(searchResults.every((c) =>
    c.name.toLowerCase().includes("demo") ||
    c.email.toLowerCase().includes("demo")
  ), "Results should match search term");
});

test("demo summary returns counts", () => {
  const summary = getDemoSummary();
  assert.ok(typeof summary.branches === "number", "Should have branches count");
  assert.ok(typeof summary.appointments.total === "number", "Should have appointments total");
  assert.ok(typeof summary.inquiries.total === "number", "Should have inquiries total");
  assert.ok(typeof summary.customers === "number", "Should have customers count");

  // Check appointment status counts
  assert.strictEqual(
    summary.appointments.total,
    summary.appointments.pending + summary.appointments.confirmed +
    summary.appointments.completed + summary.appointments.cancelled
  );
});

test("getDemoServiceById finds services", () => {
  const service = getDemoServiceById("preventive-maintenance");
  assert.ok(service, "Should find service by ID");
  assert.equal(service?.id, "preventive-maintenance");
});

test("createDemoAppointment adds new appointment", () => {
  const before = getDemoAppointments().length;
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

  const after = getDemoAppointments().length;
  assert.strictEqual(after, before + 1, "Should add one appointment");
  assert.ok(appt.reference.startsWith("AC-"), "Should have reference");
  assert.strictEqual(appt.status, "pending", "Default status should be pending");
});

test("createDemoInquiry adds new inquiry", () => {
  const before = getDemoInquiries().length;
  const inquiry = createDemoInquiry({
    customerName: "Test User",
    customerEmail: "test@example.com",
    customerPhone: "+63 912 345 6789",
    subject: "Test Inquiry",
    category: "general",
    message: "This is a test inquiry",
  });

  const after = getDemoInquiries().length;
  assert.strictEqual(after, before + 1, "Should add one inquiry");
  assert.ok(inquiry.reference.startsWith("QI-"), "Should have reference");
  assert.strictEqual(inquiry.status, "new", "Default status should be new");
});

test("updateDemoInquiryStatus changes status", () => {
  const inquiries = getDemoInquiries();
  const newInquiry = inquiries.find((i) => i.status === "new");

  if (newInquiry) {
    const updated = updateDemoInquiryStatus(newInquiry.id, "reviewed");
    assert.ok(updated, "Should return updated inquiry");
    assert.strictEqual(updated?.status, "reviewed");
  }
});

test("resetDemoData restores initial state", () => {
  // Add some data first
  createDemoAppointment({
    customerName: "Temp User",
    customerEmail: "temp@example.com",
    customerPhone: "+63 912 345 6789",
    vehicleInfo: "Test Vehicle",
    serviceId: "oil-change",
    branchId: "branch-bgc",
    date: "2025-12-01",
    time: "10:00",
  });

  // Reset
  const result = resetDemoData();
  assert.strictEqual(result.success, true);

  // Check that appointments are back to original count
  const appointments = getDemoAppointments();
  assert.ok(appointments.length <= 3, "Should have original number of appointments");
});

test("toolDefinitions are properly structured", () => {
  assert.ok(toolDefinitions.length > 0, "Tools should be defined");

  for (const tool of toolDefinitions) {
    assert.ok(tool.name, "Tool should have name");
    assert.ok(tool.description, "Tool should have description");
    assert.ok(tool.permission === "public" || tool.permission === "staff", "Permission should be valid");
    assert.ok(tool.parameters && typeof tool.parameters === "object", "Parameters should be defined");
  }
});

test("public tools don't include staff-only tools", () => {
  const toolDefinitionsList = toolDefinitions || [];
  const publicToolsList = toolDefinitionsList.filter((t) => t.permission === "public");
  const staffToolsList = toolDefinitionsList.filter((t) => t.permission === "staff");

  assert.ok(publicToolsList.length > 0, "Should have public tools");
  assert.ok(staffToolsList.length > 0, "Should have staff tools");
  assert.ok(staffToolsList.length >= publicToolsList.length, "Staff should have at least as many tools");

  // All public tools should be subset of all tools
  for (const tool of publicToolsList) {
    assert.ok(toolDefinitionsList.some((t) => t.name === tool.name), `${tool.name} should be in all tools`);
  }
});

test("executeTool validates permissions for public access", async () => {
  // Try to access staff-only tool as public
  const result = await executeTool("search_appointments", { query: "test" }, false);
  assert.strictEqual(result.result.success, false);
  assert.ok(result.result.error?.includes("staff"), "Should error about staff access");
});

test("executeTool allows staff access", async () => {
  const result = await executeTool("search_appointments", { query: "test" }, true);
  // Should succeed (or at least not fail due to permissions)
  assert.ok(result.tool === "search_appointments");
});

test("public tools work without staff mode", async () => {
  const result = await executeTool("search_services", { query: "oil" }, false);
  assert.ok(result.tool === "search_services");
  // Result should contain data even for public access
  assert.ok(result.result.data !== undefined);
});

test("getToolsForRole filters tools correctly", () => {
  const publicToolsList = getToolsForRole("public");
  const staffToolsList = getToolsForRole("staff");

  assert.ok(publicToolsList.length > 0, "Should have public tools");
  assert.ok(staffToolsList.length >= publicToolsList.length, "Staff should have at least as many tools");

  // Public list should only have public tools
  for (const tool of publicToolsList) {
    assert.strictEqual(tool.permission, "public");
  }

  // Staff list should have all tools
  const allToolNames = new Set(toolDefinitions.map((t) => t.name));
  for (const tool of staffToolsList) {
    assert.ok(allToolNames.has(tool.name), `${tool.name} should be in all tools`);
  }
});

test("tool execution validates arguments", async () => {
  const result = await executeTool("get_branch_info", { branchId: "invalid-branch" }, false);
  assert.strictEqual(result.result.success, false);
  assert.ok(result.result.error?.includes("not found"), "Should error for invalid branch");
});

test("executeTools runs multiple tools", async () => {
  const results = await executeTools([
    { name: "search_services", arguments: { query: "oil" } },
    { name: "search_faqs", arguments: { query: "oil" } },
  ], false);

  assert.strictEqual(results.length, 2);
  assert.ok(results.every((r) => r.tool.includes("search")));
});

test("tools return structured data", async () => {
  const result = await executeTool("search_services", { query: "oil" }, false);

  assert.strictEqual(result.result.success, true);
  const data = result.result.data as { results?: unknown[] };
  assert.ok(Array.isArray(data.results), "Data should have results array");
  assert.ok(data.results?.length > 0, "Should have at least one result");
});