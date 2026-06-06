import { test, expect } from './fixtures.js';
import { getOverflowingElement, hasHorizontalOverflow, openGame } from './helpers.js';

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

async function getInlinePadding(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      left: parseFloat(styles.paddingLeft),
      right: parseFloat(styles.paddingRight),
    };
  });
}

test.describe('Layout & Responsive', () => {
  test('desktop shell keeps nav and main surfaces visible without overflow', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('.app-content')).toBeVisible();
    await expect(page.locator('.nav')).toBeVisible();
    await expect(page.locator('[data-testid="nav-pill-home"]')).toBeVisible();
    await expect(page.locator('.nav-overlay')).toHaveCount(0);

    await expectFullyInViewport(page.locator('.hdr').first(), page, 'home header');
    await expectFullyInViewport(page.locator('.home-action-card').first(), page, 'featured home surface');
    await expectNoOverflow(page, 'desktop home');
  });

  test('desktop home expands header and catalog shell beyond the shared page max width', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.app-content-inner');
      const header = document.querySelector('.home-sticky-header');
      const catalog = document.querySelector('.home-catalog-grid');
      if (!(content instanceof HTMLElement) || !(header instanceof HTMLElement) || !(catalog instanceof HTMLElement)) {
        return null;
      }
      return {
        contentWidth: content.getBoundingClientRect().width,
        headerWidth: header.getBoundingClientRect().width,
        catalogWidth: catalog.getBoundingClientRect().width,
      };
    });

    expect(metrics, 'desktop home shell metrics should be measurable').toBeTruthy();
    expect(metrics.headerWidth, 'desktop home header should expand beyond the shared 900px page cap').toBeGreaterThan(1000);
    expect(metrics.catalogWidth, 'desktop home catalog should share the expanded shell width').toBeGreaterThan(1000);
    expect(Math.abs(metrics.headerWidth - metrics.catalogWidth), 'desktop home header and catalog widths should stay aligned').toBeLessThanOrEqual(2);
    expect(metrics.contentWidth, 'home desktop content wrapper should also widen beyond the shared page cap').toBeGreaterThan(1000);
  });

  test('desktop secondary pages keep headers and surfaces within viewport', async ({ page }) => {
    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    await expect(page.locator('.page').first()).toBeVisible();
    await expectFullyInViewport(page.locator('.hdr').first(), page, 'about header');
    await expectFullyInViewport(page.locator('.settings-row').first(), page, 'settings landing row');
    await expectFullyInViewport(page.locator('.about-card').first(), page, 'settings landing surface');
    await expectNoOverflow(page, 'desktop about');

    await page.locator('[data-testid="nav-pill-champs"]').click();
    await expect(page.locator('[data-testid="nav-pill-champs"].active')).toBeVisible();
    await expectFullyInViewport(page.locator('[data-testid="champs-sticky-header"]').first(), page, 'champions sticky header');
    await expectFullyInViewport(page.locator('.champ-section').first(), page, 'champions section');
    await expectNoOverflow(page, 'desktop champions');
  });

  test('desktop shell applies the expanded page gutter on shared pages', async ({ page }) => {
    await page.locator('[data-testid="nav-pill-about"]').click();
    await expect(page.locator('[data-testid="nav-pill-about"].active')).toBeVisible();
    const pagePadding = await getInlinePadding(page, '.page');
    expect(pagePadding.left).toBeGreaterThanOrEqual(24);
    expect(pagePadding.right).toBeGreaterThanOrEqual(24);
  });

  test('desktop game detail keeps chrome compact and nav stable', async ({ page }) => {
    await openGame(page, 'uno-family', 'uno');
    await expect(page.locator('[data-testid="tab-new"]')).toBeVisible();
    await expect(page.locator('.nav')).toBeVisible();
    await expect(page.locator('.nav-overlay')).toHaveCount(0);
    await expectFullyInViewport(page.locator('.hdr').first(), page, 'game detail header');
    await expectFullyInViewport(page.locator('.tbody').first(), page, 'game detail body');
    await expectNoOverflow(page, 'desktop game detail');
  });
});
