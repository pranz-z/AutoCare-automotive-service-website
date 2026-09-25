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
    <footer className="bg-primary text-inverted">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-16 grid gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="[&_span]:text-inverted">
            <Logo inverted />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-inverted/65">
            {site.footer.description}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-inverted/80">
            <li className="flex gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-accent" />
              <a href={company.phoneHref}>{company.phone}</a>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-accent" />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </li>
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-accent" />
              <span>
                {company.address.city}, {company.address.province}
                <br />
                {company.operatingHours.days} · {company.operatingHours.hours}
              </span>
            </li>
          </ul>
          <div className="mt-6 flex gap-3">
            {company.socialLinks.map((link) => {
              const Icon = socialIcons[link.platform] ?? Globe;
              return (
                <a
                  key={link.platform}
                  href={link.href}
                  aria-label={link.label}
                  className="h-9 w-9 grid place-items-center border border-white/15 hover:border-accent hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[12px] tracking-[0.2em] uppercase text-accent mb-4">{column.title}</p>
              <ul className="space-y-2.5 text-sm text-inverted/70">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <Link href={link.href} className="hover:text-inverted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-inverted/50">
          <p>
            © {year} {company.legalName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            {site.footer.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-inverted">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
