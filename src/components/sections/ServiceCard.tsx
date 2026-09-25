import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ServiceItem } from "@/types/content";
import { formatPrice } from "@/lib/content";
import { Badge } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";

export function ServiceCard({ service, featured = false }: { service: ServiceItem; featured?: boolean }) {
  return (
    <article
      className={`group relative overflow-hidden bg-primary text-inverted border border-white/10 transition duration-300 hover:-translate-y-1 ${featured ? "sm:col-span-2 min-h-[22rem]" : "min-h-[20rem]"}`}
    >
      <Image
        src={service.image}
        alt={service.name}
        fill
        className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-[1.03] transition duration-700"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-7">
        <Badge>{service.category}</Badge>
        <h3 className="font-heading mt-3 text-2xl">{service.name}</h3>
        <p className="mt-2 text-sm text-inverted/70 max-w-md">{service.shortDescription}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-accent">From {formatPrice(service.priceFrom, service.currency)}</span>
          <span className="text-inverted/55">{service.duration}</span>
        </div>
        <div className="mt-5 flex gap-3">
          <Button href={service.cta.href} variant="light" className="text-xs">
            {service.cta.label}
          </Button>
          <Link
            href={service.bookCta.href}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-inverted"
          >
            {service.bookCta.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
