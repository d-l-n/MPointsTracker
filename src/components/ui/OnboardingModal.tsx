import { useEffect, useState } from "react";
import type { TranslationFn } from "../../types";

interface OnboardingModalProps {
  t: TranslationFn;
  onDone: () => void;
}

// Lightweight first-run wizard. No heavy imports — onboarding must stay cheap.
// Each step exposes a title key and a body key. The t() helper has no
// interpolation, so the step indicator is rendered as a plain "1 / 3" number.
const STEPS = [
  { titleKey: "onboardingStep1Title", bodyKey: "onboardingStep1Body", icon: "🎯" },
  { titleKey: "onboardingStep2Title", bodyKey: "onboardingStep2Body", icon: "📊" },
  { titleKey: "onboardingStep3Title", bodyKey: "onboardingStep3Body", icon: "🔗" },
] as const;

function OnboardingModal({ t, onDone }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDone]);

  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;

  const next = () => {
    if (isLast) {
      onDone();
    } else {
      setStep((s) => Math.min(s + 1, total - 1));
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

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
        <div className="onboarding-header">
          <span className="onboarding-indicator">{step + 1} / {total}</span>
          <button type="button" className="onboarding-skip" onClick={onDone}>{t("onboardingSkip")}</button>
        </div>

        <div className="onboarding-dots" role="presentation">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? " is-active" : ""}`} />
          ))}
        </div>

        <div className="onboarding-icon" aria-hidden="true">{current.icon}</div>
        <div id="onboarding-title" className="modal-title">{t(current.titleKey)}</div>
        <div className="modal-msg">{t(current.bodyKey)}</div>

        <div className="onboarding-nav modal-actions">
          {!isLast && (
            <button type="button" className="onboarding-back" onClick={next}>{t("onboardingNext")}</button>
          )}
          {isLast && (
            <button type="button" className="modal-confirm" onClick={onDone}>{t("onboardingFinish")}</button>
          )}
          {step > 0 && (
            <button type="button" className="onboarding-back onboarding-back--ghost" onClick={back}>{t("onboardingBack")}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
