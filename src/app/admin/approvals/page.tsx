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
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {pending.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No pending approvals.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <div>
                  <p className="font-medium">{p.summary}</p>
                  <p className="mt-1 text-xs text-muted">
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
                      className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-green-700 disabled:opacity-40"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:bg-canvas"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.1em] text-muted">Recently resolved</p>
          <div className="space-y-2">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.action}</span>
                <span className={`text-xs uppercase tracking-[0.1em] ${r.status === "confirmed" ? "text-green-700" : "text-muted"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageFrame>
  );
}
