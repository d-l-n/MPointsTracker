import { beforeEach, describe, expect, test, vi } from "vitest";
import { load, persist, mkId, haptic, STORAGE_KEY } from "./storage.ts";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("load returns empty object when nothing stored", () => {
    expect(load()).toEqual({});
  });

  test("load returns parsed data", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    expect(load()).toEqual({ foo: "bar" });
  });

  test("load returns empty object on corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(load()).toEqual({});
  });

  test("persist writes data and returns true", () => {
    const result = persist({ test: true });
    expect(result).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({ test: true });
  });

  test("persist returns false on write error", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(persist({ foo: "bar" })).toBe(false);
  });

  test("mkId returns a non-empty string", () => {
    const id = mkId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("mkId produces unique values", () => {
    const ids = Array.from({ length: 100 }, () => mkId());
    expect(new Set(ids).size).toBe(100);
  });

  test("haptic does not throw when navigator.vibrate is absent", () => {
    expect(() => haptic("light")).not.toThrow();
    expect(() => haptic("medium")).not.toThrow();
    expect(() => haptic("strong")).not.toThrow();
  });

  test("haptic calls navigator.vibrate with correct params", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate, configurable: true, writable: true,
    });
    haptic("light");
    expect(vibrate).toHaveBeenCalledWith(8);
    haptic("medium");
    expect(vibrate).toHaveBeenCalledWith(18);
    haptic("strong");
    expect(vibrate).toHaveBeenCalledWith([12, 40, 12]);
  });

  test("haptic skips when bgt_haptic is 0", () => {
    localStorage.setItem("bgt_haptic", "0");
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate, configurable: true, writable: true,
    });
    haptic("light");
    expect(vibrate).not.toHaveBeenCalled();
  });

  test("haptic handles localStorage getItem throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => haptic("light")).not.toThrow();
  });
});
