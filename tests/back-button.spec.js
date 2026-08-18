import { test, expect } from "./fixtures.js";
import { fillPlayers, openGame } from "./helpers.js";

async function pressSystemBack(page) {
  await page.evaluate(() => {
    window.history.back();
  });
}

async function expectHomeShell(page) {
  await expect(page.locator('[data-testid="nav-pill-home"].active')).toBeVisible();
  await expect(page.locator('[data-testid="home-sticky-header"]')).toBeVisible();
  await expect(page.locator('[data-testid="tab-new"]')).toHaveCount(0);
}

test.describe("Back button flows", () => {
  test("back returns from rules, champions, and settings to the home section", async ({ page }) => {
    await page.locator('[data-testid="nav-pill-rules"]').click();
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    await pressSystemBack(page);
    await expectHomeShell(page);

    await page.locator('[data-testid="nav-pill-champs"]').click();
    await expect(page.locator('[data-testid="nav-pill-champs"].active')).toBeVisible();

    await pressSystemBack(page);
    await expectHomeShell(page);

    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    await expect(page.locator('[data-testid="settings-row-prefs"]')).toBeVisible();

    await pressSystemBack(page);
    await expectHomeShell(page);
  });

  test("back steps through nested settings pages one level at a time", async ({ page }) => {
    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="settings-row-prefs"]')).toBeVisible();

    await page.locator('[data-testid="settings-row-prefs"]').click();
    await expect(page.locator('[data-testid="reduce-effects-row"]')).toBeVisible();

    await page.getByRole("button", { name: /tema de la app|app theme/i }).click();
    await expect(page.getByRole("button", { name: /claro|light/i })).toBeVisible();

    await pressSystemBack(page);
    await expect(page.locator('[data-testid="reduce-effects-row"]')).toBeVisible();

    await page.getByRole("button", { name: /avanzado|advanced/i }).click();
    await expect(page.getByRole("button", { name: /exportar datos|export data/i })).toBeVisible();

    await pressSystemBack(page);
    await expect(page.locator('[data-testid="reduce-effects-row"]')).toBeVisible();

    await pressSystemBack(page);
    await expect(page.locator('[data-testid="settings-row-prefs"]')).toBeVisible();
    await expect(page.locator('[data-testid="reduce-effects-row"]')).toHaveCount(0);
  });

  test("back closes the history subpage and returns to the home shell", async ({ page }) => {
    await page.goto("/history?source=home&gameId=all&lock=0");
    await expect(page.locator('[data-testid="history-subpage-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();

    await pressSystemBack(page);
    await expectHomeShell(page);
    await expect(page.locator('[data-testid="history-subpage-header"]')).toHaveCount(0);
  });

  test("back inside a drafted game closes nav-leave first and then offers continue save or discard", async ({ page }) => {
    await openGame(page, "random", "portion_counter");
    await fillPlayers(page, ["Ana", "Beto"]);
    await page.locator('[data-testid="portion-food-pizza"]').click();
    await page.locator('[data-testid="portion-start-match"]').click();
    await expect(page.locator('[data-testid="portion-center-emoji"]')).toBeVisible();

    const navLeaveOverlay = page.locator(".nav-leave-overlay");
    const navLeaveTitle = navLeaveOverlay.locator(".nav-leave-title").filter({ hasText: /qué hacemos con la partida|what about the match/i });
    const navLeaveKeep = navLeaveOverlay.locator(".nav-leave-keep");
    const navLeaveDiscard = navLeaveOverlay.locator(".nav-leave-discard");
    const draftTitle = navLeaveTitle;
    const draftKeep = navLeaveKeep;
    const draftSave = navLeaveOverlay.locator(".nav-leave-save");
    const draftDiscard = navLeaveDiscard;

    await page.locator('[data-testid="nav-pill-rules"]').click();
    await expect(navLeaveTitle).toBeVisible();
    await expect(navLeaveKeep).toBeVisible();
    await expect(navLeaveDiscard).toBeVisible();

    await pressSystemBack(page);
    await expect(navLeaveTitle).toHaveCount(0);
    await expect(navLeaveKeep).toHaveCount(0);
    await expect(page.locator('[data-testid="portion-center-emoji"]')).toBeVisible();

    await pressSystemBack(page);
    await expect(draftTitle).toBeVisible();
    await expect(draftKeep).toBeVisible();
    await expect(draftSave).toBeVisible();
    await expect(draftDiscard).toBeVisible();

    await draftKeep.click();
    await expect(page.locator('[data-testid="portion-center-emoji"]')).toBeVisible();

    await pressSystemBack(page);
    await draftSave.click();

    await expectHomeShell(page);
    await expect
      .poll(() => page.evaluate(() => {
        const drafts = JSON.parse(localStorage.getItem("bgt_drafts") || "{}");
        return Boolean(drafts.portion_counter);
      }))
      .toBe(true);

    await openGame(page, "random", "portion_counter");
    await expect(page.locator('[data-testid="portion-center-emoji"]')).toBeVisible();

    await pressSystemBack(page);
    await draftDiscard.click();

    await expectHomeShell(page);
    await expect(page.locator('[data-testid="tab-new"]')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => {
        const drafts = JSON.parse(localStorage.getItem("bgt_drafts") || "{}");
        return Boolean(drafts.portion_counter);
      }))
      .toBe(false);
  });
});
