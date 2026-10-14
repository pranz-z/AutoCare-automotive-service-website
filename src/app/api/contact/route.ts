import { badRequest, oneOf, optPhone, readJson, reqEmail, reqStr, ValidationError } from "@/lib/api/validate";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { autoTriageInquiry } from "@/lib/agent/triage";

export const runtime = "nodejs";

const TOPICS = ["service", "fleet", "coverage", "other"] as const;
const TOPIC_LABEL: Record<(typeof TOPICS)[number], string> = {
  service: "Service inquiry",
  fleet: "Fleet / corporate",
  coverage: "Service area request",
  other: "Other",
};
const TOPIC_CATEGORY: Record<(typeof TOPICS)[number], string> = {
  service: "general",
  fleet: "general",
  coverage: "branch",
  other: "general",
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 8_192);
  } catch (error) {
    return badRequest(error instanceof ValidationError ? error.message : "Invalid request.");
  }

  try {
    const name = reqStr(body, "name", 160);
    const email = reqEmail(body, "email");
    const phone = optPhone(body, "phone");
    const topic = oneOf(reqStr(body, "topic", 40), TOPICS, "topic");
    const message = reqStr(body, "message", 2000);

    const repo = createRepository(getDb());
    const inquiry = await repo.createInquiry({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      subject: TOPIC_LABEL[topic as (typeof TOPICS)[number]],
      category: TOPIC_CATEGORY[topic as (typeof TOPICS)[number]],
      message,
    });
    // Event hook: auto-triage every new inquiry (urgency, suggested service,
    // draft reply) and store the result on the record.
    await autoTriageInquiry(inquiry.id, repo).catch(() => null);

    return Response.json({ ok: true, reference: inquiry.reference });
  } catch (error) {
    if (error instanceof ValidationError) return badRequest(error.message);
    return Response.json({ ok: false, error: "Your message could not be saved. Please try again." }, { status: 500 });
  }
}
