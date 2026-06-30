import type { CSSProperties } from "react";
import type { PlayerGroupMember, TranslationFn } from "../../types";
import PillSwitch from "../ui/PillSwitch";

export const LANGUAGE_OPTIONS = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "fr", label: "Français" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];
export type SettingsSubPage = "apptheme" | "advanced" | "prefs" | "about";

export interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  delete?: () => Promise<unknown> | unknown;
  [key: string]: unknown;
}

export interface LinkedProfile {
  uid?: string | null;
}

export interface GroupDraftPlayer {
  name: string;
  uid: string | null;
}

export interface LinkModalState {
  groupIdx: number | null;
  playerIdx: number;
  name: string;
}

export interface SectionLabelProps {
  label: string;
}

export interface SettingsRowProps {
  title: string;
  desc?: string | null;
  onClick?: () => void;
  testId?: string;
}

export interface SettingsToggleRowProps {
  title: string;
  desc?: string | null;
  note?: string | null;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  testId?: string;
  switchTestId?: string;
}

export interface ProfileStatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

export const primaryActionStyle: CSSProperties & Record<"--gc", string> = {
  "--gc": "#006D77",
  fontFamily: "'Google Sans',sans-serif",
  fontSize: ".84rem",
  fontWeight: 700,
  letterSpacing: "1px",
  padding: "12px 14px",
};

export const compactSaveStyle: CSSProperties & Record<"--gc", string> = {
  "--gc": "#006D77",
  padding: "8px 14px",
  fontSize: ".8rem",
  width: "auto",
  letterSpacing: "1px",
};

export function getMemberName(player: PlayerGroupMember | GroupDraftPlayer): string {
  return typeof player === "string" ? player : player.name;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <span className="flbl" style={{ display: "block", marginBottom: "10px", fontSize: ".65rem", letterSpacing: 2 }}>
      {label.toUpperCase()}
    </span>
  );
}

export function SettingsRow({ title, desc, onClick, testId }: SettingsRowProps) {
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

export function SettingsToggleRow({ title, desc, note, enabled, onToggle, testId, switchTestId }: SettingsToggleRowProps) {
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

export function ProfileStatCard({ label, value, accent }: ProfileStatCardProps) {
  return (
    <div className="settings-profile-stat" style={{ "--profile-stat-accent": accent || "var(--gc,#006D77)" } as CSSProperties & Record<"--profile-stat-accent", string>}>
      <span className="settings-profile-stat-value">{value}</span>
      <span className="settings-profile-stat-label">{label}</span>
    </div>
  );
}
