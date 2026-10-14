"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MarkdownReply } from "@/components/ai/MarkdownReply";
import { isNearBottom, pickScrollTarget } from "@/components/ai/scroll-utils";
import { AgentCards } from "@/components/ai/AgentCards";
import type { AgentCard } from "@/lib/agent/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: { label: string; href: string }[];
  cards?: AgentCard[];
  demoNotice?: boolean;
};

type ToolResult = {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
};

type PendingAction = {
  id: string;
  tool: string;
  summary: string;
  expiresAt: string;
  token: string;
};

const TOOL_STEP_LABELS: Record<string, string> = {
  check_availability: "Checking availability",
  find_service: "Finding matching service",
  get_booking_status: "Verifying booking",
  search_services: "Searching services",
  search_locations: "Searching locations",
  get_branch_info: "Getting branch info",
  search_faqs: "Searching FAQs",
  search_articles: "Searching articles",
  search_appointments: "Searching appointments",
  get_appointment_detail: "Getting appointment details",
  search_inquiries: "Searching inquiries",
  get_inquiry_detail: "Getting inquiry details",
  search_customers: "Searching customers",
  get_customer_detail: "Getting customer details",
  get_dashboard_summary: "Getting dashboard summary",
  list_agent_actions: "Listing audit log",
  create_booking: "Preparing booking",
  reschedule_booking: "Preparing reschedule",
  cancel_booking: "Preparing cancellation",
  create_quote_request: "Preparing quote request",
  create_inquiry: "Preparing inquiry",
  update_inquiry_status: "Preparing inquiry update",
  update_appointment_status: "Preparing appointment update",
  reset_demo_data: "Resetting demo data",
};

const toolLabel = (name: string) =>
  TOOL_STEP_LABELS[name] ?? name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const customerActions = [
  "What services do you offer?",
  "How often should I change oil?",
  "Service Pricing",
  "Do you service the Toyota Vios?",
  "Do you cover Taguig?",
];

const adminActions = [
  "Show pending appointments",
  "Show new inquiries",
  "Search customers",
  "Check dashboard summary",
  "Reset demo data",
];

const MAX_MESSAGE_LENGTH = 800;

export function AutoCareAssistant({
  mode = "customer",
  inline = false,
}: {
  mode?: "customer" | "admin";
  inline?: boolean;
}) {
  // Floating widgets start closed; only an inline embed (the /admin/assistant
  // page) starts open.
  const [isOpen, setIsOpen] = useState(mode === "admin" && inline);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: mode === "admin"
        ? "Hi, I'm AutoCare Demo Assistant. I can help you search and manage synthetic demo records including appointments, inquiries, and customers. All actions are simulated."
        : "Hi, I'm AutoCare Assistant. I can help with public service, vehicle, location, and maintenance information. For booking details, please contact us directly.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolResults, setToolResults] = useState<ToolResult[] | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);
  // Whether the list was near the bottom *before* the latest content landed.
  const wasNearBottomRef = useRef(true);
  // The assistant message id we already top-aligned — avoids re-jumping to it
  // when only tool/pending cards update afterwards.
  const alignedReplyId = useRef<string | undefined>(undefined);

  const markScrollIntent = () => {
    const el = listRef.current;
    wasNearBottomRef.current = el ? isNearBottom(el) : true;
  };

  const appendMessage = (next: Omit<Message, "id">) => {
    markScrollIntent();
    setMessages((current) => [...current, { ...next, id: `m-${current.length}` }]);
  };

  const toolCount = toolResults?.length ?? 0;
  const pendingCount = pendingActions.length;

  // Auto-scroll only when new content appears (message/tool-step/pending
  // count changes) and only if the user was already near the bottom.
  // Instant positioning — never scrollIntoView (which scrolls the page too)
  // and never smooth (content height is still changing).
  useEffect(() => {
    const el = listRef.current;
    if (!el || !wasNearBottomRef.current) return;
    const last = lastMsgRef.current;
    const isNewReply =
      last?.dataset.role === "assistant" && last.dataset.mid !== alignedReplyId.current;
    el.scrollTop = pickScrollTarget(el, last, isNewReply);
    if (isNewReply && last) alignedReplyId.current = last.dataset.mid;
  }, [messages.length, toolCount, pendingCount]);

  // Opening the panel: snap to the latest content instantly, focus input
  // without letting the browser scroll the page.
  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const actions = useMemo(() => (mode === "admin" ? adminActions : customerActions), [mode]);

  const handleSubmit = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading || trimmed.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    appendMessage({
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    });
    setInput("");
    setIsLoading(true);
    setToolResults(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          history: messages.filter((item) => item.id !== "welcome").slice(-4).map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();

      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data?.ok) {
        appendMessage({
          role: "assistant",
          content: data.reply,
          sources: Array.isArray(data?.sources) ? data.sources : [],
          cards: Array.isArray(data?.cards) ? data.cards : undefined,
          timestamp: new Date().toISOString(),
          demoNotice: data?.demoNotice,
        });

        if (Array.isArray(data?.toolCalls)) {
          setToolResults(data.toolCalls.map((t: { name: string; success: boolean; output?: unknown; error?: string }) => ({
            tool: t.name,
            success: t.success,
            data: t.output,
            error: t.error,
          })));
        }
        if (Array.isArray(data?.pendingActions)) {
          setPendingActions(data.pendingActions);
        }
      } else {
        appendMessage({
          role: "assistant",
          content: data?.error || "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
          demoNotice: true,
        });
      }
    } catch {
      appendMessage({
        role: "assistant",
        content: "I'm having trouble connecting. Please try again or contact us directly.",
        timestamp: new Date().toISOString(),
        demoNotice: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (action: PendingAction) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agent/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id, token: action.token }),
      });
      const result = await response.json();
      if (response.ok && result?.ok) {
        setPendingActions((current) => current.filter((item) => item.id !== action.id));
        appendMessage({
          role: "assistant",
          content: `Confirmed: ${action.summary}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        setPendingActions((current) => current.filter((item) => item.id !== action.id));
        appendMessage({
          role: "assistant",
          content: `Confirmation failed: ${result?.error ?? "The action could not be completed."}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      appendMessage({
        role: "assistant",
        content: "Confirmation request failed. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = (action: PendingAction) => {
    setPendingActions((current) => current.filter((item) => item.id !== action.id));
    appendMessage({
      role: "assistant",
      content: `Declined: ${action.summary}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleResetDemo = async () => {
    try {
      const response = await fetch("/api/ai/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();

      appendMessage({
        role: "assistant",
        content: result?.message || "Demo data has been reset.",
        timestamp: new Date().toISOString(),
        demoNotice: true,
      });
    } catch {
      appendMessage({
        role: "assistant",
        content: "Reset failed. Please try again.",
        timestamp: new Date().toISOString(),
        demoNotice: true,
      });
    }
  };

  // The staff widget is mounted by the admin layout; hide the public one
  // there so the two floating widgets never overlap.
  const pathname = usePathname();
  if (mode !== "admin" && pathname.startsWith("/admin")) return null;

  if (!isOpen) {
    if (inline) {
      return (
        <div className="w-full rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line bg-primary px-4 py-3 text-inverted">
            <div>
              <p className="font-heading text-xl">AutoCare Assistant</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-inverted/70">Demo Mode</p>
            </div>
            <button type="button" onClick={() => setIsOpen(true)} className="text-sm text-inverted/80 hover:text-inverted">
              Open
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-inverted shadow-lg shadow-primary/20"
        >
          AutoCare Assistant
        </button>
      </div>
    );
  }

  const wrapperClass = inline
    ? "w-full rounded-xl border border-line bg-surface shadow-sm overflow-hidden"
    : "fixed inset-0 z-50 bg-black/20 sm:inset-auto sm:bottom-5 sm:right-5 sm:left-auto sm:w-[26rem] sm:rounded-xl sm:border sm:border-line sm:bg-surface sm:shadow-2xl sm:shadow-primary/10";

  return (
    <div className={wrapperClass}>
      <div className="flex h-full flex-col bg-surface sm:h-[36rem]">
        <header className="flex items-center justify-between border-b border-line bg-primary px-4 py-3 text-inverted">
          <div>
            <p className="font-heading text-xl">AutoCare Assistant</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-inverted/70">Demo Mode — Synthetic Data</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-inverted/70">{mode === "admin" ? "Staff Demo" : "Public Demo"}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-lg text-inverted/80 hover:text-inverted"
            >
              ×
            </button>
          </div>
        </header>

        {mode === "admin" && (
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Demo Mode:</strong> All data is synthetic. Actions are simulated and do not affect real systems.
            </p>
          </div>
        )}

        <div ref={listRef} className="relative max-h-full min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMsgRef : undefined}
              data-role={message.role}
              data-mid={message.id}
              className={`mb-4 ${message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}`}
            >
              <div className={`rounded-lg px-4 py-2 ${message.role === "user" ? "bg-primary text-inverted" : "bg-muted text-ink"}`}>
                {message.role === "assistant" ? (
                  <>
                    <MarkdownReply content={message.content} />
                    {message.cards && <AgentCards cards={message.cards} onNavigate={() => setIsOpen(false)} />}
                  </>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                )}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                      <a key={source.href} href={source.href} className="text-xs underline opacity-70 hover:opacity-100">
                        {source.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {message.demoNotice && (
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-amber-600">
                  Demo Mode — Synthetic Data Only
                </p>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto max-w-[85%] mb-4">
              <div className="rounded-lg bg-muted px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-spin rounded-full bg-primary" />
                  <span className="text-sm text-muted">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {toolResults && toolResults.length > 0 && (
            <div className="mr-auto max-w-[85%] mb-4">
              <div className="rounded-lg border border-line bg-surface px-4 py-2">
                <p className="text-xs uppercase tracking-[0.1em] text-muted mb-2">Assistant steps</p>
                {toolResults.map((result, index) => (
                  <div key={index} className={`mb-2 rounded p-2 text-xs ${result.success ? "bg-green-50" : "bg-red-50"}`}>
                    <p className="font-medium">{toolLabel(result.tool)}</p>
                    <p className={result.success ? "text-green-700" : "text-red-700"}>
                      {result.success ? "Done" : `Error: ${result.error}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingActions.length > 0 && (
            <div className="mr-auto max-w-[85%] mb-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                <p className="text-xs uppercase tracking-[0.1em] text-amber-800 mb-2">Awaiting confirmation</p>
                {pendingActions.map((action) => (
                  <div key={action.id} className="mb-2 rounded bg-surface p-2 text-xs">
                    <p className="font-medium">{action.summary}</p>
                    <p className="mt-1 text-muted">Expires {new Date(action.expiresAt).toLocaleTimeString()}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirm(action)}
                        disabled={isLoading}
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(action)}
                        disabled={isLoading}
                        className="rounded border border-line px-3 py-1 text-muted hover:bg-muted disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="border-t border-line bg-surface p-4">
          {mode === "admin" && (
            <button
              type="button"
              onClick={handleResetDemo}
              aria-hidden={messages.length <= 1}
              tabIndex={messages.length <= 1 ? -1 : 0}
              className={`mb-2 w-full rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs uppercase tracking-[0.1em] text-amber-800 hover:bg-amber-100 ${messages.length <= 1 ? "invisible" : ""}`}
            >
              Reset Demo Data
            </button>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <button
                type="button"
                key={index}
                onClick={() => handleSubmit(action)}
                disabled={isLoading}
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink hover:bg-muted disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              aria-label="Ask the assistant"
              value={input}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }
              }}
              placeholder={mode === "admin" ? "Search demo records or ask questions..." : "Ask about your vehicle or service..."}
              className="w-full border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-muted"
            />
            <Button type="button" variant="primary" onClick={() => handleSubmit()} disabled={isLoading} className="px-4 py-3">
              Send
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setMessages([messages[0]])} className="text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink">
              Clear chat
            </button>
            <Button href="/contact" variant="secondary" className="px-3 py-2 text-[10px]">
              Talk to a Service Advisor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}