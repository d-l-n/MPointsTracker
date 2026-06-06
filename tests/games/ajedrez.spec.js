import { test, expect } from '../fixtures.js';
import { fillPlayers, openGame } from '../helpers.js';

test.describe('Ajedrez Game', () => {
  test('can open Ajedrez from board games and see setup', async ({ page }) => {
    await openGame(page, 'tokens', 'ajedrez');
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button').filter({ hasText: /^5'$/ }).first()).toBeVisible();
  });

  test('can finish a chess game by checkmate after choosing the winner', async ({ page }) => {
    await openGame(page, 'tokens', 'ajedrez');
    await fillPlayers(page, ['Ana', 'Beto']);

    await page.locator('button').filter({ hasText: /start|empezar|commencer|開始|开始/i }).first().click();
    await page.locator('button').filter({ hasText: /terminar|finish|end/i }).click();
    await page.locator('button').filter({ hasText: /jaque mate|checkmate|échec et mat|チェックメイト|将死/i }).click();

    await expect(page.locator('button').filter({ hasText: /ana|beto/i })).toHaveCount(2);
    await page.locator('button').filter({ hasText: /ana/i }).click();
    await expect(page.locator('button').filter({ hasText: /guardar|save|enregistrer|speichern|保存/i })).toBeVisible();
  });

  test('can start a new chess game again after saving without retyping both players', async ({ page }) => {
    await openGame(page, 'tokens', 'ajedrez');
    await fillPlayers(page, ['Ana', 'Beto']);

    await page.locator('button').filter({ hasText: /start|empezar|commencer|開始|开始/i }).first().click();
    await page.locator('button').filter({ hasText: /terminar|finish|end/i }).click();
    await page.locator('button').filter({ hasText: /jaque mate|checkmate|échec et mat|チェックメイト|将死/i }).click();
    await page.locator('button').filter({ hasText: /ana/i }).click();
    await page.locator('button').filter({ hasText: /guardar|save|enregistrer|speichern|保存/i }).click();

    await expect(page.locator('[data-testid="game-detail-rematch-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-detail-rematch-action"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /rematch|revancha|revanche|リマッチ|复仇局/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /rematch|revancha|revanche|リマッチ|复仇局/i }).first()).not.toContainText('⚔️');
    await expect(page.locator('button').filter({ hasText: /share|compartir|partager|teilen|共有/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /share|compartir|partager|teilen|共有/i }).first()).toContainText('📤');
    await expect(page.locator('.tbody > div').first().locator('button').nth(0)).toContainText(/rematch/i);
    await expect(page.locator('.tbody > div').first().locator('button').nth(1)).toContainText(/share|compartir|partager|teilen|共有/i);
    await page.locator('button').filter({ hasText: /rematch/i }).click();
    await expect(page.locator('button').filter({ hasText: /start|empezar|commencer|開始|开始/i }).first()).toBeVisible();
  });
});
