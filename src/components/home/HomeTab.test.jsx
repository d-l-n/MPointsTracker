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
  test("removes the UNO family filter chip but keeps the catalog card", () => {
    const matchesByGame = {
      uno: [{ id: "m-1", date: "2026-05-15T12:00:00.000Z", players: [{ name: "Ana" }], winner: "Ana" }],
    };
    const getMatches = (g) => matchesByGame[g] || [];
    render(<HomeTab {...baseProps} data={matchesByGame} getMatches={getMatches} />);

    // UNO renders as a single "uno-family" card in the catalog (default view).
    expect(screen.getByTestId("game-uno-family")).toBeDefined();

    // The "Familia UNO" filter chip is no longer rendered.
    expect(screen.queryByRole("button", { name: "unoFamily" })).not.toBeInTheDocument();

    // The generic "cards" chip still excludes the UNO family card.
    fireEvent.click(screen.getByRole("button", { name: "cardsGroup" }));
    expect(screen.queryByTestId("game-uno-family")).not.toBeInTheDocument();
  });
});
