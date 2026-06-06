import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

const STORAGE_KEY = 'bgt_v6';

async function readStoredMatches(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return Array.isArray(data[targetGameId]) ? data[targetGameId] : [];
  }, { storageKey: STORAGE_KEY, targetGameId: gameId });
}

test.describe('Chinchón Game', () => {
  test('can open Chinchón and see player setup', async ({ page }) => {
    await openGame(page, 'cards', 'chinchon');
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible();
  });

  test('eliminates on 100, supports negative scores, and undo restores an intermediate elimination round', async ({ page }) => {
    await openGame(page, 'cards', 'chinchon');

    const playerInputs = page.locator('[data-testid="player-input"]');
    await playerInputs.nth(0).fill('Ana');
    await playerInputs.nth(1).fill('Beto');
    await page.locator('.btndash').first().click();
    await playerInputs.nth(2).fill('Caro');

    const roundInputs = page.locator('.rdinp');
    await roundInputs.nth(0).fill('100');
    await roundInputs.nth(1).fill('-10');
    await roundInputs.nth(2).fill('15');

    await page.locator('.wnrbtn').filter({ hasText: /sin ganador|no winner/i }).click();

    await expect(page.locator('.sbrow.elim .sbname')).toContainText(/ana/i);
    await expect(page.locator('.btnsec').filter({ hasText: /deshacer|undo/i })).toBeVisible();

    await page.locator('.btnsec').filter({ hasText: /deshacer|undo/i }).click();

    await expect(page.locator('.wnr')).toHaveCount(0);
    await expect(page.locator('.sbrow.elim')).toHaveCount(0);
    await expect(roundInputs.nth(0)).toHaveValue('100');
    await expect(roundInputs.nth(1)).toHaveValue('-10');
    await expect(roundInputs.nth(2)).toHaveValue('15');

    await page.locator('.wnrbtn').filter({ hasText: /sin ganador|no winner/i }).click();
    await roundInputs.nth(0).fill('110');
    await roundInputs.nth(1).fill('10');
    await page.locator('.wnrbtn').filter({ hasText: /sin ganador|no winner/i }).click();

    await expect(page.locator('.wnr')).toContainText(/caro/i);
    await page.locator('[data-testid="save-match"]').click();

    const matches = await readStoredMatches(page, 'chinchon');
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe('Caro');
    expect(matches[0].players.map((player) => [player.name, player.score])).toEqual([
      ['Caro', 25],
      ['Ana', 100],
      ['Beto', 100],
    ]);
  });
});
