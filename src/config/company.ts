import type { SiteConfig } from "@/types/content";
import { images } from "./images";

const currentYear = new Date().getFullYear();

export const site: SiteConfig = {
  company: {
    name: "AutoCare",
    shortName: "AC",
    legalName: "AutoCare Automotive Services Inc.",
    tagline: "Reliable Car Care, Wherever You Are.",
    description:
      "From routine maintenance to diagnostics and repairs, AutoCare brings professional automotive service closer to you—whether you visit our workshop or we come to your location.",
    logo: "/logo.svg",
    favicon: "/favicon.svg",
    phone: "+63 917 555 0142",
    phoneHref: "tel:+639175550142",
    email: "hello@autocare.ph",
    address: {
      line1: "Ground Floor, Northpoint Service Hub",
      line2: "32th Street corner 5th Avenue",
      city: "Taguig",
      province: "Metro Manila",
      postalCode: "1634",
      country: "Philippines",
    },
    operatingHours: {
      days: "Monday – Sunday",
      hours: "8:00 AM – 7:00 PM",
      note: "Mobile teams dispatch daily. Workshop bays available by appointment.",
    },
    socialLinks: [
      { platform: "facebook", label: "Facebook", href: "https://facebook.com" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com" },
      { platform: "linkedin", label: "LinkedIn", href: "https://linkedin.com" },
      { platform: "youtube", label: "YouTube", href: "https://youtube.com" },
    ],
  },
  branding: {
    primaryColor: "#0B1320",
    secondaryColor: "#162433",
    accentColor: "#C47A2C",
    accentContrast: "#0B1320",
    backgroundColor: "#F3EFE6",
    surfaceColor: "#FFFbf5",
    mutedColor: "#5E6A76",
    textColor: "#121820",
    invertedTextColor: "#F6F1E8",
    borderColor: "#D7D0C4",
    fontHeading: "Space Grotesk",
    fontBody: "DM Sans",
    borderRadius: "4px",
    buttonStyle: "sharp",
  },
  navigation: [
    { label: "Services", href: "/services" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Vehicles", href: "/vehicles" },
    { label: "Service Areas", href: "/locations" },
    { label: "About", href: "/about" },
    { label: "Resources", href: "/resources" },
    { label: "Contact", href: "/contact" },
  ],
  hero: {
    eyebrow: "Mobile & workshop service · Philippines",
    title: "Professional Car Care.\nWithout the Hassle.",
    subtitle: "Reliable Car Care, Wherever You Are.",
    description:
      "From preventive maintenance to diagnostics and repairs, our automotive specialists help keep your vehicle safe, reliable, and road-ready.",
    backgroundImage: images.hero,
    primaryCTA: { label: "Book a Service", href: "/book" },
    secondaryCTA: { label: "Get a Free Quote", href: "/quote" },
  },
  stats: [
    { value: "12K+", numericValue: 12000, suffix: "+", label: "Vehicles Serviced", icon: "car" },
    { value: "48+", numericValue: 48, suffix: "+", label: "Service Areas", icon: "map" },
    { value: "4.9/5", numericValue: 4.9, label: "Customer Rating", icon: "star" },
    { value: "7 Days", numericValue: 7, label: "Available", icon: "calendar" },
  ],
  howItWorks: {
    title: "Service that fits around your day",
    description:
      "A straightforward path from request to road-ready—whether we meet you at home, at the office, or in our workshop.",
    steps: [
      {
        number: "01",
        title: "Tell Us What Your Car Needs",
        description:
          "Choose a service, describe a symptom, or request an inspection. We’ll confirm the right package before anyone picks up a tool.",
        icon: "clipboard",
      },
      {
        number: "02",
        title: "Choose Your Schedule",
        description:
          "Pick a date, time window, and location. Morning bay slots and on-site visits are available seven days a week.",
        icon: "calendar",
      },
      {
        number: "03",
        title: "Get Your Vehicle Serviced",
        description:
          "A certified technician arrives prepared. You receive a clear report, photos where relevant, and a warranty on covered work.",
        icon: "wrench",
      },
    ],
  },
  trust: {
    title: "Built for drivers who expect more than a quick fix",
    description:
      "Every visit is measured against workshop standards—even when the work happens in your driveway.",
    items: [
      {
        title: "Certified Technicians",
        description:
          "Brand-trained specialists with diagnostic equipment that reads factory-level codes, not generic scanners.",
        image: images.workshop,
      },
      {
        title: "Transparent Pricing",
        description:
          "Quoted ranges before work begins. If we find additional issues, you approve them—no surprise add-ons on the invoice.",
        image: images.inspection,
      },
      {
        title: "Quality Parts",
        description:
          "OEM-equivalent lubricants, filters, pads, and batteries sourced from audited suppliers and batch-tracked.",
        image: images.oil,
      },
      {
        title: "Convenient Scheduling",
        description:
          "Book online in minutes. Reschedule without a call center. We work around school runs and office hours.",
        image: images.mobile,
      },
      {
        title: "Professional Equipment",
        description:
          "Torque-controlled tools, alignment-ready jacks, and A/C recovery machines—the same class of kit used in dealership bays.",
        image: images.diagnostics,
      },
      {
        title: "Service Warranty",
        description:
          "Covered labor and parts carry a written warranty. Keep digital records for the life of the vehicle.",
        image: images.engine,
      },
    ],
  },
  about: {
    eyebrow: "The company",
    title: "Workshop standards, without the waiting lounge.",
    story: [
      "AutoCare started with a simple frustration: quality car care was locked behind traffic, dealership queues, and vague invoices. Drivers in Metro Manila and growing cities needed a team that could bring dealership-grade work to the street—or into a properly equipped bay—without the theatre.",
      "We built a mixed model. Mobile units handle scheduled maintenance, inspections, and many repairs at home or work. Complex jobs move into our workshop, where lifts, alignment, and diagnostics live. Same technicians. Same parts standards. Same report you can actually read.",
      "Today we service passenger cars, SUVs, and light commercials across key Philippine cities, with a booking system designed around real calendars—not “drop it off and we’ll call you.”",
    ],
    mission:
      "Keep vehicles safe, reliable, and honestly maintained—on the owner’s schedule, with work that stands up to inspection.",
    vision:
      "To be the default standard for professional automotive care in the Philippines: precise, reachable, and transparent.",
    whyWeExist:
      "Most drivers don’t want a hobby. They want a car that starts, stops, and cools without becoming a weekend project. We exist so maintenance stays preventive, diagnostics stay evidence-based, and repairs stay accountable.",
    philosophy:
      "Do the work that the vehicle needs, document it, and leave it better than we found it. If a job is outside our scope, we say so early.",
    technicians: [
      {
        name: "Marco Villanueva",
        role: "Lead Diagnostic Technician",
        focus: "Electronics, drivability, and hybrid systems",
        image: images.team1,
      },
      {
        name: "Lea Santos",
        role: "Workshop Supervisor",
        focus: "Brakes, suspension, and quality control",
        image: images.team2,
      },
      {
        name: "Rafael Cruz",
        role: "Mobile Service Lead",
        focus: "On-site PMS, batteries, and inspections",
        image: images.team3,
      },
    ],
    standards: [
      "Torque specs followed to manufacturer data, not “feel.”",
      "Fluids matched to viscosity and spec—not a single drum for every engine.",
      "Digital inspection reports with photos on request.",
      "Parts traceability for batteries, pads, and major wear items.",
      "Clean work area and protective fender covers on every visit.",
    ],
  },
  contact: {
    phone: "+63 917 555 0142",
    email: "hello@autocare.ph",
    address:
      "Ground Floor, Northpoint Service Hub, 32th Street corner 5th Avenue, Taguig, Metro Manila 1634, Philippines",
    map: {
      embedLabel: "Northpoint Service Hub, Taguig",
      lat: 14.5503,
      lng: 121.0496,
    },
    socialLinks: [
      { platform: "facebook", label: "Facebook", href: "https://facebook.com" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com" },
      { platform: "linkedin", label: "LinkedIn", href: "https://linkedin.com" },
      { platform: "youtube", label: "YouTube", href: "https://youtube.com" },
    ],
  },
  footer: {
    description:
      "Professional vehicle maintenance, diagnostics, and repairs—mobile or in-workshop—across key cities in the Philippines.",
    columns: [
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "How it works", href: "/#how-it-works" },
          { label: "Careers", href: "/contact" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Services",
        links: [
          { label: "All services", href: "/services" },
          { label: "Preventive maintenance", href: "/services/preventive-maintenance" },
          { label: "Diagnostics", href: "/services/car-diagnostics" },
          { label: "Book a service", href: "/book" },
        ],
      },
      {
        title: "Vehicles",
        links: [
          { label: "Brands we service", href: "/vehicles" },
          { label: "Toyota", href: "/vehicles/toyota" },
          { label: "Honda", href: "/vehicles/honda" },
          { label: "Fleet inquiries", href: "/quote" },
        ],
      },
      {
        title: "Service Areas",
        links: [
          { label: "Coverage map", href: "/locations" },
          { label: "Metro Manila", href: "/locations?province=Metro+Manila" },
          { label: "Cebu", href: "/locations?province=Cebu" },
          { label: "Request an area", href: "/contact" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Auto Guide", href: "/resources" },
          { label: "FAQs", href: "/#faq" },
          { label: "Get a quote", href: "/quote" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Call us", href: "tel:+639175550142" },
          { label: "Email", href: "mailto:hello@autocare.ph" },
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
    legalLinks: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  booking: {
    timeSlots: [
      "08:00 AM",
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "01:00 PM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM",
      "05:00 PM",
    ],
    transmissions: ["Automatic", "Manual", "CVT", "DCT"],
    fuelTypes: ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric"],
    years: Array.from({ length: 20 }, (_, i) => currentYear - i),
  },
};

export const company = site.company;
export const branding = site.branding;
export const hero = site.hero;
export const stats = site.stats;
