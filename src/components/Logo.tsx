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
        width={36}
        height={36}
        className="h-9 w-9"
        priority
      />
      <span
        className={`font-heading text-lg tracking-tight font-semibold ${inverted ? "text-inverted" : "text-ink"}`}
      >
        {company.name}
      </span>
    </Link>
  );
}
