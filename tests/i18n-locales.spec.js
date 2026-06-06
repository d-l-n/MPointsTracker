/**
 * i18n-locales.spec.js
 * ─────────────────────
 * Parametrised checks for each exposed locale: es, en, de, zh, ja, fr.
 *
 * Strategy: pre-seed bgt_lang via addInitScript (before page.goto) so the
 * app boots in the target locale without navigating to Settings.
 * saveLang() stores the value as JSON.stringify(lang) → '"de"' (with quotes).
 *
 * Each locale runs 6 checks:
 *   1. No raw translation keys in DOM
 *   2. unoFamily group name shows correct translation
 *   3. cardsGroup name shows correct translation
 *   4. Game detail tabs (new/stats) are translated
 *   5. addPlayer button is translated
 *   6. No horizontal overflow on home (catches long DE/ZH strings)
 *   7. No overflow after expanding UNO group
 *
 * Runs in the `logic` project (desktop, once) — not multiplied by viewport.
 */

import { test, expect } from './fixtures.js';
import { hasHorizontalOverflow, getOverflowingElement } from './helpers.js';

// ── Translation reference (extracted from translations.js) ────────────────
const LOCALES = [
  {
    code: 'es',
    unoFamily:  'Familia UNO',
    cardsGroup: 'Juegos de Cartas',
    newMatch:   'Partida',
    stats:      'Estadísticas',
    addPlayer:  '+ Agregar jugador',
  },
  {
    code: 'en',
    unoFamily:  'UNO Family',
    cardsGroup: 'Card Games',
    newMatch:   'Match',
    stats:      'Statistics',
    addPlayer:  '+ Add player',
  },
  {
    code: 'de',
    unoFamily:  'UNO-Familie',
    cardsGroup: 'Kartenspiele',
    newMatch:   'Partie',
    stats:      'Statistiken',
    addPlayer:  '+ Spieler hinzufügen',
  },
  {
    code: 'zh',
    unoFamily:  'UNO系列',
    cardsGroup: '纸牌游戏',
    newMatch:   '对战',
    stats:      '统计',
    addPlayer:  '+ 添加玩家',
  },
  {
    code: 'ja',
    unoFamily:  'UNOファミリー',
    cardsGroup: 'カードゲーム',
    newMatch:   '対戦',
    stats:      '統計',
    addPlayer:  '+ プレイヤー追加',
  },
  {
    code: 'fr',
    unoFamily:  'Famille UNO',
    cardsGroup: 'Jeux de cartes',
    newMatch:   'Partie',
    stats:      'Statistiques',
    addPlayer:  '+ Ajouter joueur',
  },
];

// Raw keys that must NEVER appear as visible text in the DOM.
// If t('unoFamily') returns 'unoFamily' it means key resolution failed.
const RAW_KEYS = [
  'unoFamily', 'cardsGroup', 'casinoGroup', 'randomGroup', 'tokensGroup', 'porcionesGroup',
  'newMatch', 'saveMatch', 'addPlayer', 'scoreboard',
  'history', 'stats', 'players', 'language', 'languageLabel',
  'confirmHand', 'won', 'startMatch', 'whoWon', 'roundLabel',
  'matchesPlayed', 'gamesCount',
];

// ── Boot helper ───────────────────────────────────────────────────────────
// Sets locale before page.goto() — faster and more reliable than UI navigation.
async function bootWithLocale(page, localeCode) {
  await page.context().addInitScript((code) => {
    localStorage.setItem('bgt_lang', JSON.stringify(code)); // saveLang format
    localStorage.setItem('bgt_splash_seen', '1');
    localStorage.setItem('bgt_install_dismissed', '1');
  }, localeCode);

  await page.goto('/');

  // Guest mode — data-testid makes this language-agnostic.
  try {
    const guestBtn = page.locator('[data-testid="guest-btn"]').first();
    await guestBtn.waitFor({ state: 'visible', timeout: 8000 });
    await guestBtn.click();
  } catch { /* already past auth */ }

  await page.locator('[data-testid^="nav-pill-"]').first()
    .waitFor({ state: 'visible', timeout: 15000 });

  // Dismiss nav overlay (desktop)
  try {
    const overlay = page.locator('.nav-overlay');
    const visible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
    if (visible) {
      await overlay.click({ force: true });
      await page.waitForTimeout(300);
    }
  } catch { /* no overlay */ }
}

// ── Open UNO game detail ──────────────────────────────────────────────────
async function openUno(page) {
  const unoGroup = page.locator('[data-testid="group-uno-family"]');
  const unoCard  = page.locator('[data-testid="game-uno"]');
  const isOpen   = await unoCard.isVisible({ timeout: 500 }).catch(() => false);
  if (!isOpen) await unoGroup.click();
  await unoCard.waitFor({ state: 'visible', timeout: 5000 });
  await unoCard.scrollIntoViewIfNeeded();
  await unoCard.evaluate((el) => el.click());
  await page.locator('[data-testid="tab-new"]').waitFor({ state: 'visible', timeout: 5000 });
}

// ── Parametrised test suite ───────────────────────────────────────────────
for (const locale of LOCALES) {
  test.describe(`i18n — ${locale.code.toUpperCase()}`, () => {

    test(`[${locale.code}] no raw translation keys in DOM`, async ({ page }) => {
      await bootWithLocale(page, locale.code);

      const bodyText = await page.locator('body').innerText();

      const leaked = RAW_KEYS.filter(k =>
        // Word-boundary match to avoid catching "stats" inside "Statistics"
        new RegExp(`\\b${k}\\b`).test(bodyText)
      );

      expect(
        leaked,
        `[${locale.code}] Raw keys visible in DOM: ${leaked.join(', ')}`
      ).toHaveLength(0);
    });

    test(`[${locale.code}] unoFamily group name is translated`, async ({ page }) => {
      await bootWithLocale(page, locale.code);

      await expect(page.locator('[data-testid="group-uno-family"]'))
        .toContainText(locale.unoFamily, { timeout: 5000 });
    });

    test(`[${locale.code}] cardsGroup name is translated`, async ({ page }) => {
      await bootWithLocale(page, locale.code);

      await expect(page.locator('[data-testid="group-cards"]'))
        .toContainText(locale.cardsGroup, { timeout: 5000 });
    });

    test(`[${locale.code}] game detail tabs are translated`, async ({ page }) => {
      await bootWithLocale(page, locale.code);
      await openUno(page);

      await expect(page.locator('[data-testid="tab-new"]'))
        .toContainText(locale.newMatch, { timeout: 5000 });
      await expect(page.locator('[data-testid="tab-stats"]'))
        .toContainText(locale.stats,    { timeout: 5000 });
      await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
    });

    test(`[${locale.code}] addPlayer button is translated`, async ({ page }) => {
      await bootWithLocale(page, locale.code);
      await openUno(page);

      await expect(page.locator('[data-testid="add-player"]'))
        .toContainText(locale.addPlayer, { timeout: 5000 });
    });

    test(`[${locale.code}] no overflow on home`, async ({ page }) => {
      await bootWithLocale(page, locale.code);
      await page.waitForTimeout(300);

      const overflow = await hasHorizontalOverflow(page);
      if (overflow) {
        const el = await getOverflowingElement(page);
        expect(overflow, `[${locale.code}] overflow on home — element: ${el}`).toBeFalsy();
      }
    });

    test(`[${locale.code}] no overflow after expanding UNO group`, async ({ page }) => {
      await bootWithLocale(page, locale.code);
      await page.locator('[data-testid="group-uno-family"]').click();
      await page.waitForTimeout(300);

      const overflow = await hasHorizontalOverflow(page);
      if (overflow) {
        const el = await getOverflowingElement(page);
        expect(overflow, `[${locale.code}] overflow in expanded group — element: ${el}`).toBeFalsy();
      }
    });

  });
}
