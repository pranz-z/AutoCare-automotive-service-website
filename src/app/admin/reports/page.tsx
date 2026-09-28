import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardStats } from "@/lib/admin-data";

export default async function AdminReportsPage() {
  await requireAdminSession("reports.view");
  const stats = getAdminDashboardStats();

  return (
    <AdminPageFrame title="Reports" subtitle="Operational metrics and service overview">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today's bookings", value: stats.totalAppointments },
          { label: "Pending", value: stats.pending },
          { label: "Completed", value: stats.completed },
          { label: "Escalations", value: stats.escalations },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{item.label}</p>
            <p className="mt-4 font-heading text-4xl">{item.value}</p>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
