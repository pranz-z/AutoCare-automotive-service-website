"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getLocations } from "@/lib/content";

export function LocationExplorer() {
  const locations = getLocations();
  const params = useSearchParams();
  const initial = params.get("province") ?? "";
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState(initial);

  const filtered = useMemo(() => {
    return locations
      .filter((area) => !province || area.province === province || area.id === province)
      .map((area) => ({
        ...area,
        cities: area.cities.filter((city) =>
          city.name.toLowerCase().includes(query.toLowerCase()),
        ),
      }))
      .filter((area) => area.cities.length > 0 || !query);
  }, [locations, province, query]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="border border-line bg-surface p-5 h-fit">
        <label className="block text-[12px] uppercase tracking-[0.14em] text-muted mb-2">Search city</label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Taguig"
          className="w-full border border-line px-3 py-2.5 text-sm bg-canvas"
        />
        <label className="block text-[12px] uppercase tracking-[0.14em] text-muted mt-4 mb-2">
          Filter province
        </label>
        <select
          value={province}
          onChange={(event) => setProvince(event.target.value)}
          className="w-full border border-line px-3 py-2.5 text-sm bg-canvas"
        >
          <option value="">All provinces</option>
          {locations.map((area) => (
            <option key={area.id} value={area.province}>
              {area.province}
            </option>
          ))}
        </select>
        <Button href="/contact" variant="dark" className="w-full mt-5">
          Request service area
        </Button>
      </aside>
      <div className="space-y-6">
        <div className="relative min-h-[14rem] bg-primary text-inverted p-6 overflow-hidden">
          <div className="tech-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Coverage map slot</p>
            <h3 className="font-heading text-3xl mt-2">Interactive-ready map surface</h3>
            <p className="mt-2 max-w-lg text-sm text-inverted/70">
              City and province data is structured for a mapping SDK. Lat/lng for HQ lives in company contact
              configuration.
            </p>
          </div>
        </div>
        {filtered.map((area) => (
          <section key={area.id} className="border border-line bg-surface p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-heading text-2xl">{area.province}</h3>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{area.region}</p>
            </div>
            <ul className="mt-4 grid sm:grid-cols-2 gap-2">
              {area.cities.map((city) => (
                <li
                  key={city.name}
                  className={`border px-3 py-3 text-sm ${city.available ? "border-line" : "border-dashed border-line text-muted"}`}
                >
                  <span className="font-medium text-ink">{city.name}</span>
                  <span className="block text-xs mt-1">
                    {city.available ? "Available" : city.note ?? "Waitlist"}
                    {city.municipalities?.length ? ` · ${city.municipalities.join(", ")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
