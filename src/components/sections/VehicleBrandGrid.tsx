import Link from "next/link";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getVehicleBrands } from "@/lib/content";

export function VehicleBrandGrid({ compact = false }: { compact?: boolean }) {
  const brands = getVehicleBrands();

  return (
    <section className="py-20 sm:py-24 border-y border-line bg-surface">
      <Container>
        <SectionHeader
          eyebrow="Vehicles we service"
          title="Most makes. The right fluids. The right scan tool."
          description="From daily commuters to European platforms, technicians work to manufacturer data rather than a generic job card."
        />
        <div className="mt-10 overflow-hidden">
          <div className="marquee flex w-max gap-3">
            {[...brands, ...brands].map((brand, index) => (
              <Link
                key={`${brand.id}-${index}`}
                href={`/vehicles/${brand.id}`}
                className="min-w-[9.5rem] border border-line px-4 py-5 text-center hover:border-ink/40 hover:bg-canvas"
              >
                <span className="block font-heading text-xl">{brand.logo}</span>
                <span className="mt-1 block text-xs tracking-[0.12em] uppercase text-muted">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
        {!compact ? (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/vehicles/${brand.id}`}
                className="border border-line bg-canvas/50 px-4 py-5 hover:border-accent"
              >
                <p className="font-heading text-lg">{brand.name}</p>
                <p className="text-xs text-muted mt-1">{brand.models.length} models</p>
              </Link>
            ))}
          </div>
        ) : null}
        <p className="mt-8">
          <Link href="/vehicles" className="text-sm uppercase tracking-[0.16em] text-ink border-b border-accent pb-0.5">
            Browse all brands
          </Link>
        </p>
      </Container>
    </section>
  );
}
