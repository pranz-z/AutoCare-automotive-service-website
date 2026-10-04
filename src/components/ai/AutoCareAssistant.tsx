"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: { label: string; href: string }[];
};

const customerActions = [
  "Book a Service",
  "How do I request a quote?",
  "Service Pricing",
  "Vehicle Maintenance",
  "Find a Branch",
];

const MAX_MESSAGE_LENGTH = 800;

export function AutoCareAssistant({
  mode = "customer",
  inline = false,
}: {
  mode?: "customer" | "admin";
  inline?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(mode === "admin");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi, I’m AutoCare Assistant. I can help with public service, vehicle, location, and maintenance information. For booking details, please contact us directly.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const actions = useMemo(() => customerActions, []);

  const appendMessage = (next: Message) => {
    setMessages((current) => [...current, next]);
  };

  const handleSubmit = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading || trimmed.length > MAX_MESSAGE_LENGTH) {
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
          history: messages.filter((item) => item.id !== "welcome").slice(-4).map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();
      const reply = data?.reply ?? "Sorry, I could not answer that right now. Please contact us for help.";

      appendMessage({
        id: `${Date.now()}-${Math.random()}`,
        role: "assistant",
        content: reply,
        sources: Array.isArray(data?.sources) ? data.sources : [],
        timestamp: new Date().toISOString(),
      });
    } catch {
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
            <span className="text-[11px] text-inverted/70">Public information</span>
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
                  {message.sources?.length ? (
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2 text-xs">
                      {message.sources.map((source) => (
                        <li key={source.href}><a href={source.href} className="text-accent underline underline-offset-2">{source.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
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
              maxLength={MAX_MESSAGE_LENGTH}
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
