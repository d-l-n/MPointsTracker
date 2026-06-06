import { useState, type CSSProperties } from "react";

import type { TranslationFn } from "../../types";
import EarlyFinishModal from "./EarlyFinishModal";

interface EarlyFinishSaveActionProps {
  canSave: boolean;
  isNaturalFinish: boolean;
  eligiblePlayers?: string[];
  onSave: (winnerOverride?: string | null) => void;
  t?: TranslationFn;
  className?: string;
  style?: CSSProperties;
  testId?: string;
}

export default function EarlyFinishSaveAction({
  canSave,
  isNaturalFinish,
  eligiblePlayers = [],
  onSave,
  t = ((key: string) => key) as TranslationFn,
  className = "btnpri",
  style,
  testId = "save-match",
}: EarlyFinishSaveActionProps) {
  const [showEarlyFinish, setShowEarlyFinish] = useState(false);

  if (!canSave) return null;

  return (
    <>
      <button
        className={className}
        data-testid={testId}
        style={style}
        onClick={() => {
          if (isNaturalFinish) {
            onSave();
            return;
          }
          setShowEarlyFinish(true);
        }}
      >
        {isNaturalFinish ? t("saveMatch") : t("finishMatchNow")}
      </button>

      {showEarlyFinish && (
        <EarlyFinishModal
          players={eligiblePlayers}
          t={t}
          onCancel={() => setShowEarlyFinish(false)}
          onConfirm={(winnerOverride) => {
            setShowEarlyFinish(false);
            onSave(winnerOverride);
          }}
        />
      )}
    </>
  );
}
