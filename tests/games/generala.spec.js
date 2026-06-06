import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

test.describe('Generala Game', () => {
  test('can open Generala and see setup', async ({ page }) => {
    await openGame(page, 'casino', 'generala');
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible({ timeout: 8000 });
  });
});
