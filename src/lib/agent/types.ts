export type AgentRole = "public" | "staff" | "manager" | "admin";
/**
 * read — executes inline.
 * write — stages a pending action; apply() runs only via confirmation.
 * direct — low-risk staff mutation: executes immediately, then stages a
 *          hidden revert pending action surfaced as an "Undo" button.
 * admin — privileged ops.
 */
export type ToolTier = "read" | "write" | "direct" | "admin";

/** Record the staff member is currently viewing — resolved server-side. */
export interface OpenRecord {
  type: "appointment" | "inquiry" | "customer" | "chat";
  /** Internal id (e.g. "inq-001"), verified against the database. */
  id: string;
  /** Display reference (e.g. "QI-2025-00156") when the record has one. */
  reference?: string;
}

/**
 * Server-verified identity for a tool call. Never populated from model
 * output or request body — only from the signed session / absence of one.
 */
export interface AgentContext {
  role: AgentRole;
  /** Staff username when authenticated; undefined for public callers. */
  actor?: string;
  /** chat_sessions row correlating this conversation; also linked by pending actions. */
  sessionId?: string;
  /** The open admin record drawer — lets "this inquiry" resolve deterministically. */
  openRecord?: OpenRecord;
}

export interface AgentCardField {
  label: string;
  value: string;
}

/**
 * Presentation payload the server derives from tool data — the client renders
 * it deterministically, so the model never has to format records.
 */
export interface AgentCard {
  title: string;
  subtitle?: string;
  fields: AgentCardField[];
  /** Server-built relative admin URL. Only ever present for staff contexts. */
  href?: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /** Structured record cards for display; the model still sees `data`. */
  cards?: AgentCard[];
  /** Clickable follow-up messages rendered as chips — e.g. open slot options. */
  quickReplies?: { label: string; message: string }[];
}

export interface JsonSchema {
  type?: "object" | "string" | "number" | "integer" | "boolean" | "array";
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: string[];
  items?: JsonSchema;
  maxLength?: number;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  tier: ToolTier;
  /** Roles allowed to call this tool. Verified server-side. */
  roles: AgentRole[];
  /**
   * For read/admin tools: performs the work.
   * For write/direct tools: validates input and returns a preview; write
   * tools then stage a pending action, direct tools run apply() immediately.
   * A successful preview may set data.requiresConfirm to force the write
   * path (used by bulk inputs on direct tools).
   */
  execute(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult>;
  /** Write tools: human-readable preview stored with the pending action. */
  summarize?(input: Record<string, unknown>): string;
  /** Write/direct tools: the real mutation — for write tools invoked by POST /api/agent/confirm. */
  apply?(ctx: AgentContext, input: Record<string, unknown>): Promise<ToolResult>;
  /**
   * Direct tools: builds the revert pending action ("Undo") from a
   * successful preview — points at a hidden revert tool.
   */
  undo?(input: Record<string, unknown>, preview: unknown):
    | { tool: string; args: Record<string, unknown>; summary: string }
    | undefined;
  /**
   * Apply-only tools (revert targets): never declared to the model and
   * rejected if invoked by name — they run solely via pending confirm.
   */
  hidden?: boolean;
}

export interface ModelToolCall {
  name: string;
  args: Record<string, unknown>;
  /** Extra fields from the original part (e.g. thoughtSignature) echoed back verbatim. */
  partExtras?: Record<string, unknown>;
}

export type AgentContentPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface AgentContent {
  role: "user" | "model";
  parts: AgentContentPart[];
}

export interface ModelTurn {
  text?: string;
  toolCalls?: ModelToolCall[];
  /**
   * Non-text, non-functionCall parts (e.g. thoughtSignature) that must be
   * echoed back verbatim in the model's content on the next turn.
   */
  extraParts?: Record<string, unknown>[];
}

/** Injectable model interface — tests substitute a scripted implementation. */
export interface AgentModel {
  generate(input: {
    system: string;
    contents: AgentContent[];
    tools: { name: string; description: string; parametersJsonSchema: JsonSchema }[];
    /** Combined run-deadline + per-call cap signal. Implementations must honor it. */
    signal?: AbortSignal;
    /** Per-call timeout in ms the implementation should pass to its HTTP layer. */
    timeoutMs?: number;
  }): Promise<ModelTurn>;
}

export interface PendingConfirmation {
  id: string;
  tool: string;
  summary: string;
  expiresAt: string;
  /**
   * Capability token required by POST /api/agent/confirm. Only surfaced to the
   * authenticated staff caller in the chat response — it is what authorizes
   * the single-use confirmation.
   */
  token: string;
  /** True for auto-staged revert actions — the UI renders them as "Undo". */
  undo?: boolean;
}

export interface ToolCallRecord {
  name: string;
  input: unknown;
  success: boolean;
  /** True when the call created a pending action instead of mutating. */
  pending?: boolean;
  output?: unknown;
  error?: string;
  /** Display cards produced by this call. */
  cards?: AgentCard[];
}

export interface AgentResult {
  ok: boolean;
  reply: string;
  toolCalls: ToolCallRecord[];
  pendingActions: PendingConfirmation[];
  /** All cards emitted by tool calls, in call order. */
  cards: AgentCard[];
  /** Clickable follow-up suggestions from tool output (e.g. open slots). */
  quickReplies?: { label: string; message: string }[];
  steps: number;
  truncated?: boolean;
}
