import { describe, expect, test, vi } from "vitest";

import { scrollCurrentSectionToTop } from "./useNavigation";

describe("useNavigation helpers", () => {
  test("scrolls the current section containers back to the top", () => {
    document.body.innerHTML = `
      <div class="app-content" id="app-content"></div>
      <div class="app-content-inner" id="app-content-inner"></div>
      <div class="detail-wrapper" id="detail-wrapper"></div>
      <main class="page" id="page"></main>
    `;

    const appContent = document.getElementById("app-content");
    const appContentInner = document.getElementById("app-content-inner");
    const detailWrapper = document.getElementById("detail-wrapper");
    const page = document.getElementById("page");

    appContent.scrollTop = 480;
    appContentInner.scrollTop = 420;
    detailWrapper.scrollTop = 320;
    page.scrollTop = 180;
    document.documentElement.scrollTop = 120;
    window.scrollTo = vi.fn();

    scrollCurrentSectionToTop();

    expect(appContent.scrollTop).toBe(0);
    expect(appContentInner.scrollTop).toBe(0);
    expect(detailWrapper.scrollTop).toBe(0);
    expect(page.scrollTop).toBe(0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
});
