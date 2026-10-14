import test from "node:test";
import assert from "node:assert/strict";

process.env.ADMIN_SESSION_SECRET = "test-secret-for-admin-auth";
process.env.DATABASE_URL = ":memory:";

import {
  ADMIN_COOKIE,
  createSessionToken,
  getAdminSessionFromRequest,
  verifyCredentials,
  verifySessionToken,
} from "../src/lib/admin-auth";
import { POST as postLogin } from "../src/app/api/admin/login/route";
import { POST as postReset } from "../src/app/api/ai/reset/route";

let ipCounter = 0;
function req(body: unknown, extraHeaders: Record<string, string> = {}) {
  ipCounter += 1;
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${ipCounter}`, ...extraHeaders },
    body: JSON.stringify(body),
  });
}

// ----- credentials -----

test("verifyCredentials accepts valid demo credentials", () => {
  assert.equal(verifyCredentials("admin", "admin123"), "admin");
  assert.equal(verifyCredentials("manager", "manager123"), "manager");
  assert.equal(verifyCredentials("staff", "staff123"), "staff");
});

test("verifyCredentials rejects wrong password, unknown user, empty password", () => {
  assert.equal(verifyCredentials("admin", "wrong-password"), null);
  assert.equal(verifyCredentials("admin", "admin1234"), null);
  assert.equal(verifyCredentials("nobody", "admin123"), null);
  assert.equal(verifyCredentials("admin", ""), null);
});

test("verifyCredentials is case-insensitive on username", () => {
  assert.equal(verifyCredentials("ADMIN", "admin123"), "admin");
});

// ----- session tokens -----

test("session token round-trips through create and verify", () => {
  const token = createSessionToken("manager");
  assert.equal(verifySessionToken(token), "manager");
});

test("forged cookies are rejected: plaintext role, garbage, tampered signature", () => {
  assert.equal(verifySessionToken("admin"), null);
  assert.equal(verifySessionToken("admin.forged"), null);
  assert.equal(verifySessionToken("not-a-token"), null);
  assert.equal(verifySessionToken(""), null);
  assert.equal(verifySessionToken(undefined), null);

  const token = createSessionToken("admin");
  const [payload, signature] = token.split(".");
  // Tamper with the signature
  const flipped = signature[0] === "A" ? "B" : "A";
  assert.equal(verifySessionToken(`${payload}.${flipped}${signature.slice(1)}`), null);
  // Tamper with the payload (role change without re-signing)
  const forgedPayload = Buffer.from(JSON.stringify({ role: "admin", iat: 1, exp: 9e9 })).toString("base64url");
  assert.equal(verifySessionToken(`${forgedPayload}.${signature}`), null);
});

test("token signed with a different secret is rejected", () => {
  const foreign = createSessionToken("admin", "a-different-secret");
  assert.equal(verifySessionToken(foreign), null);
});

test("expired tokens are rejected", () => {
  const expired = createSessionToken("admin", undefined, -60);
  assert.equal(verifySessionToken(expired), null);
});

test("payloads with invalid roles are rejected even with a valid signature", () => {
  const payload = Buffer.from(JSON.stringify({ role: "root", iat: 1, exp: 9e9 })).toString("base64url");
  const signature = payload; // wrong sig, and wrong role anyway
  assert.equal(verifySessionToken(`${payload}.${signature}`), null);
});

test("getAdminSessionFromRequest parses the cookie header", () => {
  const token = createSessionToken("staff");
  const request = new Request("http://localhost", {
    headers: { cookie: `other=x; ${ADMIN_COOKIE}=${token}` },
  });
  assert.equal(getAdminSessionFromRequest(request)?.role, "staff");

  const forged = new Request("http://localhost", { headers: { cookie: `${ADMIN_COOKIE}=admin` } });
  assert.equal(getAdminSessionFromRequest(forged), null);
});

// ----- login endpoint -----

test("POST /api/admin/login returns 401 for bad credentials", async () => {
  const res = await postLogin(req({ username: "admin", password: "nope" }));
  assert.equal(res.status, 401);
});

test("POST /api/admin/login sets a signed httpOnly session cookie", async () => {
  const res = await postLogin(req({ username: "manager", password: "manager123" }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.role, "manager");

  const setCookie = res.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  const match = /autocare_admin_session=([^;]+)/.exec(setCookie);
  assert.ok(match, "session cookie should be set");
  const token = decodeURIComponent(match[1]);
  assert.equal(verifySessionToken(token), "manager", "cookie value must be a valid signed token");
  assert.notEqual(token, "manager", "cookie must not contain the raw role");
});

test("POST /api/admin/login rate limits repeated attempts", async () => {
  const ip = "203.0.113.250";
  const results: number[] = [];
  for (let i = 0; i < 7; i++) {
    const res = await postLogin(new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    }));
    results.push(res.status);
  }
  assert.deepEqual(results.slice(0, 5), [401, 401, 401, 401, 401]);
  assert.equal(results[5], 429);
  assert.equal(results[6], 429);
});

// ----- protected reset endpoint -----

test("POST /api/ai/reset rejects missing, forged, and under-privileged sessions", async () => {
  const anon = await postReset(new Request("http://localhost/api/ai/reset", { method: "POST" }));
  assert.equal(anon.status, 401);

  const forged = await postReset(new Request("http://localhost/api/ai/reset", {
    method: "POST",
    headers: { cookie: `${ADMIN_COOKIE}=admin` },
  }));
  assert.equal(forged.status, 401);

  const staff = createSessionToken("staff");
  const staffRes = await postReset(new Request("http://localhost/api/ai/reset", {
    method: "POST",
    headers: { cookie: `${ADMIN_COOKIE}=${staff}` },
  }));
  assert.equal(staffRes.status, 403);
});

test("POST /api/ai/reset succeeds with a valid admin session", async () => {
  const admin = createSessionToken("admin");
  const res = await postReset(new Request("http://localhost/api/ai/reset", {
    method: "POST",
    headers: { cookie: `${ADMIN_COOKIE}=${admin}` },
  }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});
