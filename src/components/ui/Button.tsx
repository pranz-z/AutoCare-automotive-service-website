import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "dark";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:brightness-110 border border-transparent",
  secondary:
    "border border-current/20 bg-transparent hover:bg-white/8",
  ghost: "bg-transparent hover:bg-black/5 border border-transparent",
  light:
    "bg-surface text-ink border border-line hover:border-ink/30",
  dark: "bg-primary text-inverted hover:bg-secondary border border-transparent",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  const classes = `inline-flex items-center justify-center gap-2 px-5 py-3 text-[13px] font-semibold tracking-[0.12em] uppercase transition duration-200 ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
