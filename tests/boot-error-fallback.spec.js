import { test, expect } from "@playwright/test";

test.describe("Boot error fallback", () => {
  test("shows the error card when the main module is served with a wrong MIME type", async ({ page }) => {
    // Reproduce the exact failure: /src/main.tsx answered as application/octet-stream
    await page.route("**/src/main.tsx*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: "",
      }),
    );

    await page.goto("/");

    const card = page.getByTestId("boot-error-card");
    await expect(card).toBeVisible();
    await expect(card.getByText("No se pudo cargar la app")).toBeVisible();
    await expect(card.getByRole("button", { name: "Reintentar", exact: true })).toBeVisible();
    await expect(
      card.getByRole("button", { name: "Limpiar caché y reintentar" }),
    ).toBeVisible();
  });

  test("shows the error card when the main module 404s", async ({ page }) => {
    await page.route("**/src/main.tsx*", (route) =>
      route.fulfill({
        status: 404,
        contentType: "text/html",
        body: "<h1>Not found</h1>",
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("boot-error-card")).toBeVisible();
  });

  test("does not show the error card on a normal load", async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("bgt_splash_seen", "1");
      localStorage.setItem("bgt_install_dismissed", "1");
      localStorage.removeItem("bgt_guest_mode");
      localStorage.removeItem("bgt_last_uid");
    });

    await page.goto("/");

    // The app boots normally (guest entry is visible)...
    await expect(page.locator('[data-testid="guest-btn"]')).toBeVisible();
    // ...and the boot error card never appears.
    await expect(page.getByTestId("boot-error-card")).toHaveCount(0);
  });
});
