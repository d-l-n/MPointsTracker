/**
 * Shared test helpers for MPoints Tracker E2E suite.
 * All selectors use data-testid where possible; text fallbacks are
 * language-agnostic regex patterns that match ES + EN.
 */

/**
 * Open a specific game card from the home catalog.
 * @param {import('@playwright/test').Page} page
 * @param {string} groupKey  - e.g. "uno-family", "cards", "casino", "random"
 * @param {string} gameId    - e.g. "uno", "truco", "blackjack"
 */
export async function openGame(page, groupKey, gameId) {
  const overlay = page.locator('.nav-overlay');
  const overlayVisible = await overlay.isVisible({ timeout: 500 }).catch(() => false);
  if (overlayVisible) {
    await overlay.click({ force: true });
    await page.waitForTimeout(250);
  }

  const currentPath = (() => {
    try {
      return new URL(page.url()).pathname;
    } catch {
      return "";
    }
  })();
  if (currentPath.endsWith(`/game/${gameId}`)) {
    await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return;
  }

  const header = page.locator(`[data-testid="group-${groupKey}"]`);
  const ensureHomeCatalog = async () => {
    const alreadyVisible = await header.isVisible({ timeout: 3000 }).catch(() => false);
    if (alreadyVisible) return;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const visible = await header.isVisible({ timeout: 500 }).catch(() => false);
      if (visible) return;

      const homeNav = page.locator('[data-testid="nav-pill-home"]');
      const canGoHome = await homeNav.isVisible({ timeout: 1000 }).catch(() => false);
      if (!canGoHome) break;

      await homeNav.click({ force: true });
      await page.waitForTimeout(300);
    }
  };

  await ensureHomeCatalog();
  await header.waitFor({ state: 'visible', timeout: 10000 });

  const gameCard = page.locator(`[data-testid="game-${gameId}"]`);
  const isVisible = await gameCard.isVisible({ timeout: 500 }).catch(() => false);
  if (!isVisible) {
    await header.scrollIntoViewIfNeeded();
    await gameCard.waitFor({ state: 'visible', timeout: 10000 });
  }

  await gameCard.scrollIntoViewIfNeeded();
  await gameCard.evaluate((el) => el.click());

  const waitForGamePanel = () => Promise.any([
    page.locator('[data-testid="tab-new"]').waitFor({ state: 'visible', timeout: 10000 }),
    page.locator('[data-testid="player-input"]').first().waitFor({ state: 'visible', timeout: 10000 }),
  ]);

  try {
    await waitForGamePanel();
  } catch {
    await gameCard.evaluate((el) => el.click());
    await waitForGamePanel();
  }
}

/**
 * Fill player name inputs inside the active game panel.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} names
 */
export async function fillPlayers(page, names) {
  const inputs = page.locator('[data-testid="player-input"]');
  for (let i = 0; i < names.length; i++) {
    const input = inputs.nth(i);
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(names[i]);
  }
}

/**
 * Click the primary "Start match" button (ES: Iniciar | EN: Start).
 * @param {import('@playwright/test').Page} page
 */
export async function startMatch(page) {
  await page.locator('button').filter({ hasText: /iniciar|start/i }).first().click();
}

/**
 * Click the primary "Save match" button (ES: Guardar | EN: Save).
 * @param {import('@playwright/test').Page} page
 */
export async function saveMatch(page) {
  await page.locator('[data-testid="save-match"]').click();
}

/**
 * Navigate to a tab inside a game detail panel.
 * @param {import('@playwright/test').Page} page
 * @param {'new'|'stats'} tabId
 */
export async function goToTab(page, tabId) {
  const tab = page.locator(`[data-testid="tab-${tabId}"]`);
  await tab.waitFor({ state: 'visible', timeout: 5000 });
  await tab.scrollIntoViewIfNeeded();
  await tab.evaluate((el) => el.click());
}

/**
 * Check for horizontal overflow at the current viewport size.
 * Returns true if overflow is detected.
 * @param {import('@playwright/test').Page} page
 */
export async function hasHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

/**
 * Check that no element's right edge exceeds the viewport width.
 * Returns the first offending element's tag+class, or null if clean.
 * @param {import('@playwright/test').Page} page
 */
export async function getOverflowingElement(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('*')];
    const bad = els.find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.right > window.innerWidth + 1;
    });
    if (!bad) return null;
    return `${bad.tagName.toLowerCase()}${bad.className ? '.' + bad.className.split(' ').join('.') : ''}`;
  });
}

/**
 * Enter guest mode when the auth screen is visible.
 * @param {import('@playwright/test').Page} page
 */
export async function enterGuestIfNeeded(page) {
  try {
    const guestBtn = page.locator('[data-testid="guest-btn"]')
      .or(page.locator('button').filter({ hasText: /sin cuenta|without account/i }))
      .first();
    await guestBtn.waitFor({ state: 'visible', timeout: 8000 });
    await guestBtn.click();
  } catch { /* already past auth */ }
}

/**
 * Wait until the app nav shell is available.
 * @param {import('@playwright/test').Page} page
 */
export async function waitForShell(page) {
  await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Seed match history in localStorage, reload, and restore the guest shell.
 * @param {import('@playwright/test').Page} page
 * @param {string} seed
 */
export async function reloadWithSeed(page, seed) {
  await page.context().addInitScript((value) => {
    localStorage.setItem('bgt_v6', value);
  }, seed);

  await page.reload();
  await enterGuestIfNeeded(page);
  await waitForShell(page);
}
