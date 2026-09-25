import type { Metadata } from "next";
import { Suspense } from "react";
import { LocationExplorer } from "@/components/locations/LocationExplorer";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCompany, getLocationStats } from "@/lib/content";

const stats = getLocationStats();

export const metadata: Metadata = {
  title: "Service Areas",
  description: `Coverage across ${stats.availableCities} cities. Search ${getCompany().address.country} locations.`,
};

export default function LocationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Service areas"
        title="Where we work"
        description={`Search a city, filter by province, and see live coverage. ${stats.availableCities} cities currently dispatch.`}
      />
      <Container className="py-16">
        <Suspense fallback={<p>Loading coverage…</p>}>
          <LocationExplorer />
        </Suspense>
      </Container>
    </>
  );
}
