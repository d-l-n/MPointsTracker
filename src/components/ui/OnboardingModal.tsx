import { useEffect } from "react";
import type { TranslationFn } from "../../types";

interface OnboardingModalProps {
  t: TranslationFn;
  onDone: () => void;
}

function OnboardingModal({ t, onDone }: OnboardingModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDone]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="modal-overlay" inert onClick={onDone} aria-hidden="true" style={{ position: "absolute", inset: 0 }} />
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onClick={(e) => e.stopPropagation()}
        autoFocus
      >
        <div id="onboarding-title" className="modal-title">{t("onboardingTitle")}</div>
        <div className="modal-msg">{t("onboardingMsg")}</div>
        <div className="modal-actions">
          <button className="modal-confirm" onClick={onDone}>{t("onboardingCta")}</button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
