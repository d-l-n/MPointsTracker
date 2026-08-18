import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import type { User } from "firebase/auth";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";

import { detectLang, saveLang, useT } from "./data/translations";
import { GAMES, getGame } from "./data/games";
import type { LinkedPlayer } from "./types";
import { setFmtDateLang } from "./lib/stats";
import { enqueuePendingShare, flushPendingShares, shareMatchWithPlayers } from "./services/matchService";
import { triggerConfetti } from "./lib/confetti";

// Hooks
import { useToast } from "./hooks/useToast";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useMatches } from "./hooks/useMatches";
import { useGameSession } from "./hooks/useGameSession";
import { buildHomePath, useNavigation } from "./hooks/useNavigation";
import { useNavVisibility } from "./hooks/useNavVisibility";
import { usePendingInvite } from "./hooks/usePendingInvite";
import { useWakeLock } from "./hooks/useWakeLock";
import { useHaptic } from "./hooks/useHaptic";

// Context
import { AppProvider } from "./context/AppContext";
import AppLayout from "./components/ui/AppLayout";
import type { AppContextValue, DebugLogEntry, Match, PendingInvite, ThemeAccentMode } from "./types";
import type { RematchState } from "./pages/GameDetail";

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const loaderData = useLoaderData() as Record<string, unknown> | null;
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const isLoginRoute = location.pathname === "/login";
  const {
    dark,
    oledEnabled,
    reduceEffectsEnabled,
    themeMode,
    themeAccentMode,
    themeCustomAccent,
    handleThemeMode,
    handleThemeAccentMode,
    handleThemeCustomAccent,
    handleToggleOled,
    handleToggleReduceEffects,
  } = useTheme();

  // ── i18n ───────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<string>(() => detectLang());
  const t = useT(lang);
  const changeLang = useCallback((l: string) => { setLang(l); saveLang(l); setFmtDateLang(l); }, []);
  useEffect(() => { setFmtDateLang(lang); }, [lang]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // ── Toast & debug ──────────────────────────────────────────────────────────
  const { toast, showToast } = useToast();
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const addLog = useCallback((msg: string, type = "ok") => {
    setDebugLogs((prev) => [...prev.slice(-30), { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type, id: Date.now() + Math.random() }]);
    if (import.meta.env.DEV) console.debug(`[Debug] ${msg}`);
  }, []);
  const [showDebug, setShowDebug] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 7) { setShowDebug((v) => !v); tapCount.current = 0; }
    else { tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500); }
  }, []);
  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);

  // ── Matches & Auth share a userRef to avoid circular hook dependencies ─────
  // useAuth needs mergeCloudData/mergeSharedMatches from useMatches.
  // useMatches needs user from useAuth.
  // Solution: useMatches reads user via a stable ref updated by useAuth's callback.
  const userRef = useRef<User | null | undefined>(undefined);

  const {
    data, syncing, syncError,
    getMatches, addMatch, delMatch, editMatch, importData,
    mergeSharedMatches, mergeCloudData,
    total, knownNames,
  } = useMatches({ userRef, dark, showToast, t });

  // ── Auth ───────────────────────────────────────────────────────────────────
  // Stable callback: useAuth memoizes handleUser on it, so an inline arrow here
  // would re-create handleUser on every render and re-run the auth init effect.
  const handleCloudTheme = useCallback((accent: ThemeAccentMode, customAccent?: string) => {
    handleThemeAccentMode(accent);
    if (customAccent) handleThemeCustomAccent(customAccent);
  }, [handleThemeAccentMode, handleThemeCustomAccent]);

  const {
    user, isAdmin, authChecked, hadPreviousSession, guestMode,
    playerGroups, savePlayerGroups,
    spotifyEnabled, spotifyPosition, saveSpotifyPreference, saveSpotifyPosition,
    saveThemeAccent, saveThemeCustomAccent,
    signInGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, signOut,
    enterGuestMode,
  } = useAuth({
    addLog, showToast, t, mergeCloudData, mergeSharedMatches,
    onCloudTheme: handleCloudTheme,
  });

  // Keep userRef in sync so useMatches cloud-save uses latest user
  useEffect(() => { userRef.current = user; }, [user]);

  // Persist theme accent preferences to the cloud (no-op while signed out)
  useEffect(() => { void saveThemeAccent(themeAccentMode); }, [saveThemeAccent, themeAccentMode]);
  useEffect(() => { void saveThemeCustomAccent(themeCustomAccent); }, [saveThemeCustomAccent, themeCustomAccent]);

  const {
    selected,
    activeGame,
    gameTab,
    gameMatchKey,
    postSaveRematch,
    linkedPlayers,
    saveDraft,
    clearDraft,
    getDraft,
    setActiveGame,
    setSelected,
    setGameTab,
    setGameMatchKey,
    setPostSaveRematch,
    setLinkedPlayers,
    applyRouteSelection,
    resetGameSession,
    clearGameSelection,
    openGame,
    handleHomeQuickAction,
    handleRematchRequest: handleRematchRequestBase,
  } = useGameSession({ navigate });
  const { wakeLockEnabled, setWakeLockEnabled } = useWakeLock(selected);
  const { hapticEnabled, setHapticEnabled } = useHaptic();

  // ── Misc UI ────────────────────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(() => !localStorage.getItem("bgt_splash_seen"));
  const [showAuthModal, setShowAuthModal] = useState<false | string>(false);
  const { pendingInvite, dismissPendingInvite, claimPendingInvite } = usePendingInvite({ showToast, t });
  const routeLoaderState = useMemo(() => {
    if (!loaderData) return null;

    if (location.pathname === "/history") {
      return {
        source: typeof loaderData.source === "string" ? loaderData.source : undefined,
        gameId: typeof loaderData.gameId === "string" ? loaderData.gameId : undefined,
        lockGameFilter: loaderData.lockGameFilter === true,
        playerFilter: typeof loaderData.playerFilter === "string" ? loaderData.playerFilter : "",
      };
    }

    if (location.pathname === "/settings") {
      return {
        profileUid: typeof loaderData.profileUid === "string" ? loaderData.profileUid : null,
        section: typeof loaderData.section === "string" ? loaderData.section : null,
      };
    }

    if (location.pathname.startsWith("/game/")) {
      return {
        gameId: typeof loaderData.gameId === "string" ? loaderData.gameId : undefined,
      };
    }

    return null;
  }, [loaderData, location.pathname]);
  const {
    nav,
    navOpen,
    navItems: NAV,
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
  } = useNavigation({
    location,
    routeLoaderState,
    navigate,
    isAdmin,
    t,
    selected,
    activeGame,
    getDraft,
    clearDraft,
    showAuthModal,
    setShowAuthModal,
    onRouteSelectedChange: applyRouteSelection,
    onClearGameSelection: clearGameSelection,
    onResetGameSession: resetGameSession,
  });
  const { isMobileBottomBar, navHiddenByScroll, chromeHiddenByScroll } = useNavVisibility({
    showNavOverlay,
    showAuthModal,
    navLeaveTarget,
    historyViewKey: historyView?.key ?? null,
    nav,
    selected,
    pathname: location.pathname,
    search: location.search,
  });
  const hideBottomNavInGame = Boolean(isMobileBottomBar && selected && nav === "home" && !historyView);

  const openThemeSettings = useCallback(() => {
    setSettingsSubPage("apptheme");
    navigate("/settings");
  }, [navigate, setSettingsSubPage]);

  useEffect(() => {
    if (isLoginRoute && user) {
      navigate("/", { replace: true });
    }
  }, [isLoginRoute, navigate, user]);

  const handleRematchRequest = useCallback((payload: RematchState = {}) => {
    handleRematchRequestBase({
      ...payload,
      closeHistoryView,
    });
  }, [closeHistoryView, handleRematchRequestBase]);

  // Retry shares queued while offline (bgt_pending_shares). Runs on reconnect,
  // login and after each save; toasts only when something is still pending.
  const runPendingShareFlush = useCallback(async () => {
    const { flushed, stillPending } = await flushPendingShares();
    if (flushed > 0) addLog(`pending shares: flushed ${flushed}${stillPending > 0 ? `, ${stillPending} still pending` : ""}`);
    if (stillPending > 0) showToast(t("sharePending").replace("{n}", String(stillPending)));
  }, [addLog, showToast, t]);

  const wasOnline = useRef(isOnline);
  useEffect(() => {
    if (isOnline && !wasOnline.current) void runPendingShareFlush();
    wasOnline.current = isOnline;
  }, [isOnline, runPendingShareFlush]);

  const hadUser = useRef(false);
  useEffect(() => {
    if (user && !hadUser.current) void runPendingShareFlush();
    hadUser.current = Boolean(user);
  }, [runPendingShareFlush, user]);

  const handleGameAddMatch = useCallback(async (match: Match) => {
    if (!selected) return;

    const keepPortionDraft = selected === "portion_counter";
    addMatch(selected, match as Match & Record<string, unknown>);
    triggerConfetti(getGame(selected)?.color);

    const linked = linkedPlayers[selected] || [];
    if (linked.length > 0) {
      const shareResult = await shareMatchWithPlayers(selected, match as Match & Record<string, unknown>, linked, user);
      addLog(`share match ${selected}: attempted=${shareResult.attempted} shared=${shareResult.shared} failed=${shareResult.failed} skipped=${shareResult.skipped}`);
      if (shareResult.retryable > 0) {
        // Network failure: keep the share so it is retried on reconnect/login.
        enqueuePendingShare({ gameId: selected, match: match as Match & Record<string, unknown>, recipients: linked, sharedBy: user });
        addLog(`share match ${selected}: ${shareResult.retryable} offline → queued for retry`);
      }
      if (!user) {
        showToast(t("shareNeedLogin"));
      } else if (shareResult.failed > 0) {
        showToast(t("shareFail").replace("{n}", String(shareResult.failed)));
      } else if (shareResult.attempted === 0 || shareResult.skipped > 0) {
        showToast(t("shareNoAccount"));
      }
    } else {
      // Silent no-op today: no linked players at save time (e.g. links were
      // lost on an app reload before persistence was added). Log so the debug
      // panel surfaces why a save did not reach the other player.
      addLog(`save match ${selected}: no linked players — share skipped`);
    }

    void runPendingShareFlush();

    if (keepPortionDraft) {
      setActiveGame(null);
      setSelected(null);
      setGameTab("new");
      setGameMatchKey((currentKey: number) => currentKey + 1);
      navigate("/");
      return;
    }

    clearDraft(selected);
    setLinkedPlayers((current: Record<string, LinkedPlayer[]>) => ({ ...current, [selected]: [] }));
    setGameMatchKey((currentKey: number) => currentKey + 1);
    setGameTab("stats");
    setActiveGame(selected);
    navigate(buildHomePath(selected));
  }, [addLog, addMatch, clearDraft, linkedPlayers, navigate, runPendingShareFlush, selected, setActiveGame, setGameMatchKey, setGameTab, setLinkedPlayers, setSelected, showToast, t, user]);

  // When "google" mode set, fire directly — deferred to avoid setState-in-effect warning
  useEffect(() => {
    if (showAuthModal !== "google") return;
    const id = setTimeout(() => { setShowAuthModal(false); signInGoogle(); }, 0);
    return () => clearTimeout(id);
  }, [showAuthModal, signInGoogle]);

  // ── Context value ──────────────────────────────────────────────────────────
  const contextValue = useMemo<AppContextValue>(() => ({
    user, dark, lang, t, showToast,
    data,
    playerGroups, savePlayerGroups,
    spotifyEnabled, spotifyPosition, saveSpotifyPreference, saveSpotifyPosition,
    knownNames, getMatches,
    addMatch, delMatch, editMatch,
    pendingInvite,
    claimPendingInvite,
  }), [user, dark, lang, t, showToast, data, playerGroups, savePlayerGroups, spotifyEnabled, spotifyPosition, saveSpotifyPreference, saveSpotifyPosition, knownNames, getMatches, addMatch, delMatch, editMatch, pendingInvite, claimPendingInvite]);

  return (
    <AppProvider value={contextValue}>
      <AppLayout
        dark={dark}
        toast={toast}
        t={t}
        isOnline={isOnline}
        showSplash={showSplash}
        setShowSplash={setShowSplash}
        authChecked={authChecked}
        hadPreviousSession={hadPreviousSession}
        user={user}
        guestMode={guestMode}
        isLoginRoute={isLoginRoute}
        showDebug={showDebug}
        setShowDebug={setShowDebug}
        debugLogs={debugLogs}
        handleLogoTap={handleLogoTap}
        signInGoogle={signInGoogle}
        lang={lang}
        changeLang={changeLang}
        handleThemeMode={handleThemeMode}
        signInWithEmail={signInWithEmail}
        signUpWithEmail={signUpWithEmail}
        sendPasswordReset={sendPasswordReset}
        enterGuestMode={enterGuestMode}
        navigate={navigate}
        syncing={syncing}
        syncError={syncError}
        nav={nav}
        selected={selected}
        pendingInvite={pendingInvite as PendingInvite | null}
        dismissPendingInvite={dismissPendingInvite}
        historyView={historyView}
        activeGame={activeGame}
        gameTab={gameTab}
        setGameTab={setGameTab}
        gameMatchKey={gameMatchKey}
        getMatches={getMatches}
        importData={importData}
        clearDraft={clearDraft}
        handleGameAddMatch={handleGameAddMatch}
        openHistoryView={openHistoryView}
        handleRematchRequest={handleRematchRequest}
        postSaveRematch={postSaveRematch}
        setPostSaveRematch={setPostSaveRematch}
        getDraft={getDraft}
        saveDraft={saveDraft}
        linkedPlayers={linkedPlayers}
        setLinkedPlayers={setLinkedPlayers}
        openGame={openGame}
        data={data}
        total={total}
        handleHomeQuickAction={handleHomeQuickAction}
        handleNav={handleNav}
        openThemeSettings={openThemeSettings}
        setShowAuthModal={setShowAuthModal}
        playerGroups={playerGroups}
        savePlayerGroups={savePlayerGroups}
        signOut={signOut}
        profileUid={profileUid}
        setProfileUid={setProfileUid}
        settingsSubPage={settingsSubPage}
        setSettingsSubPage={setSettingsSubPage}
        wakeLockEnabled={wakeLockEnabled}
        setWakeLockEnabled={setWakeLockEnabled}
        hapticEnabled={hapticEnabled}
        setHapticEnabled={setHapticEnabled}
        oledEnabled={oledEnabled}
        handleToggleOled={handleToggleOled}
        themeMode={themeMode}
        themeAccentMode={themeAccentMode}
        handleThemeAccentMode={handleThemeAccentMode}
        themeCustomAccent={themeCustomAccent}
        handleThemeCustomAccent={handleThemeCustomAccent}
        reduceEffectsEnabled={reduceEffectsEnabled}
        handleToggleReduceEffects={handleToggleReduceEffects}
        navOpen={navOpen}
        hideBottomNav={hideBottomNavInGame}
        navHiddenByScroll={navHiddenByScroll}
        chromeHiddenByScroll={chromeHiddenByScroll}
        navItems={NAV}
        showNavOverlay={showNavOverlay}
        closeHistoryView={closeHistoryView}
        navLeaveTarget={navLeaveTarget}
        confirmNavLeave={confirmNavLeave}
        setNavOpen={setNavOpen}
        isAdmin={isAdmin}
        showToast={showToast}
        showAuthModal={showAuthModal}
        setNavLeaveTarget={setNavLeaveTarget}
        resetGameSession={resetGameSession}
      />
    </AppProvider>
  );
}
