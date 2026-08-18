import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { load, persist } from "../lib/storage";
import { getAllPastPlayerNames } from "../lib/stats";
import { computePublicStats } from "../lib/publicData";
import { saveDataToCloud, savePublicStats } from "../services/userService";
import type { AppStorageData, Match, MatchStore, TranslationFn } from "../types";

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

function buildSavedMatchToast(gid: string, match: StoredMatch, hasCloud: boolean, t: TranslationFn): string {
  if (gid === "racha_perdida") return t("savedRacha");
  if (!match.winner) return hasCloud ? t("savedCloud") : t("savedLocal");
  const rounds = typeof match.rounds === "number" ? ` · ${match.rounds} ${t("rounds")}` : "";
  return `🏆 ${match.winner}${rounds}`;
}

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
        const stats = computePublicStats(nextData, user.displayName ?? "");
        if (stats) {
          try {
            await savePublicStats(user.uid, stats);
          } catch {
            // public stats are non-critical; permission errors are expected for expired/guest sessions
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
      showToast(buildSavedMatchToast(gid, match, Boolean(user), t));
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

  const mergeSharedMatches = useCallback((toMerge: Record<string, Match[]>) => {
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
