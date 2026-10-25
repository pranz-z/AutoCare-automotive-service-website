import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getVehicleBrands } from "@/lib/content";

export function VehicleBrandGrid({ compact = false }: { compact?: boolean }) {
  const brands = getVehicleBrands();

  return (
    <section className="border-y border-line bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeader
          eyebrow="Vehicles we service"
          title="Most makes. The right fluids. The right scan tool."
          description="From daily commuters to European platforms, technicians work to manufacturer data rather than a generic job card."
        />

        <div className="mt-10 w-full max-w-full overflow-x-clip border-y border-line [contain:paint]">
          <div className="marquee flex w-max">
            {[...brands, ...brands].map((brand, index) => (
              <Link
                key={`${brand.id}-${index}`}
                href={`/vehicles/${brand.id}`}
                className="flex min-w-[11rem] items-center gap-3 border-r border-line px-4 py-4 transition-colors hover:bg-canvas"
              >
                <span className="font-heading text-2xl leading-none text-ink">{brand.logo}</span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {!compact ? (
          <div className="mt-10 border-b border-line">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/vehicles/${brand.id}`}
                className="group grid gap-2 border-t border-line py-4 transition-colors hover:bg-canvas sm:grid-cols-[11rem_1fr_auto] sm:items-center sm:gap-6"
              >
                <p className="font-heading text-2xl leading-none">{brand.name}</p>
                <p className="text-sm text-muted">
                  {brand.models.slice(0, 3).map((model) => model.name).join(" · ")}
                  {brand.models.length > 3 ? ` +${brand.models.length - 3} more` : ""}
                </p>
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted group-hover:text-accent">
                  {brand.models.length} models
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <p className="mt-6">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 border-b border-accent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink"
          >
            Browse all brands
            <ArrowUpRight className="h-4 w-4 text-accent" />
          </Link>
        </p>
      </Container>
    </section>
  );
}
