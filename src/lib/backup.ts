import { GAMES } from "../data/games";
import type { MatchStore } from "../types";

type BackupResult =
  | { ok: true; data: MatchStore; matchCount: number }
  | { ok: false; error: "invalid-json" | "invalid-shape" | "empty" };

export function parseBackupJson(text: string): BackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid-json" };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "invalid-shape" };
  }

  const data: MatchStore = {};
  let matchCount = 0;
  Object.keys(GAMES).forEach((gameId) => {
    const value = (raw as Record<string, unknown>)[gameId];
    if (!Array.isArray(value)) return;
    data[gameId] = value;
    matchCount += value.length;
  });

  return matchCount > 0 ? { ok: true, data, matchCount } : { ok: false, error: "empty" };
}
