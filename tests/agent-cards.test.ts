process.env.DATABASE_URL = ":memory:";

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTool } from "../src/lib/agent/tools";
import { runAgent } from "../src/lib/agent/runtime";
import { AgentCards } from "../src/components/ai/AgentCards";
import { MarkdownReply } from "../src/components/ai/MarkdownReply";
import type { AgentCard, AgentContext, AgentModel, ModelTurn } from "../src/lib/agent/types";

const staffCtx: AgentContext = { role: "staff", actor: "staff" };

class ScriptedModel implements AgentModel {
  constructor(private script: ModelTurn[]) {}
  async generate(): Promise<ModelTurn> {
    return this.script.shift() ?? { text: "done" };
  }
}

const renderCards = (cards: AgentCard[]) =>
  renderToStaticMarkup(createElement(AgentCards, { cards }));
const renderMd = (content: string) =>
  renderToStaticMarkup(createElement(MarkdownReply, { content }));

describe("tool card payloads", () => {
  test("search_inquiries emits a card per result with label/value fields", async () => {
    const res = await getTool("search_inquiries")!.execute(staffCtx, { status: "new" });
    assert.equal(res.success, true);
    assert.ok(res.cards && res.cards.length > 0, "expected cards");
    const card = res.cards[0];
    const labels = card.fields.map((f) => f.label);
    for (const label of ["Reference", "Priority", "Created"]) {
      assert.ok(labels.includes(label), `missing field ${label} in ${JSON.stringify(labels)}`);
    }
    // Consistent formatting: Title Case priority, "Oct 4, 2025" dates.
    const priority = card.fields.find((f) => f.label === "Priority")!;
    assert.match(priority.value, /^[A-Z][a-z]+$/);
    const created = card.fields.find((f) => f.label === "Created")!;
    assert.match(created.value, /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  });

  test("check_availability emits one card per branch with date rows", async () => {
    const res = await getTool("check_availability")!.execute({ role: "public" }, {});
    assert.equal(res.success, true);
    assert.ok(res.cards && res.cards.length > 0);
    for (const card of res.cards) {
      assert.ok(card.fields.length > 0);
      for (const f of card.fields) assert.match(f.label, /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    }
  });

  test("get_dashboard_summary emits a summary card", async () => {
    const res = await getTool("get_dashboard_summary")!.execute(staffCtx, {});
    assert.equal(res.success, true);
    assert.equal(res.cards?.[0]?.title, "Dashboard summary");
    assert.ok(res.cards![0].fields.some((f) => f.label === "Appointments"));
  });

  test("search_appointments and search_customers emit cards", async () => {
    const appts = await getTool("search_appointments")!.execute(staffCtx, {});
    assert.ok(appts.cards && appts.cards.length > 0);
    assert.ok(appts.cards[0].fields.some((f) => f.label === "Reference"));
    const cust = await getTool("search_customers")!.execute(staffCtx, {});
    assert.ok(cust.cards && cust.cards.length > 0);
    assert.ok(cust.cards[0].fields.some((f) => f.label === "Email"));
  });

  test("runAgent aggregates cards into the result", async () => {
    const model = new ScriptedModel([
      { toolCalls: [{ name: "search_inquiries", args: { status: "new" } }] },
      { text: "Found them." },
    ]);
    const result = await runAgent({ model, ctx: staffCtx, message: "new inquiries", system: "sys" });
    assert.ok(result.cards.length > 0, "cards must reach the route payload");
    assert.equal(result.reply, "Found them.");
  });
});

describe("AgentCards rendering", () => {
  const inquiry: AgentCard = {
    title: "Ana Lim - Quote for full service",
    fields: [
      { label: "Reference", value: "QI-2025-00156" },
      { label: "Priority", value: "Medium" },
      { label: "Created", value: "Oct 4, 2025" },
    ],
  };

  test("renders name line plus one row per field", () => {
    const html = renderCards([inquiry]);
    assert.ok(html.includes("Ana Lim - Quote for full service"), html);
    for (const pair of ["Reference:</span> QI-2025-00156", "Priority:</span> Medium", "Created:</span> Oct 4, 2025"]) {
      assert.ok(html.includes(pair), `missing row ${pair} in ${html}`);
    }
    assert.ok(!html.includes("**"), "no literal asterisks");
    assert.ok(!html.includes("<li"), "cards are rows, not bullets");
  });

  test("labels are bold and muted; empty fields render nothing", () => {
    const html = renderCards([{ title: "T", fields: [{ label: "Note", value: "" }, { label: "Ref", value: "x" }] }]);
    assert.ok(html.includes('font-semibold text-muted'), html);
    assert.ok(!html.includes("Note:"), "empty field must not render");
    assert.ok(html.includes("Ref:"), html);
  });

  test("markup inside stored field values renders as inert text", () => {
    const html = renderCards([
      {
        title: 'Mallory <img src=x onerror=alert(1)>',
        fields: [{ label: "Subject", value: "**not bold** <script>alert(1)</script>" }],
      },
    ]);
    assert.ok(!/<img /i.test(html), html);
    assert.ok(!/<script/i.test(html), html);
    assert.ok(html.includes("&lt;img"), html);
    assert.ok(html.includes("**not bold**"), "field text is literal, not markdown-parsed");
  });
});

describe("MarkdownReply line breaks", () => {
  test("single newlines inside a list item become line breaks", () => {
    const html = renderMd("- Reference: QI-1\n  Priority: Medium\n- other");
    assert.ok(/<br\s*\/?>/i.test(html), html);
    assert.ok(html.includes("Priority: Medium"), html);
  });

  test("single newlines in paragraphs become line breaks", () => {
    const html = renderMd("line one\nline two");
    assert.ok(/<br\s*\/?>/i.test(html), html);
  });
});
