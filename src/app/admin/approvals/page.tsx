import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { approveAction, rejectAction } from "./actions";

interface PendingView {
  id: string;
  action: string;
  summary: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
}

function describe(row: { id: string; action: string; payload: string; expiresAt: string; createdAt: string }): PendingView {
  let summary = row.action;
  let token = "";
  try {
    const parsed = JSON.parse(row.payload) as { summary?: string; token?: string };
    if (parsed.summary) summary = parsed.summary;
    token = parsed.token ?? "";
  } catch { /* keep raw action name */ }
  return {
    id: row.id,
    action: row.action,
    summary,
    token,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    expired: new Date(row.expiresAt).getTime() < Date.now(),
  };
}

export default async function AdminApprovalsPage() {
  await requireAdminSession("ai.view");
  const repo = createRepository(await getDb());
  const rows = await repo.listPendingActions();
  const pending = rows.filter((r) => r.status === "pending").map(describe);
  const resolved = rows.filter((r) => r.status !== "pending").slice(0, 20);

  return (
    <AdminPageFrame title="Approvals" subtitle="Agent-proposed changes awaiting a staff decision">
      <section className="border border-white/10 bg-[#0c1925]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="meta text-accent">Decision queue</p>
          <h2 className="mt-1 font-heading text-2xl text-inverted">Pending approvals</h2>
        </div>
        {pending.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-inverted/45">No pending approvals.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="font-medium text-inverted">{p.summary}</p>
                  <p className="mt-1 text-xs text-inverted/40">
                    {p.action} · proposed {new Date(p.createdAt).toLocaleString()} ·{" "}
                    {p.expired ? "expired" : `expires ${new Date(p.expiresAt).toLocaleTimeString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="token" value={p.token} />
                    <button
                      type="submit"
                      disabled={p.expired}
                      className="min-h-9 border border-accent bg-accent px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-contrast disabled:opacity-40"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="min-h-9 border border-white/15 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/55 hover:border-white/30 hover:text-inverted"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section className="mt-6 border border-white/10 bg-[#0c1925]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="meta text-inverted/40">Recently resolved</p>
          </div>
          <div className="divide-y divide-white/10">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-inverted/60">{r.action}</span>
                <span className={`text-[10px] uppercase tracking-[0.12em] ${r.status === "confirmed" ? "text-green-400" : "text-inverted/35"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AdminPageFrame>
  );
}
