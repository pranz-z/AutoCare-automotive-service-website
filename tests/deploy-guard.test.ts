import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync, randomBytes } from "node:crypto";
import { createDb } from "../src/lib/db/client";
import { register } from "../src/instrumentation";
import {
  ADMIN_COOKIE,
  adminCredentialsConfigured,
  createSessionToken,
  demoResetAllowed,
  verifyCredentials,
} from "../src/lib/admin-auth";
import { POST as postReset } from "../src/app/api/ai/reset/route";
import { POST as postLogin } from "../src/app/api/admin/login/route";

/** Runs fn with the given env overrides, restoring everything afterwards. */
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T | Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    saved[k] = process.env[k];
    if (vars[k] === undefined) delete process.env[k];
    else process.env[k] = vars[k];
  }
  const restore = () => {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  };
  const out = fn();
  return Promise.resolve(out).finally(restore) as Promise<T>;
}

// ---------- 1. demo reset gate ----------

test("demoResetAllowed: allowed outside production and with the flag", async () => {
  await withEnv({ NODE_ENV: "test", ALLOW_DEMO_RESET: undefined }, async () => {
    assert.equal(demoResetAllowed(), true);
  });
  await withEnv({ NODE_ENV: "production", ALLOW_DEMO_RESET: "true" }, async () => {
    assert.equal(demoResetAllowed(), true);
  });
  await withEnv({ NODE_ENV: "production", ALLOW_DEMO_RESET: undefined }, async () => {
    assert.equal(demoResetAllowed(), false);
  });
  await withEnv({ NODE_ENV: "production", ALLOW_DEMO_RESET: "yes" }, async () => {
    assert.equal(demoResetAllowed(), false);
  });
});

test("POST /api/ai/reset: production without ALLOW_DEMO_RESET is denied even for admin", async () => {
  const admin = createSessionToken("admin");
  await withEnv({ NODE_ENV: "production", ALLOW_DEMO_RESET: undefined }, async () => {
    const res = await postReset(new Request("http://localhost/api/ai/reset", {
      method: "POST",
      headers: { cookie: `${ADMIN_COOKIE}=${admin}` },
    }));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /ALLOW_DEMO_RESET/);
  });
});

// ---------- 2. production DATABASE_URL startup guard ----------

test("createDb throws in production when DATABASE_URL is missing or local", async () => {
  await withEnv({ NODE_ENV: "production", DATABASE_URL: undefined, DATABASE_AUTH_TOKEN: undefined }, async () => {
    assert.throws(() => createDb(), /DATABASE_URL is missing/);
  });
  await withEnv({ NODE_ENV: "production", DATABASE_URL: ":memory:" }, async () => {
    assert.throws(() => createDb(), /requires a remote libsql/);
  });
  await withEnv({ NODE_ENV: "production", DATABASE_URL: "file:./data/x.db" }, async () => {
    assert.throws(() => createDb(), /requires a remote libsql/);
  });
});

test("createDb accepts remote URLs in production and any URL outside it", async () => {
  await withEnv(
    { NODE_ENV: "production", DATABASE_URL: "libsql://db-org.turso.io", DATABASE_AUTH_TOKEN: "tok" },
    async () => {
      const h = createDb();
      assert.equal(h.url, "libsql://db-org.turso.io");
      h.client.close();
    },
  );
  await withEnv({ NODE_ENV: "test", DATABASE_URL: undefined }, async () => {
    const h = createDb(":memory:");
    assert.equal(h.url, ":memory:");
    h.client.close();
  });
});

test("instrumentation register() throws for bad prod config, passes otherwise", async () => {
  await withEnv(
    { NODE_ENV: "production", NEXT_PHASE: undefined, DATABASE_URL: undefined },
    async () => {
      assert.throws(() => register(), /DATABASE_URL/);
    },
  );
  await withEnv(
    { NODE_ENV: "production", NEXT_PHASE: "phase-production-build", DATABASE_URL: undefined },
    async () => {
      assert.doesNotThrow(() => register()); // build must not run the guard
    },
  );
  await withEnv(
    { NODE_ENV: "production", NEXT_PHASE: "phase-production-server", DATABASE_URL: "libsql://x.turso.io" },
    async () => {
      assert.doesNotThrow(() => register());
    },
  );
});

// ---------- 5. admin credentials from env ----------

test("env credentials verify; production has no built-in account fallback", async () => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync("S3cure!Pass", salt, 64).toString("hex");
  const env = {
    NODE_ENV: "production",
    ADMIN_CREDENTIAL_ADMIN: `${salt}:${hash}`,
    ADMIN_CREDENTIAL_MANAGER: undefined,
    ADMIN_CREDENTIAL_STAFF: undefined,
  };
  await withEnv(env, async () => {
    assert.equal(verifyCredentials("admin", "S3cure!Pass"), "admin");
    assert.equal(verifyCredentials("admin", "wrong"), null);
    // Built-in demo accounts do not exist in production:
    assert.equal(verifyCredentials("manager", "manager123"), null);
    assert.equal(verifyCredentials("staff", "staff123"), null);
    assert.equal(adminCredentialsConfigured(), true);
  });
});

test("no env means no accounts anywhere — the old demo logins are gone", async () => {
  await withEnv(
    {
      NODE_ENV: "test",
      ADMIN_CREDENTIAL_ADMIN: undefined,
      ADMIN_CREDENTIAL_MANAGER: undefined,
      ADMIN_CREDENTIAL_STAFF: undefined,
    },
    async () => {
      assert.equal(verifyCredentials("admin", "admin123"), null);
      assert.equal(verifyCredentials("manager", "manager123"), null);
      assert.equal(verifyCredentials("staff", "staff123"), null);
      assert.equal(adminCredentialsConfigured(), false);
    },
  );
});

test("malformed env credential fails closed", async () => {
  await withEnv({ NODE_ENV: "production", ADMIN_CREDENTIAL_ADMIN: "no-colon-here" }, async () => {
    assert.equal(verifyCredentials("admin", "admin123"), null);
  });
});

test("POST /api/admin/login returns 503 when no credentials are configured", async () => {
  await withEnv(
    {
      ADMIN_CREDENTIAL_ADMIN: undefined,
      ADMIN_CREDENTIAL_MANAGER: undefined,
      ADMIN_CREDENTIAL_STAFF: undefined,
    },
    async () => {
      const res = await postLogin(new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      }));
      assert.equal(res.status, 503);
    },
  );
});
