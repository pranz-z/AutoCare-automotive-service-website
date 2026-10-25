import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { images } from "@/config/images";
import { getPartners, getSite } from "@/lib/content";

export function CtaSection() {
  const { hero, company } = getSite();
  return (
    <section className="relative overflow-hidden border-y border-white/10">
      <div className="relative min-h-[30rem]">
        <Image src={images.cta} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-primary/75" />
        <Container className="relative z-10 flex min-h-[30rem] flex-col justify-center py-20 text-inverted">
          <p className="meta text-accent">{company.tagline}</p>
          <h2 className="display mt-4 max-w-3xl text-5xl sm:text-7xl">
            Ready when your calendar is.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-inverted/70">
            Book a technician or request a written quote. Same standards, whether we come to you or you come to the bay.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button href={hero.primaryCTA.href}>{hero.primaryCTA.label}</Button>
            <Button href={hero.secondaryCTA.href} variant="secondary" className="text-inverted">
              {hero.secondaryCTA.label}
            </Button>
          </div>
        </Container>
      </div>
    </section>
  );
}

export function PartnersStrip() {
  const partners = getPartners();
  return (
    <section className="border-t border-line py-16">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="meta text-muted">Parts & equipment partners</p>
          <p className="text-xs text-muted">Audited supply chain</p>
        </div>
        <div className="mt-6 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner, index) => (
            <div
              key={partner.name}
              className={`border-b border-line py-5 lg:border-b-0 lg:border-r lg:px-5 ${
                index === 0 ? "lg:pl-0" : ""
              } ${index === partners.length - 1 ? "lg:border-r-0 lg:pr-0" : ""}`}
            >
              <p className="font-heading text-2xl leading-none">{partner.logo}</p>
              <p className="mt-2 text-sm">{partner.name}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted">{partner.type}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
