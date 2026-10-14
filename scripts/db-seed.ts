/**
 * `npm run db:seed` — inserts the fictional demo dataset when the database is
 * empty. Runs migrations first (idempotent) so a fresh database works.
 * Remote/production databases require the explicit `--production` flag.
 */
import { loadEnv, ensureFileDir } from "./env";
import { createDb, isFileUrl } from "../src/lib/db/client";
import { migrate } from "../src/lib/db/migrate";
import { seedIfEmpty } from "../src/lib/db/seed";

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL ?? "file:./data/autocare.db";

  if (!isFileUrl(url) && !process.argv.includes("--production")) {
    console.error(
      `[db:seed] refusing to seed remote database ${url} without the --production flag.\n` +
        "The demo dataset is fictional — seed production only if you really mean it.",
    );
    process.exit(1);
  }

  ensureFileDir(url);
  const handle = createDb(url);
  await migrate(handle);
  const seeded = await seedIfEmpty(handle);
  console.log(
    seeded
      ? `[db:seed] demo data inserted → ${url}`
      : `[db:seed] database already contains data — nothing to do → ${url}`,
  );
  handle.client.close();
}

main().catch((e) => {
  console.error("[db:seed] failed:", e);
  process.exit(1);
});
