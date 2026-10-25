import Image from "next/image";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getSite } from "@/lib/content";

export function TrustSection() {
  const { trust } = getSite();

  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:h-fit">
          <SectionHeader eyebrow="Why drivers stay" title={trust.title} description={trust.description} />
        </div>

        <div className="border-t border-line lg:col-span-8">
          {trust.items.map((item) => (
            <article
              key={item.title}
              className="group grid gap-4 border-b border-line py-5 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-6"
            >
              <div className="relative h-28 overflow-hidden border border-line bg-primary">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover opacity-80 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 144px"
                />
              </div>
              <div>
                <h3 className="font-heading text-2xl leading-tight">{item.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
