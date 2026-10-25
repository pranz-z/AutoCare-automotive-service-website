import { ConfigIcon } from "@/components/ui/ConfigIcon";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getSite } from "@/lib/content";

export function HowItWorks() {
  const { howItWorks } = getSite();

  return (
    <section id="how-it-works" className="border-y border-white/10 bg-primary py-20 text-inverted sm:py-28">
      <Container>
        <SectionHeader
          light
          eyebrow="How it works"
          title={howItWorks.title}
          description={howItWorks.description}
        />
        <div className="mt-14 grid gap-0 border-t border-white/15 lg:grid-cols-3">
          {howItWorks.steps.map((step, index) => (
            <article
              key={step.number}
              className={`relative border-b border-white/10 py-8 lg:border-b-0 lg:px-8 ${
                index > 0 ? "lg:border-l lg:border-white/10" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="meta text-accent">{step.number}</p>
                <span className="grid h-11 w-11 place-items-center border border-white/15 text-accent">
                  <ConfigIcon name={step.icon} />
                </span>
              </div>
              <h3 className="mt-8 font-heading text-2xl leading-tight text-inverted">{step.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-inverted/60">{step.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
