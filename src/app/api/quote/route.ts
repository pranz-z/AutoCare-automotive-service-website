import { site } from "@/config/company";
import { getLocations, getService, getVehicleBrand } from "@/lib/content";
import { badRequest, oneOf, optStr, readJson, reqEmail, reqPhone, reqStr, ValidationError } from "@/lib/api/validate";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { autoTriageQuote } from "@/lib/agent/triage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readJson(request);
  } catch (error) {
    return badRequest(error instanceof ValidationError ? error.message : "Invalid request.");
  }

  try {
    const serviceId = reqStr(body, "service", 100);
    if (!getService(serviceId)) throw new ValidationError("service is not a valid option.");

    const make = reqStr(body, "make", 60);
    const brand = getVehicleBrand(make);
    if (!brand) throw new ValidationError("make is not a valid option.");
    const model = reqStr(body, "model", 80);
    if (!brand.models.some((m) => m.name === model)) {
      throw new ValidationError("model is not a valid option for the selected make.");
    }
    const year = oneOf(reqStr(body, "year", 4), site.booking.years.map(String), "year");
    const variant = optStr(body, "variant", 80);
    const issue = optStr(body, "issue", 1000);

    const name = reqStr(body, "name", 160);
    const phone = reqPhone(body, "phone");
    const email = reqEmail(body, "email");

    const provinceId = reqStr(body, "province", 60);
    const province = getLocations().find((l) => l.id === provinceId);
    if (!province) throw new ValidationError("province is not a valid option.");
    const cityName = reqStr(body, "city", 80);
    if (!province.cities.some((c) => c.name === cityName)) {
      throw new ValidationError("city is not a valid option for the selected province.");
    }
    const barangay = optStr(body, "barangay", 80);
    const address = reqStr(body, "address", 240);
    const notes = optStr(body, "notes", 500);

    const repo = createRepository(await getDb());
    const quote = await repo.createQuote({
      customer: { name, email, phone },
      serviceId,
      vehicle: { make: brand.name, model, year, variant },
      issue,
      province: province.province,
      city: cityName,
      barangay,
      address,
      notes,
    });
    // Event hook: auto-triage every new quote request and store the result.
    await autoTriageQuote(quote.id, repo).catch(() => null);

    return Response.json({ ok: true, reference: quote.reference, status: quote.status });
  } catch (error) {
    if (error instanceof ValidationError) return badRequest(error.message);
    return Response.json({ ok: false, error: "The quote request could not be saved. Please try again." }, { status: 500 });
  }
}
