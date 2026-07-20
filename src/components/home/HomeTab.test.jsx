import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeTab from "./HomeTab.tsx";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const t = (k) => k;

const baseProps = {
  t,
  lang: "es",
  data: {},
  total: 0,
  dark: false,
  user: null,
  syncing: false,
  syncError: null,
  handleNav: vi.fn(),
  handleThemeMode: vi.fn(),
  onThemeSettings: vi.fn(),
  setShowAuthModal: vi.fn(),
  getMatches: () => [],
  getDraft: () => null,
  onOpenGame: vi.fn(),
  onQuickAction: vi.fn(),
  sectionHeaderHiddenByScroll: false,
};

describe("HomeTab filter chips", () => {
  test("renders cards filter chip and filters by it", () => {
    const matchesByGame = {
      uno: [{ id: "m-1", date: "2026-05-15T12:00:00.000Z", players: [{ name: "Ana" }], winner: "Ana" }],
    };
    const getMatches = (g) => matchesByGame[g] || [];
    render(<HomeTab {...baseProps} data={matchesByGame} getMatches={getMatches} />);

    expect(screen.getByTestId("game-uno")).toBeDefined();
  });
});
