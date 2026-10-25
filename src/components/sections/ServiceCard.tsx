import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ServiceItem } from "@/types/content";
import { formatPrice } from "@/lib/content";
import { Badge } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";

export function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <article className="group relative flex min-h-[28rem] flex-col justify-end overflow-hidden border border-white/10 bg-primary text-inverted">
      <Image
        src={service.image}
        alt={service.name}
        fill
        className="object-cover opacity-60 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.03]"
        sizes="(max-width: 1024px) 100vw, 55vw"
      />
      <div className="absolute inset-0 bg-primary/35" />
      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
          <Badge>{service.category}</Badge>
          <span className="text-xs text-inverted/55">{service.duration}</span>
        </div>
        <h3 className="display mt-5 text-4xl sm:text-5xl">{service.name}</h3>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-inverted/70">{service.shortDescription}</p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-4">
          <p className="font-heading text-2xl leading-none">
            From {formatPrice(service.priceFrom, service.currency)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button href={service.cta.href} variant="light" className="min-h-10 px-4">
              {service.cta.label}
            </Button>
            <Link
              href={service.bookCta.href}
              className="inline-flex min-h-10 items-center gap-1 border border-white/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted transition-colors hover:border-accent hover:text-accent"
            >
              {service.bookCta.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ServiceRow({ service }: { service: ServiceItem }) {
  return (
    <Link
      href={service.cta.href}
      className="group grid grid-cols-[4.5rem_1fr] gap-3 border-b border-line py-4 transition-colors hover:bg-surface sm:grid-cols-[5rem_1fr_auto] sm:gap-4"
    >
      <div className="relative h-16 overflow-hidden border border-line bg-primary sm:h-[4.5rem]">
        <Image
          src={service.image}
          alt=""
          fill
          className="object-cover opacity-80 transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-105"
          sizes="80px"
        />
      </div>
      <div className="min-w-0">
        <p className="meta text-accent">{service.category}</p>
        <h3 className="mt-1 font-heading text-xl leading-tight">{service.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{service.shortDescription}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 border-t border-line pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <p className="text-sm font-semibold">From {formatPrice(service.priceFrom, service.currency)}</p>
        <p className="mt-1 text-xs text-muted">{service.duration}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          View
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
