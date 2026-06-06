import { test, expect } from "../fixtures.js";
import { fillPlayers, openGame, startMatch } from "../helpers.js";

const STORAGE_KEY = "bgt_v6";

async function readStoredMatches(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return Array.isArray(data[targetGameId]) ? data[targetGameId] : [];
  }, { storageKey: STORAGE_KEY, targetGameId: gameId });
}

test.describe("Chancho and Burako games", () => {
  test("Chancho records a letter and saves progress", async ({ page }) => {
    await openGame(page, "cards", "chancho");
    await fillPlayers(page, ["Ana", "Beto", "Carla", "Diego"]);

    await page.locator("button").filter({ hasText: /ana/i }).click();
    await expect(page.locator(".sbrow").first()).toContainText("1/7");

    await page.locator('[data-testid="save-match"]').click();

    const matches = await readStoredMatches(page, "chancho");
    expect(matches).toHaveLength(1);
    expect(matches[0].rounds).toBe(1);
  });

  test("Burako starts, confirms a round, and updates the scoreboard", async ({ page }) => {
    await openGame(page, "tokens", "burako");
    await startMatch(page);

    const scoreInputs = page.locator(".rdinp");
    await scoreInputs.first().fill("120");
    await scoreInputs.nth(1).fill("80");
    await page.locator("button").filter({ hasText: /confirmar|confirm/i }).first().click();

    await expect(page.locator(".tcard .ttscore").first()).toContainText("120");
  });
});
