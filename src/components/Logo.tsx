import Image from "next/image";
import Link from "next/link";
import { getCompany } from "@/lib/content";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  const company = getCompany();
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label={`${company.name} home`}>
      <Image
        src={company.logo}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10"
        priority
      />
      <span
        className={`font-heading text-[1.35rem] font-semibold uppercase leading-none tracking-[0.04em] ${inverted ? "text-inverted" : "text-ink"}`}
      >
        {company.name}
      </span>
    </Link>
  );
}
