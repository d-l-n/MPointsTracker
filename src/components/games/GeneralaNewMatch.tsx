import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { haptic, mkId } from "../../lib/storage";
import type { LinkedPlayer, Match, PlayerGroup, TranslationFn } from "../../types";
import LinkedPlayerInput from "../auth/LinkedPlayerInput";
import DiscardMatchButton from "../ui/DiscardMatchButton";
import GroupPicker from "../ui/GroupPicker";
import SaveGroupButton from "../ui/SaveGroupButton";
import Tooltip from "../ui/Tooltip";

interface PlayerInputState {
  id: string;
  name: string;
}

type SheetCellValue = number | "X" | null;
type SheetRowId = "ones" | "twos" | "threes" | "fours" | "fives" | "sixes" | "straight" | "full" | "poker" | "generala" | "double";
type ScoreSheet = Record<SheetRowId, SheetCellValue>;
type ScoreSheets = Record<string, ScoreSheet>;

interface SheetRow {
  id: SheetRowId;
  labelKey: string;
  emoji: string;
  max?: number;
  pts?: number;
  served?: number;
  isCombination: boolean;
}

interface GeneralaDraft {
  players?: PlayerInputState[];
  sheets?: ScoreSheets;
  history?: ScoreSheets[];
  inProgress?: boolean;
  gameOver?: boolean;
}

interface GeneralaSavePayload extends Match {
  players: Array<{ name: string; score: number }>;
  winner: string | null;
  rounds: number;
}

interface GeneralaNewMatchProps {
  onSave: (match: GeneralaSavePayload) => void;
  knownNames: string[];
  draft?: GeneralaDraft | null;
  onDraftChange?: (draft: GeneralaDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (players: LinkedPlayer[]) => void;
  playerGroups?: PlayerGroup[];
  onSavePlayerGroups?: (groups: PlayerGroup[]) => void;
  onBack?: () => void;
  t?: TranslationFn;
}

const ROWS: SheetRow[] = [
  { id: "ones", labelKey: "generalaOnes", emoji: "1️⃣", max: 5, isCombination: false },
  { id: "twos", labelKey: "generalaTwo", emoji: "2️⃣", max: 10, isCombination: false },
  { id: "threes", labelKey: "generalaThrees", emoji: "3️⃣", max: 15, isCombination: false },
  { id: "fours", labelKey: "generalaFours", emoji: "4️⃣", max: 20, isCombination: false },
  { id: "fives", labelKey: "generalaFives", emoji: "5️⃣", max: 25, isCombination: false },
  { id: "sixes", labelKey: "generalaSixes", emoji: "6️⃣", max: 30, isCombination: false },
  { id: "straight", labelKey: "generalaStraight", emoji: "📈", pts: 20, served: 25, isCombination: true },
  { id: "full", labelKey: "generalaFull", emoji: "🃏", pts: 30, served: 35, isCombination: true },
  { id: "poker", labelKey: "generalaPoker", emoji: "⬛", pts: 40, served: 45, isCombination: true },
  { id: "generala", labelKey: "generalaGenerala", emoji: "⭐", pts: 50, served: 50, isCombination: true },
  { id: "double", labelKey: "generalaDouble", emoji: "💥", pts: 100, served: 100, isCombination: true },
];

const emptySheet = (): ScoreSheet =>
  Object.fromEntries(ROWS.map((row) => [row.id, null])) as ScoreSheet;

function totalSheet(sheet: ScoreSheet) {
  return ROWS.reduce((sum, row) => {
    const value = sheet[row.id];
    return sum + (typeof value === "number" ? value : 0);
  }, 0);
}

function isComplete(sheet: ScoreSheet) {
  return ROWS.every((row) => sheet[row.id] !== null);
}

interface CellInputProps {
  row: SheetRow;
  value: SheetCellValue;
  onChange: (value: SheetCellValue) => void;
  color: string;
  t: TranslationFn;
  "data-testid"?: string;
}

function CellInput({ row, value, onChange, color, t, "data-testid": dataTestId }: CellInputProps) {
  const [open, setOpen] = useState(false);

  if (value !== null) {
    const display = value === "X" ? "✕" : value;
    return (
      <div
        style={{
          minWidth: 44,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1rem",
          letterSpacing: "1px",
          color: value === "X" ? "var(--tx3)" : color,
          textDecoration: value === "X" ? "line-through" : "none",
          opacity: value === "X" ? 0.4 : 1,
          fontWeight: 800,
        }}
        data-testid={dataTestId}
      >
        {display}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          minWidth: 44,
          height: 36,
          border: "1.5px dashed var(--bo2)",
          borderRadius: "var(--rxs)",
          background: "var(--ibg)",
          color: "var(--tx3)",
          cursor: "pointer",
          fontSize: ".8rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-testid={dataTestId}
      >
        +
      </button>
    );
  }

  if (!row.isCombination) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="number"
          name="generala-score"
          min="0"
          max={row.max}
          placeholder="0"
          autoFocus
          aria-label={t(row.labelKey)}
          style={{
            width: 50,
            height: 34,
            borderRadius: "var(--rxs)",
            border: "1.5px solid var(--gc, #888)",
            background: "var(--ibg)",
            color: "var(--tx)",
            textAlign: "center",
            fontFamily: "'Google Sans', sans-serif",
            fontSize: ".88rem",
            outline: "none",
          }}
          onBlur={(event) => {
            const parsed = parseInt(event.target.value, 10);
            if (!Number.isNaN(parsed) && parsed >= 0) onChange(parsed);
            else setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const parsed = parseInt((event.target as HTMLInputElement).value, 10);
              if (!Number.isNaN(parsed) && parsed >= 0) onChange(parsed);
            }
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <button
          onClick={() => {
            onChange("X");
          }}
          aria-label={t("clearSearch")}
          style={{
            height: 34,
            padding: "0 8px",
            border: "1.5px solid var(--bo2)",
            borderRadius: "var(--rxs)",
            background: "none",
            color: "var(--tx3)",
            cursor: "pointer",
            fontSize: ".8rem",
            fontWeight: 700,
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  const options: Array<{ label: string; value: SheetCellValue }> = [];
  if (row.served !== undefined && row.pts !== row.served) {
    options.push({ label: `${row.served} (servida)`, value: row.served });
  }
  options.push({ label: `${row.pts} pts`, value: row.pts || 0 });
  options.push({ label: "✕ Tachar", value: "X" });

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => onChange(option.value)}
          style={{
            height: 34,
            padding: "0 10px",
            border: "1.5px solid var(--bo2)",
            borderRadius: "var(--rxs)",
            background: option.value === "X" ? "none" : `color-mix(in srgb,${color} 12%,transparent)`,
            borderColor: option.value === "X" ? "var(--bo2)" : color,
            color: option.value === "X" ? "var(--tx3)" : color,
            cursor: "pointer",
            fontFamily: "'Google Sans', sans-serif",
            fontSize: ".78rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {option.label}
        </button>
      ))}
      <button
        onClick={() => setOpen(false)}
        aria-label={t("cancel")}
        style={{
          height: 34,
          padding: "0 8px",
          border: "none",
          background: "none",
          color: "var(--tx3)",
          cursor: "pointer",
          fontSize: ".8rem",
        }}
      >
        ✕
      </button>
    </div>
  );
}

function GeneralaNewMatch({
  onSave,
  knownNames,
  draft = null,
  onDraftChange,
  linkedPlayers = [],
  onLinkedPlayersChange,
  playerGroups = [],
  onSavePlayerGroups,
  onBack,
  t = ((key: string) => key) as TranslationFn,
}: GeneralaNewMatchProps) {
  const [players, setPlayers] = useState<PlayerInputState[]>(draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
  const [sheets, setSheets] = useState<ScoreSheets>(draft?.sheets || {});
  const [history, setHistory] = useState<ScoreSheets[]>(draft?.history || []);
  const [inProgress, setInProgress] = useState(draft?.inProgress || false);
  const [gameOver, setGameOver] = useState(draft?.gameOver || false);

  const named = players.filter((player) => player.name.trim());
  const nameCount = named.reduce<Record<string, number>>((acc, player) => {
    const normalized = player.name.trim().toLowerCase();
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(nameCount).some((value) => value > 1);

  useEffect(() => {
    setSheets((currentSheets) => {
      const next = { ...currentSheets };
      let changed = false;
      named.forEach((player) => {
        if (!next[player.id]) {
          next[player.id] = emptySheet();
          changed = true;
        }
      });
      return changed ? next : currentSheets;
    });
  }, [named]);

  useEffect(() => {
    if (inProgress || players.some(p => p.name.trim())) {
      onDraftChange?.({ players, sheets, history, inProgress, gameOver });
    } else if (draft) {
      onDraftChange?.(null);
    }
  }, [gameOver, history, inProgress, onDraftChange, players, sheets]);

  useEffect(() => {
    if (!inProgress || named.length < 2) return;
    const allDone = named.every((player) => sheets[player.id] && isComplete(sheets[player.id]));
    if (allDone) setGameOver(true);
  }, [inProgress, named, sheets]);

  const setCell = useCallback((playerId: string, rowId: SheetRowId, value: SheetCellValue) => {
    haptic("light");
    setSheets((currentSheets) => {
      const snapshot = JSON.parse(JSON.stringify(currentSheets)) as ScoreSheets;
      setHistory((currentHistory) => [...currentHistory, snapshot]);
      return {
        ...currentSheets,
        [playerId]: { ...currentSheets[playerId], [rowId]: value },
      };
    });
    setInProgress(true);
  }, []);

  const undo = useCallback(() => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setSheets(previous);
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    setGameOver(false);
    if (history.length <= 1) setInProgress(false);
  }, [history]);

  const totals = useMemo(
    () => Object.fromEntries(named.map((player) => [player.id, totalSheet(sheets[player.id] || emptySheet())])) as Record<string, number>,
    [named, sheets],
  );

  const ranking = useMemo(
    () => [...named].sort((left, right) => (totals[right.id] || 0) - (totals[left.id] || 0)),
    [named, totals],
  );

  const winner = gameOver ? ranking[0] : null;

  const discardMatch = () => {
    setSheets({});
    setHistory([]);
    setInProgress(false);
    setGameOver(false);
    onDraftChange?.(null);
  };

  const handleSave = () => {
    haptic("strong");
    const sorted = [...named].sort((left, right) => (totals[right.id] || 0) - (totals[left.id] || 0));
    onSave({
      id: mkId(),
      date: new Date().toISOString(),
      players: sorted.map((player) => ({ name: player.name, score: totals[player.id] || 0 })),
      winner: winner?.name || sorted[0]?.name || null,
      rounds: ROWS.length,
    });
  };

  const color = "#D4A017";

  return (
    <div>
      {!inProgress && (
        <div className="sec">
          <div style={{ display: "flex", alignItems: "center", gap: 12, rowGap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            <span className="flbl" style={{ margin: 0, flexShrink: 0 }}>{t("players")}</span>
            <GroupPicker
              t={t}
              playerGroups={playerGroups}
              maxPlayers={6}
            onLoad={(loadedPlayers, loadedLinked) => {
              setPlayers(loadedPlayers as PlayerInputState[]);
              onLinkedPlayersChange(loadedLinked as LinkedPlayer[]);
            }}
            onDiscard={() => {
              setPlayers([{ id: mkId(), name: "" }, { id: mkId(), name: "" }]);
              onLinkedPlayersChange([]);
              discardMatch();
            }}
              hasPlayers={inProgress || gameOver || players.some((player) => player.name.trim())}
              style={{ flex: 1, minWidth: 0, marginTop: 0, marginBottom: 0 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
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
          {players.length < 6 && (
            <button className="btndash" onClick={() => setPlayers((currentPlayers) => [...currentPlayers, { id: mkId(), name: "" }])}>
              {t("addPlayer")}
            </button>
          )}
          {hasDuplicates && (
            <div style={{ fontSize: ".75rem", color: "#ff4444", marginTop: 8, fontWeight: 600 }}>
              {t("dupPlayerWarning")}
            </div>
          )}
          <SaveGroupButton t={t} players={players} linkedPlayers={linkedPlayers} playerGroups={playerGroups} onSave={onSavePlayerGroups} />
        </div>
      )}

      {named.length >= 2 && inProgress && (
        <div className="sb" style={{ marginBottom: 14 }}>
          <div className="sbhdr">
            <span className="sbtitle" style={{ color }}>{t("generalaGenerala") || "GENERALA"}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {history.length > 0 && <button className="btnsec" onClick={undo}>{t("undo")}</button>}
              <span className="sbround" style={{ color: "var(--tx2)" }}>
                {gameOver ? t("generalaFin") : `${named.filter((player) => isComplete(sheets[player.id] || emptySheet())).length}/${named.length} ${t("generalaCompleted")}`}
              </span>
            </div>
          </div>
          {ranking.map((player, index) => {
            const total = totals[player.id] || 0;
            const filled = ROWS.filter((row) => (sheets[player.id] || emptySheet())[row.id] !== null).length;
            return (
              <div key={player.id} className={`sbrow${index === 0 && inProgress ? " lead" : ""}${player.id === winner?.id ? " win" : ""}`}>
                <span className="sbrank" style={{ color: index === 0 ? color : "var(--tx3)" }}>{index + 1}</span>
                <span className="sbname">{player.id === winner?.id ? "🏆 " : ""}{player.name}</span>
                <span style={{ fontSize: ".7rem", color: "var(--tx3)", marginRight: 4 }}>{filled}/{ROWS.length}</span>
                <span className="sbscore" style={{ color }}>{total}</span>
              </div>
            );
          })}
        </div>
      )}

      {gameOver && winner && <div className="wnr" style={{ background: color }}>🎲 {winner.name.toUpperCase()} {t("won")}</div>}

      {named.length >= 2 && !hasDuplicates && (
        <div className="sec">
          {!inProgress && <span className="flbl" style={{ marginBottom: 12 }}>{t("generalaScoresheetTitle")}</span>}

          <div style={{ display: "grid", gridTemplateColumns: `1fr repeat(${named.length}, minmax(60px, 1fr))`, gap: 4, marginBottom: 4 }}>
            <div />
            {named.map((player) => (
              <div
                key={player.id}
                style={{
                  textAlign: "center",
                  fontSize: ".72rem",
                  fontWeight: 800,
                  color,
                  letterSpacing: ".5px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {player.name || `J${named.indexOf(player) + 1}`}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: ".62rem",
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--tx3)",
              padding: "6px 0 4px",
              borderBottom: "1px solid var(--bo)",
              marginBottom: 4,
            }}
          >
            {t("generalaNumbers")}
          </div>

          {ROWS.map((row, rowIdx) => {
            const divider =
              rowIdx === 6 ? (
                <div
                  key="div-combo"
                  style={{
                    fontSize: ".62rem",
                    fontWeight: 800,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--tx3)",
                    padding: "8px 0 4px",
                    borderBottom: "1px solid var(--bo)",
                    marginBottom: 4,
                    gridColumn: "1 / -1",
                  }}
                >
                  {t("generalaCombinations")}
                </div>
              ) : null;

            return (
              <div key={row.id}>
                {divider}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `1fr repeat(${named.length}, minmax(60px, 1fr))`,
                    gap: 4,
                    marginBottom: 3,
                    alignItems: "center",
                    padding: "3px 0",
                    borderBottom: "1px solid var(--bo)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>{row.emoji}</span>
                    <div>
                      <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--tx)", lineHeight: 1.2 }}>{t(row.labelKey)}</div>
                      {row.isCombination ? (
                        <div style={{ fontSize: ".62rem", color: "var(--tx3)" }}>
                          {row.served !== row.pts ? `${row.pts} / ${row.served} ${t("generalaServed")}` : `${row.pts} pts`}
                        </div>
                      ) : (
                        <div style={{ fontSize: ".62rem", color: "var(--tx3)" }}>{t("generalaMax")} {row.max}</div>
                      )}
                    </div>
                  </div>

                  {named.map((player) => (
                    <div key={player.id} style={{ display: "flex", justifyContent: "center" }}>
                      <CellInput
                        row={row}
                        value={(sheets[player.id] || emptySheet())[row.id] ?? null}
                        onChange={(value) => setCell(player.id, row.id, value)}
                        color={color}
                        t={t}
                        data-testid={`score-${row.id}-${player.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {inProgress && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `1fr repeat(${named.length}, minmax(60px, 1fr))`,
                gap: 4,
                marginTop: 8,
                paddingTop: 8,
                borderTop: `2px solid ${color}`,
              }}
            >
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: ".95rem", letterSpacing: "2px", color }}>{t("generalaTotal")}</div>
              {named.map((player) => (
                <div
                  key={player.id}
                  style={{
                    textAlign: "center",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    color,
                    letterSpacing: "1px",
                    fontWeight: 800,
                  }}
                >
                  {totals[player.id] || 0}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(gameOver || (inProgress && named.length >= 2)) && (
        <button
          className="btnpri"
          style={{ marginTop: 8, "--gc": color } as React.CSSProperties}
          onClick={handleSave}
          data-testid="save-match"
        >
          {t("saveMatch")}
        </button>
      )}

      {(inProgress || gameOver) && (
        <DiscardMatchButton t={t} onDiscard={discardMatch} onBack={onBack} />
      )}
    </div>
  );
}

export default memo(GeneralaNewMatch)
