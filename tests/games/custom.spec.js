import { test, expect } from "../fixtures.js";
import { openGame } from "../helpers.js";

test.describe("Custom Game", () => {
  test("configures a free game, records one round, and saves it", async ({ page }) => {
    await openGame(page, "random", "custom");

    await page.locator('.inp').nth(1).fill("Picadito");
    await page.locator('button').filter({ hasText: /picadito|free game|juego libre/i }).first().click();

    const playerInputs = page.locator('[data-testid="player-input"]');
    await playerInputs.nth(0).fill("Ana");
    await playerInputs.nth(1).fill("Beto");

    const roundInputs = page.locator('.rdinp');
    await roundInputs.nth(0).fill("12");
    await roundInputs.nth(1).fill("8");
    await page.getByRole('button', { name: /^🎮\s*Ana$/ }).click();

    await expect(page.locator('[data-testid="save-match"]')).toBeVisible();
    await page.locator('[data-testid="save-match"]').click();

    await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();
  });
});
