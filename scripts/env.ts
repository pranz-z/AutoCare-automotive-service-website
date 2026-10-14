import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Loads DATABASE_URL / DATABASE_AUTH_TOKEN from .env.local then .env so the
 * db:* scripts see the same configuration as `next dev`. Real environment
 * variables always win.
 */
export function loadEnv(root = process.cwd()) {
  for (const file of [".env.local", ".env"]) {
    const path = `${root}/${file}`;
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || m[1] in process.env) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

/** Creates the parent directory for file: URLs (CLI use only — never runtime). */
export function ensureFileDir(url: string) {
  if (!url.startsWith("file:")) return;
  const file = url.slice(5);
  if (!file || file.startsWith(":memory:")) return;
  mkdirSync(dirname(file), { recursive: true });
}
