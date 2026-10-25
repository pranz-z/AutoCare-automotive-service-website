import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardStats } from "@/lib/admin-data";

export default async function AdminReportsPage() {
  await requireAdminSession("reports.view");
  const stats = await getAdminDashboardStats();

  const items = [
    { label: "Today's bookings", value: stats.totalAppointments },
    { label: "Pending", value: stats.pending },
    { label: "Completed", value: stats.completed },
    { label: "Escalations", value: stats.escalations },
  ];

  return (
    <AdminPageFrame title="Reports" subtitle="Operational metrics and service overview">
      <section className="border border-white/10 bg-[#0c1925]">
        <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-inverted/40">{item.label}</p>
              <p className="mt-3 font-heading text-5xl leading-none text-inverted">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-inverted/40">
        Figures are computed from the current demo records. No comparative period is stored, so no trend claim is shown.
      </p>
    </AdminPageFrame>
  );
}
