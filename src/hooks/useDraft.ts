import { useCallback } from "react";

import type { DraftRecord, DraftStore } from "../types";

const DRAFTS_KEY = "bgt_drafts";

function getDrafts(): DraftStore {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? (parsed as DraftStore) : {};
  } catch {
    return {};
  }
}

export function useDraft() {
  const saveDraft = useCallback((gameId: string, draft: DraftRecord | null | undefined) => {
    try {
      const currentDrafts = getDrafts();
      if (!draft) {
        delete currentDrafts[gameId];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(currentDrafts));
        return;
      }
      localStorage.setItem(
        DRAFTS_KEY,
        JSON.stringify({ ...currentDrafts, [gameId]: { ...draft, _savedAt: Date.now() } }),
      );
    } catch (error) {
      console.error("[useDraft] saveDraft error:", error);
    }
  }, []);

  const clearDraft = useCallback((gameId: string) => {
    try {
      const currentDrafts = getDrafts();
      delete currentDrafts[gameId];
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(currentDrafts));
    } catch (error) {
      console.error("[useDraft] clearDraft error:", error);
    }
  }, []);

  const getDraft = useCallback((gameId: string): DraftRecord | null => {
    return getDrafts()[gameId] || null;
  }, []);

  return { saveDraft, clearDraft, getDraft };
}
