"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Role = "customer" | "branch-staff" | "branch-manager" | "master-admin";
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const roleOptions: { label: string; value: Role }[] = [
  { label: "Customer", value: "customer" },
  { label: "Branch Staff", value: "branch-staff" },
  { label: "Branch Manager", value: "branch-manager" },
  { label: "Master Admin", value: "master-admin" },
];

const customerActions = [
  "Book a Service",
  "Check My Booking",
  "Service Pricing",
  "Vehicle Maintenance",
  "Find a Branch",
];

const adminActions = [
  "How many bookings do we have today?",
  "Show pending appointments.",
  "Which branch has the most bookings?",
  "What services are offered?",
];

function createSessionId() {
  return `autocare-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AutoCareAssistant({
  mode = "customer",
  inline = false,
}: {
  mode?: "customer" | "admin";
  inline?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(mode === "admin");
  const [sessionId, setSessionId] = useState<string>("");
  const [role, setRole] = useState<Role>(mode === "admin" ? "master-admin" : "customer");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        mode === "admin"
          ? "Hi. I can help with branch operations, booking totals, and service availability based on current records."
          : "Hi, I’m AutoCare Assistant. I can help with maintenance questions, service pricing, and booking support.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(createSessionId());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const actions = useMemo(() => (mode === "admin" ? adminActions : customerActions), [mode]);

  const appendMessage = (next: Message) => {
    setMessages((current) => [...current, next]);
  };

  const handleSubmit = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading || !sessionId) {
      return;
    }

    appendMessage({
      id: `${Date.now()}-${Math.random()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    });
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          role,
          sessionId,
        }),
      });

      const data = await response.json();
      const reply = data?.reply ?? "Sorry, I could not answer that right now.";

      appendMessage({
        id: `${Date.now()}-${Math.random()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      appendMessage({
        id: `${Date.now()}-${Math.random()}`,
        role: "assistant",
        content: "Sorry, the assistant is temporarily unavailable. You can still contact a service advisor.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    if (inline) {
      return (
        <div className="w-full rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line bg-primary px-4 py-3 text-inverted">
            <div>
              <p className="font-heading text-xl">AutoCare Assistant</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-inverted/70">Online</p>
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
            <p className="text-[11px] uppercase tracking-[0.2em] text-inverted/70">Online</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "customer" ? null : (
              <select
                aria-label="Select user role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="max-w-[120px] rounded border border-white/20 bg-white/5 px-2 py-1 text-[11px] text-inverted"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-primary">
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className="text-sm text-inverted/80 hover:text-inverted">
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-canvas p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-inverted"
                      : "border border-line bg-surface text-ink"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted">
                  Typing…
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-line bg-surface p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setInput(action)}
                className="rounded-full border border-line bg-canvas px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted transition hover:border-accent hover:text-ink"
              >
                {action}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              aria-label="Ask the assistant"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }
              }}
              placeholder="Ask about your vehicle or service..."
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
