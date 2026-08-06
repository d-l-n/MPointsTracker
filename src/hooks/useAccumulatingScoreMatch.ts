import { useEffect, useState } from "react";

import { haptic, mkId } from "../lib/storage";
import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../types";

export interface PlayerInputState {
  id: string;
  name: string;
}

export type MatchMode = "teams" | "individual";
export type RoundInputValue = number | string;

/**
 * Returns `values` resized to `length`: truncates if longer, pads with
 * `fill` if shorter. Returns the same reference when already the right size.
 */
function padToLength<T>(values: T[], length: number, fill: T): T[] {
  if (values.length === length) return values;
  if (values.length > length) return values.slice(0, length);
  return [...values, ...Array.from({ length: length - values.length }, () => fill)];
}

export interface AccumulatingScoreDraft {
  step?: "setup" | "playing";
  limit?: number;
  mode?: MatchMode;
  teamNames?: [string, string];
  players?: PlayerInputState[];
  scores?: number[];
  rounds?: number;
  hist?: RoundInputValue[][];
  over?: boolean;
  wi?: number | null;
}

export interface AccumulatingScoreSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: MatchMode;
}

export interface AccumulatingScoreConfig {
  goal: number;
  allowConfigurableLimit?: boolean;
  configurableLimitOptions?: number[];
  i18nPrefix?: string;
  checkDuplicates?: boolean;
  useLocaleFormat?: boolean;
  maxPlayers?: number;
  gameId: string;
  confirmMsgKey?: string;
}

export interface AccumulatingScoreProps {
  onSave: (match: AccumulatingScoreSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: AccumulatingScoreDraft | null;
  onDraftChange?: (draft: AccumulatingScoreDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

export interface AccumulatingScoreState {
  // Step state
  step: "setup" | "playing";
  setStep: (step: "setup" | "playing") => void;
  // Limit (for configurable)
  limit: number;
  setLimit: (limit: number) => void;
  // Mode
  mode: MatchMode;
  setMode: (mode: MatchMode) => void;
  // Team names
  teamNames: [string, string];
  setTeamNames: React.Dispatch<React.SetStateAction<[string, string]>>;
  // Players
  players: PlayerInputState[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerInputState[]>>;
  // Scores
  scores: number[];
  // Round inputs (text/number mode: Canasta/Burako)
  roundInputs: RoundInputValue[];
  setRoundInputs: React.Dispatch<React.SetStateAction<RoundInputValue[]>>;
  // Adds (stepper mode: Truco)
  adds: number[];
  setAdds: React.Dispatch<React.SetStateAction<number[]>>;
  // Rounds
  rounds: number;
  // History
  hist: RoundInputValue[][];
  // Game over
  over: boolean;
  // Winner index
  wi: number | null;
  // Confirm back
  confirmBack: boolean;
  setConfirmBack: (v: boolean) => void;
  // Derived
  named: PlayerInputState[];
  labels: string[];
  canStart: boolean;
  hasDuplicates: boolean;
  canSaveProgress: boolean;
  // Handlers
  commit: () => void;
  undo: () => void;
  handleSave: (winnerOverride?: string | null) => void;
  reset: () => void;
  pill: (active: boolean) => React.CSSProperties;
}

export function useAccumulatingScoreMatch(
  config: AccumulatingScoreConfig,
  props: AccumulatingScoreProps,
): AccumulatingScoreState {
  const {
    goal,
    checkDuplicates = true,
    configurableLimitOptions,
  } = config;

  const {
    onSave,
    linkedPlayers = [],
    onLinkedPlayersChange,
    t = ((key: string) => key) as TranslationFn,
    draft = null,
    onDraftChange,
  } = props;

  const defaultLimit = configurableLimitOptions?.[1] ?? goal;

  const [step, setStep] = useState<"setup" | "playing">(draft?.step || "setup");
  const [limit, setLimit] = useState(draft?.limit ?? defaultLimit);
  const [mode, setMode] = useState<MatchMode>(draft?.mode || "teams");
  const [teamNames, setTeamNames] = useState<[string, string]>(
    draft?.teamNames || [t("teamUs"), t("teamThem")],
  );
  const [players, setPlayers] = useState<PlayerInputState[]>(
    draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }],
  );
  // Initial slot count: 2 for teams, one per named player in individual mode.
  // Legacy drafts may carry 2-slot arrays while having more players, so pad
  // them up-front to keep the first render in sync with the rendered labels.
  const initialSlotCount =
    (draft?.mode === "individual"
      ? Math.max(2, (draft?.players || []).filter((p) => p.name.trim()).length)
      : 2);
  const [scores, setScores] = useState<number[]>(padToLength(draft?.scores || [0, 0], initialSlotCount, 0));
  const [roundInputs, setRoundInputs] = useState<RoundInputValue[]>(padToLength([0, 0], initialSlotCount, 0));
  const [adds, setAdds] = useState<number[]>(padToLength([0, 0], initialSlotCount, 0));
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [hist, setHist] = useState<RoundInputValue[][]>(draft?.hist || []);
  const [over, setOver] = useState(draft?.over || false);
  const [wi, setWi] = useState<number | null>(draft?.wi ?? null);
  const [confirmBack, setConfirmBack] = useState(false);

  const effectiveGoal = config.allowConfigurableLimit ? limit : goal;

  useEffect(() => {
    if (step === "playing" || rounds > 0 || players.some((p) => p.name.trim())) {
      onDraftChange?.({ step, limit, mode, teamNames, players, scores, rounds, hist, over, wi });
    } else if (draft) {
      onDraftChange?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hist, limit, mode, onDraftChange, over, players, rounds, scores, step, teamNames, wi]);

  const named = players.filter((player) => player.name.trim());
  const labels: string[] = mode === "teams" ? [...teamNames] : named.map((p) => p.name);

  // Number of score slots: 2 for teams, one per named player in individual mode.
  // Keeps scores/inputs/history in sync with the rendered labels so games like
  // Canasta/Burako/Truco can track more than 2 players in individual mode.
  const slotCount = mode === "teams" ? 2 : Math.max(2, named.length);

  useEffect(() => {
    setScores((prev) => padToLength(prev, slotCount, 0));
    setRoundInputs((prev) => padToLength(prev, slotCount, 0));
    setAdds((prev) => padToLength(prev, slotCount, 0));
  }, [slotCount]);
  const canStart =
    mode === "teams"
      ? Boolean(teamNames[0].trim() && teamNames[1].trim())
      : named.length >= 2;

  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates =
    checkDuplicates && mode !== "teams" && Object.values(nameCount).some((v) => v > 1);

  const canSaveProgress = over || rounds > 0;

  const reset = () => {
    setStep("setup");
    setScores([0, 0]);
    setRounds(0);
    setHist([]);
    setRoundInputs([0, 0]);
    setAdds([0, 0]);
    setOver(false);
    setWi(null);
  };

  const commit = () => {
    // Support both stepper (adds) and text input (roundInputs) modes.
    // Callers pass the current input through roundInputs or adds depending on game.
    const inputs = config.allowConfigurableLimit ? adds : roundInputs;

    const nextScores = scores.map(
      (score, index) => score + (Number(inputs[index]) || 0),
    );

    setScores(nextScores);
    setRounds((r) => r + 1);

    if (config.allowConfigurableLimit) {
      setHist((h) => [...h, [...adds]]);
      setAdds(adds.map(() => 0));
    } else {
      setHist((h) => [...h, [...roundInputs]]);
      setRoundInputs(roundInputs.map(() => 0));
    }

    const winnerIndex = nextScores.findIndex((score) => score >= effectiveGoal);
    if (winnerIndex !== -1) {
      setOver(true);
      setWi(winnerIndex);
    }
  };

  const undo = () => {
    if (!hist.length) return;
    const last = hist[hist.length - 1];
    setScores(
      (prev) => prev.map((v, i) => v - (Number(last[i]) || 0)),
    );
    setHist((h) => h.slice(0, -1));
    setRounds((r) => r - 1);
    setOver(false);
    setWi(null);
  };

  const handleSave = (winnerOverride?: string | null) => {
    const resolvedPlayers =
      mode === "teams"
        ? teamNames.map((name, index) => ({ name, score: scores[index] }))
        : named.map((player, index) => ({ name: player.name, score: scores[index] || 0 }));

    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: resolvedPlayers,
      winner:
        winnerOverride === undefined
          ? wi !== null
            ? resolvedPlayers[wi]?.name
            : null
          : winnerOverride,
      rounds,
      limit: effectiveGoal,
      mode,
    });
  };

  const pill = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px",
    borderRadius: "var(--rxs)",
    cursor: "pointer",
    border: `1.5px solid ${active ? "var(--gc)" : "var(--bo2)"}`,
    background: active ? "color-mix(in srgb,var(--gc) 12%,transparent)" : "var(--ibg)",
    color: active ? "var(--gc)" : "var(--tx2)",
    fontFamily: "'Google Sans',sans-serif",
    fontSize: ".86rem",
    fontWeight: 600,
  });

  // Expose linkedPlayers / onLinkedPlayersChange for discard handler
  const handleDiscard = () => {
    setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
    reset();
    onLinkedPlayersChange([]);
  };

  // Attach to players setter for GroupPicker
  void handleDiscard; // suppress unused warning — used by AccumulatingScoreUI via props

  return {
    step,
    setStep,
    limit,
    setLimit,
    mode,
    setMode,
    teamNames,
    setTeamNames,
    players,
    setPlayers,
    scores,
    roundInputs,
    setRoundInputs,
    adds,
    setAdds,
    rounds,
    hist,
    over,
    wi,
    confirmBack,
    setConfirmBack,
    named,
    labels,
    canStart,
    hasDuplicates,
    canSaveProgress,
    commit,
    undo,
    handleSave,
    reset,
    pill,
  };
}
