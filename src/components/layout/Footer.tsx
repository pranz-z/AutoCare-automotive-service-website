import {
  BriefcaseBusiness,
  Camera,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/ui/Layout";
import { getCompany, getSite, getVehicleBrands } from "@/lib/content";

const socialIcons = {
  facebook: Globe,
  instagram: Camera,
  linkedin: BriefcaseBusiness,
  youtube: Play,
  tiktok: MessageCircle,
};

export function Footer() {
  const site = getSite();
  const company = getCompany();
  const brands = getVehicleBrands().slice(0, 4);
  const year = new Date().getFullYear();

  const columns = site.footer.columns.map((column) => {
    if (column.title === "Vehicles") {
      return {
        title: column.title,
        links: [
          { label: "Brands we service", href: "/vehicles" },
          ...brands.map((brand) => ({ label: brand.name, href: `/vehicles/${brand.id}` })),
        ],
      };
    }
    if (column.title === "Support") {
      return {
        title: column.title,
        links: [
          { label: "Call us", href: company.phoneHref },
          { label: "Email", href: `mailto:${company.email}` },
          ...site.footer.legalLinks,
        ],
      };
    }
    return column;
  });

  return (
    <footer className="border-t border-white/10 bg-primary text-inverted">
      <div className="h-1 w-full bg-accent" />
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.1fr_2fr] lg:py-20">
        <div>
          <div className="[&_span]:text-inverted">
            <Logo inverted />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-inverted/65">
            {site.footer.description}
          </p>
          <ul className="mt-7 space-y-3 text-sm text-inverted/80">
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={company.phoneHref} className="hover:text-inverted">{company.phone}</a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${company.email}`} className="hover:text-inverted">{company.email}</a>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                {company.address.city}, {company.address.province}
                <br />
                {company.operatingHours.days} · {company.operatingHours.hours}
              </span>
            </li>
          </ul>
          <div className="mt-7 flex gap-2">
            {company.socialLinks.map((link) => {
              const Icon = socialIcons[link.platform] ?? Globe;
              return (
                <a
                  key={link.platform}
                  href={link.href}
                  aria-label={link.label}
                  className="grid h-10 w-10 place-items-center border border-white/15 transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="meta mb-4 text-accent">{column.title}</p>
              <ul className="space-y-2.5 text-sm text-inverted/65">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <Link href={link.href} className="transition-colors hover:text-inverted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="overflow-hidden border-t border-white/10">
        <Container className="py-8">
          <p className="select-none font-heading text-[19vw] leading-[0.7] tracking-[-0.04em] text-white/[0.045] lg:text-[15vw]">
            {company.name}
          </p>
        </Container>
      </div>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 text-xs text-inverted/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {company.legalName}. All rights reserved.
          </p>
          <div className="flex gap-5">
            {site.footer.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-inverted">
                {link.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}
