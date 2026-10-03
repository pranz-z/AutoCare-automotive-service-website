import test from "node:test";
import assert from "node:assert/strict";
import { getServices } from "../src/lib/content";
import {
  buildServiceGuidePrompt,
  createServiceGuideResponse,
  GuideInputError,
  GuideModelError,
  MAX_ISSUE_LENGTH,
  MAX_GUIDE_REQUESTS_PER_WINDOW,
  parseServiceGuideResponse,
  resetGuideRateLimits,
  takeGuideRateLimit,
  validateGuideInput,
} from "../src/lib/ai/service-guide";

const catalog = getServices();

test("rejects invalid input and accepts issue text up to the maximum length", () => {
  assert.throws(() => validateGuideInput(null), GuideInputError);
  assert.throws(() => validateGuideInput({ issue: "  " }), GuideInputError);
  assert.throws(() => validateGuideInput({ issue: "x", name: "private data" }), GuideInputError);
  assert.throws(() => validateGuideInput({ issue: "x".repeat(MAX_ISSUE_LENGTH + 1) }), GuideInputError);
  assert.equal(validateGuideInput({ issue: "x".repeat(MAX_ISSUE_LENGTH) }).issue.length, MAX_ISSUE_LENGTH);
});

test("returns deterministic safety guidance without calling Gemini", async () => {
  let called = false;
  const result = await createServiceGuideResponse(
    { issue: "The brakes suddenly feel soft" },
    catalog,
    async () => { called = true; return "{}"; },
  );
  assert.equal(result.status, "safety");
  assert.equal(result.services.length, 0);
  assert.match(result.explanation, /unsafe to drive/i);
  assert.equal(called, false);
});

test("limits guide requests per client key", () => {
  resetGuideRateLimits();
  for (let i = 0; i < MAX_GUIDE_REQUESTS_PER_WINDOW; i += 1) assert.equal(takeGuideRateLimit("client", 1000), true);
  assert.equal(takeGuideRateLimit("client", 1000), false);
  assert.equal(takeGuideRateLimit("client", 61_001), true);
  resetGuideRateLimits();
});

test("passes only relevant catalog entries and no contact data to Gemini", async () => {
  let prompt = "";
  const result = await createServiceGuideResponse(
    { issue: "brake squeaking", make: "Toyota", model: "Corolla", year: "2020" },
    catalog,
    async (value) => {
      prompt = value;
      return JSON.stringify({ explanation: "A brake inspection may help.", followUpQuestion: "", serviceIds: ["brake-service"] });
    },
  );
  assert.equal(result.services[0]?.id, "brake-service");
  assert.match(prompt, /Toyota/);
  assert.match(prompt, /brake-service/);
  assert.doesNotMatch(prompt, /priceFrom|1490|phone|email|address|VIN|license plate/i);
  assert.ok(JSON.parse(prompt.split("Allowed catalog: ")[1]).length < catalog.length);
});

test("returns a follow-up when the model requests more detail", () => {
  const result = parseServiceGuideResponse(
    JSON.stringify({ explanation: "I need one more detail.", followUpQuestion: "When does the noise happen?", serviceIds: [] }),
    catalog,
  );
  assert.equal(result.status, "follow-up");
  assert.equal(result.services.length, 0);
});

test("rejects malformed model output and unknown service IDs", () => {
  assert.throws(() => parseServiceGuideResponse("not json", catalog), GuideModelError);
  assert.throws(() => parseServiceGuideResponse(JSON.stringify({ explanation: "Try this", followUpQuestion: "", serviceIds: ["made-up-service"] }), catalog), GuideModelError);
  assert.throws(() => parseServiceGuideResponse(JSON.stringify({ explanation: "Try this", followUpQuestion: "", serviceIds: ["brake-service", "battery-service", "oil-change"] }), catalog), GuideModelError);
});

test("Gemini failures reject cleanly for the API fallback", async () => {
  await assert.rejects(
    createServiceGuideResponse({ issue: "A squeak while braking" }, catalog, async () => { throw new Error("429 rate limit"); }),
    /429 rate limit/,
  );
});

test("limits model response fields and length and rejects unsupported claims", () => {
  assert.throws(() => parseServiceGuideResponse(JSON.stringify({ explanation: "x".repeat(401), followUpQuestion: "", serviceIds: [] }), catalog), GuideModelError);
  assert.throws(() => parseServiceGuideResponse(JSON.stringify({ explanation: "x", followUpQuestion: "", serviceIds: [], price: 500 }), catalog), GuideModelError);
  assert.throws(() => parseServiceGuideResponse(JSON.stringify({ explanation: "Book now for PHP 1,000", followUpQuestion: "", serviceIds: ["brake-service"] }), catalog), GuideModelError);
  assert.throws(() => parseServiceGuideResponse(JSON.stringify({ explanation: "More detail needed", followUpQuestion: "When does it happen?", serviceIds: ["brake-service"] }), catalog), GuideModelError);
});

test("builds a follow-up prompt with only allowed service summaries", () => {
  const prompt = buildServiceGuidePrompt({ issue: "noise" }, catalog.slice(0, 1));
  assert.match(prompt, /Allowed catalog/);
  assert.doesNotMatch(prompt, /priceFrom|features|faqs/);
});
