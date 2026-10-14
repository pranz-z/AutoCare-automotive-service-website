import type { Metadata } from "next";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Get a Quote",
  description: `Request a written estimate from ${getCompany().name}.`,
};

export default function QuotePage() {
  return (
    <>
      <PageHeader
        eyebrow="Quote"
        title="Get a free quote"
        description="Tell us the vehicle, the issue, and the location. You’ll receive a confirmation and a written range."
      />
      <Container className="py-16 pb-28 max-w-4xl">
        <QuoteForm />
      </Container>
    </>
  );
}
