import type { Match, PlayerStats } from "../types";

const LOCALE_MAP: Record<string, string> = { es: "es-AR", en: "en-US", de: "de-DE", zh: "zh-CN", ja: "ja-JP" };

let fmtDateLang = "es";

function setFmtDateLang(lang: string): void {
  fmtDateLang = lang;
}

const TODAY_LABELS: Record<string, [string, string]> = {
  es: ["hoy", "ayer"],
  en: ["today", "yesterday"],
  de: ["heute", "gestern"],
  zh: ["今天", "昨天"],
  ja: ["今日", "昨日"],
};

function fmtDate(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const locale = LOCALE_MAP[fmtDateLang] || LOCALE_MAP.en;
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  const timeStr = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const labels = TODAY_LABELS[fmtDateLang] || TODAY_LABELS.en;
  if (diffDays === 0) return `${labels[0]}, ${timeStr}`;
  if (diffDays === 1) return `${labels[1]}, ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString(locale, { weekday: "short" })}, ${timeStr}`;
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildStats(matches: Match[]): PlayerStats[] {
  const wins: Record<string, number> = {};
  const played: Record<string, number> = {};
  const streaks: Record<string, { current: number; max: number }> = {};
  const sorted = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sorted.forEach((match) => {
    (match.players || []).forEach((player) => {
      played[player.name] = (played[player.name] || 0) + 1;
    });
    if (match.winner) wins[match.winner] = (wins[match.winner] || 0) + 1;
  });

  const playerNames = Object.keys(played);
  playerNames.forEach((name) => {
    let max = 0;
    let currentRun = 0;
    sorted.forEach((match) => {
      const participated = (match.players || []).some((player) => player.name === name);
      if (!participated) return;
      if (match.winner === name) {
        currentRun += 1;
        if (currentRun > max) max = currentRun;
      } else {
        currentRun = 0;
      }
    });
    streaks[name] = { current: currentRun, max };
  });

  return playerNames
    .map((name) => ({
      name,
      wins: wins[name] || 0,
      played: played[name],
      winrate: Math.round(((wins[name] || 0) / played[name]) * 100),
      streak: streaks[name],
    }))
    .sort((a, b) => b.wins - a.wins || b.winrate - a.winrate);
}

function buildH2H(matches: Match[], nameA: string, nameB: string) {
  if (!nameA || !nameB || nameA === nameB) return null;

  const shared = matches
    .filter((match) => {
      const names = (match.players || []).map((player) => player.name);
      return names.includes(nameA) && names.includes(nameB);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!shared.length) {
    return { shared: [], winsA: 0, winsB: 0, draws: 0, streakA: 0, streakB: 0, byGame: {} };
  }

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let streakA = 0;
  let streakB = 0;
  let currentA = 0;
  let currentB = 0;
  const byGame: Record<string, { winsA: number; winsB: number; played: number }> = {};

  shared.forEach((match) => {
    const gameId = match._gameId || match.game || "unknown";
    if (!byGame[gameId]) byGame[gameId] = { winsA: 0, winsB: 0, played: 0 };
    byGame[gameId].played += 1;

    if (match.winner === nameA) {
      winsA += 1;
      currentA += 1;
      currentB = 0;
      if (currentA > streakA) streakA = currentA;
      byGame[gameId].winsA += 1;
    } else if (match.winner === nameB) {
      winsB += 1;
      currentB += 1;
      currentA = 0;
      if (currentB > streakB) streakB = currentB;
      byGame[gameId].winsB += 1;
    } else {
      draws += 1;
      currentA = 0;
      currentB = 0;
    }
  });

  let currentStreakHolder: string | null = null;
  let currentStreakCount = 0;
  for (let index = shared.length - 1; index >= 0; index -= 1) {
    const winner = shared[index].winner;
    if (!winner) break;
    if (currentStreakHolder === null) {
      currentStreakHolder = winner;
      currentStreakCount = 1;
    } else if (winner === currentStreakHolder) {
      currentStreakCount += 1;
    } else {
      break;
    }
  }

  return { shared, winsA, winsB, draws, streakA, streakB, byGame, currentStreakHolder, currentStreakCount };
}

function getAllPastPlayerNames(data: Record<string, Match[] | unknown>): string[] {
  const names = new Set<string>();
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith("__") || !Array.isArray(value)) return;
    value.forEach((match) => {
      (match.players || []).forEach((player: Match["players"][number]) => {
        if (player.name?.trim()) names.add(player.name.trim());
      });
    });
  });
  return [...names].sort();
}

export { setFmtDateLang, fmtDate, buildStats, buildH2H, getAllPastPlayerNames };
