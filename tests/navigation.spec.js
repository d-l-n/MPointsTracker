import { test, expect } from './fixtures.js';

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
    { message: 'Expected first entry to avoid lazy fallback loaders' }
  ).toEqual([]);
}

async function expectNoResidualGameDetail(page) {
  await expect(page.locator('[data-testid="tab-new"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="tab-stats"]')).toHaveCount(0);
  await expect(page.locator('.game-loading-fallback')).toHaveCount(0);
}

test.describe('Navigation', () => {
  test('can navigate between tabs', async ({ page }) => {
    // All nav pills should be visible
    const navPills = page.locator('[data-testid^="nav-pill-"]');
    const count = await navPills.count();
    expect(count).toBeGreaterThanOrEqual(3); // home, champs, rules, about minimum

    // Click on about tab
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.click('[data-testid="nav-pill-about"]');
      await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
      await expectNoResidualGameDetail(page);
    });

    // Go back home
    await page.click('[data-testid="nav-pill-home"]');
    await expect(page.locator('[data-testid="nav-pill-home"].active')).toBeVisible();
  });

  test('nav pills are clickable and change content', async ({ page }) => {
    // Start on home
    await expect(page.locator('[data-testid="nav-pill-home"].active')).toBeVisible();

    // Navigate to about
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.click('[data-testid="nav-pill-about"]');
      await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
      await expectNoResidualGameDetail(page);
    });
    
    // Navigate to rules
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.click('[data-testid="nav-pill-rules"]');
      await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();
      await expectNoResidualGameDetail(page);
    });
  });

  test('nav section clicks reset the current scroll position', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const scrollActiveSection = () => page.evaluate(() => {
      const scroller = [...document.querySelectorAll('.app-content,.app-content-inner,.detail-wrapper,.page')]
        .find((node) => node.scrollHeight > node.clientHeight);
      if (!scroller) return 0;
      scroller.scrollTop = Math.min(420, scroller.scrollHeight - scroller.clientHeight);
      scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
      return scroller.scrollTop;
    });
    const currentScrollTop = () => page.evaluate(() => {
      const scroller = [...document.querySelectorAll('.app-content,.app-content-inner,.detail-wrapper,.page')]
        .find((node) => node.scrollHeight > node.clientHeight);
      return scroller?.scrollTop ?? 0;
    });

    await page.click('[data-testid="nav-pill-rules"]');
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    expect(await scrollActiveSection()).toBeGreaterThan(0);

    await page.click('[data-testid="nav-pill-about"]');
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    await expect.poll(currentScrollTop).toBe(0);

    await page.click('[data-testid="nav-pill-rules"]');
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    expect(await scrollActiveSection()).toBeGreaterThan(0);

    await page.click('[data-testid="nav-pill-rules"]');
    await expect.poll(currentScrollTop).toBe(0);
  });

  test('settings subpage clicks reset the current scroll position', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const scrollActiveSection = () => page.evaluate(() => {
      const scroller = [...document.querySelectorAll('.app-content,.app-content-inner,.detail-wrapper,.page')]
        .find((node) => node.scrollHeight > node.clientHeight);
      if (!scroller) return 0;
      scroller.scrollTop = scroller.scrollHeight;
      scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
      return scroller.scrollTop;
    });
    const currentScrollTop = () => page.evaluate(() => {
      const scroller = [...document.querySelectorAll('.app-content,.app-content-inner,.detail-wrapper,.page')]
        .find((node) => node.scrollHeight > node.clientHeight);
      return scroller?.scrollTop ?? 0;
    });

    await page.click('[data-testid="nav-pill-about"]');
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    await expect(page.locator('[data-testid="settings-row-prefs"]')).toBeVisible();
    await page.locator('.settings-profile-dashboard').evaluate((node) => {
      node.style.minHeight = '1400px';
    });

    expect(await scrollActiveSection()).toBeGreaterThan(0);

    await page.evaluate(() => {
      document.querySelector('[data-testid="settings-row-prefs"]')?.click();
    });
    await expect(page.locator('[data-testid="reduce-effects-row"]')).toBeVisible();
    await expect.poll(currentScrollTop).toBe(0);
  });

  test('opening a game for the first time does not show a loader fallback', async ({ page }) => {
    await expectNoLoaderOnFirstEntry(page, async () => {
      await page.click('[data-testid="game-uno"]');
      await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
      await expect(page.locator('.game-loading-fallback')).toHaveCount(0);
    });
  });

  test('swipe simulation does not crash app', async ({ page }) => {
    await page.mouse.move(200, 500);
    await page.mouse.down();
    await page.mouse.move(50, 500);
    await page.mouse.up();

    // App should still be visible (no crash)
    await expect(page.locator('#root')).toBeVisible();
  });
});
