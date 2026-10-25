"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok || !payload.ok) {
      setError(payload.message ?? "Unable to sign in.");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-primary text-inverted">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between border-r border-white/10 p-10 lg:flex">
          <div className="[&_span]:text-inverted">
            <Logo inverted />
          </div>
          <div className="max-w-xl">
            <p className="meta text-accent">Operations access</p>
            <h1 className="display mt-5 text-7xl">Service control.</h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-inverted/60">
              Appointments, customer records, conversations, approvals, and service operations in one console.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-accent" />
            <p className="meta text-inverted/35">Authorized staff only</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md border border-white/10 bg-[#0c1925] p-6 sm:p-8">
            <div className="h-1 w-12 bg-accent" />
            <p className="meta mt-5 text-accent">AutoCare</p>
            <h1 className="mt-2 font-heading text-4xl uppercase leading-none">Operations login</h1>
            <p className="mt-2 text-sm text-inverted/50">Authorized staff access only.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/55">
                Username
                <input
                  name="username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 min-h-12 w-full border border-white/15 bg-[#102231] px-3 text-sm text-inverted outline-none focus:border-accent"
                />
              </label>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-inverted/55">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 min-h-12 w-full border border-white/15 bg-[#102231] px-3 text-sm text-inverted outline-none focus:border-accent"
                />
              </label>

              {error ? (
                <p role="alert" className="border-l-2 border-red-500 pl-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="min-h-12 w-full border border-accent bg-accent px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-contrast transition-colors hover:bg-[#d68c3d] disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
