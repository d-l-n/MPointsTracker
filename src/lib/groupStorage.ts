import type { PlayerGroup } from "../types";

const LAST_GROUP_KEY = "bgt_last_group_v1";

type GroupStorageMap = Record<string, PlayerGroup>;

function loadStoredGroups(): GroupStorageMap {
  try {
    return JSON.parse(localStorage.getItem(LAST_GROUP_KEY) || "{}") as GroupStorageMap;
  } catch {
    return {};
  }
}

function getLastGroup(gameId: string): PlayerGroup | null {
  return loadStoredGroups()[gameId] || null;
}

function saveLastGroup(gameId: string, group: PlayerGroup | null | undefined): void {
  if (!gameId || !group) return;

  try {
    const allGroups = loadStoredGroups();
    allGroups[gameId] = { name: group.name, players: group.players };
    localStorage.setItem(LAST_GROUP_KEY, JSON.stringify(allGroups));
  } catch {
    // storage unavailable
  }
}

function removeLastGroup(gameId: string): void {
  if (!gameId) return;

  try {
    const allGroups = loadStoredGroups();
    delete allGroups[gameId];
    localStorage.setItem(LAST_GROUP_KEY, JSON.stringify(allGroups));
  } catch {
    // storage unavailable
  }
}

export { getLastGroup, saveLastGroup, removeLastGroup };
