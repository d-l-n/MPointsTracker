import { test, expect } from "../fixtures.js";
import { openGame, fillPlayers } from "../helpers.js";

async function startThreePlayerSushiDo(page) {
  await openGame(page, "cards", "sushi_do");
  await page.locator('[data-testid="add-player"]').click();
  await fillPlayers(page, ["Ana", "Beto", "Carla"]);
  await page.locator('[data-testid="sushi-do-start"]').click();
}

async function dismissNavOverlay(page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const overlay = page.locator(".nav-overlay");
    const visible = await overlay.isVisible({ timeout: 500 }).catch(() => false);
    if (!visible) return;
    await overlay.click({ force: true });
    await page.waitForTimeout(250);
  }
}

test.describe("Sushi Do! Game", () => {
  test("appears in the cards section as a dedicated game", async ({ page }) => {
    await openGame(page, "cards", "sushi_do");
    await expect(page.locator('[data-testid="sushi-do-setup"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible();
  });

  test("enforces 2-9 players and suggests the top flavors without duplicates", async ({ page }) => {
    await openGame(page, "cards", "sushi_do");

    await fillPlayers(page, ["Ana"]);
    await expect(page.locator('[data-testid="sushi-do-start"]')).toBeDisabled();

    await page.locator('[data-testid="add-player"]').click();
    await fillPlayers(page, ["Ana", "Beto"]);
    await expect(page.locator('[data-testid="sushi-do-flavor-slot-0"]')).toContainText(/Tempura/i);
    await expect(page.locator('[data-testid="sushi-do-flavor-slot-1"]')).toContainText(/Roll/i);
  });

  test("allows manual flavor replacement but never duplicate flavors", async ({ page }) => {
    await openGame(page, "cards", "sushi_do");
    await page.locator('[data-testid="add-player"]').click();
    await fillPlayers(page, ["Ana", "Beto", "Carla"]);

    // The flavor picker is a custom dropdown: open it and pick "Temaki"
    await page.locator('[data-testid="sushi-do-flavor-select-2"] .dropdown-trigger').click();
    await page.locator(".dropdown-menu .dropdown-option", { hasText: /Temaki/i }).click();
    await expect(page.locator('[data-testid="sushi-do-flavor-slot-2"]')).toContainText(/Temaki/i);

    // Temaki is now taken: slot 1 must no longer offer it
    await page.locator('[data-testid="sushi-do-flavor-select-1"] .dropdown-trigger').click();
    await expect(page.locator(".dropdown-menu .dropdown-option", { hasText: /Temaki/i })).toHaveCount(0);
  });

  test("successful Sushi Do! only offers flavors in play and adds the fixed value once", async ({ page }) => {
    await startThreePlayerSushiDo(page);

    await page.locator('[data-testid="sushi-do-caller-ana"]').click();
    await page.locator('[data-testid="sushi-do-resolve-success"]').click();

    await expect(page.locator('[data-testid="sushi-do-flavor-option-tempura"]')).toBeVisible();
    await expect(page.locator('[data-testid="sushi-do-flavor-option-roll"]')).toBeVisible();
    await expect(page.locator('[data-testid="sushi-do-flavor-option-salsa_soja"]')).toHaveCount(0);

    await page.locator('[data-testid="sushi-do-flavor-option-tempura"]').click();
    await expect(page.locator('[data-testid="sushi-do-score-ana"]')).toHaveText("100");
    await expect(page.locator('[data-testid="sushi-do-round-number"]')).toContainText("2");
  });

  test("failed Sushi Do! applies -20, keeps the round open, and undo restores the round state", async ({ page }) => {
    await startThreePlayerSushiDo(page);

    await page.locator('[data-testid="sushi-do-caller-beto"]').click();
    await page.locator('[data-testid="sushi-do-resolve-penalty"]').click();
    await page.locator('[data-testid="sushi-do-confirm-penalty"]').click();
    await expect(page.locator('[data-testid="sushi-do-score-beto"]')).toHaveText("-20");
    await expect(page.locator('[data-testid="sushi-do-round-number"]')).toContainText("1");
    await expect(page.locator('[data-testid="sushi-do-round-log"]')).toContainText(/-20/);

    await page.locator('[data-testid="sushi-do-undo"]').click();
    await expect(page.locator('[data-testid="sushi-do-score-beto"]')).toHaveText("0");
    await expect(page.locator('[data-testid="sushi-do-round-log"]')).not.toContainText(/-20/);
  });

  test("restores selected flavors from draft and ends the match at 500+", async ({ page }) => {
    await startThreePlayerSushiDo(page);
    await page.reload();
    await page.locator('[data-testid^="nav-pill-"]').first().waitFor({ state: "visible", timeout: 10000 });
    await dismissNavOverlay(page);

    await openGame(page, "cards", "sushi_do");
    await expect(page.locator('[data-testid="sushi-do-active-flavors"]')).toContainText(/Tempura/);

    for (let i = 0; i < 5; i += 1) {
      await page.locator('[data-testid="sushi-do-caller-ana"]').click();
      await page.locator('[data-testid="sushi-do-resolve-success"]').click();
      await page.locator('[data-testid="sushi-do-flavor-option-tempura"]').click();
    }

    await expect(page.locator('[data-testid="sushi-do-game-over"]')).toContainText(/500/);
    await expect(page.locator('[data-testid="save-match"]')).toBeVisible();
  });
});
