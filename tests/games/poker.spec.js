import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

test.describe('Poker Game', () => {
  test('can open Poker and see player input', async ({ page }) => {
    await openGame(page, 'casino', 'poker');
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible({ timeout: 8000 });
  });
});
