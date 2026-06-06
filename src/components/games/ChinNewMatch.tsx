import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";

interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

interface ChinRoundHistoryEntry {
  wins: [number, number];
  winner: number;
}

interface ChinDraft {
  p1?: string;
  p2?: string;
  wins?: [number, number];
  rounds?: number;
  history?: ChinRoundHistoryEntry[];
  inProgress?: boolean;
}

interface ChinSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
}

interface ChinNewMatchProps {
  onSave: (match: ChinSavePayload) => void;
  knownNames: string[];
  draft?: ChinDraft | null;
  onDraftChange?: (draft: ChinDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  t?: TranslationFn;
}

type AccentButtonStyle = CSSProperties & Record<"--gc", string>;

export default function ChinNewMatch({
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  playerGroups = [],
  onSavePlayerGroups,
  t = ((key: string) => key) as TranslationFn,
}: ChinNewMatchProps) {
  const [p1, setP1] = useState(draft?.p1 || "");
  const [p2, setP2] = useState(draft?.p2 || "");
  const [wins, setWins] = useState<[number, number]>(draft?.wins || [0, 0]);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<ChinRoundHistoryEntry[]>(draft?.history || []);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);

  useEffect(() => {
    if (inProgress || rounds > 0 || p1.trim() || p2.trim()) {
      onDraftChange?.({ p1, p2, wins, rounds, history, inProgress });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [history, inProgress, onDraftChange, p1, p2, rounds, wins]);

  const validGroups = useMemo(
    () => playerGroups.filter((group) => Array.isArray(group.players) && group.players.length === 2),
    [playerGroups],
  );

  const sameNames = p1.trim() && p2.trim() && p1.trim().toLowerCase() === p2.trim().toLowerCase();
  const canStart = Boolean(p1.trim() && p2.trim() && !sameNames);
  const labels = [p1.trim() || `${t("players").split(" ")[0]} 1`, p2.trim() || `${t("players").split(" ")[0]} 2`] as const;

  const addWin = (index: 0 | 1) => {
    const nextWins: [number, number] = wins.map((value, currentIndex) => (currentIndex === index ? value + 1 : value)) as [number, number];
    setWins(nextWins);
    setRounds((currentRounds) => currentRounds + 1);
    setHistory((currentHistory) => [...currentHistory, { wins: [...wins] as [number, number], winner: index }]);
    setInProgress(true);
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setWins(last.wins);
    setRounds((currentRounds) => currentRounds - 1);
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    if (history.length <= 1) setInProgress(false);
  };

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
  };

  const handleGroupLoad = (players: Array<{ name: string }>, linked: LinkedPlayer[]) => {
    if (players[0]) setP1(players[0].name);
    if (players[1]) setP2(players[1].name);
    const nextLinked: LinkedPlayer[] = [];
    if (linked[0]) nextLinked.push({ ...linked[0], playerId: "p1" });
    if (linked[1]) nextLinked.push({ ...linked[1], playerId: "p2" });
    onLinkedPlayersChange(nextLinked);
    haptic("light");
  };

  return (
    <div>
      {!inProgress && (
        <div className="sec">
          <span className="flbl">{t("players")} (1v1)</span>

          {validGroups.length > 0 && <GroupPicker t={t} playerGroups={validGroups} maxPlayers={2} onLoad={handleGroupLoad} />}

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
              placeholder={`${t("players").split(" ")[0]} 1`}
              knownNames={knownNames}
              t={t}
              allLinkedUids={linkedPlayers.map((linkedPlayer) => linkedPlayer.uid)}
            />
            <div style={{ textAlign: "center", fontSize: ".8rem", color: "var(--tx3)", fontWeight: 700 }}>VS</div>
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
              placeholder={`${t("players").split(" ")[0]} 2`}
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
        </div>
      )}

      {canStart && (
        <div className="tscores" style={{ marginBottom: 16 }}>
          {labels.map((name, index) => (
            <div key={index} className="tcard">
              <div className="ttname">{name}</div>
              <div className="ttscore">{wins[index]}</div>
              <div className="ttlimit">{t("roundsWon")}</div>
            </div>
          ))}
        </div>
      )}

      {canStart && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span className="flbl" style={{ marginBottom: 0 }}>
              {t("whoWonRound")} {rounds + 1}?
            </span>
            {history.length > 0 && (
              <button className="btnsec" onClick={undo}>
                {t("undo")}
              </button>
            )}
          </div>
          <div className="wnrbtns">
            {labels.map((name, index) => (
              <button key={index} className="wnrbtn" onClick={() => { haptic("light"); addWin(index as 0 | 1); }}>
                🎯 {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {rounds > 0 && (
        <button data-testid="save-match" className="btnpri" style={{ marginTop: 8, "--gc": "#8B1A1A" } as AccentButtonStyle} onClick={handleSave}>
          {t("saveMatch")}
        </button>
      )}
    </div>
  );
}
