import type { LegacyUserDoc, Match, MatchStore, PublicProfile, PublicStatsSummary } from "../types";

type PublicMatchPlayer = string | { name?: string | null };

interface PublicMatch extends Omit<Match, "players"> {
  players?: PublicMatchPlayer[];
}

export function normalizePublicProfile(raw: LegacyUserDoc = {}): PublicProfile {
  return {
    displayName: (raw.displayName as string | null | undefined) ?? raw.profile?.displayName ?? null,
    photoURL: (raw.photoURL as string | null | undefined) ?? raw.profile?.photoURL ?? null,
    lastLogin: (raw.lastLogin as number | null | undefined) ?? raw.profile?.lastLogin ?? null,
    email: raw.profile?.email ?? null,
  };
}

export function computePublicStats(
  data: MatchStore | Record<string, unknown> | null | undefined,
  playerName: string,
): PublicStatsSummary | null {
  if (!playerName) return null;

  let totalMatches = 0;
  let totalWins = 0;
  const byGame: PublicStatsSummary["byGame"] = {};

  Object.entries(data || {}).forEach(([gameId, matches]) => {
    if (gameId.startsWith("__") || !Array.isArray(matches)) return;

    const playerMatches = (matches as PublicMatch[]).filter((match) =>
      (match.players || []).some((player) => (typeof player === "string" ? player : player.name) === playerName),
    );

    if (playerMatches.length === 0) return;

    const wins = playerMatches.filter((match) => match.winner === playerName).length;
    totalMatches += playerMatches.length;
    totalWins += wins;
    byGame[gameId] = {
      played: playerMatches.length,
      wins,
      winrate: Math.round((wins / playerMatches.length) * 100),
    };
  });

  return {
    totalMatches,
    totalWins,
    winrate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
    byGame,
  };
}
