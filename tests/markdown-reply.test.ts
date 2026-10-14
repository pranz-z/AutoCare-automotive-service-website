import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownReply } from "../src/components/ai/MarkdownReply";

const render = (content: string) =>
  renderToStaticMarkup(createElement(MarkdownReply, { content }));

describe("MarkdownReply", () => {
  test("renders **bold** as markup, not literal asterisks", () => {
    const html = render("**Reference:** AC-1");
    assert.ok(html.includes("<strong"), html);
    assert.ok(html.includes("Reference"), html);
    assert.ok(html.includes("AC-1"), html);
    assert.ok(!html.includes("**"), "literal asterisks leaked");
  });

  test("raw HTML renders inert: <script> and <img onerror> produce no elements", () => {
    const html = render(
      'hello <script>alert("x")</script> world <img src=x onerror=alert(1)> bye',
    );
    // No real elements are created — the markup is escaped into visible text.
    assert.ok(!/<script/i.test(html), html);
    assert.ok(!/<img /i.test(html), html);
    assert.ok(html.includes("&lt;script&gt;"), "script should appear as inert text");
    assert.ok(html.includes("&lt;img"), "img should appear as inert text");
    // Surrounding plain text survives.
    assert.ok(html.includes("hello"), html);
    assert.ok(html.includes("bye"), html);
  });

  test("lists and inline code render compactly; links are text-only", () => {
    const html = render("Steps:\n- one\n- two\n\nSee [pricing](https://evil.example) or `AC-1`.");
    assert.ok(html.includes("<ul"), html);
    assert.ok(html.includes("<li"), html);
    assert.ok(html.includes("<code"), html);
    assert.ok(!/<a /i.test(html), "links must not produce anchors");
    assert.ok(!/href=/i.test(html), html);
    assert.ok(html.includes("pricing"), "link text should survive");
  });

  test("headings degrade to bold paragraphs", () => {
    const html = render("# Big Title\n\nBody text");
    assert.ok(!/<h[1-6]/i.test(html), html);
    assert.ok(html.includes("font-semibold"), html);
    assert.ok(html.includes("Big Title"), html);
  });

  test("images degrade to alt text", () => {
    const html = render("![car photo](https://x.example/a.png)");
    assert.ok(!/<img/i.test(html), html);
    assert.ok(html.includes("car photo"), html);
  });
});
