import type { Metadata } from "next";
import { BrandStyles } from "@/components/BrandStyles";
import { AutoCareAssistant } from "@/components/ai/AutoCareAssistant";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MobileCta } from "@/components/layout/MobileCta";
import { getCompany, getSite } from "@/lib/content";
import "./globals.css";

const company = getCompany();
const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL("https://autocare.example"),
  title: {
    default: `${company.name} | ${company.tagline}`,
    template: `%s | ${company.name}`,
  },
  description: company.description,
  icons: { icon: company.favicon },
  openGraph: {
    title: `${company.name} | ${company.tagline}`,
    description: company.description,
    type: "website",
    locale: "en_PH",
    images: [{ url: site.hero.backgroundImage, width: 1200, height: 630, alt: company.name }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <BrandStyles />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileCta />
        <AutoCareAssistant />
      </body>
    </html>
  );
}
