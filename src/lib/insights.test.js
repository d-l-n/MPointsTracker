import { describe, expect, it } from "vitest";
import { buildAchievements, buildInsights } from "./insights";

const matches = [
  { id: "1", date: 1, winner: "Ana", players: [{ name: "Ana" }, { name: "Beto" }] },
  { id: "2", date: 2, winner: "Ana", players: [{ name: "Ana" }, { name: "Beto" }] },
  { id: "3", date: 3, winner: "Beto", players: [{ name: "Ana" }, { name: "Beto" }] },
];

describe("buildInsights", () => {
  it("returns top winner and most played matchup", () => {
    expect(buildInsights(matches)).toMatchObject({
      topWinner: { name: "Ana", wins: 2 },
      mostPlayedMatchup: { names: ["Ana", "Beto"], count: 3 },
    });
  });
});

describe("buildAchievements", () => {
  it("unlocks first milestones from existing stats", () => {
    expect(buildAchievements(matches, "Ana").map((a) => a.id)).toContain("first-win");
  });
});
