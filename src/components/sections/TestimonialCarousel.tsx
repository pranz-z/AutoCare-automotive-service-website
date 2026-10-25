"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getTestimonials } from "@/lib/content";

export function TestimonialCarousel() {
  const items = getTestimonials();
  const [index, setIndex] = useState(0);
  const current = items[index];

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:flex-1">
            <SectionHeader
              eyebrow="Customers"
              title="What drivers notice after the visit"
              description="Ratings and comments from real booking records—names and vehicles as submitted."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous testimonial"
              className="grid h-11 w-11 place-items-center border border-line transition-colors hover:border-accent hover:text-accent"
              onClick={() => setIndex((value) => (value === 0 ? items.length - 1 : value - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              className="grid h-11 w-11 place-items-center border border-line transition-colors hover:border-accent hover:text-accent"
              onClick={() => setIndex((value) => (value + 1) % items.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <figure className="mt-12 grid overflow-hidden border border-line lg:grid-cols-[5fr_7fr]">
          <div className="flex min-h-[16rem] flex-col justify-between bg-primary p-6 text-inverted sm:p-8">
            <div className="flex gap-1 text-accent" aria-label={`${current.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < current.rating ? "fill-accent" : "opacity-30"}`} />
              ))}
            </div>
            <figcaption className="flex items-center gap-4">
              <Image
                src={current.avatar}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 border border-white/20 object-cover"
              />
              <div>
                <p className="font-heading text-xl leading-none">{current.customer}</p>
                <p className="mt-1 text-sm text-inverted/55">
                  {current.location} · {current.vehicle}
                </p>
              </div>
            </figcaption>
          </div>

          <blockquote className="flex min-h-[16rem] flex-col justify-between bg-accent p-6 text-accent-contrast sm:p-8">
            <p className="meta">Driver log</p>
            <p className="mt-8 max-w-[28ch] font-heading text-3xl leading-[1.08] sm:text-4xl">
              “{current.message}”
            </p>
          </blockquote>
        </figure>

        <div className="mt-4 flex gap-2 sm:hidden">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-1.5 flex-1 ${i === index ? "bg-accent" : "bg-line"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
