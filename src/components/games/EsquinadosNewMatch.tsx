import { memo, useEffect, useState, type CSSProperties } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";

interface PlayerInputState {
  id: string;
  name: string;
}

interface EsquinadosHistoryEntry {
  wins: Record<string, number>;
  winnerId: string;
}

interface EsquinadosDraft {
  players?: PlayerInputState[];
  wins?: Record<string, number>;
  rounds?: number;
  history?: EsquinadosHistoryEntry[];
  inProgress?: boolean;
}

interface EsquinadosSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
}

interface EsquinadosNewMatchProps {
  onSave: (match: EsquinadosSavePayload) => void;
  knownNames: string[];
  draft?: EsquinadosDraft | null;
  onDraftChange?: (draft: EsquinadosDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  t?: TranslationFn;
}

type AccentButtonStyle = CSSProperties & Record<"--gc", string>;

function EsquinadosNewMatch({
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  playerGroups = [],
  onSavePlayerGroups,
  t = ((key: string) => key) as TranslationFn,
}: EsquinadosNewMatchProps) {
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [wins, setWins] = useState<Record<string, number>>(draft?.wins || {});
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<EsquinadosHistoryEntry[]>(draft?.history || []);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);

  useEffect(() => {
    if (inProgress || rounds > 0 || players.some(p => p.name.trim())) {
      onDraftChange?.({ players, wins, rounds, history, inProgress });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [history, inProgress, onDraftChange, players, rounds, wins]);

  const named = players.filter((player) => player.name.trim());
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDups = Object.values(nameCount).some((value) => value > 1);
  const canStart = named.length >= 2 && !hasDups;

  const addWin = (playerId: string) => {
    const nextWins = { ...wins, [playerId]: (wins[playerId] || 0) + 1 };
    setWins(nextWins);
    setRounds((currentRounds) => currentRounds + 1);
    setHistory((currentHistory) => [...currentHistory, { wins: { ...wins }, winnerId: playerId }]);
    setInProgress(true);
    haptic("light");
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
    const sorted = [...named].sort((left, right) => (wins[right.id] || 0) - (wins[left.id] || 0));
    const winner = sorted[0];
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sorted.map((player) => ({ name: player.name, score: wins[player.id] || 0 })),
      winner: winner?.name || null,
      rounds,
    });
    haptic("strong");
  };

  return (
    <div>
      {!inProgress && (
        <div className="sec">
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={5}
            gameId="esquinados"
            onLoad={(groupPlayers, groupLinked) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinked as LinkedPlayer[]);
            }}
          />
          <span className="flbl">{t("players")} (2–5)</span>
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
          {players.length < 5 && (
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
          {hasDups && (
            <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, fontWeight: 600 }}>
              {t("dupPlayerWarning")}
            </div>
          )}
        </div>
      )}

      {canStart && (
        <div className="tscores" style={{ marginBottom: 16 }}>
          {[...named]
            .sort((left, right) => (wins[right.id] || 0) - (wins[left.id] || 0))
            .map((player) => (
              <div key={player.id} className="tcard">
                <div className="ttname">{player.name}</div>
                <div className="ttscore">{wins[player.id] || 0}</div>
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
          <div className="wnrbtns" style={{ flexWrap: "wrap" }}>
            {named.map((player) => (
              <button key={player.id} className="wnrbtn" onClick={() => addWin(player.id)}>
                🟩 {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {rounds > 0 && (
        <button data-testid="save-match" className="btnpri" style={{ marginTop: 8, "--gc": "#2E7D32" } as AccentButtonStyle} onClick={handleSave}>
          {t("saveMatch")}
        </button>
      )}
    </div>
  );
}

export default memo(EsquinadosNewMatch)
