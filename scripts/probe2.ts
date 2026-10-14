process.env.DATABASE_URL = ":memory:";
import { test } from "node:test";
import { getDb } from "../src/lib/db/client";
test("mem tables", async () => {
  const h = await getDb();
  const r = await h.client.execute("SELECT COUNT(*) AS n FROM branches");
  console.log("URL=", h.url, "branches=", String(r.rows[0]?.n));
});
