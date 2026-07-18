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

describe("HomeTab family picker", () => {
  test("clicking the UNO family card opens the variant picker", () => {
    const matchesByGame = {
      uno: [{ id: "m-1", date: "2026-05-15T12:00:00.000Z", players: [{ name: "Ana" }], winner: "Ana" }],
    };
    const getMatches = (g) => matchesByGame[g] || [];
    render(<HomeTab {...baseProps} data={matchesByGame} getMatches={getMatches} />);

    const familyCard = screen.getByTestId("game-uno-family");
    fireEvent.click(familyCard);

    console.log("ONOPENGAME CALLS:", baseProps.onOpenGame.mock.calls.length);
    console.log("PICKER HTML:", screen.queryByTestId("uno-family-picker")?.outerHTML || "NULL");
    expect(screen.queryByTestId("uno-family-picker")).not.toBeNull();
    expect(screen.getByTestId("uno-family-variant-uno_flip")).not.toBeNull();
  });
});
