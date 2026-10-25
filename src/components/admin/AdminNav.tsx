"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Appointments", href: "/admin/appointments" },
      { label: "Customers", href: "/admin/customers" },
      { label: "Chats", href: "/admin/chats" },
      { label: "Inquiries", href: "/admin/inquiries" },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Assistant", href: "/admin/assistant" },
      { label: "Approvals", href: "/admin/approvals" },
      { label: "Audit log", href: "/admin/audit" },
      { label: "Reports", href: "/admin/reports" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Services", href: "/admin/services" },
      { label: "Vehicles", href: "/admin/vehicles" },
      { label: "Branches", href: "/admin/branches" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.16em] text-inverted/35">{group.label}</p>
          <div>
            {group.items.map((item) => {
              const active = item.href === "/admin/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex min-h-9 items-center border-l px-3 text-[13px] transition-colors ${
                    active
                      ? "border-accent bg-white/[0.04] text-inverted"
                      : "border-transparent text-inverted/55 hover:border-white/20 hover:text-inverted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
