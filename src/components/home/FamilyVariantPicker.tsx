import type { HomeCardModel, HomeCardVariant } from "./homeModel";
import type { TranslationFn } from "../../types";

interface FamilyVariantPickerProps {
  card: HomeCardModel;
  t: TranslationFn;
  onSelect: (gameId: string) => void;
  onClose: () => void;
}

export default function FamilyVariantPicker({ card, t, onSelect, onClose }: FamilyVariantPickerProps) {
  const variants: HomeCardVariant[] = card.variants || [];

  return (
    <div
      className="family-picker-overlay"
      data-testid={`${card.id}-picker`}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        className="family-picker-overlay-scrim"
        aria-hidden="true"
      />
      <div
        className="family-picker"
        role="dialog"
        aria-modal="true"
        aria-label={t("unoFamily")}
      >
        <div className="family-picker-head">
          <div>
            <div className="family-picker-kicker">{t("unoFamily")}</div>
            <h3 className="family-picker-title">{card.game.name}</h3>
          </div>
          <button type="button" className="family-picker-close" aria-label={t("close")} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="family-picker-list">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className={`family-picker-item${variant.hasDraft ? " is-active" : ""}`}
              style={{ "--identity-accent": variant.accent } as React.CSSProperties}
              data-testid={`${card.id}-variant-${variant.id}`}
              aria-label={variant.hasDraft ? `${variant.name} — ${t("matchInProgress")}` : variant.name}
              onClick={() => onSelect(variant.id)}
            >
              <span className="family-picker-dot" style={{ background: variant.color }} />
              <span className="family-picker-item-body">
                <span className="family-picker-name">{variant.name}</span>
                <span className="family-picker-tag">{variant.tagline}</span>
              </span>
              {variant.hasDraft ? (
                <span className="family-picker-badge">{t("matchInProgress")}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}