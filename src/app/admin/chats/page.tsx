import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminChats } from "@/lib/admin-data";

export default async function AdminChatsPage() {
  await requireAdminSession("chats.view");

  return (
    <AdminPageFrame title="Chats" subtitle="Customer conversations and AI staff handoff overview">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-heading text-2xl">Conversation inbox</h2>
          <div className="mt-5 space-y-3">
            {adminChats.map((chat) => (
              <div key={chat.id} className="rounded-xl border border-line bg-canvas p-4">
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
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
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
    </AdminPageFrame>
  );
}
