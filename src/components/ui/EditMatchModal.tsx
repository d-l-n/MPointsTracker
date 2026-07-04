import React, { useEffect, useState, type ChangeEvent, type CSSProperties } from "react";

import type { Match, PlayerResult, TranslationFn } from "../../types";
import ConfirmModal from "./ConfirmModal";

interface EditablePlayer extends PlayerResult {
  id?: string;
  score?: number | string;
}

interface EditableMatch extends Match {
  players: EditablePlayer[];
  penalty?: string;
  streakType?: string;
  note?: string;
}

interface EditMatchModalProps {
  match: EditableMatch;
  onSave: (match: EditableMatch) => void;
  onClose: () => void;
  t?: TranslationFn;
}

export default function EditMatchModal({
  match,
  onSave,
  onClose,
  t = ((key: string) => key) as TranslationFn,
}: EditMatchModalProps) {
  const [players, setPlayers] = useState<EditablePlayer[]>((match.players || []).map((player) => ({ ...player })));
  const [winner, setWinner] = useState(match.winner || "");
  const [date, setDate] = useState(match.date ? new Date(match.date).toISOString().slice(0, 16) : "");
  const [penalty, setPenalty] = useState(match.penalty || "");
  const [streakType, setStreakType] = useState(match.streakType || "");
  const [note, setNote] = useState(match.note || "");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isRacha = match.penalty !== undefined || match.streakType !== undefined;
  const nameCount = players.reduce<Record<string, number>>((acc, player) => {
    const normalizedName = player.name.trim().toLowerCase();
    acc[normalizedName] = (acc[normalizedName] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(nameCount).some((value) => value > 1);
  const namedPlayers = players.filter((player) => player.name.trim());

  const handlePlayerNameChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    setPlayers((currentPlayers) => currentPlayers.map((player, currentIndex) => (currentIndex === index ? { ...player, name: event.target.value } : player)));
  };

  const handlePlayerScoreChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, currentIndex) => (currentIndex === index ? { ...player, score: event.target.value } : player)),
    );
  };

  const handleSave = () => {
    const updated: EditableMatch = {
      ...match,
      players: players.map((player) => ({
        ...player,
        score: player.score !== undefined ? parseInt(String(player.score), 10) || 0 : undefined,
      })),
      winner: winner || null,
      date: date ? new Date(date).toISOString() : match.date,
      ...(isRacha ? { penalty, streakType } : {}),
      note: note.trim() || undefined,
    };

    updated.players = updated.players.map((player) => {
      const output: EditablePlayer = { name: player.name };
      if (player.score !== undefined) output.score = player.score;
      return output;
    });

    onSave(updated);
  };

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.72)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    overflowY: "auto",
  };

  const boxStyle: CSSProperties = {
    background: "var(--bg2)",
    backdropFilter: "var(--blur)",
    WebkitBackdropFilter: "var(--blur)",
    border: "1px solid var(--glass-border)",
    borderRadius: "var(--r)",
    padding: "22px 20px",
    width: "100%",
    maxWidth: 440,
    maxHeight: "90dvh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div style={{ ...overlayStyle, position: "absolute" }} inert onClick={onClose} />
      <div
        style={boxStyle}
        role="dialog"
        aria-modal="true"
        aria-label={t("editMatch")}
        onClick={(event) => event.stopPropagation()}
        autoFocus
      >
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", letterSpacing: "2px", color: "var(--tx)" }}>
          {t("editMatch")}
        </div>

        <div>
          <span className="flbl" style={{ color: "var(--tx)", opacity: 0.7 }}>
            {t("dateTime")}
          </span>
          <input className="inp" id="edit-date" name="edit-date" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} aria-label={t("dateTime")} />
        </div>

        {!isRacha && (
          <div>
            <span className="flbl" style={{ color: "var(--tx)", opacity: 0.7 }}>
              {t("playersAndScores")}
            </span>
            <div className="rgap">
              {players.map((player, index) => (
                <div key={player.id || `player-${index}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="inp"
                    name={`player-name-${index}`}
                    style={{ flex: 2 }}
                    placeholder={t("namePlaceholder")}
                    value={player.name}
                    onChange={handlePlayerNameChange(index)}
                    aria-label={`${t("playerN")} ${index + 1}`}
                  />
                  {player.score !== undefined && (
                    <input
                      className="inp"
                      name={`player-score-${index}`}
                      style={{ flex: 1, textAlign: "center" }}
                      type="number"
                      placeholder="Pts"
                      value={player.score}
                      onChange={handlePlayerScoreChange(index)}
                      aria-label={`${t("score")} ${player.name || `${t("playerN")} ${index + 1}`}`}
                    />
                  )}
                </div>
              ))}
            </div>
            {hasDuplicates && (
              <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 6, fontWeight: 600 }}>{t("dupPlayerWarning")}</div>
            )}
          </div>
        )}

        {namedPlayers.length > 0 && (
          <div>
            <span className="flbl" style={{ color: "var(--tx)", opacity: 0.7 }}>
              {t("winner")}
            </span>
            <div className="rgap">
              {[...namedPlayers.map((player) => player.name), ""].map((name, index) => (
                <button
                  key={name || `no-winner-${index}`}
                  onClick={() => setWinner(name)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--rxs)",
                    border: `1.5px solid ${winner === name ? "var(--gc,#006D77)" : "var(--bo2)"}`,
                    background: winner === name ? "color-mix(in srgb,var(--gc,#006D77) 12%,transparent)" : "var(--ibg)",
                    color: winner === name ? "var(--gc,#006D77)" : "var(--tx2)",
                    cursor: "pointer",
                    fontFamily: "'Google Sans',sans-serif",
                    fontSize: ".86rem",
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  {name ? `🏆 ${name}` : `— ${t("noWinner")}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRacha && (
          <>
            <div>
              <label htmlFor="edit-streak" className="flbl">{t("whatStreak")}</label>
              <input id="edit-streak" className="inp" value={streakType} onChange={(event) => setStreakType(event.target.value.slice(0, 80))} />
            </div>
            <div>
              <label htmlFor="edit-penalty" className="flbl">{t("penalty")}</label>
              <textarea
                id="edit-penalty"
                className="fb-textarea"
                value={penalty}
                onChange={(event) => setPenalty(event.target.value.slice(0, 300))}
                style={{ minHeight: 80 }}
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="edit-note" className="flbl" style={{ color: "var(--tx)", opacity: 0.7, display: "block", marginBottom: "8px" }}>
            {t("matchNoteLabel")}
          </label>
          <textarea
            id="edit-note"
            className="fb-textarea"
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 300))}
            style={{ minHeight: 60, fontSize: ".85rem" }}
          />
          {note.length > 250 && (
            <div style={{ fontSize: ".65rem", color: note.length >= 300 ? "#ff4444" : "var(--tx3)", textAlign: "right", marginTop: 2 }}>
              {300 - note.length}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="modal-cancel" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btnpri" disabled={hasDuplicates || namedPlayers.length === 0} onClick={handleSave} style={{ flex: 1, padding: 11 }}>
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
