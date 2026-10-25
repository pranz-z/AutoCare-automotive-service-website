import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "dark";

const variants: Record<Variant, string> = {
  primary:
    "border border-accent bg-accent text-accent-contrast hover:bg-[#d68c3d] hover:border-[#d68c3d]",
  secondary:
    "border border-current/30 bg-transparent hover:border-current/60 hover:bg-current/5",
  ghost: "border border-transparent bg-transparent hover:border-line hover:bg-black/5",
  light:
    "border border-line bg-surface text-ink hover:border-ink/40 hover:bg-canvas",
  dark: "border border-primary bg-primary text-inverted hover:border-secondary hover:bg-secondary",
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
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-none px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color,transform] duration-[var(--t-hover)] ease-[var(--ease-out)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={props.onClick as unknown as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
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
