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
      <Container className="py-16 space-y-16">
        <div className="grid gap-10 lg:grid-cols-2">
          {about.story.map((paragraph) => (
            <p key={paragraph.slice(0, 20)} className="text-lg leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Mission", body: about.mission },
            { title: "Vision", body: about.vision },
            { title: "Why we exist", body: about.whyWeExist },
          ].map((item) => (
            <article key={item.title} className="bg-primary text-inverted p-6 min-h-[16rem]">
              <h2 className="font-heading text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm text-inverted/70 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
        <section>
          <h2 className="font-heading text-3xl">Service philosophy</h2>
          <p className="mt-3 max-w-3xl text-muted">{about.philosophy}</p>
          <ul className="mt-6 grid sm:grid-cols-2 gap-3">
            {about.standards.map((item) => (
              <li key={item} className="border border-line bg-surface px-4 py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-heading text-3xl mb-6">Technicians</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {about.technicians.map((person) => (
              <article key={person.name} className="bg-surface border border-line">
                <div className="relative h-56">
                  <Image src={person.image} alt={person.name} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-xl">{person.name}</h3>
                  <p className="text-sm text-accent">{person.role}</p>
                  <p className="text-sm text-muted mt-2">{person.focus}</p>
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
