import { memo, useEffect, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { GameDefinition, LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";

interface PlayerInputState {
  id: string;
  name: string;
}

interface GenericHistoryEntry {
  scores: Record<string, number>;
  roundScores: Record<string, string>;
  winnerId: string | null;
  roundLetter?: string | null;
  theme?: string | null;
  elimSnap: string[];
  betsSnap?: Record<string, string>;
  betHistorySnap?: Record<string, number>;
}

interface GenericDraft {
  players?: PlayerInputState[];
  scores?: Record<string, number>;
  roundScores?: Record<string, string>;
  roundLetter?: string;
  bastaTheme?: string;
  usedLetters?: string[];
  bets?: Record<string, string>;
  betHistory?: Record<string, number>;
  eliminated?: string[];
  rounds?: number;
  history?: GenericHistoryEntry[];
  gameOver?: boolean;
  winner?: PlayerInputState | null;
  inProgress?: boolean;
  customLimit?: number;
}

interface GenericSavePayload extends Match {
  players: Array<{ name: string; score: number; net?: number }>;
  winner: string | null;
  rounds: number;
  history?: GenericHistoryEntry[];
  bastaTheme?: string | null;
}

interface GenericConfig {
  limit: number;
  limitLabel: string;
  loseOnLimit: boolean;
  hasNeg: boolean;
  stepMode: boolean;
  hasBet: boolean;
  winLabel: string;
  allowLimitPicker?: boolean;
}

interface GenericNewMatchProps {
  game: GameDefinition;
  onSave: (match: GenericSavePayload) => void;
  knownNames: string[];
  draft?: GenericDraft | null;
  onDraftChange?: (draft: GenericDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  t?: TranslationFn;
}

const BASTA_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const BASTA_GOAL = 3;

function GenericNewMatch({
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
}: GenericNewMatchProps) {
  const isBasta = game.type === "basta_dym";
  const cfg: GenericConfig =
    {
      chinchon: { limit: 100, limitLabel: t("limitLabel"), loseOnLimit: true, hasNeg: true, stepMode: false, hasBet: false, winLabel: t("whoClosedHand") },
      rummy: { limit: 500, limitLabel: t("metaLabel"), loseOnLimit: false, hasNeg: false, stepMode: false, hasBet: false, winLabel: t("whoWonRoundQ") },
      poker: { limit: 0, limitLabel: "", loseOnLimit: false, hasNeg: false, stepMode: true, hasBet: true, winLabel: t("whoWonRoundQ") },
      blackjack: { limit: 0, limitLabel: "", loseOnLimit: false, hasNeg: false, stepMode: true, hasBet: true, winLabel: t("whoWonRoundQ") },
      generala: { limit: 0, limitLabel: "", loseOnLimit: false, hasNeg: false, stepMode: false, hasBet: false, winLabel: t("whoWonRoundQ") },
      basta_dym: {
        limit: BASTA_GOAL,
        limitLabel: t("bastaCardsHeader"),
        loseOnLimit: false,
        hasNeg: false,
        stepMode: true,
        hasBet: false,
        winLabel: t("whoWonRoundQ"),
        allowLimitPicker: false,
      },
    }[game.type] || { limit: 500, limitLabel: t("metaLabel"), loseOnLimit: false, hasNeg: false, stepMode: false, hasBet: false, winLabel: t("whoWonRoundQ") };

  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [scores, setScores] = useState<Record<string, number>>(draft?.scores || {});
  const [roundScores, setRoundScores] = useState<Record<string, string>>(draft?.roundScores || {});
  const [roundLetter, setRoundLetter] = useState(draft?.roundLetter || "");
  const [bastaTheme, setBastaTheme] = useState(draft?.bastaTheme || "");
  const [usedLetters, setUsedLetters] = useState<string[]>(draft?.usedLetters || []);
  const [bets, setBets] = useState<Record<string, string>>(draft?.bets || {});
  const [betHistory, setBetHistory] = useState<Record<string, number>>(draft?.betHistory || {});
  const [eliminated, setEliminated] = useState<string[]>(draft?.eliminated || []);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<GenericHistoryEntry[]>(draft?.history || []);
  const [gameOver, setGameOver] = useState(draft?.gameOver || false);
  const [winner, setWinner] = useState<PlayerInputState | null>(draft?.winner || null);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);
  const [customLimit, setCustomLimit] = useState(draft?.customLimit || cfg.limit);

  const named = players.filter((player) => player.name.trim());
  const active = named.filter((player) => !eliminated.includes(player.id));
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(nameCount).some((value) => value > 1);

  useEffect(() => {
    const hasRoundDraft = Boolean(roundLetter) || Boolean(bastaTheme.trim()) || usedLetters.length > 0 || Object.keys(roundScores).length > 0 || Object.keys(bets).length > 0;
    if (inProgress || rounds > 0 || named.length > 0 || hasRoundDraft) {
      onDraftChange?.({
        players,
        scores,
        roundScores,
        roundLetter,
        bastaTheme,
        usedLetters,
        bets,
        eliminated,
        rounds,
        history,
        gameOver,
        winner,
        inProgress,
        customLimit,
        betHistory,
      });
    }
  }, [bastaTheme, betHistory, bets, customLimit, eliminated, gameOver, history, inProgress, named.length, onDraftChange, players, roundLetter, roundScores, rounds, scores, usedLetters, winner]);

  const handleBastaLetterSelect = (letter: string) => {
    if (usedLetters.includes(letter) || roundLetter === letter) return;
    setRoundLetter(letter);
  };

  const handleBastaResetLetters = () => {
    setUsedLetters([]);
    setRoundLetter("");
  };

  const commitRound = (winnerId: string | null) => {
    const normalizedRoundLetter = isBasta ? roundLetter.trim().slice(0, 1).toUpperCase() : "";
    const normalizedTheme = isBasta ? bastaTheme.trim() : "";
    if (isBasta && (!normalizedTheme || !normalizedRoundLetter)) return;

    const nextScores = { ...scores };
    named.forEach((player) => {
      if (eliminated.includes(player.id)) return;
      const pts = parseInt(roundScores[player.id] || "0", 10);
      nextScores[player.id] = (nextScores[player.id] || 0) + pts;
    });

    if (cfg.stepMode && winnerId) {
      nextScores[winnerId] = (nextScores[winnerId] || 0) + 1;
    }

    let nextBetHistory = { ...betHistory };
    if (cfg.hasBet && winnerId) {
      const betAmt = parseFloat(bets[winnerId] || "0");
      if (betAmt > 0) {
        active.forEach((player) => {
          const isWinner = player.id === winnerId;
          const playerBet = parseFloat(bets[player.id] || String(betAmt));
          nextBetHistory[player.id] = (nextBetHistory[player.id] || 0) + (isWinner ? (active.length - 1) * playerBet : -playerBet);
        });
        setBetHistory(nextBetHistory);
      }
    }

    setScores(nextScores);
    setRounds((currentRounds) => currentRounds + 1);
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        scores: { ...scores },
        roundScores: { ...roundScores },
        winnerId,
        roundLetter: normalizedRoundLetter || null,
        theme: normalizedTheme || null,
        elimSnap: [...eliminated],
        betsSnap: { ...bets },
        betHistorySnap: { ...betHistory },
      },
    ]);
    setRoundScores({});
    setRoundLetter("");
    if (isBasta && normalizedRoundLetter) {
      setUsedLetters((currentLetters) => (currentLetters.includes(normalizedRoundLetter) ? currentLetters : [...currentLetters, normalizedRoundLetter]));
    }
    setBets({});
    setInProgress(true);

    if (isBasta && winnerId && (nextScores[winnerId] || 0) >= BASTA_GOAL) {
      setWinner(named.find((player) => player.id === winnerId) || null);
      setGameOver(true);
      return;
    }

    if (!cfg.loseOnLimit && !cfg.stepMode && winnerId && nextScores[winnerId] >= (customLimit || cfg.limit)) {
      setWinner(named.find((player) => player.id === winnerId) || null);
      setGameOver(true);
    }

    if (cfg.loseOnLimit) {
      const nextEliminated = [...eliminated];
      named.forEach((player) => {
        if (!eliminated.includes(player.id) && (nextScores[player.id] || 0) >= (customLimit || cfg.limit)) {
          nextEliminated.push(player.id);
        }
      });
      if (nextEliminated.length !== eliminated.length) {
        setEliminated(nextEliminated);
        const remaining = named.filter((player) => !nextEliminated.includes(player.id));
        if (remaining.length === 1) {
          setWinner(remaining[0]);
          setGameOver(true);
        }
      }
    }
  };

  const undoLast = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setScores(last.scores);
    setRoundScores(last.roundScores || {});
    setEliminated(last.elimSnap);
    setRoundLetter(last.roundLetter || "");
    setBastaTheme(last.theme || bastaTheme);
    setBets(last.betsSnap || {});
    if (last.betHistorySnap !== undefined) setBetHistory(last.betHistorySnap);
    if (isBasta && last.roundLetter) {
      setUsedLetters((currentLetters) => currentLetters.filter((letter) => letter !== last.roundLetter));
    }
    setRounds((currentRounds) => currentRounds - 1);
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    setGameOver(false);
    setWinner(null);
    if (history.length <= 1) setInProgress(false);
  };

  const canSaveProgress = gameOver || rounds > 0;

  const handleSave = (winnerOverride?: string | null) => {
    const sortedPlayers = [...named].sort((left, right) => {
      if (cfg.loseOnLimit) return (scores[left.id] || 0) - (scores[right.id] || 0);
      return (scores[right.id] || 0) - (scores[left.id] || 0);
    });
    const hasBetData = cfg.hasBet && Object.keys(betHistory).length > 0;
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sortedPlayers.map((player) => ({
        name: player.name,
        score: scores[player.id] || 0,
        net: hasBetData ? betHistory[player.id] || 0 : undefined,
      })),
      winner: winnerOverride === undefined ? (winner ? winner.name : sortedPlayers[0]?.name || null) : winnerOverride,
      rounds,
      ...(isBasta ? { history, bastaTheme: bastaTheme.trim() || null } : {}),
    });
  };

  const sorted = [...named].sort((left, right) => {
    if (cfg.loseOnLimit) return (scores[left.id] || 0) - (scores[right.id] || 0);
    return (scores[right.id] || 0) - (scores[left.id] || 0);
  });

  const limitVal = customLimit || cfg.limit;
  const bastaAllLettersUsed = usedLetters.length >= BASTA_ALPHABET.length;
  const bastaCanCommit = !isBasta || (Boolean(bastaTheme.trim()) && Boolean(roundLetter));

  return (
    <div>
      {!inProgress && (
        <div className="sec">
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={10}
            onLoad={(groupPlayers, groupLinkedPlayers) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinkedPlayers as LinkedPlayer[]);
            }}
            onDiscard={() => {
              setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
              setScores({});
              setRoundScores({});
              setRoundLetter("");
              setBastaTheme("");
              setUsedLetters([]);
              setEliminated([]);
              setRounds(0);
              setHistory([]);
              setGameOver(false);
              setWinner(null);
              setInProgress(false);
              setBetHistory({});
              setBets({});
              onLinkedPlayersChange([]);
            }}
            hasPlayers={inProgress || rounds > 0 || named.length > 0}
            gameId={game.id}
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
                    if (players.length > 2) {
                      setPlayers((currentPlayers) => currentPlayers.filter((currentPlayer) => currentPlayer.id !== player.id));
                      onLinkedPlayersChange(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id));
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {players.length < 10 && <button className="btndash" onClick={() => setPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])}>{t("addPlayer")}</button>}
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
          {cfg.limit > 0 && cfg.allowLimitPicker !== false && (
            <div style={{ marginTop: 14 }}>
              <span className="flbl">{cfg.limitLabel}</span>
              <div className="pillrow">
                {(cfg.loseOnLimit ? [100, 150, 200] : [500, 1000]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setCustomLimit(value)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "var(--rxs)",
                      cursor: "pointer",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.1rem",
                      letterSpacing: "2px",
                      border: `1.5px solid ${customLimit === value ? "var(--gc)" : "var(--bo2)"}`,
                      background: customLimit === value ? "color-mix(in srgb,var(--gc) 12%,transparent)" : "var(--ibg)",
                      color: customLimit === value ? "var(--gc)" : "var(--tx2)",
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {named.length >= 2 && !hasDuplicates && (
        <div className="sb">
          <div className="sbhdr">
            <span className="sbtitle">
              {cfg.loseOnLimit
                ? `${t("limitHeader")} — ${limitVal}`
                : isBasta
                  ? `${t("bastaCardsHeader")} — ${BASTA_GOAL}`
                  : cfg.stepMode
                    ? t("roundsWonHeader")
                    : `${t("metaHeader")} — ${limitVal}`}
            </span>
            <span className="sbround">{rounds > 0 ? `${t("roundLabel")} ${rounds}` : t("notStarted")}</span>
          </div>
          {sorted.map((player, index) => {
            const score = scores[player.id] || 0;
            const isEliminated = eliminated.includes(player.id);
            const pct = cfg.loseOnLimit ? Math.min((score / limitVal) * 100, 100) : cfg.stepMode ? Math.min(score * 10, 100) : Math.min((score / limitVal) * 100, 100);
            return (
              <div key={player.id} className={`sbrow${player.id === winner?.id ? " win" : index === 0 && rounds > 0 && !isEliminated ? " lead" : ""}${isEliminated ? " elim" : ""}`}>
                <span className="sbrank">{index + 1}</span>
                <span className="sbname">{isEliminated ? "❌ " : player.id === winner?.id ? "🏆 " : ""}{player.name}</span>
                <div className="sbprog"><div className="sbbar" style={{ width: `${pct}%` }} /></div>
                <span className="sbscore">{score}</span>
              </div>
            );
          })}
        </div>
      )}

      {gameOver && winner && <div className="wnr">🏆 {winner.name.toUpperCase()} {t("won")}</div>}

      {cfg.hasBet && rounds > 0 && Object.keys(betHistory).length > 0 && (
        <div
          style={{
            background: "color-mix(in srgb,var(--gc) 6%,var(--glass))",
            backdropFilter: "var(--blur)",
            WebkitBackdropFilter: "var(--blur)",
            border: "1px solid color-mix(in srgb,var(--gc) 25%,var(--glass-border))",
            borderRadius: "var(--rsm)",
            padding: "12px 14px",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: ".66rem", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 8 }}>
            {t("netResult")}
          </div>
          {named.map((player) => {
            const net = betHistory[player.id] || 0;
            const color = net > 0 ? "#52b788" : net < 0 ? "#E63946" : "var(--tx3)";
            return (
              <div key={player.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--bo)" }}>
                <span style={{ fontSize: ".85rem", color: "var(--tx)", fontWeight: 600 }}>{player.name}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color, letterSpacing: "1px", fontWeight: 800 }}>
                  {net > 0 ? "+" : ""}
                  {t("currency")}
                  {net.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isBasta && history.length > 0 && (
        <div className="sec-card" data-testid="basta-round-history" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="flbl" style={{ marginBottom: 0 }}>{t("roundLog")}</span>
            <span style={{ fontSize: ".72rem", color: "var(--tx3)" }}>
              {history.length} {history.length !== 1 ? t("savedCountPlural") : t("savedCount")}
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {history.map((entry, index) => {
              const winnerName = named.find((player) => player.id === entry.winnerId)?.name;
              const letterLabel = entry.roundLetter || "—";
              return (
                <div
                  key={`${index}-${entry.roundLetter || "no-letter"}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--rxs)",
                    border: "1px solid var(--bo)",
                    background: "color-mix(in srgb,var(--gc) 5%,var(--content-surface-strong))",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--tx)" }}>{`${t("roundLabel")} ${index + 1}`}</span>
                    <span style={{ fontSize: ".72rem", color: "var(--tx3)" }}>
                      {winnerName ? `${game.emoji} ${winnerName}` : t("noWinnerRound")}
                      {entry.theme ? ` · ${entry.theme}` : ""}
                    </span>
                  </div>
                  <span
                    style={{
                      minWidth: 34,
                      textAlign: "center",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "1px solid color-mix(in srgb,var(--gc) 28%,transparent)",
                      background: "color-mix(in srgb,var(--gc) 12%,transparent)",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      letterSpacing: "1px",
                      color: "var(--gc)",
                    }}
                  >
                    {letterLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!gameOver && named.length >= 2 && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
            <span
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.1rem",
                letterSpacing: "2px",
                color: rounds > 0 ? "var(--gc)" : "var(--tx2)",
                background: rounds > 0 ? "color-mix(in srgb,var(--gc) 12%,transparent)" : "transparent",
                border: rounds > 0 ? "1px solid color-mix(in srgb,var(--gc) 30%,transparent)" : "none",
                borderRadius: "20px",
                padding: rounds > 0 ? "3px 12px" : "0",
                fontWeight: 800,
              }}
            >
              {`${t("roundLabel")} ${rounds + 1}`}
              {rounds > 0 && (
                <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: ".72rem", fontWeight: 600, marginLeft: 6, opacity: 0.7 }}>
                  ({rounds} {rounds !== 1 ? t("savedCountPlural") : t("savedCount")})
                </span>
              )}
            </span>
            {history.length > 0 && <button className="btnsec" onClick={undoLast}>{t("undo")}</button>}
          </div>

          {isBasta && (
            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              <div>
                <label htmlFor="basta-theme-input" className="flbl" style={{ marginBottom: "6px" }}>{t("bastaThemeLabel")}</label>
                <input
                  id="basta-theme-input"
                  className="rdinp"
                  type="text"
                  placeholder={t("bastaThemePlaceholder")}
                  value={bastaTheme}
                  onChange={(event) => setBastaTheme(event.target.value)}
                  data-testid="basta-theme-input"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span className="flbl" style={{ marginBottom: 0 }}>{t("bastaRoundLetter")}</span>
                  {roundLetter && (
                    <span
                      data-testid="basta-active-letter"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 38,
                        padding: "6px 12px",
                        borderRadius: "999px",
                        border: "1px solid color-mix(in srgb,var(--gc) 28%,transparent)",
                        background: "color-mix(in srgb,var(--gc) 14%,transparent)",
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1rem",
                        letterSpacing: "1px",
                        color: "var(--gc)",
                      }}
                    >
                      {roundLetter}
                    </span>
                  )}
                </div>
                <div data-testid="basta-letter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 6 }}>
                  {BASTA_ALPHABET.map((letter) => {
                    const disabled = usedLetters.includes(letter) || roundLetter === letter;
                    const selected = roundLetter === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        className="btnsec"
                        disabled={disabled}
                        data-testid={`basta-letter-${letter}`}
                        onClick={() => handleBastaLetterSelect(letter)}
                        style={{
                          minHeight: 40,
                          padding: "8px 0",
                          borderColor: selected ? "color-mix(in srgb,var(--gc) 40%,transparent)" : undefined,
                          background: selected ? "color-mix(in srgb,var(--gc) 14%,transparent)" : undefined,
                          color: disabled ? "var(--tx3)" : selected ? "var(--gc)" : "var(--tx)",
                          opacity: usedLetters.includes(letter) ? 0.52 : 1,
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: ".98rem",
                          letterSpacing: "1px",
                        }}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <span className="rdlbl">{t("bastaThemeHint")}</span>
                  {bastaAllLettersUsed && !gameOver && (
                    <button type="button" className="btnsec" data-testid="basta-reset-letters" onClick={handleBastaResetLetters}>
                      {t("bastaNextCycle")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!cfg.stepMode && (
            <div className="rdinputs" style={{ marginBottom: 10 }}>
              {active.map((player) => (
                <div className="rdrow" key={player.id}>
                  <span className="rdname">{player.name}</span>
                  <div className="rdfields">
                    <div className="rdfrow">
                      <input
                        className="rdinp"
                        type="number"
                        placeholder="0"
                        value={roundScores[player.id] || ""}
                        onChange={(event) => setRoundScores((currentScores) => ({ ...currentScores, [player.id]: event.target.value }))}
                        data-testid={`round-score-${player.id}`}
                        aria-label={`${cfg.winLabel || t("roundLog")} ${player.name}`}
                      />
                      <span className="rdlbl">{cfg.hasNeg ? t("ptsNegative") : t("ptsLabel")}</span>
                    </div>
                  </div>
                  <span className="rdtotal">{roundScores[player.id] || "—"}</span>
                </div>
              ))}
            </div>
          )}

          {cfg.hasBet && (
            <div style={{ marginBottom: 12 }}>
              <span className="flbl" style={{ marginBottom: 6 }}>{t("betAmount")} {t("betOptional")}</span>
              <div className="rdinputs">
                {active.map((player) => (
                  <div className="rdrow" key={player.id}>
                    <span className="rdname">{player.name}</span>
                    <div className="rdfields">
                      <div className="rdfrow">
                        <span style={{ fontSize: ".85rem", color: "var(--tx3)", paddingTop: 8 }}>{t("currency")}</span>
                        <input
                          className="rdinp"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          value={bets[player.id] || ""}
                          onChange={(event) => setBets((currentBets) => ({ ...currentBets, [player.id]: event.target.value }))}
                          aria-label={`${t("betAmount")} ${player.name}`}
                        />
                      </div>
                    </div>
                    {bets[player.id] && parseFloat(bets[player.id]) > 0 && (
                      <span className="rdtotal" style={{ fontSize: ".8rem" }}>
                        {t("currency")}
                        {bets[player.id]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <span className="flbl" style={{ marginBottom: "6px" }}>{cfg.winLabel}</span>
          <div className="wnrbtns">
            {active.map((player) => (
              <button key={player.id} className="wnrbtn" onClick={() => { haptic("light"); commitRound(player.id); }} data-testid={`win-button-${player.id}`} disabled={!bastaCanCommit}>
                {game.emoji} {player.name}
                {cfg.hasBet && bets[player.id] && parseFloat(bets[player.id]) > 0 && (
                  <span style={{ marginLeft: 8, fontSize: ".72rem", opacity: 0.7, fontWeight: 600 }}>
                    {t("currency")}
                    {bets[player.id]}
                  </span>
                )}
              </button>
            ))}
            {!cfg.stepMode && (
              <button className="wnrbtn" onClick={() => { haptic("light"); commitRound(null); }}>
                — {t("noWinnerRound")}
              </button>
            )}
          </div>
        </div>
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
    </div>
  );
}

export default memo(GenericNewMatch)
