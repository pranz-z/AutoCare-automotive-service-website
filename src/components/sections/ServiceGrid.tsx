import { ServiceCard, ServiceRow } from "@/components/sections/ServiceCard";
import { Button } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getServices } from "@/lib/content";

export function ServiceGrid({
  heading = "Car Care That Fits Your Schedule",
  description = "Professional maintenance and automotive services designed around your vehicle and your time.",
  limit,
}: {
  heading?: string;
  description?: string;
  limit?: number;
}) {
  const allServices = getServices();
  const services = allServices.slice(0, limit ?? allServices.length);
  const [featured, ...rest] = services;

  return (
    <section id="services" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:flex-1">
            <SectionHeader eyebrow="Services" title={heading} description={description} />
          </div>
          <Button href="/services" variant="dark" className="self-start">
            All services
          </Button>
        </div>

        <div className="mt-12 grid gap-2 lg:grid-cols-12">
          {featured ? (
            <div className="lg:col-span-7">
              <ServiceCard service={featured} />
            </div>
          ) : null}
          <div className="border-t border-line lg:col-span-5">
            {rest.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
