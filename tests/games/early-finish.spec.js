import { test, expect } from "../fixtures.js";
import { openGame, fillPlayers } from "../helpers.js";

const STORAGE_KEY = "bgt_v6";

async function readStoredMatches(page, gameId) {
  return page.evaluate(({ storageKey, targetGameId }) => {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : {};
    return Array.isArray(data[targetGameId]) ? data[targetGameId] : [];
  }, { storageKey: STORAGE_KEY, targetGameId: gameId });
}

async function finishSushiRound(page, callerTestId, flavorKey = "tempura") {
  await page.locator(`[data-testid="${callerTestId}"]`).click();
  await page.locator('[data-testid="sushi-do-resolve-success"]').click();
  await page.locator(`[data-testid="sushi-do-flavor-option-${flavorKey}"]`).click();
}

test.describe("Early finish flow", () => {
  test("Sushi Do! can finish early before 500 and save with no winner", async ({ page }) => {
    await openGame(page, "cards", "sushi_do");
    await page.locator('[data-testid="add-player"]').click();
    await fillPlayers(page, ["Ana", "Beto", "Carla"]);
    await page.locator('[data-testid="sushi-do-start"]').click();

    await finishSushiRound(page, "sushi-do-caller-ana");
    await expect(page.locator('[data-testid="save-match"]')).toContainText(/finish|terminar/i);

    await page.locator('[data-testid="save-match"]').click();
    await expect(page.locator('[data-testid="early-finish-modal"]')).toBeVisible();
    await page.locator('[data-testid="early-finish-no-winner"]').click();
    await page.locator('[data-testid="early-finish-confirm"]').click();

    const matches = await readStoredMatches(page, "sushi_do");
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBeNull();
    expect(matches[0].players[0].name).toBe("Ana");
  });

  test("UNO can finish early with a manual winner override while keeping ranking order", async ({ page }) => {
    await openGame(page, "uno-family", "uno");
    await fillPlayers(page, ["Ana", "Beto"]);
    await page.locator('[data-testid^="win-button-"]').first().click();

    await expect(page.locator('[data-testid="save-match"]')).toContainText(/finish|terminar/i);
    await page.locator('[data-testid="save-match"]').click();
    await expect(page.locator('[data-testid="early-finish-modal"]')).toBeVisible();
    await page.locator('[data-testid="early-finish-choose-winner"]').click();
    await page.locator('[data-testid="early-finish-player-beto"]').click();
    await page.locator('[data-testid="early-finish-confirm"]').click();

    const matches = await readStoredMatches(page, "uno");
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe("Beto");
    expect(matches[0].players[0].name).toBe("Ana");
  });

  test("Natural Sushi Do! save still bypasses the early finish modal", async ({ page }) => {
    await openGame(page, "cards", "sushi_do");
    await page.locator('[data-testid="add-player"]').click();
    await fillPlayers(page, ["Ana", "Beto", "Carla"]);
    await page.locator('[data-testid="sushi-do-start"]').click();

    for (let index = 0; index < 5; index += 1) {
      await finishSushiRound(page, "sushi-do-caller-ana");
    }

    await expect(page.locator('[data-testid="sushi-do-game-over"]')).toBeVisible();
    await page.locator('[data-testid="save-match"]').click();
    await expect(page.locator('[data-testid="early-finish-modal"]')).toHaveCount(0);

    const matches = await readStoredMatches(page, "sushi_do");
    expect(matches).toHaveLength(1);
    expect(matches[0].winner).toBe("Ana");
  });

  test("early finish modal keeps readable contrast in light and dark themes", async ({ page }) => {
    await openGame(page, "cards", "sushi_do");
    await page.locator('[data-testid="add-player"]').click();
    await fillPlayers(page, ["Ana", "Beto", "Carla"]);
    await page.locator('[data-testid="sushi-do-start"]').click();

    await finishSushiRound(page, "sushi-do-caller-ana");
    await page.locator('[data-testid="save-match"]').click();
    await expect(page.locator('[data-testid="early-finish-modal"]')).toBeVisible();

    for (const themeMode of ["light", "dark"]) {
      await page.evaluate((mode) => {
        localStorage.setItem("bgt_theme_mode", mode);
        localStorage.removeItem("bgt_oled");
        document.documentElement.setAttribute("data-theme", mode);
        document.documentElement.classList.remove("light", "dark", "oled");
        document.documentElement.classList.add(mode);
        const app = document.querySelector(".app");
        if (app instanceof HTMLElement) {
          app.classList.remove("light", "dark");
          app.classList.add(mode === "light" ? "light" : "dark");
        }
      }, themeMode);

      const surface = await page.locator(".early-finish-modal-box").evaluate((modalEl) => {
        const parseColor = (value) => {
          const match = value.match(/rgba?\(([^)]+)\)/i);
          if (!match) return [0, 0, 0, 1];
          const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
          return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] ?? 1];
        };
        const boxStyles = getComputedStyle(modalEl);
        const cancelStyles = getComputedStyle(modalEl.querySelector(".modal-cancel"));
        const confirmStyles = getComputedStyle(modalEl.querySelector(".modal-confirm"));
        const selectedStyles = getComputedStyle(modalEl.querySelector(".early-finish-option"));

        const cancelBg = parseColor(cancelStyles.backgroundColor);
        const confirmBg = parseColor(confirmStyles.backgroundColor);
        const selectedBg = parseColor(selectedStyles.backgroundColor);

        return {
          modalBackgroundAlpha: parseColor(boxStyles.backgroundColor)[3],
          cancelBackgroundAlpha: cancelBg[3],
          confirmBackgroundAlpha: confirmBg[3],
          selectedBackgroundAlpha: selectedBg[3],
          cancelBorderColor: cancelStyles.borderColor,
          confirmColor: confirmStyles.color,
        };
      });

      expect(surface.modalBackgroundAlpha).toBeGreaterThan(0.82);
      expect(surface.cancelBackgroundAlpha).toBeGreaterThan(0.82);
      expect(surface.confirmBackgroundAlpha).toBeGreaterThan(0.95);
      expect(surface.selectedBackgroundAlpha).toBeGreaterThan(0.82);
      expect(surface.cancelBorderColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(surface.confirmColor).toBe("rgb(255, 255, 255)");
    }
  });
});
