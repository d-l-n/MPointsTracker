import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db, ...parts) => parts.join("/")),
}));

vi.mock("../lib/firebase", () => ({ fbDb: {} }));

import { addDoc, collection } from "firebase/firestore";
import {
  deleteSharedMatchForRecipients,
  enqueuePendingShare,
  flushPendingShares,
  getPendingShares,
  isRetryableShareError,
  mergeSharedMatchLists,
  shareMatchWithPlayers,
  updateSharedMatchForRecipients,
} from "./matchService.ts";

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
    expect(result).toEqual({ attempted: 0, shared: 0, failed: 0, skipped: 0, retryable: 0 });
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
    expect(result).toEqual({ attempted: 1, shared: 1, failed: 0, skipped: 2, retryable: 0 });
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
    expect(result).toEqual({ attempted: 0, shared: 0, failed: 0, skipped: 2, retryable: 0 });
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
    expect(result).toEqual({ attempted: 2, shared: 1, failed: 1, skipped: 0, retryable: 0 });
  });

  test("flags network errors as retryable, others not", async () => {
    addDoc.mockRejectedValueOnce({ code: "unavailable" }).mockRejectedValueOnce({ code: "permission-denied" });
    const result = await shareMatchWithPlayers(
      "uno",
      BASE_MATCH,
      [{ uid: "u1" }, { uid: "u2" }],
      HOST,
    );
    expect(result).toEqual({ attempted: 2, shared: 0, failed: 2, skipped: 0, retryable: 1 });
    expect(isRetryableShareError({ code: "network-request-failed" })).toBe(true);
    expect(isRetryableShareError({ code: "deadline-exceeded" })).toBe(true);
    expect(isRetryableShareError({ code: "permission-denied" })).toBe(false);
    expect(isRetryableShareError(new Error("boom"))).toBe(false);
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

describe("deleteSharedMatchForRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is a no-op without a match id or recipients", async () => {
    expect(await deleteSharedMatchForRecipients("uno", undefined, ["u1"], "host-1")).toEqual({ notified: 0, failed: 0 });
    expect(await deleteSharedMatchForRecipients("uno", "m1", [], "host-1")).toEqual({ notified: 0, failed: 0 });
    expect(addDoc).not.toHaveBeenCalled();
  });

  test("writes a tombstone per recipient, skipping the deleter and duplicates", async () => {
    addDoc.mockResolvedValue({});
    const result = await deleteSharedMatchForRecipients("uno", "m1", ["u1", "u1", "host-1", null], "host-1");

    expect(result).toEqual({ notified: 1, failed: 0 });
    expect(addDoc).toHaveBeenCalledTimes(1);
    const [collectionPath, doc] = addDoc.mock.calls[0];
    expect(collectionPath).toBe("users/u1/shared_matches");
    expect(doc).toMatchObject({ _deleted: true, _gameId: "uno", _matchId: "m1", _deletedBy: "host-1" });
    expect(typeof doc._deletedAt).toBe("number");
  });

  test("counts failed tombstones", async () => {
    addDoc.mockRejectedValueOnce({ code: "unavailable" }).mockResolvedValueOnce({});
    const result = await deleteSharedMatchForRecipients("uno", "m1", ["u1", "u2"], "host-1");
    expect(result).toEqual({ notified: 1, failed: 1 });
  });
});

describe("updateSharedMatchForRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is a no-op without a match, match id, or recipients", async () => {
    expect(await updateSharedMatchForRecipients("uno", null, ["u1"], "host-1")).toEqual({ notified: 0, failed: 0 });
    expect(await updateSharedMatchForRecipients("uno", { ...BASE_MATCH, id: undefined }, ["u1"], "host-1")).toEqual({
      notified: 0,
      failed: 0,
    });
    expect(await updateSharedMatchForRecipients("uno", BASE_MATCH, [], "host-1")).toEqual({ notified: 0, failed: 0 });
    expect(addDoc).not.toHaveBeenCalled();
  });

  test("writes one updated copy per recipient, skipping the editor and duplicates", async () => {
    addDoc.mockResolvedValue({});
    const result = await updateSharedMatchForRecipients(
      "uno",
      { ...BASE_MATCH, _sharedWithUids: ["u1", "u1", "host-1", null] },
      ["u1", "u1", "host-1", null],
      "host-1",
    );

    expect(result).toEqual({ notified: 1, failed: 0 });
    expect(addDoc).toHaveBeenCalledTimes(1);
    const [collectionPath, doc] = addDoc.mock.calls[0];
    expect(collectionPath).toBe("users/u1/shared_matches");
    expect(doc._gameId).toBe("uno");
    expect(typeof doc._sharedAt).toBe("number");
    expect(doc.id).toBe("m1");
    expect(doc.winner).toBe("Ana");
  });

  test("preserves _sharedBy/_sharedByUid and _sharedWithUids from the incoming match", async () => {
    addDoc.mockResolvedValue({});
    await updateSharedMatchForRecipients(
      "uno",
      {
        ...BASE_MATCH,
        _sharedBy: "Original Host",
        _sharedByUid: "orig-uid",
        _sharedAt: 123,
        _sharedWithUids: ["u1", "u2"],
      },
      ["u1"],
      "host-1",
    );
    const doc = addDoc.mock.calls[0][1];
    expect(doc._sharedBy).toBe("Original Host");
    expect(doc._sharedByUid).toBe("orig-uid");
    expect(doc._sharedWithUids).toEqual(["u1", "u2"]);
    expect(doc._sharedAt).not.toBe(123);
  });

  test("strips _deleted/_matchId and stale share metadata from the stored doc", async () => {
    addDoc.mockResolvedValue({});
    await updateSharedMatchForRecipients(
      "uno",
      {
        ...BASE_MATCH,
        _gameId: "old",
        _sharedBy: "old",
        _sharedByUid: "old",
        _sharedAt: 1,
        _deleted: true,
        _matchId: "m1",
      },
      ["u1"],
      "host-1",
    );
    const doc = addDoc.mock.calls[0][1];
    expect(doc._gameId).toBe("uno");
    expect(doc._deleted).toBeUndefined();
    expect(doc._matchId).toBeUndefined();
    expect(doc._sharedBy).toBe("old");
  });

  test("counts failed writes", async () => {
    addDoc.mockRejectedValueOnce({ code: "unavailable" }).mockResolvedValueOnce({});
    const result = await updateSharedMatchForRecipients("uno", BASE_MATCH, ["u1", "u2"], "host-1");
    expect(result).toEqual({ notified: 1, failed: 1 });
  });

  test("falls back to editorName when the incoming match has no _sharedBy", async () => {
    addDoc.mockResolvedValue({});
    await updateSharedMatchForRecipients("uno", BASE_MATCH, ["u1"], "host-1", "Editor Name");
    expect(addDoc.mock.calls[0][1]._sharedBy).toBe("Editor Name");
    expect(addDoc.mock.calls[0][1]._sharedByUid).toBe("host-1");
  });

  test("falls back to generic sender name when neither match nor editor has a name", async () => {
    addDoc.mockResolvedValue({});
    await updateSharedMatchForRecipients("uno", BASE_MATCH, ["u1"], "host-1");
    expect(addDoc.mock.calls[0][1]._sharedBy).toBe("Alguien");
  });
});

describe("mergeSharedMatchLists", () => {
  test("appends matches with new ids", () => {
    const existing = [{ id: "a", _sharedAt: 1 }];
    const incoming = [{ id: "b", _sharedAt: 2 }];
    expect(mergeSharedMatchLists(existing, incoming)).toEqual([
      { id: "a", _sharedAt: 1 },
      { id: "b", _sharedAt: 2 },
    ]);
  });

  test("replaces an existing match when the incoming copy is newer", () => {
    const existing = [{ id: "a", winner: "Ana", _sharedAt: 100 }];
    const incoming = [{ id: "a", winner: "Luis", _sharedAt: 200 }];
    expect(mergeSharedMatchLists(existing, incoming)).toEqual([{ id: "a", winner: "Luis", _sharedAt: 200 }]);
  });

  test("keeps the existing match on a _sharedAt tie", () => {
    const existing = [{ id: "a", winner: "Ana", _sharedAt: 100 }];
    const incoming = [{ id: "a", winner: "Luis", _sharedAt: 100 }];
    expect(mergeSharedMatchLists(existing, incoming)).toEqual([{ id: "a", winner: "Ana", _sharedAt: 100 }]);
  });

  test("keeps the existing match when the incoming copy is older", () => {
    const existing = [{ id: "a", winner: "Ana", _sharedAt: 200 }];
    const incoming = [{ id: "a", winner: "Luis", _sharedAt: 100 }];
    expect(mergeSharedMatchLists(existing, incoming)).toEqual([{ id: "a", winner: "Ana", _sharedAt: 200 }]);
  });

  test("multiple incoming copies of the same id: newest wins (last-write-wins)", () => {
    const existing = [{ id: "a", winner: "Ana", _sharedAt: 100 }];
    const incoming = [
      { id: "a", winner: "Luis", _sharedAt: 300 },
      { id: "a", winner: "Marta", _sharedAt: 200 },
    ];
    expect(mergeSharedMatchLists(existing, incoming)).toEqual([{ id: "a", winner: "Luis", _sharedAt: 300 }]);
  });

  test("ignores incoming matches without an id and keeps id-less existing entries", () => {
    const existing = [{ id: "a", _sharedAt: 1 }, { winner: "Sin id" }];
    const incoming = [{ winner: "Otro sin id", _sharedAt: 99 }];
    expect(mergeSharedMatchLists(existing, incoming)).toEqual([
      { id: "a", _sharedAt: 1 },
      { winner: "Sin id" },
    ]);
  });
});

describe("pending share queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  test("enqueue persists and getPendingShares returns it", () => {
    enqueuePendingShare({ gameId: "uno", match: BASE_MATCH, recipients: [{ uid: "u1" }], sharedBy: HOST });
    const queue = getPendingShares();
    expect(queue).toHaveLength(1);
    expect(queue[0].gameId).toBe("uno");
    expect(queue[0].recipients).toEqual([{ uid: "u1" }]);
    expect(typeof queue[0].createdAt).toBe("number");
  });

  test("flush sends every queued share and empties the queue", async () => {
    addDoc.mockResolvedValue({});
    enqueuePendingShare({ gameId: "uno", match: BASE_MATCH, recipients: [{ uid: "u1" }, { uid: "u2" }], sharedBy: HOST });
    enqueuePendingShare({ gameId: "canasta", match: BASE_MATCH, recipients: [{ uid: "u3" }], sharedBy: HOST });

    const result = await flushPendingShares();

    expect(result).toEqual({ flushed: 2, stillPending: 0 });
    expect(addDoc).toHaveBeenCalledTimes(3);
    expect(getPendingShares()).toEqual([]);
  });

  test("keeps entries that failed with a network error", async () => {
    addDoc.mockRejectedValue({ code: "unavailable" });
    enqueuePendingShare({ gameId: "uno", match: BASE_MATCH, recipients: [{ uid: "u1" }], sharedBy: HOST });

    const result = await flushPendingShares();

    expect(result).toEqual({ flushed: 0, stillPending: 1 });
    expect(getPendingShares()).toHaveLength(1);
  });

  test("drops entries that failed with a non-retryable error", async () => {
    addDoc.mockRejectedValue({ code: "permission-denied" });
    enqueuePendingShare({ gameId: "uno", match: BASE_MATCH, recipients: [{ uid: "u1" }], sharedBy: HOST });

    const result = await flushPendingShares();

    expect(result).toEqual({ flushed: 1, stillPending: 0 });
    expect(getPendingShares()).toEqual([]);
  });

  test("flush is a no-op with an empty queue", async () => {
    expect(await flushPendingShares()).toEqual({ flushed: 0, stillPending: 0 });
    expect(addDoc).not.toHaveBeenCalled();
  });
});