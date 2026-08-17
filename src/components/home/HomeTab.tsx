import { memo, useEffect, useMemo, useRef, useState } from "react";

import { buildHomeViewModel, type HomeFilterKey } from "./homeModel";
import HomeActionCard from "./HomeActionCard";
import FamilyVariantPicker from "./FamilyVariantPicker";
import ReloadButton from "../ui/ReloadButton";
import ThemeToggle from "../ui/ThemeToggle";
import SyncDot from "../ui/SyncDot";
import UserAvatar from "../ui/UserAvatar";
import AppHeader from "../ui/AppHeader";
import type { User } from "firebase/auth";
import type { Match, ThemeMode, TranslationFn } from "../../types";
import type { AppUser } from "../../components/settings/shared";

interface HomeTabProps {
  t: TranslationFn;
  lang: string;
  data: Record<string, Match[] | unknown>;
  total: number;
  dark: boolean;
  user: (AppUser | User) | null | undefined;
  syncing: boolean;
  syncError: unknown;
  handleNav: (target: string) => void;
  handleThemeMode: (mode: ThemeMode) => void;
  onThemeSettings?: () => void;
  setShowAuthModal: (value: string) => void;
  getMatches: (gameId: string) => Match[];
  getDraft: (gameId: string) => Record<string, unknown> | null | undefined;
  onOpenGame: (gameId: string) => void;
  onQuickAction: (gameId: string, actionKey: string) => void;
  sectionHeaderHiddenByScroll: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}

const HomeTab = memo(function HomeTab({
  t,
  lang,
  data,
  total,
  dark,
  user,
  syncing,
  syncError,
  handleNav,
  handleThemeMode,
  onThemeSettings,
  setShowAuthModal,
  getMatches,
  getDraft,
  onOpenGame,
  onQuickAction,
  sectionHeaderHiddenByScroll,
}: HomeTabProps) {
  const [familyPicker, setFamilyPicker] = useState<import("./homeModel").HomeCardModel | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [activeFilter, setActiveFilter] = useState<HomeFilterKey>("all");
  const railRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [filterCanScrollLeft, setFilterCanScrollLeft] = useState(false);
  const [filterCanScrollRight, setFilterCanScrollRight] = useState(false);

  const vm = useMemo(() => buildHomeViewModel({
    data,
    getMatches,
    getDraft,
    t,
    locale: lang,
    activeFilter,
    search: debouncedSearch,
  }), [activeFilter, data, getDraft, getMatches, lang, debouncedSearch, t]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const threshold = 2;
      setCanScrollLeft(rail.scrollLeft > threshold);
      setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - threshold);
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(rail);
    const mo = new MutationObserver(update);
    mo.observe(rail, { childList: true, subtree: true });
    return () => {
      rail.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    const filter = filterRef.current;
    if (!filter) return;
    const update = () => {
      const threshold = 2;
      setFilterCanScrollLeft(filter.scrollLeft > threshold);
      setFilterCanScrollRight(filter.scrollLeft + filter.clientWidth < filter.scrollWidth - threshold);
    };
    update();
    filter.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(filter);
    const mo = new MutationObserver(update);
    mo.observe(filter, { childList: true, subtree: true });
    return () => {
      filter.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <>
      <div
        className={`home-header-surface home-sticky-header${sectionHeaderHiddenByScroll ? " chrome--hidden" : ""}`}
        data-testid="home-sticky-header"
      >
        <AppHeader
          className="home-hdr"
          hidden={sectionHeaderHiddenByScroll}
          mainClassName="page-title-block--grow"
          main={(
            <>
              <h1 className="big-title desktop-hide">MPOINTS<br />TRACKER</h1>
              <h1 className="big-title mobile-hide">{t("games").toUpperCase()}</h1>
              <div className="home-sub">{total} {t("matchesSaved")}</div>
            </>
          )}
          actions={(
            <>
              <div className="hdr-toggle-mobile">
                <ThemeToggle dark={dark} onChange={() => handleThemeMode(dark ? "light" : "dark")} onLongPress={onThemeSettings} t={t} />
              </div>
              <div className="user-row">
                <ReloadButton t={t} />
                {user && <SyncDot syncing={syncing} error={syncError} t={t} />}
                {user && (
                  <button type="button" className="home-avatar-btn" onClick={() => handleNav("about")} title={t("viewProfile")} aria-label={t("viewProfile")}>
                    <UserAvatar user={user} />
                  </button>
                )}
                {!user && <button className="btn-signout app-layout-connect-btn" onClick={() => setShowAuthModal("main")}>{t("connect")}</button>}
              </div>
            </>
          )}
        />

        <div className="home-utility-shell">
          <div className="home-search">
            <input
              className="search-inp"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchGameOrMatch")}
              aria-label={t("searchGameOrMatch")}
            />
          </div>
          <div className="home-filter-wrapper">
            <button
              type="button"
              className={`home-rail-arrow home-rail-arrow--left${filterCanScrollLeft ? "" : " home-rail-arrow--hidden"}`}
              aria-label={t("scrollLeft")}
              data-testid="filter-arrow-left"
              onClick={() => filterRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
            >
              ‹
            </button>
            <div ref={filterRef} className="home-filter-row" data-testid="home-filter-row">
              {vm.filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`home-filter-chip${activeFilter === filter.key ? " active" : ""}`}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`home-rail-arrow home-rail-arrow--right${filterCanScrollRight ? "" : " home-rail-arrow--hidden"}`}
              aria-label={t("scrollRight")}
              data-testid="filter-arrow-right"
              onClick={() => filterRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="home-shell">
      {(vm.featured || vm.recentCards.length > 0) && (
        <div className="home-top-shell" data-testid="home-top-shell">
          {vm.featured && (
            <section className="home-featured-shell">
              <div className="home-section-heading">
                <div>
                  <div className="home-section-kicker">{t("homeContinueLabel")}</div>
                </div>
              </div>
<HomeActionCard
                  card={vm.featured}
                  t={t}
                  featured
                  testIdBase={`game-${vm.featured.id}`}
                  onOpenGame={onOpenGame}
                  onQuickAction={onQuickAction}
                  onPickFamily={setFamilyPicker}
                />
            </section>
          )}

          {vm.recentCards.length > 0 && (
            <section className="home-rail-shell">
              <div className="home-section-heading">
                <div className="home-section-kicker">{t("homeRecent")}</div>
              </div>
              <div className="home-rail-wrapper">
                <button
                  type="button"
                  className={`home-rail-arrow home-rail-arrow--left${canScrollLeft ? "" : " home-rail-arrow--hidden"}`}
                  aria-label={t("scrollLeft")}
                  data-testid="rail-arrow-left"
                  onClick={() => railRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
                >
                  ‹
                </button>
                <div ref={railRef} className="home-card-stack home-card-stack--rail" data-testid="home-rail">
                  {vm.recentCards.map((card) => (
                    <HomeActionCard
                      key={`recent-${card.id}`}
                      card={card}
                      t={t}
                      testIdBase={`game-${card.id}${vm.featured?.id === card.id ? "-recent" : ""}`}
                      onOpenGame={onOpenGame}
                      onQuickAction={onQuickAction}
                      onPickFamily={setFamilyPicker}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={`home-rail-arrow home-rail-arrow--right${canScrollRight ? "" : " home-rail-arrow--hidden"}`}
                  aria-label={t("scrollRight")}
                  data-testid="rail-arrow-right"
                  onClick={() => railRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
                >
                  ›
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {vm.emptyState && (
        <section className="home-empty-state surface-card" data-testid="home-empty-state">
          <div className="home-section-kicker">{t("games")}</div>
          <h2 className="home-section-title">{vm.emptyState.title}</h2>
          <p className="home-empty-copy">{vm.emptyState.detail}</p>
        </section>
      )}

      <div className="ggrid home-catalog-grid">
        <div className="ggrid-col">
          {vm.groups.filter((_, index) => index % 2 === 0).map((group) => {
            return (
              <section key={group.key} className="home-catalog-group">
                <h2 className="home-group-title" data-testid={`group-${group.key}`}>{group.name}</h2>
                <div className="home-card-stack">
                  {group.cards.map((card) => (
                    <HomeActionCard
                      key={card.id}
                      card={card}
                      t={t}
                      promotedElsewhere={false}
                      testIdBase={`game-${card.id}`}
                      onOpenGame={onOpenGame}
                      onQuickAction={onQuickAction}
                      onPickFamily={setFamilyPicker}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <div className="ggrid-col">
          {vm.groups.filter((_, index) => index % 2 === 1).map((group) => {
            return (
              <section key={group.key} className="home-catalog-group">
                <h2 className="home-group-title" data-testid={`group-${group.key}`}>{group.name}</h2>
                <div className="home-card-stack">
                  {group.cards.map((card) => (
                    <HomeActionCard
                      key={card.id}
                      card={card}
                      t={t}
                      promotedElsewhere={false}
                      testIdBase={`game-${card.id}`}
                      onOpenGame={onOpenGame}
                      onQuickAction={onQuickAction}
                      onPickFamily={setFamilyPicker}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
    {familyPicker ? (
      <FamilyVariantPicker
        card={familyPicker}
        t={t}
        onSelect={(gameId) => {
          setFamilyPicker(null);
          onOpenGame(gameId);
        }}
        onClose={() => setFamilyPicker(null)}
      />
    ) : null}
  </>);
});

export default HomeTab;
