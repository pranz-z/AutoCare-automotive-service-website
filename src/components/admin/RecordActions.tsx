"use client";

import { useActionState } from "react";
import {
  appointmentAction,
  decidePendingAction,
  inquiryAction,
  type ActionState,
} from "@/app/admin/record-actions";

const btn =
  "w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";
const primaryBtn = `${btn} border-primary bg-primary text-inverted hover:opacity-90`;
const ghostBtn = `${btn} border-line bg-canvas text-ink hover:bg-surface`;
const dangerBtn = `${btn} border-red-300 bg-canvas text-red-700 hover:bg-red-50`;
const input =
  "w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function StateLine({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p className={`mt-2 text-xs ${state.ok ? "text-green-700" : "text-red-700"}`} role="status">
      {state.ok ? state.message : state.error}
    </p>
  );
}

/** Approve / Reject for a pending agent proposal on this record. */
export function PendingDecision({
  pendingId,
  token,
  summary,
  action,
  expired,
}: {
  pendingId: string;
  token: string;
  summary: string;
  action: string;
  expired: boolean;
}) {
  const [state, formAction, pending] = useActionState(decidePendingAction, null);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-amber-800">Agent proposal</p>
      <p className="mt-1 text-sm font-medium text-ink">{summary}</p>
      <p className="mt-0.5 text-xs text-muted">
        {action} · {expired ? "expired" : "awaiting decision"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <form action={formAction}>
          <input type="hidden" name="id" value={pendingId} />
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="decision" value="approve" />
          <button type="submit" disabled={expired || pending || !token} className={primaryBtn}>
            Approve
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="id" value={pendingId} />
          <input type="hidden" name="decision" value="reject" />
          <button type="submit" disabled={pending} className={ghostBtn}>
            Reject
          </button>
        </form>
      </div>
      <StateLine state={state} />
    </div>
  );
}

/** Appointment panel buttons; `allowed` comes from appointmentActionsFor(status). */
export function AppointmentPanelActions({ id, allowed }: { id: string; allowed: string[] }) {
  const [state, formAction, pending] = useActionState(appointmentAction, null);
  const has = (a: string) => allowed.includes(a);
  const single = (a: string, label: string, cls: string) => (
    <form action={formAction} key={a}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={a} />
      <button type="submit" disabled={pending} className={cls}>{label}</button>
    </form>
  );
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Actions</p>
      <div className="mt-2 space-y-2">
        {has("confirm") && single("confirm", "Confirm", primaryBtn)}
        {has("reschedule") && (
          <form action={formAction} className="space-y-2 rounded-lg border border-line bg-canvas p-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value="reschedule" />
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Reschedule</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="date" required className={input} />
              <input type="time" name="time" required className={input} />
            </div>
            <button type="submit" disabled={pending} className={ghostBtn}>Move appointment</button>
          </form>
        )}
        {has("in_service") && single("in_service", "Mark in service", ghostBtn)}
        {has("complete") && single("complete", "Complete", primaryBtn)}
        {has("cancel") && single("cancel", "Cancel", dangerBtn)}
        {!allowed.length && <p className="text-xs text-muted">No actions available for this status.</p>}
      </div>
      <StateLine state={state} />
    </div>
  );
}

/** Inquiry panel buttons; `allowed` comes from inquiryActionsFor(status). */
export function InquiryPanelActions({
  id,
  status,
  allowed,
  hasDraft,
  draftApproved,
  services,
  branches,
}: {
  id: string;
  status: string;
  allowed: string[];
  hasDraft: boolean;
  draftApproved: boolean;
  services: { id: string; name: string }[];
  branches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(inquiryAction, null);
  const has = (a: string) => allowed.includes(a);
  const single = (a: string, label: string, cls: string, disabled = false) => (
    <form action={formAction} key={a}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={a} />
      <button type="submit" disabled={pending || disabled} className={cls}>{label}</button>
    </form>
  );
  const open = status !== "closed" && status !== "resolved";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Actions</p>
      <div className="mt-2 space-y-2">
        {has("mark_contacted") && single("mark_contacted", "Mark contacted", ghostBtn)}
        {has("resolve") && single("resolve", "Resolve", primaryBtn)}
        {single("approve_draft", draftApproved ? "Draft reply approved" : "Approve draft reply",
          ghostBtn, !hasDraft || draftApproved)}
        {open && (
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value="priority" />
            <select name="priority" className={input} defaultValue="">
              <option value="" disabled>Change priority…</option>
              {["low", "normal", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button type="submit" disabled={pending} className={`${ghostBtn} w-auto shrink-0`}>Set</button>
          </form>
        )}
        {open && (
          <details className="rounded-lg border border-line bg-canvas">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              Convert to appointment
            </summary>
            <form action={formAction} className="space-y-2 border-t border-line p-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="action" value="convert" />
              <select name="serviceId" required className={input} defaultValue="">
                <option value="" disabled>Service…</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select name="branchId" required className={input} defaultValue="">
                <option value="" disabled>Branch…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" required className={input} />
                <input type="time" name="time" required className={input} />
              </div>
              <button type="submit" disabled={pending} className={primaryBtn}>Create booking</button>
            </form>
          </details>
        )}
      </div>
      <StateLine state={state} />
    </div>
  );
}
