import { describe, expect, test } from "vitest";
import { formatUnoRosterSummary } from "./unoRosterSummary";

describe("formatUnoRosterSummary", () => {
  test("returns null for null/undefined match", () => {
    expect(formatUnoRosterSummary(null)).toBeNull();
    expect(formatUnoRosterSummary(undefined)).toBeNull();
  });

  test("returns null when rosterEvents is empty", () => {
    expect(formatUnoRosterSummary({ rosterEvents: [] })).toBeNull();
  });

  test("returns null when rosterEvents is missing", () => {
    expect(formatUnoRosterSummary({})).toBeNull();
  });

  test("formats a single join event", () => {
    const result = formatUnoRosterSummary({
      rosterEvents: [{ type: "join", playerId: "p1", playerName: "Alice", effectiveRound: 3 }],
    });
    expect(result).toBe("+Alice R3");
  });

  test("formats a single leave event", () => {
    const result = formatUnoRosterSummary({
      rosterEvents: [{ type: "leave", playerId: "p1", playerName: "Bob", effectiveRound: 2 }],
    });
    expect(result).toBe("-Bob R2");
  });

  test("sorts events by round and joins with separator", () => {
    const result = formatUnoRosterSummary({
      rosterEvents: [
        { type: "join", playerId: "p2", playerName: "Bob", effectiveRound: 5 },
        { type: "join", playerId: "p1", playerName: "Alice", effectiveRound: 3 },
      ],
    });
    expect(result).toBe("+Alice R3 · +Bob R5");
  });

  test("uses round 1 for invalid round values", () => {
    const result = formatUnoRosterSummary({
      rosterEvents: [
        { type: "join", playerId: "p1", playerName: "Charlie", effectiveRound: -1 },
      ],
    });
    expect(result).toBe("+Charlie R1");
  });

  test("filters out events with empty player name", () => {
    const result = formatUnoRosterSummary({
      rosterEvents: [
        { type: "join", playerId: "p1", playerName: "  ", effectiveRound: 1 },
        { type: "join", playerId: "p2", playerName: "Diana", effectiveRound: 2 },
      ],
    });
    expect(result).toBe("+Diana R2");
  });
});
