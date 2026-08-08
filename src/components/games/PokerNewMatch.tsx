import { memo, useCallback, useEffect, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import PillSwitch from "../ui/PillSwitch";
import Tooltip from "../ui/Tooltip";

interface PlayerInputState {
  id: string;
  name: string;
}

interface PokerHistoryEntry {
  dealerIndex: number;
  betsSnap: Record<string, string>;
  winnersSnap: string[];
  netHistorySnap: Record<string, number>;
  stacksSnap: Record<string, number>;
}

interface PokerDraft {
  players?: PlayerInputState[];
  buyIn?: number;
  smallBlind?: number;
  bigBlind?: number;
  useBlinds?: boolean;
  dealerIndex?: number;
  netHistory?: Record<string, number>;
  stacks?: Record<string, number>;
  rounds?: number;
  history?: PokerHistoryEntry[];
  inProgress?: boolean;
  setupDone?: boolean;
}

interface PokerSavePayload extends Match {
  players: Array<{ name: string; score: number; net: number }>;
  winner: string | null;
  rounds: number;
}

interface PokerNewMatchProps {
  onSave: (match: PokerSavePayload) => void;
  knownNames: string[];
  draft?: PokerDraft | null;
  onDraftChange?: (draft: PokerDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

function PokerNewMatch({
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  playerGroups = [],
  onSavePlayerGroups,
}: PokerNewMatchProps) {
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [buyIn, setBuyIn] = useState(draft?.buyIn ?? 100);
  const [smallBlind, setSmallBlind] = useState(draft?.smallBlind ?? 5);
  const [bigBlind, setBigBlind] = useState(draft?.bigBlind ?? 10);
  const [useBlinds, setUseBlinds] = useState(draft?.useBlinds ?? false);
  const [dealerIndex, setDealerIndex] = useState(draft?.dealerIndex ?? 0);
  const [bets, setBets] = useState<Record<string, string>>({});
  const [winners, setWinners] = useState<string[]>([]);
  const [netHistory, setNetHistory] = useState<Record<string, number>>(draft?.netHistory || {});
  const [stacks, setStacks] = useState<Record<string, number>>(draft?.stacks || {});
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [history, setHistory] = useState<PokerHistoryEntry[]>(draft?.history || []);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);
  const [setupDone, setSetupDone] = useState(draft?.setupDone || false);

  useEffect(() => {
    if (inProgress || rounds > 0 || players.some(p => p.name.trim())) {
      onDraftChange?.({
        players,
        buyIn,
        smallBlind,
        bigBlind,
        useBlinds,
        dealerIndex,
        netHistory,
        stacks,
        rounds,
        history,
        inProgress,
        setupDone,
      });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [bigBlind, buyIn, dealerIndex, history, inProgress, netHistory, onDraftChange, players, rounds, setupDone, smallBlind, stacks, useBlinds]);

  const named = players.filter((player) => player.name.trim());
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDups = Object.values(nameCount).some((value) => value > 1);
  const dealer = named[dealerIndex] || named[0];
  const sbPlayer = named[(dealerIndex + 1) % named.length];
  const bbPlayer = named[(dealerIndex + 2) % named.length];
  const pot = Object.values(bets).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);

  const startGame = () => {
    const initialStacks: Record<string, number> = {};
    named.forEach((player) => {
      initialStacks[player.id] = buyIn;
    });
    setStacks(initialStacks);
    const initialNetHistory: Record<string, number> = {};
    named.forEach((player) => {
      initialNetHistory[player.id] = 0;
    });
    setNetHistory(initialNetHistory);
    setSetupDone(true);
    setInProgress(true);
    haptic("medium");
  };

  const commitRound = useCallback(() => {
    if (!winners.length) return;
    const share = pot / winners.length;
    const nextNetHistory = { ...netHistory };
    const nextStacks = { ...stacks };

    named.forEach((player) => {
      const contribution = parseFloat(bets[player.id] || "0");
      nextNetHistory[player.id] = (nextNetHistory[player.id] || 0) - contribution;
      nextStacks[player.id] = (nextStacks[player.id] || buyIn) - contribution;
    });
    winners.forEach((winnerId) => {
      nextNetHistory[winnerId] = (nextNetHistory[winnerId] || 0) + share;
      nextStacks[winnerId] = (nextStacks[winnerId] || 0) + share;
    });

    const snapshot: PokerHistoryEntry = {
      dealerIndex,
      betsSnap: { ...bets },
      winnersSnap: [...winners],
      netHistorySnap: { ...netHistory },
      stacksSnap: { ...stacks },
    };
    setHistory((currentHistory) => [...currentHistory, snapshot]);
    setNetHistory(nextNetHistory);
    setStacks(nextStacks);
    setRounds((currentRounds) => currentRounds + 1);
    setBets({});
    setWinners([]);
    setDealerIndex((currentIndex) => (currentIndex + 1) % named.length);
    haptic("medium");
  }, [bets, buyIn, dealerIndex, named, netHistory, pot, stacks, winners]);

  const undoLast = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setNetHistory(last.netHistorySnap);
    setStacks(last.stacksSnap);
    setDealerIndex(last.dealerIndex);
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

  const toggleWinner = (id: string) => {
    setWinners((currentWinners) => (currentWinners.includes(id) ? currentWinners.filter((winnerId) => winnerId !== id) : [...currentWinners, id]));
  };

  const canCommit = winners.length > 0;

  return (
    <div>
      {!setupDone && (
        <div className="sec">
          <div style={{ display: "flex", alignItems: "center", gap: 12, rowGap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            <span className="flbl" style={{ margin: 0, flexShrink: 0 }}>{t("players")}</span>
            <GroupPicker
              t={t}
              playerGroups={playerGroups}
              maxPlayers={9}
            gameId="poker"
            onLoad={(groupPlayers, groupLinked) => {
              setPlayers(groupPlayers as PlayerInputState[]);
              onLinkedPlayersChange(groupLinked as LinkedPlayer[]);
            }}
            onDiscard={() => {
              setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
              setBets({});
              setWinners([]);
              setNetHistory({});
              setStacks({});
              setRounds(0);
              setHistory([]);
              setInProgress(false);
              setSetupDone(false);
              setDealerIndex(0);
              onLinkedPlayersChange([]);
            }}
              hasPlayers={setupDone || inProgress || rounds > 0 || players.some((player) => player.name.trim())}
              style={{ flex: 1, minWidth: 0, marginTop: 0, marginBottom: 0 }}
            />
          </div>
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
          {players.length < 9 && (
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

          <div style={{ marginTop: 14 }}>
            <span className="flbl">{t("pokerBuyinPerPlayer")}</span>
            <div className="pillrow">
              {[50, 100, 200, 500].map((value) => (
                <button
                  key={value}
                  onClick={() => setBuyIn(value)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--rxs)",
                    cursor: "pointer",
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "1.05rem",
                    letterSpacing: "1.5px",
                    border: `1.5px solid ${buyIn === value ? "var(--gc)" : "var(--content-border)"}`,
                    background:
                      buyIn === value ? "color-mix(in srgb,var(--gc) 12%,var(--content-surface-strong))" : "var(--content-surface-strong)",
                    color: buyIn === value ? "var(--gc)" : "var(--tx)",
                  }}
                >
                  {t("currency")}
                  {value}
                </button>
              ))}
            </div>
          </div>

            <div style={{ marginTop: 14 }}>
              <div className="detail-toggle-row" style={{ marginBottom: useBlinds ? 10 : 0 }}>
                <div className="detail-toggle-copy">
                  <span className="detail-toggle-label">{t("pokerUseBlinds")}</span>
                </div>
                <PillSwitch
                  enabled={useBlinds}
                  onToggle={setUseBlinds}
                  ariaLabel={t("pokerUseBlinds")}
                  testId="poker-blinds-toggle"
                />
              </div>
            {useBlinds && (
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  ["SB", smallBlind, setSmallBlind],
                  ["BB", bigBlind, setBigBlind],
                ].map(([label, value, setter]) => (
                  <div
                    key={String(label)}
                    style={{
                      flex: 1,
                      background: "var(--content-surface-strong)",
                      border: "1px solid var(--content-border)",
                      borderRadius: "var(--rxs)",
                      padding: "8px 10px",
                      boxShadow: "var(--content-input-shadow)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: ".62rem",
                        fontWeight: 800,
                        letterSpacing: "2px",
                        color: "var(--tx3)",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {label === "SB" ? t("blindSmall") : t("blindBig")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: ".8rem", color: "var(--tx3)" }}>{t("currency")}</span>
                      <input
                        className="rdinp"
                        name="poker-blind"
                        type="number"
                        min="1"
                        step="1"
                        value={value as number}
                        onChange={(event) => (setter as (value: number) => void)(parseFloat(event.target.value) || 1)}
                        style={{ width: "100%" }}
                        aria-label={label === "SB" ? t("blindSmall") : t("blindBig")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {named.length >= 2 && (
            <div style={{ marginTop: 14 }}>
              <span className="flbl">🃏 Dealer inicial</span>
              <div className="pillrow" style={{ flexWrap: "wrap", gap: 6 }}>
                {named.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => setDealerIndex(index)}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 14px",
                      borderRadius: "var(--rxs)",
                      cursor: "pointer",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      letterSpacing: "1.5px",
                      border: `1.5px solid ${dealerIndex === index ? "var(--gc)" : "var(--bo2)"}`,
                      background: dealerIndex === index ? "color-mix(in srgb,var(--gc) 15%,transparent)" : "var(--ibg)",
                      color: dealerIndex === index ? "var(--gc)" : "var(--tx2)",
                    }}
                  >
                    🃏 {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {named.length >= 2 && !hasDups && (
            <button className="btnpri" style={{ marginTop: 14 }} onClick={startGame}>
              {t("pokerStartMatch")}
            </button>
          )}
        </div>
      )}

      {setupDone && named.length >= 2 && (
        <div className="sb">
          <div className="sbhdr">
            <span className="sbtitle">🃏 Stacks</span>
            <span className="sbround">{rounds > 0 ? `Mano ${rounds}` : t("notStarted")}</span>
          </div>
          {[...named].sort((left, right) => (stacks[right.id] || 0) - (stacks[left.id] || 0)).map((player, index) => {
            const stack = stacks[player.id] ?? buyIn;
            const net = netHistory[player.id] || 0;
            const isDealer = dealer?.id === player.id;
            const isSB = useBlinds && sbPlayer?.id === player.id;
            const isBB = useBlinds && bbPlayer?.id === player.id;
            const barColor = net >= 0 ? "var(--gc)" : "#E63946";
            const percent = Math.min((stack / (buyIn * 2)) * 100, 100);
            return (
              <div key={player.id} className={`sbrow${index === 0 && rounds > 0 ? " lead" : ""}`}>
                <span className="sbrank" style={{ fontSize: ".85rem" }}>
                  {isDealer ? "🃏" : isSB ? "SB" : isBB ? "BB" : index + 1}
                </span>
                <span className="sbname">
                  {player.name}
                  {net !== 0 && (
                    <span style={{ fontSize: ".65rem", marginLeft: 5, fontWeight: 700, color: net > 0 ? "#52b788" : "#E63946" }}>
                      {net > 0 ? "+" : ""}
                      {t("currency")}
                      {net.toFixed(0)}
                    </span>
                  )}
                </span>
                <div className="sbprog">
                  <div className="sbbar" style={{ width: `${percent}%`, background: barColor }} />
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <div className="sbscore">
                    {t("currency")}
                    {stack.toFixed(0)}
                  </div>
                  {rounds > 0 && net !== 0 && (
                    <div style={{ fontSize: ".58rem", color: "var(--tx3)", fontWeight: 600 }}>
                      {net >= 0 ? "+" : ""}
                      {t("currency")}
                      {(net / rounds).toFixed(0)}{t("pokerPerRound")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {setupDone && named.length >= 2 && (
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
              Mano {rounds + 1}
              {rounds > 0 && (
                <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: ".72rem", fontWeight: 600, marginLeft: 6, opacity: 0.7 }}>
                  ({rounds} jugadas)
                </span>
              )}
            </span>
            {history.length > 0 && (
              <button className="btnsec" onClick={undoLast}>
                {t("undo")}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div
              style={{
                flex: 1,
                minWidth: 100,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "color-mix(in srgb,var(--gc) 10%,var(--glass))",
                border: "1px solid color-mix(in srgb,var(--gc) 30%,transparent)",
                borderRadius: "var(--rxs)",
                padding: "8px 12px",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🃏</span>
              <div>
                <div style={{ fontSize: ".58rem", fontWeight: 800, letterSpacing: "2px", color: "var(--gc)", textTransform: "uppercase" }}>
                  Dealer
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", letterSpacing: "1.5px", color: "var(--tx)" }}>
                  {dealer?.name || "—"}
                </div>
              </div>
            </div>
            {useBlinds && sbPlayer && (
              <div
                style={{
                  flex: 1,
                  minWidth: 100,
                  background: "var(--ibg)",
                  border: "1px solid var(--bo)",
                  borderRadius: "var(--rxs)",
                  padding: "8px 12px",
                }}
              >
                <div style={{ fontSize: ".58rem", fontWeight: 800, letterSpacing: "2px", color: "var(--tx3)", textTransform: "uppercase" }}>
                  SB / BB
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: ".9rem", letterSpacing: "1px", color: "var(--tx2)" }}>
                  {sbPlayer.name} / {bbPlayer?.name || "—"}
                </div>
                <div style={{ fontSize: ".68rem", color: "var(--tx3)", marginTop: 2 }}>
                  {t("currency")}
                  {smallBlind} / {t("currency")}
                  {bigBlind}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              background: "color-mix(in srgb,#f4a261 12%,var(--glass))",
              border: "1px solid color-mix(in srgb,#f4a261 35%,transparent)",
              borderRadius: "var(--rxs)",
              padding: "10px 14px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: "2px", color: "#f4a261", textTransform: "uppercase" }}>Pozo total</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", letterSpacing: "2px", color: "var(--tx)" }}>
                {t("currency")}
                {pot.toFixed(2)}
              </div>
            </div>
            {useBlinds && pot === 0 && (
              <button
                onClick={() => {
                  const nextBets: Record<string, string | number> = {};
                  if (sbPlayer) nextBets[sbPlayer.id] = smallBlind;
                  if (bbPlayer) nextBets[bbPlayer.id] = bigBlind;
                  setBets(nextBets as Record<string, string>);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--rxs)",
                  border: "1px solid #f4a261",
                  background: "color-mix(in srgb,#f4a261 15%,transparent)",
                  color: "#f4a261",
                  fontSize: ".75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Blinds
              </button>
            )}
          </div>

          <span className="flbl" style={{ marginBottom: 8 }}>
            Aportes al pozo
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {named.map((player) => (
              <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontWeight: 600, color: "var(--tx)", fontSize: ".85rem" }}>{player.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: ".78rem", color: "var(--tx3)" }}>{t("currency")}</span>
                  <input
                    className="rdinp"
                    name="poker-pot-contribution"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={bets[player.id] || ""}
                    onChange={(event) => setBets((currentBets) => ({ ...currentBets, [player.id]: event.target.value }))}
                    style={{ width: 72, textAlign: "center" }}
                    aria-label={`Aportes al pozo ${player.name}`}
                  />
                </div>
                {bets[player.id] && parseFloat(bets[player.id]) > 0 && (
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: ".9rem",
                      color: "var(--tx2)",
                      letterSpacing: "1px",
                      minWidth: 50,
                      textAlign: "right",
                    }}
                  >
                    {t("currency")}
                    {parseFloat(bets[player.id]).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <span className="flbl" style={{ marginBottom: 6 }}>
            {t("potWinner")} <span style={{ fontWeight: 400, color: "var(--tx3)", fontSize: ".75rem" }}>{t("potWinnerHint")}</span>
          </span>
          <div className="wnrbtns" style={{ marginBottom: 14 }}>
            {named.map((player) => {
              const isWinner = winners.includes(player.id);
              return (
                <button
                  key={player.id}
                  className="wnrbtn"
                  onClick={() => toggleWinner(player.id)}
                  style={{
                    border: `2px solid ${isWinner ? "var(--gc)" : "var(--bo2)"}`,
                    background: isWinner ? "color-mix(in srgb,var(--gc) 12%,var(--glass))" : "var(--glass)",
                    color: isWinner ? "var(--gc)" : "var(--tx2)",
                  }}
                >
                  {isWinner ? "🏆 " : "🃏 "}
                  {player.name}
                  {isWinner && pot > 0 && (
                    <span style={{ marginLeft: 6, fontSize: ".72rem", opacity: 0.8 }}>
                      +{t("currency")}
                      {(pot / winners.length).toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button className="btnpri" disabled={!canCommit} onClick={commitRound} style={{ opacity: canCommit ? 1 : 0.4 }}>
            ✓ {t("confirmHand")}
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

export default memo(PokerNewMatch)
