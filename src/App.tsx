import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import type { User } from "firebase/auth";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";

import { detectLang, saveLang, useT, setGlobalT } from "./data/translations";
import { GAMES } from "./data/games";
import { setFmtDateLang } from "./lib/stats";
import { shareMatchWithPlayers } from "./services/matchService";
import { triggerConfetti } from "./lib/confetti";

// Hooks
import { useToast } from "./hooks/useToast";
import { useDebugLog } from "./hooks/useDebugLog";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useMatches } from "./hooks/useMatches";
import { useGameSession } from "./hooks/useGameSession";
import { buildHomePath, useNavigation } from "./hooks/useNavigation";
import { useNavVisibility } from "./hooks/useNavVisibility";
import { usePendingInvite } from "./hooks/usePendingInvite";
import { useWakeLock } from "./hooks/useWakeLock";

// Context
import { AppProvider } from "./context/AppContext";
import AppLayout from "./components/ui/AppLayout";
import type { AppContextValue, Match, PendingInvite } from "./types";

type RematchPayload = {
  gameId?: string;
  playerNames?: string[];
  lastSavedMatch?: Match & Record<string, unknown>;
  linkedPlayers?: Array<Record<string, unknown> & { name: string; playerId?: string; uid?: string | null }>;
};

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
    handleThemeMode,
    handleThemeAccentMode,
    handleToggleOled,
    handleToggleReduceEffects,
  } = useTheme();

  // ── i18n ───────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<string>(() => detectLang());
  const t = useT(lang);
  const changeLang = useCallback((l: string) => { setLang(l); saveLang(l); setFmtDateLang(l); }, []);
  useEffect(() => { setFmtDateLang(lang); setGlobalT(t); }, [lang, t]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // ── Toast & debug ──────────────────────────────────────────────────────────
  const { toast, showToast } = useToast();
  const { logs: debugLogs, addLog } = useDebugLog();
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
  const {
    user, isAdmin, authChecked, hadPreviousSession, guestMode,
    playerGroups, savePlayerGroups,
    spotifyEnabled, spotifyPosition, saveSpotifyPreference, saveSpotifyPosition,
    signInGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, signOut,
    enterGuestMode,
  } = useAuth({ addLog, showToast, t, mergeCloudData, mergeSharedMatches });

  // Keep userRef in sync so useMatches cloud-save uses latest user
  useEffect(() => { userRef.current = user; }, [user]);

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

  const handleRematchRequest = useCallback((payload: RematchPayload = {}) => {
    handleRematchRequestBase({
      ...payload,
      closeHistoryView,
    });
  }, [closeHistoryView, handleRematchRequestBase]);

  const handleGameAddMatch = useCallback(async (match: Match & Record<string, unknown>) => {
    if (!selected) return;

    const keepPortionDraft = selected === "portion_counter";
    addMatch(selected, match);
    triggerConfetti(GAMES[selected]?.color);
    await shareMatchWithPlayers(selected, match, linkedPlayers[selected] || [], user);

    if (keepPortionDraft) {
      setActiveGame(null);
      setSelected(null);
      setGameTab("new");
      setGameMatchKey((currentKey: number) => currentKey + 1);
      navigate("/");
      return;
    }

    clearDraft(selected);
    setLinkedPlayers((current: Record<string, Array<Record<string, unknown>>>) => ({ ...current, [selected]: [] }));
    setGameMatchKey((currentKey: number) => currentKey + 1);
    setGameTab("stats");
    setActiveGame(selected);
    navigate(buildHomePath(selected));
  }, [addMatch, clearDraft, linkedPlayers, navigate, selected, setActiveGame, setGameMatchKey, setGameTab, setLinkedPlayers, setSelected, user]);

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
  }), [user, dark, lang, t, showToast, data, playerGroups, savePlayerGroups, spotifyEnabled, saveSpotifyPreference, knownNames, getMatches, addMatch, delMatch, editMatch, pendingInvite, claimPendingInvite]);

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
        postSaveRematch={postSaveRematch as RematchPayload | null}
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
        oledEnabled={oledEnabled}
        handleToggleOled={handleToggleOled}
        themeMode={themeMode}
        themeAccentMode={themeAccentMode}
        handleThemeAccentMode={handleThemeAccentMode}
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
