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
    : "bg-[#071827]/85 backdrop-blur-sm border-b border-white/10 text-inverted";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${bar}`}>
      <div className="mx-auto flex h-[84px] max-w-[1600px] items-center justify-between gap-5 px-5 sm:px-8 xl:px-10">
        <div className="flex min-w-[180px] items-center [&_span]:text-inverted">
          <Logo inverted />
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-7 text-[11px] font-medium tracking-[0.18em] uppercase text-inverted/80 xl:flex">
          {site.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-inverted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={company.phoneHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium tracking-[0.14em] text-inverted/80 uppercase"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-accent">
              <Phone className="h-4 w-4" />
            </span>
            <span className="leading-none">{company.phone}</span>
          </a>

          <Button
            href="/quote"
            variant="secondary"
            className="h-[52px] min-w-[150px] border border-white/20 bg-white/5 text-[11px] tracking-[0.18em] text-inverted hover:bg-white/10"
          >
            {site.hero.secondaryCTA.label.replace("Free ", "")}
          </Button>

          <Button
            href={site.hero.primaryCTA.href}
            className="h-[52px] min-w-[154px] bg-[#d18b3f] text-[11px] tracking-[0.18em] text-[#091827] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:brightness-110"
          >
            {site.hero.primaryCTA.label}
          </Button>
        </div>

        <button
          type="button"
          className="p-2 text-inverted lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-primary px-5 py-6 lg:hidden">
          <nav className="flex flex-col gap-4 text-lg">
            {site.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-1 text-inverted"
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
