"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { faqCategories } from "@/config/faqs";
import { getFaqs } from "@/lib/content";

export function FaqSection() {
  const faqs = getFaqs();
  const [category, setCategory] = useState<(typeof faqCategories)[number]>("General");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(
    () => faqs.filter((item) => item.category === category),
    [faqs, category],
  );

  return (
    <section id="faq" className="py-20 sm:py-28 bg-surface">
      <Container>
        <SectionHeader
          eyebrow="FAQ"
          title="Straight answers before you book"
          description="Booking, pricing, vehicles, payments, and warranty—editable from the site configuration."
        />
        <div className="mt-8 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {faqCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item);
                setOpen(null);
              }}
              className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.14em] border ${
                category === item ? "bg-primary text-inverted border-primary" : "border-line bg-canvas"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 divide-y divide-line border border-line">
          {filtered.map((item) => {
            const expanded = open === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : item.id)}
                >
                  <span className="font-heading text-lg">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded ? (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
