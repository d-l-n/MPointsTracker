import { useEffect, useState } from "react";

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

interface TrucoDraft {
  step?: "setup" | "playing";
  limit?: number;
  mode?: "teams" | "individual";
  teamNames?: [string, string];
  players?: PlayerInputState[];
  scores?: [number, number];
  rounds?: number;
  hist?: number[][];
  over?: boolean;
  wi?: number | null;
}

interface TrucoSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
  limit: number;
  mode: "teams" | "individual";
}

interface TrucoNewMatchProps {
  onSave: (match: TrucoSavePayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  t?: TranslationFn;
  draft?: TrucoDraft | null;
  onDraftChange?: (draft: TrucoDraft | null) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
}

export default function TrucoNewMatch({
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  t = ((key: string) => key) as TranslationFn,
  draft = null,
  onDraftChange,
  playerGroups = [],
  onSavePlayerGroups,
}: TrucoNewMatchProps) {
  const [step, setStep] = useState<"setup" | "playing">(draft?.step || "setup");
  const [limit, setLimit] = useState(draft?.limit || 30);
  const [mode, setMode] = useState<"teams" | "individual">(draft?.mode || "teams");
  const [teamNames, setTeamNames] = useState<[string, string]>(draft?.teamNames || [t("teamUs"), t("teamThem")]);
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [scores, setScores] = useState<[number, number]>(draft?.scores || [0, 0]);
  const [adds, setAdds] = useState<[number, number]>([0, 0]);
  const [rounds, setRounds] = useState(draft?.rounds || 0);
  const [hist, setHist] = useState<number[][]>(draft?.hist || []);
  const [over, setOver] = useState(draft?.over || false);
  const [wi, setWi] = useState<number | null>(draft?.wi ?? null);
  const [confirmBack, setConfirmBack] = useState(false);

  useEffect(() => {
    if (step === "playing" || rounds > 0 || players.some(p => p.name.trim())) {
      onDraftChange?.({ step, limit, mode, teamNames, players, scores, rounds, hist, over, wi });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [hist, limit, mode, onDraftChange, over, players, rounds, scores, step, teamNames, wi]);

  const named = players.filter((player) => player.name.trim());
  const labels = mode === "teams" ? teamNames : (named.map((player) => player.name) as [string, string]);
  const canStart = mode === "teams" ? Boolean(teamNames[0].trim() && teamNames[1].trim()) : named.length >= 2;
  const canSaveProgress = over || rounds > 0;

  const commit = () => {
    const nextScores = scores.map((score, index) => score + (adds[index] || 0)) as [number, number];
    setScores(nextScores);
    setRounds((currentRounds) => currentRounds + 1);
    setHist((currentHistory) => [...currentHistory, [...adds]]);
    setAdds([0, 0]);
    const winnerIndex = nextScores.findIndex((score) => score >= limit);
    if (winnerIndex !== -1) {
      setOver(true);
      setWi(winnerIndex);
    }
  };

  const undo = () => {
    if (!hist.length) return;
    const last = hist[hist.length - 1];
    setScores((currentScores) => currentScores.map((value, index) => value - last[index]) as [number, number]);
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
      limit,
      mode,
    });
  };

  const pill = (active: boolean) => ({
    flex: 1,
    padding: "10px",
    borderRadius: "var(--rxs)",
    cursor: "pointer",
    border: `1.5px solid ${active ? "var(--gc)" : "var(--bo2)"}`,
    background: active ? "color-mix(in srgb, var(--gc) 12%, transparent)" : "var(--ibg)",
    color: active ? "var(--gc)" : "var(--tx2)",
    fontFamily: "'Google Sans', sans-serif",
    fontSize: ".86rem",
    fontWeight: 600,
  });

  if (step === "setup") {
    return (
      <div>
        <div className="sec">
          <span className="flbl">{t("pointLimit")}</span>
          <div className="pillrow">
            {[15, 30].map((value) => (
              <button
                key={value}
                onClick={() => setLimit(value)}
                style={{ ...pill(limit === value), fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.25rem", letterSpacing: "2px" }}
              >
                {value} PTS
              </button>
            ))}
          </div>
        </div>
        <div className="sec">
          <span className="flbl">{t("mode")}</span>
          <div className="pillrow">
            {[
              ["teams", "⚔️ Equipos"],
              ["individual", "🧑 Individual"],
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
                  className="inp"
                  placeholder={`${t("team")} ${index + 1}`}
                  value={name}
                  onChange={(event) => setTeamNames((currentTeamNames) => currentTeamNames.map((currentValue, currentIndex) => (currentIndex === index ? event.target.value : currentValue)) as [string, string])}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="sec">
            <GroupPicker
              t={t}
              playerGroups={playerGroups}
              maxPlayers={6}
              gameId="truco"
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
                setAdds([0, 0]);
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
            {players.length < 6 && (
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
          </div>
        )}
        <button className="btnpri" disabled={!canStart} onClick={() => setStep("playing")}>
          {t("startMatch")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="tscores">
        {labels.map((label, index) => (
          <div key={label} className={`tcard${scores[index] >= limit ? " win" : ""}`} data-testid={`team-score-${index}`}>
            <div className="ttname">{label}</div>
            <div className="ttscore">{scores[index]}</div>
            <div className="ttlimit">
              {t("of")} {limit}
            </div>
            <div className="tprog">
              <div className="tbar" style={{ width: `${Math.min((scores[index] / limit) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {over && wi !== null && <div className="wnr">🏆 {labels[wi].toUpperCase()} {t("won")}</div>}
      {!over && (
        <div className="sec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
            <span className="flbl" style={{ marginBottom: 0 }}>
              {t("hand")} {rounds + 1}
            </span>
            {rounds > 0 && (
              <button className="btnsec" onClick={undo}>
                {t("undo")}
              </button>
            )}
          </div>
          <div className="rgap" style={{ marginBottom: "11px" }}>
            {labels.map((label, index) => (
              <div className="rdrow" key={`rd-${label}`}>
                <span className="rdname">{label}</span>
                <div className="stepper">
                  <button className="stepbtn" onClick={() => setAdds((currentAdds) => currentAdds.map((value, currentIndex) => (currentIndex === index ? Math.max(0, value - 1) : value)) as [number, number])} data-testid={`team-minus-${index}`}>
                    −
                  </button>
                  <span className="stepval" data-testid={`team-adds-${index}`}>
                    {adds[index]}
                  </span>
                  <button className="stepbtn" onClick={() => setAdds((currentAdds) => currentAdds.map((value, currentIndex) => (currentIndex === index ? value + 1 : value)) as [number, number])} data-testid={`team-plus-${index}`}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btnpri" onClick={() => { haptic("medium"); commit(); }} data-testid="confirm-hand">
            {t("confirmHand")}
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
            setAdds([0, 0]);
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
          msg={`${rounds} ${t("trucoBandoned")}`}
          confirmLabel={t("abandon")}
          confirmTone="danger"
          onConfirm={() => {
            setStep("setup");
            setScores([0, 0]);
            setRounds(0);
            setHist([]);
            setAdds([0, 0]);
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
