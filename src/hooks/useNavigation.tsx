import { useCallback, useEffect, useMemo, useState } from "react";

import { GAMES } from "../data/games";
import { Book, Crown, Gamepad, InfoCircle, Settings } from "reicon-react";
import type { GameId, NavItem, TranslationFn } from "../types";

type NavId = "home" | "champs" | "rules" | "about" | "admin";

interface HistoryViewState {
  source: string;
  gameId: string;
  lockGameFilter: boolean;
  playerFilter?: string;
  key: string;
}

interface RouteState {
  nav: NavId;
  selected: string | null | undefined;
  historyView: HistoryViewState | null;
  profileUid: string | null;
  settingsSubPage: string | null;
}

interface NavigationLocationLike {
  pathname: string;
  search: string;
}

interface RouteLoaderState {
  gameId?: string;
  source?: string;
  lockGameFilter?: boolean;
  playerFilter?: string;
  profileUid?: string | null;
  section?: string | null;
}

interface UseNavigationOptions {
  location: NavigationLocationLike;
  routeLoaderState?: RouteLoaderState | null;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  isAdmin: boolean;
  t: TranslationFn;
  selected: string | null;
  activeGame: string | null;
  getDraft: (gameId: string) => unknown;
  clearDraft: (gameId: string) => void;
  showAuthModal: unknown;
  setShowAuthModal: (value: false) => void;
  onRouteSelectedChange: (selected: string | null) => void;
  onClearGameSelection: () => void;
  onResetGameSession: () => void;
}

export function buildHomePath(gameId: string | null = null): string {
  return gameId ? `/game/${encodeURIComponent(gameId)}` : "/";
}

export function buildHistoryPath({
  source,
  gameId = "all",
  lockGameFilter = false,
  playerFilter = "",
}: {
  source: string;
  gameId?: string;
  lockGameFilter?: boolean;
  playerFilter?: string;
}): string {
  const params = new URLSearchParams({
    source,
    gameId,
    lock: lockGameFilter ? "1" : "0",
  });
  if (playerFilter) params.set("player", playerFilter);
  return `/history?${params.toString()}`;
}

export function buildNavPath(id: string, activeGame: string | null = null): string {
  switch (id) {
    case "rules":
      return "/rules";
    case "champs":
      return "/champions";
    case "about":
      return "/settings";
    case "admin":
      return "/admin";
    case "home":
    default:
      return buildHomePath(activeGame);
  }
}

export function scrollCurrentSectionToTop() {
  if (typeof document === "undefined") return;

  document
    .querySelectorAll<HTMLElement>(".app-content,.app-content-inner,.detail-wrapper,.page")
    .forEach((element) => {
      element.scrollTop = 0;
      if (typeof element.scrollTo === "function") {
        element.scrollTo({ top: 0, behavior: "auto" });
      }
    });

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

export function getRouteState(
  pathname: string,
  search: string,
  isAdmin: boolean,
  routeLoaderState: RouteLoaderState | null = null,
): RouteState {
  const params = new URLSearchParams(search);

  if (pathname === "/rules") {
    return { nav: "rules", selected: undefined, historyView: null, profileUid: null, settingsSubPage: null };
  }

  if (pathname === "/champions") {
    return { nav: "champs", selected: undefined, historyView: null, profileUid: null, settingsSubPage: null };
  }

  if (pathname === "/settings") {
    return {
      nav: "about",
      selected: undefined,
      historyView: null,
      profileUid: routeLoaderState?.profileUid ?? params.get("profile"),
      settingsSubPage: routeLoaderState?.section ?? params.get("section"),
    };
  }

  if (pathname === "/login") {
    return { nav: "home", selected: null, historyView: null, profileUid: null, settingsSubPage: null };
  }

  if (pathname === "/admin") {
    return {
      nav: isAdmin ? "admin" : "home",
      selected: undefined,
      historyView: null,
      profileUid: null,
      settingsSubPage: null,
    };
  }

  if (pathname === "/history") {
    const source = routeLoaderState?.source ?? (params.get("source") || "home");
    const gameId = routeLoaderState?.gameId ?? (params.get("gameId") || "all");
    const lockGameFilter = routeLoaderState?.lockGameFilter ?? (params.get("lock") === "1");
    const playerFilter = routeLoaderState?.playerFilter ?? (params.get("player") || "");

    return {
      nav: "home",
      selected: undefined,
      historyView: {
        source,
        gameId,
        lockGameFilter,
        playerFilter,
        key: `${source}:${gameId}:${lockGameFilter ? "1" : "0"}:${playerFilter}`,
      },
      profileUid: null,
      settingsSubPage: null,
    };
  }

  if (pathname.startsWith("/game/")) {
    const gameId = routeLoaderState?.gameId ?? decodeURIComponent(pathname.slice("/game/".length));

    return {
      nav: "home",
      selected: GAMES[gameId as GameId] ? gameId : null,
      historyView: null,
      profileUid: null,
      settingsSubPage: null,
    };
  }

  return { nav: "home", selected: null, historyView: null, profileUid: null, settingsSubPage: null };
}

function hasDraftPlayer(draft: unknown): boolean {
  if (!draft || typeof draft !== "object") return false;
  const d = draft as Record<string, unknown>;
  // players array
  if (Array.isArray(d.players) && d.players.some((p) => {
    if (!p || typeof p !== "object") return false;
    return typeof (p as Record<string, unknown>).name === "string" && (p as Record<string, unknown>).name !== "";
  })) return true;
  // p1/p2 (ajedrez, chin)
  if (typeof d.p1 === "string" && d.p1 !== "") return true;
  if (typeof d.p2 === "string" && d.p2 !== "") return true;
  // loser (racha_perdida)
  if (typeof d.loser === "string" && d.loser !== "") return true;
  return false;
}

export function useNavigation({
  location,
  routeLoaderState = null,
  navigate,
  isAdmin,
  t,
  selected,
  activeGame,
  getDraft,
  clearDraft,
  showAuthModal,
  setShowAuthModal,
  onRouteSelectedChange,
  onClearGameSelection,
  onResetGameSession,
}: UseNavigationOptions) {
  const [nav, setNav] = useState<NavId>("home");
  const [navOpen, setNavOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1200,
  );
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [settingsSubPage, setSettingsSubPage] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<HistoryViewState | null>(null);
  const [navLeaveTarget, setNavLeaveTarget] = useState<string | null>(null);
  const showNavOverlay = navOpen && typeof window !== "undefined" && window.innerWidth < 1200;

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-width: 899px)");
    const handler = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) setNavOpen(false);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const navBase = useMemo(
    (): NavItem[] => [
      { id: "home", label: t("games"), icon: <Gamepad size={24} /> },
      { id: "champs", label: t("champions"), icon: <Crown size={24} /> },
      { id: "rules", label: t("rules"), icon: <Book size={24} /> },
      { id: "about", label: t("info"), icon: <InfoCircle size={24} /> },
      ...(isAdmin ? [{ id: "admin", label: t("admin"), icon: <Settings size={24} /> }] : []),
    ],
    [isAdmin, t],
  );

  const [navOrder] = useState<string[] | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bgt_nav_order") || "null");
      return Array.isArray(saved) ? saved : null;
    } catch {
      return null;
    }
  });

  const navItems = useMemo(
    () =>
      navOrder
        ? navOrder
            .map((id) => navBase.find((item) => item.id === id))
            .filter((item): item is NavItem => Boolean(item))
            .concat(navBase.filter((item) => !navOrder.includes(item.id)))
        : navBase,
    [navBase, navOrder],
  );

  useEffect(() => {
    const routeState = getRouteState(location.pathname, location.search, isAdmin, routeLoaderState);

    setNav(routeState.nav);
    setHistoryView(routeState.historyView);
    scrollCurrentSectionToTop();

    if (routeState.nav === "about") {
      setProfileUid(routeState.profileUid);
      setSettingsSubPage(routeState.settingsSubPage);
    } else {
      setProfileUid(null);
      setSettingsSubPage(null);
    }

    if (routeState.selected !== undefined) {
      onRouteSelectedChange(routeState.selected);
    }
  }, [isAdmin, location.pathname, location.search, onRouteSelectedChange, routeLoaderState]);

  const openHistoryView = useCallback(
    ({ source, gameId = "all", lockGameFilter = false, playerFilter = "" }: { source: string; gameId?: string; lockGameFilter?: boolean; playerFilter?: string }) => {
      navigate(buildHistoryPath({ source, gameId, lockGameFilter, playerFilter }));
    },
    [navigate],
  );

  const closeHistoryView = useCallback(() => {
    const targetGameId = historyView?.source === "game" ? historyView.gameId : activeGame;
    navigate(buildHomePath(targetGameId && GAMES[targetGameId as GameId] ? targetGameId : null));
  }, [activeGame, historyView, navigate]);

  const handleNav = useCallback((id: string) => {
    if (id !== "home" && selected && hasDraftPlayer(getDraft(selected))) {
      setNavLeaveTarget(id);
      return;
    }
    if (id !== "about") setSettingsSubPage(null);
    scrollCurrentSectionToTop();
    navigate(buildNavPath(id, selected || activeGame));
  }, [activeGame, getDraft, navigate, selected]);

  const confirmNavLeave = useCallback((discard: boolean) => {
    const target = navLeaveTarget;
    setNavLeaveTarget(null);
    if (discard && selected) {
      clearDraft(selected);
    }
    onResetGameSession();
    if (target !== "about") setSettingsSubPage(null);
    navigate(buildNavPath(target || "home"));
  }, [clearDraft, navigate, navLeaveTarget, onResetGameSession, selected]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.history.pushState({ mpoints: true }, "");

    const handlePopState = () => {
      window.history.pushState({ mpoints: true }, "");

      if (navLeaveTarget) {
        setNavLeaveTarget(null);
        return;
      }
      if (showAuthModal) {
        setShowAuthModal(false);
        return;
      }
      if (profileUid) {
        setProfileUid(null);
        return;
      }
      if (historyView) {
        closeHistoryView();
        return;
      }
      if (settingsSubPage === "apptheme" || settingsSubPage === "advanced") {
        navigate("/settings?section=prefs");
        return;
      }
      if (settingsSubPage) {
        navigate("/settings");
        return;
      }
      if (selected && nav === "home") {
        window.dispatchEvent(new CustomEvent("mpoints-back"));
        return;
      }
      if (nav !== "home") {
        navigate(buildHomePath(selected || activeGame));
        return;
      }
      onClearGameSelection();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    activeGame,
    closeHistoryView,
    historyView,
    nav,
    navLeaveTarget,
    navigate,
    onClearGameSelection,
    profileUid,
    selected,
    settingsSubPage,
    setShowAuthModal,
    showAuthModal,
  ]);

  return {
    nav,
    navOpen,
    navItems,
    showNavOverlay,
    profileUid,
    settingsSubPage,
    historyView,
    navLeaveTarget,
    setNavOpen,
    setProfileUid,
    setSettingsSubPage,
    setNavLeaveTarget,
    openHistoryView,
    closeHistoryView,
    handleNav,
    confirmNavLeave,
  };
}
