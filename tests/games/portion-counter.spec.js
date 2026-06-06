import { test, expect } from "../fixtures.js";
import { openGame, fillPlayers } from "../helpers.js";

const STORAGE_KEY = "bgt_v6";

async function readStoredMatches(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return Array.isArray(data[targetGameId]) ? data[targetGameId] : [];
  }, { storageKey: STORAGE_KEY, targetGameId: gameId });
}

test.describe("Unified portion counter", () => {
  test("Home removes the porciones group and exposes the unified game under random", async ({ page }) => {
    await expect(page.locator('[data-testid="group-porciones"]')).toHaveCount(0);

    const randomGroup = page.locator('[data-testid="group-random"]');
    await randomGroup.click();
    await expect(page.locator('[data-testid="game-portion_counter"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-sushi"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="game-pizza"]')).toHaveCount(0);
  });

  test("Setup blocks start until a food is selected and preserves the chosen food in draft", async ({ page }) => {
    await openGame(page, "random", "portion_counter");
    await fillPlayers(page, ["Ana", "Beto"]);

    const startButton = page.locator('[data-testid="portion-start-match"]');
    await expect(startButton).toBeDisabled();

    await page.locator('[data-testid="portion-food-pizza"]').click();
    await expect(startButton).toBeEnabled();
    await startButton.click();
    await expect(page.locator('[data-testid="portion-center-emoji"]')).toContainText("🍕");

    await page.reload();
    await openGame(page, "random", "portion_counter");
    await expect(page.locator('[data-testid="portion-center-emoji"]')).toContainText("🍕");
  });

  test("Reset returns to setup and saved matches include the selected food metadata", async ({ page }) => {
    await openGame(page, "random", "portion_counter");
    await fillPlayers(page, ["Ana", "Beto"]);
    await page.locator('[data-testid="portion-food-cookies"]').click();
    await page.locator('[data-testid="portion-start-match"]').click();

    await page.locator('[data-testid="portion-player-ana"]').click();
    await page.locator('[data-testid="portion-center-emoji"]').click();
    await page.locator('[data-testid="save-match"]').click();

    const matches = await readStoredMatches(page, "portion_counter");
    expect(matches).toHaveLength(1);
    expect(matches[0].foodKey).toBe("cookies");
    expect(matches[0].foodName).toBe("Cookies");
    expect(matches[0].foodEmoji).toBe("🍪");

    await openGame(page, "random", "portion_counter");
    await page.locator('[data-testid="portion-player-ana"]').click();
    await page.locator('[data-testid="portion-reset"]').click();
    await page.locator('[data-testid="portion-reset-confirm"]').click();
    await expect(page.locator('[data-testid="portion-setup"]')).toBeVisible();
    await expect(page.locator('[data-testid="portion-start-match"]')).toBeDisabled();
  });
});
