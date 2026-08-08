import { type ThemeMode, type ThemeAccentMode, type TranslationFn } from "../../types";
import { SectionLabel, SettingsToggleRow } from "./shared";
import { Sun, ColorSwatch, Moon } from "reicon-react";

/**
 * Preset swatches offered in the "Theme accent" picker. The first entry matches
 * the default teal accent; the rest cover a broad, legible hue range.
 */
export const THEME_ACCENT_SWATCHES = [
  "#006d77", // teal (default accent)
  "#E63946", // red
  "#E91E8C", // pink
  "#7B2FBE", // purple
  "#2980B9", // blue
  "#2E7D32", // green
  "#1ABC9C", // mint
  "#D4A017", // gold
  "#E67E22", // orange
  "#8B5E3C", // brown
] as const;

export interface ThemeSectionProps {
  dark: boolean;
  themeMode: ThemeMode;
  onThemeMode: (mode: ThemeMode) => void;
  themeAccentMode: ThemeAccentMode;
  onThemeAccentMode: (mode: ThemeAccentMode) => void;
  themeCustomAccent: string;
  onThemeCustomAccent: (hex: string) => void;
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
  themeCustomAccent,
  onThemeCustomAccent,
  oledEnabled,
  onToggleOled,
  t,
}: ThemeSectionProps) {
  const modes: { id: ThemeMode; label: string }[] = [
    { id: "light", label: t("themeLight") },
    { id: "dark", label: t("themeDark") },
    { id: "system", label: t("themeSystem") },
  ];

  const accentModes: { id: ThemeAccentMode; label: string }[] = [
    { id: "default", label: t("themeAccentDefault") },
    { id: "monet", label: t("themeAccentMonet") },
    { id: "custom", label: t("themeAccentCustom") },
  ];

  const pickSwatch = (hex: string) => {
    onThemeCustomAccent(hex);
    if (themeAccentMode !== "custom") onThemeAccentMode("custom");
  };

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
        <div style={{ padding: "14px 0 12px" }}>
          <div style={{ display: "flex", gap: 8 }} role="radiogroup" aria-label={t("themeAccentLabel")}>
            {accentModes.map((mode) => (
              <button
                key={mode.id}
                role="radio"
                aria-checked={themeAccentMode === mode.id}
                data-testid={`accent-mode-${mode.id}`}
                className={"theme-mode-btn" + (themeAccentMode === mode.id ? " active" : "")}
                onClick={() => onThemeAccentMode(mode.id)}
              >
                <span style={{ fontSize: ".68rem", lineHeight: 1.2, textAlign: "center" }}>
                  {mode.label}
                </span>
              </button>
            ))}
          </div>

          {themeAccentMode === "custom" && (
            <div
              className="accent-swatches"
              data-testid="accent-swatch-row"
              role="group"
              aria-label={t("themeAccentPresets")}
            >
              {THEME_ACCENT_SWATCHES.map((hex) => {
                const active = themeCustomAccent.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    className={"accent-swatch" + (active ? " accent-swatch--active" : "")}
                    data-testid={`accent-swatch-${hex.slice(1)}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => pickSwatch(hex)}
                    aria-label={`${t("themeAccentCustom")} ${hex}`}
                    aria-pressed={active}
                    title={hex}
                  >
                    {active && (
                      <span
                        className="accent-swatch-check"
                        aria-hidden="true"
                        style={{ color: hex.toLowerCase() === "#006d77" || hex.toLowerCase() === "#7B2FBE" || hex.toLowerCase() === "#2980B9" || hex.toLowerCase() === "#2E7D32" || hex.toLowerCase() === "#E91E8C" || hex.toLowerCase() === "#8B5E3C" || hex.toLowerCase() === "#E63946" ? "#fff" : "#0a0a0a" }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="accent-custom-row" data-testid="accent-custom-row">
            <label className="accent-custom-label" htmlFor="theme-custom-accent-input">
              {t("themeAccentCustomPick")}
            </label>
            <input
              id="theme-custom-accent-input"
              type="color"
              className="accent-color-input"
              data-testid="custom-accent-input"
              value={themeCustomAccent}
              onChange={(event) => {
                onThemeCustomAccent(event.target.value);
                if (themeAccentMode !== "custom") onThemeAccentMode("custom");
              }}
              aria-label={t("themeAccentCustomPick")}
            />
          </div>

          {themeAccentMode !== "custom" && (
            <div style={{ fontSize: ".7rem", color: "var(--tx3)", marginTop: 10, textAlign: "center" }}>
              {themeAccentMode === "monet" ? t("monetThemeDesc") : t("themeAccentDefaultDesc")}
            </div>
          )}
        </div>
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
