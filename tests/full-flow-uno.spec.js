import { test, expect } from './fixtures.js';
import { openGame, fillPlayers, goToTab } from './helpers.js';

/**
 * Full E2E flow for UNO:
 * setup players → play rounds → game over → save → verify in history + stats
 *
 * Strategy for win-button IDs (runtime-generated):
 * - Use [data-testid^="win-button-"] and select by index, not ID.
 * - We always click the same player to accumulate score toward 500 pts.
 * - UNO default scores ≥ 100 pts/round for simple cases (opponent has 0 cards
 *   in hand → we enter "0" points). To force a fast win we use UNO's manual
 *   score fields: fill opponent score = 499 so next win triggers game-over.
 *   However, since this is E2E without mocking, the simplest reliable path is
 *   clicking a winner repeatedly and letting UNO accumulate naturally — but
 *   that may require many rounds.
 *
 *   Fastest reliable path: pre-seed a match that's nearly done is not possible
 *   via localStorage for in-progress state (it's React state, not persisted
 *   mid-game). Instead, we play enough rounds to trigger save-match button
 *   appearance (rounds > 0) and just save it as an in-progress match.
 */
test.describe('UNO — Full Flow', () => {
  async function saveEarlyFinishedUnoMatch(page) {
    await page.locator('[data-testid="save-match"]').click();
    await expect(page.locator('[data-testid="early-finish-modal"]')).toBeVisible();
    await page.locator('[data-testid="early-finish-no-winner"]').click();
    await page.locator('[data-testid="early-finish-confirm"]').click();
  }

  test('setup: player inputs are visible after opening game', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');

    const inputs = page.locator('[data-testid="player-input"]');
    await expect(inputs).toHaveCount(2); // default 2 player slots
  });

  test('setup: can add a third player', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');

    await page.locator('[data-testid="add-player"]').click();
    const inputs = page.locator('[data-testid="player-input"]');
    await expect(inputs).toHaveCount(3);
  });

  test('play round: win buttons appear after filling player names', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Bruno']);
    await page.waitForTimeout(200);

    // Win buttons appear once 2+ named players exist (no "start" needed in UNO)
    await expect(page.locator('[data-testid^="win-button-"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('play round: clicking a win button increments round counter', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Bruno']);
    await page.waitForTimeout(200);

    const winBtn = page.locator('[data-testid^="win-button-"]').first();
    await winBtn.waitFor({ state: 'visible', timeout: 5000 });
    await winBtn.click();

    // Round log appears (means at least 1 round played)
    await expect(page.locator('.rlog-toggle')).toBeVisible({ timeout: 5000 });
  });

  test('save: save-match button appears after at least one round', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Bruno']);
    await page.waitForTimeout(200);

    const winBtn = page.locator('[data-testid^="win-button-"]').first();
    await winBtn.waitFor({ state: 'visible', timeout: 5000 });
    await winBtn.click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="save-match"]')).toBeVisible({ timeout: 5000 });
  });

  test('save: saving a match keeps the user on the fused statistics view and shows the new match preview', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Bruno']);
    await page.waitForTimeout(200);

    const winBtn = page.locator('[data-testid^="win-button-"]').first();
    await winBtn.waitFor({ state: 'visible', timeout: 5000 });
    await winBtn.click();
    await page.waitForTimeout(300);

    await saveEarlyFinishedUnoMatch(page);

    await expect(page).toHaveURL(/\/game\/uno$/);
    await expect(page.locator('[data-testid="tab-stats"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="history-subpage"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="detail-history-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid^="detail-history-entry-"]')).toHaveCount(1);
  });

  test('stats: saved match is reflected in stats tab', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Bruno']);
    await page.waitForTimeout(200);

    const winBtn = page.locator('[data-testid^="win-button-"]').first();
    await winBtn.waitFor({ state: 'visible', timeout: 5000 });
    await winBtn.click();
    await page.waitForTimeout(300);

    await saveEarlyFinishedUnoMatch(page);
    await page.waitForTimeout(300);

    const totalCard = page.locator('[data-testid="stat-total-matches"] .sv');
    await expect(totalCard).toHaveText('1');
  });

  test('undo: undo button reverts last round', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Bruno']);
    await page.waitForTimeout(200);

    const winBtn = page.locator('[data-testid^="win-button-"]').first();
    await winBtn.waitFor({ state: 'visible', timeout: 5000 });
    await winBtn.click();
    await page.waitForTimeout(300);

    // Undo the round
    const undoBtn = page.locator('button').filter({ hasText: /deshacer|undo/i }).first();
    await undoBtn.waitFor({ state: 'visible', timeout: 3000 });
    await undoBtn.click();
    await page.waitForTimeout(200);

    // Round log should disappear (0 rounds played)
    await expect(page.locator('.rlog-toggle')).not.toBeVisible();
  });
});
