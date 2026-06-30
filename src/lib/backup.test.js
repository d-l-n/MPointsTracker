import { describe, expect, it } from "vitest";
import { parseBackupJson } from "./backup";

describe("parseBackupJson", () => {
  it("keeps only game arrays and drops metadata keys", () => {
    const result = parseBackupJson(JSON.stringify({
      uno: [{ id: "m1", date: 1, players: [{ name: "Ana", score: 10 }], winner: "Ana" }],
      __theme: true,
      bad: "nope",
    }));

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      uno: [{ id: "m1", date: 1, players: [{ name: "Ana", score: 10 }], winner: "Ana" }],
    });
    expect(result.matchCount).toBe(1);
  });

  it("rejects invalid JSON", () => {
    expect(parseBackupJson("{nope").ok).toBe(false);
  });

  it("rejects non-object and empty backups", () => {
    expect(parseBackupJson("[]")).toEqual({ ok: false, error: "invalid-shape" });
    expect(parseBackupJson(JSON.stringify({ __theme: true }))).toEqual({ ok: false, error: "empty" });
  });
});
