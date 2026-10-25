import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Slide-over record panel for /admin list pages. Pure server component —
 * opening/closing is just navigation with/without the ?open= param, so no
 * client state is needed. Render when the open param resolves to a record.
 */
export function RecordDrawer({
  title,
  subtitle,
  closeHref,
  children,
}: {
  title: string;
  subtitle?: string;
  closeHref: string;
  children?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <Link href={closeHref} className="absolute inset-0 bg-black/65" aria-label="Close panel" scroll={false} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-white/15 bg-[#0c1925] text-inverted">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <div className="h-1 w-10 bg-accent" />
            <h2 className="mt-3 truncate font-heading text-2xl leading-none">{title}</h2>
            {subtitle ? <p className="mt-1.5 text-xs text-inverted/45">{subtitle}</p> : null}
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="min-h-9 border border-white/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-inverted/55 transition-colors hover:border-white/30 hover:text-inverted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Close
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}

/** In-list notice when ?open= names a record that does not exist. */
export function RecordNotice({ message, closeHref }: { message: string; closeHref: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 border border-amber-300/30 bg-[#2a2114] px-4 py-3 text-sm text-amber-100">
      <p>{message}</p>
      <Link href={closeHref} scroll={false} className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] underline underline-offset-2">
        Dismiss
      </Link>
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-inverted/35">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-inverted">{children}</p>
    </div>
  );
}
