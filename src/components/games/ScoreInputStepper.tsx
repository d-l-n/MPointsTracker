import type { TranslationFn } from "../../types";
import type { RenderInputOptions } from "./AccumulatingScoreUI";
import { haptic } from "../../lib/storage";

interface ScoreInputStepperProps extends Pick<RenderInputOptions, "labels" | "adds" | "setAdds" | "rounds" | "undo" | "commit"> {
  t: TranslationFn;
  i18nPrefix?: string;
}

export default function ScoreInputStepper({
  labels,
  adds,
  setAdds,
  rounds,
  undo,
  commit,
  t,
  i18nPrefix = "hand",
}: ScoreInputStepperProps) {
  return (
    <div className="sec-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
        <span className="flbl" style={{ marginBottom: 0 }}>
          {t(i18nPrefix)} {rounds + 1}
        </span>
        {rounds > 0 && (
          <button className="btnsec" onClick={undo}>
            {t("undo")}
          </button>
        )}
      </div>
      <div className="rgap" style={{ marginBottom: "11px" }}>
        {labels.map((label, index) => (
          <div className="rdrow" key={`rd-${label}`}>
            <span className="rdname">{label}</span>
            <div className="stepper">
              <button
                className="stepbtn"
                onClick={() =>
                  setAdds(
                    (prev) =>
                      prev.map((v, i) =>
                        i === index ? Math.max(0, v - 1) : v,
                      ) as [number, number],
                  )
                }
                data-testid={`team-minus-${index}`}
                aria-label={`${t("subtract")} ${label}`}
              >
                −
              </button>
              <span className="stepval" data-testid={`team-adds-${index}`}>
                {adds[index]}
              </span>
              <button
                className="stepbtn"
                onClick={() =>
                  setAdds(
                    (prev) =>
                      prev.map((v, i) => (i === index ? v + 1 : v)) as [number, number],
                  )
                }
                data-testid={`team-plus-${index}`}
                aria-label={`${t("add")} ${label}`}
              >
                +
              </button>
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
        data-testid="confirm-hand"
      >
        {t(`confirm${i18nPrefix.charAt(0).toUpperCase()}${i18nPrefix.slice(1)}`)}
      </button>
    </div>
  );
}
