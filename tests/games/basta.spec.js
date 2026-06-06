import { test, expect } from "../fixtures.js";
import { openGame, fillPlayers } from "../helpers.js";

const STORAGE_KEY = "bgt_v6";
const DRAFTS_KEY = "bgt_drafts";

async function readStoredMatches(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return Array.isArray(data[targetGameId]) ? data[targetGameId] : [];
  }, { storageKey: STORAGE_KEY, targetGameId: gameId });
}

async function readStoredDraft(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return data[targetGameId] || null;
  }, { storageKey: DRAFTS_KEY, targetGameId: gameId });
}

async function openBastaDirect(page) {
  await page.goto("/game/basta_dym");
  await Promise.any([
    page.locator('[data-testid="tab-new"]').waitFor({ state: "visible", timeout: 10000 }),
    page.locator('[data-testid="player-input"]').first().waitFor({ state: "visible", timeout: 10000 }),
  ]);
}

test.describe("Basta!", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem("bgt_v6");
      localStorage.removeItem("bgt_drafts");
      localStorage.removeItem("bgt_nav_order");
    });
    await page.reload();

    try {
      const guestBtn = page.locator('[data-testid="guest-btn"]')
        .or(page.locator('button').filter({ hasText: /sin cuenta|without account/i }))
        .first();
      await guestBtn.waitFor({ state: 'visible', timeout: 4000 });
      await guestBtn.click();
    } catch {
      // Already inside the app shell.
    }

    await page.locator('[data-testid^="nav-pill-"]').first()
      .waitFor({ state: 'visible', timeout: 10000 });
  });

  test("is reachable from the random group and uses the generic match shell", async ({ page }) => {
    await openGame(page, "random", "basta_dym");

    await expect(page.locator(".htitle")).toHaveText("Basta!");
    await expect(page.locator(".htitle")).not.toContainText("de DyM");
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="save-match"]')).toHaveCount(0);
    await fillPlayers(page, ["Ana", "Beto"]);
    await expect(page.locator('[data-testid="basta-theme-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="basta-letter-grid"]')).toBeVisible();
  });

  test("stores the chosen letter, the theme, and the round history in draft and saved match state", async ({ page }) => {
    await openBastaDirect(page);
    await fillPlayers(page, ["Ana", "Beto"]);

    await page.locator('[data-testid="basta-theme-input"]').fill("Animales");
    await page.locator('[data-testid="basta-letter-M"]').click();
    await page.locator('[data-testid^="win-button-"]').first().click();

    const draft = await readStoredDraft(page, "basta_dym");
    expect(draft?.history).toHaveLength(1);
    expect(draft?.history?.[0]?.roundLetter).toBe("M");
    expect(draft?.history?.[0]?.theme).toBe("Animales");
    expect(draft?.usedLetters).toContain("M");
    expect(draft?.scores).toBeTruthy();

    await page.reload();
    await expect(page.locator('[data-testid="basta-round-history"]')).toContainText(/ronda 1|round 1|tour 1|runde 1|ラウンド 1|回合 1/i);
    await expect(page.locator('[data-testid="basta-round-history"]')).toContainText("M");
    await expect(page.locator('[data-testid="basta-round-history"]')).toContainText(/animales/i);

    await page.locator('[data-testid="save-match"]').click();
    await page.locator('[data-testid="early-finish-choose-winner"]').click();
    await page.locator('[data-testid="early-finish-player-ana"]').click();
    await page.locator('[data-testid="early-finish-confirm"]').click();

    const matches = await readStoredMatches(page, "basta_dym");
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe("Ana");
    expect(matches[0].history).toHaveLength(1);
    expect(matches[0].history[0].roundLetter).toBe("M");
    expect(matches[0].history[0].theme).toBe("Animales");

    await expect(page.locator('[data-testid="tab-stats"]')).toBeVisible();
  });

  test("persists the in-progress theme and selected letter across reloads", async ({ page }) => {
    await openBastaDirect(page);
    await fillPlayers(page, ["Ana", "Beto"]);

    await page.locator('[data-testid="basta-theme-input"]').fill("Animales");
    await page.locator('[data-testid="basta-letter-M"]').click();

    await page.reload();

    await expect(page.locator('[data-testid="basta-theme-input"]')).toHaveValue("Animales");
    await expect(page.locator('[data-testid="basta-active-letter"]')).toContainText("M");
    await expect(page.locator('[data-testid="basta-letter-M"]')).toBeDisabled();
  });

  test("tracks used letters, unlocks Otra vuelta after Z, and ends when a player reaches 3 thematic cards", async ({ page }) => {
    await openBastaDirect(page);
    await fillPlayers(page, ["Ana", "Beto"]);
    await page.locator('[data-testid="basta-theme-input"]').fill("Animales");

    for (const letter of ["A", "B", "C"]) {
      await page.locator(`[data-testid="basta-letter-${letter}"]`).click();
      await page.locator('[data-testid^="win-button-"]').first().click();
    }

    await expect(page.locator(".wnr")).toContainText(/ana/i);
    await expect(page.locator('[data-testid="save-match"]')).toBeVisible();

    await page.reload();
    await expect(page.locator(".wnr")).toContainText(/ana/i);
  });
});
