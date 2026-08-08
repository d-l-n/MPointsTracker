import { test, expect } from './fixtures.js';
import { fillPlayers, openGame } from './helpers.js';

async function readSwitchContract(locator) {
  return locator.evaluate((element) => {
    const thumb = element.querySelector('.pill-switch-thumb');
    return {
      trackStyle: element.getAttribute('style') || '',
      thumbStyle: thumb?.getAttribute('style') || '',
      backgroundColor: getComputedStyle(element).backgroundColor,
      thumbTransform: thumb ? getComputedStyle(thumb).transform : 'none',
      thumbBackgroundColor: thumb ? getComputedStyle(thumb).backgroundColor : 'transparent',
    };
  });
}

async function expectSharedSwitchContract(locator) {
  const contract = await readSwitchContract(locator);
  expect(contract.trackStyle).toBe('');
  expect(contract.thumbStyle).toBe('');
}

async function toggleSwitch(locator) {
  const beforeChecked = await locator.getAttribute('aria-checked');
  const nextChecked = beforeChecked === 'true' ? 'false' : 'true';
  const before = await readSwitchContract(locator);

  await locator.click();
  await expect(locator).toHaveAttribute('aria-checked', nextChecked);
  await expect
    .poll(async () => {
      const current = await readSwitchContract(locator);
      return {
        backgroundColor: current.backgroundColor,
        thumbTransform: current.thumbTransform,
      };
    })
    .not.toEqual({
      backgroundColor: before.backgroundColor,
      thumbTransform: before.thumbTransform,
    });

  return {
    before,
    after: await readSwitchContract(locator),
  };
}

test.describe('Reusable switch surfaces', () => {
  test('settings and game toggles use the shared switch contract without inline offsets', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('settings-row-prefs').click();
    await page.getByRole('button', { name: /app theme|tema de la app/i }).click();

    const oledToggle = page.getByTestId('oled-toggle');

    await expectSharedSwitchContract(oledToggle);
    const { before: oledBefore, after: oledAfter } = await toggleSwitch(oledToggle);
    expect(oledAfter.backgroundColor).not.toBe(oledBefore.backgroundColor);

    // Accent modes are exclusive radiogroup buttons with their own test ids
    const monetMode = page.getByTestId('accent-mode-monet');
    const customMode = page.getByTestId('accent-mode-custom');
    await expect(monetMode).toHaveAttribute('role', 'radio');
    await monetMode.click();
    await expect(monetMode).toHaveAttribute('aria-checked', 'true');
    await customMode.click();
    await expect(customMode).toHaveAttribute('aria-checked', 'true');
    await expect(monetMode).toHaveAttribute('aria-checked', 'false');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bgt_theme_accent'))).toBe('custom');

    await page.goto('/');
    await openGame(page, 'tokens', 'ajedrez');
    const chessTimerToggle = page.getByTestId('chess-timer-toggle');
    const { before: chessBefore, after: chessAfter } = await toggleSwitch(chessTimerToggle);
    expect(chessAfter.backgroundColor).not.toBe(chessBefore.backgroundColor);

    await page.goto('/');
    await openGame(page, 'casino', 'blackjack');
    await fillPlayers(page, ['Ana', 'Beto']);
    const blackjackToggle = page.getByTestId('blackjack-auto-rotate-toggle');
    const { before: blackjackBefore, after: blackjackAfter } = await toggleSwitch(blackjackToggle);
    expect(blackjackAfter.backgroundColor).not.toBe(blackjackBefore.backgroundColor);

    await page.goto('/');
    await openGame(page, 'casino', 'poker');
    await fillPlayers(page, ['Ana', 'Beto']);
    const pokerToggle = page.getByTestId('poker-blinds-toggle');
    const { before: pokerBefore, after: pokerAfter } = await toggleSwitch(pokerToggle);
    expect(pokerAfter.backgroundColor).not.toBe(pokerBefore.backgroundColor);
  });
});
