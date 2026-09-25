import { articles } from "@/config/blog";
import { site } from "@/config/company";
import { faqs } from "@/config/faqs";
import { locations, locationStats } from "@/config/locations";
import { partners } from "@/config/partners";
import { services } from "@/config/services";
import { testimonials } from "@/config/testimonials";
import { vehicleBrands } from "@/config/vehicles";
import type { ServiceItem, VehicleBrand } from "@/types/content";

/** Content accessors — swap these implementations for API calls later. */

export function getSite() {
  return site;
}

export function getCompany() {
  return site.company;
}

export function getBranding() {
  return site.branding;
}

export function getServices() {
  return services;
}

export function getService(slug: string): ServiceItem | undefined {
  return services.find((item) => item.slug === slug || item.id === slug);
}

export function getVehicleBrands() {
  return vehicleBrands;
}

export function getVehicleBrand(id: string): VehicleBrand | undefined {
  return vehicleBrands.find((brand) => brand.id === id);
}

export function getLocations() {
  return locations;
}

export function getLocationStats() {
  return locationStats;
}

export function getTestimonials() {
  return testimonials;
}

export function getFaqs() {
  return faqs;
}

export function getArticles() {
  return articles;
}

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getPartners() {
  return partners;
}

export function formatPrice(amount: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAddress() {
  const { address } = site.company;
  return `${address.line1}, ${address.line2}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country}`;
}
