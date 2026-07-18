import { useMemo, useState, type CSSProperties } from "react";
import { getRulesData } from "../data/rules";
import { GAMES, getTagline, getGame, getGameName } from "../data/games";
import type { TranslationFn } from "../types";

type CSSVars = CSSProperties & Record<"--gc", string>;

interface RuleSection {
  title?: string;
  text?: string;
}

interface RuleEntry {
  id: string;
  name: string;
  color: string;
  sections: RuleSection[];
}

interface RuleGroup {
  label: string;
  ids: string[];
}

interface RulesPageProps {
  t?: TranslationFn;
  search?: string;
}

function RulesPage({
  t = ((key: string) => key) as TranslationFn,
  search = "",
}: RulesPageProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const ruleGroups = useMemo<RuleGroup[]>(
    () => [
      { label: t("ruleGroupUno"), ids: ["uno", "uno_no_mercy", "uno_flip", "uno_dos"] },
      { label: t("ruleGroupCards"), ids: ["truco", "chinchon", "chancho", "chin", "esquinados", "canasta", "sushi_do"] },
      { label: t("ruleGroupTokens"), ids: ["rummy", "burako", "ajedrez", "monopoly", "life"] },
      { label: t("ruleGroupCasino"), ids: ["poker", "blackjack", "generala"] },
      { label: t("ruleGroupRandom"), ids: ["racha_perdida", "portion_counter", "basta_dym"] },
    ],
    [t],
  );

  const rulesById = useMemo(() => {
    const entries = getRulesData(t) as RuleEntry[];
    return Object.fromEntries(entries.map((rule) => [rule.id, rule])) as Record<string, RuleEntry>;
  }, [t]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      ruleGroups
        .map((group) => ({
          ...group,
          ids: group.ids.filter((id) => {
            if (!normalizedSearch) return true;
            const game = rulesById[id];
            const text = [
              game ? getGameName(game.id, t) : "",
              getTagline(id, t),
              ...(game?.sections || []).flatMap((section) => [section.title, section.text]),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return text.includes(normalizedSearch);
          }),
        }))
        .filter((group) => group.ids.length > 0),
    [normalizedSearch, ruleGroups, rulesById, t],
  );

  return (
    <div className="page">
      {visibleGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 6 }}>
          <h2 className="champ-sec-title" style={{ marginBottom: 10, marginTop: 4 }}>
            {group.label}
          </h2>
          {group.ids.map((id) => {
            const game = rulesById[id];
            if (!game) return null;
            const expanded = Boolean(open[game.id]);
            return (
              <article key={game.id} className="rule-game-card home-action-card surface-card" style={{ "--gc": game.color } as CSSVars}>
                <button
                  type="button"
                  className="rule-game-hdr"
                  aria-expanded={expanded}
                  aria-label={getGameName(game.id, t)}
                  onClick={() => setOpen((current) => ({ ...current, [game.id]: !current[game.id] }))}
                >
                  <div className="rule-game-copy">
                    <span className="rule-game-name" style={{ color: game.id === "uno_no_mercy" ? "var(--tx)" : game.color }}>
                      {getGameName(game.id, t)}
                    </span>
                    <span className="rule-game-tag">{getTagline(game.id, t) || getGame(game.id)?.tagline}</span>
                  </div>
                  <span className="home-card-action is-quiet rule-game-action">
                    <span>{expanded ? t("detailViewLess") : t("rulesViewAction")}</span>
                    <span className={`rule-chevron${expanded ? " open" : ""}`}>▼</span>
                  </span>
                </button>
                {expanded && (
                  <div className="rule-body">
                    {game.sections.map((section, index) => (
                      <div key={section.title || index} className="rule-section">
                        <h3 className="rule-stitle">{section.title}</h3>
                        <div className="rule-text">{section.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default RulesPage;
