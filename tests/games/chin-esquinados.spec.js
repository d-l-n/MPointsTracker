import { test, expect } from "../fixtures.js";
import { fillPlayers, openGame } from "../helpers.js";

const STORAGE_KEY = "bgt_v6";

async function readStoredMatches(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return Array.isArray(data[targetGameId]) ? data[targetGameId] : [];
  }, { storageKey: STORAGE_KEY, targetGameId: gameId });
}

test.describe("Chin and Esquinados games", () => {
  test("Chin records a 1v1 round and saves the match", async ({ page }) => {
    await openGame(page, "cards", "chin");
    await fillPlayers(page, ["Ana", "Beto"]);

    await page.locator("button").filter({ hasText: /ana/i }).click();
    await expect(page.locator(".tcard .ttscore").first()).toContainText("1");

    await page.locator('[data-testid="save-match"]').click();

    const matches = await readStoredMatches(page, "chin");
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe("Ana");
    expect(matches[0].rounds).toBe(1);
  });

  test("Esquinados records a round winner and saves the match", async ({ page }) => {
    await openGame(page, "cards", "esquinados");
    await fillPlayers(page, ["Ana", "Beto"]);

    await page.locator("button").filter({ hasText: /ana/i }).click();
    await expect(page.locator(".tcard .ttscore").first()).toContainText("1");

    await page.locator('[data-testid="save-match"]').click();

    const matches = await readStoredMatches(page, "esquinados");
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe("Ana");
    expect(matches[0].rounds).toBe(1);
  });
});
