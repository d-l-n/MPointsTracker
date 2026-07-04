import { useState, useMemo } from "react";
import { buildH2H, fmtDate, getAllPastPlayerNames } from "../lib/stats";
import { GAMES, getGameName } from "../data/games";
import type { Match, TranslationFn } from "../types";

interface PlayerSelectProps {
  value: string;
  onChange: (value: string) => void;
  names: string[];
  exclude: string;
  placeholder: string;
  label: string;
  testId: string;
}

interface WinBarProps {
  winsA: number;
  winsB: number;
  nameA: string;
  nameB: string;
  colorA: string;
  colorB: string;
  compact?: boolean;
}

interface H2HMatch extends Match {
  id?: string;
  _gameId?: string;
}

interface H2HStatsByGameValue {
  winsA: number;
  winsB: number;
  played: number;
}

interface H2HResult {
  shared: H2HMatch[];
  winsA: number;
  winsB: number;
  draws: number;
  byGame: Record<string, H2HStatsByGameValue>;
  currentStreakHolder?: string | null;
  currentStreakCount?: number;
}

interface HeadToHeadPageProps {
  data: Record<string, unknown>;
  t?: TranslationFn;
  embedded?: boolean;
}

// ── PlayerSelect — autocomplete dropdown
function PlayerSelect({ value, onChange, names, exclude, placeholder, label, testId }: PlayerSelectProps) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return names.filter(n => n !== exclude).slice(0, 8);
    return names.filter(n => n !== exclude && n.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, names, exclude]);

  function pick(name: string) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  function handleBlur() {
    // delay so click on option registers
    setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="h2h-select" data-testid={testId}>
      <div className="h2h-select-label">{label}</div>
      <input
        className="inp h2h-input"
        value={query}
        placeholder={placeholder}
        aria-label={label}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onChange={e => { setQuery(e.target.value); onChange(""); setOpen(true); }}
      />
      {open && filtered.length > 0 && (
        <div className="h2h-options">
          {filtered.map(n => (
            <div
              key={n}
              data-testid="h2h-option"
              className={`h2h-option${n === value ? " selected" : ""}`}
              onMouseDown={() => pick(n)}
            >
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WinBar — visual bar comparing two win counts
function WinBar({ winsA, winsB, nameA, nameB, colorA, colorB, compact = false }: WinBarProps) {
  const total = winsA + winsB;
  const pctA = total === 0 ? 50 : Math.round((winsA / total) * 100);
  const pctB = 100 - pctA;
  return (
    <div className={`h2h-winbar${compact ? " compact" : ""}`}>
      <div className="h2h-winbar-track">
        <div className="h2h-winbar-fill" style={{ width: `${pctA}%`, background: colorA }} />
        <div className="h2h-winbar-fill" style={{ width: `${pctB}%`, background: colorB }} />
      </div>
      <div className="h2h-winbar-meta">
        <span>{pctA}% {nameA}</span>
        <span>{nameB} {pctB}%</span>
      </div>
    </div>
  );
}

function HeadToHeadPage({ data, t = (k) => k, embedded = false }: HeadToHeadPageProps) {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");

  const allMatches = useMemo(() => Object.entries(data)
    .filter(([k]) => !k.startsWith("__"))
    .flatMap(([gameId, arr]) => Array.isArray(arr) ? (arr as H2HMatch[]).map((m) => ({ ...m, _gameId: gameId })) : [])
  , [data]);

  const allNames = useMemo(() => getAllPastPlayerNames(data as Record<string, Match[] | unknown>), [data]);

  const h2h = useMemo<H2HResult | null>(() => {
    if (!nameA || !nameB) return null;
    return buildH2H(allMatches as Match[], nameA, nameB) as H2HResult;
  }, [allMatches, nameA, nameB]);

  const COLOR_A = "#4cc9f0";
  const COLOR_B = "#f72585";

  const ready = nameA && nameB && nameA !== nameB;

  const content = (
    <>
      {!embedded && (
        <div className="champ-hero">
          <div className="champ-htitle">{t("headToHead")}</div>
          <div className="champ-sub">{t("h2hVs").toUpperCase()}</div>
        </div>
      )}

      <div className="champ-section">
        <div className="h2h-panel" data-testid="h2h-panel">
          <div className="h2h-panel-head">
            {embedded && <div className="champ-sec-title">{t("headToHead")}</div>}
            <div className="h2h-panel-sub">{t("h2hVs").toUpperCase()}</div>
          </div>
          <div className="h2h-selects">
            <PlayerSelect
              value={nameA} onChange={setNameA}
              names={allNames} exclude={nameB}
              placeholder={t("h2hSelectA")} label={t("h2hSelectA")}
              testId="h2h-player-a"
            />
            <div className="h2h-versus" aria-hidden="true">
              {t("h2hVs")}
            </div>
            <PlayerSelect
              value={nameB} onChange={setNameB}
              names={allNames} exclude={nameA}
              placeholder={t("h2hSelectB")} label={t("h2hSelectB")}
              testId="h2h-player-b"
            />
          </div>
        </div>
      </div>

      {/* ── Results */}
      {ready && !h2h?.shared?.length && (
        <div className="champ-section">
          <div className="no-champs">{t("h2hNoShared")}</div>
        </div>
      )}

      {ready && h2h?.shared?.length > 0 && (() => {
        const { winsA, winsB, draws, byGame, currentStreakHolder, currentStreakCount, shared } = h2h;
        const leaderName = winsA > winsB ? nameA : winsA < winsB ? nameB : null;
        const leaderColor = winsA > winsB ? COLOR_A : COLOR_B;

        return (
          <>
            {/* ── Score card */}
            <div className="champ-section">
              <div className="h2h-scoreboard" data-testid="h2h-scoreboard">
                <div className="h2h-score-header">
                  {[{ name: nameA, wins: winsA, color: COLOR_A }, { name: nameB, wins: winsB, color: COLOR_B }].map((pl, i) => (
                    <div key={pl.name} className="h2h-score-player" style={{
                      borderRight: i === 0 ? "1px solid var(--bo)" : "none",
                    }}>
                      <div className="h2h-score-value" style={{ color: pl.color }}>{pl.wins}</div>
                      <div className="h2h-score-name">
                        {pl.name}
                      </div>
                      {leaderName === pl.name && (
                        <div className="h2h-leader-badge" style={{ color: leaderColor }}>{t("h2hLeader")}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="h2h-score-body">
                  <WinBar winsA={winsA} winsB={winsB} nameA={nameA} nameB={nameB} colorA={COLOR_A} colorB={COLOR_B} />

                  <div className="h2h-meta-row">
                    {[
                      { label: t("h2hMatches"), value: shared.length },
                      ...(draws > 0 ? [{ label: t("h2hDraw"), value: draws }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="h2h-meta-pill">
                        <span>{value}</span>{label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Racha actual */}
            {currentStreakHolder && currentStreakCount >= 2 && (
              <div className="champ-section">
                <div className="champ-sec-title">{t("h2hCurrentStreak")}</div>
                <div className="h2h-streak-card" style={{
                  borderColor: currentStreakHolder === nameA ? COLOR_A : COLOR_B,
                }}>
                  <div className="h2h-streak-copy">
                    <div className="h2h-streak-name" style={{ color: currentStreakHolder === nameA ? COLOR_A : COLOR_B }}>
                      {currentStreakHolder}
                    </div>
                    <div className="h2h-streak-sub">
                      {currentStreakCount} {t("h2hCurrentStreak").toLowerCase()}
                    </div>
                  </div>
                  <div className="h2h-streak-count" style={{ color: currentStreakHolder === nameA ? COLOR_A : COLOR_B }}>
                    ×{currentStreakCount}
                  </div>
                </div>
              </div>
            )}

            {/* ── Por juego */}
            {Object.keys(byGame).length > 0 && (
              <div className="champ-section">
                <div className="champ-sec-title">{t("h2hByGame")}</div>
                <div className="h2h-game-grid" data-testid="h2h-by-game">
                  {Object.entries(byGame)
                    .sort((a, b) => b[1].played - a[1].played)
                    .map(([gid, gs]) => {
                      const game = GAMES[gid];
                      const gc = game?.color || "#888";
                      return (
                        <div key={gid} className="h2h-game-card" style={{
                          borderColor: `color-mix(in srgb,${gc} 30%,var(--glass-border))`,
                          boxShadow: `inset 3px 0 0 ${gc}`,
                        }}>
                          <div className="h2h-game-head">
                            <span className="h2h-game-name" style={{ color: gc }}>{game ? getGameName(game.id, t) : gid}</span>
                            <span className="h2h-game-played">
                              {gs.played} {t("h2hMatches")}
                            </span>
                          </div>
                          <WinBar winsA={gs.winsA} winsB={gs.winsB} nameA={nameA} nameB={nameB} colorA={COLOR_A} colorB={COLOR_B} compact />
                          <div className="h2h-game-foot">
                            <span style={{ color: COLOR_A }}>{gs.winsA}</span>
                            <span style={{ color: COLOR_B }}>{gs.winsB}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Historial compartido (últimas 5) */}
            <div className="champ-section">
              <div className="champ-sec-title">{t("h2hRecent")}</div>
              <div className="h2h-recent-list">
                {[...shared].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((m) => {
                  const game = GAMES[m._gameId];
                  const gc = game?.color || "#888";
                  const winColor = m.winner === nameA ? COLOR_A : m.winner === nameB ? COLOR_B : "var(--tx3)";
                  return (
                    <div key={m.id} className="h2h-recent-card" style={{ boxShadow: `inset 3px 0 0 ${gc}` }}>
                      <div className="h2h-recent-copy">
                        <div className="h2h-recent-game" style={{ color: gc }}>
                          {game ? getGameName(game.id, t) : m._gameId}
                        </div>
                        <div className="h2h-recent-date">
                          {fmtDate(m.date)}
                        </div>
                      </div>
                      {m.winner && (
                        <div className="h2h-recent-winner" style={{ color: winColor }}>
                          {m.winner}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}
    </>
  );

  if (embedded) return content;

  return (
    <div className="page">
      {content}
    </div>
  );
}

export default HeadToHeadPage;
