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
    <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
      <aside className="h-fit border border-line bg-surface p-5 lg:sticky lg:top-24">
        <p className="meta text-accent">Filter coverage</p>
        <label className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Search city
        </label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Taguig"
          className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm"
        />
        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Filter province
        </label>
        <select
          value={province}
          onChange={(event) => setProvince(event.target.value)}
          className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm"
        >
          <option value="">All provinces</option>
          {locations.map((area) => (
            <option key={area.id} value={area.province}>
              {area.province}
            </option>
          ))}
        </select>
        <Button href="/contact" variant="dark" className="mt-5 w-full">
          Request service area
        </Button>
      </aside>

      <div className="space-y-6">
        <div className="relative min-h-[16rem] overflow-hidden border border-line bg-primary p-6 text-inverted">
          <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
          <p className="meta text-accent">Coverage map slot</p>
          <h3 className="mt-3 max-w-xl font-heading text-4xl uppercase leading-none">
            Interactive-ready map surface
          </h3>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-inverted/65">
            City and province data is structured for a mapping SDK. Lat/lng for HQ lives in company contact
            configuration.
          </p>
        </div>

        <div className="border-b border-line">
          {filtered.map((area) => (
            <section key={area.id} className="border-t border-line py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-heading text-3xl leading-none">{area.province}</h3>
                <p className="meta text-muted">{area.region}</p>
              </div>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {area.cities.map((city) => (
                  <li
                    key={city.name}
                    className={`border px-3 py-3 text-sm ${
                      city.available ? "border-line" : "border-dashed border-line text-muted"
                    }`}
                  >
                    <span className="font-medium text-ink">{city.name}</span>
                    <span className="mt-1 block text-xs text-muted">
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
    </div>
  );
}
