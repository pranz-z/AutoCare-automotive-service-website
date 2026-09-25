import type { LocationArea } from "@/types/content";

export const locations: LocationArea[] = [
  {
    id: "metro-manila",
    province: "Metro Manila",
    region: "NCR",
    cities: [
      { name: "Taguig", available: true, municipalities: ["BGC", "Ususan", "Western Bicutan"] },
      { name: "Makati", available: true, municipalities: ["Poblacion", "San Lorenzo", "Bel-Air"] },
      { name: "Pasig", available: true, municipalities: ["Ortigas", "Kapitolyo", "Ugong"] },
      { name: "Mandaluyong", available: true },
      { name: "San Juan", available: true },
      { name: "Quezon City", available: true, municipalities: ["Diliman", "Cubao", "Fairview", "Libis"] },
      { name: "Manila", available: true, municipalities: ["Malate", "Ermita", "Binondo"] },
      { name: "Paranaque", available: true },
      { name: "Las Pinas", available: true },
      { name: "Muntinlupa", available: true },
      { name: "Pasay", available: true },
      { name: "Caloocan", available: true },
      { name: "Valenzuela", available: true },
      { name: "Marikina", available: true },
    ],
  },
  {
    id: "cavite",
    province: "Cavite",
    region: "Calabarzon",
    cities: [
      { name: "Bacoor", available: true },
      { name: "Imus", available: true },
      { name: "Dasmarinas", available: true },
      { name: "General Trias", available: true },
      { name: "Kawit", available: true },
    ],
  },
  {
    id: "laguna",
    province: "Laguna",
    region: "Calabarzon",
    cities: [
      { name: "Santa Rosa", available: true },
      { name: "Binan", available: true },
      { name: "San Pedro", available: true },
      { name: "Calamba", available: true },
      { name: "Los Banos", available: false, note: "Waitlist — request coverage" },
    ],
  },
  {
    id: "rizal",
    province: "Rizal",
    region: "Calabarzon",
    cities: [
      { name: "Cainta", available: true },
      { name: "Taytay", available: true },
      { name: "Antipolo", available: true },
      { name: "San Mateo", available: true },
    ],
  },
  {
    id: "bulacan",
    province: "Bulacan",
    region: "Central Luzon",
    cities: [
      { name: "San Jose del Monte", available: true },
      { name: "Meycauayan", available: true },
      { name: "Marilao", available: true },
      { name: "Malolos", available: true },
    ],
  },
  {
    id: "pampanga",
    province: "Pampanga",
    region: "Central Luzon",
    cities: [
      { name: "Angeles", available: true },
      { name: "San Fernando", available: true },
      { name: "Mabalacat", available: true },
    ],
  },
  {
    id: "cebu",
    province: "Cebu",
    region: "Central Visayas",
    cities: [
      { name: "Cebu City", available: true, municipalities: ["Lahug", "IT Park", "Mabolo"] },
      { name: "Mandaue", available: true },
      { name: "Lapu-Lapu", available: true },
      { name: "Talisay", available: true },
    ],
  },
  {
    id: "davao-del-sur",
    province: "Davao del Sur",
    region: "Davao Region",
    cities: [
      { name: "Davao City", available: true, municipalities: ["Poblacion", "Bajada", "Lanang", "Matina"] },
      { name: "Digos", available: false, note: "Pilot coverage on request" },
    ],
  },
  {
    id: "negros-occidental",
    province: "Negros Occidental",
    region: "Western Visayas",
    cities: [
      { name: "Bacolod", available: true },
      { name: "Talisay", available: false, note: "Expanding this quarter" },
    ],
  },
  {
    id: "iloilo",
    province: "Iloilo",
    region: "Western Visayas",
    cities: [
      { name: "Iloilo City", available: true },
      { name: "Pavia", available: true },
    ],
  },
];

export const locationStats = {
  provinces: locations.length,
  cities: locations.reduce((sum, area) => sum + area.cities.length, 0),
  availableCities: locations.reduce(
    (sum, area) => sum + area.cities.filter((city) => city.available).length,
    0,
  ),
};
