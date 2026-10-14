import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { demoResetAllowed, getAdminSessionFromRequest, isAllowed } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  if (!isAllowed(session.role, "settings.manage")) {
    return NextResponse.json({ ok: false, error: "Insufficient permissions." }, { status: 403 });
  }
  if (!demoResetAllowed()) {
    return NextResponse.json(
      { ok: false, error: "Demo reset is disabled in production. Set ALLOW_DEMO_RESET=true to enable." },
      { status: 403 },
    );
  }
  try {
    const repo = createRepository(await getDb());
    await repo.resetData();
    return NextResponse.json({ ok: true, message: "Demo data has been reset to seeded state" });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reset demo data" }, { status: 500 });
  }
}
