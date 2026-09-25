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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const bar = scrolled || open
    ? "bg-primary/95 backdrop-blur-md border-b border-white/10 text-inverted"
    : "bg-transparent text-inverted";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${bar}`}>
      <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-4 px-5 sm:px-8 h-[72px]">
        <div className="[&_span]:text-inverted">
          <Logo inverted />
        </div>
        <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-[0.08em] uppercase">
          {site.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-inverted/75 hover:text-inverted transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <a
            href={company.phoneHref}
            className="hidden xl:inline-flex items-center gap-2 text-sm text-inverted/80"
          >
            <Phone className="h-4 w-4 text-accent" />
            {company.phone}
          </a>
          <Button href="/quote" variant="secondary" className="text-inverted border-white/25">
            {site.hero.secondaryCTA.label.replace("Free ", "")}
          </Button>
          <Button href={site.hero.primaryCTA.href}>{site.hero.primaryCTA.label}</Button>
        </div>
        <button
          type="button"
          className="lg:hidden p-2 text-inverted"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div className="lg:hidden border-t border-white/10 bg-primary px-5 py-6">
          <nav className="flex flex-col gap-4 text-lg">
            {site.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-inverted py-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Button href={site.hero.primaryCTA.href}>{site.hero.primaryCTA.label}</Button>
            <Button href="/quote" variant="light">
              {site.hero.secondaryCTA.label}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
