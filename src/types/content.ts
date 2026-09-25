export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok";

export type Cta = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
};

export type CompanyProfile = {
  name: string;
  shortName: string;
  legalName: string;
  tagline: string;
  description: string;
  logo: string;
  favicon: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  operatingHours: {
    days: string;
    hours: string;
    note: string;
  };
  socialLinks: { platform: SocialPlatform; label: string; href: string }[];
};

export type Branding = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  accentContrast: string;
  backgroundColor: string;
  surfaceColor: string;
  mutedColor: string;
  textColor: string;
  invertedTextColor: string;
  borderColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  buttonStyle: "sharp" | "rounded";
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  primaryCTA: Cta;
  secondaryCTA: Cta;
};

export type StatItem = {
  value: string;
  numericValue: number;
  suffix?: string;
  label: string;
  icon: string;
};

export type ServiceItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  priceFrom: number;
  currency: string;
  duration: string;
  image: string;
  icon: string;
  features: string[];
  benefits: string[];
  included: string[];
  vehicleCompatibility: string;
  faqs: { question: string; answer: string }[];
  cta: Cta;
  bookCta: Cta;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
  icon: string;
};

export type TrustItem = {
  title: string;
  description: string;
  image: string;
};

export type VehicleModel = {
  name: string;
  years: string;
  services: string[];
};

export type VehicleBrand = {
  id: string;
  name: string;
  logo: string;
  models: VehicleModel[];
};

export type LocationArea = {
  id: string;
  province: string;
  region: string;
  cities: {
    name: string;
    municipalities?: string[];
    available: boolean;
    note?: string;
  }[];
};

export type Partner = {
  name: string;
  logo: string;
  type: "parts" | "fleet" | "affiliate" | "lubricant" | "equipment";
};

export type Testimonial = {
  id: string;
  customer: string;
  location: string;
  vehicle: string;
  rating: number;
  message: string;
  avatar: string;
};

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
  author: string;
  content: { heading?: string; paragraphs: string[] }[];
};

export type AboutContent = {
  eyebrow: string;
  title: string;
  story: string[];
  mission: string;
  vision: string;
  whyWeExist: string;
  philosophy: string;
  technicians: {
    name: string;
    role: string;
    focus: string;
    image: string;
  }[];
  standards: string[];
};

export type FooterContent = {
  description: string;
  columns: { title: string; links: NavItem[] }[];
  legalLinks: NavItem[];
};

export type SiteConfig = {
  company: CompanyProfile;
  branding: Branding;
  navigation: NavItem[];
  hero: HeroContent;
  stats: StatItem[];
  howItWorks: {
    title: string;
    description: string;
    steps: ProcessStep[];
  };
  trust: {
    title: string;
    description: string;
    items: TrustItem[];
  };
  about: AboutContent;
  contact: {
    phone: string;
    email: string;
    address: string;
    map: { embedLabel: string; lat: number; lng: number };
    socialLinks: CompanyProfile["socialLinks"];
  };
  footer: FooterContent;
  booking: {
    timeSlots: string[];
    transmissions: string[];
    fuelTypes: string[];
    years: number[];
  };
};
