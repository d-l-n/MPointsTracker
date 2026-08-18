import { memo, useEffect, useRef, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { GameDefinition, LinkedPlayer, Match, PlayerGroup, TranslationFn, UnoRosterEvent } from "../../types";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import ConfirmModal from "../ui/ConfirmModal";
import DiscardMatchButton from "../ui/DiscardMatchButton";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import MercyEliminator from "./MercyEliminator";
import { SCORE_TABLES } from "../../data/scoreTables";
import Tooltip from "../ui/Tooltip";
import { Trash } from "reicon-react";

interface PlayerInputState {
  id: string;
  name: string;
}

interface UnoRoundInput {
  [key: string]: string | number | undefined;
}

interface UnoRoundLogEntry {
  type: "round" | "elim";
  label: string;
  pts?: number;
  roundNum?: number;
  causer?: string;
}

interface UnoRoundHistoryEntry {
  type?: "elim";
  winnerId?: string;
  pts?: number;
  roundInputSnap?: UnoRoundInput;
  elimSnap: string[];
  scoreSnap: Record<string, number>;
  elimId?: string;
  causerId?: string;
}

interface UnoDraft {
  players?: PlayerInputState[];
  scores?: Record<string, number>;
  roundInput?: UnoRoundInput;
  eliminated?: string[];
  inactivePlayers?: string[];
  rounds?: number;
  history?: UnoRoundHistoryEntry[];
  roundLog?: UnoRoundLogEntry[];
  rosterEvents?: UnoRosterEvent[];
}

interface UnoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  inactivePlayers?: string[];
  rosterEvents?: UnoRosterEvent[];
}

interface UnoNewMatchProps {
  game: GameDefinition;
  onSave: (match: UnoSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  onBack?: () => void;
  t?: TranslationFn;
  draft?: UnoDraft | null;
  onDraftChange?: (draft: UnoDraft | null) => void;
}

interface FloatingScore {
  id: string;
  pts: string;
  x: number;
  y: number;
}

interface RoundFeedback {
  name: string;
  pts: number;
}

type ScoreTableEntry = {
  rows?: Array<{ key: string; label: string; mult?: number }>;
  sides?: Array<{ label: string; rows: Array<{ key: string; label: string; mult?: number }> }>;
  calc: (roundInput: UnoRoundInput) => number;
};

function UnoNewMatch({
  game,
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  playerGroups = [],
  onSavePlayerGroups,
  onBack,
  t = ((key: string) => key) as TranslationFn,
  draft = null,
  onDraftChange,
}: UnoNewMatchProps) {
  const WIN = game.winScore || 0;
  const isNM = game.type === "uno_nomercy";
  const isFlip = game.type === "uno_flip";
  const table = ((SCORE_TABLES as Record<string, ScoreTableEntry>)[game.type] || (SCORE_TABLES as Record<string, ScoreTableEntry>).uno_classic) as ScoreTableEntry;

  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [scores, setScores] = useState<Record<string, number>>(draft?.scores || {});
  const [roundInput, setRoundInput] = useState<UnoRoundInput>(draft?.roundInput || {});
  const [eliminated, setEliminated] = useState<string[]>(draft?.eliminated || []);
  const [inactivePlayers, setInactivePlayers] = useState<string[]>(draft?.inactivePlayers || []);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<UnoRoundHistoryEntry[]>(draft?.history || []);
  const [roundLog, setRoundLog] = useState<UnoRoundLogEntry[]>(draft?.roundLog || []);
  const [rosterEvents, setRosterEvents] = useState<UnoRosterEvent[]>(draft?.rosterEvents || []);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PlayerInputState | null>(null);
  const [inProgress, setInProgress] = useState(draft ? draft.rounds! > 0 || (draft.eliminated || []).length > 0 || (draft.inactivePlayers || []).length > 0 || (draft.rosterEvents || []).length > 0 : false);
  const [pendingMercyElim, setPendingMercyElim] = useState(false);
  const [roundFeedback, setRoundFeedback] = useState<RoundFeedback | null>(null);
  const [floats, setFloats] = useState<FloatingScore[]>([]);
  const [showRoundLog, setShowRoundLog] = useState(false);

  const [showRosterEditor, setShowRosterEditor] = useState(false);
  const [pendingJoinPlayers, setPendingJoinPlayers] = useState<PlayerInputState[]>([]);
  const [pendingLeavePlayerId, setPendingLeavePlayerId] = useState<string | null>(null);
  const sbRef = useRef<HTMLDivElement | null>(null);
  const floatTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const named = players.filter((player) => player.name.trim());
  const active = named.filter((player) => !eliminated.includes(player.id) && !inactivePlayers.includes(player.id));
  const pendingLeavePlayer = pendingLeavePlayerId ? players.find((player) => player.id === pendingLeavePlayerId) || null : null;
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(nameCount).some((value) => value > 1);

  const setRoundField = (key: string, value: string) => setRoundInput((current) => ({ ...current, [key]: value }));
  const totalRoundPoints = table.calc(roundInput);

  useEffect(() => {
    if (!onDraftChange) return;
    if (inProgress || rounds > 0 || eliminated.length > 0 || inactivePlayers.length > 0 || rosterEvents.length > 0 || players.some(p => p.name.trim())) {
      onDraftChange({ players, scores, roundInput, eliminated, inactivePlayers, rounds, history, roundLog, rosterEvents });
    } else if (draft) {
      onDraftChange(null);
    }
  }, [eliminated, history, inactivePlayers, inProgress, onDraftChange, players, roundInput, roundLog, rounds, rosterEvents, scores]);

  useEffect(() => {
    const timers = floatTimersRef.current;
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const spawnFloat = (name: string, pts: number) => {
    if (!sbRef.current) return;
    const rows = sbRef.current.querySelectorAll(".sbrow");
    let targetRow: Element | null = null;
    rows.forEach((row) => {
      if (row.textContent?.includes(name)) targetRow = row;
    });
    if (!targetRow) return;
    const rect = (targetRow as HTMLElement).getBoundingClientRect();
    const parentRect = sbRef.current.getBoundingClientRect();
    const id = mkId();
    setFloats((currentFloats) => [...currentFloats, { id, pts: `+${pts}`, x: rect.right - parentRect.left - 55, y: rect.top - parentRect.top }]);
    floatTimersRef.current[id] = setTimeout(() => {
      setFloats((currentFloats) => currentFloats.filter((floatingScore) => floatingScore.id !== id));
      delete floatTimersRef.current[id];
    }, 950);
  };

  const joinPlayer = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const id = mkId();
    setPlayers((currentPlayers) => [...currentPlayers, { id, name: trimmedName }]);
    setScores((currentScores) => ({ ...currentScores, [id]: 0 }));
    setRosterEvents((currentEvents) => [
      ...currentEvents,
      {
        type: "join",
        playerId: id,
        playerName: trimmedName,
        effectiveRound: rounds + 1,
      },
    ]);
    setInProgress(true);
  };

  const leavePlayerKeepRecord = (playerId: string) => {
    const player = players.find((currentPlayer) => currentPlayer.id === playerId);
    if (!player || inactivePlayers.includes(playerId)) return;
    setInactivePlayers((currentPlayers) => [...currentPlayers, playerId]);
    setRosterEvents((currentEvents) => [
      ...currentEvents,
      {
        type: "leave",
        playerId,
        playerName: player.name,
        effectiveRound: rounds + 1,
        retentionMode: "keep-record",
      },
    ]);
    setPendingLeavePlayerId(null);
    setShowRosterEditor(false);
  };

  const saveRosterChanges = () => {
    pendingJoinPlayers
      .map((player) => player.name.trim())
      .filter(Boolean)
      .forEach((name) => joinPlayer(name));
    setPendingJoinPlayers([]);
    setShowRosterEditor(false);
  };

  const commitRound = (winnerId: string) => {
    const pts = totalRoundPoints;
    const winnerName = named.find((player) => player.id === winnerId)?.name || "";
    const nextScores = { ...scores, [winnerId]: (scores[winnerId] || 0) + pts };
    setScores(nextScores);
    const nextRounds = rounds + 1;
    setRounds(nextRounds);
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        winnerId,
        pts,
        roundInputSnap: { ...roundInput },
        elimSnap: [...eliminated],
        scoreSnap: { ...scores },
      },
    ]);
    setRoundLog((currentLog) => [...currentLog, { type: "round", label: winnerName, pts, roundNum: nextRounds }]);
    setRoundInput({});
    setInProgress(true);
    setRoundFeedback({ name: winnerName, pts });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setRoundFeedback(null);
      feedbackTimerRef.current = null;
    }, 2800);
    if (pts > 0) spawnFloat(winnerName, pts);
    if (nextScores[winnerId] >= WIN) {
      setWinner(named.find((player) => player.id === winnerId) || null);
      setGameOver(true);
    }
  };

  const eliminatePlayer = (elimId: string, causerId?: string | null) => {
    const nextEliminated = [...eliminated, elimId];
    setEliminated(nextEliminated);
    let nextScores = { ...scores };
    if (causerId) {
      nextScores = { ...nextScores, [causerId]: (nextScores[causerId] || 0) + 250 };
      setScores(nextScores);
      const causerName = named.find((player) => player.id === causerId)?.name || "";
      spawnFloat(causerName, 250);
    }
    const elimName = named.find((player) => player.id === elimId)?.name || "";
    const causerName = named.find((player) => player.id === causerId)?.name || "";
    setHistory((currentHistory) => [...currentHistory, { type: "elim", elimId, causerId: causerId || undefined, elimSnap: [...eliminated], scoreSnap: { ...scores } }]);
    setRoundLog((currentLog) => [...currentLog, { type: "elim", label: elimName, causer: causerName }]);
    setInProgress(true);
    const remaining = active.filter((player) => player.id !== elimId);
    if (remaining.length === 1) {
      setWinner(named.find((player) => player.id === remaining[0].id) || null);
      setGameOver(true);
    } else if (causerId && nextScores[causerId] >= WIN) {
      setWinner(named.find((player) => player.id === causerId) || null);
      setGameOver(true);
    }
  };

  const undoLast = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    if (last.type === "elim") {
      setEliminated(last.elimSnap);
      setScores(last.scoreSnap);
    } else {
      setScores(last.scoreSnap);
      setEliminated(last.elimSnap);
      setRounds((currentRounds) => currentRounds - 1);
      setRoundInput(last.roundInputSnap || {});
    }
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    setRoundLog((currentLog) => currentLog.slice(0, -1));
    setGameOver(false);
    setWinner(null);
    setRoundFeedback(null);
    if (history.length <= 1) setInProgress(false);
  };

  const canSaveProgress = gameOver || rounds > 0;

  const handleSave = (winnerOverride?: string | null) => {
    const sortedPlayers = [...named].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0));
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sortedPlayers.map((player) => ({ name: player.name, score: scores[player.id] || 0 })),
      winner: winnerOverride === undefined ? (winner ? winner.name : sortedPlayers[0]?.name || null) : winnerOverride,
      rounds,
      inactivePlayers: [...inactivePlayers],
      rosterEvents: [...rosterEvents],
    });
  };

  const sorted = [...named].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0));

  const renderRoundFields = () => {
    if (isFlip && table.sides) {
      return table.sides.map((side) => (
        <div key={side.label}>
          <div className="rdside-label">{side.label}</div>
          {side.rows.map((row) => (
            <div className="rdfrow" key={row.key} style={{ marginBottom: "4px" }}>
              <input
                className="rdinp"
                name="uno-round-score"
                type="number"
                value={(roundInput[row.key] as string) || ""}
                onChange={(event) => setRoundField(row.key, event.target.value)}
              />
              <span className="rdlbl">{row.label}{row.mult ? ` ×${row.mult}` : ""}</span>
            </div>
          ))}
        </div>
      ));
    }

    return (table.rows || []).map((row) => (
      <div className="rdfrow" key={row.key}>
        <input
          className="rdinp"
          name="uno-round-score"
          type="number"
          min="0"
          placeholder="0"
          aria-label={row.label}
          value={(roundInput[row.key] as string) || ""}
          onChange={(event) => setRoundField(row.key, event.target.value)}
        />
        <span className="rdlbl">{row.label}{row.mult ? ` ×${row.mult}` : ""}</span>
      </div>
    ));
  };

  return (
    <div>
      {pendingLeavePlayer && (
        <ConfirmModal
          title={t("removePlayer")}
          msg={`${pendingLeavePlayer.name} · ${t("keepPlayerRecord")}`}
          confirmLabel={t("keepPlayerRecord")}
          cancelLabel={t("cancel")}
          confirmTestId="keep-player-record"
          onConfirm={() => leavePlayerKeepRecord(pendingLeavePlayer.id)}
          onCancel={() => setPendingLeavePlayerId(null)}
        />
      )}

      {!inProgress && (
        <div className="sec">
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={10}
            gameId={game.id}
            onLoad={(groupPlayers, groupLinkedPlayers) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinkedPlayers as LinkedPlayer[]);
            }}
            onDiscard={() => {
              setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
              setScores({});
              setEliminated([]);
              setInactivePlayers([]);
              setRounds(0);
              setHistory([]);
              setGameOver(false);
              setWinner(null);
              setInProgress(false);
              setRoundLog([]);
              setRosterEvents([]);
              setPendingJoinPlayers([]);
              setShowRosterEditor(false);
              setRoundInput({});
              onLinkedPlayersChange([]);
            }}
            hasPlayers={inProgress || rounds > 0 || named.length > 0}
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
                {players.length > 2 && player.name.trim() && (
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
          {players.length < 10 && (
            <button className="btndash" onClick={() => setPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])} data-testid="add-player">
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
          {hasDuplicates && (
            <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, fontWeight: 600 }}>
              {t("dupPlayerWarning")}
            </div>
          )}
        </div>
      )}

      {named.length >= 2 && (
        <div className="slegend">
          {isFlip ? (
            <span>{t("flipLightLegend")}<br />{t("flipDarkLegend")}<br /></span>
          ) : (
            (table.rows || []).map((row) => <span key={row.key}>{row.label}: {row.mult ? `${row.mult} pts` : "nominal"} · </span>)
          )}
          <strong>{t("meta")}: {WIN} pts</strong>
          {isNM && <span> · {t("eliminated")}: +250 {t("elimBonusTo")}</span>}
        </div>
      )}

      {named.length >= 2 && !hasDuplicates && (
        <div className="sb" ref={sbRef}>
          {floats.map((floatingScore) => (
            <span key={floatingScore.id} className="float-score" style={{ top: floatingScore.y, left: floatingScore.x }}>
              {floatingScore.pts}
            </span>
          ))}
          <div className="sbhdr">
            <span className="sbtitle">{t("scoreboard")} — {WIN}</span>
            <span className="sbround">{rounds > 0 ? `${t("roundLabel")} ${rounds}` : t("notStarted")}</span>
          </div>
          {sorted.map((player, index) => {
            const score = scores[player.id] || 0;
            const isEliminated = eliminated.includes(player.id);
            const isInactive = inactivePlayers.includes(player.id);
            return (
              <div key={player.id} className={`sbrow${player.id === winner?.id ? " win" : index === 0 && rounds > 0 && !isEliminated && !isInactive ? " lead" : ""}${isEliminated || isInactive ? " elim" : ""}`}>
                <span className="sbrank">{index + 1}</span>
                <span className="sbname">{isEliminated ? "❌ " : isInactive ? "⏸ " : player.id === winner?.id ? "🏆 " : ""}{player.name}</span>
                <div className="sbprog"><div className="sbbar" style={{ width: `${Math.min((score / WIN) * 100, 100)}%` }} /></div>
                <span className="sbscore">{score}</span>
              </div>
            );
          })}
        </div>
      )}

      {inProgress && !gameOver && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span className="flbl" style={{ marginBottom: 0 }}>{t("players")}</span>
            <button className="btnsec" data-testid="edit-roster" onClick={() => setShowRosterEditor((currentValue) => !currentValue)}>
              {showRosterEditor ? t("cancel") : t("editRoster")}
            </button>
          </div>
          {showRosterEditor && (
            <div className="rgap" style={{ marginTop: 10 }}>
              {active.map((player) => (
                <div className="irow" key={`active-${player.id}`}>
                  <div className="inp" style={{ display: "flex", alignItems: "center" }}>{player.name}</div>
                  <Tooltip text={`${t("remove")} ${player.name}`}>
                  <button
                    className="btnrm"
                    data-testid="leave-player"
                    aria-label={`${t("remove")} ${player.name}`}
                    disabled={active.length <= 2}
                    onClick={() => setPendingLeavePlayerId(player.id)}
                  >
                    <Trash size={16} />
                  </button>
                  </Tooltip>
                </div>
              ))}
              {pendingJoinPlayers.map((player, index) => (
                <div className="irow" key={`join-${player.id}`}>
                  <LinkedPlayerInput
                    value={player.name}
                    onChange={(value) => setPendingJoinPlayers((currentPlayers) => currentPlayers.map((currentPlayer) => (currentPlayer.id === player.id ? { ...currentPlayer, name: value } : currentPlayer)))}
                    onLink={({ name }) => setPendingJoinPlayers((currentPlayers) => currentPlayers.map((currentPlayer) => (currentPlayer.id === player.id ? { ...currentPlayer, name } : currentPlayer)))}
                    onUnlink={() => {}}
                    placeholder={`${t("playerN")} ${named.length + index + 1}`}
                    knownNames={knownNames}
                    t={t}
                    allLinkedUids={linkedPlayers.map((linkedPlayer) => linkedPlayer.uid)}
                  />
                </div>
              ))}
              {players.length + pendingJoinPlayers.length < 10 && (
                <button className="btndash" data-testid="add-player-in-progress" onClick={() => setPendingJoinPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])}>
                  {t("addPlayer")}
                </button>
              )}
              <button className="btnpri" data-testid="save-roster" onClick={saveRosterChanges}>
                {t("save")}
              </button>
            </div>
          )}
        </div>
      )}

      {gameOver && winner && <div className="wnr">🏆 {winner.name.toUpperCase()} {t("won")}</div>}

      {isNM && !gameOver && named.length >= 2 && active.length > 1 && (
        <MercyEliminator active={active} onEliminate={eliminatePlayer} onPendingChange={setPendingMercyElim} t={t} />
      )}

      {roundFeedback && (
        <div className="round-feedback">
          <span style={{ fontSize: "1.1rem" }}>🃏</span>
          <span className="round-feedback-name">{roundFeedback.name}</span>
          <span className="round-feedback-pts">+{roundFeedback.pts} pts</span>
        </div>
      )}

      {!gameOver && active.length >= 2 && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
            <span className="flbl" style={{ marginBottom: 0 }}>{t("cardsLeft")} — {t("roundLabel")} {rounds + 1}</span>
            {history.length > 0 && <button className="btnsec" onClick={undoLast}>{t("undo")}</button>}
          </div>
          <div className="rdinputs">
            <div className="rdrow">
              <span className="rdname">{t("allPlayers")}</span>
              <div className="rdfields">{renderRoundFields()}</div>
              <span className="rdtotal">{totalRoundPoints > 0 ? totalRoundPoints : "—"}</span>
            </div>
          </div>
          <span className="flbl" style={{ marginBottom: "6px" }}>{t("whoWon")}</span>
          {pendingMercyElim && (
            <div style={{ fontSize: ".78rem", color: "#FF8C00", fontWeight: 700, marginBottom: "8px", padding: "8px 10px", background: "color-mix(in srgb,#FF8C00 12%,transparent)", borderRadius: "var(--rxs)", border: "1px solid color-mix(in srgb,#FF8C00 30%,transparent)" }}>
              {t("confirmEliminationFirst")}
            </div>
          )}
          <div className="wnrbtns">
            {active.map((player) => (
              <button
                key={player.id}
                className="wnrbtn"
                disabled={pendingMercyElim}
                style={pendingMercyElim ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                onClick={() => {
                  if (pendingMercyElim) return;
                  haptic("light");
                  commitRound(player.id);
                }}
                data-testid={`win-button-${player.id}`}
              >
                🃏 {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {roundLog.length > 0 && (
        <>
          <button className="rlog-toggle" onClick={() => setShowRoundLog((currentValue) => !currentValue)}>
            <span>{t("roundLog")} — {roundLog.length} {t("roundLogEvents")}</span>
            <span style={{ transition: "transform .2s", display: "inline-block", transform: showRoundLog ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </button>
          {showRoundLog && (
            <div className="rlog-body">
              {[...roundLog].reverse().map((entry, index) => (
                <div className="rlog-row" key={`log-${index}-${entry.type}-${entry.label}`}>
                  <span className="rlog-num">#{roundLog.length - index}</span>
                  {entry.type === "round" ? (
                    <>
                      <span className="rlog-name">🃏 {entry.label}</span>
                      <span className="rlog-pts">+{entry.pts} pts</span>
                    </>
                  ) : (
                    <>
                      <span className="rlog-name">❌ {entry.label}</span>
                      {entry.causer && <span className="rlog-elim">💀 {entry.causer} +250</span>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <EarlyFinishSaveAction
        canSave={canSaveProgress}
        isNaturalFinish={gameOver}
        eligiblePlayers={active.map((player) => player.name)}
        onSave={(winnerOverride) => {
          haptic("strong");
          handleSave(winnerOverride);
        }}
        t={t}
        style={{ marginTop: "8px" }}
      />

      {inProgress && !gameOver && (
        <DiscardMatchButton
          t={t}
          onDiscard={() => {
            setInProgress(false);
            setScores({});
            setEliminated([]);
            setInactivePlayers([]);
            setRounds(0);
            setHistory([]);
            setRoundLog([]);
            setRosterEvents([]);
            setPendingJoinPlayers([]);
            setShowRosterEditor(false);
            setGameOver(false);
            setWinner(null);
            setRoundInput({});
            onDraftChange?.(null);
          }}
          onBack={onBack}
        />
      )}
    </div>
  );
}

export default memo(UnoNewMatch)
