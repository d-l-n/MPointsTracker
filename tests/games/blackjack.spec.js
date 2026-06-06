import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

test.describe('Blackjack Game', () => {
  test('can open Blackjack and see setup', async ({ page }) => {
    await openGame(page, 'casino', 'blackjack');
    // Blackjack shows player inputs in setup
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible({ timeout: 8000 });
  });
});
