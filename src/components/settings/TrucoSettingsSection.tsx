import { useState } from "react";
import type { TranslationFn } from "../../types";
import { getTrucoSettings, saveTrucoSettings, type TrucoBoardTheme, type TrucoTallyStyle } from "../../lib/trucoSettings";
import { SectionLabel, SettingsToggleRow } from "./shared";
import { Sliders, Sparkles } from "reicon-react";

interface TrucoSettingsSectionProps {
  t: TranslationFn;
  onSettingsChange?: () => void;
}

export default function TrucoSettingsSection({ t, onSettingsChange }: TrucoSettingsSectionProps) {
  const [settings, setSettings] = useState(() => getTrucoSettings());

  const updateSetting = <K extends keyof ReturnType<typeof getTrucoSettings>>(
    key: K,
    val: ReturnType<typeof getTrucoSettings>[K],
  ) => {
    const updated = saveTrucoSettings({ [key]: val });
    setSettings(updated);
    onSettingsChange?.();
  };

  const pillStyle = (active: boolean) => ({
    flex: 1,
    padding: "8px 12px",
    borderRadius: "var(--rxs, 8px)",
    border: `1.5px solid ${active ? "var(--gc)" : "var(--bo2)"}`,
    background: active ? "color-mix(in srgb, var(--gc) 12%, transparent)" : "var(--ibg)",
    color: active ? "var(--gc)" : "var(--tx2)",
    fontWeight: 600,
    fontSize: ".82rem",
    cursor: "pointer",
    textAlign: "center" as const,
    transition: "all 0.15s ease",
  });

  return (
    <div className="page" data-testid="truco-settings-section">
      <SectionLabel label={t("trucoSettingsTitle")} icon={<Sliders size={14} />} />

      {/* Tally Style */}
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--tx1)", marginBottom: 4 }}>
          {t("trucoStyle")}
        </div>
        <div style={{ fontSize: ".78rem", color: "var(--tx2)", marginBottom: 12 }}>
          {t("trucoStyleDesc")}
        </div>
        <div className="pillrow" style={{ display: "flex", gap: 8 }}>
          {(
            [
              ["fosforitos", `🪵 ${t("trucoStyleFosforitos")}`],
              ["palitos", `✏️ ${t("trucoStylePalitos")}`],
              ["numerico", `🔢 ${t("trucoStyleNumerico")}`],
            ] as [TrucoTallyStyle, string][]
          ).map(([styleKey, label]) => (
            <button
              key={styleKey}
              type="button"
              style={pillStyle(settings.style === styleKey)}
              onClick={() => updateSetting("style", styleKey)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Board Theme */}
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--tx1)", marginBottom: 4 }}>
          {t("trucoTheme")}
        </div>
        <div style={{ fontSize: ".78rem", color: "var(--tx2)", marginBottom: 12 }}>
          {t("trucoThemeDesc")}
        </div>
        <div className="pillrow" style={{ display: "flex", gap: 8 }}>
          {(
            [
              ["classic", `📋 ${t("trucoThemeClassic")}`],
              ["wood", `🪵 ${t("trucoThemeWood")}`],
              ["minimal", `✨ ${t("trucoThemeMinimal")}`],
            ] as [TrucoBoardTheme, string][]
          ).map(([themeKey, label]) => (
            <button
              key={themeKey}
              type="button"
              style={pillStyle(settings.theme === themeKey)}
              onClick={() => updateSetting("theme", themeKey)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Presets Toggle */}
      <SectionLabel label={t("settingsPrefs")} icon={<Sparkles size={14} />} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title={t("trucoPresetsRow")}
          desc={t("trucoPresetsDesc")}
          enabled={settings.presets}
          onToggle={(val) => updateSetting("presets", val)}
          testId="truco-presets-toggle"
        />
      </div>
    </div>
  );
}
