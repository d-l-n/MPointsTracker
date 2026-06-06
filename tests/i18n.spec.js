import { test, expect } from './fixtures.js';

test.describe('i18n', () => {
  test('language selector exists in preferences', async ({ page }) => {
    await page.locator('[data-testid="nav-pill-about"]').click();
    await page.locator('.settings-row').nth(0).click();
    await expect(page.locator('[data-testid="lang-pill-es"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="lang-pill-en"]')).toBeVisible();
    await expect(page.locator('[data-testid="lang-pill-de"]')).toBeVisible();
    await expect(page.locator('[data-testid="lang-pill-zh"]')).toBeVisible();
    await expect(page.locator('[data-testid="lang-pill-ja"]')).toBeVisible();
    await expect(page.locator('[data-testid="lang-pill-fr"]')).toBeVisible();
  });

  test('no raw translation keys on home page', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    // undefined = missing key resolution
    expect(bodyText, 'Found "undefined" in body — missing translation key').not.toContain('undefined');
    // {{ }} = unreplaced template placeholder
    expect(bodyText, 'Found template placeholder {{ in body').not.toContain('{{');
  });

  test('game group names are translated (not raw keys)', async ({ page }) => {
    // Group names are rendered via t() — if they show as raw keys like
    // "unoFamily" or "cardsGroup" that means i18n is broken
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/\bunoFamily\b/);
    expect(bodyText).not.toMatch(/\bcardsGroup\b/);
    expect(bodyText).not.toMatch(/\bcasinoGroup\b/);
  });

  test('UNO game name is always displayed', async ({ page }) => {
    // "UNO" is a proper noun that should appear in all locales
    await expect(page.locator('text=UNO').first()).toBeVisible();
  });
});
