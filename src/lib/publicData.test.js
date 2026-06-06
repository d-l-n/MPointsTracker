import { describe, expect, test } from "vitest";
import { normalizePublicProfile, computePublicStats } from "./publicData.ts";

describe("normalizePublicProfile", () => {
  test("returns null fields when called without args", () => {
    expect(normalizePublicProfile()).toEqual({
      displayName: null, photoURL: null, lastLogin: null, email: null,
    });
  });

  test("returns null fields when given empty object", () => {
    expect(normalizePublicProfile({})).toEqual({
      displayName: null, photoURL: null, lastLogin: null, email: null,
    });
  });

  test("extracts top-level fields", () => {
    const profile = normalizePublicProfile({
      displayName: "Alice", photoURL: "alice.jpg", lastLogin: 123,
    });
    expect(profile.displayName).toBe("Alice");
    expect(profile.photoURL).toBe("alice.jpg");
    expect(profile.lastLogin).toBe(123);
    expect(profile.email).toBeNull();
  });

  test("falls back to profile sub-object", () => {
    const profile = normalizePublicProfile({
      profile: { displayName: "Bob", email: "bob@test.com", lastLogin: 456 },
    });
    expect(profile.displayName).toBe("Bob");
    expect(profile.email).toBe("bob@test.com");
    expect(profile.lastLogin).toBe(456);
  });

  test("prefers top-level over profile sub-object", () => {
    const profile = normalizePublicProfile({
      displayName: "Top",
      photoURL: "top.jpg",
      profile: { displayName: "Sub", photoURL: "sub.jpg" },
    });
    expect(profile.displayName).toBe("Top");
    expect(profile.photoURL).toBe("top.jpg");
  });
});

describe("computePublicStats", () => {
  test("returns null when playerName is empty", () => {
    expect(computePublicStats({}, "")).toBeNull();
  });

  test("computes stats for a player across games", () => {
    const data = {
      uno: [
        { winner: "Alice", players: [{ name: "Alice" }, { name: "Bob" }] },
        { winner: "Bob", players: [{ name: "Alice" }, { name: "Bob" }] },
        { winner: "Alice", players: [{ name: "Alice" }, { name: "Bob" }] },
      ],
    };
    const stats = computePublicStats(data, "Alice");
    expect(stats.totalMatches).toBe(3);
    expect(stats.totalWins).toBe(2);
    expect(stats.winrate).toBe(67);
    expect(stats.byGame.uno.played).toBe(3);
    expect(stats.byGame.uno.wins).toBe(2);
    expect(stats.byGame.uno.winrate).toBe(67);
  });

  test("skips meta keys and non-array entries", () => {
    const data = {
      __meta: [{ winner: "Alice", players: [{ name: "Alice" }] }],
      config: "not-an-array",
    };
    const stats = computePublicStats(data, "Alice");
    expect(stats.totalMatches).toBe(0);
    expect(stats.totalWins).toBe(0);
  });

  test("handles string-based player entries", () => {
    const data = {
      poker: [
        { winner: "Alice", players: ["Alice", "Bob"] },
      ],
    };
    const stats = computePublicStats(data, "Alice");
    expect(stats.totalMatches).toBe(1);
    expect(stats.totalWins).toBe(1);
  });

  test("handles null/undefined data", () => {
    expect(computePublicStats(null, "Alice")).toEqual({
      totalMatches: 0, totalWins: 0, winrate: 0, byGame: {},
    });
    expect(computePublicStats(undefined, "Alice")).toEqual({
      totalMatches: 0, totalWins: 0, winrate: 0, byGame: {},
    });
  });

  test("handles matches without players array", () => {
    const data = {
      uno: [
        { winner: "Alice" },
      ],
    };
    expect(computePublicStats(data, "Alice")).toEqual({
      totalMatches: 0, totalWins: 0, winrate: 0, byGame: {},
    });
  });
});
