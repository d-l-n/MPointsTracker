import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import ConfirmModal from "../components/ui/ConfirmModal";
import EditMatchModal from "../components/ui/EditMatchModal";
import { fmtDate } from "../lib/stats";
import { GAMES, getGameName, getGame } from "../data/games";
import type { UnoRosterEvent } from "../types";

function formatUnoRosterSummary(match: Match | null | undefined): string | null {
  if (!match?.rosterEvents?.length) return null;
  const getPortableRound = (event: UnoRosterEvent) =>
    Number.isFinite(event.effectiveRound) && event.effectiveRound > 0 ? Math.trunc(event.effectiveRound) : 1;
  const formatEvent = (event: UnoRosterEvent) => {
    const name = event.playerName?.trim();
    return name ? `${event.type === "join" ? "+" : "-"}${name} R${getPortableRound(event)}` : null;
  };
  return match.rosterEvents
    .map((event, index) => ({ event, index }))
    .sort((a, b) => getPortableRound(a.event) - getPortableRound(b.event) || a.index - b.index)
    .map(({ event }) => formatEvent(event))
    .filter(Boolean)
    .join(" · ") || null;
}
import { useAppContext } from "../context/AppContext";
import { X, Edit, Trash } from "reicon-react";
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

interface PendingDelete {
  gid: string;
  mid: string;
  match: HistoryMatch;
  timerId: ReturnType<typeof setTimeout>;
}

interface GlobalHistoryPageProps {
  initialGameFilter?: string;
  initialPlayerFilter?: string;
  lockGameFilter?: boolean;
}

const VIRTUAL_ITEM_ESTIMATE = 212;
const VIRTUAL_OVERSCAN = 6;
const VIRTUAL_THRESHOLD = 40;

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * GlobalHistoryPage
 * Vista de historial cross-game: todas las partidas mezcladas, filtrable por jugador y juego.
 * Props:
 *   initialGameFilter — filtro inicial por juego
 *   lockGameFilter    — bloquea el filtro de juego cuando viene desde una vista compartida
 */
function GlobalHistoryPage({
  initialGameFilter = "all",
  initialPlayerFilter = "",
  lockGameFilter = false,
}: GlobalHistoryPageProps) {
  const { data = {}, t = ((k: string) => k) as TranslationFn, delMatch, editMatch, showToast } = useAppContext() as AppContextValue;

  const [search, setSearch] = useState(initialPlayerFilter);
  const [dateFilter, setDateFilter] = useState("all");
  const [gameFilter, setGameFilter] = useState(initialGameFilter || "all");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null); // { gid, mid }
  const [editing, setEditing] = useState<HistoryMatch | null>(null); // match being edited
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRenamePlayer = useCallback((gid: string, oldName: string) => {
    const newName = window.prompt(t("renamePlayer"), oldName);
    if (!newName || newName.trim() === oldName) return;
    const trimmed = newName.trim();
    const matches = (Array.isArray(data[gid]) ? data[gid] : []) as HistoryMatch[];
    matches.forEach((match) => {
      const updated = { ...match };
      updated.players = match.players.map((p) =>
        p.name === oldName ? { ...p, name: trimmed } : p,
      );
      if (updated.winner === oldName) updated.winner = trimmed;
      editMatch?.(gid, updated);
    });
    showToast(t("matchUpdated"));
  }, [data, editMatch, showToast, t]);
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
    const pendingId = pendingDelete?.mid;
    return Object.entries(data)
      .filter(([k, value]) => !k.startsWith("__") && Array.isArray(value))
      .flatMap(([gid, matches]) =>
        (matches as HistoryMatch[]).map((m) => ({ ...m, game: m.game || gid, _gid: gid }))
      )
      .filter((m) => m.id !== pendingId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, pendingDelete]);

  // Games present in history (preserving GAMES order)
  const gamesInHistory = useMemo(() => {
    const ids = new Set(allMatches.map((m) => m._gid));
    return Object.values(GAMES).filter((g) => ids.has(g.id));
  }, [allMatches]);

  const swipeState = useRef<{ el: HTMLElement | null; startX: number; startY: number; deltaX: number }>({ el: null, startX: 0, startY: 0, deltaX: 0 });
  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const card = (e.target as HTMLElement).closest(".mcard") as HTMLElement | null;
    if (!card || card.closest(".history-meta-actions")) return;
    const touch = e.touches[0];
    swipeState.current = { el: card, startX: touch.clientX, startY: touch.clientY, deltaX: 0 };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const s = swipeState.current;
    if (!s.el) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - s.startX;
    const deltaY = touch.clientY - s.startY;
    if (deltaX > 0) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    s.deltaX = deltaX;
    s.el.style.transform = `translateX(${deltaX}px)`;
    s.el.style.transition = "none";
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const s = swipeState.current;
    if (!s.el) return;
    if (Math.abs(s.deltaX) >= SWIPE_THRESHOLD) {
      const gid = s.el.getAttribute("data-gid") || "";
      const mid = s.el.getAttribute("data-mid") || "";
      const match = allMatches.find((m) => m.id === mid) as HistoryMatch | undefined;
      if (match) {
        const timerId = setTimeout(() => {
          delMatch(gid, mid);
          setPendingDelete(null);
        }, 5000);
        setPendingDelete({ gid, mid, match, timerId });
        showToast(t("deleted"), 5000, {
          label: t("undo"),
          onAction: () => {
            clearTimeout(timerId);
            setPendingDelete(null);
            showToast(t("deletedUndone"));
          },
        });
      }
    }
    s.el.style.transition = "transform .3s var(--ease, ease)";
    s.el.style.transform = "";
    s.el = null;
  }, [allMatches, delMatch, showToast, t]);

  useEffect(() => {
    setGameFilter(initialGameFilter || "all");
  }, [initialGameFilter]);

  useEffect(() => {
    setSearch(initialPlayerFilter || "");
  }, [initialPlayerFilter]);

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
      const game = getGame(gameFilter);
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
          id="history-search"
          name="history-search"
          data-testid="search-player"
          placeholder={t("searchPlayer")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("searchPlayer")}
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch("")} aria-label={t("clearSearch")}><X size={14} /></button>
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
        <button
          type="button"
          className="filter-btn"
          disabled={filtered.length === 0}
          onClick={() => downloadJson(`mpoints_history_${new Date().toISOString().slice(0, 10)}.json`, filtered)}
        >
          {t("exportFilteredHistory")}
        </button>
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
        <div
          className={`hlist${virtualState.isVirtualized ? " hlist--virtualized" : ""}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {virtualState.topSpacerHeight > 0 && (
            <div aria-hidden="true" style={{ height: virtualState.topSpacerHeight }} />
          )}
          {virtualState.items.map((m) => {
            const game = getGame(m._gid);
            const displayName  = (m._gid === "custom" && m.gameName)  ? m.gameName  : (game ? getGameName(game.id, t) : m._gid);
            const displayColor = game?.color || "#006D77";
            const rosterSummary = formatUnoRosterSummary(m);
            return (
              <div
                className="mcard history-match-card"
                key={m.id}
                data-testid={`match-${m.id}`}
                data-gid={m._gid}
                data-mid={m.id}
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
                      <span
                        className={`mpname${p.name === m.winner ? " w" : ""}`}
                        onPointerDown={() => {
                          longPressRef.current = setTimeout(() => {
                            longPressRef.current = null;
                            handleRenamePlayer(m._gid, p.name);
                          }, 500);
                        }}
                        onPointerUp={() => {
                          if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                        }}
                        onPointerLeave={() => {
                          if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                        }}
                        style={{ touchAction: "none" }}
                      >{p.name}</span>
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
                      (m.rounds ?? 0) > 0 ? `${m.rounds} ${t("rounds")}` : null,
                      (m.duration ?? 0) > 0 ? `${m.duration} ${t("durationMin") || "min"}` : null,
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
                          {!m._sharedBy && (
                          <button
                            className="history-action-btn"
                            data-testid={`edit-match-${m.id}`}
                            title={t("editMatch")}
                            onClick={() => setEditing(m)}
                            ><Edit size={16} /> {t("editMatch")}</button>
                          )}
                          <button
                            className="history-action-btn history-action-btn--delete"
                            data-testid={`delete-match-${m.id}`}
                            onClick={() => setConfirm({ gid: m._gid, mid: m.id })}
                          ><Trash size={16} /> {t("deleteMatch")}</button>
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
          onConfirm={() => {
            const match = allMatches.find((m) => m.id === confirm.mid) as HistoryMatch | undefined;
            if (match) {
              const timerId = setTimeout(() => {
                delMatch(confirm.gid, confirm.mid);
                setPendingDelete(null);
              }, 5000);
              setPendingDelete({ gid: confirm.gid, mid: confirm.mid, match, timerId });
              showToast(t("deleted"), 5000, {
                label: t("undo"),
                onAction: () => {
                  clearTimeout(timerId);
                  setPendingDelete(null);
                  showToast(t("deletedUndone"));
                },
              });
            } else {
              delMatch(confirm.gid, confirm.mid);
            }
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {editing && (
        <EditMatchModal
          match={editing}
          onSave={(updated) => { editMatch?.(editing._gid, updated as Match & Record<string, unknown>); setEditing(null); }}
          onClose={() => setEditing(null)}
          t={t}
        />
      )}
    </div>
  );
}

export default GlobalHistoryPage;
