import { test, expect } from "./fixtures.js";
import { fillPlayers, openGame } from "./helpers.js";

test.describe("Discard in-progress match", () => {
  test("default behavior: discard resets the match to setup and keeps the players", async ({ page }) => {
    await openGame(page, "cards", "chin");
    await fillPlayers(page, ["Ana", "Beto"]);

    // Record a round so the match is in progress
    await page.locator("button").filter({ hasText: /ana/i }).click();
    await expect(page.locator(".tcard .ttscore").first()).toContainText("1");

    // Discard button is visible while in progress
    const discardBtn = page.locator('[data-testid="discard-match-btn"]');
    await expect(discardBtn).toBeVisible();
    await discardBtn.click();

    // Confirmation modal shows, cancel keeps the match
    await page.locator('[data-testid="discard-match-confirm"]').waitFor({ state: "visible" });
    await page.locator(".modal-cancel").first().click();
    await expect(page.locator(".tcard .ttscore").first()).toContainText("1");

    // Confirm discards → back to setup with players kept, progress reset
    await discardBtn.click();
    await page.locator('[data-testid="discard-match-confirm"]').click();
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="discard-match-btn"]')).toHaveCount(0);
    await expect(page.locator(".tcard .ttscore").first()).toContainText("0");
  });

  test("with the go-home preference: discard navigates back home", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("bgt_discard_goes_home", "1");
    });

    await openGame(page, "cards", "chin");
    await fillPlayers(page, ["Ana", "Beto"]);
    await page.locator("button").filter({ hasText: /ana/i }).click();
    await expect(page.locator(".tcard .ttscore").first()).toContainText("1");

    await page.locator('[data-testid="discard-match-btn"]').click();
    await page.locator('[data-testid="discard-match-confirm"]').click();

    // Back on the home catalog
    await expect(page.locator('[data-testid="group-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-input"]')).toHaveCount(0);
  });
});
