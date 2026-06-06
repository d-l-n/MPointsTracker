import { test as base, expect } from "@playwright/test";

const test = base.extend({
  page: async ({ page }, use) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("bgt_splash_seen", "1");
      localStorage.setItem("bgt_install_dismissed", "1");
      localStorage.removeItem("bgt_guest_mode");
      localStorage.removeItem("bgt_last_uid");
    });

    await use(page);
  },
});

test.describe("Entrypoint routing", () => {
  test('unknown routes redirect to "/" on first load', async ({ page }) => {
    await page.goto("/definitely-not-a-route");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('[data-testid="guest-btn"]')).toBeVisible();
  });

  test("dev entrypoint leaves service worker registration inert", async ({ page }) => {
    await page.context().addInitScript(() => {
      window.__swRegisterCalls = [];

      const descriptor = Object.getOwnPropertyDescriptor(
        Navigator.prototype,
        "serviceWorker",
      );
      const existingServiceWorker = descriptor?.get
        ? descriptor.get.call(navigator)
        : navigator.serviceWorker;

      const stubbedServiceWorker = {
        ...existingServiceWorker,
        register: (...args) => {
          window.__swRegisterCalls.push(args);
          return Promise.resolve({
            scope: "/",
            installing: null,
            addEventListener() {},
          });
        },
        addEventListener() {},
        controller: existingServiceWorker?.controller ?? null,
      };

      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: stubbedServiceWorker,
      });
    });

    await page.goto("/");

    await expect(page.locator('[data-testid="guest-btn"]')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.__swRegisterCalls))
      .toEqual([]);
  });
});
