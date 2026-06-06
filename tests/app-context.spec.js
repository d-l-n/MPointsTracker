import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const getSelfClosingTag = (source, componentName) => {
  const match = source.match(new RegExp(`<${componentName}[\\s\\S]*?/>`));
  expect(match, `Missing <${componentName} /> call site`).toBeTruthy();
  return match[0];
};
const expectNoProp = (jsx, propName) => {
  expect(jsx).not.toMatch(new RegExp(`\\b${propName}=\\{`));
};

test.describe('AppContext refactor', () => {
  test('App context exposes shared match state and mutators', () => {
    const appSource = read('src/App.tsx');
    const contextSource = read('src/context/AppContext.tsx');

    expect(appSource).toContain('data,');
    expect(appSource).toContain('addMatch, delMatch, editMatch,');
    expect(contextSource).toContain('data');
    expect(contextSource).toContain('addMatch');
    expect(contextSource).toContain('delMatch');
    expect(contextSource).toContain('editMatch');
  });

  test('deep pages read shared values from AppContext instead of prop drilling', () => {
    const layoutSource = read('src/components/ui/AppLayout.tsx');
    const globalHistorySource = read('src/pages/GlobalHistoryPage.tsx');
    const champsSource = read('src/pages/ChampsPage.tsx');
    const settingsSource = read('src/pages/SettingsPage.tsx');
    const gameDetailSource = read('src/pages/GameDetail.tsx');
    const globalHistoryCall = getSelfClosingTag(layoutSource, 'GlobalHistoryPage');
    const champsCall = getSelfClosingTag(layoutSource, 'ChampsPage');
    const settingsCall = getSelfClosingTag(layoutSource, 'SettingsPage');
    const gameDetailCall = getSelfClosingTag(layoutSource, 'GameDetail');

    expectNoProp(globalHistoryCall, 'data');
    expectNoProp(globalHistoryCall, 'onDelete');
    expectNoProp(globalHistoryCall, 'onEdit');
    expectNoProp(globalHistoryCall, 't');

    expectNoProp(champsCall, 'data');
    expectNoProp(champsCall, 't');
    expectNoProp(champsCall, 'playerGroups');
    expectNoProp(champsCall, 'currentUser');

    expectNoProp(settingsCall, 'user');
    expectNoProp(settingsCall, 'showToast');
    expectNoProp(settingsCall, 't');
    expectNoProp(settingsCall, 'playerGroups');
    expectNoProp(settingsCall, 'onSavePlayerGroups');

    expectNoProp(gameDetailCall, 'knownNames');
    expectNoProp(gameDetailCall, 't');
    expectNoProp(gameDetailCall, 'playerGroups');
    expectNoProp(gameDetailCall, 'onSavePlayerGroups');

    expect(globalHistorySource).toContain('useAppContext');
    expect(champsSource).toContain('useAppContext');
    expect(settingsSource).toContain('useAppContext');
    expect(gameDetailSource).toContain('useAppContext');
  });
});
