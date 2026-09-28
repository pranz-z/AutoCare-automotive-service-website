import { NextResponse } from "next/server";

const validAccounts: Record<string, string> = {
  admin: "admin123",
  manager: "manager123",
  staff: "staff123",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!username || !password || validAccounts[username] !== password) {
      return NextResponse.json({ ok: false, message: "Invalid admin credentials." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, role: username, message: "Login successful." });
    response.cookies.set("autocare_admin_session", username, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to process login request." }, { status: 500 });
  }
}
