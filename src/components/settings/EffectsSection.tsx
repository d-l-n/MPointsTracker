import { type TranslationFn } from "../../types";
import { SectionLabel, SettingsToggleRow } from "./shared";

export interface EffectsSectionProps {
  reduceEffects: boolean;
  onToggleReduceEffects: (value: boolean) => void;
  spotifyEnabled: boolean;
  onToggleSpotify: (value: boolean) => void;
  spotifyPosition: "center" | "left" | "right" | "draggable";
  onSpotifyPositionChange: (value: "center" | "left" | "right" | "draggable") => void;
  t: TranslationFn;
}

export default function EffectsSection({
  reduceEffects,
  onToggleReduceEffects,
  spotifyEnabled,
  onToggleSpotify,
  spotifyPosition,
  onSpotifyPositionChange,
  t,
}: EffectsSectionProps) {
  return (
    <>
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
    </>
  );
}
