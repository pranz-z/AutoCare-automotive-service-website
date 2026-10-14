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
      <Link href={closeHref} className="absolute inset-0 bg-ink/40" aria-label="Close panel" scroll={false} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-heading text-xl">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="rounded-md border border-line px-2.5 py-1 text-xs uppercase tracking-[0.15em] text-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Close
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}

/** In-list notice when ?open= names a record that does not exist. */
export function RecordNotice({ message, closeHref }: { message: string; closeHref: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>{message}</p>
      <Link href={closeHref} scroll={false} className="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-2">
        Dismiss
      </Link>
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium">{children}</p>
    </div>
  );
}
