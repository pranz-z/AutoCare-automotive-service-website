import { ServiceCard } from "@/components/sections/ServiceCard";
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
  const services = getServices().slice(0, limit ?? getServices().length);

  return (
    <section id="services" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <SectionHeader eyebrow="Services" title={heading} description={description} />
          <Button href="/services" variant="dark" className="self-start">
            All services
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} featured={index === 0} />
          ))}
        </div>
      </Container>
    </section>
  );
}
