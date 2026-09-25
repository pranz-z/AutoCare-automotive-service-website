import type { MetadataRoute } from "next";
import { getArticles, getServices, getVehicleBrands } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://autocare.example";
  const staticRoutes = ["", "/services", "/vehicles", "/locations", "/resources", "/about", "/contact", "/book", "/quote"];
  const services = getServices().map((item) => `/services/${item.slug}`);
  const vehicles = getVehicleBrands().map((item) => `/vehicles/${item.id}`);
  const articles = getArticles().map((item) => `/resources/${item.slug}`);
  return [...staticRoutes, ...services, ...vehicles, ...articles].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
