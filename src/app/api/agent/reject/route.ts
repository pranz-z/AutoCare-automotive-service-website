import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { rejectPendingAction } from "@/lib/agent/decisions";
import { badRequest, optStr, readJson, reqStr, ValidationError } from "@/lib/api/validate";

export const runtime = "nodejs";

/** Rejects a pending write-tier action without executing it. */
export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 4096);
  } catch (error) {
    return badRequest(error instanceof ValidationError ? error.message : "Invalid request.");
  }

  try {
    const id = reqStr(body, "id", 120);
    const reason = optStr(body, "reason", 300);
    const outcome = await rejectPendingAction(id, session, reason);
    if (!outcome.ok) {
      return NextResponse.json({ ok: false, error: outcome.error }, { status: outcome.status });
    }
    return NextResponse.json({ ok: true, summary: outcome.summary });
  } catch (error) {
    if (error instanceof ValidationError) return badRequest(error.message);
    return NextResponse.json({ ok: false, error: "The action could not be rejected." }, { status: 500 });
  }
}
