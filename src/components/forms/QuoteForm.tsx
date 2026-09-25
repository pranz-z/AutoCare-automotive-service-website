"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Layout";
import { getLocations, getServices, getSite, getVehicleBrands } from "@/lib/content";

type QuoteState = {
  service: string;
  make: string;
  model: string;
  year: string;
  variant: string;
  issue: string;
  name: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  barangay: string;
  address: string;
  notes: string;
};

const empty: QuoteState = {
  service: "",
  make: "",
  model: "",
  year: "",
  variant: "",
  issue: "",
  name: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  barangay: "",
  address: "",
  notes: "",
};

export function QuoteForm() {
  const site = getSite();
  const services = getServices();
  const brands = getVehicleBrands();
  const locations = getLocations();
  const [form, setForm] = useState<QuoteState>(empty);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const brand = brands.find((item) => item.id === form.make);
  const cities = locations.find((item) => item.id === form.province)?.cities ?? [];
  const set = (key: keyof QuoteState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.service || !form.make || !form.model || !form.year) {
      setError("Service and vehicle details are required.");
      return;
    }
    if (!form.name || !form.phone || !form.email) {
      setError("Contact details are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email.");
      return;
    }
    if (!form.province || !form.city || !form.address) {
      setError("Location details are required.");
      return;
    }
    setError("");
    setDone(`QT-${Date.now().toString().slice(-8)}`);
  };

  if (done) {
    return (
      <div className="border border-line bg-surface p-8">
        <p className="text-[12px] uppercase tracking-[0.2em] text-accent">Quote requested</p>
        <h3 className="font-heading text-3xl mt-2">We’ll send a written estimate.</h3>
        <p className="mt-3 text-muted">
          Reference <strong className="text-ink">{done}</strong>. {site.company.name} typically responds within one
          business window with a range and any inspection notes.
        </p>
        <Button href="/" className="mt-6">
          Return home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-line bg-surface p-5 sm:p-8 grid gap-4 sm:grid-cols-2">
      <Field
        label="Service needed"
        name="service"
        required
        as="select"
        value={form.service}
        onChange={(value) => set("service", value)}
        options={services.map((item) => ({ value: item.id, label: item.name }))}
      />
      <Field
        label="Vehicle make"
        name="make"
        required
        as="select"
        value={form.make}
        onChange={(value) => setForm((current) => ({ ...current, make: value, model: "" }))}
        options={brands.map((item) => ({ value: item.id, label: item.name }))}
      />
      <Field
        label="Vehicle model"
        name="model"
        required
        as="select"
        value={form.model}
        onChange={(value) => set("model", value)}
        options={(brand?.models ?? []).map((item) => ({ value: item.name, label: item.name }))}
      />
      <Field
        label="Vehicle year"
        name="year"
        required
        as="select"
        value={form.year}
        onChange={(value) => set("year", value)}
        options={site.booking.years.map((year) => ({ value: String(year), label: String(year) }))}
      />
      <Field label="Vehicle variant" name="variant" value={form.variant} onChange={(value) => set("variant", value)} />
      <div className="sm:col-span-2">
        <Field
          label="Vehicle issue"
          name="issue"
          as="textarea"
          value={form.issue}
          onChange={(value) => set("issue", value)}
          placeholder="Noises, lights, leaks, performance…"
        />
      </div>
      <Field label="Name" name="name" required value={form.name} onChange={(value) => set("name", value)} />
      <Field label="Contact number" name="phone" required value={form.phone} onChange={(value) => set("phone", value)} />
      <Field label="Email" name="email" type="email" required value={form.email} onChange={(value) => set("email", value)} />
      <Field
        label="Province"
        name="province"
        required
        as="select"
        value={form.province}
        onChange={(value) => setForm((current) => ({ ...current, province: value, city: "" }))}
        options={locations.map((item) => ({ value: item.id, label: item.province }))}
      />
      <Field
        label="City"
        name="city"
        required
        as="select"
        value={form.city}
        onChange={(value) => set("city", value)}
        options={cities.map((item) => ({ value: item.name, label: item.name }))}
      />
      <Field label="Barangay" name="barangay" value={form.barangay} onChange={(value) => set("barangay", value)} />
      <div className="sm:col-span-2">
        <Field label="Address" name="address" required value={form.address} onChange={(value) => set("address", value)} />
      </div>
      <div className="sm:col-span-2">
        <Field
          label="Additional notes"
          name="notes"
          as="textarea"
          value={form.notes}
          onChange={(value) => set("notes", value)}
        />
      </div>
      {error ? <p className="sm:col-span-2 text-sm text-accent">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit">Request Quote</Button>
      </div>
    </form>
  );
}
