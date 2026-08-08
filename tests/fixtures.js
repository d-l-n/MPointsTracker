import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture that:
 * 1. Captures ALL page errors from the very start (before goto)
 * 2. Skips splash + install banner via localStorage
 * 3. Enters guest mode via data-testid (language-agnostic)
 * 4. Dismisses nav overlay if open (desktop sidebar)
 * 5. Exposes `errors` array for smoke tests
 */
export const test = base.extend({
  // Shared errors array, populated from the first moment
  errors: [async ({}, use) => {
    await use([]);
  }, { scope: 'test' }],

  page: async ({ page, errors }, use) => {
    // ── Capture errors BEFORE navigation ──────────────────────────────────
    page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
    });

    // ── Skip splash + install banner + onboarding ─────────────────────────
    await page.context().addInitScript(() => {
      localStorage.setItem('bgt_splash_seen', '1');
      localStorage.setItem('bgt_install_dismissed', '1');
      localStorage.setItem('bgt_onboarding_seen', '1');
    });

    await page.goto('/');

    // ── Enter guest mode ──────────────────────────────────────────────────
    try {
      // data-testid first (robust), text fallback for both languages
      const guestBtn = page.locator('[data-testid="guest-btn"]')
        .or(page.locator('button').filter({ hasText: /sin cuenta|without account/i }))
        .first();

      await guestBtn.waitFor({ state: 'visible', timeout: 8000 });
      await guestBtn.click();

      // The guest flow asks for confirmation in a modal (commit 780c375).
      // Confirm it when present so the shell can render.
      const confirmBtn = page.locator('.modal-confirm').or(page.locator('[data-testid^="confirm-"]')).first();
      try {
        await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
        await confirmBtn.click();
      } catch {
        // No confirmation required
      }
    } catch {
      // Already past auth screen (e.g. cached guest session)
    }

    // ── Wait for app shell ────────────────────────────────────────────────
    try {
      await page.locator('[data-testid^="nav-pill-"]').first()
        .waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      // Continue — individual tests will fail with clearer messages
    }

    // ── Dismiss nav overlay (desktop sidebar opens by default) ───────────
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const overlay = page.locator('.nav-overlay');
        const visible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
        if (!visible) break;
        await overlay.click({ force: true });
        await page.waitForTimeout(400);
      } catch {
        try {
          await page.locator('.nav-hamburger').click();
          await page.waitForTimeout(400);
        } catch { /* nav not found */ }
        break;
      }
    }

    await use(page);
  },
});

export { expect };
