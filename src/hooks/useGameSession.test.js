import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useGameSession } from "./useGameSession";

function renderSession() {
  const navigate = vi.fn();
  const utils = renderHook(() => useGameSession({ navigate }));
  return { navigate, ...utils };
}

function seedDraft(gameId, draft) {
  const current = JSON.parse(localStorage.getItem("bgt_drafts") || "{}");
  current[gameId] = draft;
  localStorage.setItem("bgt_drafts", JSON.stringify(current));
}

describe("useGameSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("openGame with resetDraft clears linkedPlayers for that game", async () => {
    const { result } = renderSession();
    act(() => {
      result.current.setLinkedPlayers((current) => ({
        ...current,
        uno: [{ uid: "me", name: "Ana", playerId: "p1" }],
      }));
    });
    expect(result.current.linkedPlayers.uno).toHaveLength(1);

    await act(async () => {
      await result.current.openGame("uno", { tab: "new", resetDraft: true });
    });

    expect(result.current.linkedPlayers.uno).toEqual([]);
    expect(result.current.selected).toBe("uno");
    expect(result.current.activeGame).toBe("uno");
  });

  test("openGame without resetDraft clears linkedPlayers when there is no draft to resume (plain card click)", async () => {
    const { result } = renderSession();
    act(() => {
      result.current.setLinkedPlayers((current) => ({
        ...current,
        uno: [{ uid: "me", name: "Ana", playerId: "p1" }],
      }));
    });

    await act(async () => {
      await result.current.openGame("uno", { tab: "new" });
    });

    expect(result.current.linkedPlayers.uno).toEqual([]);
  });

  test("openGame preserves linkedPlayers when resuming a draft with players (continue flow)", async () => {
    seedDraft("uno", { players: [{ id: "p1", name: "Ana" }], _savedAt: 123 });
    const { result } = renderSession();
    act(() => {
      result.current.setLinkedPlayers((current) => ({
        ...current,
        uno: [{ uid: "me", name: "Ana", playerId: "p1" }],
      }));
    });

    await act(async () => {
      await result.current.openGame("uno", { tab: "new" });
    });

    expect(result.current.linkedPlayers.uno).toHaveLength(1);
  });

  test("openGame only clears the targeted game", async () => {
    const { result } = renderSession();
    act(() => {
      result.current.setLinkedPlayers((current) => ({
        ...current,
        uno: [{ uid: "me", name: "Ana", playerId: "p1" }],
        truco: [{ uid: "other", name: "Beto", playerId: "p2" }],
      }));
    });

    await act(async () => {
      await result.current.openGame("uno", { tab: "new", resetDraft: true });
    });

    expect(result.current.linkedPlayers.uno).toEqual([]);
    expect(result.current.linkedPlayers.truco).toHaveLength(1);
  });

  test("openGame ignores unknown games and does not touch state", async () => {
    const { navigate, result } = renderSession();
    await act(async () => {
      await result.current.openGame("not-a-game", { tab: "new", resetDraft: true });
    });
    expect(result.current.selected).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("linkedPlayers survive a full app reload (persisted to localStorage)", () => {
    const { result } = renderSession();
    act(() => {
      result.current.setLinkedPlayers((current) => ({
        ...current,
        uno: [{ uid: "me", name: "Ana", playerId: "p1" }],
      }));
    });

    // Simulate reload: a fresh hook instance must hydrate from storage.
    const { result: reloaded } = renderSession();
    expect(reloaded.current.linkedPlayers.uno).toEqual([{ uid: "me", name: "Ana", playerId: "p1" }]);
  });

  test("clearing linked players persists the cleared state", async () => {
    const { result } = renderSession();
    act(() => {
      result.current.setLinkedPlayers((current) => ({
        ...current,
        uno: [{ uid: "me", name: "Ana", playerId: "p1" }],
      }));
    });

    await act(async () => {
      await result.current.openGame("uno", { tab: "new", resetDraft: true });
    });

    const { result: reloaded } = renderSession();
    expect(reloaded.current.linkedPlayers.uno).toEqual([]);
    expect(reloaded.current.linkedPlayers.truco).toBeUndefined();
  });
});
