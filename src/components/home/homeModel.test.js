import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { buildHomeViewModel } from "./homeModel.ts";

const t = (key) => key;

describe("homeModel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("groups cards, promotes the draft once and avoids duplicates in recent/catalog", () => {
    const matchesByGame = {
      uno: [{ id: "m-1", date: "2026-05-15T12:00:00.000Z", players: [{ name: "Ana" }, { name: "Beto" }], winner: "Ana" }],
      poker: [{ id: "m-2", date: "2026-05-14T12:00:00.000Z", players: [{ name: "Luz" }, { name: "Nico" }], winner: "Nico" }],
      ajedrez: [{ id: "m-3", date: "2026-05-13T12:00:00.000Z", players: [{ name: "Paz" }, { name: "Tomi" }], winner: "Paz" }],
    };
    const getMatches = (gameId) => matchesByGame[gameId] || [];
    const getDraft = (gameId) => (gameId === "uno" ? { players: [{ name: "Ana" }], _savedAt: 123 } : null);

    const viewModel = buildHomeViewModel({
      data: matchesByGame,
      getMatches,
      getDraft,
      t,
      locale: "es",
    });

    // After the family-variant refactor, the UNO draft surfaces as a single
    // family card ("uno-family") instead of four individual cards.
    expect(viewModel.featured?.id).toBe("uno-family");
    expect(viewModel.featured?.isFamily).toBe(true);
    expect(viewModel.featured?.variants?.some((variant) => variant.id === "uno" && variant.hasDraft)).toBe(true);
    expect(viewModel.recentCards.some((card) => card.id === "uno-family")).toBe(false);
    expect(viewModel.groups.some((group) => group.cards.some((card) => card.id === "uno-family"))).toBe(false);
    expect(viewModel.groups.length).toBeGreaterThan(0);
  });

  test("supports search and filter combinations without reintroducing promoted cards", () => {
    const matchesByGame = {
      uno: [{ id: "m-1", date: "2026-05-15T12:00:00.000Z", players: [{ name: "Ana" }], winner: "Ana" }],
      monopoly: [{ id: "m-2", date: "2026-05-12T12:00:00.000Z", players: [{ name: "Beto" }], winner: "Beto" }],
      poker: [{ id: "m-3", date: "2026-05-11T12:00:00.000Z", players: [{ name: "Clara" }], winner: "Clara" }],
    };
    const getMatches = (gameId) => matchesByGame[gameId] || [];
    const getDraft = () => null;

    const favoritesVm = buildHomeViewModel({
      data: matchesByGame,
      getMatches,
      getDraft,
      t,
      locale: "es",
      activeFilter: "favorites",
      search: "mono",
    });

    const visibleIds = [
      ...(favoritesVm.featured ? [favoritesVm.featured.id] : []),
      ...favoritesVm.recentCards.map((card) => card.id),
      ...favoritesVm.groups.flatMap((group) => group.cards.map((card) => card.id)),
    ];

    expect(visibleIds).toContain("monopoly");
    expect(visibleIds).not.toContain("uno-family");
    expect(visibleIds).not.toContain("uno");
    expect(new Set(visibleIds).size).toBe(visibleIds.length);
  });

  test("builds the in-progress view from drafts only", () => {
    const matchesByGame = {
      uno: [{ id: "m-1", date: "2026-05-15T12:00:00.000Z", players: [{ name: "Ana" }], winner: "Ana" }],
      poker: [{ id: "m-2", date: "2026-05-11T12:00:00.000Z", players: [{ name: "Beto" }], winner: "Beto" }],
    };
    const getMatches = (gameId) => matchesByGame[gameId] || [];
    const getDraft = (gameId) => (gameId === "poker" ? { players: [{ name: "Beto" }], _savedAt: 999 } : null);

    const viewModel = buildHomeViewModel({
      data: matchesByGame,
      getMatches,
      getDraft,
      t,
      locale: "es",
      activeFilter: "in-progress",
    });

    expect(viewModel.featured).toBeNull();
    expect(viewModel.recentCards).toEqual([]);
    expect(viewModel.groups).toHaveLength(1);
    expect(viewModel.groups[0].cards.map((card) => card.id)).toEqual(["poker"]);
  });

  test("renders the UNO family as a single card carrying all variants", () => {
    const getMatches = () => [];
    const getDraft = () => null;

    const viewModel = buildHomeViewModel({
      data: {},
      getMatches,
      getDraft,
      t,
      locale: "es",
    });

    const allCards = [
      ...(viewModel.featured ? [viewModel.featured] : []),
      ...viewModel.recentCards,
      ...viewModel.groups.flatMap((g) => g.cards),
    ];

    const familyCard = allCards.find((card) => card.id === "uno-family");
    expect(familyCard).toBeDefined();
    // The "Familia UNO" chip is removed from the filters, but the catalog group stays.
    expect(viewModel.filters.map((filter) => filter.key)).not.toContain("uno-family");
    expect(familyCard.isFamily).toBe(true);
    expect(familyCard.groupKey).toBe("uno-family");
    expect(familyCard.variants.map((variant) => variant.id)).toEqual(["uno", "uno_flip", "uno_dos", "uno_no_mercy"]);

    // Individual UNO variants are no longer rendered as separate cards.
    const unoVariantCards = allCards.filter((card) => ["uno", "uno_flip", "uno_dos", "uno_no_mercy"].includes(card.id));
    expect(unoVariantCards).toHaveLength(0);
  });
});
