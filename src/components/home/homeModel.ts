import { GAMES, getTagline } from "../../data/games";
import { buildStats } from "../../lib/stats";
import type { DraftRecord, GameDefinition, GameId, Match, TranslationFn } from "../../types";

interface HomeGroupDefinition {
  key: string;
  icon: string;
  labelKey: string;
  type: string;
  ids: GameId[];
}

interface HomeDraftRecord extends DraftRecord {
  players?: Array<{ name?: string | null } | null>;
  p1?: unknown;
  p2?: unknown;
}

interface HomeCardAction {
  key: "continue" | "new" | "stats";
  label: string;
  emphasis: "primary" | "secondary" | "quiet";
}

interface HomeCardIdentity {
  key: string;
  glyph: string;
  label: string;
  tone: string;
  accent: string;
}

export interface HomeCardVariant {
  id: GameId;
  name: string;
  tagline: string;
  color: string;
  accent: string;
  hasDraft: boolean;
}

export interface HomeCardModel {
  id: GameId;
  game: GameDefinition;
  heroFamily: string;
  identity: HomeCardIdentity;
  coverImage?: string;
  hasDraft: boolean;
  isRecent: boolean;
  badgeKey: string;
  metadata: string;
  matchCount: number;
  latestMatch: Match | null;
  latestDate: Date | null;
  sortDate: string | number | Date;
  playerCount: number;
  actions: HomeCardAction[];
  groupKey?: string;
  isFamily?: boolean;
  variants?: HomeCardVariant[];
}

interface HomeCardGroup {
  key: string;
  name: string;
  cards: HomeCardModel[];
  icon?: string;
  labelKey?: string;
  type?: string;
  ids?: GameId[];
  matchCount?: number;
}

type HomeFilterKey = "all" | "in-progress" | "favorites" | "uno-family" | "cards" | "tokens" | "casino" | "random";

interface HomeFilter {
  key: HomeFilterKey;
  label: string;
}

interface HomeEmptyState {
  title: string;
  detail: string;
}

interface BuildHomeViewModelArgs {
  data: Record<string, Match[] | unknown>;
  getMatches: (gameId: string) => Match[];
  getDraft: (gameId: string) => HomeDraftRecord | null | undefined;
  t: TranslationFn;
  locale?: string;
  activeFilter?: HomeFilter["key"];
  search?: string;
}

interface HomeViewModel {
  featured: HomeCardModel | null;
  groups: HomeCardGroup[];
  recentCards: HomeCardModel[];
  savedMatches: number;
  filters: HomeFilter[];
  emptyState: HomeEmptyState | null;
}

export const HOME_GROUPS: HomeGroupDefinition[] = [
  { key: "uno-family", icon: "U", labelKey: "unoFamily", type: "cards", ids: ["uno", "uno_no_mercy", "uno_flip", "uno_dos"] },
  { key: "cards", icon: "C", labelKey: "cardsGroup", type: "cards", ids: ["truco", "chinchon", "chancho", "chin", "esquinados", "canasta", "sushi_do", "rummy", "burako"] },
  { key: "tokens", icon: "B", labelKey: "tokensGroup", type: "tokens", ids: ["ajedrez", "monopoly", "life"] },
  { key: "casino", icon: "S", labelKey: "casinoGroup", type: "classics", ids: ["poker", "blackjack", "generala"] },
  { key: "random", icon: "R", labelKey: "randomGroup", type: "classics", ids: ["racha_perdida", "portion_counter", "basta_dym", "custom"] },
];

const UNO_FAMILY_IDS: GameId[] = ["uno", "uno_flip", "uno_dos", "uno_no_mercy"];
const FAMILY_GROUP_KEYS: Record<string, GameId[]> = {
  "uno-family": UNO_FAMILY_IDS,
};

const RECENT_WINDOW_DAYS = 14;

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function formatHomeDate(dateValue: string | number | Date, locale = "es"): string {
  if (!dateValue) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(new Date(dateValue));
  } catch {
    return new Date(dateValue).toLocaleDateString();
  }
}

function getHeroFamily(gameId: GameId): string {
  if (["uno", "uno_no_mercy", "uno_flip", "uno_dos"].includes(gameId)) return "uno";
  if (["truco", "chinchon", "chin", "canasta", "rummy", "burako", "sushi_do"].includes(gameId)) return "cards";
  if (["chancho", "racha_perdida", "custom", "portion_counter", "basta_dym"].includes(gameId)) return "playful";
  if (["ajedrez", "esquinados", "monopoly", "life"].includes(gameId)) return "board";
  if (["poker", "blackjack"].includes(gameId)) return "casino";
  if (gameId === "generala") return "dice";
  return "cards";
}

function getCardIdentity(game: GameDefinition): HomeCardIdentity {
  const baseGlyph = game.name.slice(0, 1).toUpperCase();

  switch (game.id) {
    case "uno":
      return { key: game.id, glyph: baseGlyph, label: "+4", tone: "arcade", accent: "#ff6b6b" };
    case "uno_no_mercy":
      return { key: game.id, glyph: baseGlyph, label: "KO", tone: "hazard", accent: "#ff8c42" };
    case "uno_flip":
      return { key: game.id, glyph: baseGlyph, label: "FLIP", tone: "neon", accent: "#b87cff" };
    case "uno_dos":
      return { key: game.id, glyph: baseGlyph, label: "2X", tone: "speed", accent: "#58a6ff" };
    case "truco":
      return { key: game.id, glyph: baseGlyph, label: "EN", tone: "table", accent: "#b78a60" };
    case "chancho":
      return { key: game.id, glyph: baseGlyph, label: "CHO", tone: "party", accent: "#ff5db1" };
    case "esquinados":
      return { key: game.id, glyph: baseGlyph, label: "4C", tone: "grid", accent: "#4fd17d" };
    case "chin":
    case "ajedrez":
      return { key: game.id, glyph: baseGlyph, label: "1V1", tone: "duel", accent: "#9ea7ff" };
    case "chinchon":
      return { key: game.id, glyph: baseGlyph, label: "100", tone: "stack", accent: "#ff9c45" };
    case "rummy":
      return { key: game.id, glyph: baseGlyph, label: "RUN", tone: "stack", accent: "#4ca3ff" };
    case "canasta":
      return { key: game.id, glyph: baseGlyph, label: "5K", tone: "stack", accent: "#ff7d6b" };
    case "burako":
      return { key: game.id, glyph: baseGlyph, label: "2K", tone: "stack", accent: "#cb7cff" };
    case "sushi_do":
      return { key: game.id, glyph: baseGlyph, label: "6X", tone: "party", accent: "#ff8d7b" };
    case "poker":
      return { key: game.id, glyph: baseGlyph, label: "ALL", tone: "casino", accent: "#ff6f61" };
    case "blackjack":
      return { key: game.id, glyph: baseGlyph, label: "21", tone: "hazard", accent: "#ffb347" };
    case "generala":
      return { key: game.id, glyph: baseGlyph, label: "5D", tone: "dice", accent: "#ffd54a" };
    case "racha_perdida":
      return { key: game.id, glyph: baseGlyph, label: "RIP", tone: "hazard", accent: "#b37dff" };
    case "portion_counter":
      return { key: game.id, glyph: baseGlyph, label: "EAT", tone: "feast", accent: "#3dd9b8" };
    case "basta_dym":
      return { key: game.id, glyph: baseGlyph, label: "A-Z", tone: "words", accent: "#67a6ff" };
    case "monopoly":
      return { key: game.id, glyph: baseGlyph, label: "$$", tone: "board", accent: "#ff7c72" };
    case "life":
      return { key: game.id, glyph: baseGlyph, label: "GO", tone: "journey", accent: "#52d681" };
    case "custom":
      return { key: game.id, glyph: baseGlyph, label: "DIY", tone: "sandbox", accent: "#9f8cff" };
    default:
      return { key: game.id, glyph: baseGlyph, label: game.name.slice(0, 3).toUpperCase(), tone: "classic", accent: game.color };
  }
}

function buildGameCardModel({
  gameId,
  matches,
  draft,
  t,
  locale,
  now,
}: {
  gameId: GameId;
  matches: Match[];
  draft: HomeDraftRecord | null | undefined;
  t: TranslationFn;
  locale: string;
  now: Date;
}): HomeCardModel | null {
  const game = GAMES[gameId];
  if (!game || game.hiddenFromCatalog) return null;

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestMatch = sortedMatches[0] || null;
  const stats = buildStats(matches);
  const topPlayer = stats[0] || null;
  const hasDraft = Boolean(draft);
  const lastPlayedDays = latestMatch?.date ? daysBetween(new Date(latestMatch.date), now) : null;
  const isRecent = !hasDraft && lastPlayedDays !== null && lastPlayedDays <= RECENT_WINDOW_DAYS;
  const playerCount =
    draft?.players?.filter((player) => player?.name?.trim()).length ||
    (draft?.p1 ? 1 : 0) + (draft?.p2 ? 1 : 0) ||
    latestMatch?.players?.length ||
    0;

  let badgeKey = "";
  let metadata = getTagline(game.id, t) || game.tagline || "";

  if (hasDraft) {
    badgeKey = "matchInProgress";
    metadata = `${t("matchInProgress")} · ${playerCount} ${t("players")}`;
  } else if (isRecent && latestMatch) {
    badgeKey = "homeRecent";
    metadata = `${matches.length} ${t("matches")} · ${formatHomeDate(latestMatch.date, locale)}`;
  } else if (matches.length > 0) {
    metadata = `${matches.length} ${t("matchesPlayed")}${topPlayer ? ` · ${t("leader2")} ${topPlayer.name}` : ""}`;
  }

  return {
    id: game.id,
    game,
    heroFamily: getHeroFamily(game.id),
    identity: getCardIdentity(game),
    coverImage: game.coverImage,
    hasDraft,
    isRecent,
    badgeKey,
    metadata,
    matchCount: matches.length,
    latestMatch,
    latestDate: latestMatch?.date ? new Date(latestMatch.date) : null,
    sortDate: draft?._savedAt || latestMatch?.date || 0,
    playerCount,
    actions: [
      ...(hasDraft ? [{ key: "continue", label: t("homeActionContinue"), emphasis: "primary" as const }] : []),
      { key: "new", label: t("homeActionNew"), emphasis: hasDraft ? "secondary" : "primary" },
      { key: "stats", label: t("homeActionStats"), emphasis: "quiet" },
    ] as HomeCardAction[],
  };
}

function buildFamilyCardModel({
  groupKey,
  variantIds,
  getMatches,
  getDraft,
  t,
  locale,
  now,
}: {
  groupKey: string;
  variantIds: GameId[];
  getMatches: (gameId: string) => Match[];
  getDraft: (gameId: string) => HomeDraftRecord | null | undefined;
  t: TranslationFn;
  locale: string;
  now: Date;
}): HomeCardModel | null {
  const variantCards = variantIds
    .map((gameId) => buildGameCardModel({ gameId, matches: getMatches(gameId), draft: getDraft(gameId), t, locale, now }))
    .filter((card): card is HomeCardModel => Boolean(card));
  if (variantCards.length === 0) return null;

  const totalMatches = variantCards.reduce((sum, card) => sum + card.matchCount, 0);
  const draftVariant = variantCards.find((card) => card.hasDraft);
  const recentVariant = variantCards.find((card) => card.isRecent) || null;
  const sortDate = Math.max(
    0,
    ...variantCards.map((card) => Number(card.sortDate) || 0),
  );

  const variants: HomeCardVariant[] = variantCards.map((card) => ({
    id: card.id,
    name: card.game.name,
    tagline: getTagline(card.id, t) || card.game.tagline || "",
    color: card.game.color,
    accent: card.identity?.accent || card.game.color,
    hasDraft: card.hasDraft,
  }));

  const metadata = draftVariant
    ? `${t("matchInProgress")} · ${draftVariant.game.name}`
    : recentVariant
      ? `${totalMatches} ${t("matches")} · ${t("unoFamily")}`
      : `${totalMatches} ${t("matchesPlayed")}`;

  return {
    id: groupKey as unknown as GameId,
    game: { ...variantCards[0].game, id: groupKey as unknown as GameId, name: t("unoFamily"), tagline: t("unoFamilyTagline") },
    heroFamily: "uno",
    identity: { key: groupKey, glyph: "U", label: "UNO", tone: "arcade", accent: "#ff6b6b" },
    hasDraft: Boolean(draftVariant),
    isRecent: Boolean(recentVariant),
    badgeKey: draftVariant ? "matchInProgress" : "",
    metadata,
    matchCount: totalMatches,
    latestMatch: variantCards.map((c) => c.latestMatch).filter(Boolean).sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())[0] || null,
    latestDate: variantCards.map((c) => c.latestDate).filter(Boolean).sort((a, b) => (b!.getTime()) - (a!.getTime()))[0] || null,
    sortDate,
    playerCount: draftVariant?.playerCount || 0,
    actions: [{ key: "new" as const, label: t("homeActionNew"), emphasis: "primary" as const }],
    groupKey,
    isFamily: true,
    variants,
  };
}

function matchesFilter(card: HomeCardModel, activeFilter: HomeFilter["key"]): boolean {
  switch (activeFilter) {
    case "in-progress":
      return card.hasDraft;
    case "recent":
      return card.hasDraft || card.isRecent;
    case "favorites":
      return card.matchCount > 0;
    case "uno-family":
    case "cards":
    case "tokens":
    case "casino":
    case "random":
      return card.groupKey === activeFilter;
    case "all":
    default:
      return true;
  }
}

function matchesSearch(card: HomeCardModel, normalizedSearch: string, t: TranslationFn): boolean {
  if (!normalizedSearch) return true;
  const haystack = [
    card.game.name,
    card.metadata,
    getTagline(card.id, t),
  ].join(" ").toLowerCase();
  return haystack.includes(normalizedSearch);
}

export function buildHomeViewModel({
  data,
  getMatches,
  getDraft,
  t,
  locale = "es",
  activeFilter = "all",
  search = "",
}: BuildHomeViewModelArgs): HomeViewModel {
  const now = new Date();
  const normalizedSearch = search.trim().toLowerCase();
  const allCards: HomeCardModel[] = [];

  const groups: HomeCardGroup[] = HOME_GROUPS.map((group): HomeCardGroup => {
    const familyIds = FAMILY_GROUP_KEYS[group.key];
    if (familyIds) {
      const familyCard = buildFamilyCardModel({
        groupKey: group.key,
        variantIds: familyIds,
        getMatches,
        getDraft,
        t,
        locale,
        now,
      });
      const cards = familyCard ? [familyCard] : [];
      cards.forEach((card) => allCards.push(card));
      return {
        ...group,
        name: t(group.labelKey),
        matchCount: group.ids.reduce((sum, gameId) => sum + getMatches(gameId).length, 0),
        cards,
      };
    }

    const cards = group.ids
      .map((gameId) => {
        const card = buildGameCardModel({
          gameId,
          matches: getMatches(gameId),
          draft: getDraft(gameId),
          t,
          locale,
          now,
        });
        return card ? { ...card, groupKey: group.key } : null;
      })
      .filter((card): card is HomeCardModel & { groupKey: string } => Boolean(card));

    cards.forEach((card) => allCards.push(card));

    return {
      ...group,
      name: t(group.labelKey),
      matchCount: group.ids.reduce((sum, gameId) => sum + getMatches(gameId).length, 0),
      cards,
    };
  });

  const featuredBase =
    [...allCards]
      .filter((card) => card.hasDraft)
      .sort((a, b) => Number(b.sortDate) - Number(a.sortDate))[0] || null;
  const featured =
    featuredBase && matchesFilter(featuredBase, activeFilter) && matchesSearch(featuredBase, normalizedSearch, t)
      ? featuredBase
      : null;

  const favoriteIds = new Set(
    [...allCards]
      .filter((card) => card.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 3)
      .map((card) => card.id),
  );

  const recentCards = [...allCards]
    .filter((card) => {
      if (card.id === featured?.id) return false;
      if (!(card.isRecent || favoriteIds.has(card.id))) return false;
      if (!matchesFilter(card, activeFilter)) return false;
      return matchesSearch(card, normalizedSearch, t);
    })
    .sort((a, b) => (b.latestDate?.getTime() || 0) - (a.latestDate?.getTime() || 0))
    .slice(0, 6)
    .map((card) => ({
      ...card,
      badgeKey: card.badgeKey || (favoriteIds.has(card.id) ? "homeFavorite" : ""),
    }));
  const promotedIds = new Set([featured?.id, ...recentCards.map((card) => card.id)].filter(Boolean));

  const filteredGroups = groups
    .map((group) => {
      const cards = group.cards.filter((card) => {
        if (!matchesFilter(card, activeFilter) || !matchesSearch(card, normalizedSearch, t)) return false;
        return !promotedIds.has(card.id);
      });
      return { ...group, cards };
    })
    .filter((group) => group.cards.length > 0);

  const isInProgress = activeFilter === "in-progress";
  let displayGroups: HomeCardGroup[];
  if (isInProgress) {
    const draftCards = [...allCards]
      .filter((card) => card.hasDraft && matchesSearch(card, normalizedSearch, t))
      .sort((a, b) => Number(b.sortDate) - Number(a.sortDate));
    displayGroups = draftCards.length > 0
      ? [{ key: "in-progress", name: t("homeFilterInProgress"), cards: draftCards }]
      : [];
  } else {
    displayGroups = filteredGroups;
  }

  const hasContent = isInProgress
    ? displayGroups.length > 0
    : Boolean(featured) || recentCards.length > 0 || displayGroups.length > 0;

  const savedMatches = Object.entries(data)
    .filter(([key, value]) => !key.startsWith("__") && Array.isArray(value))
    .reduce((sum, [, value]) => sum + (value as unknown[]).length, 0);

  return {
    featured: isInProgress ? null : featured,
    groups: displayGroups,
    recentCards: isInProgress ? [] : recentCards,
    savedMatches,
    filters: [
      { key: "all", label: t("homeFilterAll") },
      { key: "in-progress", label: t("homeFilterInProgress") },
      { key: "favorites", label: t("homeFilterFavorites") },
      ...HOME_GROUPS.map((g) => ({ key: g.key as HomeFilterKey, label: t(g.labelKey) })),
    ],
    emptyState: hasContent
      ? null
      : {
          title: normalizedSearch ? `${t("noResults")} "${search.trim()}"` : t("homeNoResults"),
          detail: normalizedSearch ? t("searchGameOrMatch") : t("playFirst"),
        },
  };
}
