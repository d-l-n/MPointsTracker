import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { GameDefinition, LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import Dropdown from "../ui/Dropdown";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
import Tooltip from "../ui/Tooltip";
import {
  SUSHI_DO_FLAVORS,
  SUSHI_DO_MAX_PLAYERS,
  SUSHI_DO_MIN_PLAYERS,
  SUSHI_DO_PENALTY,
  SUSHI_DO_WIN_SCORE,
  getSuggestedSushiDoFlavors,
  getSushiDoFlavorByKey,
} from "../../data/sushiDo";

interface PlayerInputState {
  id: string;
  name: string;
}

interface SushiFlavor {
  key: string;
  label: string;
  points: number;
}

interface SushiEvent {
  type: "penalty" | "round_win";
  playerId: string;
  playerName: string | null;
  flavorKey: string | null;
  flavorLabel: string | null;
  delta: number;
  round: number;
}

interface SushiCompletedRound {
  round: number;
  events: SushiEvent[];
}

interface SushiUndoSnapshot {
  scores: Record<string, number>;
  currentRound: number;
  roundEvents: SushiEvent[];
  completedRounds: SushiCompletedRound[];
  selectedCallerId: string | null;
  resolutionMode: "success" | "penalty" | null;
  gameOver: boolean;
  winner: string | null;
}

interface SushiDraft {
  players?: PlayerInputState[];
  phase?: "setup" | "playing";
  selectedFlavors?: string[];
  scores?: Record<string, number>;
  currentRound?: number;
  roundEvents?: SushiEvent[];
  completedRounds?: SushiCompletedRound[];
  undoStack?: SushiUndoSnapshot[];
  selectedCallerId?: string | null;
  resolutionMode?: "success" | "penalty" | null;
  gameOver?: boolean;
  winner?: string | null;
}

interface SushiDoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  flavorsInPlay: string[];
  roundLog: Array<{
    round: number;
    events: Array<{
      type: string;
      player: string | null;
      flavorKey: string | null;
      flavorLabel: string | null;
      delta: number;
    }>;
  }>;
}

interface SushiDoNewMatchProps {
  game?: GameDefinition;
  onSave: (match: SushiDoSavePayload) => void;
  knownNames: string[];
  draft?: SushiDraft | null;
  onDraftChange?: (draft: SushiDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  t?: TranslationFn;
}

function toTestId(name = "") {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "player"
  );
}

function buildScores(players: PlayerInputState[], previousScores: Record<string, number> = {}) {
  return players.reduce<Record<string, number>>((acc, player) => {
    acc[player.id] = previousScores[player.id] || 0;
    return acc;
  }, {});
}

function SushiDoNewMatch({
  game,
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  playerGroups = [],
  onSavePlayerGroups,
  t = ((key: string) => key) as TranslationFn,
}: SushiDoNewMatchProps) {
  const [players, setPlayers] = useState<PlayerInputState[]>(
    draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }],
  );
  const [phase, setPhase] = useState<"setup" | "playing">(draft?.phase || "setup");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(
    Array.isArray(draft?.selectedFlavors) && draft.selectedFlavors.length > 0
      ? draft.selectedFlavors
      : getSuggestedSushiDoFlavors(SUSHI_DO_MIN_PLAYERS),
  );
  const [scores, setScores] = useState<Record<string, number>>(draft?.scores || {});
  const [currentRound, setCurrentRound] = useState(draft?.currentRound || 1);
  const [roundEvents, setRoundEvents] = useState<SushiEvent[]>(draft?.roundEvents || []);
  const [completedRounds, setCompletedRounds] = useState<SushiCompletedRound[]>(draft?.completedRounds || []);
  const [undoStack, setUndoStack] = useState<SushiUndoSnapshot[]>(draft?.undoStack || []);
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(draft?.selectedCallerId || null);
  const [resolutionMode, setResolutionMode] = useState<"success" | "penalty" | null>(draft?.resolutionMode || null);
  const [gameOver, setGameOver] = useState(draft?.gameOver || false);
  const [winner, setWinner] = useState<string | null>(draft?.winner || null);

  const namedPlayers = useMemo(() => players.filter((player) => player.name.trim()), [players]);
  const duplicateNames = useMemo(() => {
    const seen = new Set<string>();
    return namedPlayers.some((player) => {
      const normalized = player.name.trim().toLowerCase();
      if (seen.has(normalized)) return true;
      seen.add(normalized);
      return false;
    });
  }, [namedPlayers]);

  const validPlayerCount = namedPlayers.length >= SUSHI_DO_MIN_PLAYERS && namedPlayers.length <= SUSHI_DO_MAX_PLAYERS;
  const canStart =
    validPlayerCount &&
    !duplicateNames &&
    selectedFlavors.length === namedPlayers.length &&
    new Set(selectedFlavors).size === selectedFlavors.length;

  const playerNameMap = useMemo(
    () => Object.fromEntries(namedPlayers.map((player) => [player.id, player.name.trim()])) as Record<string, string>,
    [namedPlayers],
  );

  const activeFlavors = useMemo(
    () => selectedFlavors.map((flavorKey) => getSushiDoFlavorByKey(flavorKey) as SushiFlavor | null).filter(Boolean) as SushiFlavor[],
    [selectedFlavors],
  );

  useEffect(() => {
    if (phase !== "setup" || !validPlayerCount) return;
    setSelectedFlavors((currentFlavors) => {
      if (currentFlavors.length === namedPlayers.length && new Set(currentFlavors).size === currentFlavors.length) {
        return currentFlavors;
      }
      return getSuggestedSushiDoFlavors(namedPlayers.length);
    });
  }, [namedPlayers.length, phase, validPlayerCount]);

  useEffect(() => {
    if (phase === "playing" || players.some(p => p.name.trim())) {
      onDraftChange?.({
        phase,
        players,
        selectedFlavors,
        scores,
        currentRound,
        roundEvents,
        completedRounds,
        undoStack,
        selectedCallerId,
        resolutionMode,
        gameOver,
        winner,
      });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [completedRounds, currentRound, gameOver, onDraftChange, phase, players, resolutionMode, roundEvents, scores, selectedCallerId, selectedFlavors, undoStack, winner]);

  const getFlavorOptions = useCallback(
    (slotIndex: number) => {
      const used = new Set(selectedFlavors.filter((_, index) => index !== slotIndex));
      return SUSHI_DO_FLAVORS.filter((flavor: SushiFlavor) => !used.has(flavor.key));
    },
    [selectedFlavors],
  );

  const replaceFlavorAt = useCallback((slotIndex: number, nextFlavorKey: string) => {
    setSelectedFlavors((currentFlavors) => {
      if (currentFlavors.some((flavorKey, index) => index !== slotIndex && flavorKey === nextFlavorKey)) {
        return currentFlavors;
      }
      return currentFlavors.map((flavorKey, index) => (index === slotIndex ? nextFlavorKey : flavorKey));
    });
  }, []);

  const resetSuggestedFlavors = useCallback(() => {
    if (!validPlayerCount) return;
    setSelectedFlavors(getSuggestedSushiDoFlavors(namedPlayers.length));
  }, [namedPlayers.length, validPlayerCount]);

  const startMatch = useCallback(() => {
    if (!canStart) return;
    const initialScores = buildScores(namedPlayers);
    setScores(initialScores);
    setCurrentRound(1);
    setRoundEvents([]);
    setCompletedRounds([]);
    setUndoStack([]);
    setSelectedCallerId(null);
    setResolutionMode(null);
    setGameOver(false);
    setWinner(null);
    setPhase("playing");
    haptic("medium");
  }, [canStart, namedPlayers]);

  const pushUndoSnapshot = useCallback(() => {
    setUndoStack((currentStack) => [
      ...currentStack,
      {
        scores: { ...scores },
        currentRound,
        roundEvents: roundEvents.map((event) => ({ ...event })),
        completedRounds: completedRounds.map((round) => ({ ...round, events: round.events.map((event) => ({ ...event })) })),
        selectedCallerId,
        resolutionMode,
        gameOver,
        winner,
      },
    ]);
  }, [completedRounds, currentRound, gameOver, resolutionMode, roundEvents, scores, selectedCallerId, winner]);

  const applyPenalty = useCallback(() => {
    if (!selectedCallerId || gameOver) return;
    const playerName = playerNameMap[selectedCallerId] || null;
    pushUndoSnapshot();
    setScores((currentScores) => ({
      ...currentScores,
      [selectedCallerId]: (currentScores[selectedCallerId] || 0) - SUSHI_DO_PENALTY,
    }));
    setRoundEvents((currentEvents) => [
      ...currentEvents,
      {
        type: "penalty",
        playerId: selectedCallerId,
        playerName,
        flavorKey: null,
        flavorLabel: null,
        delta: -SUSHI_DO_PENALTY,
        round: currentRound,
      },
    ]);
    setSelectedCallerId(null);
    setResolutionMode(null);
    haptic("light");
  }, [currentRound, gameOver, playerNameMap, pushUndoSnapshot, selectedCallerId]);

  const applySuccess = useCallback(
    (flavorKey: string) => {
      if (!selectedCallerId || gameOver || !selectedFlavors.includes(flavorKey)) return;
      const flavor = getSushiDoFlavorByKey(flavorKey) as SushiFlavor | null;
      if (!flavor) return;

      const playerName = playerNameMap[selectedCallerId] || null;
      const nextScore = (scores[selectedCallerId] || 0) + flavor.points;
      const nextEvent: SushiEvent = {
        type: "round_win",
        playerId: selectedCallerId,
        playerName,
        flavorKey,
        flavorLabel: flavor.label,
        delta: flavor.points,
        round: currentRound,
      };
      const nextRoundEvents = [...roundEvents, nextEvent];
      const reachedGoal = nextScore >= SUSHI_DO_WIN_SCORE;

      pushUndoSnapshot();
      setScores((currentScores) => ({
        ...currentScores,
        [selectedCallerId]: nextScore,
      }));
      setCompletedRounds((currentRounds) => [...currentRounds, { round: currentRound, events: nextRoundEvents }]);
      setRoundEvents([]);
      setCurrentRound((round) => round + 1);
      setSelectedCallerId(null);
      setResolutionMode(null);
      setGameOver(reachedGoal);
      setWinner(reachedGoal ? playerName : null);
      haptic(reachedGoal ? "strong" : "medium");
    },
    [currentRound, gameOver, playerNameMap, pushUndoSnapshot, roundEvents, scores, selectedCallerId, selectedFlavors],
  );

  const undoLastEvent = useCallback(() => {
    const lastSnapshot = undoStack[undoStack.length - 1];
    if (!lastSnapshot) return;
    setScores(lastSnapshot.scores);
    setCurrentRound(lastSnapshot.currentRound);
    setRoundEvents(lastSnapshot.roundEvents);
    setCompletedRounds(lastSnapshot.completedRounds);
    setSelectedCallerId(lastSnapshot.selectedCallerId);
    setResolutionMode(lastSnapshot.resolutionMode);
    setGameOver(lastSnapshot.gameOver);
    setWinner(lastSnapshot.winner);
    setUndoStack((currentStack) => currentStack.slice(0, -1));
    haptic("light");
  }, [undoStack]);

  const canSaveProgress = useMemo(
    () =>
      phase === "playing" &&
      (completedRounds.length > 0 || roundEvents.length > 0 || Object.values(scores).some((score) => score !== 0)),
    [completedRounds.length, phase, roundEvents.length, scores],
  );

  const handleSave = useCallback(
    (winnerOverride?: string | null) => {
      const ranking = [...namedPlayers].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0));
      onSave({
        id: mkId(),
        date: new Date().toISOString(),
        players: ranking.map((player) => ({ name: player.name, score: scores[player.id] || 0 })),
        winner: winnerOverride === undefined ? (winner || ranking[0]?.name || null) : winnerOverride,
        rounds: completedRounds.length,
        flavorsInPlay: [...selectedFlavors],
        roundLog: completedRounds.map((round) => ({
          round: round.round,
          events: round.events.map((event) => ({
            type: event.type,
            player: event.playerName,
            flavorKey: event.flavorKey,
            flavorLabel: event.flavorLabel,
            delta: event.delta,
          })),
        })),
      });
      haptic("strong");
    },
    [completedRounds, namedPlayers, onSave, scores, selectedFlavors, winner],
  );

  const allVisibleEvents = useMemo(
    () => [
      ...completedRounds.flatMap((round) => round.events.map((event) => ({ ...event, completed: true }))),
      ...roundEvents.map((event) => ({ ...event, completed: false })),
    ],
    [completedRounds, roundEvents],
  );

  if (phase === "setup") {
    return (
      <div className="sushi-do sushi-do--setup" data-testid="sushi-do-setup">
        <div className="sec sushi-do__panel">
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={SUSHI_DO_MAX_PLAYERS}
            onLoad={(groupPlayers, groupLinkedPlayers) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinkedPlayers as LinkedPlayer[]);
            }}
          />
          <span className="flbl">{t("players")}</span>
          <div className="rgap sushi-do__player-inputs">
            {players.map((player, index) => (
              <div className="irow" key={player.id}>
                <LinkedPlayerInput
                  value={player.name}
                  linkedUid={(linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === player.id) || {}).uid}
                  linkedName={(linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === player.id) || {}).name}
                  onChange={(value) =>
                    setPlayers((currentPlayers) =>
                      currentPlayers.map((currentPlayer) => (currentPlayer.id === player.id ? { ...currentPlayer, name: value } : currentPlayer)),
                    )
                  }
                  onLink={({ uid, name }) => {
                    setPlayers((currentPlayers) =>
                      currentPlayers.map((currentPlayer) => (currentPlayer.id === player.id ? { ...currentPlayer, name } : currentPlayer)),
                    );
                    onLinkedPlayersChange([
                      ...linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id),
                      { uid, name, playerId: player.id },
                    ]);
                  }}
                  onUnlink={() => onLinkedPlayersChange(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id))}
                  placeholder={`${t("playerN")} ${index + 1}`}
                  knownNames={knownNames}
                  t={t}
                  allLinkedUids={linkedPlayers.map((linkedPlayer) => linkedPlayer.uid)}
                />
                {players.length > SUSHI_DO_MIN_PLAYERS && player.name.trim() && (
                <Tooltip text={`${t("delete")} ${player.name || `${t("playerN")} ${index + 1}`}`}>
                <button
                  className="btnrm"
                  aria-label={`${t("delete")} ${player.name || `${t("playerN")} ${index + 1}`}`}
                  onClick={() => {
                    setPlayers((currentPlayers) => currentPlayers.filter((currentPlayer) => currentPlayer.id !== player.id));
                    onLinkedPlayersChange(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id));
                  }}
                >
                  ✕
                </button>
                </Tooltip>
                )}
              </div>
            ))}
          </div>
          {players.length < SUSHI_DO_MAX_PLAYERS && (
            <button className="btndash" data-testid="add-player" onClick={() => setPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])}>
              {t("addPlayer")}
            </button>
          )}
          <SaveGroupButton
            t={t}
            players={players}
            linkedPlayers={linkedPlayers}
            playerGroups={playerGroups}
            onSave={onSavePlayerGroups}
          />
          {duplicateNames && (
            <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, fontWeight: 600 }}>
              {t("dupPlayerWarning")}
            </div>
          )}
        </div>

        {validPlayerCount && (
          <div className="sec sushi-do__panel sushi-do__flavors-panel">
            <div className="flbl">{t("sushiDoFlavors")}</div>
            <div style={{ color: "var(--tx2)", fontSize: ".78rem", marginTop: 6 }}>
              {selectedFlavors.length} / {namedPlayers.length} {t("sushiDoFlavorCount")}
            </div>
            <div className="rgap" style={{ marginTop: 10 }}>
              {selectedFlavors.map((flavorKey, index) => {
                const flavor = getSushiDoFlavorByKey(flavorKey) as SushiFlavor | null;
                return (
                  <div key={`${index}-${flavorKey}`} className="sec-card sushi-do__flavor-slot" data-testid={`sushi-do-flavor-slot-${index}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 700 }}>{index + 1}. {flavor?.label}</div>
                      <div style={{ color: "var(--tx2)" }}>{flavor?.points} {t("ptsLabel")}</div>
                    </div>
                    <Dropdown
                      value={flavorKey}
                      onChange={(v) => replaceFlavorAt(index, v)}
                      options={getFlavorOptions(index).map((opt: SushiFlavor) => ({ value: opt.key, label: opt.label }))}
                      testId={`sushi-do-flavor-select-${index}`}
                    />
                  </div>
                );
              })}
            </div>
            <button className="btnsec" onClick={resetSuggestedFlavors} style={{ marginTop: 12 }}>
              {t("sushiDoRestoreSuggestion")}
            </button>
          </div>
        )}

        <button className="btnpri sushi-do__start" data-testid="sushi-do-start" disabled={!canStart} onClick={startMatch}>
          {t("startGame")}
        </button>
      </div>
    );
  }

  return (
    <div className="sushi-do sushi-do--playing" style={{ "--gc": game?.color || "#D94841" } as CSSProperties}>
      <section className="sushi-do__round-header" data-testid="sushi-do-round-number">
        <div>
          <div className="flbl">{t("roundLabel")}</div>
          <div className="sushi-do__round-title">{currentRound} <span>· {SUSHI_DO_WIN_SCORE} {t("ptsLabel")}</span></div>
        </div>
        {winner && <div className="sushi-do__winner">{t("winner")}: <strong>{winner}</strong></div>}
        <div className="sushi-do__flavor-chips" data-testid="sushi-do-active-flavors">
          {activeFlavors.map((flavor) => (
            <span key={flavor.key} className="sushi-do__flavor-chip">{flavor.label} <b>{flavor.points}</b></span>
          ))}
        </div>
      </section>

      <div className="sushi-do__players">
        {namedPlayers.map((player, index) => {
          const id = toTestId(player.name);
          const score = scores[player.id] || 0;
          const progress = Math.max(0, Math.min((score / SUSHI_DO_WIN_SCORE) * 100, 100));
          return (
            <button
              key={player.id}
              className="tcard sushi-do__player"
              data-testid={`sushi-do-caller-${id}`}
              aria-pressed={selectedCallerId === player.id}
              onClick={() => {
                if (gameOver) return;
                setSelectedCallerId(player.id);
                setResolutionMode(null);
                haptic("light");
              }}
              disabled={gameOver}
            >
              <div className="ttname">{index === 0 ? "👑 " : ""}{player.name}</div>
              <div className="ttscore" data-testid={`sushi-do-score-${id}`}>{score}</div>
              <div className="ttlimit">{t("score")}</div>
              <div className="sushi-do__progress">
                <div style={{ width: `${progress}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {!gameOver && (
        <section className="sec-card sushi-do__call-panel">
          <div className="flbl">{t("sushiDoCallerPrompt")}</div>
          <div className="sushi-do__call-status">
            {selectedCallerId ? `${t("sushiDoSelectedCaller")}: ${playerNameMap[selectedCallerId]}` : t("whoWonRoundQ")}
          </div>
          <div className="sushi-do__resolution-actions">
            <button className="btnpri" data-testid="sushi-do-resolve-success" disabled={!selectedCallerId} onClick={() => setResolutionMode("success")}>
              {t("sushiDoResolveSuccess")}
            </button>
            <button
              className="btnsec sushi-do__penalty"
              data-testid="sushi-do-resolve-penalty"
              disabled={!selectedCallerId}
              onClick={() => setResolutionMode("penalty")}
            >
              {t("sushiDoResolvePenalty")}
            </button>
          </div>

          {resolutionMode === "success" && selectedCallerId && (
            <div className="sushi-do__flavor-resolution">
              <div className="flbl">{playerNameMap[selectedCallerId]}</div>
              <div className="sushi-do__flavor-options">
                {activeFlavors.map((flavor) => (
                  <button
                    key={flavor.key}
                    className="btnsec sushi-do__flavor-option"
                    data-testid={`sushi-do-flavor-option-${flavor.key}`}
                    onClick={() => applySuccess(flavor.key)}
                  >
                    <div style={{ fontWeight: 700 }}>{flavor.label}</div>
                    <div style={{ color: "var(--tx2)", fontSize: ".72rem" }}>{flavor.points} {t("ptsLabel")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {resolutionMode === "penalty" && selectedCallerId && (
            <div className="sushi-do__penalty-confirm">
              <div className="flbl">{playerNameMap[selectedCallerId]}</div>
              <div style={{ color: "var(--tx2)", fontSize: ".78rem", marginTop: 6 }}>{t("sushiDoPenaltyConfirm")}</div>
              <button
                className="btnsec sushi-do__penalty"
                data-testid="sushi-do-confirm-penalty"
                onClick={applyPenalty}
              >
                {t("sushiDoConfirmPenalty")}
              </button>
            </div>
          )}
        </section>
      )}

      <div className="sec-card sushi-do__log" data-testid="sushi-do-round-log">
        <div className="flbl">{t("sushiDoRoundLog")}</div>
        {allVisibleEvents.length === 0 ? (
          <div style={{ color: "var(--tx2)", marginTop: 10, fontSize: ".82rem" }}>{t("noRecordsYet")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {allVisibleEvents.map((event, index) => (
              <div
                key={`${event.type}-${event.playerId}-${event.round}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 10px",
                  borderRadius: "var(--rxs)",
                  background: "var(--content-surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    #{event.round} · {event.playerName}
                  </div>
                  <div style={{ color: "var(--tx2)", fontSize: ".76rem" }}>
                    {event.type === "penalty" ? t("penalty") : event.flavorLabel}
                    {event.completed ? ` · ${t("winner")}` : ""}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: event.delta < 0 ? "#E63946" : "var(--gc)" }}>
                  {event.delta > 0 ? `+${event.delta}` : `${event.delta}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sushi-do__utility-actions">
        <button className="btnsec" data-testid="sushi-do-undo" disabled={undoStack.length === 0} onClick={undoLastEvent}>
          {t("undo")}
        </button>
      </div>

      {gameOver && (
        <div className="sec-card sushi-do__game-over" data-testid="sushi-do-game-over">
          <div className="flbl">{t("sushiDoGameOver")}</div>
          <div style={{ marginTop: 10, fontWeight: 700 }}>
            {winner ? `${winner} · ${SUSHI_DO_WIN_SCORE}+` : `${SUSHI_DO_WIN_SCORE}+`}
          </div>
        </div>
      )}

      <EarlyFinishSaveAction canSave={canSaveProgress} isNaturalFinish={gameOver} eligiblePlayers={namedPlayers.map((player) => player.name)} onSave={handleSave} t={t} style={{ marginTop: 12 }} />
    </div>
  );
}

export default memo(SushiDoNewMatch)
