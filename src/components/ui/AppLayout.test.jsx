import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import AppLayout from "./AppLayout";

vi.mock("../../pages/GameDetail", () => ({
  default: (props) => (
    <div
      data-testid="mock-game-detail"
      data-has-chrome-hidden-prop={String(Object.prototype.hasOwnProperty.call(props, "chromeHiddenByScroll"))}
      data-chrome-hidden={String(props.chromeHiddenByScroll)}
    />
  ),
}));

vi.mock("./SpotifyMiniPlayer", () => ({
  default: () => null,
}));

const t = (key) => {
  if (key === "loading2") return "Cargando datos";
  return key;
};

function createProps(overrides = {}) {
  return {
    dark: false,
    toast: { msg: "", show: false },
    t,
    isOnline: true,
    showSplash: false,
    setShowSplash: vi.fn(),
    authChecked: false,
    hadPreviousSession: false,
    user: null,
    guestMode: false,
    isLoginRoute: false,
    showDebug: false,
    setShowDebug: vi.fn(),
    debugLogs: [],
    handleLogoTap: vi.fn(),
    signInGoogle: vi.fn(),
    lang: "es",
    changeLang: vi.fn(),
    handleThemeMode: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    sendPasswordReset: vi.fn(),
    enterGuestMode: vi.fn(),
    navigate: vi.fn(),
    syncing: false,
    syncError: null,
    nav: "home",
    selected: null,
    pendingInvite: null,
    dismissPendingInvite: vi.fn(),
    historyView: null,
    activeGame: null,
    gameTab: "new",
    setGameTab: vi.fn(),
    gameMatchKey: 0,
    getMatches: vi.fn(() => []),
    clearDraft: vi.fn(),
    handleGameAddMatch: vi.fn(),
    openHistoryView: vi.fn(),
    handleRematchRequest: vi.fn(),
    postSaveRematch: null,
    setPostSaveRematch: vi.fn(),
    getDraft: vi.fn(),
    saveDraft: vi.fn(),
    linkedPlayers: {},
    setLinkedPlayers: vi.fn(),
    openGame: vi.fn(),
    data: {},
    total: 0,
    handleHomeQuickAction: vi.fn(),
    handleNav: vi.fn(),
    openThemeSettings: vi.fn(),
    setShowAuthModal: vi.fn(),
    playerGroups: [],
    savePlayerGroups: vi.fn(),
    signOut: vi.fn(),
    profileUid: null,
    setProfileUid: vi.fn(),
    settingsSubPage: null,
    setSettingsSubPage: vi.fn(),
    wakeLockEnabled: false,
    setWakeLockEnabled: vi.fn(),
    oledEnabled: false,
    handleToggleOled: vi.fn(),
    themeMode: "light",
    themeAccentMode: "default",
    handleThemeAccentMode: vi.fn(),
    reduceEffectsEnabled: false,
    handleToggleReduceEffects: vi.fn(),
    navOpen: false,
    hideBottomNav: false,
    navHiddenByScroll: false,
    chromeHiddenByScroll: false,
    navItems: [],
    showNavOverlay: false,
    closeHistoryView: vi.fn(),
    navLeaveTarget: null,
    confirmNavLeave: vi.fn(),
    setNavOpen: vi.fn(),
    handleGameBack: vi.fn(),
    isAdmin: false,
    showToast: vi.fn(),
    showAuthModal: false,
    setNavLeaveTarget: vi.fn(),
    resetGameSession: vi.fn(),
    ...overrides,
  };
}

describe("AppLayout", () => {
  beforeEach(() => {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: ResizeObserverStub,
    });
    Object.defineProperty(globalThis, "ResizeObserver", {
      writable: true,
      value: ResizeObserverStub,
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  test("uses the boot shell while auth is still resolving", () => {
    render(<AppLayout {...createProps()} />);

    expect(screen.getByTestId("boot-shell")).toBeInTheDocument();
    expect(screen.getByTestId("boot-shell")).toHaveAttribute("data-boot-stage", "loading");
    expect(screen.getByTestId("boot-loading-copy")).toHaveTextContent("Cargando datos");
    expect(screen.getAllByTestId("boot-skeleton-row")).toHaveLength(3);
  });

  test("uses bottom-nav hidden state for home section header", async () => {
    render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "home",
          navHiddenByScroll: true,
          chromeHiddenByScroll: false,
        })}
      />,
    );

    expect(await screen.findByTestId("home-sticky-header")).toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).toHaveClass("nav--hidden");
  });

  test("uses chrome hidden state for home section header", async () => {
    render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "home",
          navHiddenByScroll: false,
          chromeHiddenByScroll: true,
        })}
      />,
    );

    expect(await screen.findByTestId("home-sticky-header")).toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).not.toHaveClass("nav--hidden");
  });

  test("shows and hides home section header with the bottom nav", async () => {
    const { rerender } = render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "home",
          navHiddenByScroll: false,
        })}
      />,
    );

    const header = await screen.findByTestId("home-sticky-header");
    expect(header).not.toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).not.toHaveClass("nav--hidden");

    rerender(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "home",
          navHiddenByScroll: true,
        })}
      />,
    );

    expect(header).toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).toHaveClass("nav--hidden");

    rerender(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "home",
          navHiddenByScroll: false,
        })}
      />,
    );

    expect(header).not.toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).not.toHaveClass("nav--hidden");
  });

  test("uses bottom-nav hidden state for rules section header", async () => {
    render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "rules",
          navHiddenByScroll: true,
          chromeHiddenByScroll: false,
        })}
      />,
    );

    expect(await screen.findByTestId("rules-sticky-header")).toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).toHaveClass("nav--hidden");
  });

  test("shows and hides rules section header with the bottom nav", async () => {
    const { rerender } = render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "rules",
          navHiddenByScroll: false,
        })}
      />,
    );

    const header = await screen.findByTestId("rules-sticky-header");
    expect(header).not.toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).not.toHaveClass("nav--hidden");

    rerender(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "rules",
          navHiddenByScroll: true,
        })}
      />,
    );

    expect(header).toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).toHaveClass("nav--hidden");

    rerender(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "rules",
          navHiddenByScroll: false,
        })}
      />,
    );

    expect(header).not.toHaveClass("chrome--hidden");
    expect(document.querySelector(".nav")).not.toHaveClass("nav--hidden");
  });

  test("marks the active app section as animated unless reduced effects are enabled", async () => {
    const { rerender } = render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "home",
          reduceEffectsEnabled: false,
        })}
      />,
    );

    expect(await screen.findByTestId("app-section-transition")).toHaveClass("app-section-transition");
    expect(screen.getByTestId("app-section-transition")).not.toHaveClass("app-section-transition--reduced");

    rerender(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          nav: "rules",
          reduceEffectsEnabled: true,
        })}
      />,
    );

    expect(await screen.findByTestId("app-section-transition")).toHaveClass("app-section-transition--reduced");
  });

  test("does not pass scroll-hide state to game detail chrome", async () => {
    render(
      <AppLayout
        {...createProps({
          authChecked: true,
          guestMode: true,
          selected: "uno",
          nav: "home",
          navHiddenByScroll: true,
          chromeHiddenByScroll: true,
          hideBottomNav: true,
        })}
      />,
    );

    expect(await screen.findByTestId("mock-game-detail")).toHaveAttribute("data-has-chrome-hidden-prop", "false");
  });

  test("keeps app zones in the eager app bundle", async () => {
    const source = await import("node:fs").then(({ readFileSync }) =>
      readFileSync("src/components/ui/AppLayout.tsx", "utf8"),
    );

    expect(source).toContain('import HomeTab from "../home/HomeTab"');
    expect(source).toContain('import GameDetail from "../../pages/GameDetail"');
    expect(source).toContain('import RulesPage from "../../pages/RulesPage"');
    expect(source).toContain('import ChampsPage from "../../pages/ChampsPage"');
    expect(source).toContain('import SettingsPage from "../../pages/SettingsPage"');
    expect(source).toContain('import AdminPage from "../../pages/AdminPage"');
    expect(source).toContain('import PublicProfilePage from "../../pages/PublicProfilePage"');
    expect(source).toContain('import GlobalHistoryPage from "../../pages/GlobalHistoryPage"');
    expect(source).not.toContain("lazy(()");
    expect(source).not.toContain("<Suspense");
    expect(source).not.toContain("</Suspense>");
  });
});
