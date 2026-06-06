import { test, expect } from './fixtures.js';
import { openGame, goToTab } from './helpers.js';

const SEED_MATCHES = JSON.stringify({
  uno: [
    {
      id: 'stat-match-1',
      date: new Date('2025-02-01').toISOString(),
      players: ['Carlos', 'Diana'],
      scores: { Carlos: 500, Diana: 180 },
      rounds: 5,
      winner: 'Carlos',
    },
    {
      id: 'stat-match-2',
      date: new Date('2025-02-02').toISOString(),
      players: ['Carlos', 'Diana'],
      scores: { Carlos: 200, Diana: 500 },
      rounds: 6,
      winner: 'Diana',
    },
  ],
});

async function loadWithSeed(page, seed) {
  await page.context().addInitScript((s) => {
    localStorage.setItem('bgt_v6', s);
  }, seed);
  await page.reload();
  try {
    const guestBtn = page.locator('[data-testid="guest-btn"]')
      .or(page.locator('button').filter({ hasText: /sin cuenta|without account/i })).first();
    await guestBtn.waitFor({ state: 'visible', timeout: 8000 });
    await guestBtn.click();
  } catch { /* already past auth */ }
  await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Stats Tab', () => {
  test('stats tab renders without crashing and keeps the fused shell free of history identity', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');

    // stat cards must be present regardless of data
    await expect(page.locator('[data-testid="stat-total-matches"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-rounds"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-stats-shell"]').getByRole('button', { name: /historial|history/i })).toHaveCount(0);
  });

  test('stats shows correct match count', async ({ page }) => {
    await loadWithSeed(page, SEED_MATCHES);

    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');

    const totalCard = page.locator('[data-testid="stat-total-matches"] .sv');
    await expect(totalCard).toHaveText('2');
  });

  test('stats shows correct round count', async ({ page }) => {
    await loadWithSeed(page, SEED_MATCHES);

    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');

    const roundsCard = page.locator('[data-testid="stat-total-rounds"] .sv');
    await expect(roundsCard).toHaveText('11'); // 5 + 6
  });

  test('leaderboard shows at least one entry with seeded data', async ({ page }) => {
    await loadWithSeed(page, SEED_MATCHES);

    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');

    await expect(page.locator('[data-testid="leaderboard-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-history-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-history-open"]')).toBeVisible();
  });

  test('stats tab shows zeros for empty game', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await goToTab(page, 'stats');

    const totalCard = page.locator('[data-testid="stat-total-matches"] .sv');
    await expect(totalCard).toHaveText('0');
  });
});
