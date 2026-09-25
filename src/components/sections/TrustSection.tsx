import Image from "next/image";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getSite } from "@/lib/content";

export function TrustSection() {
  const { trust } = getSite();

  return (
    <section className="py-20 sm:py-28 bg-surface">
      <Container>
        <SectionHeader eyebrow="Why drivers stay" title={trust.title} description={trust.description} />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trust.items.map((item, index) => (
            <article
              key={item.title}
              className={`relative overflow-hidden min-h-[16rem] ${index === 0 ? "lg:col-span-2" : ""}`}
            >
              <Image
                src={item.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-primary/75" />
              <div className="relative z-10 h-full p-6 flex flex-col justify-end text-inverted">
                <h3 className="font-heading text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm text-inverted/75 max-w-md">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
