import { test, expect } from './fixtures.js';

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

test.describe('Home action cards', () => {
  test.beforeEach(async ({ page }) => {
    await seedHomeState(page);
  });

  test('keeps compact shared chrome and preserves quick action order', async ({ page }) => {
    const featuredCard = page.locator('[data-testid="game-uno"]').locator('xpath=ancestor::article[1]');
    const recentCard = page.locator('[data-testid="game-truco"]').locator('xpath=ancestor::article[1]');
    const featuredActions = page.locator('[data-testid^="game-uno-action-"]');
    const recentActions = page.locator('[data-testid^="game-truco-action-"]');

    await expect(featuredCard).toHaveClass(/surface-card/);
    await expect(recentCard).toHaveClass(/surface-card/);
    await expect(featuredCard.locator('.home-card-emoji')).toHaveCount(0);
    await expect(recentCard.locator('.home-card-emoji')).toHaveCount(0);
    await expect(recentCard.locator('.home-card-badge')).toHaveCount(0);
    await expect(recentCard.locator('.home-card-status-icon')).toContainText('🕒');

    await expect(featuredActions).toHaveCount(3);
    await expect(featuredActions).toHaveText([
      /continuar|continue/i,
      /nueva|new/i,
      /estad[íi]sticas|stats|statistics/i,
    ]);
    await expect(page.locator('[data-testid="home-filter-row"]').getByRole('button', { name: /recientes|recent/i })).toHaveCount(0);
    await expect(page.locator('[data-testid="game-uno-catalog"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="game-truco-catalog"]')).toHaveCount(0);

    await expect(recentActions).toHaveCount(2);
    await expect(recentActions).toHaveText([
      /nueva|new/i,
      /estad[íi]sticas|stats|statistics/i,
    ]);
  });

  test('keeps card tap and quick-action taps separated', async ({ page }) => {
    await page.locator('[data-testid="game-truco-action-new"]').click();
    await expect(page).toHaveURL(/\/game\/truco$/);
    await expect(page.locator('[data-testid="tab-new"]')).toHaveClass(/active/);

    await page.locator('[data-testid="nav-pill-home"]').click();
    await expect(page.locator('[data-testid="game-truco"]')).toBeVisible();

    await page.locator('[data-testid="game-truco-action-stats"]').click();
    await expect(page).toHaveURL(/\/game\/truco$/);
    await expect(page.locator('[data-testid="tab-stats"]')).toHaveClass(/active/);

    await page.locator('[data-testid="nav-pill-home"]').click();
    await page.locator('[data-testid="game-truco"]').click();
    await expect(page).toHaveURL(/\/game\/truco$/);
    await expect(page.locator('[data-testid="tab-new"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="tab-history"]')).toHaveCount(0);
  });

  test('keeps sticky home chrome, uses a single-row filter ribbon and shows an empty state with no results', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    const stickyHeader = page.locator('[data-testid="home-sticky-header"]');
    const filterRow = page.locator('[data-testid="home-filter-row"]');

    await expect(stickyHeader).toBeVisible();
    await expect
      .poll(() => stickyHeader.evaluate((el) => getComputedStyle(el).position))
      .toBe('sticky');
    await expect
      .poll(() => filterRow.evaluate((el) => ({
        flexWrap: getComputedStyle(el).flexWrap,
        overflowX: getComputedStyle(el).overflowX,
        isScrollable: el.scrollWidth > el.clientWidth,
      })))
      .toEqual({
        flexWrap: 'nowrap',
        overflowX: 'auto',
        isScrollable: true,
      });

    await filterRow.getByRole('button', { name: /cartas|cards/i }).click();
    await page.getByLabel(/buscar juego o partida|search game or match/i).fill('zzz');

    await expect(page.locator('[data-testid="home-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="home-empty-state"]')).toContainText(/sin resultados|no results/i);
  });

  test('keeps game group and section headings non-sticky while the top games chrome stays sticky', async ({ page }) => {
    const stickyHeader = page.locator('[data-testid="home-sticky-header"]');
    const groupHeader = page.locator('[data-testid="group-cards"]');
    const sectionHeading = page.locator('.home-rail-shell .home-section-heading').first();

    await expect
      .poll(() => stickyHeader.evaluate((el) => getComputedStyle(el).position))
      .toBe('sticky');
    await expect
      .poll(() => groupHeader.evaluate((el) => getComputedStyle(el).position))
      .toBe('static');
    await expect
      .poll(() => sectionHeading.evaluate((el) => getComputedStyle(el).position))
      .toBe('static');
  });

  test('renders recent as the only horizontal rail while catalog cards stay in the normal stack layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload();

    const topShell = page.locator('[data-testid="home-top-shell"]');
    const recentSection = page.locator('.home-rail-shell');
    const recentTitle = recentSection.locator('.home-section-title');
    const recentStack = recentSection.locator('.home-card-stack');
    const catalogStack = page.locator('[data-testid="group-cards"]').locator('xpath=following-sibling::div[1]');
    const recentCard = page.locator('[data-testid="game-truco"]').locator('xpath=ancestor::article[1]');
    const catalogCard = page.locator('[data-testid="game-rummy"]').locator('xpath=ancestor::article[1]');
    const groupHeader = page.locator('[data-testid="group-cards"]');
    const groupTitle = page.locator('[data-testid="group-cards"].home-group-title');
    const searchInput = page.getByLabel(/buscar juego o partida|search game or match/i);
    const activeFilter = page.locator('.home-filter-chip.active').first();

    await expect
      .poll(() => topShell.evaluate((el) => getComputedStyle(el).display))
      .toBe('grid');
    await expect(recentTitle).toHaveCount(0);
    await expect(recentSection).not.toContainText(/move fast between your games|movete r[aá]pido entre tus juegos/i);
    await expect(groupHeader.locator('.gcollapse-ico, .gcollapse-meta')).toHaveCount(0);
    await expect(groupTitle).toBeVisible();
    await expect
      .poll(() => recentStack.evaluate((el) => ({
        display: getComputedStyle(el).display,
        overflowX: getComputedStyle(el).overflowX,
        flexWrap: getComputedStyle(el).flexWrap,
      })))
      .toEqual({
        display: 'flex',
        overflowX: 'auto',
        flexWrap: 'nowrap',
      });
    await expect
      .poll(() => catalogStack.evaluate((el) => ({
        display: getComputedStyle(el).display,
        overflowX: getComputedStyle(el).overflowX,
        flexWrap: getComputedStyle(el).flexWrap,
      })))
      .toEqual({
        display: 'grid',
        overflowX: 'visible',
        flexWrap: 'nowrap',
      });
    await expect(page.locator('[data-testid="game-truco-catalog"]')).toHaveCount(0);

    await expect
      .poll(async () => {
        const recent = await recentCard.evaluate((el) => {
          const styles = getComputedStyle(el);
          return {
            padding: styles.padding,
            radius: styles.borderRadius,
          };
        });
        const catalog = await catalogCard.evaluate((el) => {
          const styles = getComputedStyle(el);
          return {
            padding: styles.padding,
            radius: styles.borderRadius,
          };
        });
        return recent.padding === catalog.padding && recent.radius === catalog.radius;
      })
      .toBe(true);
    await expect
      .poll(() => recentCard.evaluate((el) => getComputedStyle(el).boxShadow))
      .toBe('none');
    await expect
      .poll(async () => {
        const recentWidth = await recentCard.evaluate((el) => el.getBoundingClientRect().width);
        const stackWidth = await recentStack.evaluate((el) => el.getBoundingClientRect().width);
        return Math.abs(recentWidth - ((stackWidth - 24) / 3));
      })
      .toBeLessThanOrEqual(6);
    await expect
      .poll(async () => {
        const catalogWidth = await catalogCard.evaluate((el) => el.getBoundingClientRect().width);
        const stackWidth = await catalogStack.evaluate((el) => el.getBoundingClientRect().width);
        return stackWidth - catalogWidth;
      })
      .toBeGreaterThan(100);

    await expect
      .poll(() => groupHeader.evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          borderRadius: styles.borderRadius,
          borderTopWidth: styles.borderTopWidth,
          borderRightWidth: styles.borderRightWidth,
          borderBottomWidth: styles.borderBottomWidth,
          borderLeftWidth: styles.borderLeftWidth,
          backgroundColor: styles.backgroundColor,
          boxShadow: styles.boxShadow,
        };
      }))
      .toEqual({
        borderRadius: '0px',
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '0px',
        borderLeftWidth: '0px',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        boxShadow: 'none',
      });

    await expect
      .poll(async () => {
        const inputRadius = await searchInput.evaluate((el) => getComputedStyle(el).borderRadius);
        const chipRadius = await activeFilter.evaluate((el) => getComputedStyle(el).borderRadius);
        return { inputRadius, chipRadius };
      })
      .toEqual({
        inputRadius: '999px',
        chipRadius: '999px',
      });
  });

  test('keeps promoted games out of the catalog duplicate pass and moves rummy and burako into the card-games stack', async ({ page }) => {
    const cardsGroup = page.locator('[data-testid="group-cards"]').locator('xpath=following-sibling::div[1]');
    const tokensGroup = page.locator('[data-testid="group-tokens"]').locator('xpath=following-sibling::div[1]');

    await expect(page.locator('[data-testid="game-uno-catalog"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="game-truco-catalog"]')).toHaveCount(0);
    await expect(cardsGroup.locator('[data-testid="game-rummy"]')).toBeVisible();
    await expect(cardsGroup.locator('[data-testid="game-burako"]')).toBeVisible();
    await expect(tokensGroup.locator('[data-testid="game-rummy"]')).toHaveCount(0);
    await expect(tokensGroup.locator('[data-testid="game-burako"]')).toHaveCount(0);
  });

  test('keeps differentiated hero metadata without rendering identity chips on game cards', async ({ page }) => {
    const unoHero = page.locator('[data-testid="game-uno"]').locator('.home-card-hero');
    const bastaHero = page.locator('[data-testid="game-basta_dym"]').locator('.home-card-hero');
    const unoIdentity = page.locator('[data-testid="game-uno-identity"]');
    const bastaIdentity = page.locator('[data-testid="game-basta_dym-identity"]');
    const ajedrezIdentity = page.locator('[data-testid="game-ajedrez-identity"]');

    await expect(unoHero).toHaveAttribute('data-hero-family', 'uno');
    await expect(unoHero).toHaveAttribute('data-hero-game', 'uno');
    await expect(unoHero).toHaveAttribute('data-hero-tone', 'arcade');
    await expect(bastaHero).toHaveAttribute('data-hero-family', 'playful');
    await expect(bastaHero).toHaveAttribute('data-hero-game', 'basta_dym');
    await expect(bastaHero).toHaveAttribute('data-hero-tone', 'words');
    await expect(unoIdentity).toHaveCount(0);
    await expect(bastaIdentity).toHaveCount(0);
    await expect(ajedrezIdentity).toHaveCount(0);
  });

  test('shows a filtered empty state without falling back to the generic no-matches copy', async ({ page }) => {
    const filterRow = page.locator('[data-testid="home-filter-row"]');
    const emptyState = page.locator('[data-testid="home-empty-state"]');

    await page.evaluate(() => {
      localStorage.setItem('bgt_v6', JSON.stringify({}));
      localStorage.setItem('bgt_drafts', JSON.stringify({}));
    });
    await page.reload();
    await filterRow.getByRole('button', { name: /favoritos|favorites/i }).click();

    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/sin resultados|no results/i);
    await expect(emptyState).not.toContainText(/sin partidas registradas|no matches|jug[aá] y guard[aá] la primera|play first/i);
  });

  test('auto-hides only the mobile bottom bar while scrolling and restores it after scroll settles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    const nav = page.locator('.nav');
    const appContent = page.locator('.app-content');

    await expect(nav).not.toHaveClass(/nav--hidden/);

    await appContent.evaluate((el) => {
      el.scrollTop = 640;
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    });

    await expect(nav).toHaveClass(/nav--hidden/);
    await expect.poll(() => nav.evaluate((el) => el.className), { timeout: 2000 }).not.toMatch(/nav--hidden/);
  });

  test('keeps the desktop sidebar visible while scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload();

    const nav = page.locator('.nav');
    const appContent = page.locator('.app-content');

    await appContent.evaluate((el) => {
      el.scrollTop = 640;
      el.dispatchEvent(new Event('scroll'));
    });

    await expect(nav).toHaveClass(/nav--open/);
    await expect(nav).not.toHaveClass(/nav--hidden/);
  });
});
