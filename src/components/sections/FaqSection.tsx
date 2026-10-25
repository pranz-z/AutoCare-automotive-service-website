"use client";

import { Minus, Plus } from "lucide-react";
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
    <section id="faq" className="border-y border-line bg-surface py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:h-fit">
          <SectionHeader
            eyebrow="FAQ"
            title="Straight answers before you book"
            description="Booking, pricing, vehicles, payments, and warranty—editable from the site configuration."
          />
        </div>

        <div className="lg:col-span-8">
          <div className="flex gap-5 overflow-x-auto border-b border-line pb-0 no-scrollbar">
            {faqCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  setOpen(null);
                }}
                className={`whitespace-nowrap border-b-2 px-0 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  category === item
                    ? "border-accent text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            {filtered.map((item) => {
              const expanded = open === item.id;
              return (
                <div key={item.id} className={expanded ? "bg-accent text-accent-contrast" : "bg-canvas"}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left sm:px-5"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : item.id)}
                  >
                    <span className="font-heading text-xl leading-tight">{item.question}</span>
                    {expanded ? <Minus className="h-5 w-5 shrink-0" /> : <Plus className="h-5 w-5 shrink-0" />}
                  </button>
                  {expanded ? (
                    <p className="max-w-[52ch] px-4 pb-5 text-sm leading-relaxed text-accent-contrast/75 sm:px-5">
                      {item.answer}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
