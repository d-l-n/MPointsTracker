import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import { buildStats, buildH2H, fmtDate, getAllPastPlayerNames, setFmtDateLang } from "./stats.ts";

describe("stats helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T15:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    setFmtDateLang("es");
  });

  test("buildStats aggregates wins, games played and streaks across multiple matches", () => {
    const matches = [
      {
        date: "2026-05-10T10:00:00.000Z",
        players: [{ name: "Ana" }, { name: "Beto" }, { name: "Clara" }],
        winner: "Ana",
        _gameId: "uno",
      },
      {
        date: "2026-05-11T10:00:00.000Z",
        players: [{ name: "Ana" }, { name: "Beto" }],
        winner: "Beto",
        _gameId: "poker",
      },
      {
        date: "2026-05-12T10:00:00.000Z",
        players: [{ name: "Ana" }, { name: "Clara" }],
        winner: "Ana",
        _gameId: "ajedrez",
      },
      {
        date: "2026-05-13T10:00:00.000Z",
        players: [{ name: "Clara" }, { name: "Beto" }],
        winner: "Clara",
        _gameId: "sushi_do",
      },
    ];

    const stats = buildStats(matches);

    expect(stats[0]).toEqual({ name: "Ana", wins: 2, played: 3, winrate: 67, streak: { current: 1, max: 1 } });
    expect(stats).toEqual(expect.arrayContaining([
      { name: "Beto", wins: 1, played: 3, winrate: 33, streak: { current: 0, max: 1 } },
      { name: "Clara", wins: 1, played: 3, winrate: 33, streak: { current: 1, max: 1 } },
    ]));
  });

  test("getAllPastPlayerNames dedupes names, trims whitespace and ignores meta keys", () => {
    const data = {
      __meta: [{ players: [{ name: "No Cuenta" }] }],
      uno: [
        { players: [{ name: " Ana " }, { name: "Beto" }] },
        { players: [{ name: "Ana" }, { name: "Clara" }] },
      ],
      poker: [
        { players: [{ name: "Beto" }, { name: "Dani" }] },
      ],
    };

    expect(getAllPastPlayerNames(data)).toEqual(["Ana", "Beto", "Clara", "Dani"]);
  });

  test("fmtDate localizes today, yesterday and older dates", () => {
    setFmtDateLang("es");
    expect(fmtDate("2026-05-16T13:00:00.000Z").toLowerCase()).toContain("hoy");
    expect(fmtDate("2026-05-15T13:00:00.000Z").toLowerCase()).toContain("ayer");

    setFmtDateLang("en");
    expect(fmtDate("2026-05-16T13:00:00.000Z").toLowerCase()).toContain("today");

    setFmtDateLang("de");
    expect(fmtDate("2026-05-08T13:00:00.000Z")).toMatch(/\d{2}\.\s?\w+\.?\s?\d{4}|\d{2}\.\d{2}\.\d{4}/);
  });

  describe("buildH2H", () => {
    test("returns null when either name is empty or same", () => {
      expect(buildH2H([], "", "B")).toBeNull();
      expect(buildH2H([], "A", "")).toBeNull();
      expect(buildH2H([], "A", "A")).toBeNull();
    });

    test("returns empty result when players have no shared matches", () => {
      const matches = [
        { date: "2026-05-10", players: [{ name: "A" }, { name: "C" }], winner: "A" },
        { date: "2026-05-11", players: [{ name: "B" }, { name: "C" }], winner: "B" },
      ];
      const result = buildH2H(matches, "A", "B");
      expect(result.winsA).toBe(0);
      expect(result.winsB).toBe(0);
      expect(result.shared).toEqual([]);
    });

    test("tracks wins, losses, draws and per-game breakdown", () => {
      const matches = [
        { date: "2026-05-10", players: [{ name: "A" }, { name: "B" }], winner: "A", _gameId: "uno" },
        { date: "2026-05-11", players: [{ name: "A" }, { name: "B" }], winner: "B", _gameId: "poker" },
        { date: "2026-05-12", players: [{ name: "A" }, { name: "B" }], winner: "A", _gameId: "uno" },
        { date: "2026-05-13", players: [{ name: "A" }, { name: "B" }], winner: "B", _gameId: "ajedrez" },
      ];
      const result = buildH2H(matches, "A", "B");
      expect(result.winsA).toBe(2);
      expect(result.winsB).toBe(2);
      expect(result.draws).toBe(0);
      expect(result.byGame.uno.played).toBe(2);
      expect(result.byGame.uno.winsA).toBe(2);
      expect(result.currentStreakHolder).toBe("B");
      expect(result.currentStreakCount).toBe(1);
    });

    test("tracks longest streaks for each player", () => {
      const matches = [
        { date: "2026-05-10", players: [{ name: "A" }, { name: "B" }], winner: "A" },
        { date: "2026-05-11", players: [{ name: "A" }, { name: "B" }], winner: "A" },
        { date: "2026-05-12", players: [{ name: "A" }, { name: "B" }], winner: "B" },
        { date: "2026-05-13", players: [{ name: "A" }, { name: "B" }], winner: "A" },
      ];
      const result = buildH2H(matches, "A", "B");
      expect(result.streakA).toBe(2);
      expect(result.streakB).toBe(1);
    });

    test("records draws when match has no winner", () => {
      const matches = [
        { date: "2026-05-10", players: [{ name: "A" }, { name: "B" }], winner: null },
      ];
      const result = buildH2H(matches, "A", "B");
      expect(result.draws).toBe(1);
      expect(result.winsA).toBe(0);
      expect(result.winsB).toBe(0);
      expect(result.currentStreakHolder).toBeNull();
    });

    test("tracks consecutive wins at the end as current streak", () => {
      const matches = [
        { date: "2026-05-10", players: [{ name: "A" }, { name: "B" }], winner: "B" },
        { date: "2026-05-11", players: [{ name: "A" }, { name: "B" }], winner: "A" },
        { date: "2026-05-12", players: [{ name: "A" }, { name: "B" }], winner: "A" },
      ];
      const result = buildH2H(matches, "A", "B");
      expect(result.winsA).toBe(2);
      expect(result.winsB).toBe(1);
      expect(result.currentStreakHolder).toBe("A");
      expect(result.currentStreakCount).toBe(2);
    });
  });
});
