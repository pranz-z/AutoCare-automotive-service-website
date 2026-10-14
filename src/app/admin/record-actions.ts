"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAllowed, parseSessionToken } from "@/lib/admin-auth";
import {
  approveInquiryDraft,
  convertInquiryToAppointment,
  mutateAppointment,
  mutateInquiryPriority,
  mutateInquiryStatus,
  type MutationResult,
} from "@/lib/admin/record-mutations";
import { approvePendingAction, rejectPendingAction } from "@/lib/agent/decisions";

export type ActionState = MutationResult | null;

async function requireSession(permission: string) {
  const session = parseSessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  if (!isAllowed(session.role, permission)) redirect("/admin/dashboard");
  return session;
}

/** Appointment panel actions: confirm / reschedule / in_service / complete / cancel. */
export async function appointmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession("appointments.update");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const result = await mutateAppointment(session, id, action, {
    date: String(formData.get("date") ?? "") || undefined,
    time: String(formData.get("time") ?? "") || undefined,
  }).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "Action failed." }));
  if (result.ok) revalidatePath("/admin/appointments");
  return result;
}

/** Inquiry panel: mark_contacted / resolve / priority / approve_draft / convert. */
export async function inquiryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession("ai.view");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  let result: MutationResult;
  try {
    switch (action) {
      case "priority":
        result = await mutateInquiryPriority(session, id, String(formData.get("priority") ?? ""));
        break;
      case "approve_draft":
        result = await approveInquiryDraft(session, id);
        break;
      case "convert":
        result = await convertInquiryToAppointment(session, id, {
          serviceId: String(formData.get("serviceId") ?? ""),
          branchId: String(formData.get("branchId") ?? ""),
          date: String(formData.get("date") ?? ""),
          time: String(formData.get("time") ?? ""),
        });
        break;
      default:
        result = await mutateInquiryStatus(session, id, action);
    }
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : "Action failed." };
  }
  if (result.ok) revalidatePath("/admin/inquiries");
  return result;
}

/** Approve/reject a pending agent proposal shown on a record panel — same
 *  decision logic as /admin/approvals and POST /api/agent/confirm|reject. */
export async function decidePendingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession("ai.view");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  let result;
  try {
    result =
      decision === "approve"
        ? await approvePendingAction(id, String(formData.get("token") ?? ""), session)
        : await rejectPendingAction(id, session, String(formData.get("reason") ?? ""));
  } catch (e) {
    result = { ok: false as const, error: e instanceof Error ? e.message : "Decision failed." };
  }
  if (result.ok) {
    revalidatePath("/admin/approvals");
    for (const p of ["appointments", "inquiries", "customers", "chats"]) {
      revalidatePath(`/admin/${p}`);
    }
    return { ok: true, message: `Proposal ${decision === "approve" ? "approved" : "rejected"}.` };
  }
  return { ok: false, error: result.error };
}
