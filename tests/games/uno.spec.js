import { test, expect } from '../fixtures.js';
import { fillPlayers, openGame } from '../helpers.js';

test.describe('UNO Game', () => {
  test('uno round scoring uses aggregated card-type leftovers', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Beto']);

    await page.getByLabel(/n[úu]meros|number cards/i).fill('3');
    await page.getByLabel(/acci[óo]n|skip|rev/i).fill('2');
    await page.getByLabel(/wild/i).fill('1');
    await page.locator('.wnrbtn').filter({ hasText: 'Ana' }).click();

    await expect(page.locator('.sbrow').filter({ hasText: 'Ana' }).locator('.sbscore')).toHaveText('93');
  });

  test('uno supports in-progress roster changes without rewriting prior rounds', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Ana', 'Beto']);

    await page.getByLabel(/n[úu]meros|number cards/i).fill('2');
    await page.locator('.wnrbtn').filter({ hasText: 'Ana' }).click();

    await page.getByTestId('edit-roster').click();
    await page.getByTestId('add-player-in-progress').click();
    await page.getByPlaceholder(/jugador 3|player 3/i).fill('Carla');
    await page.getByTestId('save-roster').click();

    await expect(page.locator('.sbrow').filter({ hasText: 'Carla' }).locator('.sbscore')).toHaveText('0');

    await page.getByTestId('edit-roster').click();
    await page.getByRole('button', { name: /remove beto|eliminar beto|borrar beto/i }).click();
    await page.getByTestId('keep-player-record').click();

    await expect(page.locator('.sbrow').filter({ hasText: 'Beto' }).locator('.sbscore')).toHaveText('0');
    await expect(page.locator('.wnrbtn').filter({ hasText: 'Beto' })).toHaveCount(0);
  });

  test('keeps compact shared chrome on game detail, merges stats entry and shows player setup', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await expect(page.locator('.detail .hdr').first()).toHaveClass(/page-header-compact/);
    await expect(page.locator('.detail .tabs').first()).toHaveClass(/detail-tabs/);
    await expect(page.locator('[data-testid="tab-new"]')).toHaveClass(/detail-tab/);
    await expect(page.locator('[data-testid="tab-stats"]')).toHaveClass(/detail-tab/);
    await expect(page.locator('[data-testid="tab-stats"]')).toContainText(/estad[íi]sticas|stats|statistics/i);
    await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible();
  });
});
