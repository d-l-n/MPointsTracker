import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

test.describe('Canasta Game', () => {
  test('can open Canasta and see setup', async ({ page }) => {
    await openGame(page, 'cards', 'canasta');
    await expect(page.locator('.pillrow button').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.inp').first()).toBeVisible();
  });

  test('team mode starts after valid names and change config confirms reset', async ({ page }) => {
    await openGame(page, 'cards', 'canasta');

    const startButton = page.locator('button').filter({ hasText: /iniciar|start/i }).first();
    await expect(startButton).toBeEnabled();

    const teamInputs = page.locator('.inp');
    await teamInputs.nth(0).fill('Alpha');
    await teamInputs.nth(1).fill('Beta');
    await startButton.click();

    await expect(page.locator('.tscores')).toBeVisible();
    await page.locator('.rdinp').nth(0).fill('120');
    await page.locator('.rdinp').nth(1).fill('80');
    await page.locator('button').filter({ hasText: /confirmar|confirm/i }).first().click();

    await expect(page.locator('.btnsec').filter({ hasText: /deshacer|undo/i })).toBeVisible();
    await page.locator('.btnsec').filter({ hasText: /change settings|cambiar ajustes|change config|cambiar config/i }).click();

    const abandonButton = page.locator('button').filter({ hasText: /^abandonar$|^abandon$/i });
    await expect(abandonButton).toBeVisible();
    await abandonButton.click();

    await expect(page.locator('.pillrow button').first()).toBeVisible();
    await expect(page.locator('.inp').nth(0)).toHaveValue('Alpha');
  });

  test('individual mode blocks duplicate names and allows unique players', async ({ page }) => {
    await openGame(page, 'cards', 'canasta');

    await page.locator('.pillrow button').filter({ hasText: /individual/i }).click();
    const playerInputs = page.locator('[data-testid="player-input"]');
    await playerInputs.nth(0).fill('Ana');
    await playerInputs.nth(1).fill('Ana');

    const startButton = page.locator('button').filter({ hasText: /iniciar|start/i }).first();
    await expect(startButton).toBeDisabled();

    await playerInputs.nth(1).fill('Beto');
    await expect(startButton).toBeEnabled();
  });
});
