import { memo } from "react";
import type { TranslationFn } from "../../types";
import { haptic } from "../../lib/storage";
import type { TrucoSettings, TrucoTallyStyle } from "../../lib/trucoSettings";
import "./TrucoScoreBoard.css";

interface TrucoMatchBoxProps {
  count: number; // 0 to 5
  boxIndex: number;
  tallyStyle: TrucoTallyStyle;
}

/**
 * Renders a single 5-point tally box.
 * - "fosforitos": SVG matchsticks with wooden gradient + red head.
 * - "palitos": Simple chalk-style lines.
 * - "numerico": Numeric display inside the box.
 */
export const TrucoMatchBox = memo(function TrucoMatchBox({ count, boxIndex, tallyStyle }: TrucoMatchBoxProps) {
  const isFilled = count === 5;

  if (tallyStyle === "numerico") {
    return (
      <div
        className={`truco-match-box${isFilled ? " filled-box" : ""}`}
        data-testid={`match-box-${boxIndex}-${count}`}
        aria-label={`${count} puntos`}
      >
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1.6rem",
          color: isFilled ? "var(--gc)" : "var(--tx1)",
          opacity: count === 0 ? 0.25 : 1,
        }}>
          {count}
        </span>
      </div>
    );
  }

  const isPalitos = tallyStyle === "palitos";

  return (
    <div
      className={`truco-match-box${isFilled ? " filled-box" : ""}`}
      data-testid={`match-box-${boxIndex}-${count}`}
      aria-label={`${count} ${tallyStyle === "fosforitos" ? "fosforitos" : "palitos"}`}
    >
      <svg viewBox="0 0 60 60" aria-hidden="true">
        {!isPalitos && (
          <defs>
            <linearGradient id={`stickWood-${boxIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <radialGradient id={`matchHead-${boxIndex}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
          </defs>
        )}

        {/* Matchstick or chalk line styles */}
        {count >= 1 && (
          <g className="truco-stick">
            <line x1="12" y1="12" x2="48" y2="12"
              stroke={isPalitos ? "var(--tx1)" : `url(#stickWood-${boxIndex})`}
              strokeWidth={isPalitos ? "3" : "4"} strokeLinecap="round" />
            {!isPalitos && <circle cx="12" cy="12" r="4.5" fill={`url(#matchHead-${boxIndex})`} />}
          </g>
        )}
        {count >= 2 && (
          <g className="truco-stick">
            <line x1="48" y1="12" x2="48" y2="48"
              stroke={isPalitos ? "var(--tx1)" : `url(#stickWood-${boxIndex})`}
              strokeWidth={isPalitos ? "3" : "4"} strokeLinecap="round" />
            {!isPalitos && <circle cx="48" cy="12" r="4.5" fill={`url(#matchHead-${boxIndex})`} />}
          </g>
        )}
        {count >= 3 && (
          <g className="truco-stick">
            <line x1="48" y1="48" x2="12" y2="48"
              stroke={isPalitos ? "var(--tx1)" : `url(#stickWood-${boxIndex})`}
              strokeWidth={isPalitos ? "3" : "4"} strokeLinecap="round" />
            {!isPalitos && <circle cx="48" cy="48" r="4.5" fill={`url(#matchHead-${boxIndex})`} />}
          </g>
        )}
        {count >= 4 && (
          <g className="truco-stick">
            <line x1="12" y1="48" x2="12" y2="12"
              stroke={isPalitos ? "var(--tx1)" : `url(#stickWood-${boxIndex})`}
              strokeWidth={isPalitos ? "3" : "4"} strokeLinecap="round" />
            {!isPalitos && <circle cx="12" cy="48" r="4.5" fill={`url(#matchHead-${boxIndex})`} />}
          </g>
        )}
        {count >= 5 && (
          <g className="truco-stick">
            <line x1="12" y1="12" x2="48" y2="48"
              stroke={isPalitos ? "var(--tx1)" : `url(#stickWood-${boxIndex})`}
              strokeWidth={isPalitos ? "3" : "4"} strokeLinecap="round" />
            {!isPalitos && <circle cx="12" cy="12" r="4.5" fill={`url(#matchHead-${boxIndex})`} />}
          </g>
        )}
      </svg>
    </div>
  );
});

interface TrucoScoreBoardProps {
  labels: string[];
  scores: [number, number];
  limit: number;
  adds: [number, number];
  setAdds: React.Dispatch<React.SetStateAction<[number, number]>>;
  commit: () => void;
  undo: () => void;
  rounds: number;
  over: boolean;
  t: TranslationFn;
  settings: TrucoSettings;
  onOpenSettings?: () => void;
}

/**
 * Traditional Argentine Truco Scoreboard component (Anotador de Truco)
 */
function TrucoScoreBoard({
  labels,
  scores,
  limit,
  adds,
  setAdds,
  commit,
  undo,
  rounds,
  over,
  t,
  settings,
  onOpenSettings,
}: TrucoScoreBoardProps) {
  const team1Score = scores[0] || 0;
  const team2Score = scores[1] || 0;

  const malasLimit = Math.min(15, limit);
  const is30Points = limit > 15;

  const team1Malas = Math.min(team1Score, malasLimit);
  const team2Malas = Math.min(team2Score, malasLimit);

  const team1Buenas = is30Points ? Math.max(0, team1Score - 15) : 0;
  const team2Buenas = is30Points ? Math.max(0, team2Score - 15) : 0;

  const renderBoxes = (score: number, baseIndex: number) => {
    const boxes = [];
    for (let i = 0; i < 3; i++) {
      const boxScore = Math.max(0, Math.min(5, score - i * 5));
      boxes.push(
        <TrucoMatchBox
          key={`box-${baseIndex + i}`}
          count={boxScore}
          boxIndex={baseIndex + i}
          tallyStyle={settings.style}
        />,
      );
    }
    return boxes;
  };

  const handleAddPreset = (teamIdx: 0 | 1, val: number) => {
    haptic("light");
    setAdds((prev) => {
      const next = [...prev] as [number, number];
      next[teamIdx] = Math.max(0, next[teamIdx] + val);
      return next;
    });
  };

  const handleClearAdds = (teamIdx: 0 | 1) => {
    haptic("light");
    setAdds((prev) => {
      const next = [...prev] as [number, number];
      next[teamIdx] = 0;
      return next;
    });
  };

  return (
    <div
      className="truco-board-container"
      data-testid="truco-scoreboard"
      data-truco-theme={settings.theme}
    >
      {/* Slate Card */}
      <div className="truco-slate">
        {/* Header with settings shortcut */}
        <div className="truco-slate-header">
          <div className="truco-team-col-header" data-testid="team-0-header">
            <div className="truco-team-name">{labels[0] || t("teamUs")}</div>
            <div className="truco-team-total">{team1Score}</div>
            <span className="truco-team-phase">
              {team1Score >= 15 && is30Points ? t("trucoBuenas") : t("trucoMalas")}
            </span>
          </div>

          <div className="truco-team-col-header" data-testid="team-1-header">
            <div className="truco-team-name">{labels[1] || t("teamThem")}</div>
            <div className="truco-team-total">{team2Score}</div>
            <span className="truco-team-phase">
              {team2Score >= 15 && is30Points ? t("trucoBuenas") : t("trucoMalas")}
            </span>
          </div>
        </div>

        {/* ⚙️ Settings shortcut button */}
        {onOpenSettings && (
          <button
            type="button"
            className="truco-settings-shortcut"
            onClick={onOpenSettings}
            aria-label={t("customizeTruco")}
            data-testid="truco-settings-shortcut"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--bo2)",
              background: "color-mix(in srgb, var(--tx1) 6%, transparent)",
              color: "var(--tx2)",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
              zIndex: 5,
            }}
          >
            ⚙️
          </button>
        )}

        {/* Section 1: A LAS MALAS (0..15) */}
        <div className="truco-section truco-section-active">
          <div className="truco-section-title">{t("trucoMalas")}</div>
          <div className="truco-tally-row">
            <div className="truco-boxes-col">{renderBoxes(team1Malas, 0)}</div>
            <div className="truco-boxes-col">{renderBoxes(team2Malas, 3)}</div>
          </div>
        </div>

        {/* Section 2: A LAS BUENAS (16..30) */}
        {is30Points && (
          <div className={`truco-section${team1Score >= 15 || team2Score >= 15 ? " truco-section-active" : ""}`}>
            <div className="truco-section-title">{t("trucoBuenas")}</div>
            <div className="truco-tally-row">
              <div className="truco-boxes-col">{renderBoxes(team1Buenas, 6)}</div>
              <div className="truco-boxes-col">{renderBoxes(team2Buenas, 9)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Controls (Botonera de Truco) */}
      {!over && (
        <div className="truco-controls">
          <div className="truco-team-action-row">
            {[0, 1].map((teamIdx) => {
              const idx = teamIdx as 0 | 1;
              return (
                <div key={`ctrl-team-${idx}`} className="truco-team-control-card">
                  <div className="truco-team-control-title">{labels[idx]}</div>

                  <div className="truco-stepper-row">
                    <button
                      type="button"
                      className="truco-btn-step"
                      onClick={() => handleAddPreset(idx, -1)}
                      aria-label={`Restar 1 a ${labels[idx]}`}
                    >
                      -
                    </button>
                    <span className="truco-current-add">+{adds[idx]}</span>
                    <button
                      type="button"
                      className="truco-btn-step"
                      onClick={() => handleAddPreset(idx, 1)}
                      aria-label={`Sumar 1 a ${labels[idx]}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Preset buttons — only if settings.presets is true */}
                  {settings.presets && (
                    <div className="truco-preset-grid">
                      <button type="button" className="truco-preset-btn" onClick={() => handleAddPreset(idx, 1)}>+1</button>
                      <button type="button" className="truco-preset-btn" onClick={() => handleAddPreset(idx, 2)}>+2</button>
                      <button type="button" className="truco-preset-btn" onClick={() => handleAddPreset(idx, 3)}>+3</button>
                      <button type="button" className="truco-preset-btn" onClick={() => handleAddPreset(idx, 4)}>+4</button>
                    </div>
                  )}

                  {adds[idx] > 0 && (
                    <button
                      type="button"
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 4px",
                        border: "none",
                        background: "transparent",
                        color: "var(--tx2)",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => handleClearAdds(idx)}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="truco-action-bar">
            <button
              type="button"
              className="btnpri"
              style={{ flex: 2 }}
              disabled={adds[0] === 0 && adds[1] === 0}
              onClick={() => {
                haptic("medium");
                commit();
              }}
            >
              {t("confirmHand")}
            </button>
            {rounds > 0 && (
              <button
                type="button"
                className="btnsec"
                style={{ flex: 1 }}
                onClick={() => {
                  haptic("light");
                  undo();
                }}
              >
                {t("undo")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TrucoScoreBoard);
