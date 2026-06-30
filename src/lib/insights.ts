import type { Match } from "../types";

function getPlayerName(player: Match["players"][number] | string): string {
  return typeof player === "string" ? player : player.name;
}

export function buildInsights(matches: Match[]) {
  const wins = new Map<string, number>();
  const matchups = new Map<string, { names: string[]; count: number }>();

  matches.forEach((match) => {
    if (match.winner) wins.set(match.winner, (wins.get(match.winner) || 0) + 1);

    const names = (match.players || [])
      .map(getPlayerName)
      .filter(Boolean)
      .sort();
    if (names.length < 2) return;

    const key = names.join("|");
    matchups.set(key, { names, count: (matchups.get(key)?.count || 0) + 1 });
  });

  const topWinnerEntry = [...wins.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostPlayedMatchup = [...matchups.values()].sort((a, b) => b.count - a.count)[0] || null;

  return {
    topWinner: topWinnerEntry ? { name: topWinnerEntry[0], wins: topWinnerEntry[1] } : null,
    mostPlayedMatchup,
  };
}

export function buildAchievements(matches: Match[], playerName: string) {
  const played = matches.filter((match) =>
    (match.players || []).some((player) => getPlayerName(player) === playerName),
  ).length;
  const wins = matches.filter((match) => match.winner === playerName).length;

  return [
    wins >= 1 ? { id: "first-win", labelKey: "achievementFirstWin" } : null,
    played >= 10 ? { id: "ten-matches", labelKey: "achievementTenMatches" } : null,
    wins >= 10 ? { id: "ten-wins", labelKey: "achievementTenWins" } : null,
  ].filter(Boolean);
}
