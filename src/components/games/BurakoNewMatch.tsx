import { memo } from "react";

import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import { useAccumulatingScoreMatch } from "../../hooks/useAccumulatingScoreMatch";
import AccumulatingScoreUI from "./AccumulatingScoreUI";
import ScoreInputText from "./ScoreInputText";
import type { AccumulatingScoreDraft } from "../../hooks/useAccumulatingScoreMatch";

export type BurakoDraft = AccumulatingScoreDraft;

export interface BurakoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: "teams" | "individual";
}

interface BurakoNewMatchProps {
  onSave: (match: BurakoSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: BurakoDraft | null;
  onDraftChange?: (draft: BurakoDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  onBack?: () => void;
}

const config = {
  goal: 2000,
  checkDuplicates: true,
  maxPlayers: 4,
  gameId: "burako",
  confirmMsgKey: "roundsPlayed",
  i18nPrefix: "round",
} as const;

function BurakoNewMatch(props: BurakoNewMatchProps) {
  const state = useAccumulatingScoreMatch(config, props);
  const { t = ((k: string) => k) as TranslationFn } = props;

  return (
    <AccumulatingScoreUI
      config={config}
      props={props}
      state={state}
      renderInput={({ labels, roundInputs, setRoundInputs, rounds, undo, commit }) => (
        <ScoreInputText
          labels={labels}
          roundInputs={roundInputs}
          setRoundInputs={setRoundInputs}
          rounds={rounds}
          undo={undo}
          commit={commit}
          t={t}
          i18nPrefix="round"
          idPrefix="burako"
        />
      )}
    />
  );
}

export default memo(BurakoNewMatch);
