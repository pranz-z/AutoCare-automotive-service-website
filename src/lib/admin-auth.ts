import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminRole = "admin" | "staff" | "manager";

export const ADMIN_COOKIE = "autocare_admin_session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  return value && ["admin", "staff", "manager"].includes(value) ? (value as AdminRole) : null;
}

export async function requireAdminSession(permission?: string) {
  const role = await getAdminSession();
  if (!role) {
    redirect("/admin/login");
  }

  if (permission && !isAllowed(role, permission)) {
    redirect("/admin/dashboard");
  }

  return role;
}

export function getRoleLabel(role: AdminRole) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  return "Staff";
}

export function isAllowed(role: AdminRole, permission: string) {
  const permissions: Record<AdminRole, string[]> = {
    admin: [
      "appointments.view",
      "appointments.update",
      "customers.view",
      "chats.view",
      "chats.respond",
      "ai.view",
      "reports.view",
      "settings.manage",
    ],
    manager: [
      "appointments.view",
      "appointments.update",
      "customers.view",
      "chats.view",
      "chats.respond",
      "ai.view",
      "reports.view",
    ],
    staff: [
      "appointments.view",
      "appointments.update",
      "customers.view",
      "chats.view",
      "chats.respond",
      "ai.view",
    ],
  };

  return permissions[role].includes(permission);
}
