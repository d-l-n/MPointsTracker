import { test, expect } from './fixtures.js';

test.describe('Rules Page', () => {
  test('can open rules without runtime errors and render board games entries without structural game emojis', async ({ page, errors }) => {
    await page.click('[data-testid="nav-pill-rules"]');

    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();
    await expect(page.locator('.rule-game-name').filter({ hasText: /ajedrez|chess/i })).toBeVisible();
    await expect(page.locator('.rule-game-emoji')).toHaveCount(0);
    await expect(page.locator('.rule-game-hdr').first()).not.toContainText(/🎮|🃏|♟️|🎲|🀄/);
    expect(errors).toEqual([]);
  });

  test('uses action-card grammar for rules entries and includes Basta! inside the random group', async ({ page }) => {
    await page.click('[data-testid="nav-pill-rules"]');

    await expect(page.getByLabel(/buscar juego|search game/i)).toBeVisible();
    const firstRuleCard = page.locator('.rule-game-card').first();
    await expect(firstRuleCard).toHaveClass(/home-action-card/);
    await expect(firstRuleCard.locator('.rule-game-hdr')).toHaveJSProperty('tagName', 'BUTTON');
    await expect(page.locator('.rule-game-card .home-card-action')).not.toHaveCount(0);

    await expect(page.locator('.champ-sec-title').filter({ hasText: /random/i })).toBeVisible();
    await expect(page.locator('.rule-game-name').filter({ hasText: /basta/i })).toBeVisible();
  });

  test('keeps Monopoly and Life reachable inside the board games rules group', async ({ page }) => {
    await page.click('[data-testid="nav-pill-rules"]');

    const boardGroup = page.locator('.champ-sec-title').filter({ hasText: /fichas|tablero|tokens|board/i }).first();
    await expect(boardGroup).toBeVisible();
    await expect(page.locator('.rule-game-name').filter({ hasText: 'Monopoly' })).toBeVisible();
    await expect(page.locator('.rule-game-name').filter({ hasText: 'Life' })).toBeVisible();
  });

  test('keeps the Ver reglas action centered and aligned with the chevron inside the same button', async ({ page }) => {
    await page.click('[data-testid="nav-pill-rules"]');

    const firstAction = page.locator('.rule-game-card .rule-game-action').first();
    const firstHeader = page.locator('.rule-game-card .rule-game-hdr').first();

    await expect(firstAction).toContainText(/ver reglas|view rules/i);
    await expect(firstHeader.locator('.rule-chevron')).toHaveCount(1);

    await expect
      .poll(() => firstAction.evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          display: styles.display,
          alignItems: styles.alignItems,
          justifyContent: styles.justifyContent,
          textAlign: styles.textAlign,
        };
      }))
      .toEqual({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      });
  });
});
