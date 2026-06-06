import { test, expect } from '../fixtures.js';
import { openGame } from '../helpers.js';

test.describe('Truco Game', () => {
  test('can open Truco with compact shared chrome and see setup', async ({ page }) => {
    await openGame(page, 'cards', 'truco');
    await expect(page.locator('.detail .hdr').first()).toHaveClass(/page-header-compact/);
    await expect(page.locator('.detail .tabs').first()).toHaveClass(/detail-tabs/);
    await expect(page.locator('[data-testid="tab-new"]')).toHaveClass(/detail-tab/);
    await expect(page.locator('[data-testid="tab-stats"]')).toHaveClass(/detail-tab/);
    await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
    // 15 pts default limit visible in setup
    await expect(page.locator('text=15 PTS').first()).toBeVisible();
  });

  test('team score increments without breaking the merged statistics tab meaning', async ({ page }) => {
    await openGame(page, 'cards', 'truco');

    // Fill team names
    const teamInputs = page.locator('.inp');
    if (await teamInputs.first().isVisible().catch(() => false)) {
      await teamInputs.first().fill('Equipo A');
      await teamInputs.nth(1).fill('Equipo B');
    }

    // Start the match (ES: Iniciar | EN: Start)
    await page.locator('button').filter({ hasText: /iniciar|start/i }).first().click();

    // Increment team 0 twice
    await page.locator('[data-testid="team-plus-0"]').click();
    await page.locator('[data-testid="team-plus-0"]').click();
    await page.locator('[data-testid="confirm-hand"]').click();

    await expect(page.locator('[data-testid="team-score-0"] .ttscore')).toContainText('2');
    await page.locator('[data-testid="tab-stats"]').click();
    await expect(page.locator('[data-testid="tab-stats"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="tab-new"]')).not.toHaveClass(/active/);
    await expect(page.locator('[data-testid="detail-stats-shell"]')).toBeVisible();
  });
});
