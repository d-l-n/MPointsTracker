import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { GameDefinition, LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
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

  const sortedPlayers = useMemo(
    () =>
      [...namedPlayers].sort((left, right) => {
        const scoreDiff = (scores[right.id] || 0) - (scores[left.id] || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return left.name.localeCompare(right.name);
      }),
    [namedPlayers, scores],
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
      <div data-testid="sushi-do-setup">
        <div className="sec">
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
          <div className="rgap">
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
                <button
                  className="btnrm"
                  aria-label={`${t("delete")} ${player.name || `${t("playerN")} ${index + 1}`}`}
                  onClick={() => {
                    if (players.length <= SUSHI_DO_MIN_PLAYERS) return;
                    setPlayers((currentPlayers) => currentPlayers.filter((currentPlayer) => currentPlayer.id !== player.id));
                    onLinkedPlayersChange(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id));
                  }}
                >
                  ✕
                </button>
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
          <div className="sec" style={{ marginTop: 12 }}>
            <div className="flbl">{t("sushiDoFlavors")}</div>
            <div style={{ color: "var(--tx2)", fontSize: ".78rem", marginTop: 6 }}>
              {selectedFlavors.length} / {namedPlayers.length} {t("sushiDoFlavorCount")}
            </div>
            <div className="rgap" style={{ marginTop: 10 }}>
              {selectedFlavors.map((flavorKey, index) => {
                const flavor = getSushiDoFlavorByKey(flavorKey) as SushiFlavor | null;
                return (
                  <div key={`${index}-${flavorKey}`} className="sec-card" data-testid={`sushi-do-flavor-slot-${index}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 700 }}>{index + 1}. {flavor?.label}</div>
                      <div style={{ color: "var(--tx2)" }}>{flavor?.points} {t("ptsLabel")}</div>
                    </div>
                    <select
                      id={`sushi-do-flavor-select-${index}`}
                      className="inp"
                      data-testid={`sushi-do-flavor-select-${index}`}
                      value={flavorKey}
                      onChange={(event) => replaceFlavorAt(index, event.target.value)}
                      style={{ marginTop: 10 }}
                      aria-label={`${t("sushiDoFlavors")} ${index + 1}`}
                    >
                      {getFlavorOptions(index).map((option: SushiFlavor) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <button className="btnsec" onClick={resetSuggestedFlavors} style={{ marginTop: 12 }}>
              {t("sushiDoRestoreSuggestion")}
            </button>
          </div>
        )}

        <button className="btnpri" data-testid="sushi-do-start" disabled={!canStart} onClick={startMatch} style={{ marginTop: 12 }}>
          {t("startGame")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="tscores" style={{ marginBottom: 16, "--gc": game?.color || "#D94841" } as CSSProperties}>
        {sortedPlayers.map((player, index) => {
          const id = toTestId(player.name);
          const score = scores[player.id] || 0;
          const progress = Math.max(0, Math.min((score / SUSHI_DO_WIN_SCORE) * 100, 100));
          return (
            <button
              key={player.id}
              className="tcard"
              data-testid={`sushi-do-caller-${id}`}
              aria-pressed={selectedCallerId === player.id}
              onClick={() => {
                if (gameOver) return;
                setSelectedCallerId(player.id);
                setResolutionMode(null);
                haptic("light");
              }}
              style={{
                cursor: gameOver ? "default" : "pointer",
                border: selectedCallerId === player.id ? `2px solid ${game?.color || "#D94841"}` : "2px solid var(--content-border)",
                background:
                  selectedCallerId === player.id ? "color-mix(in srgb, var(--gc) 12%, var(--content-surface-strong))" : "var(--content-surface-strong)",
              }}
            >
              <div className="ttname">{index === 0 ? "👑 " : ""}{player.name}</div>
              <div className="ttscore" data-testid={`sushi-do-score-${id}`}>{score}</div>
              <div className="ttlimit">{t("score")}</div>
              <div style={{ width: "100%", height: 6, borderRadius: 999, background: "var(--bg3)", overflow: "hidden", marginTop: 8 }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "var(--gc)" }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="sec-card" data-testid="sushi-do-active-flavors">
        <div className="flbl">{t("sushiDoFlavors")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {activeFlavors.map((flavor) => (
            <div key={flavor.key} className="pill" style={{ padding: "8px 10px", display: "flex", gap: 6, alignItems: "center" }}>
              <span>{flavor.label}</span>
              <span style={{ color: "var(--tx2)", fontSize: ".72rem" }}>{flavor.points}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-card" data-testid="sushi-do-round-number" style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div className="flbl">{t("roundLabel")}</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{currentRound}</div>
        </div>
        {winner && (
          <div style={{ textAlign: "right", color: "var(--tx2)" }}>
            <div>{t("winner")}</div>
            <div style={{ color: "var(--tx)", fontWeight: 700 }}>{winner}</div>
          </div>
        )}
      </div>

      {!gameOver && (
        <div className="sec-card" style={{ marginTop: 12 }}>
          <div className="flbl">{t("sushiDoCallerPrompt")}</div>
          <div style={{ color: "var(--tx2)", fontSize: ".82rem", marginTop: 8 }}>
            {selectedCallerId ? `${t("sushiDoSelectedCaller")}: ${playerNameMap[selectedCallerId]}` : t("whoWonRoundQ")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            <button className="btnpri" data-testid="sushi-do-resolve-success" disabled={!selectedCallerId} onClick={() => setResolutionMode("success")} style={{ margin: 0 }}>
              {t("sushiDoResolveSuccess")}
            </button>
            <button
              className="btnsec"
              data-testid="sushi-do-resolve-penalty"
              disabled={!selectedCallerId}
              onClick={() => setResolutionMode("penalty")}
              style={{ margin: 0, color: "#E63946", borderColor: "rgba(230,57,70,.4)" }}
            >
              {t("sushiDoResolvePenalty")}
            </button>
          </div>

          {resolutionMode === "success" && selectedCallerId && (
            <div style={{ marginTop: 12 }}>
              <div className="flbl">{playerNameMap[selectedCallerId]}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 10 }}>
                {activeFlavors.map((flavor) => (
                  <button
                    key={flavor.key}
                    className="btnsec"
                    data-testid={`sushi-do-flavor-option-${flavor.key}`}
                    onClick={() => applySuccess(flavor.key)}
                    style={{ margin: 0, textAlign: "left" }}
                  >
                    <div style={{ fontWeight: 700 }}>{flavor.label}</div>
                    <div style={{ color: "var(--tx2)", fontSize: ".72rem" }}>{flavor.points} {t("ptsLabel")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {resolutionMode === "penalty" && selectedCallerId && (
            <div style={{ marginTop: 12 }}>
              <div className="flbl">{playerNameMap[selectedCallerId]}</div>
              <div style={{ color: "var(--tx2)", fontSize: ".78rem", marginTop: 6 }}>{t("sushiDoPenaltyConfirm")}</div>
              <button
                className="btnsec"
                data-testid="sushi-do-confirm-penalty"
                onClick={applyPenalty}
                style={{ marginTop: 10, color: "#E63946", borderColor: "rgba(230,57,70,.4)" }}
              >
                {t("sushiDoConfirmPenalty")}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="sec-card" style={{ marginTop: 12 }} data-testid="sushi-do-round-log">
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

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btnsec" data-testid="sushi-do-undo" disabled={undoStack.length === 0} onClick={undoLastEvent} style={{ flex: 1, margin: 0 }}>
          {t("undo")}
        </button>
      </div>

      {gameOver && (
        <div className="sec-card" data-testid="sushi-do-game-over" style={{ marginTop: 12 }}>
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
