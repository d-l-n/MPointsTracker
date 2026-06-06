import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test.describe('PublicProfilePage source contract', () => {
  test('public profile page uses shared surfaces and keeps inline styles bounded', () => {
    const source = read('src/pages/PublicProfilePage.tsx');
    const inlineStyleMatches = source.match(/style=\{\{/g) || [];

    expect(source).toContain('data-testid="public-profile-root"');
    expect(source).toContain('data-testid="public-profile-games-panel"');
    expect(source).toContain('data-testid="public-profile-versus-panel"');
    expect(source).toContain('public-profile-state');
    expect(source).toContain('className="public-profile-avatar-image"');
    expect(source).toContain('className="public-profile-title"');
    expect(source).toContain('public-profile-panel');
    expect(source).toContain('surface-card');
    expect(inlineStyleMatches.length).toBeLessThanOrEqual(12);
  });
});
