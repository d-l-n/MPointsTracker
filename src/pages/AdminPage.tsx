import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { fbDb } from "../lib/firebase";
import { fmtDate } from "../lib/stats";
import { GAMES, getGameName } from "../data/games";
import ConfirmModal from "../components/ui/ConfirmModal";
import { normalizePublicProfile } from "../lib/publicData";
import type { GameDefinition, Match, PublicProfile, TranslationFn } from "../types";

const identity = (key: string) => key;

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;
type FeedbackType = "bug" | "suggestion" | "new_game" | "general";
type TimestampLike = { toDate: () => Date } | string | number | Date | null | undefined;

interface TranslatorProps {
  t?: TranslationFn;
}

interface ToastProps extends TranslatorProps {
  showToast: (msg: string, duration?: number) => void;
}

interface FeedbackDoc {
  id: string;
  type?: string;
  createdAt?: TimestampLike;
  read?: boolean;
  deleted?: boolean;
  message?: string;
  userName?: string;
  userEmail?: string;
}

interface StoredPlayer {
  name?: string;
}

interface StoredMatch extends Match {
  players?: Array<StoredPlayer | string>;
  winner?: string | null;
}

interface PrivateDoc {
  data?: string;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

interface UserSummary {
  uid: string;
  profile: PublicProfile;
  totalMatches: number;
  lastMatch: StoredMatch | null;
  perGame: Array<GameDefinition & { count: number }>;
  updatedAt: TimestampLike;
}

interface AggregatedStats {
  totalMatches: number;
  totalUsers: number;
  uniquePlayers: number;
  perGame: Record<string, number>;
  recentMatches: Array<StoredMatch & { _gameId: string; _uid: string }>;
}

interface AdminUserCardProps extends TranslatorProps {
  u: UserSummary;
  i: number;
  normTs: (value: TimestampLike) => string | null;
}

type AdminPageProps = ToastProps;

const FB_TYPE_META: Record<FeedbackType, { tKey: string; color: string }> = {
  bug: { tKey: "fbTypes.bug.name", color: "#E63946" },
  suggestion: { tKey: "fbTypes.suggestion.name", color: "#FF8C00" },
  new_game: { tKey: "fbTypes.new_game.name", color: "#9B59B6" },
  general: { tKey: "fbTypes.general.name", color: "#52B788" },
};

function withVars(style: CSSVars): CSSVars {
  return style;
}

function parsePrivateData(rawUserDoc: PrivateDoc = {}, rawUserdataDoc: PrivateDoc = {}): Record<string, unknown> {
  const payload =
    typeof rawUserdataDoc.data === "string"
      ? rawUserdataDoc.data
      : typeof rawUserDoc.data === "string"
        ? rawUserDoc.data
        : "{}";

  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toMillis(value: TimestampLike): number {
  if (!value) return 0;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return Number(value) || 0;
}

function isStoredMatchArray(value: unknown): value is StoredMatch[] {
  return Array.isArray(value);
}

function AdminReports({ showToast, t = identity }: ToastProps) {
  const [items, setItems] = useState<FeedbackDoc[] | null>(null);
  const [filter, setFilter] = useState<"all" | FeedbackType>("all");
  const [confirm, setConfirm] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const feedbackCollection = collection(fbDb, "feedback");
      const reportsQuery = filter === "all" ? feedbackCollection : query(feedbackCollection, where("type", "==", filter));
      const snap = await getDocs(reportsQuery);
      const all = snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<FeedbackDoc, "id">) }));
      all.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setItems(all);
    } catch {
      setItems([]);
      showToast(t("adminErrReports"));
    }
  }, [filter, showToast, t]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const markRead = async (id: string, current?: boolean) => {
    try {
      await updateDoc(doc(fbDb, "feedback", id), { read: !current });
      setItems((prev) => prev?.map((item) => (item.id === id ? { ...item, read: !current } : item)) ?? prev);
    } catch {
      showToast(t("adminErrUpdate"));
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await updateDoc(doc(fbDb, "feedback", id), { deleted: true });
      setItems((prev) => prev?.filter((item) => item.id !== id) ?? prev);
      showToast(t("adminReportDeleted"));
    } catch {
      showToast(t("adminErrDelete"));
    }
  };

  const fmtTs = (ts?: TimestampLike) => {
    if (!ts) return "—";
    return fmtDate(typeof ts === "object" && ts && "toDate" in ts ? ts.toDate().getTime() : ts);
  };

  if (items === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              background: "var(--glass)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--r)",
              padding: "18px 16px",
              opacity: 1 - index * 0.2,
            }}
          >
            <div style={{ height: 12, background: "var(--bo2)", borderRadius: 6, width: "40%", marginBottom: 10 }} />
            <div style={{ height: 10, background: "var(--bo2)", borderRadius: 6, width: "80%", marginBottom: 6 }} />
            <div style={{ height: 10, background: "var(--bo2)", borderRadius: 6, width: "60%" }} />
          </div>
        ))}
      </div>
    );
  }

  const visible = items.filter((item) => !item.deleted && (filter === "all" || item.type === filter));
  const counts: Record<string, number> = { all: items.filter((item) => !item.deleted).length };

  Object.keys(FB_TYPE_META).forEach((key) => {
    counts[key] = items.filter((item) => !item.deleted && item.type === key).length;
  });

  const unread = items.filter((item) => !item.deleted && !item.read).length;
  const filters = [
    { id: "all", label: `${t("all")} (${counts.all})`, color: "#888" },
    ...Object.entries(FB_TYPE_META).map(([id, meta]) => ({
      id,
      label: `${t(meta.tKey)} (${counts[id] || 0})`,
      color: meta.color,
    })),
  ];

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat" style={withVars({ "--gc": "#888" })}>
          <div className="admin-stat-v">{counts.all}</div>
          <div className="admin-stat-l">{t("total")}</div>
        </div>
        <div className="admin-stat" style={withVars({ "--gc": "#E63946" })}>
          <div className="admin-stat-v">{counts.bug || 0}</div>
          <div className="admin-stat-l">{t("bugs")}</div>
        </div>
        <div className="admin-stat" style={withVars({ "--gc": "#FF8C00" })}>
          <div className="admin-stat-v">{counts.suggestion || 0}</div>
          <div className="admin-stat-l">{t("ideas")}</div>
        </div>
        <div className="admin-stat" style={withVars({ "--gc": "#52B788" })}>
          <div className="admin-stat-v">{unread}</div>
          <div className="admin-stat-l">{t("unread")}</div>
        </div>
      </div>
      <div className="admin-filters">
        {filters.map((filterOption) => (
          <button
            key={filterOption.id}
            className={`admin-filter${filter === filterOption.id ? " active" : ""}`}
            style={withVars({ "--af-color": filterOption.color })}
            onClick={() => setFilter(filterOption.id as "all" | FeedbackType)}
          >
            {filterOption.label}
          </button>
        ))}
        <button className="admin-filter" style={{ marginLeft: "auto" }} onClick={() => void loadReports()}>
          {t("reload") || "Reload"}
        </button>
      </div>
      {visible.length === 0 ? (
        <div className="admin-empty">
          {t("noReports")}
          {filter !== "all" ? t("ofThisType") : ""}
        </div>
      ) : (
        <div className="admin-list">
          {visible.map((item) => {
            const meta = FB_TYPE_META[item.type as FeedbackType] || { tKey: item.type || "", color: "#888" };
            return (
              <div key={item.id} className={`admin-card${item.read ? " read" : ""}`}>
                <div className="admin-card-top">
                  <span className="admin-type-badge" style={{ background: meta.color }}>
                    {t(meta.tKey) || item.type}
                  </span>
                  {!item.read && (
                    <span
                      style={{ width: 7, height: 7, borderRadius: "50%", background: "#52b788", flexShrink: 0, marginTop: 5 }}
                    />
                  )}
                  <span className="admin-date">{fmtTs(item.createdAt)}</span>
                </div>
                <div className="admin-msg">{item.message}</div>
                <div className="admin-from">
                  {t("from")}: <strong>{item.userName || t("anonymous")}</strong>
                  {item.userEmail ? <> · {item.userEmail}</> : null}
                </div>
                <div className="admin-actions">
                  <button className="admin-action-btn" onClick={() => void markRead(item.id, item.read)}>
                    {item.read ? t("markUnread") : t("markRead")}
                  </button>
                  <button className="admin-action-btn danger" onClick={() => setConfirm(item.id)}>
                    {t("deleteReport")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {confirm ? (
        <ConfirmModal
          title={t("deleteReportTitle")}
          msg={t("deleteReportMsg")}
          onConfirm={() => {
            void deleteItem(confirm);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </>
  );
}

function AdminUsers({ showToast, t = identity }: ToastProps) {
  const [users, setUsers] = useState<UserSummary[] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersSnap, userdataSnap] = await Promise.all([
          getDocs(collection(fbDb, "users")),
          getDocs(collection(fbDb, "userdata")),
        ]);
        const userdataByUid = new Map(userdataSnap.docs.map((entry) => [entry.id, entry.data() as PrivateDoc]));

        const list = usersSnap.docs.map((entry) => {
          const raw = entry.data() as PrivateDoc;
          const privateDoc = userdataByUid.get(entry.id) || {};
          const profile = normalizePublicProfile(raw) as PublicProfile;
          const parsed = parsePrivateData(raw, privateDoc);

          const totalMatches = Object.entries(parsed)
            .filter(([key]) => !key.startsWith("__"))
            .reduce((sum, [, value]) => sum + (Array.isArray(value) ? value.length : 0), 0);

          const allMatches = Object.entries(parsed)
            .filter(([key]) => !key.startsWith("__"))
            .flatMap(([, value]) => (isStoredMatchArray(value) ? value : []));

          const lastMatch = allMatches.length
            ? allMatches.reduce((latest, current) =>
                new Date(latest.date).getTime() > new Date(current.date).getTime() ? latest : current,
              )
            : null;

          const perGame = Object.entries(GAMES)
            .map(([id, game]) => ({
              ...game,
              count: isStoredMatchArray(parsed[id]) ? parsed[id].length : 0,
            }))
            .filter((game) => game.count > 0);

          return {
            uid: entry.id,
            profile,
            totalMatches,
            lastMatch,
            perGame,
            updatedAt: privateDoc.updatedAt ?? raw.updatedAt ?? null,
          };
        });

        list.sort((a, b) => b.totalMatches - a.totalMatches);
        setUsers(list);
      } catch {
        setUsers([]);
        showToast(t("adminErrUsers"));
      }
    };

    void load();
  }, [showToast, t]);

  const normTs = (ts: TimestampLike) => {
    if (!ts) return null;
    if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
      return ts.toDate().toISOString();
    }
    const date = new Date(ts);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  if (users === null) return <div className="admin-loading">{t("loadingUsers")}</div>;
  if (users.length === 0) return <div className="admin-empty">{t("noUsersRegistered")}</div>;

  return (
    <div>
      <div style={{ fontSize: ".72rem", color: "var(--tx2)", marginBottom: 14, fontWeight: 600 }}>
        {users.length} {t("adminTabUsers").toLowerCase()}
        {t("adminRegistered")}
      </div>
      {users.map((user, index) => (
        <AdminUserCard key={user.uid} u={user} i={index} normTs={normTs} t={t} />
      ))}
    </div>
  );
}

function AdminUserCard({ u, i, normTs, t = identity }: AdminUserCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (u.profile.displayName || u.profile.email || "?")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const lastLoginStr = normTs(u.profile.lastLogin);

  return (
    <div className="admin-user-card" style={{ animationDelay: `${i * 0.05}s` }}>
      {u.profile.photoURL && !imgFailed ? (
        <img
          src={u.profile.photoURL}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          alt={`${t("adminAvatarPrefix")} ${u.profile.displayName || u.profile.email || t("playerN")}`}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: "1.5px solid var(--bo2)",
          }}
        />
      ) : (
        <div className="admin-user-avatar">{initials || "👤"}</div>
      )}
      <div className="admin-user-info">
        <div className="admin-user-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {u.profile.displayName || (
            <span style={{ color: "var(--tx3)", fontStyle: "italic", fontWeight: 400 }}>{t("noNamePlaceholder")}</span>
          )}
          {!u.profile.displayName ? (
            <span
              style={{
                fontSize: ".58rem",
                padding: "1px 6px",
                borderRadius: 10,
                background: "rgba(255,140,0,.15)",
                color: "#FF8C00",
                border: "1px solid rgba(255,140,0,.3)",
                fontWeight: 700,
                fontStyle: "normal",
              }}
            >
              {t("noProfile")}
            </span>
          ) : null}
        </div>
        <div className="admin-user-email">
          {u.profile.email || <span style={{ color: "var(--tx3)", fontSize: ".68rem" }}>UID: {u.uid.slice(0, 24)}...</span>}
        </div>
        <div className="admin-user-meta">
          {u.perGame.length > 0 ? u.perGame.map((game) => `${getGameName(game.id, t)}: ${game.count}`).join(" · ") : t("noMatchesShort")}
        </div>
        <div className="admin-user-meta">
          {t("adminLastLogin")} {lastLoginStr ? fmtDate(lastLoginStr) : "—"}
          {u.lastMatch?.winner ? ` · ${t("adminLastWinner")} ${u.lastMatch.winner}` : ""}
        </div>
      </div>
      <div className="admin-user-stats">
        <div className="admin-user-matches">{u.totalMatches}</div>
        <div className="admin-user-matches-label">{t("matchesPlayed")}</div>
      </div>
    </div>
  );
}

function AdminStats({ showToast, t = identity }: ToastProps) {
  const [stats, setStats] = useState<AggregatedStats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersSnap, userdataSnap] = await Promise.all([
          getDocs(collection(fbDb, "users")),
          getDocs(collection(fbDb, "userdata")),
        ]);

        let totalMatches = 0;
        const perGame = Object.fromEntries(Object.keys(GAMES).map((key) => [key, 0])) as Record<string, number>;
        const allPlayers = new Set<string>();
        const recentMatches: Array<StoredMatch & { _gameId: string; _uid: string }> = [];
        const userdataByUid = new Map(userdataSnap.docs.map((entry) => [entry.id, entry.data() as PrivateDoc]));

        usersSnap.docs.forEach((entry) => {
          const raw = entry.data() as PrivateDoc;
          const parsed = parsePrivateData(raw, userdataByUid.get(entry.id));

          Object.entries(parsed).forEach(([key, value]) => {
            if (key.startsWith("__") || !isStoredMatchArray(value)) return;
            totalMatches += value.length;
            if (perGame[key] !== undefined) perGame[key] += value.length;

            value.forEach((match) => {
              (match.players || []).forEach((player) => {
                const name = typeof player === "string" ? player : player?.name;
                if (name) allPlayers.add(name);
              });
              recentMatches.push({ ...match, _gameId: key, _uid: entry.id });
            });
          });
        });

        recentMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setStats({
          totalMatches,
          totalUsers: usersSnap.docs.length,
          uniquePlayers: allPlayers.size,
          perGame,
          recentMatches: recentMatches.slice(0, 15),
        });
      } catch {
        setStats({
          totalMatches: 0,
          totalUsers: 0,
          uniquePlayers: 0,
          perGame: {},
          recentMatches: [],
        });
        showToast(t("adminErrStats"));
      }
    };

    void load();
  }, [showToast, t]);

  if (stats === null) return <div className="admin-loading">{t("loadingStats")}</div>;

  const maxGame = Math.max(1, ...Object.values(stats.perGame || {}));

  return (
    <div>
      <div className="gstats-grid">
        <div className="gstats-card" style={withVars({ "--gc": "#006D77" })}>
          <div className="gstats-v">{stats.totalMatches ?? 0}</div>
          <div className="gstats-l">{t("totalMatchesAdmin")}</div>
        </div>
        <div className="gstats-card" style={withVars({ "--gc": "#52B788" })}>
          <div className="gstats-v">{stats.totalUsers ?? 0}</div>
          <div className="gstats-l">{t("adminTabUsers")}</div>
        </div>
        <div className="gstats-card" style={withVars({ "--gc": "#FF8C00" })}>
          <div className="gstats-v">{stats.uniquePlayers ?? 0}</div>
          <div className="gstats-l">{t("uniquePlayers")}</div>
        </div>
        <div className="gstats-card" style={withVars({ "--gc": "#E63946" })}>
          <div className="gstats-v">{stats.recentMatches?.length ?? 0}</div>
          <div className="gstats-l">{t("adminRecentTop")}</div>
        </div>
      </div>

      <span className="flbl" style={{ display: "block", marginBottom: 10 }}>
        {t("matchesPerGame")}
      </span>
      {Object.entries(stats.perGame || {}).map(([id, count]) => {
        const game = GAMES[id as keyof typeof GAMES];
        if (!game) return null;
        return (
          <div key={id} className="gstats-game-row" style={withVars({ "--gc": game.color })}>
            <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--tx)", minWidth: 90 }}>{getGameName(game.id, t)}</span>
            <div className="gstats-game-bar-wrap">
              <div className="gstats-game-bar" style={{ width: `${(count / maxGame) * 100}%`, background: game.color }} />
            </div>
            <span className="gstats-game-count">{count}</span>
          </div>
        );
      })}

      {(stats.recentMatches?.length ?? 0) > 0 ? (
        <>
          <span className="flbl" style={{ display: "block", marginTop: 18, marginBottom: 10 }}>
            {t("recentActivity")}
          </span>
          {stats.recentMatches.map((match, index) => {
            const game = GAMES[match._gameId as keyof typeof GAMES];
            return (
              <div
                key={`${match.id || match._gameId}-${index}`}
                className="recent-match-card"
                style={withVars({ "--gc": game?.color || "#888", animationDelay: `${index * 0.04}s` })}
              >
                <div className="recent-match-top">
                  <span className="recent-match-game" style={{ color: game?.color }}>
                    {game ? getGameName(game.id, t) : ""}
                  </span>
                  <span className="recent-match-date">{fmtDate(match.date)}</span>
                </div>
                <div className="recent-match-players">
                  {(match.players || []).map((player, playerIndex) => {
                    const name = typeof player === "string" ? player : player?.name || "";
                    return (
                      <span key={playerIndex} className={`recent-match-player${name === match.winner ? " winner" : ""}`}>
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      ) : null}
    </div>
  );
}

function AdminPage({ showToast, t = identity }: AdminPageProps) {
  const [adminTab, setAdminTab] = useState<"reports" | "users" | "stats">("reports");
  const ADMIN_TAB_IDS = ["reports", "users", "stats"] as const;

  const handleAdminTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = ADMIN_TAB_IDS.indexOf(adminTab);
    let next: typeof ADMIN_TAB_IDS[number] | null = null;
    if (e.key === "ArrowRight") next = ADMIN_TAB_IDS[(idx + 1) % ADMIN_TAB_IDS.length];
    else if (e.key === "ArrowLeft") next = ADMIN_TAB_IDS[(idx - 1 + ADMIN_TAB_IDS.length) % ADMIN_TAB_IDS.length];
    else if (e.key === "Home") next = ADMIN_TAB_IDS[0];
    else if (e.key === "End") next = ADMIN_TAB_IDS[ADMIN_TAB_IDS.length - 1];
    if (next) { e.preventDefault(); setAdminTab(next); }
  }, [adminTab]);

  return (
    <div className="admin-page">
      <div className="admin-tabs" role="tablist" aria-label="Admin tabs" onKeyDown={handleAdminTabKeyDown}>
        {[
          ["reports", t("adminTabReports")],
          ["users", t("adminTabUsers")],
          ["stats", t("adminTabStats")],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={adminTab === id}
            aria-controls={`admin-tabpanel-${id}`}
            id={`admin-tab-${id}`}
            className={`admin-tab${adminTab === id ? " active" : ""}`}
            onClick={() => setAdminTab(id as "reports" | "users" | "stats")}
          >
            {label}
          </button>
        ))}
      </div>
      {adminTab === "reports" ? <div role="tabpanel" id="admin-tabpanel-reports" aria-labelledby="admin-tab-reports"><AdminReports showToast={showToast} t={t} /></div> : null}
      {adminTab === "users" ? <div role="tabpanel" id="admin-tabpanel-users" aria-labelledby="admin-tab-users"><AdminUsers showToast={showToast} t={t} /></div> : null}
      {adminTab === "stats" ? <div role="tabpanel" id="admin-tabpanel-stats" aria-labelledby="admin-tab-stats"><AdminStats showToast={showToast} t={t} /></div> : null}
    </div>
  );
}

export default AdminPage;
