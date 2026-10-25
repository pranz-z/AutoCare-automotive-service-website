import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { getAdminDashboardStats, getRecentAppointments } from "@/lib/admin-data";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdminSession("appointments.view");

  const stats = await getAdminDashboardStats();
  const appointments = await getRecentAppointments(4);

  const kpis = [
    { label: "Today's appointments", value: stats.totalAppointments, caption: "All scheduled windows" },
    { label: "Pending", value: stats.pending, caption: "Awaiting confirmation" },
    { label: "Confirmed", value: stats.confirmed, caption: "Locked with customer" },
    { label: "In service", value: stats.inService, caption: "Currently in the bay" },
  ];

  return (
    <AdminPageFrame title="Dashboard" subtitle="Service operations overview">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="border border-white/10 bg-[#0c1925]">
            <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
              {kpis.map((item) => (
                <div key={item.label} className="p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-inverted/40">{item.label}</p>
                  <p className="mt-3 font-heading text-4xl leading-none text-inverted">{item.value}</p>
                  <p className="mt-2 text-xs text-inverted/35">{item.caption}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-white/10 bg-[#0c1925]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <p className="meta text-accent">Live queue</p>
                <h2 className="mt-1 font-heading text-2xl text-inverted">Upcoming appointments</h2>
              </div>
              <Link href="/admin/appointments" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent hover:text-inverted">
                View all
              </Link>
            </div>

            <div className="divide-y divide-white/10">
              {appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/admin/appointments/${appointment.id}`}
                  className="grid gap-3 px-4 py-4 transition-colors hover:bg-white/[0.035] sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:gap-5 sm:px-5"
                >
                  <div>
                    <p className="font-heading text-xl leading-none text-inverted">{appointment.time}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-inverted/35">{appointment.date}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-inverted">{appointment.customerName}</p>
                    <p className="mt-0.5 text-sm text-inverted/45">{appointment.vehicle}</p>
                    <p className="mt-1 text-sm text-inverted/65">{appointment.service}</p>
                  </div>
                  <span className="w-fit border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-inverted/55">
                    {appointment.status}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-white/10 bg-[#0c1925]">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="meta text-accent">Operations</p>
              <h2 className="mt-1 font-heading text-2xl text-inverted">Signals</h2>
            </div>
            <div className="divide-y divide-white/10 text-sm">
              {[
                { label: "Customer conversations", value: stats.customerConversations },
                { label: "AI conversations", value: stats.aiConversations },
                { label: "Human escalations", value: stats.escalations },
                { label: "Completed", value: stats.completed },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-inverted/50">{item.label}</span>
                  <strong className="font-heading text-2xl leading-none text-inverted">{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="space-y-2 p-4">
              <Link href="/admin/chats" className="block border border-white/10 px-3 py-2 text-sm text-inverted/65 transition-colors hover:border-accent hover:text-accent">
                View customer chats
              </Link>
              <Link href="/admin/appointments" className="block border border-white/10 px-3 py-2 text-sm text-inverted/65 transition-colors hover:border-accent hover:text-accent">
                View pending bookings
              </Link>
              <Link href="/admin/inquiries" className="block border border-white/10 px-3 py-2 text-sm text-inverted/65 transition-colors hover:border-accent hover:text-accent">
                View new inquiries
              </Link>
            </div>
          </section>

          <section className="border border-accent bg-accent p-5 text-accent-contrast">
            <p className="meta">Next action</p>
            <p className="mt-2 font-heading text-3xl uppercase leading-none">
              {stats.pending > 0 ? "Confirm pending bookings" : "Queue is clear"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-accent-contrast/70">
              {stats.pending > 0
                ? `${stats.pending} appointment${stats.pending === 1 ? " still needs" : "s still need"} a confirmation.`
                : "No pending appointments are waiting for a staff decision."}
            </p>
            <Link
              href="/admin/appointments"
              className="mt-4 inline-flex min-h-9 items-center border border-accent-contrast/40 px-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
            >
              Open queue
            </Link>
          </section>
        </aside>
      </div>
    </AdminPageFrame>
  );
}
