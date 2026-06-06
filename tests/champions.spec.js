import { test, expect } from './fixtures.js';
import { fillPlayers, openGame } from './helpers.js';

const MIXED_HISTORY = JSON.stringify({
  uno: [
    {
      id: 'uno-match-1',
      game: 'uno',
      date: new Date('2025-01-10T10:00:00.000Z').toISOString(),
      players: [
        { name: 'Alice', score: 500 },
        { name: 'Bob', score: 210 },
      ],
      rounds: 3,
      winner: 'Alice',
    },
  ],
  ajedrez: [
    {
      id: 'ajedrez-match-0',
      game: 'ajedrez',
      date: new Date('2025-01-11T10:00:00.000Z').toISOString(),
      players: [
        { name: 'Ana', score: 1 },
        { name: 'Beto', score: 0 },
      ],
      rounds: 1,
      winner: 'Ana',
    },
    {
      id: 'ajedrez-match-1',
      game: 'ajedrez',
      date: new Date('2025-01-12T10:00:00.000Z').toISOString(),
      players: [
        { name: 'Ana', score: 1 },
        { name: 'Beto', score: 0 },
      ],
      rounds: 1,
      winner: 'Ana',
    },
  ],
});

test.describe('Champions Page', () => {
  test('integrates head-to-head, removes latest matches, hides empty games, and strips structural emojis from shared headers', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-pill-h2h"]')).toHaveCount(0);

    await openGame(page, 'tokens', 'ajedrez');
    await fillPlayers(page, ['Ana', 'Beto']);
    await page.locator('button').filter({ hasText: /start|empezar|commencer|開始|开始/i }).first().click();
    await page.locator('button').filter({ hasText: /terminar|finish|end/i }).click();
    await page.locator('button').filter({ hasText: /jaque mate|checkmate|échec et mat|チェックメイト|将死/i }).click();
    await page.locator('button').filter({ hasText: /ana/i }).click();
    await page.locator('button').filter({ hasText: /guardar|save|enregistrer|speichern|保存/i }).click();

    await page.locator('[data-testid="nav-pill-champs"]').click();

    const champsPage = page.locator('.page');
    const champsText = await champsPage.innerText();
    expect(champsText).not.toMatch(/player of the month|jugador del mes|spieler des monats|joueur du mois|今月のプレイヤー|本月最佳球员/i);
    await expect(champsPage).not.toContainText(/latest matches|últimas partidas|letzte spiele|dernières parties|最新試合|最新比赛/i);
    await expect(champsPage).toContainText(/head-to-head|mano a mano|direkte duelle|face-à-face|一対一|正面交锋/i);
    await expect(champsPage).toContainText(/ajedrez|chess/i);
    await expect(champsPage).not.toContainText(/\bUNO\b/);
    await expect(page.locator('.champ-crown')).toHaveCount(0);
    await expect(page.locator('.cbg-emoji')).toHaveCount(0);
    await expect(page.locator('.podium')).not.toContainText(/🔗|🔥|🏆/);
  });

  test('head-to-head keeps a native app layout without structural emojis in score chrome', async ({ page }) => {
    await page.context().addInitScript((seed) => {
      localStorage.setItem('bgt_v6', seed);
    }, MIXED_HISTORY);
    await page.reload();

    try {
      const guestBtn = page.locator('[data-testid="guest-btn"]')
        .or(page.locator('button').filter({ hasText: /sin cuenta|without account/i }))
        .first();
      await guestBtn.waitFor({ state: 'visible', timeout: 8000 });
      await guestBtn.click();
    } catch { /* already past auth */ }

    await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 10000 });

    await page.locator('[data-testid="nav-pill-champs"]').click();
    await expect(page.locator('[data-testid="h2h-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="h2h-player-a"]')).toBeVisible();
    await expect(page.locator('[data-testid="h2h-player-b"]')).toBeVisible();

    const selectPlayer = async (testId, name) => {
      await page.locator(`[data-testid="${testId}"] input`).fill(name);
      await page.locator('[data-testid="h2h-option"]').filter({ hasText: new RegExp(`^${name}$`, 'i') }).first().click();
    };

    await selectPlayer('h2h-player-a', 'Ana');
    await selectPlayer('h2h-player-b', 'Beto');

    await expect(page.locator('[data-testid="h2h-scoreboard"]')).toContainText(/ana/i);
    await expect(page.locator('[data-testid="h2h-scoreboard"]')).toContainText(/beto/i);
    await expect(page.locator('[data-testid="h2h-by-game"]')).toContainText(/ajedrez|chess/i);
    await expect(page.locator('[data-testid="h2h-scoreboard"]')).not.toContainText(/👑|🏆/);
    await expect(page.locator('[data-testid="h2h-by-game"]')).not.toContainText(/🎮|♟️|🏆/);
    await expect(page.locator('.h2h-streak-fire')).toHaveCount(0);
    await expect(page.locator('.h2h-streak-card')).not.toContainText(/🔥/);
  });
});
