import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

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
  };
  return labels[key] || key;
};

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
});
