import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { PORTION_FOODS, getPortionFoodByKey } from "../../data/portionFoods";
import { haptic, mkId } from "../../lib/storage";
import type { DraftRecord, GameDefinition, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import ConfirmModal from "../ui/ConfirmModal";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";

interface PortionFood {
  key: string;
  name: string;
  emoji: string;
  color: string;
  tKey: string;
}

interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

interface PortionPlayer {
  id: string;
  name: string;
}

interface PositionedPlayer extends PortionPlayer {
  x: number;
  y: number;
}

interface PortionMatchPlayer {
  name: string;
  score: number;
}

interface PortionDraft extends DraftRecord {
  players?: PortionPlayer[];
  phase?: "setup" | "playing";
  selectedFoodKey?: string | null;
  foodKey?: string | null;
  scores?: Record<string, number>;
  selectedPlayerId?: string | null;
}

interface PortionSavePayload {
  id: string;
  date: string;
  players: PortionMatchPlayer[];
  winner: string | null;
  rounds: number;
  foodKey: string | null;
  foodName: string | null;
  foodEmoji?: string;
}

interface PorcionNewMatchProps {
  game: GameDefinition;
  onSave: (match: PortionSavePayload) => void;
  knownNames: string[];
  draft?: PortionDraft | null;
  onDraftChange?: (draft: PortionDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange?: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  t?: TranslationFn;
}

type CSSVarStyle = CSSProperties & Record<"--gc", string>;

function toTestId(value = "") {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "player"
  );
}

function PorcionNewMatch({
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
}: PorcionNewMatchProps) {
  const [players, setPlayers] = useState<PortionPlayer[]>(
    draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }],
  );
  const [phase, setPhase] = useState<"setup" | "playing">(draft?.phase || "setup");
  const [selectedFoodKey, setSelectedFoodKey] = useState<string | null>(
    draft?.selectedFoodKey || draft?.foodKey || null,
  );
  const [scores, setScores] = useState<Record<string, number>>(draft?.scores || {});
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(draft?.selectedPlayerId || null);
  const [animating, setAnimating] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showMultiplier, setShowMultiplier] = useState(false);
  const lastTapRef = useRef(0);
  const streakRef = useRef(0);

  const named = useMemo(() => players.filter((player) => player.name.trim()), [players]);
  const nameCount = useMemo(() => {
    const acc: Record<string, number> = {};
    named.forEach((player) => {
      const normalized = player.name.trim().toLowerCase();
      acc[normalized] = (acc[normalized] || 0) + 1;
    });
    return acc;
  }, [named]);
  const hasDuplicates = useMemo(() => Object.values(nameCount).some((value) => value > 1), [nameCount]);
  const selectedFood = useMemo(() => getPortionFoodByKey(selectedFoodKey) as PortionFood | null, [selectedFoodKey]);

  useEffect(() => {
    if (phase !== "setup" || players.some(p => p.name.trim())) {
      onDraftChange?.({
        players,
        scores,
        phase,
        selectedFoodKey,
        selectedPlayerId,
      });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [onDraftChange, phase, players, scores, selectedFoodKey, selectedPlayerId]);

  const playerPositions = useMemo<PositionedPlayer[]>(() => {
    const total = named.length;
    if (total === 0) return [];
    return named.map((player, index) => {
      const angle = (2 * Math.PI * index) / total - Math.PI / 2;
      return { ...player, x: Math.cos(angle), y: Math.sin(angle) };
    });
  }, [named]);

  useEffect(() => {
    setStreak(0);
    streakRef.current = 0;
    setShowMultiplier(false);
  }, [selectedPlayerId]);

  const handleTap = useCallback(() => {
    if (!selectedPlayerId || animating) return;
    const now = Date.now();
    const diff = now - lastTapRef.current;
    lastTapRef.current = now;

    const nextStreak = diff < 600 ? streakRef.current + 1 : 1;
    streakRef.current = nextStreak;
    setStreak(nextStreak);

    if (nextStreak >= 3) {
      setShowMultiplier(true);
      setTimeout(() => setShowMultiplier(false), 500);
    }

    haptic("light");
    setAnimating(true);
    setScores((currentScores) => ({
      ...currentScores,
      [selectedPlayerId]: (currentScores[selectedPlayerId] || 0) + 1,
    }));
    setTimeout(() => setAnimating(false), 150);
  }, [animating, selectedPlayerId]);

  const handleSave = useCallback(() => {
    const ranking = [...named].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0));

    haptic("strong");
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: ranking.map((player) => ({
        name: player.name,
        score: scores[player.id] || 0,
      })),
      winner: ranking[0]?.name || null,
      rounds: 1,
      foodKey: selectedFood?.key || null,
      foodName: t(selectedFood?.tKey || "") || selectedFood?.name || null,
      foodEmoji: selectedFood?.emoji || undefined,
    });
  }, [named, onSave, scores, selectedFood, t]);

  const handleReset = useCallback(() => {
    setScores({});
    setSelectedPlayerId(null);
    setSelectedFoodKey(null);
    setStreak(0);
    streakRef.current = 0;
    setShowMultiplier(false);
    lastTapRef.current = 0;
    setPhase("setup");
    onDraftChange?.(null);
  }, [onDraftChange]);

  const sorted = useMemo(
    () => [...named].sort((left, right) => (scores[right.id] || 0) - (scores[left.id] || 0)),
    [named, scores],
  );
  const maxScore = useMemo(() => Math.max(...Object.values(scores), 1), [scores]);
  const currentPlayerScore = selectedPlayerId ? (scores[selectedPlayerId] || 0) : 0;
  const canStart = named.length >= 1 && !hasDuplicates && !!selectedFoodKey;
  const accentColor = selectedFood?.color || game.color;
  const accentEmoji = selectedFood?.emoji || game.emoji;

  if (phase === "setup") {
    return (
      <div data-testid="portion-setup">
        <div className="sec">
          <GroupPicker
            t={t}
            playerGroups={playerGroups}
            maxPlayers={20}
            gameId={game.id}
            onLoad={(groupPlayers, groupLinkedPlayers) => {
              setPlayers(groupPlayers as PortionPlayer[]);
              onLinkedPlayersChange?.(groupLinkedPlayers as LinkedPlayer[]);
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
                      currentPlayers.map((currentPlayer) =>
                        currentPlayer.id === player.id ? { ...currentPlayer, name: value } : currentPlayer,
                      ),
                    )
                  }
                  onLink={({ uid, name }) => {
                    setPlayers((currentPlayers) =>
                      currentPlayers.map((currentPlayer) =>
                        currentPlayer.id === player.id ? { ...currentPlayer, name } : currentPlayer,
                      ),
                    );
                    onLinkedPlayersChange?.([
                      ...linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id),
                      { uid, name, playerId: player.id },
                    ]);
                  }}
                  onUnlink={() => onLinkedPlayersChange?.(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id))}
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
                      onLinkedPlayersChange?.(linkedPlayers.filter((linkedPlayer) => linkedPlayer.playerId !== player.id));
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {players.length < 20 && (
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

        <div className="sec" style={{ marginTop: 12 }}>
          <div className="flbl">{t("portionSetupTitle")}</div>
          <div style={{ color: "var(--tx2)", fontSize: ".78rem", marginTop: 6 }}>{t("portionSetupHint")}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 10,
              marginTop: 12,
            }}
          >
            {PORTION_FOODS.map((food) => {
              const typedFood = food as PortionFood;
              const isSelected = selectedFoodKey === typedFood.key;
              return (
                <button
                  key={typedFood.key}
                  type="button"
                  className="btnsec"
                  data-testid={`portion-food-${typedFood.key}`}
                  onClick={() => setSelectedFoodKey(typedFood.key)}
                  style={{
                    margin: 0,
                    minHeight: 108,
                    display: "grid",
                    gridTemplateRows: "1fr auto",
                    justifyItems: "center",
                    alignItems: "stretch",
                    gap: 10,
                    borderColor: isSelected ? typedFood.color : "var(--bo2)",
                    background: isSelected ? `color-mix(in srgb,${typedFood.color} 15%,transparent)` : "var(--ibg)",
                    color: isSelected ? typedFood.color : "var(--tx)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.6rem",
                      lineHeight: 1,
                    }}
                  >
                    {typedFood.emoji}
                  </span>
                  <span style={{ width: "100%", fontWeight: 700, lineHeight: 1.15 }}>{t(typedFood.tKey) || typedFood.name}</span>
                </button>
              );
            })}
          </div>
          {!selectedFoodKey && (
            <div style={{ color: "#ff9f43", fontSize: ".74rem", marginTop: 10, fontWeight: 700 }}>{t("portionSetupRequired")}</div>
          )}
        </div>

        <button
          className="btnpri"
          data-testid="portion-start-match"
          disabled={!canStart}
          style={{ marginTop: 12 }}
          onClick={() => {
            if (!canStart) return;
            haptic("medium");
            setPhase("playing");
          }}
        >
          {t("startGame")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", "--gc": accentColor } as CSSVarStyle}>
      {sorted.length > 0 && (
        <div style={{ width: "100%", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {sorted.map((player, index) => {
              const score = scores[player.id] || 0;
              const progress = Math.round((score / maxScore) * 100);
              const isSelected = player.id === selectedPlayerId;
              return (
                <button
                  key={player.id}
                  onClick={() => {
                    haptic("light");
                    setSelectedPlayerId(player.id);
                  }}
                  style={{
                    flex: "0 0 auto",
                    minWidth: 70,
                    padding: "6px 10px",
                    borderRadius: 12,
                    border: isSelected ? `2px solid ${accentColor}` : "2px solid transparent",
                    background: isSelected ? `color-mix(in srgb,${accentColor} 12%,transparent)` : "var(--card-bg)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--tx2)" }}>
                    {index === 0 && score > 0 ? "👑 " : ""}
                    {player.name.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, color: accentColor }}>
                    {score}
                  </span>
                  <div style={{ width: "100%", height: 4, borderRadius: 2, background: "var(--bg2)" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: accentColor, transition: "width 0.2s ease" }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: "min(85vw, 340px)",
          height: "min(85vw, 340px)",
          margin: "0 auto",
        }}
      >
        {playerPositions.map((player) => {
          const score = scores[player.id] || 0;
          const isSelected = player.id === selectedPlayerId;
          const centerX = 50 + player.x * 38;
          const centerY = 50 + player.y * 38;

          return (
            <button
              key={player.id}
              data-testid={`portion-player-${toTestId(player.name)}`}
              onClick={() => {
                haptic("light");
                setSelectedPlayerId(player.id);
              }}
              style={{
                position: "absolute",
                left: `${centerX}%`,
                top: `${centerY}%`,
                transform: "translate(-50%, -50%)",
                width: isSelected ? 56 : 48,
                height: isSelected ? 56 : 48,
                borderRadius: "50%",
                border: isSelected ? `3px solid ${accentColor}` : "2px solid var(--border)",
                background: isSelected ? `color-mix(in srgb,${accentColor} 12%,transparent)` : "var(--card-bg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? `0 0 16px ${accentColor}44` : "none",
                zIndex: isSelected ? 10 : 1,
                padding: 0,
              }}
            >
              <span
                style={{
                  fontSize: ".55rem",
                  fontWeight: 700,
                  color: "var(--tx2)",
                  lineHeight: 1,
                  maxWidth: 44,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {player.name.split(" ")[0]}
              </span>
              {score > 0 && (
                <span
                  style={{
                    fontSize: ".85rem",
                    fontWeight: 800,
                    fontFamily: "'Bebas Neue',sans-serif",
                    letterSpacing: 1,
                    color: accentColor,
                    lineHeight: 1,
                  }}
                >
                  {score}
                </span>
              )}
            </button>
          );
        })}

        <button
          data-testid="portion-center-emoji"
          onClick={handleTap}
          disabled={!selectedPlayerId}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${animating ? 1.25 : selectedPlayerId ? 1.08 : 1})`,
            width: "min(38vw, 150px)",
            height: "min(38vw, 150px)",
            borderRadius: "50%",
            border: selectedPlayerId ? `4px solid ${accentColor}` : "3px solid var(--border)",
            background: selectedPlayerId ? `color-mix(in srgb,${accentColor} 12%,transparent)` : "var(--card-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: selectedPlayerId ? "pointer" : "default",
            transition: "transform 0.15s ease, border-color 0.2s ease, background 0.2s ease",
            boxShadow: selectedPlayerId ? `0 0 24px ${accentColor}33` : "none",
            padding: 0,
          }}
        >
          <span
            style={{
              fontSize: "min(18vw, 80px)",
              lineHeight: 1,
              userSelect: "none",
              filter: selectedPlayerId ? "none" : "grayscale(0.4)",
              transition: "filter 0.2s ease",
            }}
          >
            {accentEmoji}
          </span>
        </button>
      </div>

      {showMultiplier && streak >= 3 && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "10%",
            zIndex: 100,
            pointerEvents: "none",
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: 2,
            color: accentColor,
            textShadow: `0 0 20px ${accentColor}88, 0 0 40px ${accentColor}44`,
            animation: "porcionMultiplierPop .5s ease-out forwards",
          }}
        >
          x{streak}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16, width: "100%", maxWidth: 340 }}>
        <button
          className="btnpri"
          data-testid="portion-reset"
          style={{ flex: 1, background: "var(--bg3)", color: "var(--tx)", border: "1.5px solid var(--bo2)" }}
          onClick={() => setShowConfirmReset(true)}
        >
          {t("resetBtn")}
        </button>
        {currentPlayerScore > 0 && (
          <button className="btnpri" data-testid="save-match" style={{ flex: 1 }} onClick={handleSave}>
            {t("saveMatch")}
          </button>
        )}
      </div>

      <style>{`
        @keyframes porcionMultiplierPop {
          0% { opacity: 1; transform: scale(0.5) translateY(0); }
          30% { opacity: 1; transform: scale(1.3) translateY(-8px); }
          100% { opacity: 0; transform: scale(1.6) translateY(-24px); }
        }
      `}</style>

      {showConfirmReset && (
        <ConfirmModal
          title={t("resetBtn")}
          msg={t("confirmReset")}
          confirmLabel={t("resetBtn")}
          cancelLabel={t("cancel")}
          confirmTestId="portion-reset-confirm"
          onConfirm={() => {
            handleReset();
            setShowConfirmReset(false);
          }}
          onCancel={() => setShowConfirmReset(false)}
        />
      )}
    </div>
  );
}

export default memo(PorcionNewMatch)
