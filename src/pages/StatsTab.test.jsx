import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import StatsTab from "./StatsTab";

const t = (key) => {
  const labels = {
    matches: "Matches",
    rounds: "Rounds",
    leaderboard: "Leaderboard",
    matchesPlayed: "matches",
    detailRecentMatches: "Recent matches",
    detailViewAll: "View all",
    noNamePlaceholder: "No name",
    homeActionStats: "Stats",
    noStats: "No stats",
  };
  return labels[key] || key;
};

describe("StatsTab", () => {
  test("shows saved UNO roster changes in the recent-match preview", () => {
    render(
      <StatsTab
        t={t}
        matches={[
          {
            id: "uno-roster-preview",
            date: "2026-05-20T12:00:00.000Z",
            players: [{ name: "Ana" }, { name: "Bruno" }, { name: "Clara" }],
            winner: "Ana",
            rounds: 4,
            rosterEvents: [
              { type: "join", playerId: "clara-id", playerName: "Clara", effectiveRound: 2 },
              { type: "leave", playerId: "bruno-id", playerName: "Bruno", effectiveRound: 4, retentionMode: "keep-record" },
            ],
            inactivePlayers: ["bruno-id"],
          },
        ]}
      />,
    );

    expect(screen.getByText("+Clara R2 · -Bruno R4")).toBeInTheDocument();
  });
});
