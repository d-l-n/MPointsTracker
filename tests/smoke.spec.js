import { test, expect } from './fixtures.js';

test.describe('Smoke', () => {
  test('app loads without JS errors', async ({ page, errors }) => {
    // errors is captured from before page.goto() — no missed boot errors
    await expect(page.locator('[data-testid^="nav-pill-"]').first()).toBeVisible({ timeout: 15000 });

    // Filter out known non-fatal Firebase/analytics noise if needed
    const fatal = errors.filter(e =>
      !e.includes('FIREBASE_OPTIONS') && // Firebase SDK warning on emulator
      !e.includes('favicon')
    );
    expect(fatal, `JS errors found:\n${fatal.join('\n')}`).toHaveLength(0);
  });

  test('app shows game groups on home', async ({ page }) => {
    // Use data-testid for group headers — language-agnostic
    await expect(page.locator('[data-testid="group-uno-family"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-casino"]')).toBeVisible();
  });

  test('nav pill count is correct', async ({ page }) => {
    const navPills = page.locator('[data-testid^="nav-pill-"]');
    await expect(navPills).toHaveCount(4); // home, champs, rules, about (no admin in guest)
  });
});
