import { beforeEach, describe, expect, test, vi } from "vitest";

import { getLastGroup, removeLastGroup, saveLastGroup } from "./groupStorage.ts";

describe("groupStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("saves, loads and deletes the last group for a game", () => {
    const group = { name: "Mesa viernes", players: [{ name: "Ana" }, { name: "Beto" }] };

    saveLastGroup("uno", group);
    expect(getLastGroup("uno")).toEqual(group);

    removeLastGroup("uno");
    expect(getLastGroup("uno")).toBeNull();
  });

  test("returns null when storage is corrupt or the key does not exist", () => {
    localStorage.setItem("bgt_last_group_v1", "{bad json");
    expect(getLastGroup("uno")).toBeNull();
    expect(getLastGroup("poker")).toBeNull();
  });

  test("swallows storage write errors when saving or deleting", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => saveLastGroup("uno", { name: "Mesa", players: [] })).not.toThrow();
    expect(() => removeLastGroup("uno")).not.toThrow();
    expect(setItemSpy).toHaveBeenCalled();
  });

  test("saveLastGroup does nothing when gameId or group is empty", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    saveLastGroup("", { name: "x", players: [] });
    expect(setItemSpy).not.toHaveBeenCalled();
    saveLastGroup("uno", null);
    expect(setItemSpy).not.toHaveBeenCalled();
    saveLastGroup("uno", undefined);
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  test("removeLastGroup does nothing when gameId is empty", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    removeLastGroup("");
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
