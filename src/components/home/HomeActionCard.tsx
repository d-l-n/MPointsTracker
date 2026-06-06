import HomeGameHero from "./HomeGameHero";
import { getGameName } from "../../data/games";
import type { HomeCardModel } from "./homeModel";
import type { TranslationFn } from "../../types";

function getBadgeText(card: HomeCardModel, t: TranslationFn): string {
  if (!card.badgeKey || !card.hasDraft) return "";
  return t(card.badgeKey);
}

function getStatusLabel(card: HomeCardModel, t: TranslationFn): string {
  if (card.hasDraft || !card.latestMatch) return "";
  return card.isRecent ? t("homeRecent") : t("homeFavorite");
}

interface HomeActionCardProps {
  card: HomeCardModel;
  t: TranslationFn;
  featured?: boolean;
  promotedElsewhere?: boolean;
  testIdBase?: string;
  onOpenGame: (gameId: string) => void;
  onQuickAction: (gameId: string, actionKey: string) => void;
}

export default function HomeActionCard({
  card,
  t,
  featured = false,
  promotedElsewhere = false,
  testIdBase = `game-${card.id}`,
  onOpenGame,
  onQuickAction,
}: HomeActionCardProps) {
  const badgeText = getBadgeText(card, t);
  const statusLabel = getStatusLabel(card, t);
  const heroState = card.hasDraft ? "active" : card.isRecent ? "recent" : "idle";

  return (
    <article
      className={`home-action-card surface-card${featured ? " home-action-card--featured" : ""}${promotedElsewhere ? " home-action-card--catalog-muted" : ""}`}
      style={{ "--gc": card.game.color, "--identity-accent": card.identity?.accent || card.game.color } as React.CSSProperties}
      data-card-tone={card.identity?.tone || "classic"}
      data-card-key={card.identity?.key || card.id}
    >
      <button
        type="button"
        className="home-card-surface"
        onClick={() => onOpenGame(card.id)}
        data-testid={testIdBase}
      >
        <HomeGameHero
          family={card.heroFamily}
          gameId={card.id}
          state={heroState}
          title={getGameName(card.game.id, t)}
          tone={card.identity?.tone}
          coverImage={card.coverImage}
        />
        <div className="home-card-overlay" />
        <div className="home-card-copy">
          <div className="home-card-topline">
            {badgeText && !card.hasDraft ? <span className="home-card-badge">{badgeText}</span> : null}
          </div>
          <div className="home-card-title-row">
            <div>
              <div className="home-card-title">{getGameName(card.game.id, t)}</div>
              <div className="home-card-meta">{card.metadata}</div>
            </div>
            {statusLabel ? (
              <span className="home-card-status-icon" role="img" aria-label={statusLabel} title={statusLabel}>
                🕒
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <div className="home-card-actions">
        {card.actions.map((action) => (
          <button
            key={action.key}
            type="button"
            className={`home-card-action is-${action.emphasis}`}
            data-testid={`${testIdBase}-action-${action.key}`}
            onClick={(event) => {
              event.stopPropagation();
              onQuickAction(card.id, action.key);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}
