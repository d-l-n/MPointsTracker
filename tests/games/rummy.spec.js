import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

const STORAGE_KEY = 'bgt_v6';
const DRAFTS_KEY = 'bgt_drafts';

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

test.describe('Rummy Game', () => {
  test('reaches 500 points, persists draft state, and saves the winning payload', async ({ page }) => {
    await openGame(page, 'cards', 'rummy');

    const playerInputs = page.locator('[data-testid="player-input"]');
    await playerInputs.nth(0).fill('Ana');
    await playerInputs.nth(1).fill('Beto');

    const roundInputs = page.locator('.rdinp');
    await roundInputs.nth(0).fill('500');
    await roundInputs.nth(1).fill('30');

    await page.locator('[data-testid^="win-button-"]').first().click();

    const draft = await readStoredDraft(page, 'rummy');
    expect(draft?.scores).toBeTruthy();
    expect(Object.values(draft?.scores || {})).toEqual(expect.arrayContaining([500, 30]));
    expect(draft?.rounds).toBe(1);
    expect(draft?.gameOver).toBe(true);

    await expect(page.locator('.wnr')).toContainText(/ana/i);
    await expect(page.locator('[data-testid="save-match"]')).toBeVisible();

    await page.locator('[data-testid="save-match"]').click();

    const matches = await readStoredMatches(page, 'rummy');
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe('Ana');
    expect(matches[0].rounds).toBe(1);
    expect(matches[0].players.map((player) => [player.name, player.score])).toEqual([
      ['Ana', 500],
      ['Beto', 30],
    ]);
  });
});
