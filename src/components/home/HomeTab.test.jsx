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

  test("in-progress filter lists every game with a saved draft", () => {
    const getMatches = () => [];
    const getDraft = (g) => {
      if (g === "uno") return { players: [{ name: "Ana" }], _savedAt: 100 };
      if (g === "truco") return { players: [{ name: "Beto" }], _savedAt: 200 };
      if (g === "poker") return { players: [{ name: "Clara" }], _savedAt: 300 };
      return null;
    };
    render(<HomeTab {...baseProps} getMatches={getMatches} getDraft={getDraft} />);

    fireEvent.click(screen.getByRole("button", { name: "homeFilterInProgress" }));

    // The UNO draft surfaces as the family card plus each other game with a draft.
    expect(screen.getByTestId("game-uno-family")).toBeInTheDocument();
    expect(screen.getByTestId("game-truco")).toBeInTheDocument();
    expect(screen.getByTestId("game-poker")).toBeInTheDocument();
  });

  test("in-progress filter renders no featured hero and no recent rail", () => {
    const getMatches = () => [];
    const getDraft = (g) => (g === "truco" ? { players: [{ name: "Beto" }], _savedAt: 100 } : null);
    const { container } = render(<HomeTab {...baseProps} getMatches={getMatches} getDraft={getDraft} />);

    fireEvent.click(screen.getByRole("button", { name: "homeFilterInProgress" }));

    expect(container.querySelector(".home-top-shell")).toBeNull();
    expect(screen.getByTestId("game-truco")).toBeInTheDocument();
  });
});
