import Link from "next/link";
import type { ReactNode } from "react";
import { getAdminSession, getRoleLabel } from "@/lib/admin-auth";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Appointments", href: "/admin/appointments" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Chats", href: "/admin/chats" },
  { label: "Inquiries", href: "/admin/inquiries" },
  { label: "Services", href: "/admin/services" },
  { label: "Vehicles", href: "/admin/vehicles" },
  { label: "Branches", href: "/admin/branches" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" },
];

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
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-line bg-primary px-5 py-8 text-inverted lg:block">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-accent">AutoCare</p>
              <h2 className="mt-2 font-heading text-2xl">Operations</h2>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md border border-transparent px-3 py-2 text-sm text-inverted/80 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-accent">Access</p>
            <p className="mt-2 font-semibold">{getRoleLabel(resolvedRole)}</p>
            <form action="/api/admin/logout" method="post" className="mt-4">
              <button className="w-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-inverted/80 hover:bg-white/5">
                Log out
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 bg-canvas">
          <header className="border-b border-line bg-surface/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-accent">Admin Dashboard</p>
                <h1 className="mt-2 font-heading text-2xl sm:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-line bg-surface px-3 py-2 text-sm text-muted sm:block">
                  Search
                </div>
                <div className="rounded-full border border-line bg-surface px-3 py-2 text-sm text-muted">
                  Alerts · 3
                </div>
                <div className="rounded-full border border-line bg-surface px-3 py-2 text-sm font-medium">
                  {getRoleLabel(resolvedRole)}
                </div>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
