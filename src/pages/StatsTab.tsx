import { buildStats } from "../lib/stats";
import { buildInsights } from "../lib/insights";
import type { Match, TranslationFn, UnoRosterEvent } from "../types";

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

type StatsMatchPlayer = string | { name?: string | null };

interface StatsMatch extends Omit<Match, "players"> {
  id?: string;
  rounds?: number;
  players: StatsMatchPlayer[];
}

interface StatsTabProps {
  matches?: StatsMatch[];
  t?: TranslationFn;
  onOpenHistory?: (() => void) | null;
}

function formatPreviewDate(dateValue: string | number | Date | undefined): string {
  if (!dateValue) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(dateValue));
  } catch {
    return "";
  }
}

function getPlayerNames(match: StatsMatch): string[] {
  if (!Array.isArray(match?.players)) return [];
  return match.players.map((player) => (
    typeof player === "string" ? player : player?.name
  )).filter(Boolean) as string[];
}

function StatsTab({
  matches = [],
  t = (k) => k,
  onOpenHistory = null,
}: StatsTabProps) {
  const players = buildStats(matches as Match[]);
  const insights = buildInsights(matches as Match[]);
  const totalRounds = matches.reduce((s, m) => s + (m.rounds || 0), 0);
  const durations = matches.filter(m => (m.duration ?? 0) > 0).map(m => m.duration ?? 0);
  const avgDuration = durations.length ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : null;
  const recentMatches = [...matches]
    .sort((a, b) => Number(new Date(b.date || 0)) - Number(new Date(a.date || 0)))
    .slice(0, 3);

  return (
    <div className="detail-stats-stack">
      <div className="sgrid detail-stats-grid">
        <div className="scard surface-card--dense" data-testid="stat-total-matches"><div className="sv">{matches.length}</div><div className="sl">{t("matches")}</div></div>
        <div className="scard surface-card--dense" data-testid="stat-total-rounds"><div className="sv">{totalRounds}</div><div className="sl">{t("rounds")}</div></div>
        {avgDuration != null && <div className="scard surface-card--dense"><div className="sv">{avgDuration}</div><div className="sl">{t("avgDuration")} ({t("durationMin")})</div></div>}
      </div>
      {(insights.topWinner || insights.mostPlayedMatchup) && (
        <div className="sgrid detail-stats-grid">
          {insights.topWinner && (
            <div className="scard surface-card--dense" data-testid="stat-top-winner">
              <div className="sv">{insights.topWinner.name}</div>
              <div className="sl">{t("insightTopWinner")} · {insights.topWinner.wins} W</div>
            </div>
          )}
          {insights.mostPlayedMatchup && (
            <div className="scard surface-card--dense" data-testid="stat-top-matchup">
              <div className="sv">{insights.mostPlayedMatchup.names.join(" vs ")}</div>
              <div className="sl">{t("insightMostPlayedMatchup")} · {insights.mostPlayedMatchup.count}</div>
            </div>
          )}
        </div>
      )}
      {!matches.length && (
        <div className="stats-empty surface-card surface-card--dense" aria-live="polite">
          <div className="home-section-kicker">{t("homeActionStats")}</div>
          <div className="etxt">{t("noStats")}</div>
        </div>
      )}
      <h2 className="flbl" style={{ display:"block", marginBottom:"9px" }}>{t("leaderboard")}</h2>
      {players.length > 0 ? (
        <div className="lb">
          {players.map((p, i) => (
            <div className="lbrow" key={p.name} data-testid={`leaderboard-${i}`}>
              <div className={`lbrank${i < 3 ? " top" : ""}`}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div className="lbname">{p.name}</div>
                <div className="lb-bar-wrap"><div className="lb-bar" style={{width:`${p.winrate}%`}} /></div>
                <div className="lbsub">{p.winrate}% {t("winrateShort")} · {p.played} {t("matchesPlayed")}</div>
                {p.streak?.current >= 2 && <span className="streak-badge">{t("streak")} {p.streak.current}</span>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div className="lbwins">{p.wins} <span className="lbwins-unit">W</span></div>
                {p.streak?.max >= 3 && <div style={{ fontSize:".65rem", color:"var(--tx3)", marginTop:"2px" }}>{t("maxStreak")} {p.streak.max}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color:"var(--tx2)", fontSize:".82rem" }}>{t("noStats")}</div>
      )}

      <section className="detail-history-preview surface-card surface-card--dense" data-testid="detail-history-preview">
        <div className="detail-history-preview-head">
          <div className="page-title-block">
            <span className="page-kicker">{t("detailRecentMatches")}</span>
            <strong className="detail-inline-action-title">{matches.length} {t("matchesPlayed")}</strong>
          </div>
          {onOpenHistory && (
            <button type="button" className="detail-inline-action" data-testid="detail-history-open" onClick={onOpenHistory}>
              {t("detailViewAll")}
            </button>
          )}
        </div>
        <div className="detail-history-preview-list">
          {recentMatches.map((match) => {
            const names = getPlayerNames(match);
            const rosterSummary = formatUnoRosterSummary(match as Match);
            return (
              <article key={match.id} className="detail-history-preview-entry" data-testid={`detail-history-entry-${match.id}`}>
                <div className="detail-history-preview-main">
                  <div className="detail-history-preview-players">{names.join(" · ") || t("noNamePlaceholder")}</div>
                  <div className="detail-history-preview-meta">{formatPreviewDate(match.date)}</div>
                  {rosterSummary && (
                    <div className="detail-history-preview-meta">{rosterSummary}</div>
                  )}
                </div>
                <div className="detail-history-preview-side">
                  {match.winner || names[0] || ""}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default StatsTab;
