import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminSettingsPage() {
  await requireAdminSession("settings.manage");

  return (
    <AdminPageFrame title="Settings" subtitle="Internal service, team, and escalation preferences">
      <section className="border border-white/10 bg-[#0c1925]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="meta text-accent">Configuration</p>
          <h2 className="mt-1 font-heading text-2xl text-inverted">Operations controls</h2>
        </div>
        <div className="px-4 py-6">
          <p className="max-w-2xl text-sm leading-relaxed text-inverted/50">
            This section is prepared for future operational controls, team settings, and escalations policy configuration.
          </p>
        </div>
      </section>
    </AdminPageFrame>
  );
}
