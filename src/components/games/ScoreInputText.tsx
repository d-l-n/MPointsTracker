import type { TranslationFn } from "../../types";
import type { RoundInputValue } from "../../hooks/useAccumulatingScoreMatch";
import type { RenderInputOptions } from "./AccumulatingScoreUI";
import { haptic } from "../../lib/storage";

interface ScoreInputTextProps extends Pick<RenderInputOptions, "labels" | "roundInputs" | "setRoundInputs" | "rounds" | "undo" | "commit"> {
  t: TranslationFn;
  i18nPrefix?: string;
  /** id prefix for inputs (e.g. "burako" → id="burako-round-score-0") */
  idPrefix: string;
}

export default function ScoreInputText({
  labels,
  roundInputs,
  setRoundInputs,
  rounds,
  undo,
  commit,
  t,
  i18nPrefix = "round",
  idPrefix,
}: ScoreInputTextProps) {
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
      <div className="rgap" style={{ marginBottom: 11 }}>
        {labels.map((label, index) => (
          <div className="rdrow" key={`rd-${label}`}>
            <span className="rdname">{label}</span>
            <div className="rdfields">
              <div className="rdfrow">
                <input
                  id={`${idPrefix}-round-score-${index}`}
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
