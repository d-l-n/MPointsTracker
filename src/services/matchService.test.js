import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db, ...parts) => parts.join("/")),
}));

vi.mock("../lib/firebase", () => ({ fbDb: {} }));

import { addDoc, collection } from "firebase/firestore";
import {
  enqueuePendingShare,
  flushPendingShares,
  getPendingShares,
  isRetryableShareError,
  shareMatchWithPlayers,
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