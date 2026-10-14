import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { fmtDate, titleCase } from "@/lib/agent/cards";

/** Exported for tests: throws notFound() (404) when the id is unknown. */
export async function getChatOr404(id: string) {
  const record = await createRepository(getDb()).getChatSession(id);
  if (!record) notFound();
  return record;
}

export default async function AdminChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession("chats.view");
  const { id } = await params;
  const session = await getChatOr404(id);

  return (
    <AdminPageFrame
      title={`Chat — ${session.customerName}`}
      subtitle={`${titleCase(session.channel)} · started ${fmtDate(session.createdAt)}`}
    >
      <Link href="/admin/chats" className="text-xs uppercase tracking-[0.18em] text-muted hover:text-ink">
        ← Back to list
      </Link>
      <div className="mt-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="mb-5 flex gap-6 border-b border-line pb-5 text-sm">
          <span><span className="text-muted">Session:</span> {session.id}</span>
          <span><span className="text-muted">Channel:</span> {titleCase(session.channel)}</span>
          <span><span className="text-muted">Type:</span> {titleCase(session.conversationType)}</span>
          <span><span className="text-muted">Messages:</span> {session.messages.length}</span>
        </div>
        {session.messages.length ? (
          <ul className="space-y-3">
            {session.messages.map((m, i) => (
              <li key={m.id ?? i} className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                m.sender === "customer" ? "ml-auto bg-primary text-inverted" : "mr-auto bg-muted text-ink"
              }`}>
                <p className="text-[10px] uppercase tracking-[0.15em] opacity-60">
                  {m.senderLabel} · {m.time}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No messages recorded.</p>
        )}
      </div>
    </AdminPageFrame>
  );
}
