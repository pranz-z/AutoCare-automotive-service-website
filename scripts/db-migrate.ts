/**
 * `npm run db:migrate` — applies pending versioned migrations to DATABASE_URL
 * (default: file:./data/autocare.db). Safe to run repeatedly.
 */
import { loadEnv, ensureFileDir } from "./env";
import { createDb } from "../src/lib/db/client";
import { migrate } from "../src/lib/db/migrate";

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL ?? "file:./data/autocare.db";
  ensureFileDir(url);

  const handle = createDb(url);
  const ran = await migrate(handle);
  console.log(
    ran.length
      ? `[db:migrate] applied ${ran.join(", ")} → ${url}`
      : `[db:migrate] already up to date → ${url}`,
  );
  handle.client.close();
}

main().catch((e) => {
  console.error("[db:migrate] failed:", e);
  process.exit(1);
});
