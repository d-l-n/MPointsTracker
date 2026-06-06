import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

test.describe('Racha Perdida', () => {
  test('can open Racha Perdida and see form', async ({ page }) => {
    await openGame(page, 'random', 'racha_perdida');
    // Racha has its own form — check for register button or input
    await expect(
      page.locator('[data-testid="register-streak"]')
        .or(page.locator('[data-testid="player-input"]'))
        .or(page.locator('.sec input'))
        .first()
    ).toBeVisible({ timeout: 8000 });
  });
});
