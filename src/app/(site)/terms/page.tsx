import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

const company = getCompany();

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" />
      <Container className="py-16 max-w-3xl space-y-4 text-muted leading-relaxed">
        <p>
          By booking with {company.name}, you confirm that vehicle information is accurate and that the scheduled
          location is safe and accessible for technicians.
        </p>
        <p>
          Quotes are estimates until inspection. Additional work requires approval. Warranties follow the terms on
          the invoice. These terms are a template and should be reviewed by counsel before production use.
        </p>
      </Container>
    </>
  );
}
