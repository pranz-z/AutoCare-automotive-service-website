import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminChats } from "@/lib/admin-data";
import { getDb } from "@/lib/db/client";
import { createRepository, type Repository } from "@/lib/db/repository";
import { fmtDate, titleCase } from "@/lib/agent/cards";
import { DetailRow, RecordDrawer, RecordNotice } from "@/components/admin/RecordDrawer";
import { PendingDecision } from "@/components/admin/RecordActions";
import { pendingActionsForRecord, type PendingForRecord } from "@/lib/admin/record-mutations";

type ChatRow = Awaited<ReturnType<Repository["getChatSession"]>>;

/** Resolves ?open= by internal chat session id. */
export async function getOpenChat(open: string | undefined) {
  if (!open) return { chat: null, missing: false };
  const chat = (await createRepository(await getDb()).getChatSession(open)) ?? null;
  return { chat, missing: !chat };
}

export async function getChatPending(record: ChatRow): Promise<PendingForRecord[]> {
  if (!record) return [];
  return pendingActionsForRecord(createRepository(await getDb()), [record.id]);
}

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  await requireAdminSession("chats.view");
  const { open } = await searchParams;
  const [{ chat, missing }, adminChats] = await Promise.all([
    getOpenChat(open),
    getAdminChats(),
  ]);
  const pending = chat ? await getChatPending(chat) : [];

  return (
    <AdminPageFrame title="Chats" subtitle="Customer conversations and AI staff handoff overview">
      {missing ? <RecordNotice message="Record not found." closeHref="/admin/chats" /> : null}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="border border-line bg-surface p-5">
          <h2 className="font-heading text-2xl">Conversation inbox</h2>
          <div className="mt-5 space-y-3">
            {adminChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/admin/chats?open=${encodeURIComponent(chat.id)}`}
                className="block rounded-xl border border-line bg-canvas p-4 hover:border-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{chat.customerName}</p>
                    <p className="mt-1 text-sm text-muted">{chat.lastMessage}</p>
                  </div>
                  <span className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                    {chat.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{chat.timestamp}</span>
                  <span>{chat.conversationType}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border border-line bg-surface p-5">
          <h2 className="font-heading text-2xl">Conversation</h2>
          <div className="mt-4 space-y-3">
            {adminChats[0]?.messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-line bg-canvas p-3">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{message.senderLabel}</p>
                  <span className="text-[10px] text-muted">{message.time}</span>
                </div>
                <p className="text-sm text-ink">{message.content}</p>
                {message.metadata ? <p className="mt-2 text-[10px] text-muted">{message.metadata}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      {chat ? (
        <RecordDrawer
          title={`Chat — ${chat.customerName}`}
          subtitle={`${titleCase(chat.channel)} · started ${fmtDate(chat.createdAt)}`}
          closeHref="/admin/chats"
        >
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
              <DetailRow label="Session">{chat.id}</DetailRow>
              <DetailRow label="Channel">{titleCase(chat.channel)}</DetailRow>
              <DetailRow label="Type">{titleCase(chat.conversationType)}</DetailRow>
              <DetailRow label="Messages">{String(chat.messages.length)}</DetailRow>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Transcript</p>
              {chat.messages.length ? (
                <ul className="mt-2 space-y-2">
                  {chat.messages.map((m, i) => (
                    <li
                      key={m.id ?? i}
                      className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                        m.sender === "customer" ? "ml-auto bg-primary text-inverted" : "mr-auto bg-canvas text-ink"
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.15em] opacity-60">
                        {m.senderLabel} · {m.time}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No messages recorded.</p>
              )}
            </div>
          </div>
        </RecordDrawer>
      ) : null}
    </AdminPageFrame>
  );
}
