import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

const company = getCompany();

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <Container className="py-16 max-w-3xl space-y-4 text-muted leading-relaxed">
        <p>
          {company.legalName} (“{company.name}”) collects booking, quote, and contact details solely to schedule
          service and communicate about your vehicle. We do not sell personal information.
        </p>
        <p>
          Submitted forms are stored as operational records. You may request access or deletion by emailing{" "}
          {company.email}.
        </p>
      </Container>
    </>
  );
}
