import { test, expect } from './fixtures.js';
import { fillPlayers, hasHorizontalOverflow, getOverflowingElement, openGame } from './helpers.js';

const HOME_DATA = {
  uno: [
    {
      id: 'match-uno-1',
      game: 'uno',
      date: '2026-05-08T12:00:00.000Z',
      players: ['Ana', 'Beto'],
      winner: 'Ana',
      rounds: 4,
    },
  ],
  truco: [
    {
      id: 'match-truco-1',
      game: 'truco',
      date: '2026-05-09T15:30:00.000Z',
      players: ['Luz', 'Nico', 'Paz', 'Tomi'],
      winner: 'Luz',
      rounds: 8,
    },
  ],
};

const HOME_DRAFTS = {
  uno: {
    players: [
      { id: 'p1', name: 'Ana' },
      { id: 'p2', name: 'Beto' },
    ],
    scores: { p1: 320, p2: 210 },
    rounds: 3,
    inProgress: true,
    _savedAt: 1778380200000,
  },
};

async function seedHomeState(page) {
  await page.evaluate(({ data, drafts }) => {
    localStorage.setItem('bgt_v6', JSON.stringify(data));
    localStorage.setItem('bgt_drafts', JSON.stringify(drafts));
  }, { data: HOME_DATA, drafts: HOME_DRAFTS });
  await page.reload();
}

async function seedChampsState(page) {
  await page.evaluate(() => {
    const gameIds = [
      'uno', 'truco', 'chinchon', 'chancho', 'chin', 'esquinados',
      'rummy', 'burako', 'poker', 'blackjack', 'generala', 'ajedrez',
    ];
    const players = ['Ana', 'Beto', 'Cami', 'Dani'];
    const data = Object.fromEntries(gameIds.map((gameId, gameIndex) => [
      gameId,
      Array.from({ length: 3 }, (_, matchIndex) => ({
        id: `${gameId}-${matchIndex}`,
        game: gameId,
        date: new Date(Date.UTC(2026, 4, 1 + gameIndex, 12, matchIndex)).toISOString(),
        players,
        winner: players[(gameIndex + matchIndex) % players.length],
        rounds: 3 + matchIndex,
      })),
    ]));
    localStorage.setItem('bgt_v6', JSON.stringify(data));
  });
  await page.reload();
}

async function seedSettingsState(page) {
  await page.evaluate(() => {
    const groups = Array.from({ length: 12 }, (_, groupIndex) => ({
      name: `Grupo ${groupIndex + 1}`,
      players: Array.from({ length: 4 }, (_, playerIndex) => `Jugador ${groupIndex + 1}-${playerIndex + 1}`),
    }));
    localStorage.setItem('bgt_player_groups', JSON.stringify(groups));
  });
  await page.reload();
}

async function expectNoOverflow(page, context) {
  await page.waitForTimeout(300);
  const overflow = await hasHorizontalOverflow(page);
  if (overflow) {
    const el = await getOverflowingElement(page);
    expect(overflow, `${context} overflow caused by: ${el}`).toBeFalsy();
  }
}

async function expectFullyInViewport(locator, page, label) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should have a measurable box`).toBeTruthy();
  expect(box.x, `${label} should stay within left edge`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${label} should stay within right edge`).toBeLessThanOrEqual(page.viewportSize().width);
}

async function expectMobilePillChrome(locator, page, label) {
  if ((page.viewportSize()?.width ?? 0) >= 900) return;
  const viewportWidth = page.viewportSize().width;
  const metrics = await locator.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    const visibleSurface = node.closest('.home-header-surface') || node;
    const surfaceStyles = window.getComputedStyle(visibleSurface);
    const box = node.getBoundingClientRect();
    return {
      borderTopLeftRadius: parseFloat(styles.borderTopLeftRadius),
      borderBottomLeftRadius: parseFloat(styles.borderBottomLeftRadius),
      borderBottomWidth: parseFloat(surfaceStyles.borderBottomWidth),
      width: box.width,
    };
  });

  expect(metrics.borderTopLeftRadius, `${label} should have flat top-left corner`).toBeLessThan(5);
  expect(metrics.borderBottomLeftRadius, `${label} should have rounded bottom-left corner`).toBeGreaterThanOrEqual(16);
  expect(metrics.borderBottomWidth, `${label} should use the same bordered glass language as the bottom bar`).toBeGreaterThanOrEqual(1);
  expect(metrics.width, `${label} should span the full width of the viewport`).toBeGreaterThanOrEqual(viewportWidth - 2);
  await expect(locator, `${label} should be rendered by the shared app header component`).toHaveAttribute('data-app-header', 'pill');
}

async function getGlassChrome(locator) {
  return locator.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      backdropFilter: styles.backdropFilter || styles.webkitBackdropFilter,
      backgroundColor: styles.backgroundColor,
      borderBottomColor: styles.borderBottomColor,
    };
  });
}

async function getInlinePadding(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      left: parseFloat(styles.paddingLeft),
      right: parseFloat(styles.paddingRight),
    };
  });
}

async function dispatchTouchScroll(page, direction = 'down') {
  const client = await page.context().newCDPSession(page);
  const viewport = page.viewportSize() || { width: 375, height: 667 };
  const x = Math.round(viewport.width / 2);
  const startY = direction === 'down'
    ? Math.max(140, viewport.height - 150)
    : Math.min(viewport.height - 120, 150);
  const midY = direction === 'down'
    ? Math.max(100, startY - 160)
    : Math.min(viewport.height - 80, startY + 160);
  const endY = direction === 'down'
    ? Math.max(60, startY - 320)
    : Math.min(viewport.height - 50, startY + 320);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: midY }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: endY }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function expectChromeSynced(header, nav, hidden, label) {
  await expect
    .poll(async () => ({
      headerHidden: await header.evaluate((node) => node.classList.contains('chrome--hidden')),
      navHidden: await nav.evaluate((node) => node.classList.contains('nav--hidden')),
    }), { message: label })
    .toEqual({ headerHidden: hidden, navHidden: hidden });
}

async function scrollAppContentTo(page, position) {
  const scroller = page.locator('.app-content').first();
  await scroller.evaluate((node, requestedPosition) => {
    const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
    const nextScrollTop = requestedPosition === 'bottom'
      ? maxScrollTop
      : requestedPosition === 'near-bottom'
        ? Math.max(0, maxScrollTop - 2)
        : requestedPosition === 'near-top'
          ? Math.min(2, maxScrollTop)
          : 0;
    node.scrollTop = nextScrollTop;
    node.dispatchEvent(new Event('scroll', { bubbles: true }));
  }, position);
}

const syncedChromeSurfaces = [
  {
    name: 'Champs',
    navTestId: 'nav-pill-champs',
    headerSelector: '[data-testid="champs-sticky-header"]',
    prepare: seedChampsState,
  },
  {
    name: 'Ajustes',
    navTestId: 'nav-pill-about',
    headerSelector: '.settings-header-surface',
    prepare: seedSettingsState,
    afterNavigation: async (page) => {
      await page.locator('[data-testid="settings-row-prefs"]').click();
      await expect(page.locator('.settings-header-surface')).toBeVisible();
    },
  },
];

/**
 * Horizontal overflow regression tests.
 * Runs on every configured Playwright project (mobile-small, mobile-large,
 * tablet, foldable-open, foldable-closed, desktop).
 * The viewport is already set by the project config — we just verify.
 */
test.describe('Layout — no horizontal overflow', () => {
  test('mobile page headers auto-hide while scrolling', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Header autohide only applies to mobile chrome layouts');

    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();

    const header = page.locator('.app-layout-header').first();
    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/chrome--hidden/);

    await page.mouse.wheel(0, 800);

    await expect(header, `Expected header to hide on ${testInfo.project.name} after downward scroll`).toHaveClass(/chrome--hidden/);
  });

  test('home sticky header auto-hides while scrolling on mobile', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Home sticky header autohide only applies to mobile chrome layouts');

    const header = page.locator('[data-testid="home-sticky-header"]').first();
    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/chrome--hidden/);

    await page.mouse.wheel(0, 800);

    await expect(header, `Expected home sticky header to hide on ${testInfo.project.name} after downward scroll`).toHaveClass(/chrome--hidden/);
  });

  test('game detail keeps the bottom nav unavailable on mobile', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Game detail bottom nav only applies to mobile chrome layouts');

    await openGame(page, 'uno-family', 'uno');
    await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();

    const header = page.locator('.detail .hdr').first();
    const nav = page.locator('.nav');

    await expect(header).toBeVisible();
    await expect(nav, `Expected bottom nav to stay unavailable on ${testInfo.project.name}`).toHaveCount(0);
  });

  test('game detail header stays in page flow and ignores scroll auto-hide', async ({ page }, testInfo) => {
    await openGame(page, 'uno-family', 'uno');
    await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();

    const wrapper = page.locator('.detail-wrapper').first();
    const chrome = page.locator('.detail-chrome').first();
    const header = page.locator('.detail-header').first();
    await expect(chrome).toBeVisible();
    await expect(header).toBeVisible();
    await expect(chrome).not.toHaveClass(/chrome--hidden/);
    await expect(header).not.toHaveClass(/chrome--hidden/);

    await wrapper.evaluate((node) => {
      const body = node.querySelector('.tbody');
      if (body instanceof HTMLElement) body.style.minHeight = '1400px';
      node.scrollTop = 360;
      node.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect.poll(() => wrapper.evaluate((node) => node.scrollTop)).toBeGreaterThan(50);
    await page.waitForTimeout(500);

    await expect(chrome, `Expected game detail chrome to ignore scroll auto-hide on ${testInfo.project.name}`).not.toHaveClass(/chrome--hidden/);
    await expect(header, `Expected game detail header to ignore scroll auto-hide on ${testInfo.project.name}`).not.toHaveClass(/chrome--hidden/);

    const scrolledBox = await chrome.boundingBox();
    expect(scrolledBox, 'game detail chrome should have a measurable box after scrolling').toBeTruthy();
    expect(scrolledBox.y, `Expected game detail chrome to scroll out of view on ${testInfo.project.name}`).toBeLessThan(-50);

    await wrapper.evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect.poll(() => wrapper.evaluate((node) => node.scrollTop)).toBe(0);

    const topBox = await chrome.boundingBox();
    expect(topBox, 'game detail chrome should have a measurable box at the top').toBeTruthy();
    expect(topBox.y, `Expected game detail chrome to return to the page top on ${testInfo.project.name}`).toBeGreaterThanOrEqual(-1);
    expect(topBox.y, `Expected game detail chrome to return to the page top on ${testInfo.project.name}`).toBeLessThanOrEqual(8);
  });

  test('rules sticky header keeps search inside the header and auto-hides on mobile', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Rules sticky header only applies to mobile chrome layouts');

    await page.locator('[data-testid="nav-pill-rules"]').click();
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    const header = page.locator('[data-testid="rules-sticky-header"]').first();
    await expect(header).toBeVisible();
    await expect(header.locator('.search-inp')).toBeVisible();
    await expect(header).not.toHaveClass(/chrome--hidden/);

    await page.mouse.wheel(0, 800);

    await expect(header, `Expected rules sticky header to hide on ${testInfo.project.name} after downward scroll`).toHaveClass(/chrome--hidden/);
  });

  test('rules sticky header and bottom nav auto-hide together on touch scroll', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Touch chrome autohide only applies to mobile chrome layouts');

    await page.locator('[data-testid="nav-pill-rules"]').click();
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    const header = page.locator('[data-testid="rules-sticky-header"]').first();
    const nav = page.locator('.nav').first();
    await expect(header).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(header).not.toHaveClass(/chrome--hidden/);
    await expect(nav).not.toHaveClass(/nav--hidden/);

    await dispatchTouchScroll(page);
    await page.waitForTimeout(80);

    await expect(header, `Expected rules header to hide with touch scroll on ${testInfo.project.name}`).toHaveClass(/chrome--hidden/);
    await expect(nav, `Expected bottom nav to hide with touch scroll on ${testInfo.project.name}`).toHaveClass(/nav--hidden/);
  });

  for (const surface of syncedChromeSurfaces) {
    test(`${surface.name} sticky header and bottom nav auto-hide and reveal together on touch scroll`, async ({ page }, testInfo) => {
      test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Touch chrome autohide only applies to mobile chrome layouts');

      await surface.prepare?.(page);
      await page.locator(`[data-testid="${surface.navTestId}"]`).click();
      await expect(page.locator(`[data-testid="${surface.navTestId}"].active`)).toBeVisible();
      await surface.afterNavigation?.(page);

      const header = page.locator(surface.headerSelector).first();
      const nav = page.locator('.nav').first();
      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to start visible on ${testInfo.project.name}`);

      await dispatchTouchScroll(page, 'down');
      await expectChromeSynced(header, nav, true, `Expected ${surface.name} header and bottom nav to hide together on ${testInfo.project.name}`);

      await dispatchTouchScroll(page, 'up');
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} header and bottom nav to reveal together on ${testInfo.project.name}`);
    });

    test(`${surface.name} sticky header and bottom nav stay together near scroll edges`, async ({ page }, testInfo) => {
      test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Mobile chrome edge behavior only applies to mobile layouts');

      await surface.prepare?.(page);
      await page.locator(`[data-testid="${surface.navTestId}"]`).click();
      await expect(page.locator(`[data-testid="${surface.navTestId}"].active`)).toBeVisible();
      await surface.afterNavigation?.(page);

      const header = page.locator(surface.headerSelector).first();
      const nav = page.locator('.nav').first();
      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();

      await scrollAppContentTo(page, 'near-bottom');
      await dispatchTouchScroll(page, 'down');
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to stay visible near page end on ${testInfo.project.name}`);

      await scrollAppContentTo(page, 'near-top');
      await dispatchTouchScroll(page, 'up');
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to stay visible near page top on ${testInfo.project.name}`);
    });

    test(`${surface.name} sticky header and bottom nav reappear after scrolling stops`, async ({ page }, testInfo) => {
      test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Touch chrome autohide only applies to mobile chrome layouts');

      await surface.prepare?.(page);
      await page.locator(`[data-testid="${surface.navTestId}"]`).click();
      await expect(page.locator(`[data-testid="${surface.navTestId}"].active`)).toBeVisible();
      await surface.afterNavigation?.(page);

      const header = page.locator(surface.headerSelector).first();
      const nav = page.locator('.nav').first();
      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();

      const scroller = page.locator('.app-content-inner').first();
      const startScrollTop = await scroller.evaluate((node) => node.scrollTop);
      await dispatchTouchScroll(page, 'down');
      await expect
        .poll(() => scroller.evaluate((node) => node.scrollTop), {
          message: `Expected ${surface.name} content to scroll down on ${testInfo.project.name}`,
        })
        .toBeGreaterThan(startScrollTop + 20);
      await page.waitForTimeout(560);
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to reappear soon after scrolling stops on ${testInfo.project.name}`);

      const box = await header.boundingBox();
      expect(box, `${surface.name} header should have a measurable box after scroll settles`).toBeTruthy();
      expect(box.y, `${surface.name} header should remain anchored near the viewport top after scroll settles`).toBeGreaterThanOrEqual(-1);
      expect(box.y, `${surface.name} header should remain anchored near the viewport top after scroll settles`).toBeLessThanOrEqual(8);
    });

    test(`${surface.name} sticky header keeps reappearing while scrolling down the page`, async ({ page }, testInfo) => {
      test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Touch chrome autohide only applies to mobile chrome layouts');

      await surface.prepare?.(page);
      await page.locator(`[data-testid="${surface.navTestId}"]`).click();
      await expect(page.locator(`[data-testid="${surface.navTestId}"].active`)).toBeVisible();
      await surface.afterNavigation?.(page);

      const header = page.locator(surface.headerSelector).first();
      const nav = page.locator('.nav').first();
      const scroller = page.locator('.app-content-inner').first();
      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();

      for (let step = 0; step < 4; step += 1) {
        const startScrollTop = await scroller.evaluate((node) => node.scrollTop);
        await dispatchTouchScroll(page, 'down');
        await expect
          .poll(() => scroller.evaluate((node) => node.scrollTop), {
            message: `Expected ${surface.name} content to keep scrolling down at step ${step + 1} on ${testInfo.project.name}`,
          })
          .toBeGreaterThan(startScrollTop + 20);
        await page.waitForTimeout(560);
        await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to reappear after scroll step ${step + 1} on ${testInfo.project.name}`);

        const box = await header.boundingBox();
        expect(box, `${surface.name} header should have a measurable box after scroll step ${step + 1}`).toBeTruthy();
        expect(box.y, `${surface.name} header should stay anchored after scroll step ${step + 1}`).toBeGreaterThanOrEqual(-1);
        expect(box.y, `${surface.name} header should stay anchored after scroll step ${step + 1}`).toBeLessThanOrEqual(8);
      }
    });

    test(`${surface.name} sticky header auto-hides while scrolling up the page`, async ({ page }, testInfo) => {
      test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Touch chrome autohide only applies to mobile chrome layouts');

      await surface.prepare?.(page);
      await page.locator(`[data-testid="${surface.navTestId}"]`).click();
      await expect(page.locator(`[data-testid="${surface.navTestId}"].active`)).toBeVisible();
      await surface.afterNavigation?.(page);

      const header = page.locator(surface.headerSelector).first();
      const nav = page.locator('.nav').first();
      const scroller = page.locator('.app-content-inner').first();
      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();
      await page.locator('[data-testid="app-section-transition"]').evaluate((node) => {
        node.style.minHeight = '1800px';
      });

      await scroller.evaluate((node) => {
        node.scrollTop = Math.min(900, node.scrollHeight - node.clientHeight - 80);
        node.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await page.waitForTimeout(560);
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to start visible before upward scroll on ${testInfo.project.name}`);

      for (let step = 0; step < 2; step += 1) {
        const startScrollTop = await scroller.evaluate((node) => node.scrollTop);
        await dispatchTouchScroll(page, 'up');
        await expect
          .poll(() => scroller.evaluate((node) => node.scrollTop), {
            message: `Expected ${surface.name} content to scroll up at step ${step + 1} on ${testInfo.project.name}`,
          })
          .toBeLessThan(startScrollTop - 20);
        await expectChromeSynced(header, nav, true, `Expected ${surface.name} chrome to hide while scrolling up at step ${step + 1} on ${testInfo.project.name}`);
        await page.waitForTimeout(560);
        await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to reappear after upward scroll step ${step + 1} on ${testInfo.project.name}`);
      }

      await scroller.evaluate((node) => {
        node.scrollTop = 0;
        node.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await dispatchTouchScroll(page, 'up');
      await page.waitForTimeout(80);
      await expectChromeSynced(header, nav, false, `Expected ${surface.name} chrome to stay visible at the page top on ${testInfo.project.name}`);
    });
  }

  test('mobile chrome stays visible when scrolling down at the page end', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Mobile chrome edge behavior only applies to mobile layouts');

    await page.locator('[data-testid="nav-pill-rules"]').click();
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    const header = page.locator('[data-testid="rules-sticky-header"]').first();
    const nav = page.locator('.nav').first();
    const scroller = page.locator('.app-content').first();
    await expect(header).toBeVisible();
    await expect(nav).toBeVisible();

    await scroller.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      node.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(80);

    await expect(header, `Expected header to stay visible at page end on ${testInfo.project.name}`).not.toHaveClass(/chrome--hidden/);
    await expect(nav, `Expected bottom nav to stay visible at page end on ${testInfo.project.name}`).not.toHaveClass(/nav--hidden/);
  });

  test('rules sticky header stays anchored in the viewport after touch scrolling', async ({ page }, testInfo) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Sticky section headers only apply to mobile chrome layouts');

    await page.locator('[data-testid="nav-pill-rules"]').click();
    await expect(page.locator('[data-testid="nav-pill-rules"].active')).toBeVisible();

    const header = page.locator('[data-testid="rules-sticky-header"]').first();
    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/chrome--hidden/);

    await dispatchTouchScroll(page);
    await expect(header, `Expected rules header to hide while scrolling on ${testInfo.project.name}`).toHaveClass(/chrome--hidden/);
    await expect(header, `Expected rules header to reappear after scroll settles on ${testInfo.project.name}`).not.toHaveClass(/chrome--hidden/, { timeout: 1200 });
    await page.waitForTimeout(350);

    const box = await header.boundingBox();
    expect(box, 'rules header should have a measurable box after scrolling').toBeTruthy();
    expect(box.y, `Expected rules header to remain anchored near the viewport top on ${testInfo.project.name}`).toBeGreaterThanOrEqual(-1);
    expect(box.y, `Expected rules header to remain anchored near the viewport top on ${testInfo.project.name}`).toBeLessThanOrEqual(8);
  });

  test('home tab keeps page chrome visible and compact', async ({ page }) => {
    await expect(page.locator('.nav')).toBeVisible();
    await expect(page.locator('[data-testid="nav-pill-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-pill-home"].active')).toBeVisible();
    await expect(page.locator('.nav-overlay')).toHaveCount(0);
    await expectFullyInViewport(page.locator('.hdr').first(), page, 'home header');
    await expectMobilePillChrome(page.locator('.hdr').first(), page, 'home header');
    await expectFullyInViewport(page.locator('.home-action-card').first(), page, 'featured home surface');
    await expectFullyInViewport(page.locator('.home-catalog-group').first(), page, 'home catalog surface');
    await expectNoOverflow(page, 'home tab');
  });

  test('mobile bottom nav matches the header glass transparency and blur', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Bottom nav/header glass parity only applies to mobile layouts');

    const headerSurface = page.locator('.home-header-surface').first();
    const nav = page.locator('.nav').first();
    await expect(headerSurface).toBeVisible();
    await expect(nav).toBeVisible();

    const headerGlass = await getGlassChrome(headerSurface);
    const navGlass = await getGlassChrome(nav);

    expect(navGlass, 'bottom nav should use the same glass surface as the mobile header').toEqual(headerGlass);
  });

  test('group section stays within viewport width', async ({ page }) => {
    await page.locator('[data-testid="group-uno-family"]').scrollIntoViewIfNeeded();
    await expectFullyInViewport(page.locator('[data-testid="group-uno-family"]').first(), page, 'group section');
    await expectFullyInViewport(page.locator('[data-testid="game-uno"]').first(), page, 'game row');
    await expectNoOverflow(page, 'group section');
  });

  test('catalog groups keep a non-rail layout while the recent cards remain horizontally scrollable', async ({ page }) => {
    await seedHomeState(page);

    const recentStack = page.locator('.home-rail-shell .home-card-stack').first();
    const catalogStack = page.locator('[data-testid="group-cards"]').locator('xpath=following-sibling::div[1]');

    await expect
      .poll(() => recentStack.evaluate((el) => ({
        display: getComputedStyle(el).display,
        flexWrap: getComputedStyle(el).flexWrap,
        overflowX: getComputedStyle(el).overflowX,
      })))
      .toEqual({
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
      });

    await expect
      .poll(() => catalogStack.evaluate((el) => ({
        display: getComputedStyle(el).display,
        overflowX: getComputedStyle(el).overflowX,
        scrollable: el.scrollWidth > el.clientWidth,
      })))
      .toEqual({
        display: 'grid',
        overflowX: 'visible',
        scrollable: false,
      });

    await expect(page.locator('[data-testid="game-uno-catalog"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="game-truco-catalog"]')).toHaveCount(0);
    await expectFullyInViewport(page.locator('[data-testid="game-chinchon"]').first(), page, 'catalog card');
    await expectNoOverflow(page, 'catalog stack layout');
  });

  test('game detail keeps compact header and surface stack', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) < 900) {
      await expect(page.locator('.nav')).toHaveCount(0);
    } else {
      await expect(page.locator('.nav')).toBeVisible();
    }
    await expect(page.locator('.nav-overlay')).toHaveCount(0);
    await expectFullyInViewport(page.locator('.hdr').first(), page, 'game detail header');
    await expectMobilePillChrome(page.locator('.hdr').first(), page, 'game detail header');
    await expectFullyInViewport(page.locator('.tabs').first(), page, 'game detail tabs');
    await expectFullyInViewport(page.locator('.tbody').first(), page, 'game detail body');
    await expectFullyInViewport(page.locator('[data-testid="player-input"]').first(), page, 'game detail input row');
    await expectNoOverflow(page, 'game detail');
  });

  test('uno scoreboard prioritizes player name visibility on narrow screens', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 900, 'Scoreboard name compression is only critical on narrow mobile layouts');

    await openGame(page, 'uno-family', 'uno');
    await fillPlayers(page, ['Alejandra', 'Maximiliano']);
    await page.getByTestId('add-player').click();
    await page.locator('[data-testid="player-input"]').nth(2).fill('Valentina');

    const widths = await page.locator('.sbname').evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().width),
    );
    expect(widths.every((value) => value > 48)).toBe(true);
  });

  test('about tab keeps header and dense surfaces readable', async ({ page }) => {
    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    await expect(page.locator('.nav')).toBeVisible();
    await expect(page.locator('.nav-overlay')).toHaveCount(0);
    await expectFullyInViewport(page.locator('.hdr').first(), page, 'about header');
    await expectMobilePillChrome(page.locator('.hdr').first(), page, 'about header');
    await expectFullyInViewport(page.locator('.settings-row').first(), page, 'settings landing row');
    await expectFullyInViewport(page.locator('.about-card').first(), page, 'settings dense card');
    await expectNoOverflow(page, 'about tab');
  });

  test('champions tab preserves nav stability and no clipping', async ({ page }) => {
    await page.locator('[data-testid="nav-pill-champs"]').click();
    await expect(page.locator('[data-testid="nav-pill-champs"].active')).toBeVisible();
    await expect(page.locator('.nav')).toBeVisible();
    await expect(page.locator('.nav-overlay')).toHaveCount(0);
    await expectFullyInViewport(page.locator('[data-testid="champs-sticky-header"]').first(), page, 'champions sticky header');
    await expectFullyInViewport(page.locator('.champ-section').first(), page, 'champions section');
    await expectFullyInViewport(page.locator('.no-champs, .podium, .champ-by-game').first(), page, 'champions content');
    await expectNoOverflow(page, 'champions tab');
  });

  test('section chrome remains anchored while desktop content scrolls', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop sticky chrome regression');

    await seedChampsState(page);
    await page.locator('[data-testid="nav-pill-champs"]').click();
    await expect(page.locator('[data-testid="nav-pill-champs"].active')).toBeVisible();

    const header = page.locator('[data-testid="champs-sticky-header"]').first();
    const scroller = page.locator('.app-content-inner').first();
    await expect(header).toBeVisible();
    await page.locator('.page').first().evaluate((node) => {
      node.style.minHeight = '1600px';
    });

    await scroller.evaluate((node) => {
      node.scrollTop = 420;
      node.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);

    const box = await header.boundingBox();
    expect(box, 'champions header should have a measurable box after desktop scroll').toBeTruthy();
    expect(box.y, 'champions header should remain anchored near the viewport top on desktop').toBeGreaterThanOrEqual(-1);
    expect(box.y, 'champions header should remain anchored near the viewport top on desktop').toBeLessThanOrEqual(8);
  });

  test('shared page gutter densifies on tablet without changing single-column flow', async ({ page }, testInfo) => {
    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    const pagePadding = await getInlinePadding(page, '.page');

    if (['tablet', 'desktop'].includes(testInfo.project.name)) {
      expect(pagePadding.left).toBeGreaterThanOrEqual(24);
      expect(pagePadding.right).toBeGreaterThanOrEqual(24);
    } else {
      expect(pagePadding.left).toBeLessThanOrEqual(20);
      expect(pagePadding.right).toBeLessThanOrEqual(20);
    }

    const contentBox = await page.locator('.page').boundingBox();
    expect(contentBox?.width).toBeLessThanOrEqual(page.viewportSize().width);
  });
});
