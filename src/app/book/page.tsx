import type { Metadata } from "next";
import { Suspense } from "react";
import { BookClient } from "@/components/booking/BookClient";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Book a Service",
  description: `Schedule mobile or workshop service with ${getCompany().name}.`,
};

export default function BookPage() {
  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Book a service"
        description="Nine steps, a live summary, and a confirmation reference. Validation runs before each continue."
      />
      <Container className="py-16 pb-28">
        <Suspense fallback={<p>Loading booking…</p>}>
          <BookClient />
        </Suspense>
      </Container>
    </>
  );
}
