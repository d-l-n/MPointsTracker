import { test, expect } from "@playwright/test";

const SEEDED_HISTORY = JSON.stringify({
  uno: [
    {
      id: "uno-public-profile-1",
      game: "uno",
      date: new Date("2026-01-05T10:00:00.000Z").toISOString(),
      players: [
        { name: "Ana Self", score: 240 },
        { name: "Beto Rival", score: 500 },
      ],
      rounds: 4,
      winner: "Beto Rival",
    },
    {
      id: "uno-public-profile-2",
      game: "uno",
      date: new Date("2026-01-06T10:00:00.000Z").toISOString(),
      players: [
        { name: "Ana Self", score: 500 },
        { name: "Beto Rival", score: 180 },
      ],
      rounds: 3,
      winner: "Ana Self",
    },
  ],
});

const SEEDED_GROUPS = JSON.stringify([
  {
    name: "Rivales",
    players: [{ name: "Beto Rival", uid: "user-beto" }],
  },
]);

async function seedPublicProfileState(page) {
  await page.context().addInitScript(({ history, groups }) => {
    window.__MP_TEST_AUTH_USER__ = {
      uid: "user-ana",
      displayName: "Ana Self",
      email: "ana@example.test",
      photoURL: null,
    };
    window.__MP_TEST_PUBLIC_PROFILES__ = {
      "user-ana": {
        displayName: "Ana Self",
        email: "ana@example.test",
        publicStats: {
          totalWins: 1,
          totalMatches: 2,
          winrate: 50,
          byGame: { uno: { played: 2, wins: 1, winrate: 50 } },
        },
      },
      "user-beto": {
        displayName: "Beto Rival",
        publicStats: {
          totalWins: 1,
          totalMatches: 2,
          winrate: 50,
          byGame: { uno: { played: 2, wins: 1, winrate: 50 } },
        },
      },
    };
    localStorage.setItem("bgt_v6", history);
    localStorage.setItem("bgt_player_groups", groups);
    localStorage.setItem("bgt_splash_seen", "1");
    localStorage.setItem("bgt_install_dismissed", "1");
    localStorage.removeItem("bgt_guest_mode");
    localStorage.removeItem("bgt_last_uid");
  }, { history: SEEDED_HISTORY, groups: SEEDED_GROUPS });
}

async function expectSettingsDashboard(page) {
  await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
  await expect(page.locator('[data-testid="settings-profile-stats"]')).toBeVisible();
  await expect(page.locator('[data-testid="public-profile-root"]')).toHaveCount(0);
  await expect(page.locator(".settings-header-surface")).toBeVisible();
}

async function expectPublicProfile(page, name) {
  await expect(page.locator('[data-testid="public-profile-root"]')).toBeVisible();
  await expect(page.locator(".public-profile-title")).toContainText(new RegExp(name, "i"));
  await expect(page.locator(".settings-header-surface")).toBeVisible();
}

test.describe("Public profile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await seedPublicProfileState(page);
  });

  test("opens a Champions profile, returns to Settings, then opens and closes own profile from Settings", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: "visible", timeout: 15000 });

    await page.locator('[data-testid="nav-pill-champs"]').click();
    await expect(page.locator('[data-testid="champs-sticky-header"]')).toBeVisible();
    await page.locator(".podium-row", { hasText: /beto rival/i }).click();

    await expectPublicProfile(page, "Beto Rival");
    await expect(page).toHaveURL(/\/settings\?profile=user-beto$/);

    await page.locator(".page-back-btn").click();
    await expectSettingsDashboard(page);
    await expect(page).toHaveURL(/\/settings$/);

    await page.getByRole("button", { name: /ver perfil|view profile/i }).click();
    await expectPublicProfile(page, "Ana Self");
    await expect(page).toHaveURL(/\/settings\?profile=user-ana$/);

    await page.evaluate(() => window.history.back());
    await expectSettingsDashboard(page);
    await expect(page).toHaveURL(/\/settings$/);
  });
});
