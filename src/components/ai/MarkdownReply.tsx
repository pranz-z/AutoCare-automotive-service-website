"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { Components } from "react-markdown";

/**
 * Safe markdown for assistant replies. No rehype-raw and no
 * dangerouslySetInnerHTML: raw HTML in model output (including text that
 * flowed in from stored inquiries) is dropped, never executed.
 *
 * Allowed: paragraphs, bold, italic, lists, inline code. Links render as
 * plain text (source links come from the server's `sources` field) and
 * images degrade to their alt text. h1-h6 become bold paragraphs.
 */

const BoldPara: Components["h1"] = ({ children }) => (
  <p className="mb-1.5 font-semibold last:mb-0">{children}</p>
);

const components: Components = {
  h1: BoldPara,
  h2: BoldPara,
  h3: BoldPara,
  h4: BoldPara,
  h5: BoldPara,
  h6: BoldPara,
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul className="mb-1.5 list-disc pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1.5 list-decimal pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-black/10 px-1 py-0.5 text-[0.85em]">{children}</code>
  ),
  // Links disabled: keep the readable text only.
  a: ({ children }) => <>{children}</>,
  // Images disabled: show alt text as a muted placeholder, or nothing.
  img: ({ alt }) => (alt ? <span className="text-muted">[{alt}]</span> : null),
};

const ALLOWED = [
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "code",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "img",
];

export function MarkdownReply({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      {/* remarkBreaks: single newlines become <br> — a field per line stays on
          its own line even inside list items. */}
      <ReactMarkdown remarkPlugins={[remarkBreaks]} allowedElements={ALLOWED} unwrapDisallowed components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
