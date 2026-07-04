import type { TranslationFn } from "../../types";
import type { RoundInputValue } from "../../hooks/useAccumulatingScoreMatch";
import type { RenderInputOptions } from "./AccumulatingScoreUI";
import { haptic } from "../../lib/storage";

interface ScoreInputQuickButtonsProps extends Pick<RenderInputOptions, "labels" | "roundInputs" | "setRoundInputs" | "rounds" | "undo" | "commit"> {
  t: TranslationFn;
  i18nPrefix?: string;
  idPrefix: string;
  quickValues?: number[];
}

export default function ScoreInputQuickButtons({
  labels,
  roundInputs,
  setRoundInputs,
  rounds,
  undo,
  commit,
  t,
  i18nPrefix = "round",
  idPrefix,
  quickValues = [100, 300, 500, -100, -300],
}: ScoreInputQuickButtonsProps) {
  return (
    <div className="sec">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
        <span className="flbl" style={{ marginBottom: 0 }}>
          {t(`${i18nPrefix}Label`)} {rounds + 1} — {t("score")}
        </span>
        {rounds > 0 && (
          <button className="btnsec" onClick={undo}>
            {t("undo")}
          </button>
        )}
      </div>

      {/* Quick-score buttons */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {quickValues.map((value) => (
          <button
            key={value}
            onClick={() => {
              const targetIndex = roundInputs.findIndex(
                (v) => !v || Number(v) === 0,
              );
              const resolvedTarget = targetIndex === -1 ? 0 : targetIndex;
              setRoundInputs(
                (prev) =>
                  prev.map((v, i) =>
                    i === resolvedTarget
                      ? String((Number(v) || 0) + value)
                      : v,
                  ) as [RoundInputValue, RoundInputValue],
              );
            }}
            style={{
              fontSize: ".72rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "var(--rxs)",
              cursor: "pointer",
              border: `1px solid ${value > 0 ? "color-mix(in srgb,#52b788 40%,transparent)" : "color-mix(in srgb,#E63946 35%,transparent)"}`,
              background:
                value > 0
                  ? "color-mix(in srgb,#52b788 10%,transparent)"
                  : "color-mix(in srgb,#E63946 10%,transparent)",
              color: value > 0 ? "#52b788" : "#E63946",
            }}
          >
            {value > 0 ? "+" : ""}
            {value}
          </button>
        ))}
      </div>

      {/* Text inputs per label */}
      <div className="rgap" style={{ marginBottom: 11 }}>
        {labels.map((label, index) => (
          <div className="rdrow" key={`rd-${label}`}>
            <span className="rdname">{label}</span>
            <div className="rdfields">
              <div className="rdfrow">
                <input
                  id={`${idPrefix}-round-score-${index}`}
                  name={`${idPrefix}-round-score-${index}`}
                  className="rdinp"
                  type="number"
                  placeholder="0"
                  value={roundInputs[index] || ""}
                  onChange={(event) =>
                    setRoundInputs(
                      (prev) =>
                        prev.map((v, i) =>
                          i === index ? event.target.value : v,
                        ) as [RoundInputValue, RoundInputValue],
                    )
                  }
                  aria-label={`${t(`${i18nPrefix}Label`)} ${label}`}
                />
                <span className="rdlbl">{t("ptsCanBeNegative")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btnpri"
        onClick={() => {
          haptic("medium");
          commit();
        }}
      >
        {t(`confirm${i18nPrefix.charAt(0).toUpperCase()}${i18nPrefix.slice(1)}`)}
      </button>
    </div>
  );
}
