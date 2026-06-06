import { useState, useMemo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import ConfirmModal from "../components/ui/ConfirmModal";
import EditMatchModal from "../components/ui/EditMatchModal";
import { fmtDate } from "../lib/stats";
import { formatUnoRosterSummary } from "../lib/unoRosterSummary";
import { GAMES, getGameName } from "../data/games";
import { useAppContext } from "../context/AppContext";
import type { AppContextValue, Match, TranslationFn } from "../types";

interface HistoryPlayer {
  name: string;
  score?: number;
  net?: number;
}

interface HistoryMatch extends Match {
  id: string;
  players: HistoryPlayer[];
  note?: string;
  penalty?: string;
  _sharedBy?: string;
  _gid: string;
  gameName?: string;
  limit?: number;
  duration?: number;
}

interface ConfirmState {
  gid: string;
  mid: string;
}

interface GlobalHistoryPageProps {
  initialGameFilter?: string;
  lockGameFilter?: boolean;
}

const VIRTUAL_ITEM_ESTIMATE = 212;
const VIRTUAL_OVERSCAN = 6;
const VIRTUAL_THRESHOLD = 40;

/**
 * GlobalHistoryPage
 * Vista de historial cross-game: todas las partidas mezcladas, filtrable por jugador y juego.
 * Props:
 *   initialGameFilter — filtro inicial por juego
 *   lockGameFilter    — bloquea el filtro de juego cuando viene desde una vista compartida
 */
function GlobalHistoryPage({
  initialGameFilter = "all",
  lockGameFilter = false,
}: GlobalHistoryPageProps) {
  const { data = {}, t = ((k: string) => k) as TranslationFn, delMatch, editMatch } = useAppContext() as AppContextValue;

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [gameFilter, setGameFilter] = useState(initialGameFilter || "all");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null); // { gid, mid }
  const [editing, setEditing] = useState<HistoryMatch | null>(null); // match being edited
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const DATE_FILTERS = [
    { id: "all",   label: t("filterAll") },
    { id: "month", label: t("filterMonth") },
    { id: "week",  label: t("filterWeek") },
  ];

  // All matches flattened, preserving game info
  const allMatches = useMemo(() => {
    return Object.entries(data)
      .filter(([k, value]) => !k.startsWith("__") && Array.isArray(value))
      .flatMap(([gid, matches]) =>
        (matches as HistoryMatch[]).map((m) => ({ ...m, game: m.game || gid, _gid: gid }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  // Games present in history (preserving GAMES order)
  const gamesInHistory = useMemo(() => {
    const ids = new Set(allMatches.map((m) => m._gid));
    return Object.values(GAMES).filter((g) => ids.has(g.id));
  }, [allMatches]);

  useEffect(() => {
    setGameFilter(initialGameFilter || "all");
  }, [initialGameFilter]);

  useEffect(() => {
    const nextScrollContainer = document.querySelector(".app-content");
    if (!(nextScrollContainer instanceof HTMLElement)) return undefined;

    scrollContainerRef.current = nextScrollContainer;

    const updateMetrics = () => {
      setScrollTop(nextScrollContainer.scrollTop);
      setViewportHeight(nextScrollContainer.clientHeight);
    };

    updateMetrics();
    nextScrollContainer.addEventListener("scroll", updateMetrics, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      nextScrollContainer.removeEventListener("scroll", updateMetrics);
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  useEffect(() => {
    const activeScrollContainer = scrollContainerRef.current;
    if (!activeScrollContainer) return;

    activeScrollContainer.scrollTop = 0;
    setScrollTop(0);
  }, [search, dateFilter, gameFilter]);

  const filtered = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();
    let list = allMatches;

    if (dateFilter !== "all") {
      const cutoff = new Date();
      if (dateFilter === "week")  cutoff.setDate(now.getDate() - 7);
      if (dateFilter === "month") cutoff.setMonth(now.getMonth() - 1);
      list = list.filter((m) => new Date(m.date) >= cutoff);
    }

    if (gameFilter !== "all") {
      list = list.filter((m) => m._gid === gameFilter);
    }

    if (q) {
      list = list.filter((m) =>
        (m.players || []).some((p) => p.name.toLowerCase().includes(q)) ||
        (m.winner || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [allMatches, search, dateFilter, gameFilter]);

  const noResultsMsg = useMemo(() => {
    if (search.trim()) return `${t("noResults")} "${search.trim()}"`;
    if (gameFilter !== "all") {
      const game = GAMES[gameFilter];
      return `${t("noResults")} ${game ? getGameName(game.id, t) : gameFilter}`;
    }
    return t("noResults");
  }, [search, gameFilter, t]);

  const virtualState = useMemo(() => {
    if (filtered.length < VIRTUAL_THRESHOLD || viewportHeight <= 0) {
      return {
        items: filtered,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
        isVirtualized: false,
      };
    }

    const maxStartIndex = Math.max(0, filtered.length - 1);
    const firstIndex = Math.min(
      maxStartIndex,
      Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_ESTIMATE) - VIRTUAL_OVERSCAN),
    );
    const visibleCount = Math.ceil(viewportHeight / VIRTUAL_ITEM_ESTIMATE) + (VIRTUAL_OVERSCAN * 2);
    const lastIndex = Math.min(filtered.length, firstIndex + visibleCount);

    return {
      items: filtered.slice(firstIndex, lastIndex),
      topSpacerHeight: firstIndex * VIRTUAL_ITEM_ESTIMATE,
      bottomSpacerHeight: Math.max(0, (filtered.length - lastIndex) * VIRTUAL_ITEM_ESTIMATE),
      isVirtualized: true,
    };
  }, [filtered, scrollTop, viewportHeight]);

  if (!allMatches.length) {
    return (
      <div className="page" data-testid="history-subpage">
        <div className="surface-card surface-card--dense history-empty-card">
          <div className="empty">
            <div className="etxt">{t("noMatches")}<br />{t("playFirst")}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" data-testid="history-subpage">
      {/* Search */}
      <div className="search-bar">
        <input
          className="search-inp"
          data-testid="search-player"
          placeholder={t("searchPlayer")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Date filters */}
      <div className="history-date-filter-row">
        {DATE_FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-btn${dateFilter === f.id ? " active" : ""}`}
            onClick={() => setDateFilter(f.id)}
          >{f.label}</button>
        ))}
        {(dateFilter !== "all" || search || gameFilter !== "all") && (
          <span className="history-result-count">
            {filtered.length} {t("results")}
          </span>
        )}
      </div>

      {/* Game filters */}
      {!lockGameFilter && gamesInHistory.length > 1 && (
        <div data-testid="history-filter-games" className="history-filter-row">
          <button
            data-testid="history-filter-game-all"
            className={`filter-btn${gameFilter === "all" ? " active" : ""}`}
            onClick={() => setGameFilter("all")}
          >{t("filterAll")}</button>
          {gamesInHistory.map(g => (
            <button
              key={g.id}
              data-testid={`history-filter-game-${g.id}`}
              className={`filter-btn${gameFilter === g.id ? " active" : ""}`}
              onClick={() => setGameFilter(gameFilter === g.id ? "all" : g.id)}
              style={gameFilter === g.id ? { "--history-game-color": g.color } as CSSProperties : undefined}
            >{getGameName(g.id, t)}</button>
          ))}
        </div>
      )}

      {/* Match list */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="etxt">{noResultsMsg}</div>
        </div>
      ) : (
        <div className={`hlist${virtualState.isVirtualized ? " hlist--virtualized" : ""}`}>
          {virtualState.topSpacerHeight > 0 && (
            <div aria-hidden="true" style={{ height: virtualState.topSpacerHeight }} />
          )}
          {virtualState.items.map((m) => {
            const game = GAMES[m._gid];
            const displayName  = (m._gid === "custom" && m.gameName)  ? m.gameName  : (game ? getGameName(game.id, t) : m._gid);
            const displayColor = game?.color || "#006D77";
            const rosterSummary = formatUnoRosterSummary(m);
            return (
              <div
                className="mcard history-match-card"
                key={m.id}
                data-testid={`match-${m.id}`}
                style={{ "--history-card-accent": displayColor } as CSSProperties}
              >
                <div className="mtop">
                  <span className="mdate">{fmtDate(m.date)}</span>
                  {m._sharedBy && (
                    <span className="shared-badge" title={`${t("sharedBy")} ${m._sharedBy}`}>
                      {m._sharedBy}
                    </span>
                  )}
                  {m.winner && <span className="mwinner">{m.winner}</span>}
                </div>

                <div className="mplayers">
                  {(m.players || []).map((p, i) => (
                    <div className="mprow" key={`${p.name}-${i}`}>
                      <span className={`mpname${p.name === m.winner ? " w" : ""}`}>{p.name}</span>
                      {p.score != null && !m.penalty && <span className="mpscore">{p.score} pts</span>}
                      {p.net != null && p.net !== 0 && (
                        <span className={`history-net-pill${p.net > 0 ? " is-positive" : " is-negative"}`}>
                          {p.net > 0 ? "+" : ""}{t("currency")}{p.net.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {m.penalty && (
                  <div className="history-penalty-card">
                    <span className="history-penalty-label">{t("penaltyStreak")}</span>
                    {m.penalty}
                  </div>
                )}

                {m.note && (
                  <div className="history-note-card">
                    {m.note}
                  </div>
                )}

                {rosterSummary && (
                  <div className="history-note-card">
                    {rosterSummary}
                  </div>
                )}

                  {(() => {
                    const meta = [
                      m.rounds > 0 ? `${m.rounds} ${t("rounds")}` : null,
                      m.duration > 0 ? `${m.duration} ${t("durationMin") || "min"}` : null,
                      m.limit ? `${t("until")} ${m.limit} pts` : null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div className="mmeta history-meta-row">
                        <div className="history-meta-start">
                          {displayName && (
                            <span className="history-game-badge" style={{ "--history-card-accent": displayColor } as CSSProperties}>
                              {displayName}
                            </span>
                          )}
                          <span className="history-meta-copy">{meta}</span>
                        </div>
                        <div className="history-meta-actions">
                          {!m._sharedBy && editMatch && (
                          <button
                            className="history-action-btn"
                            data-testid={`edit-match-${m.id}`}
                            title={t("editMatch")}
                            onClick={() => setEditing(m)}
                            >{t("editMatch")}</button>
                          )}
                          <button
                            className="history-action-btn history-action-btn--delete"
                            data-testid={`delete-match-${m.id}`}
                            onClick={() => setConfirm({ gid: m._gid, mid: m.id })}
                          >{t("deleteMatch")}</button>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            );
          })}
          {virtualState.bottomSpacerHeight > 0 && (
            <div aria-hidden="true" style={{ height: virtualState.bottomSpacerHeight }} />
          )}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={t("deleteMatch")}
          msg={t("deleteMatchMsg")}
          onConfirm={() => { delMatch(confirm.gid, confirm.mid); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {editing && (
        <EditMatchModal
          match={editing}
          onSave={(updated) => { editMatch?.(editing._gid, updated); setEditing(null); }}
          onClose={() => setEditing(null)}
          t={t}
        />
      )}
    </div>
  );
}

export default GlobalHistoryPage;
