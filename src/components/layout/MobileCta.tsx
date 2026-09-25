"use client";

import { Button } from "@/components/ui/Button";
import { getSite } from "@/lib/content";
import { usePathname } from "next/navigation";

export function MobileCta() {
  const site = getSite();
  const pathname = usePathname();
  if (pathname.startsWith("/book") || pathname.startsWith("/quote")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Button href={site.hero.primaryCTA.href} className="w-full">
        {site.hero.primaryCTA.label}
      </Button>
    </div>
  );
}
