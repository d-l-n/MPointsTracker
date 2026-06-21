import { memo, useEffect, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import ConfirmModal from "../ui/ConfirmModal";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";

interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

interface PlayerInputState {
  id: string;
  name: string;
}

interface BurakoDraft {
  step?: "setup" | "playing";
  mode?: "teams" | "individual";
  teamNames?: [string, string];
  players?: PlayerInputState[];
  scores?: [number, number];
  rounds?: number;
  hist?: Array<[number, number]>;
  over?: boolean;
  wi?: number | null;
}

interface BurakoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: "teams" | "individual";
}

interface BurakoNewMatchProps {
  onSave: (match: BurakoSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: BurakoDraft | null;
  onDraftChange?: (draft: BurakoDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

const GOAL = 2000;

function BurakoNewMatch({
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  draft = null,
  onDraftChange,
  playerGroups = [],
  onSavePlayerGroups,
}: BurakoNewMatchProps) {
  const [step, setStep] = useState<"setup" | "playing">(draft?.step || "setup");
  const [mode, setMode] = useState<"teams" | "individual">(draft?.mode || "teams");
  const [teamNames, setTeamNames] = useState<[string, string]>(draft?.teamNames || [t("teamUs"), t("teamThem")]);
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [scores, setScores] = useState<[number, number]>(draft?.scores || [0, 0]);
  const [roundInputs, setRoundInputs] = useState<[number, number]>([0, 0]);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [hist, setHist] = useState<Array<[number, number]>>(draft?.hist || []);
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
  const labels = mode === "teams" ? teamNames : (named.map((player) => player.name) as [string, string]);
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
    setHist((currentHistory) => [...currentHistory, [...roundInputs] as [number, number]]);
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
              <button key={value} onClick={() => setMode(value as "teams" | "individual")} style={pill(mode === value)}>
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
                  id={`burako-team-name-${index}`}
                  className="inp"
                  placeholder={`${t("team")} ${index + 1}`}
                  value={name}
                  onChange={(event) => setTeamNames((currentTeamNames) => currentTeamNames.map((currentValue, currentIndex) => (currentIndex === index ? event.target.value : currentValue)) as [string, string])}
                  aria-label={`${t("team")} ${index + 1}`}
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
              gameId="burako"
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
            <div className="ttscore">{scores[index]}</div>
            <div className="ttlimit">
              {t("of")} {GOAL}
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
          <div className="rgap" style={{ marginBottom: 11 }}>
            {labels.map((label, index) => (
              <div className="rdrow" key={`rd-${label}`}>
                <span className="rdname">{label}</span>
                <div className="rdfields">
                  <div className="rdfrow">
                    <input
                      id={`burako-round-score-${index}`}
                      className="rdinp"
                      type="number"
                      placeholder="0"
                      value={roundInputs[index] || ""}
                      onChange={(event) => setRoundInputs((currentInputs) => currentInputs.map((currentValue, currentIndex) => (currentIndex === index ? Number(event.target.value) : currentValue)) as [number, number])}
                      aria-label={`${t("roundLabel")} ${label}`}
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
          if (rounds > 0) setConfirmBack(true);
          else {
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

export default memo(BurakoNewMatch)
