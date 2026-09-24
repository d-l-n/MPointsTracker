import { test, expect } from '@playwright/test';
import { fillPlayers } from './helpers.js';

/**
 * Share E2E against LOCAL emulators (Firestore + Auth), not production.
 * Run: npm run test:share  (wraps this in `firebase emulators:exec`)
 *
 * Covers the host → share → poll flow that guest-mode tests can't: a logged-in
 * host links player B, saves a match, and B receives it via the poll/focus
 * pull. Includes the d6fa11c regression scenario: host reloads the app BEFORE
 * saving — linked players must survive (bgt_linked_players) and B still gets
 * the match.
 */

const EMULATOR_AUTH = 'http://127.0.0.1:9099';
const HOST = { email: 'host@test.local', password: 'pass1234', name: 'Host A' };
const BOB = { email: 'bob@test.local', password: 'pass1234', name: 'Bob' };

async function createEmulatorUser(user) {
  // Idempotent: the emulator persists accounts across runs, so fall back to a
  // sign-in when the account already exists.
  const res = await fetch(`${EMULATOR_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
  });
  if (res.ok) return res.json();
  const body = await res.json();
  if (String(body.error?.message || '').includes('EMAIL_EXISTS')) {
    const signIn = await fetch(`${EMULATOR_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
    });
    if (!signIn.ok) throw new Error(`emulator signIn failed: ${signIn.status}`);
    return signIn.json();
  }
  throw new Error(`emulator signUp failed: ${res.status} ${await res.text()}`);
}

async function setEmulatorDisplayName(idToken, displayName) {
  const res = await fetch(`${EMULATOR_AUTH}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, displayName }),
  });
  if (!res.ok) throw new Error(`emulator updateProfile failed: ${res.status}`);
}

test.describe('Shared matches (local emulators)', () => {
  // Emulator round-trips + two logged-in contexts make this suite slow.
  // Serial: every test shares the same HOST/BOB accounts, and a recipient pull
  // consumes *all* docs in their shared_matches subcollection — running tests in
  // parallel would let one test's pull swallow another test's shared match.
  test.describe.configure({ timeout: 120000, mode: "serial" });

  test.beforeAll(async () => {
    const host = await createEmulatorUser(HOST);
    await setEmulatorDisplayName(host.idToken, HOST.name);
    const bob = await createEmulatorUser(BOB);
    await setEmulatorDisplayName(bob.idToken, BOB.name);
  });

async function newAppContext(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    localStorage.setItem('bgt_splash_seen', '1');
    localStorage.setItem('bgt_install_dismissed', '1');
    localStorage.setItem('bgt_onboarding_seen', '1');
    localStorage.setItem('bgt_use_emulator', '1');
  });
  return context;
}

async function login(page, user) {
  await page.goto('/');
  const connectBtn = page.locator('.app-layout-connect-btn').first();
  try {
    await connectBtn.waitFor({ state: 'visible', timeout: 8000 });
    await connectBtn.click();
  } catch {
    // Already on the logged-out welcome screen with the email form embedded.
  }
  await page.getByRole('button', { name: /continue with email/i }).first().click();
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);
  await page.locator('[data-testid="login-submit"]').click();
  await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 20000 });
}

async function linkPlayerByName(page, name) {
  await page.getByRole('button', { name: 'Search player' }).first().click();
  await page.locator('#user-search').fill(name);
  await page.locator('.usearch-btn').click();
  const result = page.locator('.usearch-result', { hasText: name }).first();
  await result.waitFor({ state: 'visible', timeout: 10000 });
  await result.click();
  await expect(page.locator('[data-testid="linked-player-chip"]').first()).toBeVisible({ timeout: 5000 });
}

/** Open UNO through the family card → variant picker (post family-variant refactor).
 * Idempotent and race-free: after a reload the app asynchronously restores the
 * /game/uno panel, so wait for whichever arrives first — the already-open game
 * panel (tab-new) or the home catalog family card — instead of assuming a
 * fixed initial state. */
async function openUnoGame(page) {
  await Promise.race([
    page.locator('[data-testid="tab-new"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    page.locator('[data-testid="game-uno-family"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);

  const alreadyInGame = await page.locator('[data-testid="tab-new"]').first().isVisible().catch(() => false);
  if (alreadyInGame) return;

  const familyCard = page.locator('[data-testid="game-uno-family"]');
  await familyCard.waitFor({ state: 'visible', timeout: 15000 });
  await familyCard.click();
  const variant = page.locator('[data-testid="uno-family-variant-uno"]');
  await variant.waitFor({ state: 'visible', timeout: 5000 });
  await variant.click();
  await page.locator('[data-testid="tab-new"]').waitFor({ state: 'visible', timeout: 10000 });
}

async function playAndSaveUnoMatch(page) {
  await openUnoGame(page);
  // Bob occupies one roster slot as a linked chip (not a text input), so only
  // the remaining local slot is a [data-testid=player-input]. Two players
  // (linked Bob + Ana) are enough to save a UNO match.
  await fillPlayers(page, ['Ana']);
  await page.waitForTimeout(200);

  const winBtn = page.locator('[data-testid^="win-button-"]').first();
  await winBtn.waitFor({ state: 'visible', timeout: 5000 });
  await winBtn.click();
  await page.waitForTimeout(300);

  await page.locator('[data-testid="save-match"]').click();
  await page.locator('[data-testid="early-finish-modal"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="early-finish-no-winner"]').click();
  await page.locator('[data-testid="early-finish-confirm"]').click();
}

/** Read the recipient's current "N matches saved" counter from the home header. */
async function matchesSavedCount(page) {
  const text = await page.locator('.home-sub').first().textContent().catch(() => "");
  const match = (text || "").match(/(\d+)\s*matches? saved/i);
  return match ? Number(match[1]) : 0;
}

/** Trigger the recipient's shared-match pull (focus listener) and expect the match to land.
 * The toast is ephemeral (2.4s) and the recipient's own 60s interval can merge the
 * match before this check runs — or before the share doc even exists. The host can
 * also share more than one match across retries, so assert on the counter going UP
 * (or the toast appearing) instead of an absolute count. */
async function expectRecipientReceives(page, count) {
  const before = await matchesSavedCount(page);
  const toast = page.getByText(/received \d+ shared match/i).first();
  for (let i = 0; i < 12; i += 1) {
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    const toastVisible = await toast.isVisible({ timeout: 1500 }).catch(() => false);
    if (toastVisible) return;
    const now = await matchesSavedCount(page);
    if (now > before) return;
    await page.waitForTimeout(1500);
  }
  throw new Error(`recipient did not receive the shared match (before=${before}, expected >= ${before + count})`);
}

/** Read every match id currently stored locally (any game). */
async function localMatchIds(page) {
  return page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('bgt_v6') || '{}');
    return Object.values(data)
      .filter(Array.isArray)
      .flat()
      .map((match) => match && match.id)
      .filter(Boolean);
  });
}

/**
 * Id of the match saved at/after `sinceMs` for a game. Identifies the match we
 * just saved even when cloud data from previous runs lingers in the emulator.
 */
async function waitForMatchSavedAfter(page, gid, sinceMs) {
  for (let i = 0; i < 10; i += 1) {
    const id = await page.evaluate(({ gameId, since }) => {
      const data = JSON.parse(localStorage.getItem('bgt_v6') || '{}');
      const list = Array.isArray(data[gameId]) ? data[gameId] : [];
      const fresh = list
        .filter((match) => match && match.date && new Date(match.date).getTime() >= since)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return fresh && fresh.id;
    }, { gameId: gid, since: sinceMs });
    if (id) return id;
    await page.waitForTimeout(500);
  }
  throw new Error(`no match saved after ${new Date(sinceMs).toISOString()} was found`);
}

/** Wait until the page's local store contains `matchId`, dispatching the focus pull each round. */
async function expectMatchPresent(page, matchId) {
  for (let i = 0; i < 12; i += 1) {
    const ids = await localMatchIds(page);
    if (ids.includes(matchId)) return;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(1500);
  }
  throw new Error(`match ${matchId} was not received`);
}

/**
 * Wait until a match disappears from the page's local store, triggering the
 * focus pull each round (that is what makes the recipient consume the deletion
 * tombstone without waiting for the 60s interval).
 */
async function expectMatchGone(page, matchId) {
  for (let i = 0; i < 12; i += 1) {
    const ids = await localMatchIds(page);
    if (!ids.includes(matchId)) return;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(1500);
  }
  throw new Error(`match ${matchId} was not removed from local storage`);
}

/**
 * Wait until the stored match was REPLACED by the propagated edit: exactly one
 * entry with the id (no duplicate appended) and its content reflects the edit.
 */
async function expectMatchUpdated(page, matchId, expectedNote) {
  for (let i = 0; i < 12; i += 1) {
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    const ok = await page.evaluate(
      ({ id, expected }) => {
        const data = JSON.parse(localStorage.getItem('bgt_v6') || '{}');
        const matches = Object.values(data)
          .filter(Array.isArray)
          .flat()
          .filter((match) => match && match.id === id);
        return matches.length === 1 && typeof matches[0].note === "string" && matches[0].note.includes(expected);
      },
      { id: matchId, expected: expectedNote },
    );
    if (ok) return;
    await page.waitForTimeout(1500);
  }
  throw new Error(`match ${matchId} was not replaced by the edited copy (note "${expectedNote}")`);
}

test('host deletes a shared match and the recipient loses it on the next pull', async ({ browser }) => {
    const ctxB = await newAppContext(browser);
    const pageB = await ctxB.newPage();
    await login(pageB, BOB);

    const ctxA = await newAppContext(browser);
    const pageA = await ctxA.newPage();
    await login(pageA, HOST);

    // Host links B, plays and saves → B receives the match.
    await openUnoGame(pageA);
    await linkPlayerByName(pageA, BOB.name);
    const savedSince = Date.now() - 2000;
    await playAndSaveUnoMatch(pageA);

    const matchId = await waitForMatchSavedAfter(pageA, 'uno', savedSince);
    expect(matchId).toBeTruthy();
    await expectMatchPresent(pageB, matchId);

    // Host deletes it from the history page (the delete is committed after the
    // 5s undo window, so poll until it leaves the host's own store too).
    await pageA.goto('/history');
    await pageA.locator('[data-testid="history-subpage"]').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.locator(`[data-testid="delete-match-${matchId}"]`).click();
    await pageA.locator('.modal-confirm').click();
    await expectMatchGone(pageA, matchId);

    // Recipient pulls the tombstone and drops its copy.
    await expectMatchGone(pageB, matchId);

    await ctxA.close();
    await ctxB.close();
  });

test('host links player B, saves a match, B receives it via focus poll', async ({ browser }) => {
    const ctxB = await newAppContext(browser);
    const pageB = await ctxB.newPage();
    await login(pageB, BOB);

    const ctxA = await newAppContext(browser);
    const pageA = await ctxA.newPage();
    await login(pageA, HOST);

    await openUnoGame(pageA);
    await linkPlayerByName(pageA, BOB.name);
    await playAndSaveUnoMatch(pageA);

    await expectRecipientReceives(pageB, 1);

    await ctxA.close();
    await ctxB.close();
  });

  test('host edits a shared match and the recipient gets the updated copy on the next pull', async ({ browser }) => {
    const ctxB = await newAppContext(browser);
    const pageB = await ctxB.newPage();
    await login(pageB, BOB);

    const ctxA = await newAppContext(browser);
    const pageA = await ctxA.newPage();
    await login(pageA, HOST);

    // Host links B, plays and saves → B receives the match.
    await openUnoGame(pageA);
    await linkPlayerByName(pageA, BOB.name);
    const savedSince = Date.now() - 2000;
    await playAndSaveUnoMatch(pageA);

    const matchId = await waitForMatchSavedAfter(pageA, 'uno', savedSince);
    expect(matchId).toBeTruthy();
    await expectMatchPresent(pageB, matchId);

    // Host edits the match (adds a note) from the history page.
    await pageA.goto('/history');
    await pageA.locator('[data-testid="history-subpage"]').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.locator(`[data-testid="edit-match-${matchId}"]`).click();
    await pageA.locator('#edit-note').fill('EDITADO');
    await pageA.locator('button.btnpri', { hasText: /guardar cambios|save changes/i }).click();
    await pageA.locator('button.btnpri', { hasText: /guardar cambios|save changes/i }).waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // Recipient pulls the updated copy and REPLACES the old one (never a duplicate).
    await expectMatchUpdated(pageB, matchId, 'EDITADO');

    await ctxA.close();
    await ctxB.close();
  });

  test('regression d6fa11c: linked players survive a reload before saving, B still receives', async ({ browser }) => {
    const ctxB = await newAppContext(browser);
    const pageB = await ctxB.newPage();
    await login(pageB, BOB);

    const ctxA = await newAppContext(browser);
    const pageA = await ctxA.newPage();
    await login(pageA, HOST);

    // Link B, then kill the tab (reload) BEFORE saving any match.
    await openUnoGame(pageA);
    await linkPlayerByName(pageA, BOB.name);
    await pageA.reload();
    await pageA.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: 'visible', timeout: 20000 });

    // Linked players must survive in bgt_linked_players → chip restored.
    await openUnoGame(pageA);
    await expect(pageA.locator('[data-testid="linked-player-chip"]').first()).toBeVisible({ timeout: 5000 });

    await playAndSaveUnoMatch(pageA);
    await expectRecipientReceives(pageB, 1);

    await ctxA.close();
    await ctxB.close();
  });
});