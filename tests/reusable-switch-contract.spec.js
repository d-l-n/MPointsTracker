import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (filePath) => readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');

test.describe('Reusable pill switch contract', () => {
  test('shared CSS owns thumb translation and active accent surface', () => {
    const css = read('src/styles/app.css');

    expect(css).toContain('--pill-switch-accent');
    expect(css).toContain('--pill-switch-thumb-translate: 24px;');
    expect(css).toContain('transform: translateX(var(--pill-switch-thumb-translate)) scale(var(--pill-switch-thumb-scale));');
    expect(css).not.toContain('.pill-switch[aria-checked="true"] .pill-switch-thumb{left:');
  });

  test('shared switch component does not expose inline styling escape hatches', () => {
    const source = read('src/components/ui/PillSwitch.tsx');

    expect(source).not.toContain('CSSProperties');
    expect(source).not.toContain('accentColor');
    expect(source).not.toContain('style={style}');
  });

  test('settings and game flows do not keep inline pill switch track or thumb offsets', () => {
    const targetFiles = [
      'src/pages/SettingsPage.tsx',
      'src/components/games/AjedrezNewMatch.tsx',
      'src/components/games/BlackjackNewMatch.tsx',
      'src/components/games/PokerNewMatch.tsx',
    ];

    for (const filePath of targetFiles) {
      const source = read(filePath);
      expect(source, `${filePath} should consume the shared PillSwitch component`).toContain('PillSwitch');
      expect(source, `${filePath} should not render raw pill-switch markup`).not.toContain('className="pill-switch"');
      expect(source, `${filePath} should not render raw pill-switch thumb markup`).not.toContain('className="pill-switch-thumb"');
    }
  });

  test('champions screen keeps a sticky shell header with the Hall of Fame utility surface', () => {
    const layoutSource = read('src/components/ui/AppLayout.tsx');
    const champsSource = read('src/pages/ChampsPage.tsx');

    expect(layoutSource).toContain('data-testid="champs-sticky-header"');
    expect(layoutSource).toContain('t("hallOfFame")');
    expect(champsSource).not.toContain('className="champ-hero"');
    expect(champsSource).not.toContain('t("hallOfFame")');
  });
});
