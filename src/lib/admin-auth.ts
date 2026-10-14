import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminRole = "admin" | "staff" | "manager";

export const ADMIN_COOKIE = "autocare_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const VALID_ROLES: readonly string[] = ["admin", "staff", "manager"];

export interface SessionPayload {
  role: AdminRole;
  /** Username of the signed-in account, e.g. "admin". */
  sub?: string;
  iat: number;
  exp: number;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * HMAC secret for session tokens. Set ADMIN_SESSION_SECRET in production.
 * When unset, a random per-process secret is used — valid sessions do not
 * survive a restart, which is a safe default for local/dev use.
 */
let ephemeralSecret: string | null = null;
function sessionSecret(override?: string): string {
  if (override) return override;
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  ephemeralSecret ??= randomBytes(32).toString("hex");
  return ephemeralSecret;
}

function sign(payloadB64: string, secret?: string): string {
  return createHmac("sha256", sessionSecret(secret)).update(payloadB64).digest("base64url");
}

export function createSessionToken(
  role: AdminRole,
  secret?: string,
  ttlSeconds = SESSION_TTL_SECONDS,
  sub?: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ role, sub, iat: now, exp: now + ttlSeconds }));
  return `${payload}.${sign(payload, secret)}`;
}

export function parseSessionToken(token: string | undefined | null, secret?: string): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payloadB64, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as SessionPayload;
    if (!VALID_ROLES.includes(payload.role)) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined | null, secret?: string): AdminRole | null {
  return parseSessionToken(token, secret)?.role ?? null;
}

/** Generic HMAC sign/verify for non-session tokens (e.g. anonymous caller cookies). */
export function hmacSign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function hmacVerify(value: string, signature: string): boolean {
  const a = Buffer.from(signature);
  const b = Buffer.from(hmacSign(value));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getAdminSession(): Promise<AdminRole | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

/** Session check for route handlers (which cannot use next/headers cookies()). */
export function getAdminSessionFromRequest(request: Request): SessionPayload | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === ADMIN_COOKIE) {
      return parseSessionToken(decodeURIComponent(part.slice(eq + 1).trim()));
    }
  }
  return null;
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

  return permissions[role]?.includes(permission) ?? false;
}

/**
 * Demo-data reset is destructive. In production it must be explicitly enabled
 * via ALLOW_DEMO_RESET=true — everywhere else it is allowed (dev, tests).
 */
export function demoResetAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_RESET === "true";
}

/** True when at least one ADMIN_CREDENTIAL_* env var configures an account. */
export function adminCredentialsConfigured(): boolean {
  return VALID_ROLES.some((r) => Boolean(process.env[`ADMIN_CREDENTIAL_${r.toUpperCase()}`]));
}

// ----- credentials (scrypt-hashed; configured via env, never in source) -----

interface AdminAccount {
  role: AdminRole;
  salt: string;
  hash: string;
}

/**
 * Resolves an account from `ADMIN_CREDENTIAL_<USERNAME>` ("salt_hex:hash_hex").
 * There are NO built-in credentials — an unset or malformed env var means the
 * account does not exist (fail closed), in every environment.
 */
function accountFor(username: string): AdminAccount | null {
  const name = username.toLowerCase();
  if (!VALID_ROLES.includes(name)) return null;
  const envVal = process.env[`ADMIN_CREDENTIAL_${name.toUpperCase()}`];
  if (!envVal) return null;
  const [salt, hash] = envVal.split(":");
  if (!salt || !hash) return null;
  return { role: name as AdminRole, salt, hash };
}

export function verifyCredentials(username: string, password: string): AdminRole | null {
  const account = accountFor(username);
  if (!account || !password) return null;
  const derived = scryptSync(password, account.salt, 64);
  const expected = Buffer.from(account.hash, "hex");
  if (derived.length !== expected.length || !timingSafeEqual(derived, expected)) return null;
  return account.role;
}

// ----- login rate limiting (per client key, fixed window) -----

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function takeLoginAttempt(key: string): boolean {
  const nowMs = Date.now();
  const bucket = loginAttempts.get(key);
  if (!bucket || bucket.resetAt < nowMs) {
    loginAttempts.set(key, { count: 1, resetAt: nowMs + LOGIN_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= LOGIN_MAX_ATTEMPTS;
}
