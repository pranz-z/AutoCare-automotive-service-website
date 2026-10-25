import type { ReactNode } from "react";
import { AutoCareAssistant } from "@/components/ai/AutoCareAssistant";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MobileCta } from "@/components/layout/MobileCta";

/**
 * Public-site chrome for the (site) route group only. Keeping it out of the
 * root layout is what stops the header/footer/public assistant from leaking
 * onto /admin and /api routes — groups share the path, not the layout.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileCta />
      <AutoCareAssistant />
    </>
  );
}
