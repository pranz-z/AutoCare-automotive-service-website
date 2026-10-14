import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { DDL, schema } from "./schema";
import { seedIfEmpty } from "./seed";

export type DbHandle = { sqlite: DatabaseSync; db: ReturnType<typeof createDrizzle> };

function createDrizzle(sqlite: DatabaseSync) {
  return drizzle(
    async (sql, params, method) => {
      try {
        if (method === "run") {
          sqlite.prepare(sql).run(...(params as (string | number | null)[]));
          return { rows: [] };
        }
        const stmt = sqlite.prepare(sql);
        const cols = stmt.columns().map((c) => c.name);
        const rows = stmt
          .all(...(params as (string | number | null)[]))
          .map((r) => cols.map((c) => (r as Record<string, unknown>)[c] ?? null));
        return { rows };
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        err.message = `sqlite error: ${err.message} (sql: ${sql})`;
        throw err;
      }
    },
    { schema },
  );
}

export function createDb(path?: string): DbHandle {
  const url = path ?? process.env.DATABASE_URL ?? ":memory:";
  let sqlite: DatabaseSync;
  if (url === ":memory:") {
    sqlite = new DatabaseSync(":memory:");
  } else {
    const file = url.startsWith("file:") ? url.slice(5) : url;
    mkdirSync(dirname(file), { recursive: true });
    sqlite = new DatabaseSync(file);
  }
  sqlite.exec("PRAGMA journal_mode=WAL;");
  sqlite.exec("PRAGMA foreign_keys=ON;");
  for (const stmt of DDL.split(";")) {
    const s = stmt.trim();
    if (s) sqlite.exec(s);
  }
  // Lightweight migrations for databases created before a column was added.
  for (const table of ["inquiries", "quotes"] as const) {
    const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === "triage")) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN triage TEXT`);
    }
  }
  const handle = { sqlite, db: createDrizzle(sqlite) };
  return handle;
}

const KEY = "__autocare_db";

const g = globalThis as unknown as Record<string, DbHandle | undefined>;

export function getDb(): DbHandle {
  if (!g[KEY]) {
    g[KEY] = createDb();
    seedIfEmpty(g[KEY]!);
  }
  return g[KEY]!;
}
