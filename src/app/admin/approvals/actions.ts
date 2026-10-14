"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAllowed, parseSessionToken } from "@/lib/admin-auth";
import { approvePendingAction, rejectPendingAction } from "@/lib/agent/decisions";

async function requireSession() {
  const session = parseSessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  if (!isAllowed(session.role, "ai.view")) redirect("/admin/dashboard");
  return session;
}

export async function approveAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const token = String(formData.get("token") ?? "");
  if (id && token) await approvePendingAction(id, token, session).catch(() => null);
  revalidatePath("/admin/approvals");
}

export async function rejectAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (id) await rejectPendingAction(id, session, reason).catch(() => null);
  revalidatePath("/admin/approvals");
}
