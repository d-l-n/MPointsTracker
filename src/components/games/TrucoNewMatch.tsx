import { memo, useState } from "react";

import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import { useAccumulatingScoreMatch } from "../../hooks/useAccumulatingScoreMatch";
import AccumulatingScoreUI from "./AccumulatingScoreUI";
import ScoreInputStepper from "./ScoreInputStepper";
import type { AccumulatingScoreDraft } from "../../hooks/useAccumulatingScoreMatch";

export interface TrucoDraft extends AccumulatingScoreDraft {
  limit?: number;
}

export interface TrucoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: "teams" | "individual";
}

interface TrucoNewMatchProps {
  onSave: (match: TrucoSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: TrucoDraft | null;
  onDraftChange?: (draft: TrucoDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

function TrucoNewMatch(props: TrucoNewMatchProps) {
  const { t = ((k: string) => k) as TranslationFn, draft } = props;
  const [limit, setLimit] = useState(draft?.limit || 30);

  const config = {
    goal: limit,
    allowConfigurableLimit: true,
    configurableLimitOptions: [15, 30],
    checkDuplicates: false,
    maxPlayers: 6,
    gameId: "truco",
    confirmMsgKey: "trucoBandoned",
    i18nPrefix: "hand",
  } as const;

  const state = useAccumulatingScoreMatch(config, props);

  return (
    <AccumulatingScoreUI
      config={config}
      props={props}
      state={{ ...state, limit, setLimit }}
      renderSetupExtra={() => (
        <div className="sec">
          <span className="flbl">{t("pointLimit")}</span>
          <div className="pillrow">
            {[15, 30].map((value) => (
              <button
                key={value}
                onClick={() => setLimit(value)}
                style={{
                  ...state.pill(limit === value),
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.25rem",
                  letterSpacing: "2px",
                }}
              >
                {value} PTS
              </button>
            ))}
          </div>
        </div>
      )}
      renderInput={({ labels, adds, setAdds, rounds, undo, commit }) => (
        <ScoreInputStepper
          labels={labels}
          adds={adds}
          setAdds={setAdds}
          rounds={rounds}
          undo={undo}
          commit={commit}
          t={t}
          i18nPrefix="hand"
        />
      )}
    />
  );
}

export default memo(TrucoNewMatch);
