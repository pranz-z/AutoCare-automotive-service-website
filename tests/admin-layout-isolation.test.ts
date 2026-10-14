import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

const appDir = path.join(import.meta.dirname, "..", "src", "app");
const siteDir = path.join(appDir, "(site)");

const PUBLIC_CHROME = ["Navbar", "Footer", "MobileCta", "AutoCareAssistant"];

describe("admin route isolation from public chrome", () => {
  test("root layout is chrome-free: no Navbar/Footer/MobileCta/AutoCareAssistant", () => {
    const src = readFileSync(path.join(appDir, "layout.tsx"), "utf8");
    for (const name of PUBLIC_CHROME) {
      assert.ok(!new RegExp(`\\b${name}\\b`).test(src), `root layout must not render ${name}`);
    }
    assert.ok(!src.includes("<header"), "root layout must not render a banner landmark");
    assert.ok(!src.includes("<nav"), "root layout must not render a nav landmark");
    assert.ok(!src.includes("<footer"), "root layout must not render a footer landmark");
  });

  test("(site) layout owns the public chrome", () => {
    const siteLayout = path.join(siteDir, "layout.tsx");
    assert.ok(existsSync(siteLayout), "src/app/(site)/layout.tsx must exist");
    const src = readFileSync(siteLayout, "utf8");
    for (const name of PUBLIC_CHROME) {
      assert.ok(new RegExp(`\\b${name}\\b`).test(src), `(site) layout should render ${name}`);
    }
  });

  test("every public page lives under (site); admin and api do not", () => {
    const siteEntries = readdirSync(siteDir);
    assert.ok(siteEntries.includes("page.tsx"), "home page must live in (site)");
    for (const dir of ["about", "book", "contact", "locations", "privacy", "quote", "resources", "services", "terms", "vehicles"]) {
      assert.ok(siteEntries.includes(dir), `public route ${dir} must live in (site)`);
      assert.ok(!existsSync(path.join(appDir, dir)), `stale ${dir} must not remain at app root`);
    }
    assert.ok(!existsSync(path.join(appDir, "page.tsx")), "stale root page.tsx must not remain");
    assert.ok(existsSync(path.join(appDir, "admin")), "admin must stay at app root");
    assert.ok(!existsSync(path.join(siteDir, "admin")), "admin must never nest inside (site)");
    assert.ok(existsSync(path.join(appDir, "admin", "login", "page.tsx")), "admin login page must exist");
  });

  test("admin layout mounts only the staff assistant — no public chrome", () => {
    const src = readFileSync(path.join(appDir, "admin", "layout.tsx"), "utf8");
    for (const name of ["Navbar", "Footer", "MobileCta"]) {
      assert.ok(!new RegExp(`\\b${name}\\b`).test(src), `admin layout must not render ${name}`);
    }
    assert.ok(!src.includes('from "@/components/layout'), "admin layout must not import site chrome");
    assert.ok(src.includes('mode="admin"'), "admin layout must mount the staff-mode assistant");
  });

  test("public assistant still self-hides on /admin paths (defense in depth)", () => {
    const src = readFileSync(
      path.join(import.meta.dirname, "..", "src", "components", "ai", "AutoCareAssistant.tsx"),
      "utf8",
    );
    assert.match(src, /mode !== "admin" && pathname\.startsWith\("\/admin"\)/, "public widget must bail out on /admin");
  });
});
