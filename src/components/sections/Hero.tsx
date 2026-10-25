import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfigIcon } from "@/components/ui/ConfigIcon";
import { getCompany, getSite } from "@/lib/content";

export function Hero() {
  const { hero, stats, trust } = getSite();
  const company = getCompany();
  const report = trust.items.find((item) => item.title === "Transparent Pricing") ?? trust.items[0];
  const warranty = trust.items.find((item) => item.title === "Service Warranty") ?? trust.items[1];
  const headlineLines = hero.title.split("\n");

  return (
    <section className="relative bg-primary pt-[76px] text-inverted">
      <div className="mx-auto w-full max-w-[96rem] px-2 pb-2 sm:px-3">
        <div className="grid gap-2 lg:min-h-[calc(100svh-84px)] lg:grid-cols-12">
          <div className="flex flex-col justify-between border border-white/10 bg-primary p-5 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
              <p className="meta text-accent">{hero.eyebrow}</p>
              <p className="meta text-inverted/65">{company.tagline}</p>
            </div>

            <div className="py-12 lg:py-16">
              <h1 className="display max-w-5xl text-[clamp(2.8rem,4.2vw,4.75rem)]">
                {headlineLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-inverted/75 sm:text-lg">
                {hero.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                <Button href={hero.primaryCTA.href}>
                  {hero.primaryCTA.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={hero.secondaryCTA.href} variant="secondary" className="text-inverted">
                  {hero.secondaryCTA.label}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-primary px-3 py-4 first:pl-0 sm:px-5">
                  <div className="mb-1 flex items-center gap-2 text-accent">
                    <ConfigIcon name={stat.icon} className="h-4 w-4" />
                    <p className="font-heading text-2xl leading-none text-inverted sm:text-3xl">{stat.value}</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-inverted/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 lg:col-span-5">
            <div className="relative min-h-[22rem] overflow-hidden border border-white/10 bg-secondary">
              <Image
                src={hero.backgroundImage}
                alt="Technician performing an on-site oil service"
                fill
                preload
                className="object-cover object-center animate-reveal"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div className="absolute inset-0 bg-primary/20" />
              <div className="absolute inset-x-4 bottom-4 border border-white/20 bg-primary/90 p-4 sm:inset-x-6 sm:bottom-6">
                <p className="meta text-accent">Service mode</p>
                <p className="mt-2 font-heading text-2xl uppercase leading-none">Workshop or driveway</p>
                <p className="mt-2 text-sm leading-relaxed text-inverted/75">
                  {company.operatingHours.note}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border border-white/10 bg-secondary p-5">
                <p className="meta text-inverted/65">After the visit</p>
                <p className="mt-3 font-heading text-2xl uppercase leading-none">Written findings</p>
                <p className="mt-2 text-sm leading-relaxed text-inverted/70">{report?.description}</p>
              </div>
              <div className="border border-white/10 bg-accent p-5 text-accent-contrast">
                <p className="meta">Covered work</p>
                <p className="mt-3 font-heading text-2xl uppercase leading-none">Service warranty</p>
                <p className="mt-2 text-sm leading-relaxed text-accent-contrast">{warranty?.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
