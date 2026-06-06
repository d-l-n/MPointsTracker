import { test, expect } from './fixtures.js';

async function createColdPage(browser, path) {
  const context = await browser.newContext({
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
  });

  await context.addInitScript(() => {
    localStorage.setItem('bgt_splash_seen', '1');
    localStorage.setItem('bgt_install_dismissed', '1');
    localStorage.removeItem('bgt_guest_mode');
    localStorage.removeItem('bgt_last_uid');

    const hasLoaderSignal = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.classList.contains('route-loader')) return true;
      if (node.classList.contains('game-loading-fallback')) return true;
      const stack = [node];

      while (stack.length > 0) {
        const current = stack.pop();
        if (!(current instanceof HTMLElement)) continue;
        if (current.classList.contains('route-loader')) return true;
        if (current.classList.contains('game-loading-fallback')) return true;
        stack.push(...current.children);
      }

      return false;
    };

    window.__loaderEvents = [];
    const attachObserver = () => {
      if (!document.body || window.__loaderObserver) return;
      window.__loaderObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (hasLoaderSignal(node)) {
              window.__loaderEvents.push({
                text: node.textContent?.trim() || '',
                className: node instanceof HTMLElement ? node.className : '',
              });
            }
          }
        }
      });
      window.__loaderObserver.observe(document.body, { childList: true, subtree: true });
      if (hasLoaderSignal(document.body)) {
        window.__loaderEvents.push({
          text: document.body.textContent?.trim() || '',
          className: document.body.className,
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
    } else {
      attachObserver();
    }
  });

  const page = await context.newPage();
  await page.goto(path);

  try {
    const guestBtn = page.locator('[data-testid="guest-btn"]')
      .or(page.locator('button').filter({ hasText: /sin cuenta|without account/i }))
      .first();
    await guestBtn.waitFor({ state: 'visible', timeout: 8000 });
    await guestBtn.click();
  } catch { /* already past auth */ }

  await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 10000 });
  return { context, page };
}

async function installLoaderObserver(page) {
  await page.evaluate(() => {
    const LOADER_TEXTS = new Set([
      'Loading...',
      'Cargando...',
      'Loading game...',
      'Cargando juego...',
    ]);

    const hasLoaderSignal = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.classList.contains('game-loading-fallback')) return true;
      const stack = [node];

      while (stack.length > 0) {
        const current = stack.pop();
        if (!(current instanceof HTMLElement)) continue;
        if (current.classList.contains('game-loading-fallback')) return true;
        const text = current.textContent?.trim();
        if (text && LOADER_TEXTS.has(text)) return true;
        stack.push(...current.children);
      }

      return false;
    };

    window.__loaderEvents = [];
    window.__loaderObserver?.disconnect?.();
    window.__loaderObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (hasLoaderSignal(node)) {
            window.__loaderEvents.push({
              text: node.textContent?.trim() || '',
              className: node instanceof HTMLElement ? node.className : '',
            });
          }
        }
      }
    });
    window.__loaderObserver.observe(document.body, { childList: true, subtree: true });
  });
}

async function expectNoLoaderOnFirstEntry(page, action) {
  await installLoaderObserver(page);
  await action();
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await Promise.resolve();
  });
  await expect.poll(
    async () => page.evaluate(() => window.__loaderEvents ?? []),
    { message: 'Expected deep link first entry to avoid lazy fallback loaders' }
  ).toEqual([]);
}

async function expectNoResidualGameDetail(page) {
  await expect(page.locator('[data-testid="tab-new"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="tab-stats"]')).toHaveCount(0);
  await expect(page.locator('.game-loading-fallback')).toHaveCount(0);
}

test.describe('Phase 1 routing and theme foundations', () => {
  test('cold top-level route entry avoids route fallback loaders while keeping deep links stable', async ({ browser }) => {
    const paths = [
      ['/rules', '[data-testid="nav-pill-rules"].active'],
      ['/settings', '[data-testid="nav-pill-about"].active'],
      ['/game/uno', '[data-testid="tab-new"]'],
    ];

    for (const [path, selector] of paths) {
      const { context, page } = await createColdPage(browser, path);
      try {
        await expect(page.locator(selector)).toBeVisible();
        await expect(page.locator('.route-loader')).toHaveCount(0);
        await expect
          .poll(() => page.evaluate(() => window.__loaderEvents ?? []), {
            message: `Expected cold load for ${path} to avoid visible fallback loaders`,
          })
          .toEqual([]);
      } finally {
        await context.close();
      }
    }
  });

  test('unknown deep links redirect back to home', async ({ page }) => {
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.goto('/definitely-not-a-route');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('[data-testid="nav-pill-home"].active')).toBeVisible();
      await expectNoResidualGameDetail(page);
    });
  });

  test('deep links keep the rules section active', async ({ page }) => {
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.goto('/rules');
      await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();
      await expect(page.locator('[data-testid="nav-pill-home"].active')).toHaveCount(0);
      await expectNoResidualGameDetail(page);
    });
  });

  test('deep links keep the settings section active', async ({ page }) => {
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.goto('/settings');
      await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
      await expect(page.locator('[data-testid="nav-pill-home"].active')).toHaveCount(0);
      await expectNoResidualGameDetail(page);
    });
  });

  test('game deep links keep the home section active without a loader fallback', async ({ page }) => {
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.goto('/game/uno');
      await expect(page.locator('[data-testid="nav-pill-home"].active')).toBeVisible();
      await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();
      await expect(page.locator('.game-loading-fallback')).toHaveCount(0);
    });
  });

  test('html exposes the active theme through data-theme', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('bgt_theme_mode', 'light');
      localStorage.removeItem('bgt_oled');
    });
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.evaluate(() => {
      localStorage.setItem('bgt_theme_mode', 'dark');
      localStorage.setItem('bgt_oled', '1');
    });
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');
  });

  test('Monet accent mode persists and can coexist with OLED', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('bgt_theme_mode', 'dark');
      localStorage.setItem('bgt_theme_accent', 'monet');
      localStorage.setItem('bgt_oled', '1');
    });
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');
    await expect(page.locator('html')).toHaveAttribute('data-theme-accent', 'monet');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme-source', /.+/);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('bgt_theme_accent')))
      .toBe('monet');
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('bgt_oled')))
      .toBe('1');
  });

  test('share result helpers derive the share surface from the active theme', async ({ page }) => {
    const shareThemeInfo = await page.evaluate(async () => {
      const mod = await import('/src/components/ui/ShareResultCard.tsx');
      return {
        light: mod.resolveShareTheme('light', '#E63946'),
        dark: mod.resolveShareTheme('dark', '#E63946'),
        oled: mod.resolveShareTheme('oled', '#E63946'),
      };
    });

    expect(shareThemeInfo.light.mode).toBe('light');
    expect(shareThemeInfo.dark.mode).toBe('dark');
    expect(shareThemeInfo.oled.mode).toBe('oled');
    expect(shareThemeInfo.light.background.start).not.toBe(shareThemeInfo.dark.background.start);
    expect(shareThemeInfo.dark.background.start).not.toBe(shareThemeInfo.oled.background.start);
  });

  test('dev boot keeps service worker registration inert', async ({ page }) => {
    await page.addInitScript(() => {
      const registerCalls = [];
      const listenerCalls = [];
      const originalServiceWorker = navigator.serviceWorker;

      Object.defineProperty(window, '__swRegisterCalls', {
        configurable: true,
        value: registerCalls,
      });

      Object.defineProperty(window, '__swListenerCalls', {
        configurable: true,
        value: listenerCalls,
      });

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          controller: originalServiceWorker?.controller ?? null,
          register: (...args) => {
            registerCalls.push(args);
            return Promise.resolve({
              scope: '/',
              installing: null,
              addEventListener() {},
            });
          },
          addEventListener: (type, listener, options) => {
            void listener;
            void options;
            listenerCalls.push(type);
          },
        },
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect
      .poll(() => page.evaluate(() => ({
        registerCalls: window.__swRegisterCalls?.length ?? -1,
        listenerCalls: window.__swListenerCalls ?? [],
      })))
      .toEqual({
        registerCalls: 0,
        listenerCalls: [],
      });
  });
});
