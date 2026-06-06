import { test, expect } from '@playwright/test';
import { buildHomeViewModel } from '../src/components/home/homeModel.ts';

const t = (key) => key;

const DATA = {
  ajedrez: [{ id: 'm-1', date: '2026-05-12T12:00:00.000Z', players: ['Ana', 'Beto'], winner: 'Ana' }],
  poker: [{ id: 'm-2', date: '2026-05-13T12:00:00.000Z', players: ['Luz', 'Nico'], winner: 'Nico' }],
  rummy: [{ id: 'm-3', date: '2026-05-14T12:00:00.000Z', players: ['Paz', 'Tomi'], winner: 'Paz' }],
  basta_dym: [{ id: 'm-4', date: '2026-05-15T12:00:00.000Z', players: ['Mora', 'Juan'], winner: 'Mora' }],
};

const getMatches = (gameId) => DATA[gameId] || [];
const getDraft = () => null;
const getCard = (viewModel, gameId) => {
  const allCards = [
    ...(viewModel.featured ? [viewModel.featured] : []),
    ...viewModel.recentCards,
    ...viewModel.groups.flatMap((group) => group.cards),
  ];
  return allCards.find((card) => card.id === gameId);
};

test.describe('Home card identity model', () => {
  test('cards expose stronger per-game identity markers beyond the broad hero family', () => {
    const viewModel = buildHomeViewModel({
      data: DATA,
      getMatches,
      getDraft,
      t,
      locale: 'es',
      activeFilter: 'all',
      search: '',
    });

    const ajedrez = getCard(viewModel, 'ajedrez');
    const poker = getCard(viewModel, 'poker');
    const rummy = getCard(viewModel, 'rummy');
    const basta = getCard(viewModel, 'basta_dym');

    expect(ajedrez.identity).toEqual(expect.objectContaining({
      key: 'ajedrez',
      label: expect.any(String),
      glyph: expect.any(String),
      tone: expect.any(String),
    }));
    expect(poker.identity).toEqual(expect.objectContaining({ key: 'poker' }));
    expect(rummy.identity).toEqual(expect.objectContaining({ key: 'rummy' }));
    expect(basta.identity).toEqual(expect.objectContaining({ key: 'basta_dym' }));

    expect(ajedrez.identity.glyph).not.toBe(poker.identity.glyph);
    expect(rummy.identity.label).not.toBe(basta.identity.label);
    expect(new Set([ajedrez.identity.tone, poker.identity.tone, rummy.identity.tone, basta.identity.tone]).size).toBeGreaterThanOrEqual(3);
  });
});
