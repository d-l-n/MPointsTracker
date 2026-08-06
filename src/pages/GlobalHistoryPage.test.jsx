import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AppProvider } from "../context/AppContext";
import GlobalHistoryPage from "./GlobalHistoryPage";

const t = (key) => {
  const labels = {
    filterAll: "All",
    filterMonth: "Month",
    filterWeek: "Week",
    rounds: "rounds",
    durationMin: "min",
    until: "Until",
    results: "results",
    editMatch: "Edit match",
    deleteMatch: "Delete match",
    deleteMatchMsg: "Are you sure?",
    deleted: "Deleted",
    undo: "Undo",
    deletedUndone: "Restored",
    matchUpdated: "Updated",
    noMatches: "No matches",
    playFirst: "Play your first!",
    searchPlayer: "Search player",
    noResults: "No results",
  };
  return labels[key] || key;
};

function renderPage(overrides = {}) {
  const showToast = vi.fn();
  const delMatch = vi.fn();
  const editMatch = vi.fn();

  const result = render(
    <AppProvider
      value={{
        user: null,
        dark: false,
        lang: "en",
        t,
        showToast,
        data: {
          truco: [
            {
              id: "m1",
              date: "2026-06-01T12:00:00.000Z",
              players: [
                { name: "Alice", score: 15 },
                { name: "Bob", score: 10 },
              ],
              winner: "Alice",
              rounds: 3,
            },
            {
              id: "m2",
              date: "2026-06-02T12:00:00.000Z",
              players: [
                { name: "Alice", score: 12 },
                { name: "Bob", score: 8 },
              ],
              winner: "Bob",
              rounds: 2,
            },
          ],
        },
        playerGroups: [],
        savePlayerGroups: vi.fn(),
        spotifyEnabled: false,
        saveSpotifyPreference: vi.fn(),
        knownNames: [],
        getMatches: vi.fn(() => []),
        addMatch: vi.fn(),
        delMatch,
        editMatch,
        ...overrides,
      }}
    >
      <GlobalHistoryPage />
    </AppProvider>,
  );

  return { container: result.container, showToast, delMatch, editMatch };
}

let promptSpy;

beforeEach(() => {
  vi.useFakeTimers();
  promptSpy = vi.spyOn(window, "prompt").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  promptSpy?.mockRestore();
});

describe("GlobalHistoryPage", () => {
  test("shows saved UNO roster changes in history cards", () => {
    render(
      <AppProvider
        value={{
          user: null,
          dark: false,
          lang: "en",
          t,
          showToast: vi.fn(),
          data: {
            uno: [
              {
                id: "uno-history-roster",
                date: "2026-05-20T12:00:00.000Z",
                players: [
                  { name: "Ana", score: 500 },
                  { name: "Bruno", score: 220 },
                  { name: "Clara", score: 120 },
                ],
                winner: "Ana",
                rounds: 4,
                rosterEvents: [
                  { type: "join", playerId: "clara-id", playerName: "Clara", effectiveRound: 2 },
                  { type: "leave", playerId: "bruno-id", playerName: "Bruno", effectiveRound: 4, retentionMode: "keep-record" },
                ],
                inactivePlayers: ["bruno-id"],
              },
            ],
          },
          playerGroups: [],
          savePlayerGroups: vi.fn(),
          spotifyEnabled: false,
          saveSpotifyPreference: vi.fn(),
          knownNames: [],
          getMatches: vi.fn(() => []),
          addMatch: vi.fn(),
          delMatch: vi.fn(),
          editMatch: vi.fn(),
        }}
      >
        <GlobalHistoryPage />
      </AppProvider>,
    );

    expect(screen.getByText("+Clara R2 · -Bruno R4")).toBeInTheDocument();
  });

  test("legacy matches without a game field still render and are filterable (#18)", () => {
    renderPage({
      data: {
        truco: [
          {
            id: "legacy-m1",
            date: "2026-06-01T12:00:00.000Z",
            players: [{ name: "Alice", score: 15 }, { name: "Bob", score: 10 }],
            winner: "Alice",
            rounds: 3,
          },
        ],
        uno: [
          {
            id: "new-m2",
            date: "2026-06-02T12:00:00.000Z",
            game: "uno",
            players: [{ name: "Alice", score: 12 }, { name: "Bob", score: 8 }],
            winner: "Bob",
            rounds: 2,
          },
        ],
      },
    });

    // Legacy match has no `game` property — must fall back to the storage key (truco)
    expect(screen.getByTestId("match-legacy-m1")).toBeInTheDocument();
    expect(screen.getByTestId("match-legacy-m1")).toHaveTextContent("Alice");
    expect(screen.getByTestId("match-new-m2")).toBeInTheDocument();

    // Game filter is derived from the fallback, so the legacy game is listed and selectable
    const gameFilterButton = screen.getByTestId("history-filter-game-truco");
    expect(gameFilterButton).toBeInTheDocument();
    fireEvent.click(gameFilterButton);

    expect(screen.getByTestId("match-legacy-m1")).toBeInTheDocument();
    expect(screen.queryByTestId("match-new-m2")).not.toBeInTheDocument();
  });

  describe("undo delete (T3)", () => {
    test("shows confirm modal then shows undo toast on confirm", () => {
      const { showToast, delMatch } = renderPage();
      const confirm = () => screen.getByText("Eliminar");

      fireEvent.click(screen.getByTestId("delete-match-m1"));
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();

      fireEvent.click(confirm());

      expect(showToast).toHaveBeenCalledWith("Deleted", 5000, {
        label: "Undo",
        onAction: expect.any(Function),
      });
      expect(screen.queryByTestId("match-m1")).not.toBeInTheDocument();
      expect(delMatch).not.toHaveBeenCalled();
    });

    test("restores match on undo action", () => {
      let actionCb;
      const showToast = vi.fn((_msg, _dur, action) => {
        if (action) actionCb = action.onAction;
      });
      const { delMatch } = renderPage({ showToast });
      const confirm = () => screen.getByText("Eliminar");

      fireEvent.click(screen.getByTestId("delete-match-m1"));
      fireEvent.click(confirm());

      expect(screen.queryByTestId("match-m1")).not.toBeInTheDocument();

      act(() => { actionCb(); });

      expect(screen.getByTestId("match-m1")).toBeInTheDocument();
      expect(delMatch).not.toHaveBeenCalled();
    });

    test("calls delMatch after 5s timeout when not undone", () => {
      const { showToast, delMatch } = renderPage();
      const confirm = () => screen.getByText("Eliminar");

      fireEvent.click(screen.getByTestId("delete-match-m1"));
      fireEvent.click(confirm());
      expect(delMatch).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(5000); });

      expect(delMatch).toHaveBeenCalledWith("truco", "m1");
    });
  });

  describe("long-press rename (T4)", () => {
    function aliceName(container) {
      return container.querySelector('.mpname.w, .mpname:not(.w)');
    }

    test("renames player on 500ms pointer down and prompt accepted", () => {
      promptSpy.mockReturnValue("NewAlice");
      const { editMatch, container } = renderPage();

      const nameSpan = aliceName(container);
      fireEvent.pointerDown(nameSpan);
      act(() => { vi.advanceTimersByTime(500); });

      expect(promptSpy).toHaveBeenCalled();
      expect(editMatch).toHaveBeenCalledWith("truco", expect.objectContaining({
        players: expect.arrayContaining([
          expect.objectContaining({ name: "NewAlice" }),
        ]),
      }));
    });

    test("does NOT rename on pointer cancellation before 500ms", () => {
      const { editMatch, container } = renderPage();

      const nameSpan = aliceName(container);
      fireEvent.pointerDown(nameSpan);
      act(() => { vi.advanceTimersByTime(200); });
      fireEvent.pointerUp(nameSpan);
      act(() => { vi.advanceTimersByTime(500); });

      expect(promptSpy).not.toHaveBeenCalled();
      expect(editMatch).not.toHaveBeenCalled();
    });

    test("does NOT rename if prompt is cancelled", () => {
      promptSpy.mockReturnValue(null);
      const { editMatch, container } = renderPage();

      const nameSpan = aliceName(container);
      fireEvent.pointerDown(nameSpan);
      act(() => { vi.advanceTimersByTime(500); });

      expect(promptSpy).toHaveBeenCalled();
      expect(editMatch).not.toHaveBeenCalled();
    });

    test("does NOT rename if prompt returns empty string", () => {
      promptSpy.mockReturnValue("");
      const { editMatch, container } = renderPage();

      const nameSpan = aliceName(container);
      fireEvent.pointerDown(nameSpan);
      act(() => { vi.advanceTimersByTime(500); });

      expect(editMatch).not.toHaveBeenCalled();
    });

    test("does NOT rename on pointerLeave", () => {
      const { editMatch, container } = renderPage();

      const nameSpan = aliceName(container);
      fireEvent.pointerDown(nameSpan);
      act(() => { vi.advanceTimersByTime(200); });
      fireEvent.pointerLeave(nameSpan);
      act(() => { vi.advanceTimersByTime(500); });

      expect(promptSpy).not.toHaveBeenCalled();
      expect(editMatch).not.toHaveBeenCalled();
    });
  });

  describe("swipe-to-delete (T5)", () => {
    function fireSwipe(card, fromX, fromY, toX, toY) {
      fireEvent.touchStart(card, { touches: [{ clientX: fromX, clientY: fromY }] });
      fireEvent.touchMove(card, { touches: [{ clientX: toX, clientY: toY }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: toX, clientY: toY }] });
    }

    test("shows undo toast when swiped past threshold", () => {
      const { showToast } = renderPage();
      const card = screen.getByTestId("match-m1");

      fireSwipe(card, 200, 100, 100, 105);

      expect(showToast).toHaveBeenCalledWith("Deleted", 5000, {
        label: "Undo",
        onAction: expect.any(Function),
      });
      expect(screen.queryByTestId("match-m1")).not.toBeInTheDocument();
    });

    test("does NOT delete when swipe is below threshold", () => {
      const { showToast, delMatch } = renderPage();
      const card = screen.getByTestId("match-m1");

      fireSwipe(card, 200, 100, 150, 105);

      expect(showToast).not.toHaveBeenCalled();
      expect(delMatch).not.toHaveBeenCalled();
      expect(screen.getByTestId("match-m1")).toBeInTheDocument();
    });

    test("does NOT delete when swiping right (positive delta)", () => {
      const { showToast } = renderPage();
      const card = screen.getByTestId("match-m1");

      fireSwipe(card, 100, 100, 200, 105);

      expect(showToast).not.toHaveBeenCalled();
    });

    test("does NOT delete when vertical swipe dominates", () => {
      const { showToast } = renderPage();
      const card = screen.getByTestId("match-m1");

      fireSwipe(card, 200, 100, 100, 250);

      expect(showToast).not.toHaveBeenCalled();
    });

    test("restores match on swipe undo action", () => {
      let actionCb;
      const showToast = vi.fn((_msg, _dur, action) => {
        if (action) actionCb = action.onAction;
      });
      const { delMatch } = renderPage({ showToast });
      const card = screen.getByTestId("match-m1");

      fireSwipe(card, 200, 100, 100, 105);

      expect(screen.queryByTestId("match-m1")).not.toBeInTheDocument();

      act(() => { actionCb(); });

      expect(screen.getByTestId("match-m1")).toBeInTheDocument();
      expect(delMatch).not.toHaveBeenCalled();
    });

    test("calls delMatch after 5s when swipe not undone", () => {
      const { showToast, delMatch } = renderPage();
      const card = screen.getByTestId("match-m1");

      fireSwipe(card, 200, 100, 100, 105);

      act(() => { vi.advanceTimersByTime(5000); });

      expect(delMatch).toHaveBeenCalledWith("truco", "m1");
    });
  });
});
