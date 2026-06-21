import { useState, useCallback, useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { useAppContext } from "../context/AppContext";
import { fbAuth, fbDb } from "../lib/firebase";
import { buildStats } from "../lib/stats";
import { updateProfile } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { saveUserProfile } from "../services/userService";
import UserQRCode from "../components/auth/UserQRCode";
import UserAvatar from "../components/ui/UserAvatar";
import ConfirmModal from "../components/ui/ConfirmModal";
import UserSearchModal from "../components/auth/UserSearchModal";
import PillSwitch from "../components/ui/PillSwitch";
import VersionTapper from "../components/ui/VersionTapper";
import FeedbackPage from "./FeedbackPage";
import { scrollCurrentSectionToTop } from "../hooks/useNavigation";
import type {
  AppContextValue,
  Match,
  MatchStore,
  PlayerGroup,
  PlayerGroupMember,
  ThemeAccentMode,
  ThemeMode,
  TranslationFn,
} from "../types";

const LANGUAGE_OPTIONS = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "fr", label: "Français" },
] as const;

type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];
type SettingsSubPage = "apptheme" | "advanced" | "prefs" | "about";

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  delete?: () => Promise<unknown> | unknown;
  [key: string]: unknown;
}

interface LinkedProfile {
  uid?: string | null;
}

interface GroupDraftPlayer {
  name: string;
  uid: string | null;
}

interface LinkModalState {
  groupIdx: number | null;
  playerIdx: number;
  name: string;
}

interface SectionLabelProps {
  label: string;
}

interface SettingsRowProps {
  title: string;
  desc?: string | null;
  onClick?: () => void;
  testId?: string;
}

interface SettingsToggleRowProps {
  title: string;
  desc?: string | null;
  note?: string | null;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  testId?: string;
  switchTestId?: string;
}

interface ProfileStatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

interface AppThemeSubPageProps {
  dark: boolean;
  themeMode: ThemeMode;
  onThemeMode: (mode: ThemeMode) => void;
  themeAccentMode: ThemeAccentMode;
  onThemeAccentMode: (mode: ThemeAccentMode) => void;
  oledEnabled: boolean;
  onToggleOled: (value: boolean) => void;
  t: TranslationFn;
}

interface AdvancedSubPageProps {
  wakeLockEnabled: boolean;
  onToggleWakeLock: (value: boolean) => void;
  hapticEnabled: boolean;
  onToggleHaptic: (value: boolean) => void;
  data: MatchStore;
  showToast?: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

interface PrefsSubPageProps {
  reduceEffects: boolean;
  onToggleReduceEffects: (value: boolean) => void;
  spotifyEnabled: boolean;
  onToggleSpotify: (value: boolean) => void;
  spotifyPosition: "center" | "left" | "right" | "draggable";
  onSpotifyPositionChange: (value: "center" | "left" | "right" | "draggable") => void;
  lang: string;
  onLangChange: (lang: string) => void;
  playerGroups: PlayerGroup[];
  savePlayerGroups?: (groups: PlayerGroup[]) => Promise<void> | void;
  showToast?: (msg: string, duration?: number) => void;
  t: TranslationFn;
  onSubPage: (subPage: SettingsSubPage) => void;
}

interface AboutSubPageProps {
  user: AppUser | null;
  showToast?: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

interface SettingsPageProps {
  data: MatchStore;
  onSignOut: (keepLocal?: boolean) => void;
  onSignIn: (mode: "google" | "signin") => void;
  onViewProfile?: ((uid: string) => void) | null;
  lang: string;
  onLangChange: (lang: LanguageCode | string) => void;
  wakeLockEnabled: boolean;
  onToggleWakeLock: (value: boolean) => void;
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

const primaryActionStyle: CSSProperties & Record<"--gc", string> = {
  "--gc": "#006D77",
  fontFamily: "'Google Sans',sans-serif",
  fontSize: ".84rem",
  fontWeight: 700,
  letterSpacing: "1px",
  padding: "12px 14px",
};

const compactSaveStyle: CSSProperties & Record<"--gc", string> = {
  "--gc": "#006D77",
  padding: "8px 14px",
  fontSize: ".8rem",
  width: "auto",
  letterSpacing: "1px",
};

function getMemberName(player: PlayerGroupMember | GroupDraftPlayer): string {
  return typeof player === "string" ? player : player.name;
}

function SectionLabel({ label }: SectionLabelProps) {
  return (
    <span className="flbl" style={{ display: "block", marginBottom: "10px", fontSize: ".65rem", letterSpacing: 2 }}>
      {label.toUpperCase()}
    </span>
  );
}

function SettingsRow({ title, desc, onClick, testId }: SettingsRowProps) {
  return (
    <button
      className="settings-row"
      onClick={onClick}
      data-testid={testId}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "16px 18px",
        background: "var(--content-surface)", backdropFilter: "var(--content-blur)", WebkitBackdropFilter: "var(--content-blur)",
        border: "var(--surface-stroke-width) solid var(--content-border)", borderRadius: "var(--r)",
        boxShadow: "var(--content-shadow)",
        cursor: "pointer", marginBottom: "10px", textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "'Google Sans',sans-serif", fontSize: ".78rem", letterSpacing: "normal" }}>
        <div>
          <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--tx)", letterSpacing: "normal", lineHeight: 1.2 }}>
            {title}
          </div>
          {desc && <div style={{ fontSize: ".72rem", color: "var(--tx2)", marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <span style={{ color: "var(--tx3)", fontSize: "1.4rem", lineHeight: 1, flexShrink: 0 }}>›</span>
    </button>
  );
}

function SettingsToggleRow({ title, desc, note, enabled, onToggle, testId, switchTestId }: SettingsToggleRowProps) {
  return (
    <div className="settings-sub-row" data-testid={testId}>
      <div className="settings-sub-copy">
        <div className="settings-sub-label">{title}</div>
        {desc && <div className="settings-sub-desc">{desc}</div>}
        {note && <div className="settings-sub-note">{note}</div>}
      </div>
      <PillSwitch
        enabled={enabled}
        onToggle={onToggle}
        testId={switchTestId}
        ariaLabel={title}
      />
    </div>
  );
}

function ProfileStatCard({ label, value, accent }: ProfileStatCardProps) {
  return (
    <div className="settings-profile-stat" style={{ "--profile-stat-accent": accent || "var(--gc,#006D77)" } as CSSProperties & Record<"--profile-stat-accent", string>}>
      <span className="settings-profile-stat-value">{value}</span>
      <span className="settings-profile-stat-label">{label}</span>
    </div>
  );
}

function AppThemeSubPage({
  dark,
  themeMode,
  onThemeMode,
  themeAccentMode,
  onThemeAccentMode,
  oledEnabled,
  onToggleOled,
  t,
}: AppThemeSubPageProps) {
  const modes: { id: ThemeMode; label: string }[] = [
    { id: "light", label: t("themeLight") },
    { id: "dark", label: t("themeDark") },
    { id: "system", label: t("themeSystem") },
  ];

  return (
    <div className="page">
      <SectionLabel label={t("themeModeLabel")} />
      <div className="about-card" style={{ marginBottom: "18px" }}>
        <div style={{ padding: "14px 0 10px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {modes.map((mode) => (
              <button
                key={mode.id}
                className={"theme-mode-btn" + (themeMode === mode.id ? " active" : "")}
                onClick={() => onThemeMode(mode.id)}
              >
                <span style={{ fontSize: ".68rem", lineHeight: 1.2, textAlign: "center" }}>
                  {mode.label}
                </span>
              </button>
            ))}
          </div>
          {themeMode === "system" && (
            <div style={{ fontSize: ".7rem", color: "var(--tx3)", marginTop: 10, textAlign: "center" }}>
              {dark ? t("themeDarkSystem") : t("themeLightSystem")}
            </div>
          )}
        </div>
      </div>

      <SectionLabel label={t("themeAccentLabel") || "Accent"} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title="Monet"
          desc={t("monetThemeDesc") || "Uses Material You colors when available on Android and a local fallback elsewhere."}
          enabled={themeAccentMode === "monet"}
          onToggle={(value) => onThemeAccentMode(value ? "monet" : "default")}
          switchTestId="monet-toggle"
        />
      </div>

      <SectionLabel label={t("oledMode") || "OLED Mode"} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title={t("oledMode")}
          desc={t("oledModeDesc")}
          note={!dark ? t("oledOnlyDark") : null}
          enabled={oledEnabled}
          onToggle={onToggleOled}
          switchTestId="oled-toggle"
        />
      </div>
    </div>
  );
}

function AdvancedSubPage({ wakeLockEnabled, onToggleWakeLock, hapticEnabled, onToggleHaptic, data, showToast, t }: AdvancedSubPageProps) {
  const handleExport = useCallback(() => {
    try {
      const exportData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (!key.startsWith("__")) {
          exportData[key] = value;
        }
      });
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mpoints_backup_" + new Date().toISOString().slice(0, 10) + ".json";
      anchor.click();
      URL.revokeObjectURL(url);
      showToast?.(t("exportDone") || "✅ Datos exportados");
    } catch {
      showToast?.("❌ Error al exportar");
    }
  }, [data, showToast, t]);

  return (
    <div className="page">
      {"wakeLock" in navigator && (
        <>
          <SectionLabel label={t("displaySection")} />
          <div className="about-card" style={{ marginBottom: "14px" }}>
            <SettingsToggleRow
              title={t("screenOn")}
              desc={t("screenOnDesc")}
              enabled={wakeLockEnabled}
              onToggle={onToggleWakeLock}
            />
          </div>
        </>
      )}

      {"vibrate" in navigator && (
        <>
          <SectionLabel label={t("interactionSection")} />
          <div className="about-card" style={{ marginBottom: "14px" }}>
            <SettingsToggleRow
              title={t("hapticFeedback")}
              desc={t("hapticFeedbackDesc")}
              enabled={hapticEnabled}
              onToggle={onToggleHaptic}
            />
          </div>
        </>
      )}

      <SectionLabel label={t("dataSection")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div style={{ padding: "4px 0 4px" }}>
          <div style={{ fontSize: ".78rem", color: "var(--tx2)", marginBottom: 12 }}>
            {t("exportDataDesc")}
          </div>
          <button
            className="btnpri"
            style={{ fontSize: ".9rem", padding: "11px" }}
            onClick={handleExport}
          >
            {t("exportDataBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrefsSubPage({
  reduceEffects,
  onToggleReduceEffects,
  spotifyEnabled,
  onToggleSpotify,
  spotifyPosition,
  onSpotifyPositionChange,
  lang,
  onLangChange,
  playerGroups,
  savePlayerGroups,
  showToast,
  t,
  onSubPage,
}: PrefsSubPageProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupPlayers, setNewGroupPlayers] = useState<GroupDraftPlayer[]>([]);
  const [newPlayerInput, setNewPlayerInput] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<LinkModalState | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<number | null>(null);

  const isDuplicateGroup = (newPlayers: GroupDraftPlayer[]) => {
    const newNames = new Set(newPlayers.map((player) => player.name.toLowerCase().trim()));
    return playerGroups.some((group) => {
      const existingNames = new Set((group.players || []).map((player) => getMemberName(player).toLowerCase().trim()));
      if (existingNames.size !== newNames.size) {
        return false;
      }
      for (const name of newNames) {
        if (!existingNames.has(name)) {
          return false;
        }
      }
      return true;
    });
  };

  const handleGroupToggle = (groupIndex: number) => {
    setExpandedGroup(expandedGroup === groupIndex ? null : groupIndex);
  };

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLDivElement>, groupIndex: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleGroupToggle(groupIndex);
    }
  };

  return (
    <div className="page">
      <SettingsRow title={t("settingsAppThemeTitle")} desc={t("settingsAppThemeDesc")} onClick={() => onSubPage("apptheme")} />
      <SettingsRow title={t("settingsAdvancedTitle")} desc={t("settingsAdvancedDesc")} onClick={() => onSubPage("advanced")} />

      <SectionLabel label={t("accessibilitySection")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title={t("reduceEffects")}
          desc={t("reduceEffectsDesc")}
          enabled={reduceEffects}
          onToggle={onToggleReduceEffects}
          testId="reduce-effects-row"
          switchTestId="reduce-effects-toggle"
        />
      </div>

      <SectionLabel label={t("spotifySection")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title={t("spotifyIntegration")}
          desc={t("spotifyIntegrationDesc")}
          note={t("spotifyPremiumNote")}
          enabled={spotifyEnabled}
          onToggle={onToggleSpotify}
          testId="spotify-preference-row"
          switchTestId="spotify-preference-toggle"
        />
        {spotifyEnabled && (
          <div className="about-row" style={{ marginTop: "12px", borderTop: "1px solid var(--bo2)", paddingTop: "12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <span className="about-label" style={{ fontSize: ".82rem", color: "var(--tx2)", fontWeight: 600 }}>{t("spotifyPosition")}</span>
            <select
              value={spotifyPosition}
              onChange={(e) => onSpotifyPositionChange(e.target.value as "center" | "left" | "right" | "draggable")}
              className="inp"
              style={{ padding: "6px 10px", fontSize: ".85rem", width: "100%", maxWidth: "200px" }}
              data-testid="spotify-position-select"
            >
              <option value="center">{t("spotifyPosCenter")}</option>
              <option value="left">{t("spotifyPosLeft")}</option>
              <option value="right">{t("spotifyPosRight")}</option>
              <option value="draggable">{t("spotifyPosDraggable")}</option>
            </select>
          </div>
        )}
      </div>

      <SectionLabel label={t("language")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div className="about-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <span className="about-label">{t("languageLabel")}</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {LANGUAGE_OPTIONS.map(({ code, label }) => (
              <button
                key={code}
                className="lang-pill-btn"
                data-testid={`lang-pill-${code}`}
                onClick={() => onLangChange(code)}
                style={{
                  padding: "5px 12px", borderRadius: "var(--rxs)", cursor: "pointer",
                  border: "1.5px solid " + (lang === code ? "var(--accent,#006D77)" : "var(--bo2)"),
                  background: lang === code ? "color-mix(in srgb,var(--accent,#006D77) 15%,transparent)" : "none",
                  color: lang === code ? "var(--accent,#006D77)" : "var(--tx2)",
                  fontFamily: "'Google Sans',sans-serif", fontSize: ".82rem", fontWeight: 700,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SectionLabel label={t("playerGroupsTitle")} />
      <div className="about-card" style={{ marginBottom: "14px", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 10px" }}>
          {playerGroups.length === 0
            ? <div style={{ fontSize: ".78rem", color: "var(--tx3)", marginBottom: 10 }}>{t("noGroupsSaved")}</div>
            : playerGroups.map((group, groupIndex) => (
              <div key={groupIndex} style={{ borderBottom: "1px solid var(--bo)", paddingBottom: 8, marginBottom: 8 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  onClick={() => handleGroupToggle(groupIndex)}
                  onKeyDown={(event) => handleGroupKeyDown(event, groupIndex)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedGroup === groupIndex}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--tx)" }}>{group.name}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--tx3)", marginTop: 2 }}>
                      {(group.players || []).map((player) => getMemberName(player)).join(", ")}
                    </div>
                  </div>
                  <span style={{ fontSize: ".7rem", color: "var(--tx3)" }}>{expandedGroup === groupIndex ? "▲" : "▼"}</span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteGroup(groupIndex);
                    }}
                    aria-label={t("deleteGroupConfirm")}
                    style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: ".68rem", fontWeight: 700, padding: "4px" }}
                  >
                    {t("delete")}
                  </button>
                </div>
                {expandedGroup === groupIndex && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, paddingLeft: 4 }}>
                    {(group.players || []).map((player, playerIndex) => {
                      const name = getMemberName(player);
                      const uid = typeof player === "string" ? null : (player.uid ?? null);
                      return (
                        <div key={playerIndex} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: "var(--rxs)", padding: "4px 6px" }}>
                          <div style={{ flex: 1, fontSize: ".82rem", color: uid ? "var(--gc)" : "var(--tx)", fontWeight: uid ? 700 : 400 }}>
                            {name}
                            {uid && <span style={{ fontSize: ".65rem", color: "var(--gc)", marginLeft: 4, fontWeight: 600 }}>{t("linkedBadge")}</span>}
                          </div>
                          <button
                            onClick={() => {
                              if (uid) {
                                savePlayerGroups?.(playerGroups.map((currentGroup, currentGroupIndex) => (
                                  currentGroupIndex !== groupIndex
                                    ? currentGroup
                                    : {
                                        ...currentGroup,
                                        players: (currentGroup.players || []).map((currentPlayer, currentPlayerIndex) => (
                                          currentPlayerIndex !== playerIndex
                                            ? currentPlayer
                                            : getMemberName(currentPlayer)
                                        )),
                                      }
                                )));
                              } else {
                                setShowLinkModal({ groupIdx: groupIndex, playerIdx: playerIndex, name });
                              }
                            }}
                            style={{ fontSize: ".68rem", padding: "3px 8px", borderRadius: "var(--rxs)", border: "1px solid " + (uid ? "rgba(255,68,68,.4)" : "var(--bo2)"), background: "none", cursor: "pointer", color: uid ? "#ff6b6b" : "var(--gc,#006D77)", fontWeight: 600, flexShrink: 0 }}
                          >
                            {uid ? t("unlinkPlayer") : t("linkPlayer")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            <div className="inp-group">
              <label htmlFor="new-group-name" className="inp-label">{t("groupNamePlaceholder")}</label>
              <input
                id="new-group-name"
                className="inp"
                placeholder={t("groupNamePlaceholder")}
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
              />
            </div>
            {newGroupPlayers.map((player, playerIndex) => (
              <div key={playerIndex} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--rxs)", padding: "6px 10px" }}>
                <span style={{ flex: 1, fontSize: ".82rem", color: "var(--tx)", fontWeight: player.uid ? 700 : 400 }}>
                  {player.name}
                  {player.uid && <span style={{ fontSize: ".65rem", color: "#52B788", marginLeft: 4 }}>{t("linkedBadge")}</span>}
                </span>
                <button
                  onClick={() => {
                    if (player.uid) {
                      setNewGroupPlayers((players) => players.map((currentPlayer, currentPlayerIndex) => (
                        currentPlayerIndex !== playerIndex ? currentPlayer : { name: currentPlayer.name, uid: null }
                      )));
                    } else {
                      setShowLinkModal({ groupIdx: null, playerIdx: playerIndex, name: player.name });
                    }
                  }}
                  style={{ fontSize: ".65rem", padding: "2px 7px", borderRadius: "var(--rxs)", border: "1px solid " + (player.uid ? "rgba(255,68,68,.4)" : "color-mix(in srgb,#006D77 40%,transparent)"), background: "none", cursor: "pointer", color: player.uid ? "#ff6b6b" : "var(--gc,#006D77)", fontWeight: 600 }}
                >
                  {player.uid ? t("unlinkPlayer") : t("linkPlayer")}
                </button>
                <button
                  onClick={() => setNewGroupPlayers((players) => players.filter((_, currentPlayerIndex) => currentPlayerIndex !== playerIndex))}
                  aria-label={`${t("delete")} ${player.name}`}
                  style={{ background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", fontSize: ".9rem" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="inp-group">
              <label htmlFor="new-group-player" className="inp-label">{t("playerNamePlaceholder")}</label>
              <input
                id="new-group-player"
                className="inp"
                placeholder={t("playerNamePlaceholder")}
                value={newPlayerInput}
                onChange={(event) => setNewPlayerInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && newPlayerInput.trim()) {
                    setNewGroupPlayers((players) => [...players, { name: newPlayerInput.trim(), uid: null }]);
                    setNewPlayerInput("");
                  }
                }}
              />
            </div>
            {newPlayerInput.trim() && (
              <button
                className="btndash"
                onClick={() => {
                  setNewGroupPlayers((players) => [...players, { name: newPlayerInput.trim(), uid: null }]);
                  setNewPlayerInput("");
                }}
              >
                + {newPlayerInput.trim()}
              </button>
            )}
            <button
              className="btnpri"
              style={primaryActionStyle}
              disabled={!newGroupName.trim() || newGroupPlayers.length === 0}
              onClick={() => {
                if (isDuplicateGroup(newGroupPlayers)) {
                  showToast?.(t("duplicateGroup"));
                  return;
                }
                savePlayerGroups?.([...playerGroups, { name: newGroupName.trim(), players: newGroupPlayers }]);
                setNewGroupName("");
                setNewGroupPlayers([]);
                setNewPlayerInput("");
              }}
            >
              {t("saveGroupBtn")}
            </button>
          </div>
        </div>
      </div>

      {confirmDeleteGroup !== null && (
        <ConfirmModal
          title={t("deleteGroupTitle")}
          msg={playerGroups[confirmDeleteGroup]?.name || ""}
          confirmLabel={t("deleteGroupConfirm")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            savePlayerGroups?.(playerGroups.filter((_, groupIndex) => groupIndex !== confirmDeleteGroup));
            setConfirmDeleteGroup(null);
          }}
          onCancel={() => setConfirmDeleteGroup(null)}
        />
      )}
      {showLinkModal && (
        <UserSearchModal
          t={t}
          knownNames={[]}
          onClose={() => setShowLinkModal(null)}
          onLink={(linked: LinkedProfile) => {
            const { groupIdx, playerIdx } = showLinkModal;
            if (groupIdx !== null) {
              savePlayerGroups?.(playerGroups.map((group, groupIndex) => (
                groupIndex !== groupIdx
                  ? group
                  : {
                      ...group,
                      players: (group.players || []).map((player, currentPlayerIndex) => {
                        if (currentPlayerIndex !== playerIdx) {
                          return player;
                        }
                        const name = getMemberName(player);
                        return linked.uid ? { name, uid: linked.uid } : name;
                      }),
                    }
              )));
            } else {
              setNewGroupPlayers((players) => players.map((player, currentPlayerIndex) => (
                currentPlayerIndex === playerIdx ? { name: player.name, uid: linked.uid || null } : player
              )));
            }
            setShowLinkModal(null);
          }}
        />
      )}
    </div>
  );
}

function AboutSubPage({ user, showToast, t }: AboutSubPageProps) {
  return (
    <div className="page">
      <div className="about-intro">
        <h2 className="about-intro-title">MPoints Tracker</h2>
        <div className="about-intro-text">{t("appTagline")} {t("appSyncDesc")}</div>
      </div>

      <SectionLabel label={t("version")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div className="about-row"><span className="about-label">{t("version")}</span><VersionTapper /></div>
      </div>

      <SectionLabel label={t("feedbackSection")} />
      <div className="about-card" style={{ marginBottom: "14px", padding: 0, overflow: "hidden" }}>
        <FeedbackPage user={user} showToast={showToast} t={t} />
      </div>
    </div>
  );
}

function SettingsPage({
  data,
  onSignOut,
  onSignIn,
  onViewProfile,
  lang,
  onLangChange,
  wakeLockEnabled,
  onToggleWakeLock,
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
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const statusPrimary = user ? (user.email || t("connected")) : t("localOnly");
  const statusSecondary = user ? t("cloudAndDevice") : t("deviceOnly");
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("bgt_haptic") !== "0";
    } catch {
      return true;
    }
  });

  const handleToggleHaptic = useCallback((value: boolean) => {
    setHapticEnabled(value);
    try {
      localStorage.setItem("bgt_haptic", value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!editingName) {
      return;
    }
    nameInputRef.current?.focus();
  }, [editingName]);

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
  const quickWins = profileStats?.wins ?? 0;
  const quickWinrate = profileStats?.winrate ?? 0;
  const quickStreak = profileStats?.streak.max ?? 0;

  const handleSaveName = async () => {
    const currentUser = fbAuth.currentUser;
    if (!nameVal.trim() || !currentUser || !user?.uid) {
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(currentUser, { displayName: nameVal.trim() });
      await currentUser.reload();
      await saveUserProfile(user.uid, { ...user, displayName: nameVal.trim() });
      showToast?.(t("nameSaved"));
      setEditingName(false);
    } catch {
      showToast?.(t("errSaveName"));
    }
    setSavingName(false);
  };

  const handleSaveGuestName = () => {
    if (!nameVal.trim()) {
      return;
    }
    localStorage.setItem("bgt_guest_name", nameVal.trim());
    showToast?.(t("nameSaved"));
    setEditingName(false);
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) {
      return;
    }

    setDeletingAccount(true);
    try {
      const authUser = fbAuth.currentUser;
      if (authUser?.delete) {
        await authUser.delete();
      } else if (typeof user.delete === "function") {
        await user.delete();
      }
      await Promise.allSettled([deleteDoc(doc(fbDb, "users", user.uid)), deleteDoc(doc(fbDb, "userdata", user.uid))]);
      localStorage.clear();
      showToast?.(t("accountDeleted"));
    } catch (errorValue) {
      const code = typeof errorValue === "object" && errorValue && "code" in errorValue ? (errorValue as { code?: string }).code : undefined;
      showToast?.(code === "auth/requires-recent-login" ? t("errDeleteAccountReauth") : t("errDeleteAccount"));
    }
    setDeletingAccount(false);
    setConfirmDeleteAccount(false);
  };

  if (subPage === "apptheme") {
    return (
      <AppThemeSubPage
        dark={dark}
        themeMode={themeMode}
        onThemeMode={onThemeMode}
        themeAccentMode={themeAccentMode}
        onThemeAccentMode={onThemeAccentMode}
        oledEnabled={oledEnabled}
        onToggleOled={onToggleOled}
        t={t}
      />
    );
  }
  if (subPage === "advanced") {
    return (
      <AdvancedSubPage
        wakeLockEnabled={wakeLockEnabled}
        onToggleWakeLock={onToggleWakeLock}
        hapticEnabled={hapticEnabled}
        onToggleHaptic={handleToggleHaptic}
        data={data}
        showToast={showToast}
        t={t}
      />
    );
  }
  if (subPage === "prefs") {
    return (
      <PrefsSubPage
        reduceEffects={reduceEffects}
        onToggleReduceEffects={onToggleReduceEffects}
        spotifyEnabled={spotifyEnabled}
        onToggleSpotify={(enabled) => {
          void saveSpotifyPreference(enabled);
          showToast?.(enabled ? t("spotifyEnabledToast") : t("spotifyDisabledToast"));
        }}
        spotifyPosition={spotifyPosition}
        onSpotifyPositionChange={(position) => {
          void saveSpotifyPosition(position);
        }}
        showToast={showToast}
        lang={lang}
        onLangChange={onLangChange}
        playerGroups={playerGroups}
        savePlayerGroups={savePlayerGroups}
        t={t}
        onSubPage={onSubPage}
      />
    );
  }
  if (subPage === "about") {
    return <AboutSubPage user={user} showToast={showToast} t={t} />;
  }

  return (
    <div className="page settings-profile-dashboard">
      <div className="settings-profile-identity about-card">
        <div className="settings-profile-avatar-wrap">
          {user ? <UserAvatar user={user} /> : <div className="user-avatar-placeholder">{(displayName || "?").slice(0, 2).toUpperCase()}</div>}
        </div>
        <div className="settings-profile-identity-copy">
          <div className="settings-profile-name">
            {displayName || <span className="settings-profile-name-empty">{t("noNamePlaceholder")}</span>}
          </div>
          <div className="settings-profile-status">
            <span>{statusPrimary}</span>
            <span>{statusSecondary}</span>
          </div>
        </div>
        <div className="settings-profile-actions">
          <button
            className="btnsec settings-profile-edit-btn"
            onClick={() => {
              setNameVal(displayName);
              setEditingName(true);
            }}
          >
            {t("editName")}
          </button>
          {user?.uid && onViewProfile && (
            <button
              className="btnsec settings-profile-view-btn"
              aria-label={t("viewProfile")}
              onClick={() => onViewProfile(user.uid)}
            >
              {t("viewProfile")}
            </button>
          )}
        </div>
      </div>

      {editingName && (
        <div className="about-card settings-profile-edit-card">
          <div className="about-row" style={{ alignItems: "center" }}>
            <span className="about-label">{t("nameLabel")}</span>
            <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end" }}>
              <input
                className="inp"
                ref={nameInputRef}
                aria-label={t("namePlaceholder")}
                value={nameVal}
                onChange={(event) => setNameVal(event.target.value)}
                placeholder={t("namePlaceholder")}
                style={{ flex: 1, maxWidth: 180 }}
              />
              <button
                className="btnpri account-selected"
                style={compactSaveStyle}
                disabled={savingName || !nameVal.trim()}
                onClick={user ? handleSaveName : handleSaveGuestName}
              >
                {savingName ? "..." : t("save")}
              </button>
              <button
                className="btnsec"
                aria-label={t("cancel")}
                onClick={() => {
                  setEditingName(false);
                  setNameVal(displayName);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="settings-profile-qr-panel about-card" data-testid="settings-profile-qr-panel">
          <div className="settings-profile-qr-title">{t("myQR")}</div>
          <div className="settings-profile-qr-body">
            <UserQRCode uid={user.uid} displayName={user.displayName} t={t} />
          </div>
        </div>
      )}

      <div className="settings-profile-stats" data-testid="settings-profile-stats">
        <ProfileStatCard label={t("totalMatches")} value={totalMatches} />
        <ProfileStatCard label={t("profileWins")} value={quickWins} accent="#52B788" />
        <ProfileStatCard label={t("profileWinrate")} value={`${quickWinrate}%`} accent="#f59e0b" />
        <ProfileStatCard label={t("profileStreak")} value={quickStreak} accent="#e63946" />
      </div>

      {!user && (
        <div style={{ display: "flex", gap: 8, marginBottom: "14px" }}>
          <button
            className="about-action-btn"
            style={{ color: "#4285f4", borderColor: "color-mix(in srgb,#4285f4 40%,transparent)", margin: 0, flex: 1 }}
            onClick={() => onSignIn("google")}
          >
            <img
              className="about-action-icon"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              aria-hidden="true"
            />
            <span>{t("settingsLoginGoogleShort")}</span>
          </button>
          <button
            className="about-action-btn"
            style={{ color: "#006D77", borderColor: "color-mix(in srgb,#006D77 40%,transparent)", margin: 0, flex: 1 }}
            onClick={() => onSignIn("signin")}
          >
            <span aria-hidden="true">✉️</span>
            <span>{t("settingsLoginEmailShort")}</span>
          </button>
        </div>
      )}

      <SettingsRow title={t("settingsPrefs")} desc={t("settingsPrefsDesc")} onClick={() => onSubPage("prefs")} testId="settings-row-prefs" />
      <SettingsRow title={t("settingsAbout")} desc={t("settingsAboutDesc")} onClick={() => onSubPage("about")} />

      {user && (
        <div className="about-card settings-account-actions" data-testid="settings-account-actions">
          <button
            className="settings-account-action"
            onClick={() => setConfirmSignOut(true)}
          >
            <span className="settings-account-action-copy">
              <span className="settings-account-action-title">{t("signOut")}</span>
            </span>
            <span className="settings-account-action-chevron">›</span>
          </button>
          <button
            className="settings-account-action settings-account-action--danger"
            data-testid="settings-delete-account"
            onClick={() => setConfirmDeleteAccount(true)}
          >
            <span className="settings-account-action-copy">
              <span className="settings-account-action-title">{t("deleteAccountBtn")}</span>
            </span>
            <span className="settings-account-action-chevron">›</span>
          </button>
        </div>
      )}
      {confirmSignOut && (
        <ConfirmModal
          title={t("signOutConfirmTitle")}
          msg={t("signOutDataQuestion")}
          confirmLabel={t("signOutKeepData")}
          cancelLabel={t("signOutClearData")}
          onConfirm={() => {
            setConfirmSignOut(false);
            onSignOut(false);
          }}
          onCancel={() => {
            setConfirmSignOut(false);
            setConfirmClearData(true);
          }}
          onOverlayClick={() => setConfirmSignOut(false)}
        />
      )}
      {confirmClearData && (
        <ConfirmModal
          title={t("signOutClearDataTitle")}
          msg={t("signOutClearDataMsg")}
          confirmLabel={t("signOutClearData")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setConfirmClearData(false);
            onSignOut(true);
          }}
          onCancel={() => setConfirmClearData(false)}
        />
      )}
      {confirmDeleteAccount && (
        <ConfirmModal
          title={t("deleteAccountTitle")}
          msg={`${t("deleteAccountMsg")} (${user?.email})`}
          confirmLabel={deletingAccount ? t("deleting") : t("deleteAccountConfirm")}
          cancelLabel={t("cancel")}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDeleteAccount(false)}
        />
      )}
    </div>
  );
}

export default SettingsPage;
