import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { AppProvider } from "../context/AppContext";
import GameDetail from "./GameDetail";

vi.mock("./gameDetailRegistry", () => ({
  getGameComponent: () => function MockGameComponent() {
    return <div data-testid="mock-game-component">mock game content</div>;
  },
}));

const appContextValue = {
  knownNames: [],
  t: (key) => key,
  playerGroups: [],
  savePlayerGroups: vi.fn(),
  spotifyEnabled: false,
  saveSpotifyPreference: vi.fn(),
};

const game = {
  id: "uno",
  name: "UNO",
  color: "#E63946",
  type: "uno",
};

function renderGameDetail(overrides = {}) {
  return render(
    <AppProvider value={appContextValue}>
      <GameDetail
        game={game}
        onBack={vi.fn()}
        matches={[]}
        onAddMatch={vi.fn()}
        onTabChange={vi.fn()}
        onLinkedPlayersChange={vi.fn()}
        {...overrides}
      />
    </AppProvider>,
  );
}

describe("GameDetail", () => {
  test("does not react to scroll-hide chrome requests", () => {
    const { container } = renderGameDetail({ chromeHiddenByScroll: true });

    expect(screen.getByTestId("mock-game-component")).toBeInTheDocument();
    expect(container.querySelector(".detail-chrome")).not.toHaveClass("chrome--hidden");
    expect(container.querySelector(".detail-header")).not.toHaveClass("chrome--hidden");
  });

  test("keeps the detail chrome visible by default", () => {
    const { container } = renderGameDetail();

    expect(container.querySelector(".detail-chrome")).not.toHaveClass("chrome--hidden");
    expect(container.querySelector(".detail-header")).not.toHaveClass("chrome--hidden");
  });

  test("renders game name via t() and back button", () => {
    renderGameDetail();

    expect(screen.getByText("gn_uno")).toBeInTheDocument();
    expect(screen.getByLabelText("back")).toBeInTheDocument();
  });

  test("does not render the games kicker above the active game name", () => {
    const { container } = renderGameDetail();

    expect(container.querySelector(".detail-header .page-kicker")).not.toBeInTheDocument();
  });

  test("shows match count", () => {
    renderGameDetail({ matches: [{ id: "m1", players: [] }] });

    expect(screen.getByText("1 matchesPlayed")).toBeInTheDocument();
  });

  test("renders tabs for new match and stats", () => {
    renderGameDetail();

    expect(screen.getByTestId("tab-new")).toBeInTheDocument();
    expect(screen.getByTestId("tab-stats")).toBeInTheDocument();
  });

  test("renders game tabs inside the shared detail header surface", () => {
    const { container } = renderGameDetail();

    const header = container.querySelector(".detail-header");
    const tabs = container.querySelector(".detail-tabs");

    expect(header).toContainElement(tabs);
  });

  test("shows new tab active and stats tab inactive by default", () => {
    renderGameDetail();

    expect(screen.getByTestId("tab-new")).toHaveClass("active");
    expect(screen.getByTestId("tab-stats")).not.toHaveClass("active");
  });

  test("calls onTabChange when a tab is clicked", () => {
    const onTabChange = vi.fn();
    renderGameDetail({ onTabChange });

    fireEvent.click(screen.getByTestId("tab-stats"));
    expect(onTabChange).toHaveBeenCalledWith("stats");
  });

  test("shows stats tab content when tab is stats", () => {
    renderGameDetail({ tab: "stats" });

    expect(screen.getByTestId("tab-stats")).toHaveClass("active");
    expect(screen.getByTestId("detail-stats-shell")).toBeInTheDocument();
  });

  test("does not show game component when on stats tab", () => {
    renderGameDetail({ tab: "stats" });

    expect(screen.queryByTestId("mock-game-component")).not.toBeInTheDocument();
  });

  test("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    renderGameDetail({ onBack });

    fireEvent.click(screen.getByLabelText("back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  test("shows rematch banner when rematch state matches game id", () => {
    const rematchState = {
      gameId: "uno",
      playerNames: ["Ana", "Bruno"],
    };
    renderGameDetail({ tab: "stats", rematchState });

    expect(screen.getByTestId("game-detail-rematch-banner")).toBeInTheDocument();
    expect(screen.getByText("Ana · Bruno")).toBeInTheDocument();
  });

  test("rematch action button calls onRematch and clears state", () => {
    const onRematch = vi.fn();
    const onRematchStateChange = vi.fn();
    const rematchState = {
      gameId: "uno",
      playerNames: ["Ana", "Bruno"],
    };
    renderGameDetail({
      tab: "stats",
      rematchState,
      onRematch,
      onRematchStateChange,
    });

    fireEvent.click(screen.getByTestId("game-detail-rematch-action"));
    expect(onRematchStateChange).toHaveBeenCalledWith(null);
    expect(onRematch).toHaveBeenCalledWith({
      playerNames: ["Ana", "Bruno"],
      linkedPlayers: [],
    });
  });

  test("dismiss button on rematch banner resets state and switches to new tab", () => {
    const onRematchStateChange = vi.fn();
    const onTabChange = vi.fn();
    const rematchState = {
      gameId: "uno",
      playerNames: ["Ana"],
    };
    renderGameDetail({
      tab: "stats",
      rematchState,
      onRematchStateChange,
      onTabChange,
    });

    const dismissBtn = screen.getByLabelText("closeMenu");
    fireEvent.click(dismissBtn);
    expect(onRematchStateChange).toHaveBeenCalledWith(null);
    expect(onTabChange).toHaveBeenCalledWith("new");
  });

  test("renders ReloadButton and ThemeToggle in toolbar", () => {
    const { container } = renderGameDetail();

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  test("re-renders on matchKey change", () => {
    const { rerender } = renderGameDetail({ matchKey: 0 });

    expect(screen.getByTestId("mock-game-component")).toBeInTheDocument();

    rerender(
      <AppProvider value={appContextValue}>
        <GameDetail
          game={game}
          onBack={vi.fn()}
          matches={[]}
          onAddMatch={vi.fn()}
          onTabChange={vi.fn()}
          onLinkedPlayersChange={vi.fn()}
          matchKey={1}
        />
      </AppProvider>,
    );

    expect(screen.getByTestId("mock-game-component")).toBeInTheDocument();
  });

  test("renders StatsTab for non-racha games", () => {
    renderGameDetail({ tab: "stats", matches: [{ id: "m1", players: [] }] });

    expect(screen.getByTestId("detail-stats-shell")).toBeInTheDocument();
  });

  test("stops timer when switching away from new tab", () => {
    vi.useFakeTimers();
    const { rerender } = renderGameDetail({ tab: "new" });

    vi.advanceTimersByTime(3000);

    rerender(
      <AppProvider value={appContextValue}>
        <GameDetail
          game={game}
          onBack={vi.fn()}
          matches={[]}
          onAddMatch={vi.fn()}
          onTabChange={vi.fn()}
          onLinkedPlayersChange={vi.fn()}
          tab="stats"
        />
      </AppProvider>,
    );

    expect(screen.queryByText(/^\d+:\d{2}$/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
