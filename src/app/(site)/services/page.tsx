import type { Metadata } from "next";
import { ServiceGrid } from "@/components/sections/ServiceGrid";
import { CtaSection } from "@/components/sections/CtaSection";
import { PageHeader } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

const company = getCompany();

export const metadata: Metadata = {
  title: "Services",
  description: `Preventive maintenance, diagnostics, and repairs from ${company.name}.`,
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Car care that fits your schedule"
        description="Professional maintenance and automotive services designed around your vehicle and your time."
      />
      <ServiceGrid heading="Choose a service" description="Starting prices are configurable. What’s included is listed on each service page." />
      <CtaSection />
    </>
  );
}
