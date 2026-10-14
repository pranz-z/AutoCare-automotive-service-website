import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull().default(""),
  operatingHours: text("operating_hours").notNull().default(""),
  availableServices: text("available_services").notNull().default("[]"),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  conversationStatus: text("conversation_status").notNull().default("ai_handling"),
  createdAt: text("created_at").notNull(),
});

export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  variant: text("variant").notNull().default(""),
  plate: text("plate").notNull().default(""),
  mileage: text("mileage").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  vehicleId: text("vehicle_id").references(() => vehicles.id),
  vehicleInfo: text("vehicle_info").notNull().default(""),
  serviceId: text("service_id").notNull(),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id),
  location: text("location").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  vehicle: text("vehicle").notNull().default(""),
  subject: text("subject").notNull().default(""),
  category: text("category").notNull().default("general"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("new"),
  message: text("message").notNull().default(""),
  /** JSON-serialized auto-triage result (urgency, suggested service, draft reply). */
  triage: text("triage"),
  createdAt: text("created_at").notNull(),
});

export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id),
  serviceId: text("service_id").notNull(),
  make: text("make").notNull().default(""),
  model: text("model").notNull().default(""),
  year: text("year").notNull().default(""),
  variant: text("variant").notNull().default(""),
  issue: text("issue").notNull().default(""),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull(),
  province: text("province").notNull().default(""),
  city: text("city").notNull().default(""),
  barangay: text("barangay").notNull().default(""),
  address: text("address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("new"),
  /** JSON-serialized auto-triage result (urgency, suggested service, draft reply). */
  triage: text("triage"),
  createdAt: text("created_at").notNull(),
});

export const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey(),
  channel: text("channel").notNull().default("public"),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  vehicle: text("vehicle").notNull().default(""),
  status: text("status").notNull().default("ai_handling"),
  assignedStaff: text("assigned_staff").notNull().default(""),
  conversationType: text("conversation_type").notNull().default("ai"),
  priority: text("priority").notNull().default("normal"),
  lastMessage: text("last_message").notNull().default(""),
  lastMessageAt: text("last_message_at").notNull().default(""),
  messages: text("messages").notNull().default("[]"),
  customerContext: text("customer_context").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
});

export const agentActions = sqliteTable("agent_actions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => chatSessions.id),
  actorType: text("actor_type").notNull().default("ai"),
  toolName: text("tool_name").notNull(),
  input: text("input").notNull().default("{}"),
  output: text("output").notNull().default("{}"),
  success: integer("success").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const pendingActions = sqliteTable("pending_actions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => chatSessions.id),
  action: text("action").notNull(),
  payload: text("payload").notNull().default("{}"),
  status: text("status").notNull().default("pending"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const schema = {
  branches,
  customers,
  vehicles,
  appointments,
  inquiries,
  quotes,
  chatSessions,
  agentActions,
  pendingActions,
};

export const DDL = `
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  operating_hours TEXT NOT NULL DEFAULT '',
  available_services TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  conversation_status TEXT NOT NULL DEFAULT 'ai_handling',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  plate TEXT NOT NULL DEFAULT '',
  mileage TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  vehicle_id TEXT REFERENCES vehicles(id),
  vehicle_info TEXT NOT NULL DEFAULT '',
  service_id TEXT NOT NULL,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  location TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  message TEXT NOT NULL DEFAULT '',
  triage TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  service_id TEXT NOT NULL,
  make TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  variant TEXT NOT NULL DEFAULT '',
  issue TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  barangay TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  triage TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'public',
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ai_handling',
  assigned_staff TEXT NOT NULL DEFAULT '',
  conversation_type TEXT NOT NULL DEFAULT 'ai',
  priority TEXT NOT NULL DEFAULT 'normal',
  last_message TEXT NOT NULL DEFAULT '',
  last_message_at TEXT NOT NULL DEFAULT '',
  messages TEXT NOT NULL DEFAULT '[]',
  customer_context TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES chat_sessions(id),
  actor_type TEXT NOT NULL DEFAULT 'ai',
  tool_name TEXT NOT NULL,
  input TEXT NOT NULL DEFAULT '{}',
  output TEXT NOT NULL DEFAULT '{}',
  success INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pending_actions (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES chat_sessions(id),
  action TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments(reference);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_quotes_reference ON quotes(reference);
`;
