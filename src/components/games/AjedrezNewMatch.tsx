import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import SaveGroupButton from "../ui/SaveGroupButton";
import GroupPicker from "../ui/GroupPicker";
import PillSwitch from "../ui/PillSwitch";

interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

interface ChessHistoryEntry {
  winner: string | null;
  isDraw: boolean;
  condition: EndConditionId;
  clocks: [number, number];
  time: string;
}

interface AjedrezDraft {
  p1?: string;
  p2?: string;
  timePreset?: number;
  useTimer?: boolean;
  gameActive?: boolean;
  turn?: 0 | 1;
  clocks?: [number, number];
  paused?: boolean;
  gameOver?: boolean;
  wins?: [number, number];
  draws?: number;
  rounds?: number;
  history?: ChessHistoryEntry[];
}

interface AjedrezSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
}

interface AjedrezNewMatchProps {
  onSave: (match: AjedrezSavePayload) => void;
  knownNames: string[];
  draft?: AjedrezDraft | null;
  onDraftChange?: (draft: AjedrezDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

type EndConditionId = "checkmate" | "resign" | "timeout" | "stalemate" | "agreement" | "repetition" | "50moves" | "material";

const TIME_PRESETS = [
  { label: "1'", secs: 60 },
  { label: "3'", secs: 180 },
  { label: "5'", secs: 300 },
  { label: "10'", secs: 600 },
  { label: "15'", secs: 900 },
  { label: "30'", secs: 1800 },
  { label: "∞", secs: 0 },
] as const;

const END_CONDITIONS: Array<{ id: EndConditionId; emoji: string; label_key: string }> = [
  { id: "checkmate", emoji: "♚", label_key: "chessCheckmate" },
  { id: "resign", emoji: "🏳️", label_key: "chessResign" },
  { id: "timeout", emoji: "⏱️", label_key: "chessTimeout" },
  { id: "stalemate", emoji: "🤝", label_key: "chessStalemate" },
  { id: "agreement", emoji: "✋", label_key: "chessAgreement" },
  { id: "repetition", emoji: "🔄", label_key: "chessRepetition" },
  { id: "50moves", emoji: "📋", label_key: "chess50moves" },
  { id: "material", emoji: "⚖️", label_key: "chessMaterial" },
];

const DRAW_CONDITIONS = new Set<EndConditionId>(["stalemate", "agreement", "repetition", "50moves", "material"]);

function fmt(secs: number) {
  if (secs <= 0) return "0:00";
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function AjedrezNewMatch({
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  playerGroups = [],
  onSavePlayerGroups,
}: AjedrezNewMatchProps) {
  const linkedP1Name = linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === "p1")?.name || "";
  const linkedP2Name = linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === "p2")?.name || "";

  const [p1, setP1] = useState(draft?.p1 || linkedP1Name || "");
  const [p2, setP2] = useState(draft?.p2 || linkedP2Name || "");
  const [timePreset, setTimePreset] = useState(draft?.timePreset ?? 300);
  const [useTimer, setUseTimer] = useState(draft?.useTimer ?? true);
  const [gameActive, setGameActive] = useState(draft?.gameActive || false);
  const [turn, setTurn] = useState<0 | 1>(draft?.turn ?? 0);
  const [clocks, setClocks] = useState<[number, number]>(draft?.clocks || [timePreset, timePreset]);
  const [paused, setPaused] = useState(true);
  const [gameOver, setGameOver] = useState(draft?.gameOver || false);
  const [endCond, setEndCond] = useState<EndConditionId | null>(null);
  const [endWinner, setEndWinner] = useState<0 | 1 | null>(null);
  const [wins, setWins] = useState<[number, number]>(draft?.wins || [0, 0]);
  const [draws, setDraws] = useState(draft?.draws || 0);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<ChessHistoryEntry[]>(draft?.history || []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const labels = useMemo(
    () => [p1.trim() || t("chessPlayer1").split(" (")[0], p2.trim() || t("chessPlayer2").split(" (")[0]] as const,
    [p1, p2, t],
  );
  const sameNames = Boolean(p1.trim() && p2.trim() && p1.trim().toLowerCase() === p2.trim().toLowerCase());
  const canStart = Boolean(p1.trim() && p2.trim() && !sameNames);

  const validGroups = useMemo(
    () => playerGroups.filter((group) => Array.isArray(group.players) && group.players.length === 2),
    [playerGroups],
  );

  const handleGroupLoad = useCallback(
    (players: Array<{ name: string }>, linked: LinkedPlayer[]) => {
      setGameActive(false);
      setGameOver(false);
      setEndCond(null);
      setEndWinner(null);
      setPaused(true);
      setWins([0, 0]);
      setDraws(0);
      setRounds(0);
      setHistory([]);
      if (players[0]) setP1(players[0].name);
      if (players[1]) setP2(players[1].name);
      const nextLinked: LinkedPlayer[] = [];
      if (linked[0]) nextLinked.push({ ...linked[0], playerId: "p1" });
      if (linked[1]) nextLinked.push({ ...linked[1], playerId: "p2" });
      onLinkedPlayersChange(nextLinked);
      haptic("light");
    },
    [onLinkedPlayersChange],
  );

  useEffect(() => {
    if (gameActive || rounds > 0 || p1.trim() || p2.trim()) {
      onDraftChange?.({ p1, p2, timePreset, useTimer, gameActive, turn, clocks, gameOver, wins, draws, rounds, history });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [clocks, draws, gameActive, gameOver, history, onDraftChange, p1, p2, rounds, timePreset, turn, useTimer, wins]);

  useEffect(() => {
    if (!p1 && linkedP1Name) setP1(linkedP1Name);
  }, [linkedP1Name, p1]);

  useEffect(() => {
    if (!p2 && linkedP2Name) setP2(linkedP2Name);
  }, [linkedP2Name, p2]);

  useEffect(() => {
    if (!useTimer || !gameActive || paused || gameOver) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setClocks((currentClocks) => {
        const next = [...currentClocks] as [number, number];
        next[turn] = Math.max(0, next[turn] - 1);
        if (next[turn] === 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPaused(true);
          setGameOver(true);
          setEndCond("timeout");
          setEndWinner(turn === 0 ? 1 : 0);
          haptic("strong");
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameActive, gameOver, paused, turn, useTimer]);

  const startGame = () => {
    setClocks([timePreset, timePreset]);
    setGameActive(true);
    setTurn(0);
    setPaused(true);
    setGameOver(false);
    setEndCond(null);
    setEndWinner(null);
    haptic("medium");
  };

  const tapClock = (idx: 0 | 1) => {
    if (gameOver || !gameActive) return;
    if (idx !== turn) return;
    haptic("light");
    setTurn((currentTurn) => (1 - currentTurn) as 0 | 1);
    setPaused(false);
  };

  const togglePause = () => {
    if (gameOver) return;
    setPaused((currentPaused) => !currentPaused);
    haptic("light");
  };

  const confirmResult = useCallback(
    (condId: EndConditionId, winnerIdx: 0 | 1 | null) => {
      if (!condId) return;
      const isDraw = DRAW_CONDITIONS.has(condId);
      const actualWinner = isDraw ? null : winnerIdx;
      const nextWins = [...wins] as [number, number];
      let nextDraws = draws;
      if (actualWinner !== null) nextWins[actualWinner] += 1;
      else nextDraws += 1;

      const snapshot: ChessHistoryEntry = {
        winner: actualWinner !== null ? labels[actualWinner] : null,
        isDraw,
        condition: condId,
        clocks: [...clocks] as [number, number],
        time: new Date().toISOString(),
      };

      setWins(nextWins);
      setDraws(nextDraws);
      setRounds((currentRounds) => currentRounds + 1);
      setHistory((currentHistory) => [...currentHistory, snapshot]);
      setGameOver(true);
      setEndCond(condId);
      setEndWinner(actualWinner);
      setPaused(true);
      haptic("strong");
    },
    [clocks, draws, labels, wins],
  );

  const handleSave = () => {
    const winner = wins[0] > wins[1] ? labels[0] : wins[1] > wins[0] ? labels[1] : null;
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: [
        { name: labels[0], score: wins[0] },
        { name: labels[1], score: wins[1] },
      ],
      winner,
      rounds,
    });
    haptic("strong");
  };

  const newGame = () => {
    setGameActive(false);
    setGameOver(false);
    setEndCond(null);
    setEndWinner(null);
    setPaused(true);
    setClocks([timePreset, timePreset]);
    setTurn(0);
    haptic("medium");
  };

  const condLabel = (id: EndConditionId) => t(END_CONDITIONS.find((condition) => condition.id === id)?.label_key || id) || id;

  const clockBg = (idx: 0 | 1) => {
    if (gameOver) return "var(--content-surface-strong)";
    if (!gameActive) return "var(--content-surface-strong)";
    if (idx === turn && !paused) return "color-mix(in srgb,var(--gc) 12%,var(--content-surface-strong))";
    return "var(--content-surface)";
  };

  const clockBorder = (idx: 0 | 1) => {
    if (gameOver) return "1.5px solid var(--content-border)";
    if (idx === turn && !paused) return "1.5px solid var(--gc)";
    if (idx === turn && paused && gameActive) return "1.5px solid color-mix(in srgb,var(--gc) 40%,var(--content-border))";
    return "1.5px solid var(--content-border)";
  };

  const clockColor = (idx: 0 | 1) => {
    if (useTimer && clocks[idx] <= 10 && clocks[idx] > 0) return "#E63946";
    if (idx === turn && !paused) return "var(--gc)";
    return "var(--tx)";
  };

  return (
    <div>
      {!gameActive && (
        <div className="sec">
          <span className="flbl">{t("players")} (1v1)</span>

          {validGroups.length > 0 && <GroupPicker t={t} playerGroups={validGroups} maxPlayers={2} gameId="ajedrez" maxGroupSize={2} onLoad={handleGroupLoad} />}

          <div className="rgap">
            <LinkedPlayerInput
              value={p1}
              linkedUid={(linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === "p1") || {}).uid}
              linkedName={(linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === "p1") || {}).name}
              onChange={setP1}
              onLink={({ uid, name }) => {
                setP1(name);
                onLinkedPlayersChange([...linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== "p1"), { uid, name, playerId: "p1" }]);
              }}
              onUnlink={() => onLinkedPlayersChange(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== "p1"))}
              placeholder={t("chessPlayer1")}
              knownNames={knownNames}
              t={t}
              allLinkedUids={linkedPlayers.map((linkedPlayer) => linkedPlayer.uid)}
            />
            <div style={{ textAlign: "center", fontSize: ".85rem", color: "var(--tx3)", fontWeight: 800, letterSpacing: "3px" }}>VS</div>
            <LinkedPlayerInput
              value={p2}
              linkedUid={(linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === "p2") || {}).uid}
              linkedName={(linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === "p2") || {}).name}
              onChange={setP2}
              onLink={({ uid, name }) => {
                setP2(name);
                onLinkedPlayersChange([...linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== "p2"), { uid, name, playerId: "p2" }]);
              }}
              onUnlink={() => onLinkedPlayersChange(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== "p2"))}
              placeholder={t("chessPlayer2")}
              knownNames={knownNames}
              t={t}
              allLinkedUids={linkedPlayers.map((linkedPlayer) => linkedPlayer.uid)}
            />
          </div>

          <SaveGroupButton
            t={t}
            players={[
              { id: "p1", name: p1 },
              { id: "p2", name: p2 },
            ].filter((player) => player.name.trim())}
            linkedPlayers={linkedPlayers}
            playerGroups={playerGroups}
            onSave={onSavePlayerGroups}
          />

          {sameNames && (
            <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, textAlign: "center", fontWeight: 600 }}>
              {t("dupPlayerWarning")}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div className="detail-toggle-row" style={{ marginBottom: useTimer ? 10 : 0 }}>
              <div className="detail-toggle-copy">
                <span className="detail-toggle-label">{t("chessUseTimer")}</span>
              </div>
              <PillSwitch
                enabled={useTimer}
                onToggle={setUseTimer}
                ariaLabel={t("chessUseTimer")}
                testId="chess-timer-toggle"
              />
            </div>

            {useTimer && (
              <div className="pillrow" style={{ flexWrap: "wrap", gap: 6 }}>
                {TIME_PRESETS.map(({ label, secs }) => (
                  <button
                    key={label}
                    onClick={() => setTimePreset(secs)}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 14px",
                      borderRadius: "var(--rxs)",
                      cursor: "pointer",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      letterSpacing: "1.5px",
                      border: `1.5px solid ${timePreset === secs ? "var(--gc)" : "var(--content-border)"}`,
                      background:
                        timePreset === secs ? "color-mix(in srgb,var(--gc) 18%,var(--content-surface-strong))" : "var(--content-surface-strong)",
                      color: timePreset === secs ? "var(--gc)" : "var(--tx)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {canStart && (
            <button className="btnpri" style={{ marginTop: 14 }} onClick={startGame}>
              {t("chessStartMatch")}
            </button>
          )}
        </div>
      )}

      {(gameActive || rounds > 0) && (
        <div className="tscores" style={{ marginBottom: 16 }}>
          {labels.map((name, index) => (
            <div
              key={name}
              className="tcard"
              style={{
                border: `2px solid ${endWinner === index ? "var(--gc)" : endWinner !== null && endWinner !== index ? "#E63946" : "var(--content-border)"}`,
                transition: "border-color .3s",
              }}
            >
              <div className="ttname">{index === 0 ? "♙" : "♟"} {name}</div>
              <div className="ttscore" style={{ color: wins[index] > wins[1 - index] ? "var(--gc)" : "var(--tx)" }}>{wins[index]}</div>
              <div className="ttlimit">{t("chessWins")}</div>
            </div>
          ))}
          {draws > 0 && (
            <div className="tcard" style={{ flex: "0 0 auto", minWidth: 60 }}>
              <div className="ttname" style={{ fontSize: ".6rem" }}>{t("chessDrawShort")}</div>
              <div className="ttscore">{draws}</div>
              <div className="ttlimit"></div>
            </div>
          )}
        </div>
      )}

      {gameActive && useTimer && (
        <div className="detail-clock-grid">
          {[0, 1].map((idx) => {
            const playerIndex = idx as 0 | 1;
            const active = playerIndex === turn && !paused && !gameOver;
            const low = clocks[playerIndex] <= 10 && clocks[playerIndex] > 0;
            const outOfTime = clocks[playerIndex] === 0;
            return (
              <div
                key={playerIndex}
                onClick={() => tapClock(playerIndex)}
                className={`detail-clock-card${playerIndex === turn && !gameOver ? " clickable" : ""}${active ? " active" : ""}${outOfTime ? " out" : ""}`}
                style={{ background: clockBg(playerIndex), border: clockBorder(playerIndex) }}
              >
                <div className={`detail-clock-name${active ? " active" : ""}${outOfTime ? " out" : ""}`}>
                  {playerIndex === 0 ? `♙ ${labels[0]}` : `♟ ${labels[1]}`}
                </div>
                <div
                  className={`detail-clock-time${timePreset === 0 ? " infinity" : ""}${low ? " low" : ""}`}
                  style={{ color: clockColor(playerIndex), animation: low && active ? "pulse 1s ease-in-out infinite" : "none" }}
                >
                  {timePreset === 0 ? "∞" : fmt(clocks[playerIndex])}
                </div>
                {playerIndex === turn && !gameOver && (
                  <div className="detail-clock-hint">{paused ? t("chessTapToStart") : t("chessTapToSwitch")}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {gameActive && !gameOver && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className="btnsec" style={{ flex: 1 }} onClick={togglePause}>
            {paused ? t("chessResume") : t("chessPause")}
          </button>
          <button
            className="btnsec"
            onClick={() => {
              setPaused(true);
              setGameOver(true);
              haptic("medium");
            }}
            style={{ color: "#E63946", borderColor: "#E63946" }}
          >
            {t("chessFinish")}
          </button>
        </div>
      )}

      {gameActive && gameOver && (
        <div className="sec-card">
          {endCond && endWinner !== null && (
            <div className="detail-result-summary">
              <div className="detail-result-emoji">{END_CONDITIONS.find((condition) => condition.id === endCond)?.emoji}</div>
              <div className="detail-result-title">{condLabel(endCond)}</div>
              <div className="detail-result-meta">{t("chessWonBy").replace("{name}", labels[endWinner])}</div>
            </div>
          )}

          {!endCond && (
            <>
              <span className="flbl" style={{ marginBottom: 8 }}>{t("chessHowEnded")}</span>

              <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: "2px", color: "var(--tx3)", textTransform: "uppercase", marginBottom: 6 }}>
                {t("chessWithWinner")}
              </div>
              <div className="detail-choice-grid" style={{ marginBottom: 12 }}>
                {END_CONDITIONS.filter((condition) => !DRAW_CONDITIONS.has(condition.id)).map((condition) => (
                  <button
                    key={condition.id}
                    onClick={() => { setEndCond(condition.id); setEndWinner(null); }}
                    className={`detail-choice-btn${endCond === condition.id ? " active" : ""}`}
                  >
                    <span style={{ fontSize: "1rem" }}>{condition.emoji}</span>
                    {condLabel(condition.id)}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: "2px", color: "var(--tx3)", textTransform: "uppercase", marginBottom: 6 }}>
                {t("chessDraws")}
              </div>
              <div className="detail-choice-grid" style={{ marginBottom: 14 }}>
                {END_CONDITIONS.filter((condition) => DRAW_CONDITIONS.has(condition.id)).map((condition) => (
                  <button key={condition.id} onClick={() => confirmResult(condition.id, null)} className="detail-choice-btn">
                    <span style={{ fontSize: "1rem" }}>{condition.emoji}</span>
                    {condLabel(condition.id)}
                  </button>
                ))}
              </div>
            </>
          )}

          {endCond && !DRAW_CONDITIONS.has(endCond) && endWinner === null && (
            <>
              <span className="flbl" style={{ marginBottom: 6 }}>{t("chessWhoWon")}</span>
              <div className="wnrbtns" style={{ marginBottom: 0 }}>
                {labels.map((name, index) => (
                  <button
                    key={name}
                    className="wnrbtn"
                    onClick={() => confirmResult(endCond, index as 0 | 1)}
                    style={{
                      border: `2px solid ${endWinner === index ? "var(--gc)" : "var(--content-border)"}`,
                      background: endWinner === index ? "color-mix(in srgb,var(--gc) 12%,var(--content-surface-strong))" : "var(--content-surface)",
                      color: endWinner === index ? "var(--gc)" : "var(--tx)",
                    }}
                  >
                    {index === 0 ? "♙" : "♟"} {name}
                  </button>
                ))}
              </div>
            </>
          )}

          {endCond && endWinner !== null && rounds > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btnsec" style={{ flex: 1 }} onClick={newGame}>{t("chessAnotherGame")}</button>
            </div>
          )}

          {endCond && DRAW_CONDITIONS.has(endCond) && (
            <div className="detail-result-summary draw">
              <div className="detail-result-emoji">🤝</div>
              <div className="detail-result-title draw">{condLabel(endCond)} — {t("chessDrawShort")}</div>
              <button className="btnsec" style={{ marginTop: 10, width: "100%" }} onClick={newGame}>{t("chessAnotherGame")}</button>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="detail-session-history">
          <div className="detail-session-history-title">{t("chessMatchHistory")}</div>
          {history.map((entry, index) => (
            <div key={`${index}-${entry.condition}-${entry.winner || "draw"}`} className="detail-session-history-row">
              <span style={{ fontSize: ".75rem", color: "var(--tx3)", fontFamily: "'Bebas Neue',sans-serif", minWidth: 20 }}>#{index + 1}</span>
              <span style={{ fontSize: ".8rem", fontWeight: 600, flex: 1, color: "var(--tx)" }}>
                {entry.isDraw ? t("chessDraw") : `🏆 ${entry.winner}`}
              </span>
              <span style={{ fontSize: ".7rem", color: "var(--tx3)" }}>
                {END_CONDITIONS.find((condition) => condition.id === entry.condition)?.emoji} {condLabel(entry.condition)}
              </span>
            </div>
          ))}
        </div>
      )}

      {rounds > 0 && (
        <button className="btnpri" style={{ marginTop: 8 }} onClick={handleSave}>
          {t("saveMatch")}
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:.4; }
        }
      `}</style>
    </div>
  );
}

export default memo(AjedrezNewMatch)
