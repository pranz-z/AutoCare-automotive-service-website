import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { AutoCareAssistant } from "@/components/ai/AutoCareAssistant";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminAssistantPage() {
  await requireAdminSession("ai.view");

  return (
    <AdminPageFrame
      title="AI Assistant"
      subtitle="Staff copilot — search records, triage inquiries, propose changes for approval"
    >
      <div className="mx-auto max-w-2xl">
        <AutoCareAssistant mode="admin" inline />
        <p className="mt-4 text-center text-xs text-muted">
          Actions marked “requires confirmation” land in{" "}
          <a href="/admin/approvals" className="underline">Approvals</a> for review.
        </p>
      </div>
    </AdminPageFrame>
  );
}
