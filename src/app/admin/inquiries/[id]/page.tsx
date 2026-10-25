import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { fmtDate, titleCase } from "@/lib/agent/cards";

/** Exported for tests: throws notFound() (404) when the id is unknown. */
export async function getInquiryOr404(id: string) {
  const record = await createRepository(await getDb()).getInquiryById(id);
  if (!record) notFound();
  return record;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-1.5 font-medium">{children}</p>
    </div>
  );
}

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession("ai.view");
  const { id } = await params;
  const inquiry = await getInquiryOr404(id);

  let triage: { urgency?: string; suggestedService?: string; rationale?: string; draftReply?: string } | null = null;
  if (inquiry.triage) {
    try { triage = JSON.parse(inquiry.triage); } catch { triage = null; }
  }

  return (
    <AdminPageFrame title={`Inquiry ${inquiry.reference}`} subtitle={inquiry.subject}>
      <Link href="/admin/inquiries" className="text-xs uppercase tracking-[0.18em] text-muted hover:text-ink">
        ← Back to list
      </Link>
      <div className="mt-4 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-line bg-surface p-6">
          <h2 className="font-heading text-2xl">Message</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Row label="Customer">{inquiry.customerName}</Row>
            <Row label="Reference">{inquiry.reference}</Row>
            <Row label="Email">{inquiry.customerEmail || "—"}</Row>
            <Row label="Phone">{inquiry.customerPhone || "—"}</Row>
            <Row label="Vehicle">{inquiry.vehicle || "—"}</Row>
            <Row label="Category">{titleCase(inquiry.category)}</Row>
            <Row label="Priority">{titleCase(inquiry.priority)}</Row>
            <Row label="Status">{titleCase(inquiry.status)}</Row>
            <Row label="Received">{fmtDate(inquiry.createdAt)}</Row>
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Message</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{inquiry.message || "—"}</p>
          </div>
        </section>

        <aside className="space-y-6 border border-line bg-surface p-6">
          <h3 className="font-heading text-xl">AI triage</h3>
          {triage ? (
            <div className="space-y-4 text-sm">
              <Row label="Urgency">{triage.urgency ? titleCase(triage.urgency) : "—"}</Row>
              <Row label="Suggested service">{triage.suggestedService ?? "—"}</Row>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Rationale</p>
                <p className="mt-1.5 text-muted">{triage.rationale ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Draft reply</p>
                <p className="mt-1.5 whitespace-pre-wrap text-muted">{triage.draftReply ?? "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No triage stored for this inquiry.</p>
          )}
        </aside>
      </div>
    </AdminPageFrame>
  );
}
