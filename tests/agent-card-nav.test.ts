process.env.DATABASE_URL = ":memory:";

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentCards, safeCardHref } from "../src/components/ai/AgentCards";
import { RecordDrawer, RecordNotice } from "../src/components/admin/RecordDrawer";
import type { AgentCard } from "../src/lib/agent/types";
import { getOpenAppointment } from "../src/app/admin/appointments/page";

type LinkEl = ReactElement<{ href: string; onClick?: () => void; children?: ReactNode }>;

/** Collect every element in the tree that carries an href prop (Link or a). */
function findLinks(node: ReactNode, found: LinkEl[] = []): LinkEl[] {
  if (!isValidElement(node)) return found;
  const el = node as ReactElement<{ href?: unknown; onClick?: () => void; children?: ReactNode }>;
  if (typeof el.props.href === "string") found.push(el as LinkEl);
  const kids = el.props.children;
  for (const kid of Array.isArray(kids) ? kids : [kids]) findLinks(kid, found);
  return found;
}

const card: AgentCard = {
  title: "Maria Santos - Oil Change",
  subtitle: "Confirmed",
  href: "/admin/appointments?open=appt-001",
  fields: [
    { label: "Reference", value: "AC-2025-00042" },
    { label: "Date", value: "Mar 5, 2025" },
  ],
};

describe("agent card navigation", () => {
  test("card links render as real anchors to /admin/<type>?open=<id>", () => {
    const html = renderToStaticMarkup(createElement(AgentCards, { cards: [card] }));
    assert.ok(html.includes('href="/admin/appointments?open=appt-001"'), html);
    assert.match(html, /<a[^>]+href="\/admin\/appointments\?open=appt-001"/, "title must be an anchor");
  });

  test("href accepts only /admin/{appointments,inquiries,customers,chats}?open=<id>", () => {
    for (const type of ["appointments", "inquiries", "customers", "chats"]) {
      assert.equal(safeCardHref(`/admin/${type}?open=x-1_2`), `/admin/${type}?open=x-1_2`);
    }
    for (const bad of [
      "/admin/appointments/appt-001",        // legacy path form
      "/admin/appointments?open=x&extra=1",  // extra params
      "/admin/appointments",                 // missing open
      "/admin/settings?open=x",              // unlisted section
      "https://evil.test/admin/inquiries?open=x",
      "//evil.test/admin/inquiries?open=x",
      "javascript:alert(1)",
      "/public?open=x",
    ]) {
      assert.equal(safeCardHref(bad), undefined, bad);
    }
  });

  test("clicking a card link fires onNavigate so the widget closes (navigates via href, not a popup)", () => {
    let navigations = 0;
    const tree = AgentCards({ cards: [card], onNavigate: () => navigations++ });
    const links = findLinks(tree);
    assert.equal(links.length, 2, "title link + Reference link");
    for (const link of links) {
      assert.equal(link.props.href, "/admin/appointments?open=appt-001");
      const onClick = link.props.onClick as (() => void) | undefined;
      assert.equal(typeof onClick, "function", "link must wire onNavigate");
      onClick!();
    }
    assert.equal(navigations, 2, "each card link click must close the widget");
  });

  test("cards without a valid href render no anchor at all", () => {
    const tree = AgentCards({ cards: [{ ...card, href: "javascript:alert(1)" }] });
    assert.equal(findLinks(tree).length, 0);
  });
});

describe("drawer lifecycle", () => {
  test("closing the drawer navigates to the bare list path (drops ?open)", () => {
    const html = renderToStaticMarkup(
      createElement(RecordDrawer, { title: "T", closeHref: "/admin/appointments" }, createElement("p", null, "b")),
    );
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.length >= 2, "backdrop + Close links");
    for (const h of hrefs) {
      assert.equal(h, "/admin/appointments", `close target must drop params, got ${h}`);
    }
  });

  test("changing ?open resolves a different record — page is param-driven, not state", async () => {
    const a = await getOpenAppointment("appt-001");
    const b = await getOpenAppointment("appt-002");
    assert.ok(a.appointment && b.appointment);
    assert.notEqual(a.appointment.id, b.appointment.id);
    const byRef = await getOpenAppointment(b.appointment.reference);
    assert.equal(byRef.appointment?.id, "appt-002", "references resolve too");
  });

  test("unknown ?open id renders 'Record not found' notice", async () => {
    const res = await getOpenAppointment("nope-999");
    assert.equal(res.missing, true);
    const html = renderToStaticMarkup(
      createElement(RecordNotice, { message: "Record not found.", closeHref: "/admin/appointments" }),
    );
    assert.ok(html.includes("Record not found"), html);
    assert.ok(html.includes('href="/admin/appointments"'), "dismiss clears the param");
  });
});
