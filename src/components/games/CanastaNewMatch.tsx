import { useEffect, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { Match, PlayerGroup, TranslationFn } from "../../types";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import ConfirmModal from "../ui/ConfirmModal";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";

interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

interface PlayerInputState {
  id: string;
  name: string;
}

type MatchMode = "teams" | "individual";
type RoundInputValue = number | string;

interface CanastaDraft {
  step?: "setup" | "playing";
  mode?: MatchMode;
  teamNames?: [string, string];
  players?: PlayerInputState[];
  scores?: [number, number];
  rounds?: number;
  hist?: Array<[RoundInputValue, RoundInputValue]>;
  over?: boolean;
  wi?: number | null;
}

interface CanastaSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: MatchMode;
}

interface CanastaNewMatchProps {
  onSave: (match: CanastaSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: CanastaDraft | null;
  onDraftChange?: (draft: CanastaDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

const GOAL = 5000;

export default function CanastaNewMatch({
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  draft = null,
  onDraftChange,
  playerGroups = [],
  onSavePlayerGroups,
}: CanastaNewMatchProps) {
  const [step, setStep] = useState<"setup" | "playing">(draft?.step || "setup");
  const [mode, setMode] = useState<MatchMode>(draft?.mode || "teams");
  const [teamNames, setTeamNames] = useState<[string, string]>(draft?.teamNames || [t("teamUs"), t("teamThem")]);
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [scores, setScores] = useState<[number, number]>(draft?.scores || [0, 0]);
  const [roundInputs, setRoundInputs] = useState<[RoundInputValue, RoundInputValue]>([0, 0]);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [hist, setHist] = useState<Array<[RoundInputValue, RoundInputValue]>>(draft?.hist || []);
  const [over, setOver] = useState(draft?.over || false);
  const [wi, setWi] = useState<number | null>(draft?.wi ?? null);
  const [confirmBack, setConfirmBack] = useState(false);

  useEffect(() => {
    if (step === "playing" || rounds > 0 || players.some(p => p.name.trim())) {
      onDraftChange?.({ step, mode, teamNames, players, scores, rounds, hist, over, wi });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [hist, mode, onDraftChange, over, players, rounds, scores, step, teamNames, wi]);

  const named = players.filter((player) => player.name.trim());
  const labels = mode === "teams" ? teamNames : named.map((player) => player.name);
  const canStart = mode === "teams" ? Boolean(teamNames[0].trim() && teamNames[1].trim()) : named.length >= 2;
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = mode !== "teams" && Object.values(nameCount).some((value) => value > 1);
  const canSaveProgress = over || rounds > 0;

  const commit = () => {
    const nextScores = scores.map((score, index) => score + (Number(roundInputs[index]) || 0)) as [number, number];
    setScores(nextScores);
    setRounds((currentRounds) => currentRounds + 1);
    setHist((currentHistory) => [...currentHistory, [...roundInputs] as [RoundInputValue, RoundInputValue]]);
    setRoundInputs([0, 0]);
    const winnerIndex = nextScores.findIndex((score) => score >= GOAL);
    if (winnerIndex !== -1) {
      setOver(true);
      setWi(winnerIndex);
    }
  };

  const undo = () => {
    if (!hist.length) return;
    const last = hist[hist.length - 1];
    setScores((currentScores) => currentScores.map((value, index) => value - (Number(last[index]) || 0)) as [number, number]);
    setHist((currentHistory) => currentHistory.slice(0, -1));
    setRounds((currentRounds) => currentRounds - 1);
    setOver(false);
    setWi(null);
  };

  const handleSave = (winnerOverride?: string | null) => {
    const resolvedPlayers =
      mode === "teams"
        ? teamNames.map((name, index) => ({ name, score: scores[index] }))
        : named.map((player, index) => ({ name: player.name, score: scores[index] || 0 }));
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: resolvedPlayers,
      winner: winnerOverride === undefined ? (wi !== null ? resolvedPlayers[wi]?.name : null) : winnerOverride,
      rounds,
      limit: GOAL,
      mode,
    });
  };

  const pill = (active: boolean) => ({
    flex: 1,
    padding: "10px",
    borderRadius: "var(--rxs)",
    cursor: "pointer",
    border: `1.5px solid ${active ? "var(--gc)" : "var(--bo2)"}`,
    background: active ? "color-mix(in srgb,var(--gc) 12%,transparent)" : "var(--ibg)",
    color: active ? "var(--gc)" : "var(--tx2)",
    fontFamily: "'Google Sans',sans-serif",
    fontSize: ".86rem",
    fontWeight: 600,
  });

  if (step === "setup") {
    return (
      <div>
        <div className="sec">
          <span className="flbl">{t("mode")}</span>
          <div className="pillrow">
            {[
              ["teams", `⚔️ ${t("teams")}`],
              ["individual", `🧑 ${t("individual")}`],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setMode(value as MatchMode)} style={pill(mode === value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === "teams" ? (
          <div className="sec">
            <span className="flbl">{t("teamNames")}</span>
            <div className="rgap">
              {teamNames.map((name, index) => (
                <input
                  key={`team-${index}`}
                  className="inp"
                  placeholder={`${t("team")} ${index + 1}`}
                  value={name}
                  onChange={(event) =>
                    setTeamNames((currentTeamNames) =>
                      currentTeamNames.map((currentValue, currentIndex) => (currentIndex === index ? event.target.value : currentValue)) as [string, string],
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="sec">
            <GroupPicker
              t={t}
              playerGroups={playerGroups}
              maxPlayers={4}
              gameId="canasta"
              onLoad={(groupPlayers, groupLinked) => {
                setPlayers(groupPlayers as PlayerInputState[]);
                onLinkedPlayersChange(groupLinked as LinkedPlayer[]);
                setMode("individual");
              }}
              onDiscard={() => {
                setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
                setScores([0, 0]);
                setRounds(0);
                setHist([]);
                setOver(false);
                setWi(null);
                setStep("setup");
                setRoundInputs([0, 0]);
                onLinkedPlayersChange([]);
              }}
              hasPlayers={step === "playing" || rounds > 0 || named.length > 0}
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
            {players.length < 4 && (
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

        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: "color-mix(in srgb,var(--gc) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--gc) 25%,transparent)",
            borderRadius: "var(--rxs)",
            fontSize: ".75rem",
            color: "var(--tx2)",
          }}
        >
          🃏 {t("canastaGoalNote") || `Meta: ${GOAL.toLocaleString()} pts · Puntaje acumulado por manos`}
        </div>

        <button className="btnpri" disabled={!canStart || hasDuplicates} onClick={() => setStep("playing")}>
          {t("startMatch")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="tscores">
        {labels.map((label, index) => (
          <div key={label} className={`tcard${scores[index] >= GOAL ? " win" : ""}`}>
            <div className="ttname">{label}</div>
            <div className="ttscore">{scores[index].toLocaleString()}</div>
            <div className="ttlimit">
              {t("of")} {GOAL.toLocaleString()}
            </div>
            <div className="tprog">
              <div className="tbar" style={{ width: `${Math.min((scores[index] / GOAL) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {over && wi !== null && <div className="wnr">🏆 {labels[wi].toUpperCase()} {t("won")}</div>}

      {!over && (
        <div className="sec">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
            <span className="flbl" style={{ marginBottom: 0 }}>
              {t("roundLabel")} {rounds + 1} — {t("score")}
            </span>
            {rounds > 0 && (
              <button className="btnsec" onClick={undo}>
                {t("undo")}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {[100, 300, 500, -100, -300].map((value) => (
              <button
                key={value}
                onClick={() => {
                  const targetIndex = roundInputs.findIndex((roundInput) => !roundInput || Number(roundInput) === 0);
                  const resolvedTarget = targetIndex === -1 ? 0 : targetIndex;
                  setRoundInputs((currentInputs) =>
                    currentInputs.map((currentValue, currentIndex) =>
                      currentIndex === resolvedTarget ? String((Number(currentValue) || 0) + value) : currentValue,
                    ) as [RoundInputValue, RoundInputValue],
                  );
                }}
                style={{
                  fontSize: ".72rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "var(--rxs)",
                  cursor: "pointer",
                  border: `1px solid ${value > 0 ? "color-mix(in srgb,#52b788 40%,transparent)" : "color-mix(in srgb,#E63946 35%,transparent)"}`,
                  background: value > 0 ? "color-mix(in srgb,#52b788 10%,transparent)" : "color-mix(in srgb,#E63946 10%,transparent)",
                  color: value > 0 ? "#52b788" : "#E63946",
                }}
              >
                {value > 0 ? "+" : ""}
                {value}
              </button>
            ))}
          </div>

          <div className="rgap" style={{ marginBottom: 11 }}>
            {labels.map((label, index) => (
              <div className="rdrow" key={`rd-${label}`}>
                <span className="rdname">{label}</span>
                <div className="rdfields">
                  <div className="rdfrow">
                    <input
                      className="rdinp"
                      type="number"
                      placeholder="0"
                      value={roundInputs[index] || ""}
                      onChange={(event) =>
                        setRoundInputs((currentInputs) =>
                          currentInputs.map((currentValue, currentIndex) => (currentIndex === index ? event.target.value : currentValue)) as [
                            RoundInputValue,
                            RoundInputValue,
                          ],
                        )
                      }
                    />
                    <span className="rdlbl">{t("ptsCanBeNegative")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btnpri" onClick={() => { haptic("medium"); commit(); }}>
            {t("confirmRound")}
          </button>
        </div>
      )}

      <EarlyFinishSaveAction
        canSave={canSaveProgress}
        isNaturalFinish={over}
        eligiblePlayers={labels.filter(Boolean)}
        onSave={(winnerOverride) => {
          haptic("strong");
          handleSave(winnerOverride);
        }}
        t={t}
        style={{ marginTop: "8px" }}
      />

      <button
        className="btnsec"
        style={{ marginTop: "10px" }}
        onClick={() => {
          if (rounds > 0) {
            setConfirmBack(true);
          } else {
            setStep("setup");
            setScores([0, 0]);
            setRounds(0);
            setHist([]);
            setRoundInputs([0, 0]);
            setOver(false);
            setWi(null);
          }
        }}
      >
        {t("changeConfig")}
      </button>

      {confirmBack && (
        <ConfirmModal
          title={t("abandonMatch")}
          msg={`${rounds} ${t("roundsPlayed")}`}
          confirmLabel={t("abandon")}
          confirmTone="danger"
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setStep("setup");
            setScores([0, 0]);
            setRounds(0);
            setHist([]);
            setRoundInputs([0, 0]);
            setOver(false);
            setWi(null);
            setConfirmBack(false);
          }}
          onCancel={() => setConfirmBack(false)}
        />
      )}
    </div>
  );
}
