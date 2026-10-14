/**
 * Server startup checks. `register()` runs once per Next.js server instance —
 * on Vercel that means every cold start. It throws on misconfiguration so a
 * production deploy fails loudly instead of silently using fallbacks.
 * Skipped entirely during `next build` (NEXT_PHASE === "phase-production-build").
 */
export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("libsql:") && !url.startsWith("https:")) {
    throw new Error(
      "[startup] DATABASE_URL is missing or not a remote libsql:// / https:// URL. " +
        "Set it to your Turso database URL — production must not use :memory: or file: storage.",
    );
  }

  if (
    !process.env.ADMIN_CREDENTIAL_ADMIN &&
    !process.env.ADMIN_CREDENTIAL_MANAGER &&
    !process.env.ADMIN_CREDENTIAL_STAFF
  ) {
    console.error(
      "[startup] No ADMIN_CREDENTIAL_* env vars configured — admin login is disabled " +
        "until at least one is set.",
    );
  }
}
