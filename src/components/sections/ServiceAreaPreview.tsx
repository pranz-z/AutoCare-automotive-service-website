import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getLocationStats, getLocations, getSite } from "@/lib/content";
import { images } from "@/config/images";

export function ServiceAreaPreview() {
  const areas = getLocations();
  const stats = getLocationStats();
  const company = getSite().company;

  return (
    <section className="py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-6 lg:pr-6">
          <SectionHeader
            eyebrow="Service areas"
            title="Coverage where the work actually happens"
            description={`Teams dispatch across ${stats.availableCities} cities in ${stats.provinces} provinces. Search your city, then book a window that fits.`}
          />
          <div className="mt-10 grid grid-cols-3 border-y border-line">
            {[
              { label: "Provinces", value: String(stats.provinces) },
              { label: "Cities listed", value: String(stats.cities) },
              { label: "Active coverage", value: String(stats.availableCities) },
            ].map((item, index) => (
              <div key={item.label} className={`py-5 ${index > 0 ? "border-l border-line pl-4" : ""}`}>
                <p className="font-heading text-4xl leading-none">{item.value}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted">{item.label}</p>
              </div>
            ))}
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {areas.slice(0, 6).map((area) => (
              <li key={area.id} className="border border-line px-3 py-1.5 text-xs text-muted">
                {area.province}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button href="/locations">Check Availability</Button>
            <Button href="/contact" variant="light">
              Request a city
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted">
            Based in {company.address.city}, serving {company.address.country}.
          </p>
        </div>

        <div className="relative min-h-[26rem] overflow-hidden border border-line bg-primary lg:col-span-6">
          <Image
            src={images.locations}
            alt="Service coverage across urban roads"
            fill
            className="object-cover opacity-70"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-primary/25" />
          <div className="absolute inset-5 flex flex-col justify-between border border-white/20 p-5 text-inverted sm:inset-7">
            <div className="flex items-center justify-between gap-4 border-b border-white/20 pb-3">
              <p className="meta text-accent">Coverage panel</p>
              <p className="meta text-inverted/50">PH / live</p>
            </div>
            <div>
              <p className="font-heading text-3xl uppercase leading-none sm:text-4xl">
                Map-ready layout — plug in a live map when you need it.
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-inverted/70">
                Coordinates and city lists are already structured for a mapping provider.
              </p>
              <Link
                href="/locations"
                className="mt-5 inline-flex items-center border-b border-accent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted"
              >
                Open coverage map
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
