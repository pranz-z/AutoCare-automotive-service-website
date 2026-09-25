import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { ConfigIcon } from "@/components/ui/ConfigIcon";
import { getCompany, getSite } from "@/lib/content";

export function Hero() {
  const { hero, stats } = getSite();
  const company = getCompany();

  return (
    <section className="relative min-h-[92vh] bg-primary text-inverted overflow-hidden">
      <Image
        src={hero.backgroundImage}
        alt="Professional automotive service"
        fill
        priority
        className="object-cover object-center animate-reveal"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/25" />
      <div className="absolute inset-0 tech-grid opacity-40" />
      <Container className="relative z-10 flex min-h-[92vh] flex-col justify-end pb-28 pt-32">
        <p className="animate-fade-up text-[12px] tracking-[0.28em] uppercase text-accent">
          {hero.eyebrow}
        </p>
        <h1 className="animate-fade-up delay-1 mt-5 font-heading text-4xl sm:text-6xl lg:text-[4.6rem] leading-[0.95] max-w-4xl whitespace-pre-line">
          {hero.title}
        </h1>
        <p className="animate-fade-up delay-2 mt-6 max-w-xl text-lg text-inverted/75 leading-relaxed">
          {hero.description}
        </p>
        <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3">
          <Button href={hero.primaryCTA.href}>
            {hero.primaryCTA.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href={hero.secondaryCTA.href} variant="secondary" className="text-inverted border-white/25">
            {hero.secondaryCTA.label}
          </Button>
        </div>
        <p className="animate-fade-up delay-4 mt-6 text-sm text-inverted/55">{company.tagline}</p>
      </Container>
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-[72rem] grid grid-cols-2 lg:grid-cols-4 border-t border-white/10 bg-primary/80 backdrop-blur">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-5 py-5 sm:px-8 border-white/10 border-r last:border-r-0 even:border-l lg:even:border-l-0"
            >
              <div className="flex items-center gap-2 text-accent mb-1">
                <ConfigIcon name={stat.icon} className="h-4 w-4" />
                <p className="font-heading text-2xl sm:text-3xl text-inverted">{stat.value}</p>
              </div>
              <p className="text-[11px] tracking-[0.16em] uppercase text-inverted/55">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
