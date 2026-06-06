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

    expect(viewModel.featured?.id).toBe("uno");
    expect(viewModel.recentCards.some((card) => card.id === "uno")).toBe(false);
    expect(viewModel.groups.some((group) => group.cards.some((card) => card.id === "uno"))).toBe(false);
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
});
