import { randomBytes } from "node:crypto";
import { getAdminSessionFromRequest, hmacSign, hmacVerify } from "@/lib/admin-auth";

/**
 * Rate limiting keyed on verified session identity — not spoofable headers.
 * Staff are keyed by their signed session (sub/role); anonymous visitors get a
 * signed, httpOnly cookie minted on first request, so the identity is
 * server-issued and tamper-evident.
 */

export const ANON_COOKIE = "autocare_anon";

export function callerKey(request: Request): { key: string; setAnonCookie?: string } {
  const staff = getAdminSessionFromRequest(request);
  if (staff) return { key: `staff:${staff.sub ?? staff.role}` };

  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== ANON_COOKIE) continue;
    const value = decodeURIComponent(part.slice(eq + 1).trim());
    const dot = value.lastIndexOf(".");
    if (dot <= 0) continue;
    const id = value.slice(0, dot);
    if (/^[a-f0-9]{24}$/.test(id) && hmacVerify(id, value.slice(dot + 1))) {
      return { key: `anon:${id}` };
    }
  }

  const id = randomBytes(12).toString("hex");
  return { key: `anon:${id}`, setAnonCookie: `${id}.${hmacSign(id)}` };
}

export function attachCallerCookie(response: Response, setAnonCookie?: string): Response {
  if (!setAnonCookie) return response;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${ANON_COOKIE}=${setAnonCookie}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${secure}`,
  );
  return response;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function takeRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= maxRequests;
}
