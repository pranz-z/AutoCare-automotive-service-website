import type { ReactNode } from "react";
import { getAdminSession } from "@/lib/admin-auth";
import { AutoCareAssistant } from "@/components/ai/AutoCareAssistant";

/**
 * Wraps every /admin/* page. Mounts the staff assistant as a floating widget
 * here so its state persists across admin page navigations — layouts stay
 * mounted while children swap. Hidden on /admin/login (no session).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  return (
    <>
      {children}
      {session ? <AutoCareAssistant mode="admin" /> : null}
    </>
  );
}
