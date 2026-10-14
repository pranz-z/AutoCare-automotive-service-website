import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { Button } from "@/components/ui/Button";
import { Container, PageHeader } from "@/components/ui/Layout";
import { formatAddress, getCompany, getSite } from "@/lib/content";

const company = getCompany();
const site = getSite();

export const metadata: Metadata = {
  title: "Contact",
  description: `Reach ${company.name} by phone, email, or form.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the desk"
        description={`${company.operatingHours.days}, ${company.operatingHours.hours}. ${company.operatingHours.note}`}
      />
      <Container className="py-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="border border-line bg-surface p-6 space-y-4">
            <p className="flex gap-3">
              <Phone className="h-5 w-5 text-accent" />
              <a href={company.phoneHref}>{company.phone}</a>
            </p>
            <p className="flex gap-3">
              <Mail className="h-5 w-5 text-accent" />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
            <p className="flex gap-3">
              <MapPin className="h-5 w-5 text-accent" />
              <span>{formatAddress()}</span>
            </p>
          </div>
          <div className="relative min-h-[16rem] bg-primary text-inverted p-6">
            <div className="tech-grid absolute inset-0 opacity-30" />
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Map placeholder</p>
              <p className="font-heading text-2xl mt-2">{site.contact.map.embedLabel}</p>
              <p className="text-sm text-inverted/65 mt-2">
                {site.contact.map.lat.toFixed(4)}, {site.contact.map.lng.toFixed(4)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button href="/book">{site.hero.primaryCTA.label}</Button>
            <Button href="/quote" variant="light">
              {site.hero.secondaryCTA.label}
            </Button>
          </div>
        </div>
        <ContactForm />
      </Container>
    </>
  );
}
