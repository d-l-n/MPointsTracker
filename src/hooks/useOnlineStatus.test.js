import { describe, expect, test, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "./useOnlineStatus";

describe("useOnlineStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns true when online", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  test("returns false when offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  test("updates when online event fires", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
    act(() => { window.dispatchEvent(new Event("online")); });
    expect(result.current).toBe(true);
  });

  test("updates when offline event fires", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(result.current).toBe(false);
  });
});
