import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminInquiries } from "@/lib/admin-data";
import { getDb } from "@/lib/db/client";
import { createRepository, type Repository } from "@/lib/db/repository";
import { getServices } from "@/lib/content";
import { fmtDate, titleCase } from "@/lib/agent/cards";
import { DetailRow, RecordDrawer, RecordNotice } from "@/components/admin/RecordDrawer";
import { InquiryPanelActions, PendingDecision } from "@/components/admin/RecordActions";
import {
  inquiryActionsFor,
  pendingActionsForRecord,
  type PendingForRecord,
} from "@/lib/admin/record-mutations";

type InquiryRow = Awaited<ReturnType<Repository["getInquiryById"]>>;

/** Resolves ?open= against the real repository by internal id or reference. */
export async function getOpenInquiry(open: string | undefined) {
  if (!open) return { inquiry: null, missing: false };
  const repo = createRepository(await getDb());
  const inquiry =
    (await repo.getInquiryById(open)) ?? (await repo.getInquiry(open)) ?? null;
  return { inquiry, missing: !inquiry };
}

export async function getInquiryPending(record: InquiryRow): Promise<PendingForRecord[]> {
  if (!record) return [];
  return pendingActionsForRecord(createRepository(await getDb()), [record.id, record.reference]);
}

function InquiryPanel({
  inquiry,
  pending,
  branches,
}: {
  inquiry: NonNullable<InquiryRow>;
  pending: PendingForRecord[];
  branches: { id: string; name: string }[];
}) {
  let triage: {
    urgency?: string; suggestedService?: string; suggestedServiceName?: string | null;
    rationale?: string; draftReply?: string; draftApprovedAt?: string;
  } | null = null;
  if (inquiry.triage) {
    try { triage = JSON.parse(inquiry.triage); } catch { triage = null; }
  }
  return (
    <div className="space-y-5">
      {pending.map((p) => (
        <PendingDecision
          key={p.id}
          pendingId={p.id}
          token={p.token}
          summary={p.summary}
          action={p.action}
          expired={p.expired}
        />
      ))}

      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Customer">{inquiry.customerName}</DetailRow>
        <DetailRow label="Reference">{inquiry.reference}</DetailRow>
        <DetailRow label="Email">{inquiry.customerEmail || "—"}</DetailRow>
        <DetailRow label="Phone">{inquiry.customerPhone || "—"}</DetailRow>
        <DetailRow label="Vehicle">{inquiry.vehicle || "—"}</DetailRow>
        <DetailRow label="Category">{titleCase(inquiry.category)}</DetailRow>
        <DetailRow label="Status">{titleCase(inquiry.status)}</DetailRow>
        <DetailRow label="Priority">{titleCase(inquiry.priority)}</DetailRow>
        <DetailRow label="Created">{fmtDate(inquiry.createdAt)}</DetailRow>
        <DetailRow label="Suggested service">
          {triage?.suggestedServiceName ?? triage?.suggestedService ?? "—"}
        </DetailRow>
      </div>

      <div className="rounded-lg border border-line bg-canvas p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Message</p>
        <p className="mt-1.5 whitespace-pre-wrap text-sm">{inquiry.message || "—"}</p>
      </div>

      {triage ? (
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">AI triage</p>
          <div className="mt-2 space-y-2 text-sm">
            <p><span className="font-semibold">Urgency:</span> {triage.urgency ? titleCase(triage.urgency) : "—"}</p>
            {triage.rationale ? <p><span className="font-semibold">Rationale:</span> {triage.rationale}</p> : null}
            {triage.draftReply ? (
              <div>
                <p className="font-semibold">
                  Draft reply{triage.draftApprovedAt ? " (approved)" : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-muted">{triage.draftReply}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <InquiryPanelActions
        id={inquiry.id}
        status={inquiry.status}
        allowed={inquiryActionsFor(inquiry.status)}
        hasDraft={Boolean(triage?.draftReply)}
        draftApproved={Boolean(triage?.draftApprovedAt)}
        services={getServices().map((s) => ({ id: s.id, name: s.name }))}
        branches={branches}
      />
    </div>
  );
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  await requireAdminSession("ai.view");
  const { open } = await searchParams;
  const repo = createRepository(await getDb());
  const [{ inquiry, missing }, adminInquiries, branches] = await Promise.all([
    getOpenInquiry(open),
    getAdminInquiries(),
    repo.listBranches(),
  ]);
  const pending = inquiry ? await getInquiryPending(inquiry) : [];

  return (
    <AdminPageFrame title="Inquiries" subtitle="Customer issues and escalations needing attention">
      {missing ? <RecordNotice message="Record not found." closeHref="/admin/inquiries" /> : null}
      <div className="border border-line bg-surface p-5">
        <div className="divide-y divide-line md:hidden">
          {adminInquiries.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/admin/inquiries?open=${encodeURIComponent(inquiry.id)}`}
              className="block py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg leading-none">{inquiry.id}</p>
                  <p className="mt-2 font-semibold">{inquiry.customer}</p>
                </div>
                <span className="shrink-0 border border-line px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                  {inquiry.priority}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{inquiry.vehicle || "No vehicle provided"}</p>
              <p className="mt-1 text-sm text-muted">{inquiry.category} · {inquiry.status} · {inquiry.branch}</p>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-3">Inquiry ID</th>
                <th className="px-3 py-3">Customer</th>
                <th className="hidden px-3 py-3 md:table-cell">Vehicle</th>
                <th className="hidden px-3 py-3 md:table-cell">Category</th>
                <th className="px-3 py-3">Priority</th>
                <th className="hidden px-3 py-3 lg:table-cell">AI Triage</th>
                <th className="px-3 py-3">Status</th>
                <th className="hidden px-3 py-3 lg:table-cell">Branch</th>
              </tr>
            </thead>
            <tbody>
              {adminInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-line hover:bg-canvas">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/inquiries?open=${encodeURIComponent(inquiry.id)}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {inquiry.id}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{inquiry.customer}</td>
                  <td className="hidden px-3 py-3 md:table-cell">{inquiry.vehicle}</td>
                  <td className="hidden px-3 py-3 md:table-cell">{inquiry.category}</td>
                  <td className="px-3 py-3">{inquiry.priority}</td>
                  <td className="hidden px-3 py-3 text-xs text-muted lg:table-cell">{inquiry.triageSummary ?? "—"}</td>
                  <td className="px-3 py-3">{inquiry.status}</td>
                  <td className="hidden px-3 py-3 lg:table-cell">{inquiry.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inquiry ? (
        <RecordDrawer
          title={`Inquiry ${inquiry.reference}`}
          subtitle={inquiry.subject || inquiry.customerName}
          closeHref="/admin/inquiries"
        >
          <InquiryPanel inquiry={inquiry} pending={pending} branches={branches} />
        </RecordDrawer>
      ) : null}
    </AdminPageFrame>
  );
}
