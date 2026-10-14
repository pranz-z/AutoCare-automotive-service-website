import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { formatPrice, getService, getServices } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getServices().map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Service" };
  return {
    title: service.name,
    description: service.shortDescription,
    openGraph: { images: [{ url: service.image, alt: service.name }] },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <>
      <section className="relative min-h-[48vh] bg-primary text-inverted">
        <Image src={service.image} alt={service.name} fill className="object-cover opacity-45" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-primary/20" />
        <Container className="relative z-10 pt-32 pb-16">
          <p className="text-[12px] uppercase tracking-[0.22em] text-accent">{service.category}</p>
          <h1 className="font-heading mt-3 text-4xl sm:text-6xl">{service.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-inverted/75">{service.description}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <span>From {formatPrice(service.priceFrom, service.currency)}</span>
            <span>{service.duration}</span>
          </div>
          <div className="mt-8 flex gap-3">
            <Button href={service.bookCta.href}>{service.bookCta.label}</Button>
            <Button href="/quote" variant="secondary" className="text-inverted border-white/25">
              Get a quote
            </Button>
          </div>
        </Container>
      </section>
      <Container className="py-16 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="font-heading text-3xl">What’s included</h2>
          <ul className="mt-4 space-y-2">
            {service.included.map((item) => (
              <li key={item} className="border-b border-line py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
          <h2 className="font-heading text-3xl mt-12">Benefits</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {service.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="font-heading text-3xl mt-12">Vehicle compatibility</h2>
          <p className="mt-3 text-muted">{service.vehicleCompatibility}</p>
        </div>
        <aside className="border border-line bg-surface p-6 h-fit">
          <h2 className="font-heading text-2xl">Service notes</h2>
          <ul className="mt-4 space-y-3">
            {service.faqs.map((item) => (
              <li key={item.question}>
                <p className="font-medium">{item.question}</p>
                <p className="text-sm text-muted mt-1">{item.answer}</p>
              </li>
            ))}
          </ul>
          <Button href={service.bookCta.href} className="w-full mt-6">
            {service.bookCta.label}
          </Button>
        </aside>
      </Container>
    </>
  );
}
