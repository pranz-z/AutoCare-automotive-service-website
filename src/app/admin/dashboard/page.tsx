import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { getAdminDashboardStats, getRecentAppointments } from "@/lib/admin-data";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdminSession("appointments.view");

  const stats = getAdminDashboardStats();
  const appointments = getRecentAppointments(4);

  return (
    <AdminPageFrame title="Dashboard" subtitle="Service operations overview">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today's Appointments", value: String(stats.totalAppointments) },
          { label: "Pending", value: String(stats.pending) },
          { label: "Confirmed", value: String(stats.confirmed) },
          { label: "In Service", value: String(stats.inService) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">{item.label}</p>
            <p className="mt-4 font-heading text-4xl">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-2xl">Upcoming appointments</h2>
            <Link href="/admin/appointments" className="text-sm text-accent underline-offset-4 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.map((appointment) => (
              <Link
                key={appointment.id}
                href={`/admin/appointments/${appointment.id}`}
                className="block rounded-xl border border-line bg-canvas p-4 transition hover:border-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">{appointment.time}</p>
                    <p className="mt-2 font-semibold">{appointment.customerName}</p>
                    <p className="text-sm text-muted">{appointment.vehicle}</p>
                    <p className="mt-1 text-sm">{appointment.service}</p>
                  </div>
                  <span className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                    {appointment.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-heading text-2xl">Operations</h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            <div className="flex justify-between border-b border-line pb-2"><span>Customer Conversations</span><strong className="text-ink">{stats.customerConversations}</strong></div>
            <div className="flex justify-between border-b border-line pb-2"><span>AI Conversations</span><strong className="text-ink">{stats.aiConversations}</strong></div>
            <div className="flex justify-between border-b border-line pb-2"><span>Human Escalations</span><strong className="text-ink">{stats.escalations}</strong></div>
            <div className="flex justify-between border-b border-line pb-2"><span>Completed</span><strong className="text-ink">{stats.completed}</strong></div>
          </div>

          <div className="mt-6 space-y-2">
            <Link href="/admin/chats" className="block rounded-md border border-line bg-canvas px-3 py-2 text-sm hover:border-accent">View customer chats</Link>
            <Link href="/admin/appointments" className="block rounded-md border border-line bg-canvas px-3 py-2 text-sm hover:border-accent">View pending bookings</Link>
            <Link href="/admin/inquiries" className="block rounded-md border border-line bg-canvas px-3 py-2 text-sm hover:border-accent">View new inquiries</Link>
          </div>
        </section>
      </div>
    </AdminPageFrame>
  );
}
