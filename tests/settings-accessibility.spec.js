import { test, expect } from './fixtures.js';

async function readReducedEffectsComputedPolicy(page) {
  return page.evaluate(() => {
    const surface = document.createElement('div');
    surface.setAttribute('data-testid', 'reduced-effects-blur-sentinel');
    surface.style.position = 'fixed';
    surface.style.inset = '0 auto auto 0';
    surface.style.width = '1px';
    surface.style.height = '1px';
    surface.style.backdropFilter = 'var(--blur)';
    surface.style.WebkitBackdropFilter = 'var(--blur)';

    const animated = document.createElement('div');
    animated.setAttribute('data-testid', 'reduced-effects-animation-sentinel');
    animated.style.animation = 'pulse-green 1.5s ease-in-out infinite';

    const transitioned = document.createElement('button');
    transitioned.setAttribute('data-testid', 'reduced-effects-transition-sentinel');
    transitioned.style.transition = 'transform .2s ease, opacity .15s ease';

    const plain = document.createElement('div');
    plain.setAttribute('data-testid', 'reduced-effects-plain-sentinel');

    const host = document.querySelector('.app') ?? document.body;
    host.append(surface, animated, transitioned, plain);

    const surfaceStyles = getComputedStyle(surface);
    const animatedStyles = getComputedStyle(animated);
    const transitionedStyles = getComputedStyle(transitioned);
    const plainStyles = getComputedStyle(plain);
    const policy = {
      blur: surfaceStyles.backdropFilter || surfaceStyles.webkitBackdropFilter,
      animationName: animatedStyles.animationName,
      animationDuration: animatedStyles.animationDuration,
      transitionProperty: transitionedStyles.transitionProperty,
      transitionDuration: transitionedStyles.transitionDuration,
      plainBackdropFilter: plainStyles.backdropFilter || plainStyles.webkitBackdropFilter,
    };

    surface.remove();
    animated.remove();
    transitioned.remove();
    plain.remove();

    return policy;
  });
}

async function readReducedEffectsSurfacePolicy(page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.setAttribute('data-testid', 'reduced-effects-surface-sentinel');
    document.body.append(probe);

    const values = [
      '--glass',
      '--glass-bg',
      '--content-surface',
      '--content-surface-strong',
      '--surface-overlay',
      '--surface-overlay-strong',
      '--surface-scrim',
    ].map((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim());

    const surfaceClasses = ['about-card', 'modal-box', 'nav', 'sec-card'];
    const backgrounds = surfaceClasses.map((className) => {
      probe.className = className;
      return getComputedStyle(probe).backgroundColor;
    });

    probe.remove();
    return { backgrounds, values };
  });
}

function expectNoTransparentSurfaceValues(surfacePolicy) {
  for (const value of [...surfacePolicy.values, ...surfacePolicy.backgrounds]) {
    expect(value).not.toMatch(/transparent/i);
    expect(value).not.toMatch(/rgba?\([^)]*,\s*(?:0(?:\.0+)?|0?\.\d+)\s*\)/i);
  }
}

test.describe('Settings accessibility preferences', () => {
  test('theme settings expose Monet and keep OLED available', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('settings-row-prefs').click();
    await page.getByRole('button', { name: /app theme|tema de la app/i }).click();

    const monetToggle = page.getByRole('switch', { name: /monet/i });
    const oledToggle = page.getByRole('switch', { name: /oled/i });

    await expect(monetToggle).toBeVisible();
    await monetToggle.click();

    await expect(monetToggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_theme_accent'))).toBe('monet');

    await expect(oledToggle).toBeVisible();
    await oledToggle.click();

    await expect(oledToggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_oled'))).toBe('1');
    await expect(monetToggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_theme_accent'))).toBe('monet');
  });

  test('spotify preference is off by default, explains Premium, and persists when enabled', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('bgt_spotify_enabled');
    });
    await page.reload();

    await page.goto('/settings');
    await page.getByTestId('settings-row-prefs').click();

    const row = page.getByTestId('spotify-preference-row');
    const toggle = page.getByTestId('spotify-preference-toggle');

    await expect(row).toBeVisible();
    await expect(row).toContainText(/spotify/i);
    await expect(row).toContainText(/premium/i);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_spotify_enabled'))).toBeNull();

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_spotify_enabled'))).toBe('1');
    await expect(page.getByTestId('spotify-mini-player')).toBeVisible();
  });

  test('reduce effects toggles the root class, persists after reload, and settings rows avoid structural emojis', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      localStorage.removeItem('bgt_reduce_effects');
    });
    await page.reload();

    await page.click('[data-testid="nav-pill-about"]');
    await expect(page.locator('[data-testid="settings-row-prefs"]')).not.toContainText(/⚙️|ℹ️|👤|✉️/);
    await page.click('[data-testid="settings-row-prefs"]');

    await expect(page.locator('[data-testid="reduce-effects-row"]')).toBeVisible();
    const toggle = page.locator('[data-testid="reduce-effects-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/reduced-effects/);

    await toggle.click();

    await expect(page.locator('html')).toHaveClass(/reduced-effects/);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_reduce_effects'))).toBe('1');

    await page.reload();
    await page.click('[data-testid="nav-pill-about"]');
    await page.click('[data-testid="settings-row-prefs"]');

    await expect(page.locator('html')).toHaveClass(/reduced-effects/);
    await expect(page.locator('[data-testid="reduce-effects-toggle"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('reduce effects applies measurable global effect reductions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      localStorage.removeItem('bgt_reduce_effects');
    });
    await page.reload();

    await page.click('[data-testid="nav-pill-about"]');
    await page.click('[data-testid="settings-row-prefs"]');

    await expect(page.locator('html')).not.toHaveClass(/reduced-effects/);
    const baseline = await readReducedEffectsComputedPolicy(page);
    expect(baseline.blur).toContain('blur(');
    expect(baseline.animationName).toBe('pulse-green');
    expect(baseline.transitionProperty).toContain('transform');

    await page.locator('[data-testid="reduce-effects-toggle"]').click();
    await expect(page.locator('html')).toHaveClass(/reduced-effects/);

    const reduced = await readReducedEffectsComputedPolicy(page);
    expect(reduced.blur).toContain('blur(0px)');
    expect(reduced.animationName).toBe('none');
    expect(reduced.transitionProperty).not.toContain('transform');
    expect(reduced.plainBackdropFilter).toBe('none');
    expectNoTransparentSurfaceValues(await readReducedEffectsSurfacePolicy(page));
  });

  test('system reduced motion applies the same measurable policy without a saved manual preference', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('bgt_reduce_effects');
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    await expect(page.locator('html')).toHaveClass(/reduced-effects/);

    const reduced = await readReducedEffectsComputedPolicy(page);
    expect(reduced.blur).toContain('blur(0px)');
    expect(reduced.animationName).toBe('none');
    expect(reduced.transitionProperty).not.toContain('transform');
    expect(reduced.plainBackdropFilter).toBe('none');
    expectNoTransparentSurfaceValues(await readReducedEffectsSurfacePolicy(page));
  });

  test('manual reduce effects off keeps full effects even when the system requests reduced motion', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('bgt_reduce_effects', '0');
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    await expect(page.locator('html')).not.toHaveClass(/reduced-effects/);
    await expect(page.locator('html')).toHaveClass(/full-effects/);

    const policy = await readReducedEffectsComputedPolicy(page);
    expect(policy.blur).toContain('blur(');
    expect(policy.blur).not.toContain('blur(0px)');
    expect(policy.animationName).toBe('pulse-green');
    expect(policy.transitionProperty).toContain('transform');
    expect(policy.plainBackdropFilter).toBe('none');
  });

  test('settings login shortcuts keep their visual login cues while app theme and active switches stay on the shared accent grammar', async ({ page }) => {
    await page.click('[data-testid="nav-pill-about"]');

    const loginButtons = page.locator('.about-action-btn');
    await expect(loginButtons.nth(0).locator('img[aria-hidden="true"]')).toHaveAttribute('src', /google\.svg/);
    await expect(loginButtons.nth(0)).toContainText(/google/i);
    await expect(loginButtons.nth(1)).toContainText(/✉️/);
    await expect(loginButtons.nth(1)).toContainText(/email/i);

    await page.click('[data-testid="settings-row-prefs"]');
    const appThemeRow = page.locator('button.settings-row').filter({ hasText: /app theme|tema de la app|thème de l'application|应用主题|アプリテーマ|app-design/i }).first();
    await appThemeRow.click();

    await expect(page.locator('.page')).not.toContainText(/⬛/);

    const oledToggle = page.locator('.settings-sub-row').filter({ hasText: /oled/i }).getByRole('switch');
    await oledToggle.click();

    await expect(oledToggle).toHaveAttribute('aria-checked', 'true');
    await expect
      .poll(() => oledToggle.evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderTopWidth: styles.borderTopWidth,
        };
      }))
      .toEqual(expect.objectContaining({
        borderTopWidth: '1px',
      }));
    await expect
      .poll(() => oledToggle.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe('rgba(0, 0, 0, 0)');

    const backButton = page.locator('.page-header-compact .ibtn').first();
    await expect
      .poll(() => backButton.evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          alignItems: styles.alignItems,
          justifyContent: styles.justifyContent,
        };
      }))
      .toEqual({
        alignItems: 'center',
        justifyContent: 'center',
      });
  });

  test('preferences and advanced surfaces keep the current typography grammar and remove decorative emojis from labels and actions', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('bgt_player_groups', JSON.stringify([
        { name: 'Mesa fija', players: ['Ana', 'Beto'] },
      ]));
    });
    await page.reload();
    await page.click('[data-testid="nav-pill-about"]');
    await page.click('[data-testid="settings-row-prefs"]');

    await expect(page.locator('.page')).not.toContainText(/👥|💾|💡|📳|🗑️|🔗/);
    await expect(page.locator('.about-game-chip')).toHaveCount(0);

    const advancedRow = page.locator('button.settings-row').filter({ hasText: /advanced|avanzado|avancé|高级|詳細設定/i }).first();
    const languageLabel = page.locator('.about-label').filter({ hasText: /app language|idioma de la app|langue de l'application|アプリの言語|应用语言|app-sprache/i }).first();
    const languageStyles = await languageLabel.evaluate((el) => {
      const styles = getComputedStyle(el);
      return { fontFamily: styles.fontFamily, fontSize: styles.fontSize, letterSpacing: styles.letterSpacing };
    });

    await expect
      .poll(async () => {
        const rowTitle = await advancedRow.locator('div').first().evaluate((el) => {
          const styles = getComputedStyle(el);
          return { fontFamily: styles.fontFamily, fontSize: styles.fontSize, letterSpacing: styles.letterSpacing };
        });
        return rowTitle;
      })
      .toEqual(languageStyles);
  });
});
