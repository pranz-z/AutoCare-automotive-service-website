import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import type { ResultSet } from "@libsql/client";
import { schema } from "./schema";

export type Db = LibSQLDatabase<typeof schema>;
export type Tx = SQLiteTransaction<
  "async",
  ResultSet,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
export type DbLike = Db | Tx;

export interface DbHandle {
  client: Client;
  db: Db;
  url: string;
}

/**
 * Async-scoped transaction handle. `withTransaction` stores the tx query
 * object here so `createRepository(await getDb())` calls made deep inside a
 * confirmed agent action join the same transaction automatically.
 */
export const txScope = new AsyncLocalStorage<DbLike>();
export function currentTxDb(): DbLike | undefined {
  return txScope.getStore();
}

export function isMemoryUrl(url: string) {
  return url === ":memory:";
}

export function isFileUrl(url: string) {
  return url === ":memory:" || url.startsWith("file:");
}

/**
 * Opens a libsql connection. Local URLs (:memory:, file:) work offline;
 * remote libsql:/https: URLs read DATABASE_AUTH_TOKEN. No filesystem access
 * and no schema work here — run `npm run db:migrate` for file/remote
 * databases (`file:` requires its directory to exist; the migrate and seed
 * scripts create it).
 */
export function createDb(url?: string): DbHandle {
  const resolved = url ?? process.env.DATABASE_URL ?? ":memory:";
  if (process.env.NODE_ENV === "production" && !isRemoteUrl(resolved)) {
    throw new Error(
      `DATABASE_URL is ${url === undefined && !process.env.DATABASE_URL ? "missing" : `"${resolved}"`} — ` +
        "production requires a remote libsql:// or https:// (Turso) URL. " +
        "Refusing to silently fall back to ephemeral/local storage.",
    );
  }
  const remote = isRemoteUrl(resolved);
  const authToken = remote ? process.env.DATABASE_AUTH_TOKEN : undefined;
  const client = createClient({ url: resolved, authToken });
  return { client, db: drizzle(client, { schema }), url: resolved };
}

export function isRemoteUrl(url: string) {
  return !isFileUrl(url);
}

const KEY = "__autocare_db";
const g = globalThis as unknown as Record<string, Promise<DbHandle> | undefined>;

async function init(): Promise<DbHandle> {
  const handle = createDb();
  if (isFileUrl(handle.url)) {
    await handle.client.execute("PRAGMA foreign_keys=ON");
    if (!isMemoryUrl(handle.url)) {
      await handle.client.execute("PRAGMA journal_mode=WAL");
    }
  }
  if (isMemoryUrl(handle.url)) {
    // A fresh in-memory database is born empty — tests have no other way to
    // get schema. Migrations and the demo seed run once per process here;
    // file/remote databases are never auto-migrated (use `npm run db:migrate`).
    const { migrate } = await import("./migrate");
    const { seedIfEmpty } = await import("./seed");
    await migrate(handle);
    await seedIfEmpty(handle);
  }
  return handle;
}

/** Process-wide connection. Async because :memory: databases self-migrate on first use. */
export function getDb(): Promise<DbHandle> {
  g[KEY] ??= init();
  return g[KEY]!;
}

/** Drops the memoized connection promise (test isolation). */
export function resetDbCache() {
  g[KEY] = undefined;
}
