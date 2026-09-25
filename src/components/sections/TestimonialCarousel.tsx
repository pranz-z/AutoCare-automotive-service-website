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
        <div className="flex items-end justify-between gap-6">
          <SectionHeader
            eyebrow="Customers"
            title="What drivers notice after the visit"
            description="Ratings and comments from real booking records—names and vehicles as submitted."
          />
          <div className="hidden sm:flex gap-2">
            <button
              type="button"
              aria-label="Previous testimonial"
              className="h-10 w-10 border border-line hover:bg-surface"
              onClick={() => setIndex((value) => (value === 0 ? items.length - 1 : value - 1))}
            >
              <ChevronLeft className="mx-auto" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              className="h-10 w-10 border border-line hover:bg-surface"
              onClick={() => setIndex((value) => (value + 1) % items.length)}
            >
              <ChevronRight className="mx-auto" />
            </button>
          </div>
        </div>
        <figure className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_0.6fr] bg-primary text-inverted p-8 sm:p-12">
          <blockquote>
            <div className="flex gap-1 text-accent" aria-label={`${current.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < current.rating ? "fill-accent" : "opacity-30"}`}
                />
              ))}
            </div>
            <p className="font-heading mt-6 text-2xl sm:text-3xl leading-snug">“{current.message}”</p>
          </blockquote>
          <figcaption className="flex items-center gap-4 lg:justify-end">
            <Image
              src={current.avatar}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 object-cover"
            />
            <div>
              <p className="font-heading text-lg">{current.customer}</p>
              <p className="text-sm text-inverted/65">
                {current.location} · {current.vehicle}
              </p>
            </div>
          </figcaption>
        </figure>
        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-2 w-8 ${i === index ? "bg-accent" : "bg-line"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
