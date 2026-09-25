import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { BrandStyles } from "@/components/BrandStyles";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MobileCta } from "@/components/layout/MobileCta";
import { getCompany, getSite } from "@/lib/content";
import "./globals.css";

const heading = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <BrandStyles />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileCta />
      </body>
    </html>
  );
}
