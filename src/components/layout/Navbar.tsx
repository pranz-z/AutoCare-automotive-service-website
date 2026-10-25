"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { getCompany, getSite } from "@/lib/content";

export function Navbar() {
  const site = getSite();
  const company = getCompany();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-primary text-inverted">
      <div className="mx-auto flex h-[76px] max-w-[96rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-[170px] items-center [&_span]:text-inverted">
          <Logo inverted />
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/70 xl:flex">
          {site.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-transparent py-2 transition-colors duration-[var(--t-hover)] hover:border-accent hover:text-inverted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={company.phoneHref}
            className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-inverted/80 transition-colors hover:border-white/35 hover:text-inverted"
          >
            <Phone className="h-4 w-4 text-accent" />
            <span className="leading-none">{company.phone}</span>
          </a>

          <Button href={site.hero.primaryCTA.href} className="min-h-11 px-4">
            {site.hero.primaryCTA.label}
          </Button>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center border border-white/15 text-inverted lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="h-[calc(100svh-76px)] overflow-y-auto border-t border-white/10 bg-primary px-4 py-6 lg:hidden">
          <p className="meta text-accent">Menu</p>
          <nav className="mt-5 flex flex-col">
            {site.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-4 font-heading text-2xl uppercase text-inverted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            href={company.phoneHref}
            className="mt-6 flex items-center gap-3 border border-white/15 px-4 py-3 text-sm text-inverted"
          >
            <Phone className="h-4 w-4 text-accent" />
            {company.phone}
          </a>
          <div className="mt-4 grid gap-2">
            <Button href={site.hero.primaryCTA.href} onClick={() => setOpen(false)}>
              {site.hero.primaryCTA.label}
            </Button>
            <Button
              href={site.hero.secondaryCTA.href}
              variant="secondary"
              className="text-inverted"
              onClick={() => setOpen(false)}
            >
              {site.hero.secondaryCTA.label}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
