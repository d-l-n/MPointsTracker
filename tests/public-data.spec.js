import { test, expect } from "@playwright/test";
import {
  computePublicStats,
  normalizePublicProfile,
} from "../src/lib/publicData.ts";

test.describe("public data helpers", () => {
  test("computePublicStats aggregates only the selected player's matches", () => {
    const data = {
      __theme: true,
      uno: [
        {
          id: "uno-1",
          players: [{ name: "Ana" }, { name: "Beto" }],
          winner: "Ana",
        },
        {
          id: "uno-2",
          players: [{ name: "Ana" }, { name: "Carla" }],
          winner: "Carla",
        },
      ],
      truco: [
        {
          id: "truco-1",
          players: [{ name: "Dani" }, { name: "Ema" }],
          winner: "Dani",
        },
      ],
      ajedrez: [
        {
          id: "chess-1",
          players: [{ name: "Ana" }, { name: "Luis" }],
          winner: "Ana",
        },
      ],
    };

    expect(computePublicStats(data, "Ana")).toEqual({
      totalMatches: 3,
      totalWins: 2,
      winrate: 67,
      byGame: {
        uno: { played: 2, wins: 1, winrate: 50 },
        ajedrez: { played: 1, wins: 1, winrate: 100 },
      },
    });
  });

  test("normalizePublicProfile supports new and legacy documents without exposing private data", () => {
    expect(
      normalizePublicProfile({
        displayName: "Ana",
        photoURL: "https://img.test/ana.png",
        lastLogin: 123,
        data: "{\"uno\":[]}",
        playerGroups: "[\"cards\"]",
      })
    ).toEqual({
      displayName: "Ana",
      photoURL: "https://img.test/ana.png",
      lastLogin: 123,
      email: null,
    });

    expect(
      normalizePublicProfile({
        profile: {
          displayName: "Beto",
          photoURL: "https://img.test/beto.png",
          lastLogin: 456,
          email: "beto@test.dev",
        },
        data: "{\"uno\":[]}",
      })
    ).toEqual({
      displayName: "Beto",
      photoURL: "https://img.test/beto.png",
      lastLogin: 456,
      email: "beto@test.dev",
    });
  });
});
