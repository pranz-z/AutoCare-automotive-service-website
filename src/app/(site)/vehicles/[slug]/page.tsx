import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getService, getVehicleBrand, getVehicleBrands } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getVehicleBrands().map((brand) => ({ slug: brand.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = getVehicleBrand(slug);
  return { title: brand?.name ?? "Brand", description: brand ? `Service support for ${brand.name}.` : undefined };
}

export default async function VehicleBrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = getVehicleBrand(slug);
  if (!brand) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Vehicles"
        title={brand.name}
        description={`${brand.models.length} models with mapped maintenance and repair services.`}
      />
      <Container className="py-16 space-y-6">
        {brand.models.map((model) => (
          <article key={model.name} className="border border-line bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-heading text-2xl">{model.name}</h2>
              <p className="text-sm text-muted">{model.years}</p>
            </div>
            <p className="text-[12px] uppercase tracking-[0.14em] text-muted mt-4">Supported services</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {model.services.map((id) => {
                const service = getService(id);
                if (!service) return null;
                return (
                  <li key={id}>
                    <Link href={`/services/${service.slug}`} className="border border-line px-3 py-1.5 text-sm hover:border-accent">
                      {service.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
        <Button href="/book">Book this brand</Button>
      </Container>
    </>
  );
}
