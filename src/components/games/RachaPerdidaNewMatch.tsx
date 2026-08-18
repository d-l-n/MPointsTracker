import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";

import { mkId, haptic } from "../../lib/storage";
import { fmtDate } from "../../lib/stats";
import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import ConfirmModal from "../ui/ConfirmModal";
import DiscardMatchButton from "../ui/DiscardMatchButton";
import AutocompleteInput from "../ui/AutocompleteInput";

interface RachaPerdidaDraft {
  loser?: string;
  streakType?: string;
  penalty?: string;
}

interface RachaPerdidaMatch extends Match {
  streakType?: string;
  penalty?: string;
  rounds?: number;
}

type AccentButtonStyle = CSSProperties & Record<"--gc", string>;

interface SaveMatchPayload extends RachaPerdidaMatch {
  players: Array<{ name: string; score: number }>;
  winner: null;
  streakType: string;
  penalty: string;
  rounds: number;
}

interface RachaPerdidaNewMatchProps {
  onSave: (match: SaveMatchPayload) => void;
  knownNames: string[];
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  onBack?: () => void;
  t?: TranslationFn;
  matches?: RachaPerdidaMatch[];
  draft?: RachaPerdidaDraft | null;
  onDraftChange?: (draft: RachaPerdidaDraft | null) => void;
  _playerGroups?: PlayerGroup[];
  _onSavePlayerGroups?: ((groups: PlayerGroup[]) => void) | undefined;
}

const LOSER_SLOT = "racha_loser";

function RachaPerdidaNewMatch({
  onSave,
  knownNames,
  linkedPlayers = [],
  onLinkedPlayersChange,
  onBack,
  t = ((key: string) => key) as TranslationFn,
  matches = [],
  draft = null,
  onDraftChange,
}: RachaPerdidaNewMatchProps) {
  const [loser, setLoser] = useState(draft?.loser || "");
  const [streakType, setStreakType] = useState(draft?.streakType || "");
  const [penalty, setPenalty] = useState(draft?.penalty || "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const linkedLoser = linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === LOSER_SLOT);

  const pastStreaks = useMemo(
    () => [...new Set(matches.map((match) => match.streakType).filter(Boolean))] as string[],
    [matches],
  );
  const pastPenalties = useMemo(
    () => [...new Set(matches.map((match) => match.penalty).filter(Boolean))] as string[],
    [matches],
  );

  useEffect(() => {
    if (!onDraftChange) return;
    if (!loser.trim() && !streakType.trim() && !penalty.trim()) return;
    onDraftChange({ loser, streakType, penalty });
  }, [loser, onDraftChange, penalty, streakType]);

  const canSave = Boolean((loser.trim() || linkedLoser) && penalty.trim() && streakType.trim());

  const discardMatch = () => {
    setLoser("");
    setStreakType("");
    setPenalty("");
    onLinkedPlayersChange([]);
    onDraftChange?.(null);
  };

  const doSave = () => {
    const name = linkedLoser?.name || loser.trim();

    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: [{ name, score: 0 }],
      winner: null,
      streakType: streakType.trim(),
      penalty: penalty.trim(),
      rounds: 0,
    });

    setLoser("");
    setStreakType("");
    setPenalty("");
    onLinkedPlayersChange([]);
    onDraftChange?.(null);
    setConfirmOpen(false);
  };

  return (
    <div>
      <div className="sec">
        <span className="flbl">{t("whoLostStreak")}</span>
        <div className="irow">
          <LinkedPlayerInput
            value={loser}
            linkedUid={linkedLoser?.uid}
            linkedName={linkedLoser?.name}
            onChange={(value) => setLoser(value)}
            onLink={({ uid, name }) => {
              setLoser(name);
              onLinkedPlayersChange([{ uid, name, playerId: LOSER_SLOT }]);
            }}
            onUnlink={() => onLinkedPlayersChange([])}
            placeholder={t("loserNamePlaceholder")}
            knownNames={knownNames}
            t={t}
            allLinkedUids={linkedLoser ? [linkedLoser.uid] : []}
          />
        </div>
      </div>

      <div className="sec">
        <span className="flbl">{t("whatStreak")}</span>
        <AutocompleteInput
          value={streakType}
          onChange={(value) => setStreakType(value.slice(0, 80))}
          placeholder={t("streakTypePlaceholder")}
          suggestions={pastStreaks}
        />
      </div>

      <div className="sec">
        <span className="flbl">{t("whoMustDo")}</span>
        <div className="autocomplete">
          <textarea
            className="fb-textarea"
            id="streak-penalty"
            name="streak-penalty"
            placeholder={t("streakPenaltyPlaceholder")}
            value={penalty}
            onChange={(event) => setPenalty(event.target.value.slice(0, 300))}
            style={{ minHeight: 90 }}
            aria-label={t("whoMustDo")}
          />
          {penalty.length > 0 &&
            pastPenalties.filter((suggestion) => suggestion.toLowerCase().includes(penalty.toLowerCase()) && suggestion !== penalty).length > 0 && (
              <div className="ac-dropdown">
                {pastPenalties
                  .filter((suggestion) => suggestion.toLowerCase().includes(penalty.toLowerCase()) && suggestion !== penalty)
                  .map((suggestion) => (
                    <div key={suggestion} className="ac-item" onMouseDown={() => setPenalty(suggestion)}>
                      {suggestion}
                    </div>
                  ))}
              </div>
            )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <span
            style={{
              fontSize: ".68rem",
              color: 300 - penalty.length < 30 ? "#ff4444" : "var(--tx3)",
              fontWeight: 300 - penalty.length < 30 ? 700 : 500,
            }}
          >
            {300 - penalty.length} {t("charLimit")}
          </span>
        </div>
      </div>

      {(loser.trim() || linkedLoser) && (
        <div
          style={{
            background: "color-mix(in srgb,#6C3483 10%,transparent)",
            border: "1px solid color-mix(in srgb,#6C3483 30%,transparent)",
            borderRadius: "var(--rsm)",
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: ".66rem",
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--racha-accent)",
              marginBottom: 6,
            }}
          >
            {t("rakingPreview")}
          </div>
          <div style={{ fontSize: ".9rem", color: "var(--tx)", fontWeight: 700 }}>💀 {linkedLoser?.name || loser.trim()}</div>
          {streakType.trim() && (
            <div style={{ fontSize: ".76rem", color: "var(--racha-accent)", marginTop: 3, fontWeight: 600 }}>
              📍 {streakType.trim()}
            </div>
          )}
          {penalty.trim() && <div style={{ fontSize: ".8rem", color: "var(--tx2)", marginTop: 4 }}>{penalty.trim()}</div>}
          <div style={{ fontSize: ".7rem", color: "var(--tx3)", marginTop: 6 }}>{fmtDate(new Date().toISOString())}</div>
        </div>
      )}

      <button
        className="btnpri"
        style={{ "--gc": "#6C3483" } as AccentButtonStyle}
        disabled={!canSave}
        onClick={() => setConfirmOpen(true)}
        data-testid="register-streak"
      >
        {t("registerLostStreak")}
      </button>

      {confirmOpen && (
        <ConfirmModal
          title={t("confirmStreakTitle")}
          msg={t("confirmStreakMsg")
            .replace("{name}", linkedLoser?.name || loser.trim())
            .replace("{streak}", streakType.trim() ? `${t("confirmStreakOf")}${streakType.trim()}` : "")}
          confirmLabel={`💀 ${t("register")}`}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            haptic("strong");
            doSave();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {Boolean(loser.trim() || linkedLoser) && (
        <DiscardMatchButton t={t} onDiscard={discardMatch} onBack={onBack} />
      )}
    </div>
  );
}

export default memo(RachaPerdidaNewMatch)
