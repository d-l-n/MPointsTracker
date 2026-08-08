import { useState, useEffect, useMemo, useCallback, type CSSProperties, type KeyboardEvent } from "react";
import { buildStats } from "../lib/stats";
import { GAMES, getGame, getGameName } from "../data/games";
import type { GameDefinition } from "../types";
import { fbDb } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import HeadToHeadPage from "./HeadToHeadPage";
import { useAppContext } from "../context/AppContext";
import type { AppContextValue, Match, PlayerGroup, PlayerStats, TranslationFn } from "../types";

const MEDALS   = ["1","2","3"];
const MEDAL_CLS = ["p1","p2","p3"];
const WINS_CLS  = ["","silver","bronze"];

// Build name→uid from playerGroups (local, instant)
function buildNameUidMapFromGroups(playerGroups: PlayerGroup[]) {
  const map: Record<string, string> = {};
  (playerGroups || []).forEach((g) => {
    (g.players || []).forEach((p) => {
      if (typeof p === "object" && p.uid && p.name) {
        map[p.name.trim()] = p.uid;
      }
    });
  });
  return map;
}

// Fetch UIDs from Firestore for names not yet resolved
async function fetchUidsForNames(names: string[]) {
  const result: Record<string, string> = {};
  if (!names.length) return result;
  try {
    // Query users collection by displayName — batch up to 10 at a time.
    // Profiles store displayName at the root of users/{uid} (see saveUserProfile),
    // so the field is queried/read at root level, not under profile.
    const chunks = [];
    for (let i = 0; i < names.length; i += 10) chunks.push(names.slice(i, i + 10));
    for (const chunk of chunks) {
      const snap = await getDocs(
        query(collection(fbDb, "users"), where("displayName", "in", chunk))
      );
      snap.forEach((doc) => {
        const name = doc.data()?.displayName;
        if (name) result[name] = doc.id;
      });
    }
  } catch (e) {
    // Firestore unavailable or rules block — fail silently
    console.warn("[ChampsPage] uid lookup failed:", e);
  }
  return result;
}

// ── PlayerChip — defined OUTSIDE ChampsPage to avoid recreation on each render
interface PlayerChipProps {
  name: string;
  isWinner?: boolean;
  gameColor?: string;
  nameUidMap: Record<string, string>;
  onViewProfile?: ((uid: string) => void) | null;
}

function PlayerChip({ name, isWinner, gameColor, nameUidMap, onViewProfile }: PlayerChipProps) {
  const uid = nameUidMap[name];
  const clickable = uid && onViewProfile;
  const gc = gameColor || "#888";
  const handleKey = clickable
    ? (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onViewProfile(uid);
        }
      }
    : undefined;
  return (
    <span
      onClick={clickable ? (e) => { e.stopPropagation(); onViewProfile(uid); } : undefined}
      onKeyDown={handleKey}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={{
        fontSize: ".72rem", padding: "2px 9px", borderRadius: 12,
        background: isWinner ? `color-mix(in srgb,${gc} 20%,var(--bg3))` : "var(--bg3)",
        border: isWinner ? `1.5px solid ${gc}` : "1px solid var(--bo2)",
        color: isWinner ? "var(--tx)" : "var(--tx2)",
        fontWeight: isWinner ? 800 : 400,
        lineHeight: "1.5", whiteSpace: "nowrap",
        cursor: clickable ? "pointer" : "default",
        display: "inline-flex", alignItems: "center", gap: 3,
      }}
    >
      {name}
    </span>
  );
}

interface ChampsMatch extends Match {
  _gameId?: string;
}

interface ChampsPageProps {
  onViewProfile?: (uid: string) => void;
}

function ChampsPage({ onViewProfile }: ChampsPageProps) {
  const { data = {}, t = ((k: string) => k) as TranslationFn, playerGroups = [] } = useAppContext() as AppContextValue;
  const localMap = useMemo(() => buildNameUidMapFromGroups(playerGroups), [playerGroups]);
  const [nameUidMap, setNameUidMap] = useState(localMap);

  const allMatches = useMemo(() => Object.entries(data)
    .filter(([k]) => !k.startsWith("__"))
    .flatMap(([gameId, arr]) => Array.isArray(arr) ? (arr as ChampsMatch[]).map((m) => ({ ...m, _gameId: gameId })) : [])
  , [data]);

  // Fix #6 — memoize globalStats to avoid re-running buildStats on every render
  const globalStats = useMemo(() => buildStats(allMatches as Match[]).slice(0, 3), [allMatches]);

  // Get all unique player names across all matches
  const allPlayerNames = useMemo(() => {
    const names = new Set<string>();
    allMatches.forEach((m) => (m.players || []).forEach((p) => {
      const n = typeof p === "string" ? p : p.name;
      if (n?.trim()) names.add(n.trim());
    }));
    return [...names];
  }, [allMatches]);

  // Fix #6 — memoize per-game stats map to avoid 16x buildStats calls per render
  const statsByGame = useMemo(() => {
    const map: Record<string, PlayerStats[]> = {};
    Object.keys(GAMES).forEach((id) => {
      const ms = Array.isArray(data[id]) ? data[id] as Match[] : [];
      map[id] = buildStats(ms).slice(0, 3);
    });
    return map;
  }, [data]);

  const gamesWithMatches = useMemo(() =>
    ["uno","uno_no_mercy","uno_flip","uno_dos","truco","chinchon","chancho","chin","esquinados","rummy","burako","poker","blackjack","generala","ajedrez","racha_perdida","basta_dym","monopoly","life"]
      .map(id => getGame(id))
      .filter((g): g is GameDefinition => Boolean(g))
      .filter(game => {
        const matches = data[game.id];
        return Array.isArray(matches) ? matches.length > 0 : false;
      })
  , [data]);

  // Enrich with Firestore lookups for names not in playerGroups
  useEffect(() => {
    if (!onViewProfile) return; // no point fetching if no handler
    const missing = allPlayerNames.filter(n => !localMap[n]);
    if (!missing.length) { setNameUidMap(localMap); return; }
    fetchUidsForNames(missing).then(fetched => {
      setNameUidMap({ ...fetched, ...localMap }); // localMap wins over fetched
    });
  }, [allPlayerNames, localMap, onViewProfile]);

  // Stable handler to avoid prop recreation in PlayerChip
  const handleViewProfile = useCallback((uid: string) => onViewProfile?.(uid), [onViewProfile]);

  return (
    <div className="page">
      {/* ── Top global ── */}
      <div className="champ-section">
        <h2 className="champ-sec-title">{t("globalTop")}</h2>
        {globalStats.length === 0
          ? <div className="no-champs">{t("noMatchesYet")}</div>
          : <div className="podium">
              {globalStats.map((p, i) => {
                const uid = nameUidMap[p.name];
                const clickable = uid && onViewProfile;
                return (
                  <div key={p.name}
                    className={`podium-row ${MEDAL_CLS[i] || ""}`}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => handleViewProfile(uid) : undefined}
                    onKeyDown={clickable ? (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleViewProfile(uid); } } : undefined}
                    style={{ cursor: clickable ? "pointer" : "default", transition: "opacity .15s" }}
                  >
                    <span className="medal">{MEDALS[i] || i + 1}</span>
                    <div className="pod-info">
                      <div className="pod-name">
                        {p.name}
                      </div>
                      <div className="pod-sub">{p.winrate}% {t("winrateShort")} · {p.played} {t("matchesPlayed")}</div>
                      {p.streak?.current >= 2 && <span className="streak-badge">{t("streak")} {p.streak.current}</span>}
                    </div>
                    <div className={`pod-wins ${WINS_CLS[i] || ""}`}>{p.wins}</div>
                  </div>
                );
              })}
            </div>
        }
      </div>

      {/* ── Head-to-Head integrado ── */}
      <HeadToHeadPage data={data} t={t} embedded />

      {/* ── Por juego ── */}
      <div className="champ-section">
        <h2 className="champ-sec-title">{t("perGame")}</h2>
        {gamesWithMatches.length === 0
          ? <div className="no-champs">{t("noMatchesYet")}</div>
          : <div className="champ-by-game">
              {gamesWithMatches.map(game => {
                const ms    = Array.isArray(data[game.id]) ? (data[game.id] as Match[]) : [];
                const stats = statsByGame[game.id] || [];
                return (
                  <div key={game.id} className="cbg-card" data-testid={`champ-game-${game.id}`} style={{ "--gc": game.color } as CSSProperties}>
                  <div className="cbg-hdr">
                    <span className="cbg-name" style={{ color: game.color }}>{getGameName(game.id, t)}</span>
                    <span style={{ fontSize: ".68rem", color: "var(--tx3)", marginLeft: "auto" }}>{ms.length} {t("matchesPlayed")}</span>
                  </div>
                  <div className="cbg-rows">
                    {stats.map((p, i) => {
                      const uid = nameUidMap[p.name];
                      const clickable = uid && onViewProfile;
                      return (
                        <div key={p.name} className="cbg-row"
                          role={clickable ? "button" : undefined}
                          tabIndex={clickable ? 0 : undefined}
                          onClick={clickable ? () => handleViewProfile(uid) : undefined}
                          onKeyDown={clickable ? (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleViewProfile(uid); } } : undefined}
                          style={{ cursor: clickable ? "pointer" : "default", transition: "background .15s" }}
                          onMouseEnter={e => { if (clickable) e.currentTarget.style.background = "var(--ibg)"; }}
                          onMouseLeave={e => { if (clickable) e.currentTarget.style.background = ""; }}
                        >
                          <span className={`cbg-rank${i === 0 ? " t" : ""}`}>{MEDALS[i] || i + 1}</span>
                          <div style={{ flex: 1 }}>
                            <div className="cbg-pname">{p.name}</div>
                            <div className="cbg-wr">{p.winrate}% {t("winrateShort")} · {p.played} {t("matchesPlayed")}</div>
                          </div>
                          <span className="cbg-wins">{p.wins}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

export default ChampsPage;
