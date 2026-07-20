import { type ThemeMode, type ThemeAccentMode, type TranslationFn } from "../../types";
import { SectionLabel, SettingsToggleRow } from "./shared";
import { Sun, ColorSwatch, Moon } from "reicon-react";

export interface ThemeSectionProps {
  dark: boolean;
  themeMode: ThemeMode;
  onThemeMode: (mode: ThemeMode) => void;
  themeAccentMode: ThemeAccentMode;
  onThemeAccentMode: (mode: ThemeAccentMode) => void;
  oledEnabled: boolean;
  onToggleOled: (value: boolean) => void;
  t: TranslationFn;
}

export default function ThemeSection({
  dark,
  themeMode,
  onThemeMode,
  themeAccentMode,
  onThemeAccentMode,
  oledEnabled,
  onToggleOled,
  t,
}: ThemeSectionProps) {
  const modes: { id: ThemeMode; label: string }[] = [
    { id: "light", label: t("themeLight") },
    { id: "dark", label: t("themeDark") },
    { id: "system", label: t("themeSystem") },
  ];

  return (
    <>
      <SectionLabel label={t("themeModeLabel")} icon={<Sun size={14} />} />
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

      <SectionLabel label={t("themeAccentLabel") || "Accent"} icon={<ColorSwatch size={14} />} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title="Monet"
          desc={t("monetThemeDesc") || "Uses Material You colors when available on Android and a local fallback elsewhere."}
          enabled={themeAccentMode === "monet"}
          onToggle={(value) => onThemeAccentMode(value ? "monet" : "default")}
          switchTestId="monet-toggle"
        />
      </div>

      <SectionLabel label={t("oledMode") || "OLED Mode"} icon={<Moon size={14} />} />
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
    </>
  );
}
