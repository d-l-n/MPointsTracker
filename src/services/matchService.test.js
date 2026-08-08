import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db, ...parts) => parts.join("/")),
}));

vi.mock("../lib/firebase", () => ({ fbDb: {} }));

import { addDoc, collection } from "firebase/firestore";
import { shareMatchWithPlayers } from "./matchService.ts";

const BASE_MATCH = {
  id: "m1",
  date: "2026-01-01",
  players: [{ name: "Ana", score: 10 }],
  winner: "Ana",
};

const HOST = { uid: "host-1", displayName: "Host" };

describe("shareMatchWithPlayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns empty result when there are no linked players", async () => {
    const result = await shareMatchWithPlayers("uno", BASE_MATCH, [], HOST);
    expect(result).toEqual({ attempted: 0, shared: 0, failed: 0, skipped: 0 });
    expect(addDoc).not.toHaveBeenCalled();
  });

  test("skips players without uid and the host itself", async () => {
    addDoc.mockResolvedValue({});
    const result = await shareMatchWithPlayers(
      "uno",
      BASE_MATCH,
      [
        { uid: "host-1", name: "Host" },
        { name: "Sin cuenta" },
        { uid: "guest-1", name: "Ana" },
      ],
      HOST,
    );
    expect(result).toEqual({ attempted: 1, shared: 1, failed: 0, skipped: 2 });
    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(collection).toHaveBeenCalledWith(expect.anything(), "users", "guest-1", "shared_matches");
  });

  test("returns attempted 0 when every linked player lacks a uid", async () => {
    const result = await shareMatchWithPlayers(
      "uno",
      BASE_MATCH,
      [{ name: "Sin cuenta" }, { name: "Otro local" }],
      HOST,
    );
    expect(result).toEqual({ attempted: 0, shared: 0, failed: 0, skipped: 2 });
    expect(addDoc).not.toHaveBeenCalled();
  });

  test("counts failed writes", async () => {
    addDoc.mockRejectedValueOnce({ code: "permission-denied" }).mockResolvedValueOnce({});
    const result = await shareMatchWithPlayers(
      "uno",
      BASE_MATCH,
      [{ uid: "u1" }, { uid: "u2" }],
      HOST,
    );
    expect(result).toEqual({ attempted: 2, shared: 1, failed: 1, skipped: 0 });
  });

  test("adds share metadata and strips internal fields from the stored doc", async () => {
    addDoc.mockResolvedValue({});
    await shareMatchWithPlayers(
      "uno",
      {
        ...BASE_MATCH,
        _gameId: "old",
        _sharedBy: "old",
        _sharedByUid: "old",
        _sharedAt: 1,
      },
      [{ uid: "u1", name: "Ana" }],
      HOST,
    );
    expect(addDoc).toHaveBeenCalledTimes(1);
    const [collectionPath, doc] = addDoc.mock.calls[0];
    expect(collectionPath).toBe("users/u1/shared_matches");
    expect(doc._gameId).toBe("uno");
    expect(doc._sharedBy).toBe("Host");
    expect(doc._sharedByUid).toBe("host-1");
    expect(typeof doc._sharedAt).toBe("number");
    expect(doc.id).toBe("m1");
    expect(doc.winner).toBe("Ana");
  });

  test("falls back to generic sender name when host has no displayName", async () => {
    addDoc.mockResolvedValue({});
    await shareMatchWithPlayers("uno", BASE_MATCH, [{ uid: "u1" }], { uid: "host-1" });
    expect(addDoc.mock.calls[0][1]._sharedBy).toBe("Alguien");
  });
});
