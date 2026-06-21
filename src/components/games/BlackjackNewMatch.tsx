import { memo, useCallback, useEffect, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import PillSwitch from "../ui/PillSwitch";

interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

interface PlayerInputState {
  id: string;
  name: string;
}

type RoundResult = "win" | "lose" | "push";

interface BlackjackHistoryEntry {
  bankerIndex: number;
  betsSnap: Record<string, string>;
  resultsSnap: Record<string, RoundResult>;
  netHistorySnap: Record<string, number>;
}

interface BlackjackDraft {
  players?: PlayerInputState[];
  bankerIndex?: number;
  autoRotate?: boolean;
  netHistory?: Record<string, number>;
  rounds?: number;
  history?: BlackjackHistoryEntry[];
  inProgress?: boolean;
}

interface BlackjackSavePayload extends Match {
  players: Array<{ name: string; score: number; net: number }>;
  winner: string | null;
  rounds: number;
}

interface BlackjackNewMatchProps {
  onSave: (match: BlackjackSavePayload) => void;
  knownNames: string[];
  draft?: BlackjackDraft | null;
  onDraftChange?: (draft: BlackjackDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

const RESULTS: RoundResult[] = ["win", "lose", "push"];

function BlackjackNewMatch({
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  playerGroups = [],
  onSavePlayerGroups,
}: BlackjackNewMatchProps) {
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [bankerIndex, setBankerIndex] = useState(draft?.bankerIndex ?? 0);
  const [autoRotate, setAutoRotate] = useState(draft?.autoRotate ?? true);
  const [bets, setBets] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, RoundResult>>({});
  const [netHistory, setNetHistory] = useState<Record<string, number>>(draft?.netHistory || {});
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<BlackjackHistoryEntry[]>(draft?.history || []);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);

  useEffect(() => {
    if (inProgress || rounds > 0 || players.some(p => p.name.trim())) {
      onDraftChange?.({ players, bankerIndex, autoRotate, netHistory, rounds, history, inProgress });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [autoRotate, bankerIndex, history, inProgress, netHistory, onDraftChange, players, rounds]);

  const named = players.filter((player) => player.name.trim());
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDups = Object.values(nameCount).some((value) => value > 1);
  const nonBankers = named.filter((_, index) => index !== bankerIndex);
  const banker = named[bankerIndex] || named[0];

  const commitRound = useCallback(() => {
    if (!banker) return;
    const nextNetHistory = { ...netHistory };
    let bankerDelta = 0;

    nonBankers.forEach((player) => {
      const bet = parseFloat(bets[player.id] || "0");
      const result = results[player.id] || "lose";
      if (result === "win") {
        nextNetHistory[player.id] = (nextNetHistory[player.id] || 0) + bet;
        bankerDelta -= bet;
      }
      if (result === "lose") {
        nextNetHistory[player.id] = (nextNetHistory[player.id] || 0) - bet;
        bankerDelta += bet;
      }
    });

    nextNetHistory[banker.id] = (nextNetHistory[banker.id] || 0) + bankerDelta;

    const snapshot: BlackjackHistoryEntry = {
      bankerIndex,
      betsSnap: { ...bets },
      resultsSnap: { ...results },
      netHistorySnap: { ...netHistory },
    };
    setHistory((currentHistory) => [...currentHistory, snapshot]);
    setNetHistory(nextNetHistory);
    setRounds((currentRounds) => currentRounds + 1);
    setBets({});
    setResults({});
    setInProgress(true);

    if (autoRotate) {
      setBankerIndex((currentIndex) => (currentIndex + 1) % named.length);
    }
    haptic("medium");
  }, [autoRotate, banker, bankerIndex, bets, named.length, netHistory, nonBankers, results]);

  const undoLast = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setNetHistory(last.netHistorySnap);
    setBankerIndex(last.bankerIndex);
    setRounds((currentRounds) => currentRounds - 1);
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    if (history.length <= 1) setInProgress(false);
  };

  const handleSave = () => {
    const sorted = [...named].sort((left, right) => (netHistory[right.id] || 0) - (netHistory[left.id] || 0));
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sorted.map((player) => ({
        name: player.name,
        score: Math.round((netHistory[player.id] || 0) * 100) / 100,
        net: netHistory[player.id] || 0,
      })),
      winner: sorted[0]?.name || null,
      rounds,
    });
    haptic("strong");
  };

  const canCommit = nonBankers.every((player) => results[player.id]);
  const resLabel: Record<RoundResult, string> = { win: t("blackjackWin"), lose: t("blackjackLose"), push: t("blackjackPush") };
  const resColor: Record<RoundResult, string> = { win: "#52b788", lose: "#E63946", push: "var(--tx2)" };

  return (
    <div>
      {!inProgress && (
        <div className="sec">
          <span className="flbl">{t("players")}</span>
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={8}
            onLoad={(groupPlayers, groupLinked) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinked as LinkedPlayer[]);
            }}
            onDiscard={() => {
              setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
              setBets({});
              setResults({});
              setNetHistory({});
              setRounds(0);
              setHistory([]);
              setInProgress(false);
              setBankerIndex(0);
              onLinkedPlayersChange([]);
            }}
            hasPlayers={inProgress || rounds > 0 || players.some((player) => player.name.trim())}
          />
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
          {hasDups && <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, fontWeight: 600 }}>{t("dupPlayerWarning")}</div>}

          {named.length >= 2 && (
            <div style={{ marginTop: 14 }}>
              <span className="flbl">{t("blackjackDealer")}</span>
              <div className="pillrow" style={{ flexWrap: "wrap", gap: 6 }}>
                {named.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => setBankerIndex(index)}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 14px",
                      borderRadius: "var(--rxs)",
                      cursor: "pointer",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      letterSpacing: "1.5px",
                      border: `1.5px solid ${bankerIndex === index ? "var(--gc)" : "var(--content-border)"}`,
                      background:
                        bankerIndex === index
                          ? "color-mix(in srgb,var(--gc) 15%,var(--content-surface-strong))"
                          : "var(--content-surface-strong)",
                      color: bankerIndex === index ? "var(--gc)" : "var(--tx)",
                    }}
                  >
                    🎩 {player.name}
                  </button>
                ))}
              </div>
              <div className="detail-toggle-row" style={{ marginTop: 10 }}>
                <div className="detail-toggle-copy">
                  <span className="detail-toggle-label">{t("autoRotateBank")}</span>
                </div>
                <PillSwitch
                  enabled={autoRotate}
                  onToggle={setAutoRotate}
                  ariaLabel={t("autoRotateBank")}
                  testId="blackjack-auto-rotate-toggle"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {named.length >= 2 && !hasDups && (
        <div className="sb">
          <div className="sbhdr">
            <span className="sbtitle">💰 Resultado neto</span>
            <span className="sbround">{rounds > 0 ? `${t("roundLabel")} ${rounds}` : t("notStarted")}</span>
          </div>
          {[...named].sort((left, right) => (netHistory[right.id] || 0) - (netHistory[left.id] || 0)).map((player, index) => {
            const net = netHistory[player.id] || 0;
            const isBanker = banker?.id === player.id;
            const color = net > 0 ? "#52b788" : net < 0 ? "#E63946" : "var(--tx3)";
            return (
              <div key={player.id} className={`sbrow${index === 0 && rounds > 0 ? " lead" : ""}`}>
                <span className="sbrank">{isBanker ? "🏦" : index + 1}</span>
                <span className="sbname">
                  {player.name}
                  {isBanker && (
                    <span style={{ fontSize: ".65rem", marginLeft: 5, opacity: 0.6, fontWeight: 700, letterSpacing: "1px" }}>BANCA</span>
                  )}
                </span>
                <div className="sbprog">
                  <div
                    className="sbbar"
                    style={{
                      width: `${Math.min((Math.abs(net) / Math.max(...named.map((namedPlayer) => Math.abs(netHistory[namedPlayer.id] || 0)), 1)) * 100, 100)}%`,
                      background: color,
                    }}
                  />
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <div className="sbscore" style={{ color }}>
                    {net === 0 && rounds === 0 ? "—" : `${net >= 0 ? "+" : ""}${t("currency")}${net.toFixed(2)}`}
                  </div>
                  {rounds > 0 && net !== 0 && (
                    <div style={{ fontSize: ".58rem", color: "var(--tx3)", fontWeight: 600 }}>
                      {net >= 0 ? "+" : ""}
                      {t("currency")}
                      {(net / rounds).toFixed(2)}{t("pokerPerRound")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {named.length >= 2 && !hasDups && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
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
              }}
            >
              {`${t("roundLabel")} ${rounds + 1}`}
              {rounds > 0 && (
                <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: ".72rem", fontWeight: 600, marginLeft: 6, opacity: 0.7 }}>
                  ({rounds} {rounds !== 1 ? t("savedCountPlural") : t("savedCount")})
                </span>
              )}
            </span>
            {history.length > 0 && (
              <button className="btnsec" onClick={undoLast}>
                {t("undo")}
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "color-mix(in srgb,var(--gc) 10%,var(--glass))",
              border: "1px solid color-mix(in srgb,var(--gc) 30%,transparent)",
              borderRadius: "var(--rxs)",
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>🎩</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".62rem", fontWeight: 800, letterSpacing: "2px", color: "var(--gc)", textTransform: "uppercase" }}>
                {t("blackjackDealerRound")}
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", letterSpacing: "2px", color: "var(--tx)" }}>
                {banker?.name || "—"}
              </div>
            </div>
            {Object.values(bets).some((value) => parseFloat(value) > 0) && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: "1.5px", color: "var(--tx3)", textTransform: "uppercase" }}>
                  {t("blackjackTotalInPlay")}
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", letterSpacing: "1.5px", color: "var(--tx)" }}>
                  {t("currency")}
                  {Object.values(bets).reduce((sum, value) => sum + (parseFloat(value) || 0), 0).toFixed(2)}
                </div>
              </div>
            )}
            {!autoRotate && named.length > 1 && (
              <button
                onClick={() => setBankerIndex((currentIndex) => (currentIndex + 1) % named.length)}
                style={{
                  marginLeft: "auto",
                  padding: "6px 12px",
                  borderRadius: "var(--rxs)",
                  border: "1px solid var(--bo2)",
                  background: "var(--ibg)",
                  color: "var(--tx2)",
                  fontSize: ".75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("blackjackRotate")}
              </button>
            )}
          </div>

          <span className="flbl" style={{ marginBottom: 8 }}>
            {t("blackjackBetsVsDealer")}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {nonBankers.map((player) => {
              const result = results[player.id];
              const bet = bets[player.id];
              return (
                <div
                  key={player.id}
                  style={{
                    background: "var(--ibg)",
                    border: `1.5px solid ${result ? "var(--gc)" : "var(--bo)"}`,
                    borderRadius: "var(--rxs)",
                    padding: "10px 12px",
                    transition: "border-color .2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: "var(--tx)", fontSize: ".9rem", flex: 1 }}>{player.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: ".8rem", color: "var(--tx3)" }}>{t("currency")}</span>
                      <input
                        className="rdinp"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={bet || ""}
                        onChange={(event) => setBets((currentBets) => ({ ...currentBets, [player.id]: event.target.value }))}
                        style={{ width: 72, textAlign: "center" }}
                        aria-label={`${t("blackjackBetsVsDealer")} ${player.name}`}
                      />
                    </div>
                    {bet && parseFloat(bet) > 0 && (
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: ".95rem", color: "var(--tx2)", letterSpacing: "1px" }}>
                        {t("currency")}
                        {parseFloat(bet).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {RESULTS.map((currentResult) => (
                      <button
                        key={currentResult}
                        onClick={() => setResults((currentResults) => ({ ...currentResults, [player.id]: currentResult }))}
                        style={{
                          flex: 1,
                          padding: "7px 4px",
                          borderRadius: "var(--rxs)",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: ".75rem",
                          letterSpacing: ".5px",
                          border: `1.5px solid ${result === currentResult ? resColor[currentResult] : "var(--bo2)"}`,
                          background:
                            result === currentResult ? `color-mix(in srgb,${resColor[currentResult]} 15%,transparent)` : "var(--glass)",
                          color: result === currentResult ? resColor[currentResult] : "var(--tx3)",
                          transition: "all .15s",
                        }}
                      >
                        {resLabel[currentResult]}
                      </button>
                    ))}
                  </div>
                  {result && bet && parseFloat(bet) > 0 && (
                    <div style={{ marginTop: 6, fontSize: ".75rem", fontWeight: 700, color: resColor[result], textAlign: "right" }}>
                      {result === "win"
                        ? `+${t("currency")}${parseFloat(bet).toFixed(2)}`
                        : result === "lose"
                          ? `-${t("currency")}${parseFloat(bet).toFixed(2)}`
                          : t("blackjackNoChange")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="btnpri" disabled={!canCommit} onClick={commitRound} style={{ opacity: canCommit ? 1 : 0.45 }}>
            {t("blackjackConfirmRound")}
          </button>
        </div>
      )}

      {rounds > 0 && (
        <button className="btnpri" style={{ marginTop: 8 }} onClick={handleSave} data-testid="save-match">
          {t("saveMatch")}
        </button>
      )}
    </div>
  );
}

export default memo(BlackjackNewMatch)
