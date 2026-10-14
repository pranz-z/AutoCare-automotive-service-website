import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { approvePendingAction } from "@/lib/agent/decisions";
import { badRequest, readJson, reqStr, ValidationError } from "@/lib/api/validate";

export const runtime = "nodejs";

/**
 * Executes a write-tier tool that was previously staged as a pending action.
 * The token is single-use: once the action is confirmed or expired it cannot
 * be replayed.
 */
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
    const token = reqStr(body, "token", 120);
    const outcome = await approvePendingAction(id, token, session);
    if (!outcome.ok) {
      return NextResponse.json({ ok: false, error: outcome.error }, { status: outcome.status });
    }
    return NextResponse.json({ ok: true, result: outcome.result, summary: outcome.summary });
  } catch (error) {
    if (error instanceof ValidationError) return badRequest(error.message);
    return NextResponse.json({ ok: false, error: "The action could not be confirmed." }, { status: 500 });
  }
}
