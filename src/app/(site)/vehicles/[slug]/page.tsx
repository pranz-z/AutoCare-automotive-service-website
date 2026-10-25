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
      <Container className="py-16 sm:py-20">
        <div className="border-b border-line">
          {brand.models.map((model) => (
            <article key={model.name} className="grid gap-4 border-t border-line py-6 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="font-heading text-3xl leading-none">{model.name}</h2>
                  <p className="text-sm text-muted">{model.years}</p>
                </div>
                <p className="mt-4 text-[10px] uppercase tracking-[0.12em] text-muted">Supported services</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {model.services.map((id) => {
                    const service = getService(id);
                    if (!service) return null;
                    return (
                      <li key={id}>
                        <Link
                          href={`/services/${service.slug}`}
                          className="inline-flex border border-line px-3 py-1.5 text-xs transition-colors hover:border-accent hover:text-accent"
                        >
                          {service.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <Link
                href={`/book?service=${encodeURIComponent(model.services[0] ?? "")}`}
                className="inline-flex min-h-10 items-center justify-center border border-line px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent sm:mt-1"
              >
                Book this model
              </Link>
            </article>
          ))}
        </div>
        <Button href="/book" className="mt-8">
          Book this brand
        </Button>
      </Container>
    </>
  );
}
