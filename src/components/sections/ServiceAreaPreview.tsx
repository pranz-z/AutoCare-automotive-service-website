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
      <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div>
          <SectionHeader
            eyebrow="Service areas"
            title="Coverage where the work actually happens"
            description={`Teams dispatch across ${stats.availableCities} cities in ${stats.provinces} provinces. Search your city, then book a window that fits.`}
          />
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Provinces", value: String(stats.provinces) },
              { label: "Cities listed", value: String(stats.cities) },
              { label: "Active coverage", value: String(stats.availableCities) },
            ].map((item) => (
              <div key={item.label} className="border border-line bg-surface p-4">
                <p className="font-heading text-3xl">{item.value}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {areas.slice(0, 6).map((area) => (
              <li key={area.id} className="border border-line px-3 py-1.5 text-sm">
                {area.province}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex gap-3">
            <Button href="/locations">Check Availability</Button>
            <Button href="/contact" variant="light">
              Request a city
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted">
            Based in {company.address.city}, serving {company.address.country}.
          </p>
        </div>
        <div className="relative min-h-[22rem] overflow-hidden bg-primary">
          <Image
            src={images.locations}
            alt="Service coverage across urban roads"
            fill
            className="object-cover opacity-60"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
          <div className="absolute inset-6 border border-white/20 p-5 text-inverted">
            <p className="text-[11px] tracking-[0.2em] uppercase text-accent">Coverage panel</p>
            <p className="font-heading text-2xl mt-2 max-w-xs">
              Map-ready layout — plug in a live map when you need it.
            </p>
            <p className="mt-3 text-sm text-inverted/70">
              Coordinates and city lists are already structured for a mapping provider.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
