import { NextResponse } from "next/server";
import { resetDemoData } from "@/lib/ai/demo-repository";
import { getAdminSessionFromRequest, isAllowed } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  if (!isAllowed(session.role, "settings.manage")) {
    return NextResponse.json({ ok: false, error: "Insufficient permissions." }, { status: 403 });
  }
  try {
    const result = resetDemoData();
    return NextResponse.json({ ok: true, message: result.message });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reset demo data" }, { status: 500 });
  }
}
