import type { Metadata } from "next";
import Image from "next/image";
import { CtaSection } from "@/components/sections/CtaSection";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getSite } from "@/lib/content";

const { about, company } = getSite();

export const metadata: Metadata = {
  title: "About",
  description: about.story[0],
};

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow={about.eyebrow} title={about.title} description={company.description} />
      <Container className="space-y-16 py-16 sm:py-20">
        <div className="grid gap-8 border-b border-line pb-12 lg:grid-cols-12">
          <p className="meta text-accent lg:col-span-3">Workshop standards</p>
          <div className="grid gap-5 lg:col-span-9 lg:grid-cols-2">
            {about.story.map((paragraph) => (
              <p key={paragraph.slice(0, 20)} className="text-base leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="grid border-y border-line md:grid-cols-3">
          {[
            { title: "Mission", body: about.mission },
            { title: "Vision", body: about.vision },
            { title: "Why we exist", body: about.whyWeExist },
          ].map((item, index) => (
            <article
              key={item.title}
              className={`py-6 md:px-6 ${index > 0 ? "border-t border-line md:border-l md:border-t-0" : "md:pl-0"}`}
            >
              <p className="meta text-accent">{item.title}</p>
              <p className="mt-4 text-base leading-relaxed text-ink">{item.body}</p>
            </article>
          ))}
        </div>

        <section className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="font-heading text-4xl">Service philosophy</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">{about.philosophy}</p>
          </div>
          <ul className="border-t border-line lg:col-span-8">
            {about.standards.map((item) => (
              <li key={item} className="border-b border-line py-4 text-sm leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-4xl">Technicians</h2>
            <p className="text-sm text-muted">Workshop and mobile teams</p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {about.technicians.map((person) => (
              <article key={person.name} className="group">
                <div className="relative h-72 overflow-hidden border border-line bg-primary">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover opacity-85 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="border-x border-b border-line p-4">
                  <h3 className="font-heading text-2xl leading-none">{person.name}</h3>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-accent">{person.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{person.focus}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Container>
      <CtaSection />
    </>
  );
}
