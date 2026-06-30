import { memo } from "react";

import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import { useAccumulatingScoreMatch } from "../../hooks/useAccumulatingScoreMatch";
import AccumulatingScoreUI from "./AccumulatingScoreUI";
import ScoreInputQuickButtons from "./ScoreInputQuickButtons";
import type { AccumulatingScoreDraft } from "../../hooks/useAccumulatingScoreMatch";

export type CanastaDraft = AccumulatingScoreDraft;

export interface CanastaSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: "teams" | "individual";
}

interface CanastaNewMatchProps {
  onSave: (match: CanastaSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: CanastaDraft | null;
  onDraftChange?: (draft: CanastaDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

const GOAL = 5000;

const config = {
  goal: GOAL,
  checkDuplicates: true,
  useLocaleFormat: true,
  maxPlayers: 4,
  gameId: "canasta",
  confirmMsgKey: "roundsPlayed",
  i18nPrefix: "round",
} as const;

function CanastaNewMatch(props: CanastaNewMatchProps) {
  const state = useAccumulatingScoreMatch(config, props);
  const { t = ((k: string) => k) as TranslationFn } = props;

  return (
    <AccumulatingScoreUI
      config={config}
      props={props}
      state={state}
      formatScore={(v) => v.toLocaleString()}
      formatLimit={(v) => v.toLocaleString()}
      renderSetupExtra={() => (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: "color-mix(in srgb,var(--gc) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--gc) 25%,transparent)",
            borderRadius: "var(--rxs)",
            fontSize: ".75rem",
            color: "var(--tx2)",
          }}
        >
          🃏 {t("canastaGoalNote") || `Meta: ${GOAL.toLocaleString()} pts · Puntaje acumulado por manos`}
        </div>
      )}
      renderInput={({ labels, roundInputs, setRoundInputs, rounds, undo, commit }) => (
        <ScoreInputQuickButtons
          labels={labels}
          roundInputs={roundInputs}
          setRoundInputs={setRoundInputs}
          rounds={rounds}
          undo={undo}
          commit={commit}
          t={t}
          i18nPrefix="round"
          idPrefix="canasta"
        />
      )}
    />
  );
}

export default memo(CanastaNewMatch);
