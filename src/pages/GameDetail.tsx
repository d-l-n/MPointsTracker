import { Suspense, useState, memo, useCallback, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import StatsTab from "./StatsTab";
import RachaPerdidaStatsTab from "./RachaPerdidaStatsTab";
import ThemeToggle from "../components/ui/ThemeToggle";
import ReloadButton from "../components/ui/ReloadButton";
import { ShareResultButton } from "../components/ui/ShareResultCard";
import { X, ArrowLeft } from "reicon-react";
import AppHeader from "../components/ui/AppHeader";
import { useAppContext } from "../context/AppContext";
import { getGameComponent } from "./gameDetailRegistry";
import { getGameName } from "../data/games";
import type { AppContextValue, DraftRecord, GameDefinition, LinkedPlayer, Match, TranslationFn } from "../types";

interface DraftPlayer {
  name?: string | null;
  [key: string]: unknown;
}

export interface GameDetailDraft extends DraftRecord {
  players?: DraftPlayer[];
  p1?: unknown;
  p2?: unknown;
}

export interface GameDetailMatch extends Match {
  rounds?: number;
  penalty?: string;
  players: Match["players"];
}

export interface RematchState {
  gameId?: string;
  playerNames?: string[] | null;
  linkedPlayers?: LinkedPlayer[];
  lastSavedMatch?: GameDetailMatch | null;
}

interface GameTabContentProps {
  game: GameDefinition;
  matchKey: number;
  onAddMatch: (match: Match) => Promise<void> | void;
  draft: GameDetailDraft | null;
  onDraftChange?: (draft: GameDetailDraft | null) => void;
  linkedPlayers: LinkedPlayer[];
  onLinkedPlayersChange: (linkedPlayers: LinkedPlayer[]) => void;
  matches: GameDetailMatch[];
}

interface GameDetailProps {
  game: GameDefinition;
  onBack: (options?: { preserveDraft?: boolean }) => void;
  matches: GameDetailMatch[];
  onAddMatch: (match: Match) => Promise<void> | void;
  tab?: "new" | "stats";
  onTabChange?: (tab: "new" | "stats") => void;
  matchKey?: number;
  draft?: GameDetailDraft | null;
  onDraftChange?: (draft: GameDetailDraft | null) => void;
  linkedPlayers?: LinkedPlayer[];
  onLinkedPlayersChange: (linkedPlayers: LinkedPlayer[]) => void;
  dark?: boolean;
  onDarkChange?: () => void;
  onOpenHistory?: ((gameId: string) => void) | null;
  onRematch?: ((payload?: RematchState) => void) | null;
  rematchState?: RematchState | null;
  onRematchStateChange?: (state: RematchState | null) => void;
}

const GameTabContent = memo(function GameTabContent({
  game, matchKey, onAddMatch,
  draft, onDraftChange,
  linkedPlayers, onLinkedPlayersChange,
  matches,
}: GameTabContentProps) {
  const { knownNames, t, playerGroups, savePlayerGroups } = useAppContext() as AppContextValue;
  const commonProps = {
    onSave: async (m: GameDetailMatch) => { await onAddMatch(m); },
    knownNames, t, draft, onDraftChange,
    linkedPlayers, onLinkedPlayersChange,
    playerGroups, onSavePlayerGroups: savePlayerGroups,
  };
  const GameComponent = getGameComponent(game.type);

  return (
    <Suspense fallback={<div className="empty" role="status"><div className="etxt">{t("loadingGame")}</div></div>}>
      <GameComponent
        key={matchKey}
        {...commonProps}
        game={game}
        matches={matches}
      />
    </Suspense>
  );
});

function GameDetail({
  game, onBack, matches, onAddMatch,
  tab = "new", onTabChange,
  matchKey = 0, draft = null, onDraftChange,
  linkedPlayers = [], onLinkedPlayersChange,
  dark = false, onDarkChange,
  onOpenHistory,
  onRematch,
  rematchState = null,
  onRematchStateChange,
}: GameDetailProps) {
  const { t = ((k: string) => k) as TranslationFn } = (useAppContext() as AppContextValue);

  const [chromeHeight, setChromeHeight] = useState<number | null>(null);
  // Timer: track match duration
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const activeRematchState = rematchState?.gameId === game.id ? rematchState : null;
  const isStatsVisible = tab === "stats";
  const TAB_IDS = ["new", "stats"] as const;

  const handleTabChange = useCallback((newTab: "new" | "stats") => {
    onTabChange?.(newTab);
  }, [onTabChange]);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = TAB_IDS.indexOf(tab);
    let next: typeof TAB_IDS[number] | null = null;
    if (e.key === "ArrowRight") next = TAB_IDS[(idx + 1) % TAB_IDS.length];
    else if (e.key === "ArrowLeft") next = TAB_IDS[(idx - 1 + TAB_IDS.length) % TAB_IDS.length];
    else if (e.key === "Home") next = TAB_IDS[0];
    else if (e.key === "End") next = TAB_IDS[TAB_IDS.length - 1];
    if (next) { e.preventDefault(); handleTabChange(next); }
  }, [tab, handleTabChange]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  // Timer: start when on "new" tab, pause on other tabs.
  // `elapsed` is intentionally excluded from deps — it is only needed to
  // compute startTimeRef at the moment the interval is created (mount of the
  // "new" tab). Including it would restart the interval on every tick.
  useEffect(() => {
    if (tab === "new") {
      startTimeRef.current = Date.now() - (elapsed * 1000);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000));
      }, 1000);
    } else {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps -- elapsed excluded intentionally, see comment above

  // Listen for system back gesture dispatched from App.jsx
  useEffect(() => {
    const onSystemBack = () => handleBack();
    window.addEventListener("mpoints-back", onSystemBack);
    return () => window.removeEventListener("mpoints-back", onSystemBack);
  }, [handleBack]);

  useEffect(() => {
    const chromeNode = chromeRef.current;
    if (!chromeNode || typeof ResizeObserver === "undefined") return undefined;

    const syncChromeHeight = () => {
      setChromeHeight(chromeNode.scrollHeight);
    };

    syncChromeHeight();
    const resizeObserver = new ResizeObserver(syncChromeHeight);
    resizeObserver.observe(chromeNode);

    return () => resizeObserver.disconnect();
  }, [game.id, isStatsVisible, tab, t]);

  return (
    <div className="detail" style={{ "--gc": game.color } as CSSProperties}>
      <div
        ref={chromeRef}
        className="detail-chrome"
        style={chromeHeight ? { "--detail-chrome-height": `${chromeHeight}px` } as CSSProperties : undefined}
      >
        <AppHeader className="detail-header detail-header--with-tabs">
          <div className="detail-header-row">
            <button className="ibtn" onClick={handleBack} aria-label={t("back")}><ArrowLeft size={20} /></button>
            <div className="page-title-block page-title-block--grow">
              <h1 className="htitle detail-title">{getGameName(game.id, t)}</h1>
              <span className="hsub">{matches.length} {t("matchesPlayed")}</span>
            </div>
            <div className="detail-toolbar">
              <div className="detail-toolbar-row">
                <ReloadButton t={t} />
                <div className="hdr-toggle-mobile"><ThemeToggle dark={dark} onChange={onDarkChange} t={t} /></div>
              </div>
              <div className="detail-toolbar-row detail-toolbar-row--stacked">
                {tab === "new" && elapsed > 0 && (
                  <span className="detail-timer">
                    {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="tabs detail-tabs" role="tablist" aria-label={t("gameTabs")} onKeyDown={handleTabKeyDown}>
            {[["new", t("newMatch"), tab === "new"], ["stats", t("homeActionStats"), isStatsVisible]].map(([id, label, isActive]) => (
              <button
                key={id as string}
                role="tab"
                aria-selected={isActive as boolean}
                aria-controls={`tabpanel-${id}`}
                id={`tab-${id}`}
                className={`tab detail-tab${isActive ? " active" : ""}`}
                onClick={() => handleTabChange(id as "stats" | "new")}
                data-testid={`tab-${id}`}
              >
                {label as string}
              </button>
            ))}
          </div>
        </AppHeader>
      </div>
      <div className="tbody">
        {tab === "new" && (
          <div key="tab-new" role="tabpanel" id="tabpanel-new" aria-labelledby="tab-new">
            <GameTabContent
              game={game} matchKey={matchKey} onAddMatch={async (m: GameDetailMatch) => {
                const dur = Math.round(elapsed / 60); // minutes
                const withMeta = dur > 0 ? { ...m, duration: dur } : m;
                // Store reversed player list + linked accounts for rematch
                const names = (m.players || []).map((p) => p.name).filter(Boolean) as string[];
                const reversedNames = names.length >= 2 ? [...names].reverse() : null;
                // Snapshot linked players reversed to match new order
                let nextRematchLinked: LinkedPlayer[] = [];
                if (reversedNames && linkedPlayers.length > 0) {
                  nextRematchLinked = linkedPlayers.map((lp) => ({
                    ...lp,
                    // playerId will be re-mapped in onRematch using name match
                  }));
                }
                if (timerRef.current !== null) clearInterval(timerRef.current);
                setElapsed(0);
                onRematchStateChange?.({
                  gameId: game.id,
                  playerNames: reversedNames,
                  linkedPlayers: nextRematchLinked,
                  lastSavedMatch: withMeta,
                });
                await onAddMatch(withMeta);
              }}
              draft={draft} onDraftChange={onDraftChange}
              linkedPlayers={linkedPlayers} onLinkedPlayersChange={onLinkedPlayersChange}
              matches={matches}
            />
          </div>
        )}
        {/* Rematch banner — shown after saving a match */}
        {isStatsVisible && activeRematchState?.playerNames && (
          <div className="detail-rematch-banner" data-testid="game-detail-rematch-banner">
            <div className="detail-rematch-copy">
              <div className="detail-rematch-title">{t("rematch")}</div>
              <div className="detail-rematch-players">{activeRematchState.playerNames.join(" · ")}</div>
            </div>
            <button
              data-testid="game-detail-rematch-action"
              className="detail-rematch-action"
              onClick={() => {
                onRematchStateChange?.(null);
                onRematch?.({
                  playerNames: activeRematchState.playerNames,
                  linkedPlayers: activeRematchState.linkedPlayers || [],
                });
              }}
            >{t("rematch")}</button>
            {activeRematchState.lastSavedMatch && (
              <ShareResultButton match={activeRematchState.lastSavedMatch} game={game} t={t} />
            )}
            <button
              className="detail-rematch-dismiss"
              aria-label={t("closeMenu")}
              onClick={() => { onRematchStateChange?.(null); onTabChange?.("new"); }}
            ><X size={16} /></button>
          </div>
        )}
        {isStatsVisible && (
          <div key="tab-stats" role="tabpanel" id="tabpanel-stats" aria-labelledby="tab-stats" data-testid="detail-stats-shell">
            {game.type === "racha_perdida"
              ? <RachaPerdidaStatsTab matches={matches} t={t} onOpenHistory={onOpenHistory ? () => onOpenHistory(game.id) : null} />
              : <StatsTab matches={matches} t={t} onOpenHistory={onOpenHistory ? () => onOpenHistory(game.id) : null} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(GameDetail);
