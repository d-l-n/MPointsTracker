import { useState, type ReactNode } from "react";

import type { TranslationFn } from "../../types";
import { readDiscardGoesHome } from "../../lib/discardPreference";
import ConfirmModal from "./ConfirmModal";

interface DiscardMatchButtonProps {
  t: TranslationFn;
  /** Resets the game back to its setup screen (progress discarded). */
  onDiscard: () => void;
  /** Called after discarding when the "volver al inicio" preference is ON. */
  onBack?: () => void;
  /** Optional message shown inside the confirmation modal. */
  msg?: ReactNode;
  testId?: string;
}

/**
 * "Abandonar partida" button with confirmation, shared by every game.
 * By default discarding only resets to setup; with the global preference
 * enabled (bgt_discard_goes_home) it also navigates back home via onBack.
 */
export default function DiscardMatchButton({
  t,
  onDiscard,
  onBack,
  msg,
  testId = "discard-match-btn",
}: DiscardMatchButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button
        className="btnsec nav-leave-discard"
        style={{ width: "100%", marginTop: 8, textAlign: "center" }}
        data-testid={testId}
        onClick={() => setShowConfirm(true)}
      >
        {t("abandonMatchBtn")}
      </button>
      {showConfirm && (
        <ConfirmModal
          title={t("abandonMatch")}
          msg={msg ?? t("discardMatchMsg")}
          confirmLabel={t("abandon")}
          confirmTone="danger"
          cancelLabel={t("cancel")}
          confirmTestId="discard-match-confirm"
          onConfirm={() => {
            setShowConfirm(false);
            onDiscard();
            if (readDiscardGoesHome()) onBack?.();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
