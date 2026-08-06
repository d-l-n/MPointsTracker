import React, { useEffect, useState, type CSSProperties } from "react";

import type { TranslationFn } from "../../types";

type FinishChoice = "no_winner" | "manual";

interface EarlyFinishModalProps {
  players?: string[];
  onCancel: () => void;
  onConfirm: (winnerOverride: string | null) => void;
  t?: TranslationFn;
}

function toTestId(value = "") {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "player"
  );
}

const disabledConfirmStyle: CSSProperties = {
  opacity: 0.55,
  cursor: "not-allowed",
};

export default function EarlyFinishModal({
  players = [],
  onCancel,
  onConfirm,
  t = ((key: string) => key) as TranslationFn,
}: EarlyFinishModalProps) {
  const [choice, setChoice] = useState<FinishChoice | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const confirmDisabled = choice === null || (choice === "manual" && !selectedWinner);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <button type="button" className="modal-overlay" onClick={onCancel} data-testid="early-finish-modal" aria-label={t("cancel")} style={{ position: "absolute", inset: 0, border: 0, padding: 0 }} />
      <div
        className="modal-box modal-box--strong early-finish-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-finish-title"
        autoFocus
      >
        <div id="early-finish-title" className="modal-title">{t("finishMatchEarlyTitle")}</div>
        <div className="modal-msg">{t("finishMatchEarlyMsg")}</div>

        <div className="rgap" style={{ marginTop: 10 }}>
          <button
            type="button"
            className={`btnsec early-finish-option${choice === "no_winner" ? " is-selected" : ""}`}
            data-testid="early-finish-no-winner"
            onClick={() => {
              setChoice("no_winner");
              setSelectedWinner(null);
            }}
          >
            {t("finishMatchNoWinner")}
          </button>

          <button
            type="button"
            className={`btnsec early-finish-option${choice === "manual" ? " is-selected" : ""}`}
            data-testid="early-finish-choose-winner"
            onClick={() => setChoice("manual")}
          >
            {t("finishMatchChooseWinner")}
          </button>
        </div>

        {choice === "manual" && (
          <div style={{ marginTop: 14 }}>
            <div className="flbl" style={{ marginBottom: 8 }}>
              {t("finishMatchSelectWinner")}
            </div>
            <div className="rgap">
              {players.map((playerName) => (
                <button
                  type="button"
                  key={playerName}
                  className={`btnsec early-finish-option${selectedWinner === playerName ? " is-selected" : ""}`}
                  data-testid={`early-finish-player-${toTestId(playerName)}`}
                  onClick={() => setSelectedWinner(playerName)}
                >
                  {playerName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 18 }}>
          <button className="modal-cancel" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="modal-confirm"
            data-testid="early-finish-confirm"
            disabled={confirmDisabled}
            onClick={() => onConfirm(choice === "manual" ? selectedWinner : null)}
            style={confirmDisabled ? disabledConfirmStyle : undefined}
          >
            {t("finishMatchConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
