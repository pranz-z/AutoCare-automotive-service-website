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
      <Container className="grid gap-10 py-16 lg:grid-cols-12 lg:py-20">
        <div className="space-y-6 lg:col-span-5">
          <div className="border border-line bg-surface">
            <div className="border-b border-line p-5">
              <p className="meta text-accent">Direct line</p>
              <a href={company.phoneHref} className="mt-3 flex items-center gap-3 font-heading text-2xl">
                <Phone className="h-5 w-5 text-accent" />
                {company.phone}
              </a>
            </div>
            <div className="grid gap-4 p-5">
              <p className="flex gap-3 text-sm">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <a href={`mailto:${company.email}`} className="hover:text-accent">{company.email}</a>
              </p>
              <p className="flex gap-3 text-sm">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span>{formatAddress()}</span>
              </p>
            </div>
          </div>

          <div className="relative min-h-[18rem] border border-line bg-primary p-6 text-inverted">
            <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
            <p className="meta text-accent">Map placeholder</p>
            <p className="mt-3 font-heading text-3xl leading-none">{site.contact.map.embedLabel}</p>
            <p className="mt-3 text-sm text-inverted/55">
              {site.contact.map.lat.toFixed(4)}, {site.contact.map.lng.toFixed(4)}
            </p>
            <div className="mt-8 flex gap-2">
              <Button href="/book">{site.hero.primaryCTA.label}</Button>
              <Button href="/quote" variant="secondary" className="text-inverted">
                {site.hero.secondaryCTA.label}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
