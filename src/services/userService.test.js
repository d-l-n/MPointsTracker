import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, ...parts) => parts.join("/")),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn((n) => ({ limit: n })),
  query: vi.fn((...args) => args),
  setDoc: vi.fn(),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  writeBatch: vi.fn(),
}));

vi.mock("../lib/firebase", () => ({ fbDb: {}, fbAuth: { currentUser: null } }));

import { collection, getDocs, limit, query, where, writeBatch } from "firebase/firestore";
import { pullSharedMatches, searchUsersByName } from "./userService.ts";

const mkDoc = (id, data) => ({ id, data: () => data });

describe("searchUsersByName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns empty for a blank or whitespace-only query without querying", async () => {
    expect(await searchUsersByName("", "self", 8)).toEqual([]);
    expect(await searchUsersByName("   ", "self", 8)).toEqual([]);
    expect(getDocs).not.toHaveBeenCalled();
  });

  test("builds a lowercased prefix range query on searchName with limit(maxResults + 1)", async () => {
    getDocs.mockResolvedValue({ docs: [] });
    await searchUsersByName("  ANA ", "self", 8);

    expect(collection).toHaveBeenCalledWith(expect.anything(), "users");
    expect(where).toHaveBeenNthCalledWith(1, "searchName", ">=", "ana");
    expect(where).toHaveBeenNthCalledWith(2, "searchName", "<=", "ana\uf8ff");
    expect(limit).toHaveBeenCalledWith(9); // maxResults + 1 absorbs the self-filter
    expect(query).toHaveBeenCalledTimes(1);
  });

  test("returns normalized profiles with root-level displayName", async () => {
    getDocs.mockResolvedValue({
      docs: [
        mkDoc("u1", { displayName: "Ana García", searchName: "ana garcía", photoURL: "p.jpg", lastLogin: 5 }),
      ],
    });
    const results = await searchUsersByName("ana", "self", 8);
    expect(results).toEqual([
      {
        uid: "u1",
        profile: { displayName: "Ana García", photoURL: "p.jpg", lastLogin: 5, email: null },
      },
    ]);
  });

  test("falls back to legacy profile.displayName when root displayName is missing", async () => {
    getDocs.mockResolvedValue({
      docs: [mkDoc("u9", { profile: { displayName: "Legacy User" } })],
    });
    const results = await searchUsersByName("legacy", "self", 8);
    expect(results[0].profile.displayName).toBe("Legacy User");
  });

  test("excludes the current user from results", async () => {
    getDocs.mockResolvedValue({
      docs: [
        mkDoc("self", { displayName: "Yo", searchName: "yo" }),
        mkDoc("u1", { displayName: "Otro", searchName: "otro" }),
      ],
    });
    const results = await searchUsersByName("o", "self", 8);
    expect(results.map((r) => r.uid)).toEqual(["u1"]);
  });

  test("caps results at maxResults after self-exclusion", async () => {
    const docs = Array.from({ length: 10 }, (_, i) =>
      mkDoc(`u${i}`, { displayName: `User ${i}`, searchName: `user ${i}` }));
    getDocs.mockResolvedValue({ docs });
    const results = await searchUsersByName("user", "nobody", 8);
    expect(results).toHaveLength(8);
  });
});

describe("pullSharedMatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeBatch.mockReturnValue({ delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) });
  });

  test("returns empty maps when there are no shared docs", async () => {
    getDocs.mockResolvedValue({ empty: true, docs: [] });
    expect(await pullSharedMatches("u1")).toEqual({ matches: {}, deletions: [] });
  });

  test("groups matches by game and separates deletion tombstones", async () => {
    getDocs.mockResolvedValue({
      empty: false,
      docs: [
        { ref: "ref-1", data: () => ({ id: "m1", _gameId: "uno", winner: "Ana" }) },
        { ref: "ref-2", data: () => ({ _deleted: true, _gameId: "truco", _matchId: "m2" }) },
        { ref: "ref-3", data: () => ({ id: "m3", _gameId: "uno" }) },
      ],
    });

    const result = await pullSharedMatches("u1");

    expect(result.matches.uno).toHaveLength(2);
    expect(result.matches.uno[0].id).toBe("m1");
    expect(result.deletions).toEqual([{ gameId: "truco", matchId: "m2" }]);
  });

  test("ignores docs without a game id and malformed tombstones", async () => {
    getDocs.mockResolvedValue({
      empty: false,
      docs: [
        { ref: "ref-1", data: () => ({ id: "m1" }) },
        { ref: "ref-2", data: () => ({ _deleted: true }) },
      ],
    });

    const result = await pullSharedMatches("u1");
    expect(result).toEqual({ matches: {}, deletions: [] });
  });
});
