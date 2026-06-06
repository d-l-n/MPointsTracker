import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const test = base.extend({
  page: async ({ page }, use) => {
    await page.context().addInitScript(() => {
      localStorage.setItem('bgt_splash_seen', '1');
      localStorage.setItem('bgt_install_dismissed', '1');
      localStorage.removeItem('bgt_guest_mode');
      localStorage.removeItem('bgt_last_uid');
    });

    await use(page);
  },
});

test.describe('Phase 2 auth foundations', () => {
  test('login route stays on /login and renders auth entry', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('[data-testid="guest-btn"]')).toBeVisible();
  });

  test('guest access to /admin redirects to /login', async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem('bgt_guest_mode', '1');
    });

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('[data-testid="guest-btn"]')).toBeVisible();
  });

  test('auth service enables indexeddb persistence explicitly', () => {
    const source = read('src/services/authService.ts');

    expect(source).toContain('indexedDBLocalPersistence');
    expect(source).toContain('setPersistence');
  });

  test('login route uses a dedicated React 19 LoginForm with optimistic feedback', () => {
    const screenSource = read('src/components/auth/EmailAuthScreen.tsx');
    const formSource = read('src/components/auth/LoginForm.tsx');

    expect(screenSource).toContain('LoginForm');
    expect(formSource).toContain('useFormStatus');
    expect(formSource).toContain('useOptimistic');
  });

  test('offline login route surfaces offline fallback UI', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="guest-btn"]')).toBeVisible();
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
  });
});
