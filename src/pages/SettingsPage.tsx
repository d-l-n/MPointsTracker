import { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { buildStats } from "../lib/stats";
import FeedbackPage from "./FeedbackPage";
import { scrollCurrentSectionToTop } from "../hooks/useNavigation";
import AccountSection from "../components/settings/AccountSection";
import AdvancedSection from "../components/settings/AdvancedSection";
import EffectsSection from "../components/settings/EffectsSection";
import LanguageSection from "../components/settings/LanguageSection";
import PlayerGroupsSection from "../components/settings/PlayerGroupsSection";
import ThemeSection from "../components/settings/ThemeSection";
import VersionTapper from "../components/ui/VersionTapper";
import { SectionLabel, SettingsRow, type AppUser, type LanguageCode, type SettingsSubPage } from "../components/settings/shared";
import { Sun, Cpu, Information, MessageText } from "reicon-react";
import type {
  AppContextValue,
  Match,
  MatchStore,
  PlayerGroup,
  ThemeAccentMode,
  ThemeMode,
} from "../types";

interface SettingsPageProps {
  data: MatchStore;
  onImportData: (data: MatchStore) => Promise<void> | void;
  onSignOut: (keepLocal?: boolean) => void;
  onSignIn: (mode: "google" | "signin") => void;
  onViewProfile?: ((uid: string) => void) | null;
  lang: string;
  onLangChange: (lang: LanguageCode | string) => void;
  wakeLockEnabled: boolean;
  onToggleWakeLock: (value: boolean) => void;
  hapticEnabled: boolean;
  onToggleHaptic: (value: boolean) => void;
  oledEnabled: boolean;
  onToggleOled: (value: boolean) => void;
  dark: boolean;
  themeMode: ThemeMode;
  onThemeMode: (mode: ThemeMode) => void;
  themeAccentMode: ThemeAccentMode;
  onThemeAccentMode: (mode: ThemeAccentMode) => void;
  reduceEffects: boolean;
  onToggleReduceEffects: (value: boolean) => void;
  subPage?: SettingsSubPage | null;
  onSubPage: (subPage: SettingsSubPage) => void;
}

function AboutSubPage({ user, showToast, t }: {
  user: AppUser | null;
  showToast?: (msg: string, duration?: number) => void;
  t: AppContextValue["t"];
}) {
  return (
    <div className="page">
      <div className="about-intro">
        <h2 className="about-intro-title">MPoints Tracker</h2>
        <div className="about-intro-text">{t("appTagline")} {t("appSyncDesc")}</div>
      </div>

      <SectionLabel label={t("version")} icon={<Information size={14} />} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div className="about-row"><span className="about-label">{t("version")}</span><VersionTapper /></div>
      </div>

      <SectionLabel label={t("feedbackSection")} icon={<MessageText size={14} />} />
      <div className="about-card" style={{ marginBottom: "14px", padding: 0, overflow: "hidden" }}>
        <FeedbackPage user={user} showToast={showToast} t={t} />
      </div>
    </div>
  );
}

function SettingsPage({
  data,
  onImportData,
  onSignOut,
  onSignIn,
  onViewProfile,
  lang,
  onLangChange,
  wakeLockEnabled,
  onToggleWakeLock,
  hapticEnabled,
  onToggleHaptic,
  oledEnabled,
  onToggleOled,
  dark,
  themeMode,
  onThemeMode,
  themeAccentMode,
  onThemeAccentMode,
  reduceEffects,
  onToggleReduceEffects,
  subPage,
  onSubPage,
}: SettingsPageProps) {
  const {
    user,
    t,
    showToast,
    playerGroups = [],
    savePlayerGroups,
    spotifyEnabled,
    spotifyPosition,
    saveSpotifyPreference,
    saveSpotifyPosition,
  } = useAppContext() as AppContextValue & {
    user: AppUser | null;
    showToast?: (msg: string, duration?: number) => void;
    playerGroups?: PlayerGroup[];
    spotifyEnabled: boolean;
    spotifyPosition: "center" | "left" | "right" | "draggable";
    saveSpotifyPreference: (enabled: boolean) => Promise<void> | void;
    saveSpotifyPosition: (position: "center" | "left" | "right" | "draggable") => Promise<void> | void;
  };
  useEffect(() => {
    if (subPage) {
      scrollCurrentSectionToTop();
    }
  }, [subPage]);

  const totalMatches = Object.entries(data)
    .filter(([key]) => !key.startsWith("__"))
    .reduce((sum, [, matches]) => sum + (Array.isArray(matches) ? matches.length : 0), 0);
  const allMatches = Object.entries(data).reduce<Match[]>((matchesAcc, [key, matches]) => {
    if (key.startsWith("__") || !Array.isArray(matches)) {
      return matchesAcc;
    }
    return [...matchesAcc, ...(matches as Match[])];
  }, []);
  const displayName = user?.displayName || localStorage.getItem("bgt_guest_name") || "";
  const profileStats = displayName
    ? (buildStats(allMatches).find((stat) => stat.name === displayName) || null)
    : null;

  if (subPage === "apptheme") {
    return (
      <div className="page">
        <ThemeSection
          dark={dark}
          themeMode={themeMode}
          onThemeMode={onThemeMode}
          themeAccentMode={themeAccentMode}
          onThemeAccentMode={onThemeAccentMode}
          oledEnabled={oledEnabled}
          onToggleOled={onToggleOled}
          t={t}
        />
      </div>
    );
  }
  if (subPage === "advanced") {
    return (
      <AdvancedSection
        wakeLockEnabled={wakeLockEnabled}
        onToggleWakeLock={onToggleWakeLock}
        hapticEnabled={hapticEnabled}
        onToggleHaptic={onToggleHaptic}
        data={data}
        onImportData={onImportData}
        showToast={showToast}
        t={t}
      />
    );
  }
  if (subPage === "prefs") {
    return (
      <div className="page">
        <SettingsRow title={t("settingsAppThemeTitle")} desc={t("settingsAppThemeDesc")} onClick={() => onSubPage("apptheme")} icon={<Sun size={18} />} />
        <SettingsRow title={t("settingsAdvancedTitle")} desc={t("settingsAdvancedDesc")} onClick={() => onSubPage("advanced")} icon={<Cpu size={18} />} />
        <EffectsSection
          reduceEffects={reduceEffects}
          onToggleReduceEffects={onToggleReduceEffects}
          spotifyEnabled={spotifyEnabled}
          onToggleSpotify={(enabled) => {
            void saveSpotifyPreference(enabled);
            showToast?.(enabled ? t("spotifyEnabledToast") : t("spotifyDisabledToast"));
          }}
          spotifyPosition={spotifyPosition}
          onSpotifyPositionChange={(position) => void saveSpotifyPosition(position)}
          t={t}
        />
        <LanguageSection lang={lang} onLangChange={onLangChange} t={t} />
        <PlayerGroupsSection
          playerGroups={playerGroups}
          savePlayerGroups={savePlayerGroups}
          showToast={showToast}
          t={t}
        />
      </div>
    );
  }
  if (subPage === "about") {
    return <AboutSubPage user={user} showToast={showToast} t={t} />;
  }

  return (
    <AccountSection
      user={user}
      displayName={displayName}
      onSignOut={onSignOut}
      onSignIn={onSignIn}
      onViewProfile={onViewProfile}
      onSubPage={onSubPage}
      totalMatches={totalMatches}
      quickWins={profileStats?.wins ?? 0}
      quickWinrate={profileStats?.winrate ?? 0}
      quickStreak={profileStats?.streak.max ?? 0}
      statusPrimary={user ? (user.email || t("connected")) : t("localOnly")}
      statusSecondary={user ? t("cloudAndDevice") : t("deviceOnly")}
      showToast={showToast}
      t={t}
    />
  );
}

export default SettingsPage;
