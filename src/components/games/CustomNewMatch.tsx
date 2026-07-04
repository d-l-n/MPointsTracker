import { memo, useEffect, useState } from "react";

import { mkId, haptic } from "../../lib/storage";
import { getGameName } from "../../data/games";
import type { GameDefinition, LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import SaveGroupButton from "../ui/SaveGroupButton";

interface PlayerInputState {
  id: string;
  name: string;
}

interface CustomDraft {
  customName?: string;
  customEmoji?: string;
  configured?: boolean;
  players?: PlayerInputState[];
  scores?: Record<string, number>;
  rounds?: number;
  history?: Array<{
    scores: Record<string, number>;
    roundScores: Record<string, string>;
    winnerId: string | null;
  }>;
  inProgress?: boolean;
  customLimit?: number;
}

interface CustomSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  gameName: string;
  gameEmoji: string;
}

interface CustomNewMatchProps {
  game?: GameDefinition;
  onSave: (match: CustomSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  draft?: CustomDraft | null;
  onDraftChange?: (draft: CustomDraft | null) => void;
  t?: TranslationFn;
}

const EMOJI_PRESETS = ["🎮", "🃏", "🎲", "🎯", "🧩", "♟️", "🎰", "🏆", "⚡", "🔥", "🌟", "💎"];

function CustomNewMatch({
  game,
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  playerGroups = [],
  onSavePlayerGroups,
  draft = null,
  onDraftChange,
  t = ((key: string) => key) as TranslationFn,
}: CustomNewMatchProps) {
  const [customName, setCustomName] = useState(draft?.customName || "");
  const [customEmoji, setCustomEmoji] = useState(draft?.customEmoji || "🎮");
  const [configured, setConfigured] = useState(draft?.configured || false);
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [scores, setScores] = useState<Record<string, number>>(draft?.scores || {});
  const [roundScores, setRoundScores] = useState<Record<string, string>>({});
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<NonNullable<CustomDraft["history"]>>(draft?.history || []);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);
  const [customLimit, setCustomLimit] = useState(draft?.customLimit ?? (game?.winScore || 0));
  const [limitInput, setLimitInput] = useState(String(draft?.customLimit ?? (game?.winScore || "")));

  useEffect(() => {
    if (configured && (inProgress || rounds > 0 || players.some(p => p.name.trim()))) {
      onDraftChange?.({ players, scores, rounds, history, inProgress, customLimit, customName, customEmoji, configured });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [configured, customEmoji, customLimit, customName, history, inProgress, onDraftChange, players, rounds, scores]);

  const named = players.filter((player) => player.name.trim());
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(nameCount).some((value) => value > 1);
  const sortedPlayers = [...named].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0));
  const limitVal = customLimit || 0;
  const topScore = Math.max(1, ...sortedPlayers.map((player) => scores[player.id] || 0));

  const commitRound = (winnerId: string | null) => {
    const nextScores = { ...scores };
    named.forEach((player) => {
      const points = parseInt(roundScores[player.id] || "0", 10);
      nextScores[player.id] = (nextScores[player.id] || 0) + points;
    });
    setScores(nextScores);
    setRounds((currentRounds) => currentRounds + 1);
    setHistory((currentHistory) => [...currentHistory, { scores: { ...scores }, roundScores: { ...roundScores }, winnerId }]);
    setRoundScores({});
    setInProgress(true);
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setScores(last.scores);
    setRounds((currentRounds) => currentRounds - 1);
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    if (history.length <= 1) setInProgress(false);
  };

  const handleSave = () => {
    const sorted = [...named].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0));
    const winner = sorted[0]?.name || null;
    const resolvedName = customName.trim() || t("customGame");
    const resolvedEmoji = customEmoji || "🎮";
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sorted.map((player) => ({ name: player.name, score: scores[player.id] || 0 })),
      winner,
      rounds,
      gameName: resolvedName,
      gameEmoji: resolvedEmoji,
    });
  };

  if (!configured) {
    return (
      <div className="sec">
        <span className="flbl">{t("customGameEmoji")}</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setCustomEmoji(emoji)}
              style={{
                fontSize: "1.5rem",
                padding: "6px 10px",
                borderRadius: "var(--rxs)",
                background: customEmoji === emoji ? "var(--gc,#006D77)" : "var(--bg3)",
                border: `1px solid ${customEmoji === emoji ? "var(--gc,#006D77)" : "var(--bo)"}`,
                cursor: "pointer",
                transition: "var(--t)",
              }}
            >
              {emoji}
            </button>
          ))}
          <input
            id="custom-emoji"
            className="inp"
            placeholder="✏️"
            value={EMOJI_PRESETS.includes(customEmoji) ? "" : customEmoji}
            onChange={(event) => {
              if (event.target.value) setCustomEmoji(event.target.value.slice(-2));
            }}
            style={{ maxWidth: 60, textAlign: "center", fontSize: "1.3rem" }}
            aria-label={t("customGameEmoji")}
          />
        </div>
        <label htmlFor="custom-name" className="flbl">{t("customGameName")}</label>
        <input
          id="custom-name"
          className="inp"
          placeholder={t("customGame")}
          value={customName}
          onChange={(event) => setCustomName(event.target.value)}
          style={{ marginBottom: 16 }}
        />
        <button className="btnpri" onClick={() => setConfigured(true)}>
          {customEmoji} {customName.trim() || t("customGame")} →
        </button>
      </div>
    );
  }

  return (
    <div>
      {!inProgress && (
        <div className="sec">
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
                  placeholder={`${t("players")} ${index + 1}`}
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
          {players.length < 10 && (
            <button className="btndash" onClick={() => setPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])}>
              {t("addPlayer")}
            </button>
          )}
          {hasDuplicates && (
            <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, fontWeight: 600 }}>
              {t("dupPlayerWarning")}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <label htmlFor="custom-meta" className="flbl">{t("customMeta")}</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id="custom-meta"
                className="inp"
                type="number"
                min="0"
                placeholder={t("customNoLimit")}
                value={limitInput}
                onChange={(event) => {
                  setLimitInput(event.target.value);
                  const parsed = parseInt(event.target.value, 10);
                  setCustomLimit(Number.isNaN(parsed) ? 0 : parsed);
                }}
                style={{ maxWidth: 120 }}
              />
              <span style={{ fontSize: ".75rem", color: "var(--tx3)" }}>{t("ptsLabel")}</span>
            </div>
          </div>

          <SaveGroupButton
            t={t}
            players={players}
            linkedPlayers={linkedPlayers}
            playerGroups={playerGroups}
            onSave={onSavePlayerGroups}
          />
        </div>
      )}

      {named.length >= 2 && !hasDuplicates && (
        <div className="sb">
          <div className="sbhdr">
            <span className="sbtitle">
              {customEmoji} {customName.trim() || (game ? getGameName(game.id, t) : t("customGame"))}
              {limitVal > 0 ? ` — ${limitVal} pts` : ""}
            </span>
            <span className="sbround">{rounds > 0 ? `${t("rounds")} ${rounds}` : "—"}</span>
          </div>
          {sortedPlayers.map((player, index) => {
            const score = scores[player.id] || 0;
            const percent = limitVal > 0 ? Math.min((score / limitVal) * 100, 100) : Math.min((score / topScore) * 100, 100);
            return (
              <div key={player.id} className={`sbrow${index === 0 && rounds > 0 ? " lead" : ""}`}>
                <span className="sbrank">{index + 1}</span>
                <span className="sbname">{player.name}</span>
                <div className="sbprog">
                  <div className="sbbar" style={{ width: `${percent}%` }} />
                </div>
                <span className="sbscore">{score}</span>
              </div>
            );
          })}
        </div>
      )}

      {named.length >= 2 && !hasDuplicates && (
        <div className="sec">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span className="flbl" style={{ marginBottom: 0 }}>
              {t("registerRound")} {rounds + 1}
            </span>
            {history.length > 0 && (
              <button className="btnsec" onClick={undo}>
                {t("undo")}
              </button>
            )}
          </div>
          <div className="rdinputs" style={{ marginBottom: 10 }}>
            {named.map((player) => (
              <div className="rdrow" key={player.id}>
                <span className="rdname">{player.name}</span>
                <div className="rdfields">
                  <div className="rdfrow">
                    <input
                      className="rdinp"
                      name="custom-round-score"
                      type="number"
                      placeholder="0"
                      value={roundScores[player.id] || ""}
                      onChange={(event) => setRoundScores((currentScores) => ({ ...currentScores, [player.id]: event.target.value }))}
                      aria-label={`${t("registerRound")} ${rounds + 1} ${player.name}`}
                    />
                    <span className="rdlbl">{t("ptsLabel")}</span>
                  </div>
                </div>
                <span className="rdtotal">{roundScores[player.id] || "—"}</span>
              </div>
            ))}
          </div>
          <span className="flbl" style={{ marginBottom: 6 }}>
            {t("whoWon")}
          </span>
          <div className="wnrbtns">
            {named.map((player) => (
              <button
                key={player.id}
                className="wnrbtn"
                onClick={() => {
                  haptic("light");
                  commitRound(player.id);
                }}
              >
                🎮 {player.name}
              </button>
            ))}
            <button
              className="wnrbtn"
              onClick={() => {
                haptic("light");
                commitRound(null);
              }}
            >
              {t("customNoWinner")}
            </button>
          </div>
        </div>
      )}

      {rounds > 0 && (
        <button
          data-testid="save-match"
          className="btnpri"
          style={{ marginTop: 8 }}
          onClick={() => {
            haptic("strong");
            handleSave();
          }}
        >
          {t("saveMatch")}
        </button>
      )}
    </div>
  );
}

export default memo(CustomNewMatch)
