import type { DbHandle } from "./client";
import { DDL } from "./schema";

/**
 * Versioned migrations, tracked in a `schema_migrations` table so the runner
 * is safe to execute repeatedly (and on databases that predate a migration).
 * Migrations themselves are written to be idempotent where possible.
 */
interface Migration {
  version: number;
  name: string;
  up: (handle: DbHandle) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial-schema",
    // All CREATE TABLE IF NOT EXISTS — safe on existing databases.
    up: async ({ client }) => {
      await client.executeMultiple(DDL);
    },
  },
  {
    version: 2,
    name: "triage-columns",
    up: async ({ client }) => {
      for (const table of ["inquiries", "quotes"] as const) {
        const cols = await client.execute(`PRAGMA table_info(${table})`);
        if (!cols.rows.some((c) => c.name === "triage")) {
          await client.execute(`ALTER TABLE ${table} ADD COLUMN triage TEXT`);
        }
      }
    },
  },
];

/** Applies pending migrations in order; returns the versions applied now. */
export async function migrate(handle: DbHandle): Promise<number[]> {
  await handle.client.execute(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)",
  );
  const rows = await handle.client.execute("SELECT version FROM schema_migrations");
  const applied = new Set(rows.rows.map((r) => Number(r.version)));
  const ran: number[] = [];
  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    await m.up(handle);
    await handle.client.execute({
      sql: "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      args: [m.version, m.name, new Date().toISOString()],
    });
    ran.push(m.version);
  }
  return ran;
}
