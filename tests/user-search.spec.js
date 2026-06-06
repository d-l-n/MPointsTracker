import { test, expect } from './fixtures.js';
import { openGame } from './helpers.js';

test.describe('User Search Modal', () => {
  test('shows search methods in the order name, QR, email with name selected first', async ({ page }) => {
    await openGame(page, 'tokens', 'ajedrez');
    await page.locator('button[title="Search player"]').first().click();

    const methods = page.locator('.usearch-method-btn');
    await expect(methods).toHaveCount(3);
    await expect(methods.nth(0)).toContainText('By name');
    await expect(methods.nth(1)).toContainText('By QR');
    await expect(methods.nth(2)).toContainText('By email');
    await expect(methods.nth(0)).toHaveClass(/active/);
  });
});
