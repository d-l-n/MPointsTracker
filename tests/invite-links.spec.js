import { test, expect } from "./fixtures.js";
import { openGame } from "./helpers.js";

async function openInvite(page, code, inviteDoc) {
  await page.context().addInitScript(({ seededCode, seededInvite }) => {
    window.__MP_TEST_INVITES__ = {
      [seededCode]: seededInvite,
    };
  }, { seededCode: code, seededInvite: inviteDoc });

  await page.goto(`/?invite=${code}`);

  try {
    const guestBtn = page.locator('[data-testid="guest-btn"]')
      .or(page.locator("button").filter({ hasText: /sin cuenta|without account/i }))
      .first();
    await guestBtn.waitFor({ state: "visible", timeout: 8000 });
    await guestBtn.click();
  } catch {
    // already past auth
  }

  await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: "visible", timeout: 10000 });

  const overlay = page.locator(".nav-overlay");
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.click({ force: true });
  }
}

test.describe("Invite links", () => {
  test("shows the pending invite banner from a firestore invite code and allows dismissing it", async ({ page }) => {
    await openInvite(page, "invite-code-1", {
      uid: "invite-user-1",
      displayName: "Ana Invitada",
      photoURL: null,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    await expect(page.locator('[data-testid="pending-invite-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-invite-name"]')).toHaveText(/Ana Invitada/i);

    await page.locator('[data-testid="pending-invite-dismiss"]').click();

    await expect(page.locator('[data-testid="pending-invite-banner"]')).toHaveCount(0);
  });

  test("auto-links the invited player when opening a game", async ({ page }) => {
    await openInvite(page, "invite-code-2", {
      uid: "invite-user-2",
      displayName: "Beto Invitado",
      photoURL: null,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    await openGame(page, "uno-family", "uno");

    await expect(page.locator('[data-testid="linked-player-chip"]').first()).toContainText(/Beto Invitado/i);
    await expect(page.locator('[data-testid="pending-invite-banner"]')).toHaveCount(0);
  });
});
