/**
 * Scroll math for the assistant message list, kept DOM-free so it can be
 * unit-tested with plain objects.
 */

export const NEAR_BOTTOM_PX = 80;

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/** True when the user is within ~80px of the bottom of the container. */
export function isNearBottom(el: ScrollMetrics, threshold = NEAR_BOTTOM_PX): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

/**
 * The scrollTop to apply after new content arrives.
 * - A new assistant reply taller than the visible area scrolls to the
 *   reply's START (its offsetTop), so long answers aren't skipped past.
 * - Everything else scrolls to the bottom (short replies, tool cards).
 * offsetTop is relative to the scroll container (it is `position: relative`).
 */
export function pickScrollTarget(
  container: Pick<ScrollMetrics, "scrollHeight" | "clientHeight">,
  lastReply: { offsetTop: number; offsetHeight: number } | null,
  isNewAssistantReply: boolean,
): number {
  if (isNewAssistantReply && lastReply && lastReply.offsetHeight > container.clientHeight) {
    return Math.max(0, lastReply.offsetTop - 8);
  }
  return container.scrollHeight;
}
