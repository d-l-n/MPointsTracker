import { describe, expect, test } from "vitest";

import { getRelevantScrollContainer, getScrollChromeAction, isVerticallyScrollable } from "./useNavVisibility";

describe("useNavVisibility helpers", () => {
  test("finds the nearest relevant scroll container that actually scrolls", () => {
    document.body.innerHTML = `
      <div class="app-content" id="app-content">
        <div class="page" id="page">
          <div>
            <button id="target">Tap</button>
          </div>
        </div>
      </div>
    `;

    const target = document.getElementById("target");
    const page = document.getElementById("page");
    const appContent = document.getElementById("app-content");

    Object.defineProperty(page, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(page, "scrollHeight", { configurable: true, value: 500 });
    Object.defineProperty(appContent, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(appContent, "scrollHeight", { configurable: true, value: 620 });

    expect(getRelevantScrollContainer(target)).toBe(appContent);
  });

  test("falls back to app-content when the event target is not an element", () => {
    document.body.innerHTML = `
      <div class="app-content" id="app-content">
        <div class="page" id="page"></div>
      </div>
    `;

    const appContent = document.getElementById("app-content");

    Object.defineProperty(appContent, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(appContent, "scrollHeight", { configurable: true, value: 620 });

    expect(getRelevantScrollContainer(document)).toBe(appContent);
  });

  test("falls back to the active page scroller when app-content does not scroll", () => {
    document.body.innerHTML = `
      <div class="app-content" id="app-content">
        <div class="home-header-surface" id="header"></div>
        <div class="page" id="page"></div>
      </div>
    `;

    const appContent = document.getElementById("app-content");
    const header = document.getElementById("header");
    const page = document.getElementById("page");

    Object.defineProperty(appContent, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(appContent, "scrollHeight", { configurable: true, value: 500 });
    Object.defineProperty(page, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(page, "scrollHeight", { configurable: true, value: 680 });

    expect(getRelevantScrollContainer(header)).toBe(page);
  });

  test("treats containers without vertical overflow as non-scrollable", () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: 504 });

    expect(isVerticallyScrollable(element)).toBe(false);
  });

  test("treats containers with vertical overflow as scrollable", () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "clientHeight", { configurable: true, value: 500 });
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: 560 });

    expect(isVerticallyScrollable(element)).toBe(true);
  });

  test("hides chrome when scrolling up away from the screen edges", () => {
    expect(getScrollChromeAction({ scrollTop: 560, prevScrollTop: 620, atBottom: false })).toBe("hide");
  });

  test("hides chrome when scrolling down away from the screen edges", () => {
    expect(getScrollChromeAction({ scrollTop: 620, prevScrollTop: 560, atBottom: false })).toBe("hide");
  });

  test("keeps chrome visible at the top and bottom edges", () => {
    expect(getScrollChromeAction({ scrollTop: 8, prevScrollTop: 40, atBottom: false })).toBe("show");
    expect(getScrollChromeAction({ scrollTop: 900, prevScrollTop: 850, atBottom: true })).toBe("show");
  });

  test("ignores tiny scroll movements", () => {
    expect(getScrollChromeAction({ scrollTop: 602, prevScrollTop: 600, atBottom: false })).toBe("none");
  });
});
