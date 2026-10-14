import { site } from "@/config/company";
import { getLocations, getService, getVehicleBrand } from "@/lib/content";
import { badRequest, oneOf, optStr, readJson, reqDate, reqEmail, reqPhone, reqStr, ValidationError } from "@/lib/api/validate";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";

export const runtime = "nodejs";

const BRANCH_BY_CITY: Record<string, string> = {
  taguig: "branch-bgc",
  makati: "branch-makati",
  "quezon city": "branch-quezon",
};
const DEFAULT_BRANCH = "branch-bgc";

function to24h(time: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time);
  if (!m) return time;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readJson(request);
  } catch (error) {
    return badRequest(error instanceof ValidationError ? error.message : "Invalid request.");
  }

  try {
    const serviceId = reqStr(body, "service", 100);
    const service = getService(serviceId);
    if (!service) throw new ValidationError("service is not a valid option.");

    const make = reqStr(body, "make", 60);
    const brand = getVehicleBrand(make);
    if (!brand) throw new ValidationError("make is not a valid option.");
    const model = reqStr(body, "model", 80);
    if (!brand.models.some((m) => m.name === model)) {
      throw new ValidationError("model is not a valid option for the selected make.");
    }
    const year = oneOf(reqStr(body, "year", 4), site.booking.years.map(String), "year");
    const transmission = oneOf(reqStr(body, "transmission", 30), site.booking.transmissions, "transmission");
    const fuelType = oneOf(reqStr(body, "fuelType", 30), site.booking.fuelTypes, "fuelType");
    const variant = optStr(body, "variant", 80);

    const provinceId = reqStr(body, "province", 60);
    const province = getLocations().find((l) => l.id === provinceId);
    if (!province) throw new ValidationError("province is not a valid option.");
    const cityName = reqStr(body, "city", 80);
    const city = province.cities.find((c) => c.name === cityName);
    if (!city) throw new ValidationError("city is not a valid option for the selected province.");
    if (!city.available) throw new ValidationError(`${cityName} is on our coverage waitlist; bookings are not yet accepted there.`);
    const barangay = optStr(body, "barangay", 80);
    const address = reqStr(body, "address", 240);
    const landmark = optStr(body, "landmark", 160);

    const date = reqDate(body, "date");
    const today = new Date().toISOString().slice(0, 10);
    const maxDate = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
    if (date < today) throw new ValidationError("date cannot be in the past.");
    if (date > maxDate) throw new ValidationError("date cannot be more than 90 days ahead.");
    const time = oneOf(reqStr(body, "time", 20), site.booking.timeSlots, "time");

    const firstName = reqStr(body, "firstName", 80);
    const lastName = reqStr(body, "lastName", 80);
    const mobile = reqPhone(body, "mobile");
    const email = reqEmail(body, "email");

    const repo = createRepository(await getDb());
    const branchId = BRANCH_BY_CITY[cityName.toLowerCase()] ?? DEFAULT_BRANCH;
    const appointment = await repo.createAppointment({
      customer: { name: `${firstName} ${lastName}`, email, phone: mobile },
      vehicle: {
        make: brand.name,
        model,
        year,
        variant,
        mileage: "",
      },
      serviceId,
      branchId,
      location: [address, barangay, cityName, province.province, landmark ? `near ${landmark}` : ""]
        .filter(Boolean)
        .join(", "),
      date,
      time: to24h(time),
      notes: `transmission=${transmission}; fuel=${fuelType}`.slice(0, 300),
    });

    return Response.json({ ok: true, reference: appointment.reference, status: appointment.status });
  } catch (error) {
    if (error instanceof ValidationError) return badRequest(error.message);
    return Response.json({ ok: false, error: "The booking could not be saved. Please try again." }, { status: 500 });
  }
}
