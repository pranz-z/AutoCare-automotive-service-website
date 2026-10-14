import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken, SESSION_TTL_SECONDS, takeLoginAttempt, verifyCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export async function POST(request: Request) {
  if (!takeLoginAttempt(clientKey(request))) {
    return NextResponse.json(
      { ok: false, message: "Too many login attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  let username: string;
  let password: string;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 4096) {
      return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
    }
    const body = JSON.parse(raw) as { username?: unknown; password?: unknown };
    username = String(body?.username ?? "").trim().toLowerCase();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const role = username && password ? verifyCredentials(username, password) : null;
  if (!role) {
    return NextResponse.json({ ok: false, message: "Invalid admin credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role, message: "Login successful." });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(role, undefined, SESSION_TTL_SECONDS, username), COOKIE_OPTIONS);
  return response;
}
