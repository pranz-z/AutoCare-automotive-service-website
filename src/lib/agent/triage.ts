import { getService, getServices } from "@/lib/content";
import { getDb } from "@/lib/db/client";
import { createRepository, type Repository } from "@/lib/db/repository";

/**
 * Deterministic auto-triage for new inquiries and quote requests. Runs
 * server-side on submission (no model call needed) so it works with or
 * without a Gemini key and is fully unit-testable. The same analysis backs
 * the admin `triage_inquiry` tool.
 */

export type TriageUrgency = "urgent" | "high" | "medium" | "low";

export interface TriageResult {
  urgency: TriageUrgency;
  suggestedServiceId: string | null;
  suggestedServiceName: string | null;
  draftReply: string;
  rationale: string;
  triagedAt: string;
}

const URGENT_PATTERNS = /(won'?t start|no start|smoke|fire|overheat|accident|collision|brake(s)? (fail|not working|gone)|can'?t stop|steering (fail|stuck)|flooded|submerged|stranded|unsafe to drive|burning smell|flames)/i;
const HIGH_PATTERNS = /(brake|squeak|grind|vibrat|pull|leak|overheating|battery|dead|flat tire|blowout|stall|misfire|check engine|warning light|aircon|air con|not cooling|hot air)/i;
const LOW_PATTERNS = /(quote|price|cost|how much|schedule|booking|inquiry|question|warranty|maintenance|pms|wash|detail|estimate)/i;

const SYMPTOM_SERVICE: [RegExp, string][] = [
  [/brake|squeak|grind|stop|pedal|rotor/i, "brake-service"],
  [/oil|pms|maintenance|tune/i, "preventive-maintenance"],
  [/battery|won'?t start|dead|jumpstart/i, "battery-service"],
  [/aircon|air con|cooling|hot air|a\/c/i, "air-conditioning"],
  [/tire|tyre|flat|alignment|wheel|wobble/i, "tire-wheel-service"],
  [/check engine|scan|diagnos|warning light|computer|error code/i, "car-diagnostics"],
  [/buy|purchase|inspect|second.?hand|used car/i, "pre-purchase-inspection"],
  [/oil change|change oil|lubricant/i, "oil-change"],
];

export function suggestService(text: string): { id: string; name: string } | null {
  for (const [pattern, serviceId] of SYMPTOM_SERVICE) {
    if (pattern.test(text)) {
      const svc = getService(serviceId);
      if (svc) return { id: svc.id, name: svc.name };
    }
  }
  // Fall back to catalog keyword overlap.
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  for (const svc of getServices()) {
    const hay = `${svc.name} ${svc.category} ${svc.shortDescription} ${svc.description}`.toLowerCase();
    if (words.some((w) => hay.includes(w))) return { id: svc.id, name: svc.name };
  }
  return null;
}

export function classifyUrgency(text: string): { urgency: TriageUrgency; rationale: string } {
  if (URGENT_PATTERNS.test(text)) {
    return { urgency: "urgent", rationale: "Safety-critical keywords detected (no-start, smoke, brake failure, accident)." };
  }
  if (HIGH_PATTERNS.test(text)) {
    return { urgency: "high", rationale: "Active drivability or comfort symptoms detected." };
  }
  if (LOW_PATTERNS.test(text)) {
    return { urgency: "low", rationale: "Informational or scheduling request." };
  }
  return { urgency: "medium", rationale: "No urgency signals; default priority." };
}

export function draftReplyFor(input: {
  customerName: string;
  subject: string;
  serviceName: string | null;
  urgency: TriageUrgency;
}): string {
  const firstName = input.customerName.trim().split(" ")[0] || "there";
  const serviceLine = input.serviceName
    ? `Based on your message, our ${input.serviceName} looks like the right starting point — it starts at published catalog pricing and our team will confirm the exact scope after inspection.`
    : "Our service team will review your message and recommend the right service.";
  const urgencyLine =
    input.urgency === "urgent"
      ? "Because this sounds safety-related, please avoid driving the vehicle until we can inspect it — call your nearest branch and we will prioritize you."
      : "You can reply here or book a slot online and we will confirm your schedule.";
  return `Hi ${firstName}, thanks for reaching out about "${input.subject}". ${serviceLine} ${urgencyLine} — AutoCare Team`;
}

export function triageSubmission(input: {
  customerName: string;
  subject: string;
  message: string;
  vehicle?: string;
}): TriageResult {
  const text = `${input.subject} ${input.message} ${input.vehicle ?? ""}`;
  const { urgency, rationale } = classifyUrgency(text);
  const service = suggestService(text);
  return {
    urgency,
    suggestedServiceId: service?.id ?? null,
    suggestedServiceName: service?.name ?? null,
    draftReply: draftReplyFor({
      customerName: input.customerName,
      subject: input.subject,
      serviceName: service?.name ?? null,
      urgency,
    }),
    rationale,
    triagedAt: new Date().toISOString(),
  };
}

/** Event hook: triage a freshly created inquiry and store the result on it. */
export async function autoTriageInquiry(inquiryId: string, repo?: Repository) {
  const r = repo ?? createRepository(getDb());
  const rows = await r.listInquiriesDetailed();
  const inquiry = rows.find((i) => i.id === inquiryId);
  if (!inquiry) return null;
  const triage = triageSubmission({
    customerName: inquiry.customerName,
    subject: inquiry.subject,
    message: inquiry.message,
    vehicle: inquiry.vehicle,
  });
  await r.setInquiryTriage(inquiry.id, JSON.stringify(triage));
  await r.updateInquiryPriority(inquiry.id, triage.urgency);
  try {
    await r.logAgentAction({
      sessionId: undefined,
      actorType: "system:auto-triage",
      toolName: "auto_triage_inquiry",
      input: { inquiryId: inquiry.id, reference: inquiry.reference },
      output: triage,
      success: true,
    });
  } catch { /* audit is best-effort */ }
  return triage;
}

/** Event hook: triage a freshly created quote request and store the result. */
export async function autoTriageQuote(quoteId: string, repo?: Repository) {
  const r = repo ?? createRepository(getDb());
  const quotes = await r.listQuotes();
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) return null;
  const service = getService(quote.serviceId);
  const triage = triageSubmission({
    customerName: quote.name,
    subject: `Quote request: ${service?.name ?? quote.serviceId}`,
    message: quote.issue || `${quote.make} ${quote.model} ${quote.year}`.trim() || "General quote",
    vehicle: `${quote.make} ${quote.model} ${quote.year}`.trim(),
  });
  await r.setQuoteTriage(quote.id, JSON.stringify(triage));
  try {
    await r.logAgentAction({
      actorType: "system:auto-triage",
      toolName: "auto_triage_quote",
      input: { quoteId: quote.id, reference: quote.reference },
      output: triage,
      success: true,
    });
  } catch { /* audit is best-effort */ }
  return triage;
}
