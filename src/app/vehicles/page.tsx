import type { Metadata } from "next";
import { VehicleBrandGrid } from "@/components/sections/VehicleBrandGrid";
import { PageHeader } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Vehicles",
  description: `Makes and models serviced by ${getCompany().name}.`,
};

export default function VehiclesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Vehicles"
        title="Vehicles we service"
        description="Browse brands and models. Supported services are mapped per model in configuration."
      />
      <VehicleBrandGrid />
    </>
  );
}
