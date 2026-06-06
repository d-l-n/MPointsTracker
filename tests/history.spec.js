import { test, expect } from './fixtures.js';
import { goToTab, openGame, reloadWithSeed } from './helpers.js';

function buildMatch({ id, game, date, players, winner, note, sharedBy, duration, rounds }) {
  return {
    id,
    game,
    date,
    players,
    rounds,
    duration,
    note,
    winner,
    ...(sharedBy ? { _sharedBy: sharedBy } : {}),
  };
}

function buildVirtualizedHistorySeed() {
  const uno = Array.from({ length: 72 }, (_, index) => buildMatch({
    id: `uno-virtual-${index + 1}`,
    game: 'uno',
    date: new Date(Date.UTC(2025, 2, 1, 12, index)).toISOString(),
    players: [
      { name: index === 54 ? 'Needle Uno' : `Uno Player ${index + 1}`, score: 400 + index },
      { name: `Uno Rival ${index + 1}`, score: 200 + index },
    ],
    rounds: 3 + (index % 5),
    duration: 10 + (index % 7),
    note: `uno note ${index + 1}`,
    winner: index % 2 === 0 ? (index === 54 ? 'Needle Uno' : `Uno Player ${index + 1}`) : `Uno Rival ${index + 1}`,
  }));

  const ajedrez = Array.from({ length: 58 }, (_, index) => buildMatch({
    id: `ajedrez-virtual-${index + 1}`,
    game: 'ajedrez',
    date: new Date(Date.UTC(2025, 1, 1, 9, index)).toISOString(),
    players: [
      { name: index === 37 ? 'Needle Chess' : `Chess Player ${index + 1}`, score: 1 },
      { name: `Chess Rival ${index + 1}`, score: 0 },
    ],
    rounds: 1,
    duration: 6 + (index % 4),
    note: `chess note ${index + 1}`,
    winner: index % 2 === 0 ? (index === 37 ? 'Needle Chess' : `Chess Player ${index + 1}`) : `Chess Rival ${index + 1}`,
  }));

  return JSON.stringify({ uno, ajedrez });
}

async function openDeleteConfirmation(page, testId) {
  await page.locator(`[data-testid="${testId}"]`).evaluate((el) => el.click());
  const confirmBtn = page.locator('.modal-box button').filter({ hasText: /confirmar|confirm|eliminar|delete|sí|yes/i }).last();
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
  await confirmBtn.click();
}

test.describe('Shared History Sub-Page', () => {
  test('empty fused stats view shows no match cards but keeps integrated history access shell', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');

    await expect(page.locator('[data-testid="detail-stats-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-history-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid^="detail-history-entry-"]')).toHaveCount(0);
  });

  test('global history virtualizes large seeds and keeps search plus game filters stable', async ({ page }) => {
    await reloadWithSeed(page, buildVirtualizedHistorySeed());

    await page.goto('/history');
    await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();
    await expect(page.locator('.hlist--virtualized')).toBeVisible();

    const visibleCardsBeforeFilter = await page.locator('.history-match-card').count();
    expect(visibleCardsBeforeFilter).toBeLessThan(50);

    await page.locator('[data-testid="history-filter-game-ajedrez"]').click();
    await expect(page.locator('[data-testid="history-filter-game-ajedrez"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="match-ajedrez-virtual-58"]')).toBeVisible();
    await expect(page.locator('[data-testid="match-uno-virtual-72"]')).toHaveCount(0);
    await expect(page.locator('.hlist--virtualized')).toBeVisible();

    const scrollContainer = page.locator('.app-content');
    await scrollContainer.evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await page.waitForTimeout(150);
    await page.locator('[data-testid="search-player"]').fill('Needle Chess');

    await expect(page.locator('[data-testid="match-ajedrez-virtual-38"]')).toBeVisible();
    await expect(page.locator('[data-testid="match-ajedrez-virtual-58"]')).toHaveCount(0);

    await page.locator('[data-testid="search-player"]').fill('');
    await page.locator('[data-testid="history-filter-game-all"]').click();
    await expect(page.locator('[data-testid="history-filter-game-all"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="match-uno-virtual-72"]')).toBeVisible();
  });

  test('shared stats navigation opens a virtualized locked history list and supports deleting matches', async ({ page }) => {
    await reloadWithSeed(page, buildVirtualizedHistorySeed());

    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');
    await page.locator('[data-testid="detail-history-open"]').click();

    await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-filter-game-uno"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-filter-game-uno"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="history-filter-games"]')).toHaveCount(0);
    await expect(page.locator('.hlist--virtualized')).toBeVisible();
    await expect(page.locator('[data-testid="history-filter-game-uno"]')).not.toContainText(/[^\S\r\n]*🎮|🃏|♟️|🎲|🀄|📝|📨|🏆|👑|⏱️/);
    await expect(page.locator('[data-testid="history-subpage"]')).not.toContainText(/📨|🏆|👑|📝|⏱️|✏️|🗑️/);

    await page.locator('[data-testid="search-player"]').fill('Needle Uno');
    await expect(page.locator('[data-testid="match-uno-virtual-55"]')).toBeVisible();

    await openDeleteConfirmation(page, 'delete-match-uno-virtual-55');
    await expect(page.locator('[data-testid="match-uno-virtual-55"]')).toHaveCount(0);
  });
});
