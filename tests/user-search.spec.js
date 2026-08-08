import { test, expect } from './fixtures.js';
import { openGame } from './helpers.js';

test.describe('User Search Modal', () => {
  test('shows search methods in the order name, QR with name selected first (no email search)', async ({ page }) => {
    await openGame(page, 'tokens', 'ajedrez');
    await page.getByRole('button', { name: 'Search player' }).first().click();

    const methods = page.locator('.usearch-method-btn');
    await expect(methods).toHaveCount(2);
    await expect(methods.nth(0)).toContainText('By name');
    await expect(methods.nth(1)).toContainText('By QR');
    await expect(methods.nth(0)).toHaveClass(/active/);
    await expect(page.getByText('By email')).toHaveCount(0);
  });
});
