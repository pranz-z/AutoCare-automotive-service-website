import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminRootPage() {
  const role = await getAdminSession();
  redirect(role ? "/admin/dashboard" : "/admin/login");
}
