import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminSettingsPage() {
  await requireAdminSession("settings.manage");

  return (
    <AdminPageFrame title="Settings" subtitle="Internal service, team, and escalation preferences">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <p className="text-sm text-muted">This section is prepared for future operational controls, team settings, and escalations policy configuration.</p>
      </div>
    </AdminPageFrame>
  );
}
