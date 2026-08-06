import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import {
  buildHomePath,
  buildHistoryPath,
  buildNavPath,
  getRouteState,
  useNavigation,
} from "./useNavigation.tsx";

const t = (k) => k;

describe("buildHomePath", () => {
  test("returns root when no game", () => {
    expect(buildHomePath()).toBe("/");
    expect(buildHomePath(null)).toBe("/");
  });

  test("encodes game id", () => {
    expect(buildHomePath("uno")).toBe("/game/uno");
    expect(buildHomePath("a b")).toBe("/game/a%20b");
  });
});

describe("buildHistoryPath", () => {
  test("defaults gameId=all and lock=0", () => {
    expect(buildHistoryPath({ source: "home" })).toBe(
      "/history?source=home&gameId=all&lock=0",
    );
  });

  test("sets lock=1 and player when provided", () => {
    expect(
      buildHistoryPath({ source: "game", gameId: "uno", lockGameFilter: true, playerFilter: "Ana" }),
    ).toBe("/history?source=game&gameId=uno&lock=1&player=Ana");
  });

  test("omits player when empty", () => {
    expect(buildHistoryPath({ source: "home", playerFilter: "" })).not.toContain("player=");
  });
});

describe("buildNavPath", () => {
  test.each([
    ["rules", "/rules"],
    ["champs", "/champions"],
    ["about", "/settings"],
    ["admin", "/admin"],
  ])("%s -> %s", (id, path) => {
    expect(buildNavPath(id)).toBe(path);
  });

  test("home falls back to home path with active game", () => {
    expect(buildNavPath("home")).toBe("/");
    expect(buildNavPath("home", "uno")).toBe("/game/uno");
  });

  test("unknown id falls back to home", () => {
    expect(buildNavPath("nope", "uno")).toBe("/game/uno");
  });
});

describe("getRouteState", () => {
  test("/rules", () => {
    expect(getRouteState("/rules", "", false).nav).toBe("rules");
  });

  test("/champions", () => {
    expect(getRouteState("/champions", "", false).nav).toBe("champs");
  });

  test("/settings reads profile and section from query", () => {
    const s = getRouteState("/settings", "?profile=abc&section=prefs", false);
    expect(s.nav).toBe("about");
    expect(s.profileUid).toBe("abc");
    expect(s.settingsSubPage).toBe("prefs");
  });

  test("/settings prefers routeLoaderState over query", () => {
    const s = getRouteState("/settings", "?profile=abc", false, { profileUid: "loader", section: "adv" });
    expect(s.profileUid).toBe("loader");
    expect(s.settingsSubPage).toBe("adv");
  });

  test("/admin gates on isAdmin", () => {
    expect(getRouteState("/admin", "", false).nav).toBe("home");
    expect(getRouteState("/admin", "", true).nav).toBe("admin");
  });

  test("/login maps to home with null selected", () => {
    const s = getRouteState("/login", "", false);
    expect(s.nav).toBe("home");
    expect(s.selected).toBeNull();
  });

  test("/history parses query params into historyView", () => {
    const s = getRouteState("/history", "?source=game&gameId=uno&lock=1&player=Ana", false);
    expect(s.nav).toBe("home");
    expect(s.historyView).toMatchObject({
      source: "game",
      gameId: "uno",
      lockGameFilter: true,
      playerFilter: "Ana",
    });
    expect(s.historyView.key).toBe("game:uno:1:Ana");
  });

  test("/history defaults when no query", () => {
    const s = getRouteState("/history", "", false);
    expect(s.historyView).toMatchObject({ source: "home", gameId: "all", lockGameFilter: false, playerFilter: "" });
  });

  test("/game/:id selects known game", () => {
    const s = getRouteState("/game/uno", "", false);
    expect(s.selected).toBe("uno");
  });

  test("/game/:id with unknown game selects null", () => {
    const s = getRouteState("/game/notagame", "", false);
    expect(s.selected).toBeNull();
  });

  test("unknown path falls back to home", () => {
    const s = getRouteState("/whatever", "", false);
    expect(s.nav).toBe("home");
    expect(s.selected).toBeNull();
  });
});

function makeOpts(overrides = {}) {
  return {
    location: { pathname: "/", search: "" },
    routeLoaderState: null,
    navigate: vi.fn(),
    isAdmin: false,
    t,
    selected: null,
    activeGame: null,
    getDraft: vi.fn(() => null),
    clearDraft: vi.fn(),
    showAuthModal: false,
    setShowAuthModal: vi.fn(),
    onRouteSelectedChange: vi.fn(),
    onClearGameSelection: vi.fn(),
    onResetGameSession: vi.fn(),
    ...overrides,
  };
}

describe("useNavigation hook", () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("navItems excludes admin when not admin", () => {
    const { result } = renderHook(() => useNavigation(makeOpts()));
    expect(result.current.navItems.map((i) => i.id)).not.toContain("admin");
  });

  test("navItems includes admin when admin", () => {
    const { result } = renderHook(() => useNavigation(makeOpts({ isAdmin: true })));
    expect(result.current.navItems.map((i) => i.id)).toContain("admin");
  });

  test("navItems respects saved order from localStorage", () => {
    localStorage.setItem("bgt_nav_order", JSON.stringify(["rules", "home"]));
    const { result } = renderHook(() => useNavigation(makeOpts()));
    const ids = result.current.navItems.map((i) => i.id);
    expect(ids[0]).toBe("rules");
    expect(ids[1]).toBe("home");
  });

  test("handleNav navigates when no draft player", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useNavigation(makeOpts({ navigate })));
    act(() => result.current.handleNav("rules"));
    expect(navigate).toHaveBeenCalledWith("/rules");
  });

  test("handleNav blocks and sets leave target when draft has a player", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      useNavigation(makeOpts({
        navigate,
        selected: "uno",
        getDraft: () => ({ players: [{ name: "Ana" }] }),
      })),
    );
    act(() => result.current.handleNav("rules"));
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.navLeaveTarget).toBe("rules");
  });

  test("confirmNavLeave discards draft and resets session", () => {
    const clearDraft = vi.fn();
    const onResetGameSession = vi.fn();
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      useNavigation(makeOpts({
        navigate,
        clearDraft,
        onResetGameSession,
        selected: "uno",
        getDraft: () => ({ players: [{ name: "Ana" }] }),
      })),
    );
    act(() => result.current.handleNav("rules"));
    act(() => result.current.confirmNavLeave(true));
    expect(clearDraft).toHaveBeenCalledWith("uno");
    expect(onResetGameSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/rules");
  });

  test("openHistoryView navigates to built history path", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useNavigation(makeOpts({ navigate })));
    act(() => result.current.openHistoryView({ source: "home" }));
    expect(navigate).toHaveBeenCalledWith("/history?source=home&gameId=all&lock=0");
  });
});
