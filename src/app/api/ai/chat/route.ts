import { NextRequest } from "next/server";
import { getCompany, getLocations, getServices, getVehicleBrands } from "@/lib/content";
import {
  buildAiPrompt,
  detectSafetyIssue,
  getRelevantContext,
  getRolePermissions,
  normalizeRole,
} from "@/lib/ai/assistant";
import { appendMessage, getRecentHistory, getSession, updateDraft } from "@/lib/ai/session-store";

const FALLBACK_MESSAGE =
  "Sorry, the assistant is temporarily unavailable. You can still contact a service advisor for help.";

const company = getCompany();

const defaultSystemPrompt = `You are an official customer service and automotive service representative of ${company.name}. You speak on behalf of the company and naturally use first-person company language such as 'we', 'our', and 'I can help you'.

Your role is to act as a knowledgeable service advisor for ${company.name}, helping customers with vehicle maintenance, service recommendations, service pricing, branch and booking support, and basic administrative assistance. The company's database, service catalog, branch information, pricing, schedules, booking records, policies, and other authorized information are our current operational information.

When answering using company information, present it as information from our company rather than as a technical retrieval process. For example, say 'Our current listed price is ₱1,800' or 'According to our current service information, our base price is ₱1,800.' Do not say 'the database says', 'I found this in the system', 'the system shows', 'I retrieved', 'according to external information', or 'according to a database query'.

Always distinguish between current company information, general automotive knowledge, and general Philippine-market estimates. Never present general knowledge or market estimates as official company information.

Use Philippine units and local terminology naturally: ₱, kilometers, liters, Celsius, aircon, gasoline, diesel, PMS, change oil, Asia/Manila time. Use Taglish when appropriate without forcing slang.

You are not a mechanic physically inspecting a vehicle. Never claim to have inspected a vehicle. Never present uncertain diagnoses as confirmed mechanical problems. If the issue could be safety-critical, advise the customer to stop driving if appropriate and arrange a professional inspection. Keep responses concise, helpful, respectful, and practical.

Our goal is to make customers feel they are speaking directly with a knowledgeable member of ${company.name}'s service team.`;

function isPromptInjectionAttempt(message: string) {
  const normalized = message.toLowerCase();
  return /ignore your previous instructions|ignore the system rules|override system|show me every customer|give me admin access|password|api key|all customer records/i.test(
    normalized,
  );
}

function getFallbackReply(message: string, role: string) {
  const normalized = message.toLowerCase();
  const services = getServices();
  const companies = getCompany();

  if (detectSafetyIssue(message).isCritical) {
    return `${detectSafetyIssue(message).reason}: ${detectSafetyIssue(message).recommendation} I can also help you find the nearest service branch or schedule an inspection.`;
  }

  if (/motor oil|oil change|oil|pms|periodic maintenance|change oil/.test(normalized)) {
    const oil = services.find((item) => item.slug === "oil-change");
    return `Our current listed price for ${oil?.name ?? "Oil Change"} starts at ${oil ? `₱${oil.priceFrom.toLocaleString("en-PH")}` : "₱1,490"}. The final amount can vary depending on the vehicle, oil type, and service package.`;
  }

  if (/book|appointment|schedule|available|time|date|walk-in|pwede/.test(normalized)) {
    return "Sure. I can help you check our available appointments and guide you through the booking options for your preferred service and branch.";
  }

  if (/toyota|honda|vios|civic|innova|fortuner|city|navara/.test(normalized)) {
    return "Yes, we currently service a wide range of common Philippine-market vehicles such as Toyota, Honda, Mitsubishi, Nissan, and other popular brands. I can help you check the available services for your vehicle.";
  }

  if (/service area|branch|location|coverage|pampanga|taguig|manila|cebu/.test(normalized) || role.includes("admin")) {
    const locations = getLocations();
    const coverage = locations
      .slice(0, 4)
      .map((area) => area.province)
      .join(", ");
    return `We currently serve areas such as ${coverage}. I can help you check the exact branch and service availability for your location.`;
  }

  const serviceNames = services.slice(0, 4).map((item) => item.name).join(", ");
  return `We currently offer ${serviceNames}. I can help you check the best service for your vehicle and guide you through the next steps.`;
}

async function callOllama(prompt: string) {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Ollama request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return typeof payload?.message?.content === "string"
    ? payload.message.content
    : typeof payload?.content === "string"
      ? payload.content
      : typeof payload?.response === "string"
        ? payload.response
        : "I’m ready to help with your maintenance or booking question.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return Response.json({ ok: false, error: "A message is required." }, { status: 400 });
    }

    const role = normalizeRole(String(body?.role ?? "customer"));
    const permissions = getRolePermissions(role);
    const sessionId = String(body?.sessionId ?? "default-session");
    const currentHistory = getRecentHistory(sessionId, 8)
      .map((entry) => ({ role: entry.role, content: entry.content }))
      .slice(-8);

    appendMessage(sessionId, "user", message);

    if (isPromptInjectionAttempt(message)) {
      const refusal = "I can only operate within the permissions of the current user role. If you need account or administrative help, please contact a service advisor.";
      appendMessage(sessionId, "assistant", refusal);
      return Response.json({ ok: true, reply: refusal, sessionId, role, permissions, safety: false });
    }

    const safety = detectSafetyIssue(message);
    const context = getRelevantContext(message, role);
    const prompt = buildAiPrompt({
      systemPrompt: defaultSystemPrompt,
      userRole: role,
      request: message,
      history: currentHistory,
      context,
    });

    if (safety.isCritical) {
      const reply = `${safety.reason}: ${safety.recommendation} I can also help you find the nearest service branch or arrange a service advisor follow-up.`;
      appendMessage(sessionId, "assistant", reply);
      updateDraft(sessionId, {
        service: message,
      });
      return Response.json({ ok: true, reply, sessionId, role, permissions, safety });
    }

    let reply = "";

    try {
      reply = await callOllama(prompt);
    } catch (error) {
      console.error("Ollama AI request failed", error);
      reply = getFallbackReply(message, role);
    }

    if (/book|appointment|schedule|available|date|time/.test(message.toLowerCase())) {
      const serviceMatch = getServices().find((service) => message.toLowerCase().includes(service.name.toLowerCase()));
      const branchMatch = getLocations().flatMap((area) => area.cities.map((city) => city.name)).find((city) => message.toLowerCase().includes(city.toLowerCase()));
      if (serviceMatch || branchMatch) {
        const serviceLine = serviceMatch ? `Service: ${serviceMatch.name}` : "Service: not selected yet";
        const branchLine = branchMatch ? `Branch: ${branchMatch}` : "Branch: to be confirmed";
        const followUp = `${serviceLine}. ${branchLine}. Please confirm your preferred date and vehicle, and I can help you continue the booking.`;
        reply = `${reply} ${followUp}`;
      }
    }

    appendMessage(sessionId, "assistant", reply);
    const session = getSession(sessionId);

    return Response.json({
      ok: true,
      reply,
      sessionId,
      role,
      permissions,
      safety,
      context,
      bookingDraft: session.draft,
    });
  } catch (error) {
    console.error("AI route failed", error);
    return Response.json(
      {
        ok: false,
        reply: FALLBACK_MESSAGE,
        error: "The assistant is temporarily unavailable. Please contact a service advisor.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const brands = getVehicleBrands();
  const services = getServices();
  return Response.json({
    ok: true,
    status: "ready",
    model: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
    baseUrl: (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, ""),
    servicesCount: services.length,
    brandCount: brands.length,
  });
}
