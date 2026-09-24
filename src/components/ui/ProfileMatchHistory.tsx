import { getGame, getGameName } from "../../data/games";
import { fmtDate } from "../../lib/stats";
import type { Match, TranslationFn } from "../../types";

export interface ProfileHistoryMatch extends Match {
  _gid: string;
  gameName?: string;
}

interface ProfileMatchHistoryProps {
  matches: ProfileHistoryMatch[];
  t: TranslationFn;
  limit?: number;
  onViewAll?: () => void;
}

/**
 * Compact, read-only match list rendered inside a profile (own or public).
 * Shows the most recent matches first: game, date, winner and the players.
 */
function ProfileMatchHistory({ matches, t, limit = 8, onViewAll }: ProfileMatchHistoryProps) {
  const visible = matches.slice(0, limit);

  return (
    <div data-testid="profile-history-section">
      <div className="public-profile-section-label">{t("profileHistory").toUpperCase()}</div>
      {visible.length === 0 ? (
        <div className="public-profile-empty public-profile-empty--compact">{t("profileHistoryEmpty")}</div>
      ) : (
        <div className="public-profile-panel surface-card profile-history-list">
          {visible.map((match) => {
            const game = getGame(match._gid);
            const displayName = match._gid === "custom" && match.gameName
              ? match.gameName
              : (game ? getGameName(game.id, t) : match._gid);
            const players = (match.players || []).map((player) => player.name).join(", ");
            return (
              <div className="profile-history-row" key={`${match._gid}-${match.id}`}>
                <span
                  className="profile-history-accent"
                  style={{ background: game?.color || "#006D77" }}
                  aria-hidden="true"
                />
                <div className="profile-history-copy">
                  <div className="profile-history-title">{displayName}</div>
                  <div className="profile-history-meta">
                    {fmtDate(match.date)}
                    {match.winner ? ` · 🏆 ${match.winner}` : ""}
                  </div>
                </div>
                <div className="profile-history-players" title={players}>{players}</div>
              </div>
            );
          })}
          {onViewAll && matches.length > visible.length && (
            <button type="button" className="btnsec profile-history-viewall" onClick={onViewAll}>
              {t("profileHistoryViewAll")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileMatchHistory;
