import { memo, useState, useMemo } from "react";

import { GAMES } from "../../data/games";
import { APP_VERSION } from "../../lib/storage";
import type {
  DebugLogEntry,
  DraftRecord,
  GameDefinition,
  Match,
  PlayerGroup,
  ThemeAccentMode,
  ThemeMode,
  ToastState,
  TranslationFn,
} from "../../types";
import AppShell from "./AppShell";
import AppHeader from "./AppHeader";
import SyncDot from "./SyncDot";
import ThemeToggle from "./ThemeToggle";
import ReloadButton from "./ReloadButton";
import UserAvatar from "./UserAvatar";
import SplashScreen from "./SplashScreen";
import BootShell from "./BootShell";
import InstallBanner from "./InstallBanner";
import ScrollToTop from "./ScrollToTop";
import { ShareResultButton } from "./ShareResultCard";
import SpotifyMiniPlayer from "./SpotifyMiniPlayer";
import EmailAuthScreen from "../auth/EmailAuthScreen";
import HomeTab from "../home/HomeTab";
import { scrollCurrentSectionToTop } from "../../hooks/useNavigation";
import RulesPage from "../../pages/RulesPage";
import ChampsPage from "../../pages/ChampsPage";
import SettingsPage from "../../pages/SettingsPage";
import GameDetail from "../../pages/GameDetail";
import AdminPage from "../../pages/AdminPage";
import PublicProfilePage from "../../pages/PublicProfilePage";
import GlobalHistoryPage from "../../pages/GlobalHistoryPage";
import { SEO } from "../seo/SEO";

interface AppUser {
  uid?: string;
  [key: string]: unknown;
}

interface HistoryViewState {
  source: string;
  gameId: string;
  lockGameFilter: boolean;
  key: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface LinkedPlayer {
  name: string;
  uid?: string | null;
  playerId?: string;
  [key: string]: unknown;
}

interface RematchState {
  gameId?: string;
  playerNames?: string[];
  lastSavedMatch?: Match & Record<string, unknown>;
  linkedPlayers?: LinkedPlayer[];
  [key: string]: unknown;
}

interface AppLayoutProps {
  dark: boolean;
  toast: ToastState;
  t: TranslationFn;
  isOnline: boolean;
  showSplash: boolean;
  setShowSplash: (value: boolean) => void;
  authChecked: boolean;
  hadPreviousSession: boolean;
  user: AppUser | undefined | null;
  guestMode: boolean;
  isLoginRoute: boolean;
  showDebug: boolean;
  setShowDebug: (value: boolean | ((current: boolean) => boolean)) => void;
  debugLogs: DebugLogEntry[];
  handleLogoTap: () => void;
  signInGoogle: () => Promise<unknown> | unknown;
  lang: string;
  changeLang: (lang: string) => void;
  handleThemeMode: (mode: ThemeMode) => void;
  signInWithEmail: (email: string, password: string) => Promise<unknown> | unknown;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<unknown> | unknown;
  sendPasswordReset: (email: string) => Promise<unknown> | unknown;
  enterGuestMode: () => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  syncing: boolean;
  syncError: unknown;
  nav: string;
  selected: string | null;
  pendingInvite: { displayName: string } | null;
  dismissPendingInvite: () => void;
  historyView: HistoryViewState | null;
  activeGame: string | null;
  gameTab: string;
  setGameTab: (tab: string) => void;
  gameMatchKey: number;
  getMatches: (gameId: string) => Match[];
  clearDraft: (gameId: string) => void;
  handleGameAddMatch: (match: Match & Record<string, unknown>) => Promise<void> | void;
  openHistoryView: (options: { source: string; gameId?: string; lockGameFilter?: boolean }) => void;
  handleRematchRequest: (payload?: RematchState) => void;
  postSaveRematch: RematchState | null;
  setPostSaveRematch: (value: RematchState | null) => void;
  getDraft: (gameId: string) => DraftRecord | undefined;
  saveDraft: (gameId: string, draft: DraftRecord) => void;
  linkedPlayers: Record<string, LinkedPlayer[]>;
  setLinkedPlayers: (
    value: Record<string, LinkedPlayer[]> | ((current: Record<string, LinkedPlayer[]>) => Record<string, LinkedPlayer[]>),
  ) => void;
  openGame: (gameId: string, options?: { tab?: string; resetDraft?: boolean }) => void;
  data: Record<string, unknown>;
  total: number;
  handleHomeQuickAction: (gameId: string, action: string) => void;
  handleNav: (id: string) => void;
  openThemeSettings: () => void;
  setShowAuthModal: (value: false | string) => void;
  playerGroups: PlayerGroup[];
  savePlayerGroups: (groups: PlayerGroup[]) => Promise<void> | void;
  signOut: () => Promise<unknown> | unknown;
  profileUid: string | null;
  setProfileUid: (value: string | null) => void;
  settingsSubPage: string | null;
  setSettingsSubPage: (value: string | null) => void;
  wakeLockEnabled: boolean;
  setWakeLockEnabled: (value: boolean) => void;
  oledEnabled: boolean;
  handleToggleOled: (value: boolean) => void;
  themeMode: ThemeMode;
  themeAccentMode: ThemeAccentMode;
  handleThemeAccentMode: (mode: ThemeAccentMode) => void;
  reduceEffectsEnabled: boolean;
  handleToggleReduceEffects: (value: boolean) => void;
  navOpen: boolean;
  hideBottomNav: boolean;
  navHiddenByScroll: boolean;
  chromeHiddenByScroll: boolean;
  navItems: NavItem[];
  showNavOverlay: boolean;
  closeHistoryView: () => void;
  navLeaveTarget: string | null;
  confirmNavLeave: (discard: boolean) => void;
  setNavOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  isAdmin: boolean;
  showToast: (msg: string, duration?: number) => void;
  showAuthModal: false | string;
  setNavLeaveTarget: (value: string | null) => void;
  resetGameSession: () => void;
}

interface NavPillButtonProps {
  n: NavItem;
  active: boolean;
  onNav: () => void;
}

interface PostSaveRematchBannerProps {
  game: GameDefinition | null;
  rematchState: RematchState | null;
  t: TranslationFn;
  onRematch: () => void;
  onDismiss: () => void;
}

const NavPillButton = memo(function NavPillButton({ n, active, onNav }: NavPillButtonProps) {
  return (
    <button
      className={`navbtn${active ? " active" : ""}`}
      onClick={onNav}
      data-testid={`nav-pill-${n.id}`}
    >
      <span className="navico">
        {n.icon}
      </span>
      <span>{n.label}</span>
    </button>
  );
});

const PostSaveRematchBanner = memo(function PostSaveRematchBanner({
  game,
  rematchState,
  t,
  onRematch,
  onDismiss,
}: PostSaveRematchBannerProps) {
  if (!game || !rematchState?.playerNames?.length) return null;

  return (
    <div className="detail-rematch-banner" data-testid="game-detail-rematch-banner">
      <div className="detail-rematch-copy">
        <div className="detail-rematch-title">{t("rematch")}</div>
        <div className="detail-rematch-players">{rematchState.playerNames.join(" · ")}</div>
      </div>
      <button
        data-testid="game-detail-rematch-action"
        className="detail-rematch-action"
        onClick={onRematch}
      >{t("rematch")}</button>
      {rematchState.lastSavedMatch && (
        <ShareResultButton match={rematchState.lastSavedMatch} game={game} t={t} />
      )}
      <button className="detail-rematch-dismiss" onClick={onDismiss} aria-label={t("dismissRematch")}>✕</button>
    </div>
  );
});

export default function AppLayout({
  dark,
  toast,
  t,
  isOnline,
  showSplash,
  setShowSplash,
  authChecked,
  hadPreviousSession,
  user,
  guestMode,
  isLoginRoute,
  showDebug,
  setShowDebug,
  debugLogs,
  handleLogoTap,
  signInGoogle,
  lang,
  changeLang,
  handleThemeMode,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  enterGuestMode,
  navigate,
  syncing,
  syncError,
  nav,
  selected,
  pendingInvite,
  dismissPendingInvite,
  historyView,
  activeGame,
  gameTab,
  setGameTab,
  gameMatchKey,
  getMatches,
  clearDraft,
  handleGameAddMatch,
  openHistoryView,
  handleRematchRequest,
  postSaveRematch,
  setPostSaveRematch,
  getDraft,
  saveDraft,
  linkedPlayers,
  setLinkedPlayers,
  openGame,
  data,
  total,
  handleHomeQuickAction,
  handleNav,
  openThemeSettings,
  setShowAuthModal,
  playerGroups,
  savePlayerGroups,
  signOut,
  profileUid,
  setProfileUid,
  settingsSubPage,
  setSettingsSubPage,
  wakeLockEnabled,
  setWakeLockEnabled,
  oledEnabled,
  handleToggleOled,
  themeMode,
  themeAccentMode,
  handleThemeAccentMode,
  reduceEffectsEnabled,
  handleToggleReduceEffects,
  navOpen,
  hideBottomNav,
  navHiddenByScroll,
  chromeHiddenByScroll,
  navItems,
  showNavOverlay,
  closeHistoryView,
  navLeaveTarget,
  confirmNavLeave,
  setNavOpen,
  isAdmin,
  showToast,
  showAuthModal,
  setNavLeaveTarget,
  resetGameSession,
}: AppLayoutProps) {
  const seoTitle = useMemo(() => {
    if (isLoginRoute) return t("login");
    if (historyView) return t("globalHistory");
    if (selected && GAMES[selected]) return GAMES[selected].name;
    if (nav === "home") return null;
    if (nav === "rules") return t("rules");
    if (nav === "champs") return t("champions");
    if (nav === "h2h") return t("headToHead");
    if (nav === "settings") return t("settings");
    return null;
  }, [nav, selected, historyView, isLoginRoute, t]);

  const seoDescription = useMemo(() => {
    if (selected && GAMES[selected]) {
      const g = GAMES[selected];
      return `Registrá partidas de ${g.name}, seguí estadísticas y rankings. ${g.tagline || ""}`.trim();
    }
    if (nav === "rules") return "Reglas y puntuaciones de todos los juegos disponibles en MPoints Tracker: UNO, Truco, Chinchón, Rummy y más.";
    if (nav === "champs") return "Rankings globales y salón de la fama. Mirá quién lidera entre tus amigos en cada juego.";
    if (nav === "settings") return "Configuración, perfil, preferencias y más opciones de MPoints Tracker.";
    if (historyView) return "Historial global de todas las partidas registradas. Buscá y filtrá por juego.";
    return undefined;
  }, [nav, selected, historyView]);

  const seoImage = selected && GAMES[selected]?.coverImage
    ? `https://mpoints-tracker.pages.dev${GAMES[selected].coverImage!}`
    : undefined;

  function hasDraftPlayer(): boolean {
    const draft = getDraft(selected || "");
    if (!draft || typeof draft !== "object") return false;
    const d = draft as Record<string, unknown>;
    if (Array.isArray(d.players) && d.players.some((p) => {
      if (!p || typeof p !== "object") return false;
      return typeof (p as Record<string, unknown>).name === "string" && (p as Record<string, unknown>).name !== "";
    })) return true;
    if (typeof d.p1 === "string" && d.p1 !== "") return true;
    if (typeof d.p2 === "string" && d.p2 !== "") return true;
    if (typeof d.loser === "string" && d.loser !== "") return true;
    return false;
  }

  const selectedGame = selected ? GAMES[selected] : null;
  const accentGameId = selectedGame?.id || "default";
  const sectionHeaderHiddenByScroll = navHiddenByScroll || chromeHiddenByScroll;
  const [rulesSearch, setRulesSearch] = useState("");
  const standardHeaderActions = (showTheme = true) => (
    <>
      {showTheme && (
        <div className="hdr-toggle-mobile">
          <ThemeToggle
            dark={dark}
            onChange={() => handleThemeMode(dark ? "light" : "dark")}
            onLongPress={openThemeSettings}
            t={t}
          />
        </div>
      )}
      <div className="user-row">
        <ReloadButton t={t} />
        {user && <SyncDot syncing={syncing} error={syncError} t={t} isOnline={isOnline} />}
        {user && (
          <button type="button" className="app-layout-avatar-trigger" onClick={() => handleNav("about")} title={t("viewProfile")} aria-label={t("viewProfile")}>
            <UserAvatar user={user} />
          </button>
        )}
        {!user && (
          <button
            className="btn-signout app-layout-connect-btn"
            onClick={() => setShowAuthModal("main")}
          >
            {t("connect")}
          </button>
        )}
      </div>
    </>
  );

  const pageHeader = (title: string) => (
    <AppHeader
      title={title}
      actions={standardHeaderActions()}
      hidden={sectionHeaderHiddenByScroll}
    />
  );
  const openProfile = (uid: string) => {
    setProfileUid(uid);
    setSettingsSubPage(null);
    navigate(`/settings?profile=${encodeURIComponent(uid)}`);
  };
  const openSettingsSubPage = (subPage: string | null) => {
    scrollCurrentSectionToTop();
    navigate(subPage ? `/settings?section=${encodeURIComponent(subPage)}` : "/settings");
  };
  const closeProfile = () => {
    setProfileUid(null);
    navigate("/settings");
  };
  const sectionTransitionKey = historyView
    ? `history-${historyView.key}`
    : `${nav}-${selected || "root"}-${profileUid || "self"}-${settingsSubPage || "main"}`;
  const sectionTransitionClass = `app-section-transition${reduceEffectsEnabled ? " app-section-transition--reduced" : ""}`;

  if (showSplash) {
    return (
      <>
        <SplashScreen
          dark={dark}
          t={t}
          onDone={() => {
            localStorage.setItem("bgt_splash_seen", "1");
            setShowSplash(false);
          }}
        />
        <InstallBanner dark={dark} t={t} />
      </>
    );
  }

  if (!authChecked || (hadPreviousSession && user === undefined)) {
    return (
      <AppShell dark={dark} toast={toast} t={t}>
        <BootShell
          stage="loading"
          copy={t("loadingCopy")}
          loadingLabel={t("loading2")}
        />
      </AppShell>
    );
  }

  if (!user && (!guestMode || isLoginRoute)) {
    return (
      <AppShell dark={dark} toast={toast} t={t}>
        <InstallBanner dark={dark} t={t} />
        {showDebug && (
          <div className="debug-panel">
            <button className="debug-close" onClick={() => setShowDebug(false)} aria-label={t("closeDebugPanel")}>✕</button>
            <div className="debug-panel-entry ok">
              v{APP_VERSION} · isIOS={String(isIOS)} · {navigator.userAgent.slice(0, 60)}
            </div>
            {debugLogs.length === 0
              ? <div className="debug-panel-entry warn">{t("waitingAuth")}</div>
              : debugLogs.map((log) => <div key={log.id} className={`debug-panel-entry ${log.type}`}>{log.msg}</div>)
            }
          </div>
        )}
        <EmailAuthScreen
          t={t}
          onGoogle={signInGoogle}
          lang={lang}
          onLangChange={changeLang}
          dark={dark}
          onDarkChange={() => handleThemeMode(dark ? "light" : "dark")}
          isOnline={isOnline}
          onSignIn={signInWithEmail}
          onSignUp={signUpWithEmail}
          onReset={sendPasswordReset}
          onGuest={() => {
            enterGuestMode();
            if (isLoginRoute) navigate("/", { replace: true });
          }}
          onLogoTap={handleLogoTap}
          showDebug={showDebug}
        />
      </AppShell>
    );
  }

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={selected ? `https://mpoints-tracker.pages.dev/game/${selected}` : undefined}
      />
      <AppShell dark={dark} toast={toast} t={t}>
      <InstallBanner dark={dark} t={t} />
      {pendingInvite && nav === "home" && !selected && (
        <div
          data-testid="pending-invite-banner"
          className="pending-invite-banner"
        >
          <div className="pending-invite-copy">
            <div className="pending-invite-label">
              {t("invitePending")}
            </div>
            <div
              data-testid="pending-invite-name"
              className="pending-invite-name"
            >
              {pendingInvite.displayName}
            </div>
          </div>
          <button
            data-testid="pending-invite-dismiss"
            onClick={dismissPendingInvite}
            className="pending-invite-dismiss"
            aria-label={t("dismissInvite")}
          >
            ✕
          </button>
        </div>
      )}

      <div
        className={`detail-wrapper ${selected && nav === "home" && !historyView ? "is-visible" : "is-hidden"}`}
        data-game-accent={accentGameId}
      >
        {selected && (
          <GameDetail
            game={selectedGame}
            onBack={() => {
              if (hasDraftPlayer()) {
                setNavLeaveTarget("home");
              } else {
                resetGameSession();
                navigate("/");
              }
            }}
            matches={getMatches(selected)}
            onAddMatch={handleGameAddMatch}
            tab={gameTab}
            onTabChange={(tab) => setGameTab(tab)}
            onOpenHistory={(gameId) => openHistoryView({ source: "game", gameId, lockGameFilter: true })}
            onRematch={handleRematchRequest}
            rematchState={postSaveRematch}
            onRematchStateChange={setPostSaveRematch}
            matchKey={gameMatchKey}
            draft={getDraft(selected)}
            onDraftChange={(draft) => saveDraft(selected, draft)}
            linkedPlayers={linkedPlayers[selected] || []}
            onLinkedPlayersChange={(nextLinkedPlayers) =>
              setLinkedPlayers((current) => ({ ...current, [selected]: nextLinkedPlayers }))
            }
            dark={dark}
            onDarkChange={() => handleThemeMode(dark ? "light" : "dark")}
          />
        )}
      </div>

      <div
        key={sectionTransitionKey}
        className={sectionTransitionClass}
        data-testid="app-section-transition"
        data-reduce-effects={String(reduceEffectsEnabled)}
      >
        {historyView ? (
          <div
            data-game-accent={historyView.gameId}
            style={GAMES[historyView.gameId] ? { "--gc": GAMES[historyView.gameId].color } as Record<string, string> : undefined}
          >
            <AppHeader
              testId="history-subpage-header"
              hidden={sectionHeaderHiddenByScroll}
              leading={<button className="ibtn page-back-btn" onClick={closeHistoryView} aria-label={t("back")}><span className="ibtn-glyph">←</span></button>}
              title={t("globalHistory").toUpperCase()}
              actions={standardHeaderActions(false)}
            />
            {historyView.source === "game" && postSaveRematch?.gameId === historyView.gameId && (
              <PostSaveRematchBanner
                game={GAMES[historyView.gameId]}
                rematchState={postSaveRematch}
                t={t}
                onRematch={() => handleRematchRequest(postSaveRematch)}
                onDismiss={() => setPostSaveRematch(null)}
              />
            )}
            <div key={historyView.key}>
              <GlobalHistoryPage
                initialGameFilter={historyView.gameId}
                lockGameFilter={historyView.lockGameFilter}
              />
            </div>
          </div>
        ) : nav === "home" && !selected ? (
          <HomeTab
            t={t}
            lang={lang}
            data={data}
            total={total}
            dark={dark}
            handleThemeMode={handleThemeMode}
            user={user}
            syncing={syncing}
            syncError={syncError}
            handleNav={handleNav}
            onThemeSettings={openThemeSettings}
            setShowAuthModal={setShowAuthModal}
            getMatches={getMatches}
            getDraft={getDraft}
            onOpenGame={openGame}
            onQuickAction={handleHomeQuickAction}
            sectionHeaderHiddenByScroll={sectionHeaderHiddenByScroll}
          />
        ) : nav === "rules" ? (
          <>
            <div
              className={`home-header-surface rules-sticky-header${sectionHeaderHiddenByScroll ? " chrome--hidden" : ""}`}
              data-testid="rules-sticky-header"
            >
              <AppHeader
                title={t("rules").toUpperCase()}
                actions={standardHeaderActions()}
                hidden={sectionHeaderHiddenByScroll}
              />
              <div className="home-utility-shell rules-utility-shell">
                <div className="home-search">
                  <input
                    className="search-inp"
                    value={rulesSearch}
                    onChange={(event) => setRulesSearch(event.target.value)}
                    placeholder={t("rulesSearchPlaceholder")}
                    aria-label={t("rulesSearchPlaceholder")}
                  />
                </div>
              </div>
            </div>
            <div key="rules"><RulesPage t={t} search={rulesSearch} /></div>
          </>
        ) : nav === "champs" ? (
          <>
            <div
              className={`home-header-surface champs-sticky-header${sectionHeaderHiddenByScroll ? " chrome--hidden" : ""}`}
              data-testid="champs-sticky-header"
            >
              <AppHeader
                title={t("champions").toUpperCase()}
                actions={standardHeaderActions()}
                hidden={sectionHeaderHiddenByScroll}
              />
              <div className="home-utility-shell champs-utility-shell">
                <div className="champ-hero">
                  <h2 className="champ-htitle">{t("hallOfFame")}</h2>
                  <div className="champ-sub">{t("rankingsGlobal")}</div>
                </div>
              </div>
            </div>
            <div key="champs">
              <ChampsPage onViewProfile={openProfile} />
            </div>
          </>
        ) : (nav === "admin" && isAdmin) ? (
          <>{pageHeader(t("admin").toUpperCase())}<div key="admin"><AdminPage showToast={showToast} t={t} /></div></>
        ) : nav === "about" ? (
          <>
            <div className={`home-header-surface settings-header-surface${sectionHeaderHiddenByScroll ? " chrome--hidden" : ""}`}>
              {profileUid ? (
                <AppHeader
                  hidden={sectionHeaderHiddenByScroll}
                  leading={<button className="ibtn page-back-btn" onClick={closeProfile} aria-label={t("back")}><span className="ibtn-glyph">←</span></button>}
                  title={t("viewProfile").toUpperCase()}
                  actions={(
                    <div className="user-row">
                      {user && <SyncDot syncing={syncing} error={syncError} t={t} isOnline={isOnline} />}
                      {user && <button type="button" className="app-layout-avatar-trigger" onClick={closeProfile} aria-label={t("viewProfile")}><UserAvatar user={user} /></button>}
                    </div>
                  )}
                />
              ) : settingsSubPage ? (
                <AppHeader
                  hidden={sectionHeaderHiddenByScroll}
                  leading={<button className="ibtn page-back-btn" onClick={() => openSettingsSubPage(settingsSubPage === "apptheme" || settingsSubPage === "advanced" ? "prefs" : null)} aria-label={t("back")}><span className="ibtn-glyph">←</span></button>}
                  titleClassName="app-layout-settings-title"
                  title={settingsSubPage === "prefs" ? t("settingsPrefs")
                    : settingsSubPage === "apptheme" ? t("settingsAppTheme")
                    : settingsSubPage === "advanced" ? t("settingsAdvanced")
                    : t("settingsAbout")}
                  actions={(
                    <div className="user-row">
                      {user && <button type="button" className="app-layout-avatar-trigger" onClick={() => openSettingsSubPage(null)} aria-label={t("viewProfile")}><UserAvatar user={user} /></button>}
                      {!user && <button className="btn-signout app-layout-connect-btn" onClick={() => setShowAuthModal("main")}>{t("connect")}</button>}
                    </div>
                  )}
                />
              ) : pageHeader(t("info").toUpperCase())}
            </div>
            <div key="settings" className="settings-page-shell">
              {profileUid ? (
                <PublicProfilePage
                  uid={profileUid}
                  onBack={closeProfile}
                  t={t}
                  myData={data}
                  myUser={user}
                  onSignOut={signOut}
                  onSignIn={(mode) => setShowAuthModal(mode || "main")}
                  showToast={showToast}
                />
              ) : (
                <SettingsPage
                  data={data}
                  onSignOut={signOut}
                  onSignIn={(mode) => setShowAuthModal(mode || "main")}
                  onViewProfile={openProfile}
                  lang={lang}
                  onLangChange={changeLang}
                  wakeLockEnabled={wakeLockEnabled}
                  onToggleWakeLock={setWakeLockEnabled}
                  oledEnabled={oledEnabled}
                  onToggleOled={handleToggleOled}
                  dark={dark}
                  themeMode={themeMode}
                  onThemeMode={handleThemeMode}
                  themeAccentMode={themeAccentMode}
                  onThemeAccentMode={handleThemeAccentMode}
                  reduceEffects={reduceEffectsEnabled}
                  onToggleReduceEffects={handleToggleReduceEffects}
                  subPage={settingsSubPage}
                  onSubPage={openSettingsSubPage}
                />
              )}
            </div>
          </>
        ) : null}
      </div>

      {!hideBottomNav && (
        <nav
          className={`nav${navOpen ? " nav--open" : ""}${navHiddenByScroll ? " nav--hidden" : ""}`}
          data-game-accent={accentGameId}
          aria-label={t("mainNavigation")}
        >
          <div className="nav-top">
            <button
              className="nav-hamburger"
              aria-label={navOpen ? t("closeMenu") : t("openMenu")}
              onClick={() => setNavOpen((current) => !current)}
              title={navOpen ? t("closeMenu") : t("openMenu")}
            >
              <span aria-hidden="true">{navOpen ? "✕" : "☰"}</span>
            </button>
            <div className="nav-brand">
              <span className="nav-brand-title">MPOINTS</span>
              <span className="nav-brand-sub">TRACKER</span>
            </div>
          </div>
          {navItems.map((item) => (
            <NavPillButton
              key={item.id}
              n={item}
              active={nav === item.id}
              onNav={() => {
                if (historyView && item.id === "home" && selected) {
                  closeHistoryView();
                } else if (item.id === nav && item.id === "home" && selected) {
                  if (hasDraftPlayer()) {
                    setNavLeaveTarget("home");
                  } else {
                    resetGameSession();
                    navigate("/");
                  }
                } else if (item.id === nav && item.id !== "home") {
                  setSettingsSubPage(null);
                  setProfileUid(null);
                  handleNav(item.id);
                } else {
                  handleNav(item.id);
                }
                setNavOpen(false);
              }}
            />
          ))}
          <div className="nav-theme-slot">
            <ThemeToggle dark={dark} onChange={() => handleThemeMode(dark ? "light" : "dark")} onLongPress={openThemeSettings} t={t} />
          </div>
        </nav>
      )}
      {showNavOverlay && <div className="nav-overlay" onClick={() => setNavOpen(false)} />}

      {showAuthModal && showAuthModal !== "google" && (
        <div className="app-layout-auth-modal-shell" role="dialog" aria-modal="true" aria-label={t("connect")}>
          <EmailAuthScreen
            t={t}
            initialMode={showAuthModal}
            lang={lang}
            onLangChange={changeLang}
            dark={dark}
            onDarkChange={() => handleThemeMode(dark ? "light" : "dark")}
            isOnline={isOnline}
            onGoogle={async () => { await signInGoogle(); setShowAuthModal(false); }}
            onSignIn={async (email, password) => {
              const error = await signInWithEmail(email, password);
              if (!error) setShowAuthModal(false);
              return error;
            }}
            onSignUp={async (email, password, name) => {
              const error = await signUpWithEmail(email, password, name);
              if (!error) setShowAuthModal(false);
              return error;
            }}
            onReset={sendPasswordReset}
            onGuest={() => { enterGuestMode(); setShowAuthModal(false); }}
            onLogoTap={handleLogoTap}
            onClose={() => setShowAuthModal(false)}
            showDebug={false}
          />
        </div>
      )}

      {navLeaveTarget && (
        <div className="nav-leave-overlay" role="dialog" aria-modal="true" aria-labelledby="nav-leave-title" style={selectedGame ? ({ "--gc": selectedGame.color } as Record<string, string>) : undefined}>
          <div className="nav-leave-dialog">
            <div id="nav-leave-title" className="nav-leave-title">{t("draftTitle")}</div>
            <div className="nav-leave-message">{t("draftMsg")}</div>
            <div className="nav-leave-actions">
              <button className="btnsec nav-leave-keep" onClick={() => setNavLeaveTarget(null)}>{t("draftKeep")}</button>
              <button className="btnpri nav-leave-save" onClick={() => confirmNavLeave(false)}>{t("draftSave")}</button>
              <button className="btnsec nav-leave-discard" onClick={() => confirmNavLeave(true)}>{t("draftDiscard")}</button>
            </div>
          </div>
        </div>
      )}
      <SpotifyMiniPlayer />
      <ScrollToTop />
    </AppShell>
    </>
  );
}
