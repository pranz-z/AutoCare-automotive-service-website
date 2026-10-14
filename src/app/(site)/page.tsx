import { CtaSection, PartnersStrip } from "@/components/sections/CtaSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ResourcesPreview } from "@/components/sections/ResourcesPreview";
import { ServiceAreaPreview } from "@/components/sections/ServiceAreaPreview";
import { ServiceGrid } from "@/components/sections/ServiceGrid";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { TrustSection } from "@/components/sections/TrustSection";
import { VehicleBrandGrid } from "@/components/sections/VehicleBrandGrid";

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceGrid />
      <HowItWorks />
      <VehicleBrandGrid compact />
      <ServiceAreaPreview />
      <TrustSection />
      <TestimonialCarousel />
      <FaqSection />
      <ResourcesPreview />
      <PartnersStrip />
      <CtaSection />
    </>
  );
}
