import { ConfigIcon } from "@/components/ui/ConfigIcon";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getSite } from "@/lib/content";

export function HowItWorks() {
  const { howItWorks } = getSite();

  return (
    <section id="how-it-works" className="bg-primary text-inverted py-20 sm:py-28">
      <Container>
        <SectionHeader
          light
          eyebrow="How it works"
          title={howItWorks.title}
          description={howItWorks.description}
        />
        <div className="mt-14 grid gap-0 lg:grid-cols-3 relative">
          <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
          {howItWorks.steps.map((step) => (
            <div key={step.number} className="relative px-2 py-8 lg:px-8 border-t border-white/10 lg:border-t-0">
              <p className="font-heading text-6xl text-accent/80">{step.number}</p>
              <div className="mt-4 inline-flex h-10 w-10 items-center justify-center border border-accent/40 text-accent">
                <ConfigIcon name={step.icon} />
              </div>
              <h3 className="font-heading mt-5 text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-inverted/65">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
