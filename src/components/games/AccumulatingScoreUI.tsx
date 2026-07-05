import type { ReactNode } from "react";

import type { PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import ConfirmModal from "../ui/ConfirmModal";
import EarlyFinishSaveAction from "../ui/EarlyFinishSaveAction";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import type {
  AccumulatingScoreConfig,
  AccumulatingScoreProps,
  AccumulatingScoreState,
  LinkedPlayer,
  MatchMode,
  PlayerInputState,
} from "../../hooks/useAccumulatingScoreMatch";
import { mkId } from "../../lib/storage";
import { haptic } from "../../lib/storage";

export interface RenderInputOptions {
  labels: string[];
  roundInputs: AccumulatingScoreState["roundInputs"];
  setRoundInputs: AccumulatingScoreState["setRoundInputs"];
  adds: AccumulatingScoreState["adds"];
  setAdds: AccumulatingScoreState["setAdds"];
  rounds: AccumulatingScoreState["rounds"];
  undo: AccumulatingScoreState["undo"];
  commit: AccumulatingScoreState["commit"];
  t: TranslationFn;
  i18nPrefix: string;
}

interface AccumulatingScoreUIProps {
  config: AccumulatingScoreConfig;
  props: AccumulatingScoreProps;
  state: AccumulatingScoreState;
  renderInput: (opts: RenderInputOptions) => ReactNode;
  /** Optional slot for setup-step extra content (e.g. configurable limit, info box) */
  renderSetupExtra?: () => ReactNode;
  /** Optional score value formatter */
  formatScore?: (value: number) => string;
  /** Optional score limit formatter */
  formatLimit?: (value: number) => string;
}

export default function AccumulatingScoreUI({
  config,
  props,
  state,
  renderInput,
  renderSetupExtra,
  formatScore,
  formatLimit,
}: AccumulatingScoreUIProps) {
  const {
    step,
    setStep,
    limit,
    mode,
    setMode,
    teamNames,
    setTeamNames,
    players,
    setPlayers,
    scores,
    rounds,
    hist,
    over,
    wi,
    confirmBack,
    setConfirmBack,
    named,
    labels,
    canStart,
    hasDuplicates,
    canSaveProgress,
    roundInputs,
    setRoundInputs,
    adds,
    setAdds,
    undo,
    commit,
    handleSave,
    reset,
    pill,
  } = state;

  const {
    linkedPlayers = [],
    onLinkedPlayersChange,
    t = ((key: string) => key) as TranslationFn,
    playerGroups = [],
    onSavePlayerGroups,
  } = props;

  const { gameId, maxPlayers = 4, confirmMsgKey = "roundsPlayed", i18nPrefix = "round" } = config;

  const effectiveGoal = config.allowConfigurableLimit ? limit : config.goal;

  const fmtScore = formatScore ?? ((v: number) => String(v));
  const fmtLimit = formatLimit ?? ((v: number) => String(v));

  const handleDiscard = () => {
    setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
    reset();
    onLinkedPlayersChange([]);
  };

  if (step === "setup") {
    return (
      <div>
        {renderSetupExtra?.()}

        <div className="sec">
          <span className="flbl">{t("mode")}</span>
          <div className="pillrow">
            {(
              [
                ["teams", `⚔️ ${t("teams")}`],
                ["individual", `🧑 ${t("individual")}`],
              ] as [MatchMode, string][]
            ).map(([value, label]) => (
              <button key={value} onClick={() => { haptic("light"); setMode(value); }} style={pill(mode === value)}>
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
                  id={`${gameId}-team-name-${index}`}
                  name={`${gameId}-team-name-${index}`}
                  className="inp"
                  placeholder={`${t("team")} ${index + 1}`}
                  value={name}
                  onChange={(event) =>
                    setTeamNames(
                      (prev) =>
                        prev.map((v, i) =>
                          i === index ? event.target.value : v,
                        ) as [string, string],
                    )
                  }
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
              maxPlayers={maxPlayers}
              gameId={gameId}
              onLoad={(groupPlayers, groupLinked) => {
                setPlayers(groupPlayers as PlayerInputState[]);
                onLinkedPlayersChange(groupLinked as LinkedPlayer[]);
                setMode("individual");
              }}
              onDiscard={handleDiscard}
              hasPlayers={step === "playing" || rounds > 0 || named.length > 0}
            />
            <span className="flbl">{t("players")}</span>
            <div className="rgap">
              {players.map((player, index) => (
                <div className="irow" key={player.id}>
                  <LinkedPlayerInput
                    value={player.name}
                    linkedUid={
                      (linkedPlayers.find((lp) => lp.playerId === player.id) || {}).uid
                    }
                    linkedName={
                      (linkedPlayers.find((lp) => lp.playerId === player.id) || {}).name
                    }
                    onChange={(value) =>
                      setPlayers((prev) =>
                        prev.map((p) =>
                          p.id === player.id ? { ...p, name: value } : p,
                        ),
                      )
                    }
                    onLink={({ uid, name }) => {
                      setPlayers((prev) =>
                        prev.map((p) =>
                          p.id === player.id ? { ...p, name } : p,
                        ),
                      );
                      onLinkedPlayersChange([
                        ...linkedPlayers.filter((lp) => lp.playerId !== player.id),
                        { uid, name, playerId: player.id },
                      ]);
                    }}
                    onUnlink={() =>
                      onLinkedPlayersChange(
                        linkedPlayers.filter((lp) => lp.playerId !== player.id),
                      )
                    }
                    placeholder={`${t("playerN")} ${index + 1}`}
                    knownNames={props.knownNames}
                    t={t}
                    allLinkedUids={linkedPlayers.map((lp) => lp.uid)}
                  />
                  <button
                    className="btnrm"
                    aria-label={`${t("delete")} ${player.name || `${t("playerN")} ${index + 1}`}`}
                    onClick={() => {
                      if (players.length > 2) {
                        setPlayers((prev) =>
                          prev.filter((p) => p.id !== player.id),
                        );
                        onLinkedPlayersChange(
                          linkedPlayers.filter((lp) => lp.playerId !== player.id),
                        );
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {players.length < maxPlayers && (
              <button
                className="btndash"
                onClick={() => {
                  haptic("light");
                  setPlayers((prev) => [...prev, { id: mkId(), name: "" }]);
                }}
              >
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

        <button
          className="btnpri"
          disabled={!canStart || hasDuplicates}
          onClick={() => { haptic("medium"); setStep("playing"); }}
        >
          {t("startMatch")}
        </button>
      </div>
    );
  }

  // Playing step
  return (
    <div>
      <div className="tscores">
        {labels.map((label, index) => (
          <div
            key={label}
            className={`tcard${scores[index] >= effectiveGoal ? " win" : ""}`}
            data-testid={`team-score-${index}`}
          >
            <div className="ttname">{label}</div>
            <div className="ttscore">{fmtScore(scores[index])}</div>
            <div className="ttlimit">
              {t("of")} {fmtLimit(effectiveGoal)}
            </div>
            <div className="tprog">
              <div
                className="tbar"
                style={{ width: `${Math.min((scores[index] / effectiveGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {over && wi !== null && (
        <div className="wnr">🏆 {labels[wi].toUpperCase()} {t("won")}</div>
      )}

      {!over &&
        renderInput({
          labels,
          roundInputs,
          setRoundInputs,
          adds,
          setAdds,
          rounds,
          undo,
          commit,
          t,
          i18nPrefix,
        })}

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
            reset();
          }
        }}
      >
        {t("changeConfig")}
      </button>

      {confirmBack && (
        <ConfirmModal
          title={t("abandonMatch")}
          msg={`${rounds} ${t(confirmMsgKey)}`}
          confirmLabel={t("abandon")}
          confirmTone="danger"
          cancelLabel={t("cancel")}
          onConfirm={() => {
            reset();
            setConfirmBack(false);
          }}
          onCancel={() => setConfirmBack(false)}
        />
      )}
    </div>
  );
}
