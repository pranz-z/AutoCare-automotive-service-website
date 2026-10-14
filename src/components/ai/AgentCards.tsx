"use client";

import Link from "next/link";
import type { AgentCard } from "@/lib/agent/types";

/**
 * Deterministic record cards built server-side from tool data. React escapes
 * all values, so stored inquiry text containing markup renders as inert text.
 * Tight lines inside a record, visible gap between cards, no empty fields.
 *
 * Card titles (and the Reference row) link to the record's admin page — but
 * only for same-origin relative paths matching the fixed record routes, so a
 * crafted href can never navigate off-site or run a pseudo-protocol.
 */
const ADMIN_CARD_HREF = /^\/admin\/(?:appointments|inquiries|customers|chats)\?open=[a-zA-Z0-9_-]+$/;

export function safeCardHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  if (href.includes("://") || href.startsWith("//") || href.includes(":")) return undefined;
  return ADMIN_CARD_HREF.test(href) ? href : undefined;
}

const linkClass =
  "font-medium leading-snug text-ink underline-offset-2 hover:underline " +
  "focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function AgentCards({ cards }: { cards: AgentCard[] }) {
  if (!cards.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {cards.map((card, i) => {
        const href = safeCardHref(card.href);
        const title = (
          <>
            <p className={`text-sm ${href ? linkClass : "font-medium leading-snug text-ink"}`}>{card.title}</p>
            {card.subtitle && <p className="text-xs text-muted">{card.subtitle}</p>}
          </>
        );
        return (
          <div key={i} className="rounded-md border border-line bg-surface px-3 py-2">
            {href ? (
              <Link href={href} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {title}
              </Link>
            ) : (
              title
            )}
            <div className="mt-1">
              {card.fields
                .filter((f) => f.value)
                .map((f, j) => (
                  <p key={j} className="text-xs leading-snug text-ink">
                    <span className="font-semibold text-muted">{f.label}:</span>{" "}
                    {href && f.label === "Reference" ? (
                      <Link href={href} className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        {f.value}
                      </Link>
                    ) : (
                      f.value
                    )}
                  </p>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
