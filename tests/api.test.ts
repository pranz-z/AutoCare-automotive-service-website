import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL = ":memory:";

import { POST as postBooking } from "../src/app/api/booking/route";
import { POST as postQuote } from "../src/app/api/quote/route";
import { POST as postContact } from "../src/app/api/contact/route";
import { getDb } from "../src/lib/db/client";
import { createRepository } from "../src/lib/db/repository";

let ipCounter = 0;
function req(body: unknown) {
  ipCounter += 1;
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${ipCounter}` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const bookingPayload = {
  service: "oil-change",
  make: "toyota",
  model: "Vios",
  year: "2020",
  variant: "1.3 E",
  transmission: "Automatic",
  fuelType: "Gasoline",
  province: "metro-manila",
  city: "Taguig",
  barangay: "Ususan",
  address: "1 Test St",
  landmark: "Near the park",
  date: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  time: "10:00 AM",
  firstName: "Juan",
  lastName: "Test",
  mobile: "+63 917 000 0001",
  email: "juan.test@example.com",
};

test("POST /api/booking accepts a valid booking and returns a lookup-able reference", async () => {
  const res = await postBooking(req(bookingPayload));
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.match(data.reference, /^AC-\d{4}-\d{5}$/);

  const repo = createRepository(await getDb());
  const stored = await repo.getAppointmentByReference(data.reference);
  assert.ok(stored, "booking reference must resolve to a stored appointment");
  assert.equal(stored.customerEmail, "juan.test@example.com");
});

test("POST /api/booking rejects missing required fields", async () => {
  const res = await postBooking(req({ ...bookingPayload, email: "" }));
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
});

test("POST /api/booking rejects unknown service, make, and time slot", async () => {
  for (const patch of [
    { service: "flux-capacitor" },
    { make: "delorean" },
    { time: "25:61 XM" },
  ]) {
    const res = await postBooking(req({ ...bookingPayload, ...patch }));
    assert.equal(res.status, 400, JSON.stringify(patch));
  }
});

test("POST /api/booking rejects waitlisted cities and past dates", async () => {
  const waitlist = await postBooking(req({ ...bookingPayload, province: "laguna", city: "Los Banos" }));
  assert.equal(waitlist.status, 400);

  const past = await postBooking(req({ ...bookingPayload, date: "2020-01-01" }));
  assert.equal(past.status, 400);
});

test("POST /api/booking rejects malformed or oversized bodies", async () => {
  const bad = await postBooking(req("not json"));
  assert.equal(bad.status, 400);
});

const quotePayload = {
  service: "brake-service",
  make: "honda",
  model: "City",
  year: "2022",
  variant: "RS",
  issue: "Squeaking when braking",
  name: "Maria Test",
  phone: "+63 917 000 0002",
  email: "maria.test@example.com",
  province: "metro-manila",
  city: "Makati",
  barangay: "Poblacion",
  address: "2 Test Ave",
  notes: "",
};

test("POST /api/quote accepts a valid request and returns a QT reference", async () => {
  const res = await postQuote(req(quotePayload));
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.match(data.reference, /^QT-\d{4}-\d{5}$/);
});

test("POST /api/quote rejects invalid email and unknown service", async () => {
  const badEmail = await postQuote(req({ ...quotePayload, email: "not-an-email" }));
  assert.equal(badEmail.status, 400);
  const badService = await postQuote(req({ ...quotePayload, service: "warp-drive" }));
  assert.equal(badService.status, 400);
});

test("POST /api/contact accepts a message and returns a QI reference", async () => {
  const res = await postContact(req({
    name: "Pedro Test",
    email: "pedro.test@example.com",
    phone: "+63 917 000 0003",
    topic: "service",
    message: "Do you service fleets?",
  }));
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.match(data.reference, /^QI-\d{4}-\d{5}$/);

  const repo = createRepository(await getDb());
  const stored = await repo.getInquiry(data.reference);
  assert.ok(stored, "contact submission must be stored as an inquiry");
});

test("POST /api/contact requires name, email, and message", async () => {
  const res = await postContact(req({ name: "", email: "x@example.com", message: "" }));
  assert.equal(res.status, 400);
});
