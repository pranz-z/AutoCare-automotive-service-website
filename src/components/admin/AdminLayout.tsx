import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminSession, getRoleLabel } from "@/lib/admin-auth";

export async function AdminPageFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const role = await getAdminSession();
  const resolvedRole = role ?? "staff";

  return (
    <div className="admin-shell min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-[#08131f] px-4 py-5 lg:flex lg:flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="[&_span]:text-inverted">
              <Logo inverted />
            </div>
            <span className="meta text-accent">Ops</span>
          </div>

          <div className="mt-6 flex-1">
            <AdminNav />
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="meta text-inverted/35">Access</p>
            <p className="mt-2 font-heading text-xl uppercase leading-none text-inverted">{getRoleLabel(resolvedRole)}</p>
            <form action="/api/admin/logout" method="post" className="mt-4">
              <button className="min-h-9 w-full border border-white/15 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/60 transition-colors hover:border-white/30 hover:text-inverted">
                Log out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#08131f]">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 bg-accent" />
                <p className="meta text-inverted/45">AutoCare operations</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden border border-white/10 px-3 py-2 text-xs text-inverted/45 sm:block">
                  Search
                </span>
                <span className="border border-white/10 px-3 py-2 text-xs text-inverted/60">
                  Alerts · 3
                </span>
                <span className="border border-white/10 px-3 py-2 text-xs font-semibold text-inverted">
                  {getRoleLabel(resolvedRole)}
                </span>
              </div>
            </div>

            <details className="border-t border-white/10 px-4 py-2 lg:hidden">
              <summary className="cursor-pointer py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/60">
                Navigation
              </summary>
              <div className="pb-4 pt-2">
                <AdminNav />
              </div>
            </details>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="meta text-accent">Operations</p>
                <h1 className="display mt-2 text-4xl text-inverted sm:text-5xl">{title}</h1>
                {subtitle ? <p className="mt-2 text-sm text-inverted/50">{subtitle}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/appointments"
                  className="inline-flex min-h-9 items-center border border-white/15 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/65 transition-colors hover:border-accent hover:text-accent"
                >
                  Open queue
                </Link>
                <Link
                  href="/admin/chats"
                  className="inline-flex min-h-9 items-center border border-white/15 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/65 transition-colors hover:border-accent hover:text-accent"
                >
                  Chats
                </Link>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
