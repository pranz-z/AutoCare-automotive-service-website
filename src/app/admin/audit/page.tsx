import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";

function pretty(json: string): string {
  try {
    const parsed = JSON.parse(json) as unknown;
    const text = JSON.stringify(parsed);
    return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  } catch {
    return json.slice(0, 160);
  }
}

export default async function AdminAuditPage() {
  await requireAdminSession("ai.view");
  const repo = createRepository(await getDb());
  const actions = await repo.listAgentActions();

  return (
    <AdminPageFrame title="Agent Audit Log" subtitle="Every tool call the agent made, who invoked it, and the outcome">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {actions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No agent activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Tool</th>
                  <th className="px-3 py-3">Actor</th>
                  <th className="px-3 py-3">Session</th>
                  <th className="px-3 py-3">Input</th>
                  <th className="px-3 py-3">Output</th>
                  <th className="px-3 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} className="border-b border-line align-top hover:bg-canvas">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{a.toolName}</td>
                    <td className="px-3 py-3 text-xs">{a.actorType}</td>
                    <td className="px-3 py-3 text-xs text-muted">{a.sessionId ?? "—"}</td>
                    <td className="max-w-56 px-3 py-3 font-mono text-xs text-muted">{pretty(a.input)}</td>
                    <td className="max-w-56 px-3 py-3 font-mono text-xs text-muted">{pretty(a.output)}</td>
                    <td className={`px-3 py-3 text-xs font-semibold ${a.success ? "text-green-700" : "text-red-700"}`}>
                      {a.success ? "OK" : "FAIL"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageFrame>
  );
}
