import { test, expect } from './fixtures.js';
import { fillPlayers, openGame } from './helpers.js';

test.describe('Share result', () => {
  test('shares the final generated PNG through navigator.share when file sharing is available', async ({ page }) => {
    await page.evaluate(() => {
      window.__sharedPayload = null;
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: (payload) => Array.isArray(payload?.files) && payload.files.length === 1,
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload) => {
          const file = payload?.files?.[0] || null;
          const bytes = file ? await file.arrayBuffer() : null;
          window.__sharedPayload = {
            title: payload?.title || '',
            text: payload?.text || '',
            fileName: file?.name || '',
            type: file?.type || '',
            size: file?.size || 0,
            bytes: bytes?.byteLength || 0,
          };
        },
      });
    });

    await openGame(page, 'tokens', 'ajedrez');
    await fillPlayers(page, ['Ana', 'Beto']);

    await page.locator('button').filter({ hasText: /start|empezar|commencer|開始|开始/i }).first().click();
    await page.locator('button').filter({ hasText: /terminar|finish|end/i }).click();
    await page.locator('button').filter({ hasText: /jaque mate|checkmate|échec et mat|チェックメイト|将死/i }).click();
    await page.locator('button').filter({ hasText: /ana/i }).click();
    await page.locator('button').filter({ hasText: /guardar|save|enregistrer|speichern|保存/i }).click();

    const shareButton = page.locator('button').filter({ hasText: /share|compartir|partager|teilen|シェア|分享/i }).first();
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    await expect.poll(() => page.evaluate(() => window.__sharedPayload)).not.toBeNull();
    const payload = await page.evaluate(() => window.__sharedPayload);
    expect(payload.title).toMatch(/ajedrez|chess/i);
    expect(payload.text).toMatch(/ana/i);
    expect(payload.fileName).toMatch(/^mpoints_(ajedrez|chess)_/i);
    expect(payload.type).toBe('image/png');
    expect(payload.size).toBeGreaterThan(1000);
    expect(payload.bytes).toBe(payload.size);
  });
});
