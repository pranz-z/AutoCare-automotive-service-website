import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isNearBottom, NEAR_BOTTOM_PX, pickScrollTarget } from "../src/components/ai/scroll-utils";

const container = (scrollTop: number, scrollHeight: number, clientHeight = 200) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

describe("assistant scroll math", () => {
  test("isNearBottom only inside the threshold", () => {
    const el = container(300, 500, 200); // distance to bottom = 0
    assert.equal(isNearBottom(el), true);
    assert.equal(isNearBottom({ ...el, scrollTop: 300 - NEAR_BOTTOM_PX }), true); // exactly at threshold
    assert.equal(isNearBottom({ ...el, scrollTop: 300 - NEAR_BOTTOM_PX - 1 }), false);
    assert.equal(isNearBottom(container(0, 500, 200)), false);
  });

  test("short new content scrolls to the bottom", () => {
    const el = container(0, 1000, 200);
    const reply = { offsetTop: 920, offsetHeight: 80 };
    assert.equal(pickScrollTarget(el, reply, true), 1000);
  });

  test("a tall new reply scrolls to its start, not past it", () => {
    const el = container(0, 2000, 200);
    const reply = { offsetTop: 1600, offsetHeight: 400 }; // taller than clientHeight
    const target = pickScrollTarget(el, reply, true);
    assert.equal(target, 1600 - 8);
    assert.ok(target < el.scrollHeight - el.clientHeight, "must not skip to bottom");
  });

  test("a tall OLD reply does not re-align on tool/pending updates", () => {
    const el = container(0, 2000, 200);
    const reply = { offsetTop: 1600, offsetHeight: 400 };
    // isNewAssistantReply=false → card updates go to the bottom, not reply top.
    assert.equal(pickScrollTarget(el, reply, false), 2000);
  });
});

describe("scroll intent sequence (component contract)", () => {
  /**
   * Models the component logic with fake metrics: intent is marked at append
   * time (pre-render), then the effect applies the target post-render only if
   * the user was near the bottom.
   */
  function makeList(clientHeight = 200) {
    return {
      scrollTop: 0,
      clientHeight,
      scrollHeight: clientHeight, // starts empty/short
      wasNear: true,
      replies: [] as { offsetTop: number; offsetHeight: number }[],
      markIntent() {
        this.wasNear = isNearBottom(this);
      },
      /** Append content of `height`; then run the post-render effect. */
      push(height: number, isNewReply = false) {
        this.markIntent();
        const reply = { offsetTop: this.scrollHeight, offsetHeight: height };
        this.scrollHeight += height + 16; // + margin
        this.replies.push(reply);
        if (this.wasNear) {
          this.scrollTop = pickScrollTarget(this, reply, isNewReply);
        }
      },
    };
  }

  test("user who scrolled up is left alone when a reply arrives", () => {
    const list = makeList();
    list.push(60, true); // send + reply
    list.push(60, true);
    list.push(60, true); // 3 messages — at bottom
    assert.equal(list.scrollTop, list.scrollHeight);
    // User scrolls up to read.
    list.scrollTop = 0;
    list.push(80, true); // new reply lands while scrolled up
    assert.equal(list.scrollTop, 0, "position must not move");
    // And stays put through tool-step-style updates (isNewReply=false).
    list.push(40);
    assert.equal(list.scrollTop, 0);
  });

  test("user at the bottom follows new replies", () => {
    const list = makeList();
    list.push(60, true);
    list.push(60, true);
    assert.equal(list.scrollTop, list.scrollHeight);
    list.push(60, true);
    assert.equal(list.scrollTop, list.scrollHeight);
  });

  test("long reply pins to its start when user is at bottom", () => {
    const list = makeList();
    list.push(60, true);
    list.push(500, true); // reply taller than the 200px viewport
    const reply = list.replies.at(-1)!;
    assert.equal(list.scrollTop, reply.offsetTop - 8); // aligned to the reply's start
    assert.ok(list.scrollTop < list.scrollHeight - list.clientHeight, "must not skip to the bottom");
  });
});
