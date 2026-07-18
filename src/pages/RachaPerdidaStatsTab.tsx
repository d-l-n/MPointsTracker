import { fmtDate } from "../lib/stats";
import type { Match, TranslationFn } from "../types";

interface RachaPlayer {
  name?: string | null;
}

interface RachaMatch extends Omit<Match, "players"> {
  id?: string;
  penalty?: string;
  players?: RachaPlayer[];
}

interface RachaPerdidaStatsTabProps {
  matches?: RachaMatch[];
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

function RachaPerdidaStatsTab({
  matches = [],
  t = (k) => k,
  onOpenHistory = null,
}: RachaPerdidaStatsTabProps) {
  // Count losses per player
  const lossCounts: Record<string, number> = {};
  matches.forEach(m => {
    const name = m.players?.[0]?.name;
    if (name) lossCounts[name] = (lossCounts[name] || 0) + 1;
  });
  const ranking = Object.entries(lossCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Last 5 entries for recent penalty log
  const recent = [...matches].reverse().slice(0, 5);
  const previewMatches = [...matches]
    .sort((a, b) => Number(new Date(b.date || 0)) - Number(new Date(a.date || 0)))
    .slice(0, 3);

  return (
    <div className="detail-stats-stack">
      <div className="sgrid detail-stats-grid">
        <div className="scard surface-card--dense">
          <div className="sv">{matches.length}</div>
          <div className="sl">{t("loserRegistros")}</div>
        </div>
        <div className="scard surface-card--dense">
          <div className="sv">{ranking[0]?.count || 0}</div>
          <div className="sl">{t("loserMaxLosses")}</div>
        </div>
      </div>

      {!matches.length && (
        <div className="stats-empty surface-card surface-card--dense">
          <div className="home-section-kicker">{t("homeActionStats")}</div>
          <div className="etxt">{t("noRecordsYet")}</div>
        </div>
      )}

      <span className="flbl" style={{display:"block",marginBottom:9}}>{t("loserRanking")}</span>
      <div className="lb" style={{marginBottom:20}}>
        {ranking.map((p, i) => (
          <div className="lbrow" key={p.name}>
            <div className={`lbrank${i === 0 ? " top" : ""}`}>{i + 1}</div>
            <div style={{flex:1}}>
              <div className="lbname">{p.name}</div>
              <div className="lbsub">{Math.round((p.count / matches.length) * 100)}% {t("loserPct")}</div>
            </div>
            <div className="lbwins" style={{color:"var(--racha-accent)"}}>{p.count}</div>
          </div>
        ))}
      </div>

      <span className="flbl" style={{display:"block",marginBottom:9}}>{t("recentPenalties")}</span>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {recent.map(m => (
          <div key={m.id} className="surface-card surface-card--dense">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:".86rem",fontWeight:700,color:"var(--tx)"}}>{m.players?.[0]?.name}</span>
              <span style={{fontSize:".68rem",color:"var(--tx3)"}}>{fmtDate(m.date)}</span>
            </div>
            {m.penalty && <div style={{fontSize:".78rem",color:"var(--tx2)",lineHeight:1.5}}>{m.penalty}</div>}
          </div>
        ))}
      </div>

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
          {previewMatches.map((match) => (
            <article key={match.id} className="detail-history-preview-entry" data-testid={`detail-history-entry-${match.id}`}>
              <div className="detail-history-preview-main">
                <div className="detail-history-preview-players">{match.players?.[0]?.name || t("noNamePlaceholder")}</div>
                <div className="detail-history-preview-meta">{formatPreviewDate(match.date)}</div>
              </div>
              <div className="detail-history-preview-side">{match.penalty || ""}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default RachaPerdidaStatsTab;
