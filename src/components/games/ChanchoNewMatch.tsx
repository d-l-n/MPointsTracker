import { memo, useEffect, useState, type CSSProperties } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";

const CHANCHO_WORD = "CHANCHO";

interface PlayerInputState {
  id: string;
  name: string;
}

interface ChanchoHistoryEntry {
  letters: Record<string, number>;
  eliminated: string[];
  pid: string;
}

interface ChanchoDraft {
  players?: PlayerInputState[];
  letters?: Record<string, number>;
  eliminated?: string[];
  rounds?: number;
  history?: ChanchoHistoryEntry[];
  gameOver?: boolean;
  winner?: PlayerInputState | null;
  inProgress?: boolean;
}

interface ChanchoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
}

interface ChanchoNewMatchProps {
  onSave: (match: ChanchoSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: ChanchoDraft | null;
  onDraftChange?: (draft: ChanchoDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

type AccentButtonStyle = CSSProperties & Record<"--gc", string>;

function ChanchoNewMatch({
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  draft = null,
  onDraftChange,
  playerGroups = [],
  onSavePlayerGroups,
}: ChanchoNewMatchProps) {
  const [players, setPlayers] = useState<PlayerInputState[]>(
    draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }, { id: mkId(), name: "" }, { id: mkId(), name: "" }],
  );
  const [letters, setLetters] = useState<Record<string, number>>(draft?.letters || {});
  const [eliminated, setEliminated] = useState<string[]>(draft?.eliminated || []);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<ChanchoHistoryEntry[]>(draft?.history || []);
  const [gameOver, setGameOver] = useState(draft?.gameOver || false);
  const [winner, setWinner] = useState<PlayerInputState | null>(draft?.winner || null);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);

  useEffect(() => {
    if (inProgress || rounds > 0 || players.some(p => p.name.trim())) {
      onDraftChange?.({ players, letters, eliminated, rounds, history, gameOver, winner, inProgress });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [eliminated, gameOver, history, inProgress, letters, onDraftChange, players, rounds, winner]);

  const named = players.filter((player) => player.name.trim());
  const active = named.filter((player) => !eliminated.includes(player.id));
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(nameCount).some((value) => value > 1);

  const addLetter = (playerId: string) => {
    const newCount = (letters[playerId] || 0) + 1;
    const newLetters = { ...letters, [playerId]: newCount };
    setLetters(newLetters);
    setRounds((currentRounds) => currentRounds + 1);
    setInProgress(true);
    setHistory((currentHistory) => [...currentHistory, { letters: { ...letters }, eliminated: [...eliminated], pid: playerId }]);

    if (newCount >= CHANCHO_WORD.length) {
      const nextEliminated = [...eliminated, playerId];
      setEliminated(nextEliminated);
      const remaining = named.filter((player) => !nextEliminated.includes(player.id));
      if (remaining.length === 1) {
        setWinner(remaining[0]);
        setGameOver(true);
      }
    }
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setLetters(last.letters);
    setEliminated(last.eliminated);
    setRounds((currentRounds) => currentRounds - 1);
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    setGameOver(false);
    setWinner(null);
    if (history.length <= 1) setInProgress(false);
  };

  const handleSave = () => {
    const sorted = [...named].sort((left, right) => (letters[left.id] || 0) - (letters[right.id] || 0));
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sorted.map((player) => ({ name: player.name, score: letters[player.id] || 0 })),
      winner: winner?.name || sorted[0]?.name || null,
      rounds,
    });
  };

  const letterDisplay = (playerId: string) => {
    const count = letters[playerId] || 0;
    return CHANCHO_WORD.split("").map((letter, index) => (
      <span
        key={`letter-${index}`}
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "1rem",
          letterSpacing: "1px",
          color: index < count ? "#E91E8C" : "var(--bo2)",
          fontWeight: 800,
        }}
      >
        {letter}
      </span>
    ));
  };

  return (
    <div>
      {!inProgress && (
        <div className="sec">
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={8}
            onLoad={(groupPlayers, groupLinked) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinked as LinkedPlayer[]);
            }}
            onDiscard={() => {
              setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }, { id: mkId(), name: "" }, { id: mkId(), name: "" }]);
              setLetters({});
              setEliminated([]);
              setRounds(0);
              setHistory([]);
              setGameOver(false);
              setWinner(null);
              setInProgress(false);
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
          {players.length < 8 && (
            <button className="btndash" onClick={() => setPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])}>
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

      {named.length >= 2 && !hasDuplicates && (
        <div className="sb" style={{ marginBottom: 14 }}>
          <div className="sbhdr">
            <span className="sbtitle">CHANCHO</span>
            <span className="sbround">{rounds > 0 ? `${t("roundLabel")} ${rounds}` : t("notStarted")}</span>
          </div>
          {named.map((player) => {
            const isEliminated = eliminated.includes(player.id);
            const isWinner = player.id === winner?.id;
            return (
              <div key={player.id} className={`sbrow${isWinner ? " win" : ""}${isEliminated ? " elim" : ""}`}>
                <span className="sbname" style={{ minWidth: 80 }}>
                  {isEliminated ? "❌ " : isWinner ? "🏆 " : ""}
                  {player.name}
                </span>
                <div style={{ flex: 1, display: "flex", gap: 2, justifyContent: "center" }}>{letterDisplay(player.id)}</div>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: ".85rem", color: "var(--tx3)", minWidth: 30, textAlign: "right" }}>
                  {letters[player.id] || 0}/7
                </span>
              </div>
            );
          })}
        </div>
      )}

      {gameOver && winner && <div className="wnr">🏆 {winner.name.toUpperCase()} {t("won")}</div>}

      {!gameOver && named.length >= 2 && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span className="flbl" style={{ marginBottom: 0 }}>
              {t("whoGotLetter")}
            </span>
            {history.length > 0 && (
              <button className="btnsec" onClick={undo}>
                {t("undo")}
              </button>
            )}
          </div>
          <div className="wnrbtns">
            {active.map((player) => (
              <button key={player.id} className="wnrbtn" onClick={() => { haptic("medium"); addLetter(player.id); }}>
                🐷 {player.name} <span style={{ color: "#E91E8C", fontWeight: 800, marginLeft: 4 }}>{t("addLetterBtn")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(gameOver || rounds > 0) && (
        <button data-testid="save-match" className="btnpri" style={{ marginTop: "8px", "--gc": "#E91E8C" } as AccentButtonStyle} onClick={handleSave}>
          {t("saveMatch")}
        </button>
      )}
    </div>
  );
}

export default memo(ChanchoNewMatch)
