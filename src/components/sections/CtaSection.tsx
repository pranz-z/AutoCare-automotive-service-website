import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { images } from "@/config/images";
import { getPartners, getSite } from "@/lib/content";

export function CtaSection() {
  const { hero, company } = getSite();
  return (
    <section className="relative overflow-hidden">
      <div className="relative min-h-[22rem]">
        <Image src={images.cta} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-primary/80" />
        <Container className="relative z-10 py-20 text-inverted">
          <p className="text-[12px] tracking-[0.22em] uppercase text-accent">{company.tagline}</p>
          <h2 className="font-heading mt-3 text-4xl sm:text-5xl max-w-xl">
            Ready when your calendar is.
          </h2>
          <p className="mt-4 max-w-lg text-inverted/70">
            Book a technician or request a written quote. Same standards, whether we come to you or you come to the bay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={hero.primaryCTA.href}>{hero.primaryCTA.label}</Button>
            <Button href={hero.secondaryCTA.href} variant="secondary" className="text-inverted border-white/25">
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
    <section className="py-16 border-t border-line">
      <Container>
        <p className="text-[12px] tracking-[0.22em] uppercase text-muted">Parts & equipment partners</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {partners.map((partner) => (
            <div key={partner.name} className="border border-line px-4 py-5">
              <p className="font-heading text-lg">{partner.logo}</p>
              <p className="text-sm mt-1">{partner.name}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{partner.type}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
