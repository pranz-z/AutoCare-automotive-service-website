process.env.DATABASE_URL = ":memory:";

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTool } from "../src/lib/agent/tools";
import { runAgent } from "../src/lib/agent/runtime";
import { inquiryCard, appointmentCard, adminHref } from "../src/lib/agent/cards";
import { AgentCards, safeCardHref } from "../src/components/ai/AgentCards";
import { MarkdownReply } from "../src/components/ai/MarkdownReply";
import { getInquiryOr404 } from "../src/app/admin/inquiries/[id]/page";
import { getCustomerOr404 } from "../src/app/admin/customers/[id]/page";
import { getChatOr404 } from "../src/app/admin/chats/[id]/page";
import type { AgentContext, AgentModel, ModelTurn } from "../src/lib/agent/types";

const staffCtx: AgentContext = { role: "staff", actor: "staff" };
const publicCtx: AgentContext = { role: "public" };

const renderCards = (cards: Parameters<typeof AgentCards>[0]["cards"]) =>
  renderToStaticMarkup(createElement(AgentCards, { cards }));
const renderMd = (content: string) =>
  renderToStaticMarkup(createElement(MarkdownReply, { content }));

class ScriptedModel implements AgentModel {
  constructor(private script: ModelTurn[]) {}
  async generate(): Promise<ModelTurn> {
    return this.script.shift() ?? { text: "done" };
  }
}

describe("card hrefs", () => {
  test("staff inquiry card links to /admin/inquiries?open=<internal id>", async () => {
    const res = await getTool("search_inquiries")!.execute(staffCtx, { status: "new" });
    const card = res.cards![0];
    assert.match(card.href!, /^\/admin\/inquiries\?open=inq-\d+$/, card.href);
  });

  test("the same record produces no href for a public context", async () => {
    const res = await getTool("search_inquiries")!.execute(staffCtx, { status: "new" });
    const row = (res.data as { results: { id: string }[] }).results[0];
    const viaPublic = await getTool("get_booking_status")!.execute(publicCtx, {
      reference: "AC-2025-00042",
      contact: "marco.demo@autocare.test",
    });
    assert.equal(viaPublic.cards![0].href, undefined);
    // Formatter-level: same inquiry row, staff vs public flag.
    assert.ok(inquiryCard({ id: row.id, reference: "QI-1" }, true).href?.startsWith("/admin/inquiries?open="));
    assert.equal(inquiryCard({ id: row.id, reference: "QI-1" }, false).href, undefined);
  });

  test("staff get_booking_status card links the appointment", async () => {
    const res = await getTool("get_booking_status")!.execute(staffCtx, {
      reference: "AC-2025-00042",
      contact: "marco.demo@autocare.test",
    });
    assert.equal(res.cards![0].href, "/admin/appointments?open=appt-001");
  });

  test("runAgent aggregates cards but never adds hrefs for public ctx", async () => {
    const model = new ScriptedModel([
      { toolCalls: [{ name: "check_availability", args: {} }] },
      { text: "Here are the slots." },
    ]);
    const result = await runAgent({ model, ctx: publicCtx, message: "slots?", system: "sys" });
    assert.ok(result.cards.length > 0);
    for (const card of result.cards) assert.equal(card.href, undefined);
  });

  test("malicious record ids never produce a link", () => {
    for (const id of ["../../x", "javascript:alert(1)", "inq-1/../escape", "a b", ""]) {
      assert.equal(adminHref("inquiry", id, true), undefined, id);
      assert.equal(inquiryCard({ id, reference: "QI-1" }, true).href, undefined, id);
      assert.equal(appointmentCard({ id, reference: "AC-1", date: "2025-10-04", time: "10:00", status: "pending" }, true).href, undefined, id);
    }
    assert.equal(adminHref("inquiry", "inq-007", true), "/admin/inquiries?open=inq-007");
  });

  test("client-side href gate rejects non-admin paths", () => {
    for (const bad of [
      "javascript:alert(1)", "https://evil.example", "//evil.example",
      "/admin", "/admin/inquiries/../x", "/admin/other?open=x", "admin/inquiries?open=inq-1",
      "/admin/inquiries/inq-001", // legacy path form no longer valid
      "/admin/inquiries?open=", // empty id
      "/admin/inquiries?open=inq-1&x=1", // extra params
    ]) {
      assert.equal(safeCardHref(bad), undefined, bad);
    }
    assert.equal(safeCardHref("/admin/inquiries?open=inq-007"), "/admin/inquiries?open=inq-007");
    assert.equal(safeCardHref("/admin/appointments?open=appt-001"), "/admin/appointments?open=appt-001");
  });
});

describe("card link rendering", () => {
  const card = {
    title: "Ana Lim - Quote for full service",
    href: "/admin/inquiries?open=inq-001",
    fields: [{ label: "Reference", value: "QI-2025-00156" }],
  };

  test("title and reference render as links to the same admin page", () => {
    const html = renderCards([card]);
    const links = html.match(/href="\/admin\/inquiries\?open=inq-001"/g) ?? [];
    assert.equal(links.length, 2, "title + reference both link");
    assert.ok(html.includes("hover:underline"), html);
  });

  test("cards without href render no anchors", () => {
    const html = renderCards([{ ...card, href: undefined }]);
    assert.ok(!/<a /i.test(html), html);
  });

  test("a crafted href produces no anchor", () => {
    const html = renderCards([{ ...card, href: "javascript:alert(1)" }]);
    assert.ok(!/<a /i.test(html), html);
    assert.ok(html.includes("Ana Lim"), "content still renders");
  });
});

describe("admin detail pages", () => {
  test("unknown ids hit notFound() (404)", async () => {
    for (const loader of [getInquiryOr404, getCustomerOr404, getChatOr404]) {
      await assert.rejects(
        () => loader("does-not-exist"),
        (e: unknown) => String((e as Error & { digest?: string }).digest).includes("404"),
      );
    }
  });

  test("known ids load their records", async () => {
    const inquiry = await getInquiryOr404("inq-001");
    assert.match(inquiry.reference, /^QI-\d{4}-\d{5}$/);
    const customer = await getCustomerOr404("cust-001");
    assert.ok(customer.customer.name.length > 0);
    assert.ok(customer.customer.email.includes("@"));
    assert.ok(customer.vehicles.length > 0);
  });

  test("appointment detail resolves internal id and reference", async () => {
    const { getAdminAppointment } = await import("../src/lib/admin-data");
    assert.equal((await getAdminAppointment("appt-001"))?.id, "AC-2025-00042");
    assert.equal((await getAdminAppointment("AC-2025-00042"))?.id, "AC-2025-00042");
    assert.equal(await getAdminAppointment("nope"), undefined);
  });

  test("pages are server-guarded — unauthenticated call cannot render", async () => {
    const inquiryPage = (await import("../src/app/admin/inquiries/[id]/page")).default;
    // Under next/headers without a request scope the session gate throws
    // before any record loads — the page is unreachable unauthenticated
    // (in real Next runtime requireAdminSession redirects to /admin/login).
    await assert.rejects(() => inquiryPage({ params: Promise.resolve({ id: "inq-001" }) }));
  });
});

describe("model text stays plain", () => {
  test("a markdown link in model text renders as text, not an anchor", () => {
    const html = renderMd("See [the record](https://evil.example/x) for details.");
    assert.ok(!/<a /i.test(html), html);
    assert.ok(!/href=/i.test(html), html);
    assert.ok(html.includes("the record"), html);
  });
});
