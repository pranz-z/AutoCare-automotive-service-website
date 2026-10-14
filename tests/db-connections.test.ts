import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDb } from "../src/lib/db/client";
import { migrate } from "../src/lib/db/migrate";
import { seedIfEmpty } from "../src/lib/db/seed";
import { createRepository } from "../src/lib/db/repository";

/**
 * Simulates two separate serverless instances: connection A writes to a
 * file-backed database, connection B (opened independently) must read it.
 */
test("data written through one connection is visible to a second connection", async () => {
  const dir = mkdtempSync(join(tmpdir(), "autocare-db-"));
  const url = `file:${join(dir, "shared.db").replace(/\\/g, "/")}`;
  try {
    const a = createDb(url);
    await migrate(a);
    await seedIfEmpty(a);

    const repoA = createRepository(a);
    const created = await repoA.createAppointment({
      customer: { name: "Conn A", email: "conna@example.com", phone: "+63 900 111 2222" },
      serviceId: "oil-change",
      branchId: "branch-bgc",
      date: "2026-12-01",
      time: "10:00",
      notes: "written via connection A",
    });

    // A second, independent client+connection on the same file — like another
    // serverless instance — sees A's committed write without any shared state.
    const b = createDb(url);
    const repoB = createRepository(b);
    const found = (await repoB.listAppointmentsDetailed()).find((x) => x.id === created.id);
    assert.ok(found, "connection B should see the appointment written by connection A");
    assert.equal(found.notes, "written via connection A");
    assert.equal(found.customerName, "Conn A");
    assert.match(found.reference, /^AC-\d{4}-\d{5}$/);

    a.client.close();
    b.client.close();
  } finally {
    // Best-effort cleanup — Windows may hold the SQLite handles briefly after
    // close(); leftover files live in the OS temp dir.
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch { /* EPERM on Windows — temp dir cleans itself */ }
  }
});

test("migrate is idempotent — running it twice applies nothing the second time", async () => {
  const handle = createDb(":memory:");
  const first = await migrate(handle);
  const second = await migrate(handle);
  assert.ok(first.length >= 1, "first run should apply migrations");
  assert.deepEqual(second, [], "second run should be a no-op");
  handle.client.close();
});
