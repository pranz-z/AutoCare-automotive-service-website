"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Layout";
import { formatPrice, getLocations, getServices, getSite, getVehicleBrands } from "@/lib/content";

const steps = [
  "Service",
  "Vehicle",
  "Details",
  "Location",
  "Date",
  "Time",
  "Contact",
  "Review",
  "Done",
];

type FormState = {
  service: string;
  make: string;
  model: string;
  year: string;
  variant: string;
  transmission: string;
  fuelType: string;
  province: string;
  city: string;
  barangay: string;
  address: string;
  landmark: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
};

const empty: FormState = {
  service: "",
  make: "",
  model: "",
  year: "",
  variant: "",
  transmission: "",
  fuelType: "",
  province: "",
  city: "",
  barangay: "",
  address: "",
  landmark: "",
  date: "",
  time: "",
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
};

export function BookingWizard({ initialService = "" }: { initialService?: string }) {
  const site = getSite();
  const services = getServices();
  const brands = getVehicleBrands();
  const locations = getLocations();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");
  const [form, setForm] = useState<FormState>({ ...empty, service: initialService });

  const selectedService = services.find((item) => item.id === form.service);
  const selectedBrand = brands.find((item) => item.id === form.make);
  const selectedProvince = locations.find((item) => item.id === form.province);
  const selectedCity = selectedProvince?.cities.find((city) => city.name === form.city);

  const set = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const validate = () => {
    if (step === 0 && !form.service) return "Select a service to continue.";
    if (step === 1 && (!form.make || !form.model)) return "Choose a make and model.";
    if (step === 2 && (!form.year || !form.transmission || !form.fuelType))
      return "Complete year, transmission, and fuel type.";
    if (step === 3 && (!form.province || !form.city || !form.address))
      return "Province, city, and address are required.";
    if (step === 3 && selectedCity && !selectedCity.available)
      return "This city is on the waitlist. Request coverage from Contact, or pick an active city.";
    if (step === 4 && !form.date) return "Pick a preferred date.";
    if (step === 5 && !form.time) return "Pick a time window.";
    if (step === 6) {
      if (!form.firstName || !form.lastName) return "Enter your name.";
      if (!/^[0-9+\s-]{10,}$/.test(form.mobile)) return "Enter a valid mobile number.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    }
    return "";
  };

  const next = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    if (step === 7) {
      const id = `AC-${Date.now().toString().slice(-8)}`;
      setRef(id);
      setStep(8);
      return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const models = selectedBrand?.models ?? [];
  const cities = selectedProvince?.cities ?? [];
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="border border-line bg-surface p-5 sm:p-8">
        <ol className="flex gap-1 overflow-x-auto no-scrollbar mb-8">
          {steps.map((label, index) => (
            <li
              key={label}
              className={`text-[10px] uppercase tracking-[0.12em] px-2 py-1 border ${
                index === step ? "bg-primary text-inverted border-primary" : "border-line text-muted"
              }`}
            >
              {String(index + 1).padStart(2, "0")} {label}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => set("service", service.id)}
                className={`text-left border p-4 ${form.service === service.id ? "border-accent bg-canvas" : "border-line"}`}
              >
                <p className="font-heading text-lg">{service.name}</p>
                <p className="text-sm text-muted mt-1">{service.shortDescription}</p>
                <p className="text-sm mt-2">From {formatPrice(service.priceFrom)}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Make"
              name="make"
              required
              as="select"
              value={form.make}
              onChange={(value) => {
                setForm((current) => ({ ...current, make: value, model: "" }));
              }}
              options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
            />
            <Field
              label="Model"
              name="model"
              required
              as="select"
              value={form.model}
              onChange={(value) => set("model", value)}
              options={models.map((model) => ({ value: model.name, label: model.name }))}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Year"
              name="year"
              required
              as="select"
              value={form.year}
              onChange={(value) => set("year", value)}
              options={site.booking.years.map((year) => ({ value: String(year), label: String(year) }))}
            />
            <Field
              label="Variant"
              name="variant"
              value={form.variant}
              onChange={(value) => set("variant", value)}
              placeholder="e.g. 1.5 V"
            />
            <Field
              label="Transmission"
              name="transmission"
              required
              as="select"
              value={form.transmission}
              onChange={(value) => set("transmission", value)}
              options={site.booking.transmissions.map((item) => ({ value: item, label: item }))}
            />
            <Field
              label="Fuel type"
              name="fuelType"
              required
              as="select"
              value={form.fuelType}
              onChange={(value) => set("fuelType", value)}
              options={site.booking.fuelTypes.map((item) => ({ value: item, label: item }))}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Province"
              name="province"
              required
              as="select"
              value={form.province}
              onChange={(value) => setForm((current) => ({ ...current, province: value, city: "" }))}
              options={locations.map((area) => ({ value: area.id, label: area.province }))}
            />
            <Field
              label="City"
              name="city"
              required
              as="select"
              value={form.city}
              onChange={(value) => set("city", value)}
              options={cities.map((city) => ({
                value: city.name,
                label: city.available ? city.name : `${city.name} (waitlist)`,
              }))}
            />
            <Field
              label="Barangay"
              name="barangay"
              value={form.barangay}
              onChange={(value) => set("barangay", value)}
            />
            <Field
              label="Landmark"
              name="landmark"
              value={form.landmark}
              onChange={(value) => set("landmark", value)}
            />
            <div className="sm:col-span-2">
              <Field
                label="Address"
                name="address"
                required
                value={form.address}
                onChange={(value) => set("address", value)}
                placeholder="Street, building, unit"
              />
            </div>
            {selectedCity ? (
              <p className={`sm:col-span-2 text-sm ${selectedCity.available ? "text-muted" : "text-accent"}`}>
                {selectedCity.available
                  ? "Mobile and workshop slots are open in this city."
                  : selectedCity.note ?? "Coverage pending."}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <Field
            label="Preferred date"
            name="date"
            type="date"
            required
            value={form.date}
            onChange={(value) => set("date", value)}
          />
        ) : null}

        {step === 5 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {site.booking.timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => set("time", slot)}
                className={`border px-3 py-3 text-sm ${form.time === slot ? "border-accent bg-canvas" : "border-line"}`}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : null}

        {step === 6 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" required value={form.firstName} onChange={(v) => set("firstName", v)} />
            <Field label="Last name" name="lastName" required value={form.lastName} onChange={(v) => set("lastName", v)} />
            <Field label="Mobile number" name="mobile" required value={form.mobile} onChange={(v) => set("mobile", v)} placeholder="09XX XXX XXXX" />
            <Field label="Email" name="email" type="email" required value={form.email} onChange={(v) => set("email", v)} />
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-3 text-sm">
            <h3 className="font-heading text-2xl">Review booking</h3>
            <p>Service: {selectedService?.name}</p>
            <p>
              Vehicle: {selectedBrand?.name} {form.model} {form.year} {form.variant}
            </p>
            <p>
              {form.transmission} · {form.fuelType}
            </p>
            <p>
              {form.address}, {form.barangay} {form.city}, {selectedProvince?.province}
            </p>
            <p>
              {form.date} · {form.time}
            </p>
            <p>
              {form.firstName} {form.lastName} · {form.mobile} · {form.email}
            </p>
            <p className="text-muted">
              Starting price {selectedService ? formatPrice(selectedService.priceFrom) : "—"}. Final quote confirmed on site.
            </p>
          </div>
        ) : null}

        {step === 8 ? (
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-accent">Confirmed</p>
            <h3 className="font-heading text-3xl mt-2">You’re on the schedule.</h3>
            <p className="mt-3 text-muted">
              Reference <strong className="text-ink">{ref}</strong>. A coordinator from {site.company.name} will confirm
              the technician window by SMS and email.
            </p>
            <Button href="/" className="mt-6">
              Back to home
            </Button>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}

        {step < 8 ? (
          <div className="mt-8 flex justify-between gap-3">
            <Button type="button" variant="light" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
              Back
            </Button>
            <Button type="button" onClick={next}>
              {step === 7 ? "Submit booking" : "Continue"}
            </Button>
          </div>
        ) : null}
      </div>

      <aside className="border border-line bg-primary text-inverted p-6 h-fit">
        <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Summary</p>
        <p className="font-heading text-2xl mt-2">{selectedService?.name ?? "Select a service"}</p>
        <p className="text-sm text-inverted/70 mt-2">
          {selectedService
            ? `From ${formatPrice(selectedService.priceFrom)} · ${selectedService.duration}`
            : "Pricing appears once a service is chosen."}
        </p>
        <ul className="mt-6 space-y-2 text-sm text-inverted/75">
          <li>{selectedBrand ? `${selectedBrand.name} ${form.model}` : "Vehicle pending"}</li>
          <li>{form.city || "Location pending"}</li>
          <li>{form.date && form.time ? `${form.date} · ${form.time}` : "Schedule pending"}</li>
        </ul>
      </aside>
    </div>
  );
}
