import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { load, persist } from "../lib/storage";
import { getAllPastPlayerNames } from "../lib/stats";
import { saveDataToCloud, savePublicStats } from "../services/userService";
import type { AppStorageData, Match, MatchStore, PublicStatsSummary, TranslationFn } from "../types";

function computePublicStats(
  data: Record<string, unknown> | null | undefined,
  playerName: string,
): PublicStatsSummary | null {
  if (!playerName) return null;
  let totalMatches = 0;
  let totalWins = 0;
  const byGame: PublicStatsSummary["byGame"] = {};
  Object.entries(data || {}).forEach(([gameId, matches]) => {
    if (gameId.startsWith("__") || !Array.isArray(matches)) return;
    const playerMatches = (matches as Match[]).filter((m) =>
      (m.players || []).some((p) => (typeof p === "string" ? p : p.name) === playerName),
    );
    if (!playerMatches.length) return;
    const wins = playerMatches.filter((m) => m.winner === playerName).length;
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

interface CloudUserLike {
  uid: string;
  displayName?: string | null;
}

interface UseMatchesOptions {
  userRef: { current: CloudUserLike | null | undefined };
  dark: boolean;
  showToast: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

type StoredMatch = Match & Record<string, unknown>;

export function useMatches({ userRef, dark, showToast, t }: UseMatchesOptions) {
  const [data, setData] = useState<MatchStore>(() => load() as MatchStore);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ok = persist({ ...data, __theme: dark } as AppStorageData);
    if (ok === false) showToast(t("localStorageNoSpace"));
  }, [data, dark]); // eslint-disable-line react-hooks/exhaustive-deps -- showToast excluded intentionally

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const user = userRef?.current;
      if (!user) {
        setSyncError(false);
        return;
      }
      try {
        setSyncing(true);
        const nextData = { ...data, __theme: dark } as AppStorageData;
        await saveDataToCloud(user.uid, nextData);
        setSyncError(false);
        const stats = computePublicStats(nextData, user.displayName ?? null);
        if (stats) {
          try {
            await savePublicStats(user.uid, stats);
          } catch (error) {
            console.warn("[useMatches] public stats sync failed:", error);
          }
        }
      } catch {
        setSyncError(true);
      } finally {
        setSyncing(false);
      }
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, dark]); // eslint-disable-line react-hooks/exhaustive-deps

  const getMatches = useCallback(
    (id: string): StoredMatch[] => (Array.isArray(data[id]) ? (data[id] as StoredMatch[]) : []),
    [data],
  );

  const addMatch = useCallback(
    (gid: string, match: StoredMatch) => {
      const user = userRef?.current;
      setData((previousData) => ({
        ...previousData,
        [gid]: [
          ...(Array.isArray(previousData[gid]) ? (previousData[gid] as StoredMatch[]) : []),
          { ...match, game: gid },
        ],
      }));
      showToast(user ? t("savedCloud") : t("savedLocal"));
    },
    [userRef, showToast, t],
  );

  const delMatch = useCallback(
    (gid: string, mid: string) => {
      setData((previousData) => ({
        ...previousData,
        [gid]: (Array.isArray(previousData[gid]) ? (previousData[gid] as StoredMatch[]) : []).filter(
          (match) => match.id !== mid,
        ),
      }));
      showToast(t("deleted"));
    },
    [showToast, t],
  );

  const editMatch = useCallback(
    (gid: string, updated: StoredMatch) => {
      setData((previousData) => ({
        ...previousData,
        [gid]: (Array.isArray(previousData[gid]) ? (previousData[gid] as StoredMatch[]) : []).map((match) =>
          match.id === updated.id ? updated : match,
        ),
      }));
      showToast(t("matchUpdated"));
    },
    [showToast, t],
  );

  const importData = useCallback((nextData: MatchStore) => {
    setData(nextData);
  }, []);

  const mergeSharedMatches = useCallback((toMerge: Record<string, StoredMatch[]>) => {
    setData((previousData) => {
      const nextData: MatchStore = { ...previousData };
      Object.entries(toMerge).forEach(([gid, newMatches]) => {
        const existing = Array.isArray(previousData[gid]) ? (previousData[gid] as StoredMatch[]) : [];
        const existingIds = new Set(existing.map((match) => match.id));
        const filtered = newMatches.filter((match) => !existingIds.has(match.id));
        if (filtered.length > 0) {
          nextData[gid] = [...existing, ...filtered];
        }
      });
      return nextData;
    });
  }, []);

  const mergeCloudData = useCallback((cloudData: Record<string, unknown>) => {
    setData((localData) => {
      const merged = {
        ...localData,
        ...cloudData,
        __theme: localData.__theme ?? (cloudData.__theme as boolean | undefined),
      };
      return merged as MatchStore;
    });
  }, []);

  const total = useMemo(
    () =>
      Object.entries(data)
        .filter(([key]) => !key.startsWith("__"))
        .reduce((sum, [, value]) => sum + (Array.isArray(value) ? value.length : 0), 0),
    [data],
  );

  const knownNames = useMemo(() => getAllPastPlayerNames(data), [data]);

  return {
    data,
    syncing,
    syncError,
    getMatches,
    addMatch,
    delMatch,
    editMatch,
    importData,
    mergeSharedMatches,
    mergeCloudData,
    total,
    knownNames,
  };
}
