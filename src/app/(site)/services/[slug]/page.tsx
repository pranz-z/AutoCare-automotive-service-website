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
      <section className="bg-primary pt-[76px] text-inverted">
        <div className="mx-auto w-full max-w-[96rem] px-2 pb-2 sm:px-3">
          <div className="grid gap-2 lg:grid-cols-12">
            <div className="flex min-h-[30rem] flex-col justify-between border border-white/10 p-6 sm:p-9 lg:col-span-7 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <p className="meta text-accent">{service.category}</p>
                <p className="meta text-inverted/45">{service.duration}</p>
              </div>
              <div className="py-12">
                <h1 className="display max-w-4xl text-5xl sm:text-7xl lg:text-[6rem]">{service.name}</h1>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-inverted/70 sm:text-lg">
                  {service.description}
                </p>
                <p className="mt-6 font-heading text-2xl">
                  From {formatPrice(service.priceFrom, service.currency)}
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  <Button href={service.bookCta.href}>{service.bookCta.label}</Button>
                  <Button href="/quote" variant="secondary" className="text-inverted">
                    Get a quote
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative min-h-[22rem] overflow-hidden border border-white/10 bg-secondary lg:col-span-5">
              <Image
                src={service.image}
                alt={service.name}
                fill
                preload
                className="object-cover opacity-75"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div className="absolute inset-0 bg-primary/20" />
              <div className="absolute inset-x-4 bottom-4 border border-white/20 bg-primary/90 p-4 sm:inset-x-6 sm:bottom-6">
                <p className="meta text-accent">Service note</p>
                <p className="mt-2 text-sm leading-relaxed text-inverted/70">{service.vehicleCompatibility}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
        <div>
          <section>
            <h2 className="font-heading text-4xl">What’s included</h2>
            <ul className="mt-5 border-t border-line">
              {service.included.map((item) => (
                <li key={item} className="border-b border-line py-3.5 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="font-heading text-4xl">Benefits</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {service.benefits.map((item) => (
                <li key={item} className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12 border-t border-line pt-8">
            <h2 className="font-heading text-4xl">Vehicle compatibility</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{service.vehicleCompatibility}</p>
          </section>
        </div>

        <aside className="h-fit border border-line bg-surface p-6">
          <p className="meta text-accent">Service notes</p>
          <h2 className="mt-3 font-heading text-3xl">Before you book</h2>
          <ul className="mt-5 border-t border-line">
            {service.faqs.map((item) => (
              <li key={item.question} className="border-b border-line py-4">
                <p className="font-medium">{item.question}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.answer}</p>
              </li>
            ))}
          </ul>
          <Button href={service.bookCta.href} className="mt-6 w-full">
            {service.bookCta.label}
          </Button>
        </aside>
      </Container>
    </>
  );
}
