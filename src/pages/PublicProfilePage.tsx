import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { doc, getDoc } from "firebase/firestore";
import ConfirmModal from "../components/ui/ConfirmModal";
import { GAMES, getGameName } from "../data/games";
import { fbDb } from "../lib/firebase";
import { normalizePublicProfile } from "../lib/publicData";
import { buildStats } from "../lib/stats";
import type {
  Match,
  MatchStore,
  PlayerResult,
  PlayerStats,
  PublicGameStats,
  PublicProfile,
  PublicStatsSummary,
  TranslationFn,
} from "../types";

const PROFILE_FALLBACK_ACCENT = "#006D77";
const PROFILE_VERSUS_ACCENT = "#38bdf8";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}

interface MatchPlayer extends PlayerResult {
  name: string;
}

interface StoredMatch extends Match {
  players?: Array<MatchPlayer | string>;
  winner?: string | null;
}

interface VersusGameSummary {
  gid: string;
  shared: number;
  myW: number;
  theirW: number;
  myName: string;
  theirName: string;
}

interface ProfileStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

interface StatPillProps {
  label: string;
  value: string | number;
  accent?: string;
}

interface VersusBarProps {
  labelA: string;
  labelB: string;
  winsA: number;
  winsB: number;
  colorA?: string;
  colorB?: string;
}

interface GameStatRowProps {
  gid: string;
  stats: PublicGameStats;
  t: TranslationFn;
}

interface VersusGameRowProps {
  gid: string;
  shared: number;
  myW: number;
  theirW: number;
  myName: string;
  theirName: string;
  t: TranslationFn;
}

interface PublicProfilePageProps {
  uid?: string | null;
  onBack?: () => void;
  t: TranslationFn;
  myData?: MatchStore | Record<string, unknown> | null;
  myUser?: AppUser | null;
  onSignOut?: (keepLocal?: boolean) => void;
  onSignIn?: (mode: "google" | "signin") => void;
  onOpenHistoryForPlayer?: (playerName: string) => void;
  showToast?: (msg: string, duration?: number) => void;
}

type TestPublicProfile = Record<string, unknown> & {
  publicStats?: PublicStatsSummary | null;
};

declare global {
  interface Window {
    __MP_TEST_PUBLIC_PROFILES__?: Record<string, TestPublicProfile>;
  }
}

function getPlayerName(player: MatchPlayer | string): string {
  return typeof player === "string" ? player : player.name;
}

function buildPerGameStatsFromData(data: MatchStore | Record<string, unknown> | null | undefined, playerName: string): Record<string, PublicGameStats> {
  const result: Record<string, PublicGameStats> = {};

  Object.entries(data || {}).forEach(([gid, matches]) => {
    if (gid.startsWith("__") || !Array.isArray(matches)) return;

    const playerMatches = (matches as StoredMatch[]).filter((match) =>
      (match.players || []).some((player) => getPlayerName(player) === playerName),
    );

    if (playerMatches.length === 0) return;

    const wins = playerMatches.filter((match) => match.winner === playerName).length;
    result[gid] = {
      played: playerMatches.length,
      wins,
      winrate: Math.round((wins / playerMatches.length) * 100),
    };
  });

  return result;
}

function buildFullStatsFromData(data: MatchStore | Record<string, unknown> | null | undefined): PlayerStats[] {
  const allMatches: Match[] = [];

  Object.entries(data || {}).forEach(([gid, matches]) => {
    if (gid.startsWith("__") || !Array.isArray(matches)) return;
    (matches as StoredMatch[]).forEach((match) => allMatches.push({ ...match, _gameId: gid }));
  });

  return buildStats(allMatches);
}

function ProfileState({ message, actionLabel, onAction, loading = false }: ProfileStateProps) {
  return (
    <div className={`public-profile-state${loading ? " is-loading" : ""}`}>
      <div className="public-profile-state-copy">{message}</div>
      {actionLabel && onAction && (
        <button className="btnsec public-profile-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div className="public-profile-stat-pill" style={{ "--profile-accent": accent || "var(--tx)" } as CSSVars}>
      <span className="public-profile-stat-value">{value}</span>
      <span className="public-profile-stat-label">{label}</span>
    </div>
  );
}

function VersusBar({ labelA, labelB, winsA, winsB, colorA, colorB }: VersusBarProps) {
  const total = winsA + winsB;
  const pctA = total === 0 ? 50 : Math.round((winsA / total) * 100);

  return (
    <div
      className="public-profile-versus-bar"
      style={
        {
          "--versus-pct-a": `${pctA}%`,
          "--versus-pct-b": `${100 - pctA}%`,
          "--versus-color-a": colorA || PROFILE_FALLBACK_ACCENT,
          "--versus-color-b": colorB || PROFILE_VERSUS_ACCENT,
        } as CSSVars
      }
    >
      <div className="public-profile-versus-head">
        <span className="public-profile-versus-name">{labelA}</span>
        <span className="public-profile-versus-name">{labelB}</span>
      </div>
      <div className="public-profile-versus-track">
        <div className="public-profile-versus-fill public-profile-versus-fill--a" />
        <div className="public-profile-versus-fill public-profile-versus-fill--b" />
      </div>
      <div className="public-profile-versus-foot">
        <span className="public-profile-versus-record">
          {winsA}W · {pctA}%
        </span>
        <span className="public-profile-versus-record">
          {winsB}W · {100 - pctA}%
        </span>
      </div>
    </div>
  );
}

function GameStatRow({ gid, stats, t }: GameStatRowProps) {
  const game = GAMES[gid];

  return (
    <div
      className="public-profile-game-row"
      style={
        {
          "--profile-game-accent": game?.color || PROFILE_FALLBACK_ACCENT,
          "--profile-progress": `${stats.winrate}%`,
        } as CSSVars
      }
    >
      <div className="public-profile-game-copy">
        <div className="public-profile-game-title">{game ? getGameName(game.id, t) : gid}</div>
        <div className="public-profile-progress">
          <div className="public-profile-progress-track">
            <div className="public-profile-progress-fill" />
          </div>
          <span className="public-profile-progress-value">{stats.winrate}%</span>
        </div>
      </div>
      <div className="public-profile-game-summary">
        <div className="public-profile-game-wins">
          {stats.wins}
          <span className="public-profile-game-wins-suffix">W</span>
        </div>
        <div className="public-profile-game-meta">
          {stats.played} {t("profileMatchesShort")}
        </div>
      </div>
    </div>
  );
}

function VersusGameRow({ gid, shared, myW, theirW, myName, theirName, t }: VersusGameRowProps) {
  const game = GAMES[gid];

  return (
    <div className="public-profile-versus-row">
      <div className="public-profile-versus-row-head">
        <span className="public-profile-versus-row-title">{game ? getGameName(game.id, t) : gid}</span>
        <span className="public-profile-versus-row-meta">
          {shared} {t("profileMatchesShort")} {t("profileTogether")}
        </span>
      </div>
      <VersusBar
        labelA={myName.slice(0, 10)}
        labelB={theirName.slice(0, 10)}
        winsA={myW}
        winsB={theirW}
        colorA={game?.color || PROFILE_FALLBACK_ACCENT}
        colorB={PROFILE_VERSUS_ACCENT}
      />
    </div>
  );
}

function PublicProfilePage({
  uid,
  onBack,
  t,
  myData,
  myUser,
  onSignOut,
  onSignIn: _onSignIn,
  onOpenHistoryForPlayer,
}: PublicProfilePageProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"stats" | "versus">("stats");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);

  const isSelf = myUser?.uid === uid;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError("");
    setProfile(null);
    setPublicStats(null);
    setTab("stats");

    const isDevMode = typeof import.meta !== "undefined" && import.meta.env?.DEV;
    const testProfile = isDevMode && typeof window !== "undefined" ? window.__MP_TEST_PUBLIC_PROFILES__?.[uid] : null;
    if (testProfile) {
      setProfile(normalizePublicProfile(testProfile) as PublicProfile);
      setPublicStats(testProfile.publicStats || null);
      setLoading(false);
      return;
    }

    getDoc(doc(fbDb, "users", uid))
      .then((snap) => {
        if (!snap.exists()) {
          setError(t("profileNotFound"));
          setLoading(false);
          return;
        }

        const raw = snap.data() as Record<string, unknown> & { publicStats?: PublicStatsSummary | null };
        setProfile(normalizePublicProfile(raw) as PublicProfile);
        setPublicStats(raw.publicStats || null);
        setLoading(false);
      })
      .catch(() => {
        setError(t("profileLoadError"));
        setLoading(false);
      });
  }, [uid, t]);

  const myStats = useMemo(() => {
    if (!myData || !myUser?.displayName) return null;
    return buildFullStatsFromData(myData);
  }, [myData, myUser]);

  const myPerGame = useMemo(() => {
    if (!myData || !myUser?.displayName) return null;
    return buildPerGameStatsFromData(myData, myUser.displayName);
  }, [myData, myUser]);

  const versusGames = useMemo<VersusGameSummary[]>(() => {
    if (!myData || !myUser || !profile) return [];

    const myName = myUser.displayName || "";
    const theirName = profile.displayName || uid?.slice(0, 8) || "";
    if (!myName || !theirName || myName === theirName) return [];

    return Object.keys(GAMES).reduce<VersusGameSummary[]>((acc, gid) => {
      const matches = Array.isArray(myData[gid]) ? (myData[gid] as StoredMatch[]) : [];
      const shared = matches.filter((match) => {
        const names = (match.players || []).map((player) => getPlayerName(player));
        return names.includes(myName) && names.includes(theirName);
      });

      if (shared.length === 0) return acc;

      acc.push({
        gid,
        shared: shared.length,
        myW: shared.filter((match) => match.winner === myName).length,
        theirW: shared.filter((match) => match.winner === theirName).length,
        myName,
        theirName,
      });
      return acc;
    }, []);
  }, [myData, myUser, profile, uid]);

  if (!uid) {
    return <ProfileState message={t("profileNotFound")} actionLabel={t("back")} onAction={onBack} />;
  }

  if (loading) {
    return <ProfileState message={t("loading2")} loading />;
  }

  if (error) {
    return <ProfileState message={error} actionLabel={t("back")} onAction={onBack} />;
  }

  const displayName = profile?.displayName || uid.slice(0, 8) || "?";
  const photoURL = profile?.photoURL;
  const statsSource = isSelf ? myStats?.find((stat) => stat.name === myUser?.displayName) || null : null;
  const totalWins = isSelf ? statsSource?.wins ?? 0 : publicStats?.totalWins ?? 0;
  const totalPlayed = isSelf ? statsSource?.played ?? 0 : publicStats?.totalMatches ?? 0;
  const totalWinrate = isSelf ? statsSource?.winrate ?? 0 : publicStats?.winrate ?? 0;
  const maxStreak = isSelf ? statsSource?.streak.max ?? 0 : 0;
  const perGameStats = isSelf ? myPerGame || {} : publicStats?.byGame || {};
  const gamesWithStats = Object.keys(perGameStats);

  return (
    <div className="page page--flush-top public-profile-page" data-testid="public-profile-root">
      <div className="public-profile-hero">
        <div className="public-profile-avatar">
          {photoURL ? <img src={photoURL} alt="" className="public-profile-avatar-image" /> : displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="public-profile-meta">
          <h2 className="public-profile-title">{displayName.toUpperCase()}</h2>
          {isSelf && <div className="public-profile-eyebrow">{t("profileThisIsYou")}</div>}
          {isSelf && myUser?.email && <div className="public-profile-email">{myUser.email}</div>}
        </div>
      </div>

      {!isSelf && (
        <div className="public-profile-tabs" role="tablist" aria-label={t("profileTabs")}>
          {[
            { key: "stats" as const, label: t("stats") },
            { key: "versus" as const, label: t("profileVersus") },
          ].map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              aria-controls={`profile-tabpanel-${key}`}
              id={`profile-tab-${key}`}
              className={`public-profile-tab${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(tab === "stats" || isSelf) && (
        <div role={!isSelf ? "tabpanel" : undefined} id={!isSelf ? "profile-tabpanel-stats" : undefined} aria-labelledby={!isSelf ? "profile-tab-stats" : undefined}>
          <div>
            <div className="public-profile-section-label">{t("profileGlobalStats").toUpperCase()}</div>
            <div className="public-profile-stats-grid">
              <StatPill label={t("profileWins")} value={totalWins} accent="#52B788" />
              <StatPill label={t("profilePlayed")} value={totalPlayed} />
              <StatPill label={t("profileWinrate")} value={`${totalWinrate}%`} accent="#f59e0b" />
              {isSelf && <StatPill label={t("profileStreak")} value={maxStreak} accent="#e63946" />}
            </div>
          </div>

          {gamesWithStats.length > 0 ? (
            <>
              <div className="public-profile-section-label">{t("profileByGame").toUpperCase()}</div>
              <div className="public-profile-panel surface-card" data-testid="public-profile-games-panel">
                <div className="public-profile-game-list">
                  {gamesWithStats.map((gid) => (
                    <GameStatRow key={gid} gid={gid} stats={perGameStats[gid]} t={t} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="public-profile-empty">{t("profileNoStats")}</div>
          )}
        </div>
      )}

      {tab === "versus" && !isSelf && (
        <div role="tabpanel" id="profile-tabpanel-versus" aria-labelledby="profile-tab-versus">
        <div className="public-profile-panel surface-card public-profile-versus-panel" data-testid="public-profile-versus-panel">
          <div className="public-profile-section-label public-profile-section-label--tight">{t("profileHead2Head")}</div>
          {versusGames.length > 0 ? (
            <>
              <div className="public-profile-versus-summary">
                <StatPill
                  label={myUser?.displayName?.slice(0, 10) || "Tu"}
                  value={versusGames.reduce((sum, game) => sum + game.myW, 0)}
                  accent={PROFILE_FALLBACK_ACCENT}
                />
                <div className="public-profile-versus-marker">VS</div>
                <StatPill
                  label={displayName.slice(0, 10)}
                  value={versusGames.reduce((sum, game) => sum + game.theirW, 0)}
                  accent={PROFILE_VERSUS_ACCENT}
                />
              </div>
              {versusGames.map(({ gid, shared, myW, theirW, myName, theirName }) => (
                <VersusGameRow key={gid} gid={gid} shared={shared} myW={myW} theirW={theirW} myName={myName} theirName={theirName} t={t} />
              ))}
            </>
          ) : (
            <div className="public-profile-empty public-profile-empty--compact">{t("profileNoSharedMatches")}</div>
          )}
        </div>
        </div>
      )}

      {!isSelf && onOpenHistoryForPlayer && (
        <div className="public-profile-action-stack">
          <button
            className="public-profile-action-btn"
            onClick={() => onOpenHistoryForPlayer(displayName)}
          >
            {t("profileViewSharedHistory")}
          </button>
        </div>
      )}

      {isSelf && onSignOut && (
        <div className="public-profile-action-stack">
          <button
            className="public-profile-action-btn"
            style={{ "--profile-action-color": "#ff8c00", "--profile-action-border": "rgba(255,140,0,.4)" } as CSSVars}
            onClick={() => setConfirmSignOut(true)}
          >
            {t("signOut")}
          </button>
        </div>
      )}

      {confirmSignOut && (
        <ConfirmModal
          title={t("signOutConfirmTitle")}
          msg={t("signOutDataQuestion")}
          confirmLabel={t("signOutKeepData")}
          cancelLabel={t("signOutClearData")}
          onConfirm={() => {
            setConfirmSignOut(false);
            onSignOut?.(false);
          }}
          onCancel={() => {
            setConfirmSignOut(false);
            setConfirmClearData(true);
          }}
          onOverlayClick={() => setConfirmSignOut(false)}
        />
      )}
      {confirmClearData && (
        <ConfirmModal
          title={t("signOutClearDataTitle")}
          msg={t("signOutClearDataMsg")}
          confirmLabel={t("signOutClearData")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setConfirmClearData(false);
            onSignOut?.(true);
          }}
          onCancel={() => setConfirmClearData(false)}
        />
      )}
    </div>
  );
}

export default PublicProfilePage;
