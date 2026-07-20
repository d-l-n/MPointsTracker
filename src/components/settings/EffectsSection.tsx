import { type TranslationFn } from "../../types";
import Dropdown from "../ui/Dropdown";
import { SectionLabel, SettingsToggleRow } from "./shared";
import { Accessibility, Music } from "reicon-react";

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
      <SectionLabel label={t("accessibilitySection")} icon={<Accessibility size={14} />} />
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

      <SectionLabel label={t("spotifySection")} icon={<Music size={14} />} />
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
            <Dropdown
              value={spotifyPosition}
              onChange={(v) => onSpotifyPositionChange(v as "center" | "left" | "right" | "draggable")}
              options={[
                { value: "center", label: t("spotifyPosCenter") },
                { value: "left", label: t("spotifyPosLeft") },
                { value: "right", label: t("spotifyPosRight") },
                { value: "draggable", label: t("spotifyPosDraggable") },
              ]}
              testId="spotify-position-select"
            />
          </div>
        )}
      </div>
    </>
  );
}
