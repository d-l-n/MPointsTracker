import { useCallback, useState, type SetStateAction } from "react";

import { GAMES } from "../data/games";
import { mkId } from "../lib/storage";
import { useDraft } from "./useDraft";
import { buildHomePath, hasDraftPlayer } from "./useNavigation";
import type { GameId, LinkedPlayer, SharedMatchRecipient } from "../types";
import type { RematchState } from "../pages/GameDetail";

interface RematchPlayer {
  id: string;
  name: string;
}

interface LinkedPlayerState extends SharedMatchRecipient {
  name: string;
  playerId?: string;
}

interface UseGameSessionOptions {
  navigate: (path: string) => void;
}

const LINKS_KEY = "bgt_linked_players";

function loadLinkedPlayers(): Record<string, LinkedPlayer[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(LINKS_KEY) || "null");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, LinkedPlayer[]>) : {};
  } catch {
    return {};
  }
}

function persistLinkedPlayers(state: Record<string, LinkedPlayer[]>) {
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(state));
  } catch {
    // non-fatal: degrade to in-memory links
  }
}

export function useGameSession({ navigate }: UseGameSessionOptions) {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameTab, setGameTab] = useState<"stats" | "new">("new");
  const [gameMatchKey, setGameMatchKey] = useState(0);
  const [postSaveRematch, setPostSaveRematch] = useState<RematchState | null>(null);
  // Persisted so links survive app reloads: drafts survive in localStorage, but
  // in-memory links alone would silently drop sharing after a reload/PWA update.
  const [linkedPlayersState, setLinkedPlayersState] = useState<Record<string, LinkedPlayer[]>>(loadLinkedPlayers);
  const { saveDraft, clearDraft, getDraft } = useDraft();

  const setLinkedPlayers = useCallback((updater: SetStateAction<Record<string, LinkedPlayer[]>>) => {
    setLinkedPlayersState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      persistLinkedPlayers(next);
      return next;
    });
  }, []);

  const resetGameSession = useCallback(() => {
    setActiveGame(null);
    setSelected(null);
    setGameTab("new");
    setGameMatchKey(0);
  }, []);

  const clearGameSelection = useCallback(() => {
    resetGameSession();
    navigate("/");
  }, [navigate, resetGameSession]);

  const applyRouteSelection = useCallback((gameId: string | null) => {
    setSelected(gameId);
    setActiveGame(gameId);
  }, []);

  const openGame = useCallback(async (gameId: string, { tab = "new", resetDraft = false }: { tab?: "stats" | "new"; resetDraft?: boolean } = {}) => {
    if (!GAMES[gameId as GameId]) return;
    if (resetDraft) clearDraft(gameId);
    setGameTab(tab);
    setActiveGame(gameId);
    setSelected(gameId);
    if (resetDraft) setGameMatchKey((currentKey) => currentKey + 1);
    // A fresh match (no draft with players to resume) must not inherit linked
    // accounts from a previous session: stale uids would suppress the "add me"
    // (yo) button on every player row. (On resetDraft the draft was just
    // cleared above, so this also holds for that path.)
    if (!hasDraftPlayer(getDraft(gameId))) {
      setLinkedPlayers((current) => ({ ...current, [gameId]: [] }));
    }
    navigate(buildHomePath(gameId));
  }, [clearDraft, getDraft, navigate, setLinkedPlayers]);

  const handleHomeQuickAction = useCallback((gameId: string, action: string) => {
    if (action === "continue") {
      openGame(gameId, { tab: "new" });
      return;
    }
    if (action === "stats") {
      openGame(gameId, { tab: "stats" });
      return;
    }
    openGame(gameId, { tab: "new", resetDraft: true });
  }, [openGame]);

  const handleRematchRequest = useCallback(({
    playerNames,
    linkedPlayers: previousLinkedPlayers = [],
    closeHistoryView,
  }: {
    playerNames?: string[] | null;
    linkedPlayers?: LinkedPlayer[];
    closeHistoryView?: () => void;
  } = {}) => {
    if (!playerNames || !selected) return;

    const game = GAMES[selected as GameId];
    let rematchDraft: { p1?: string; p2?: string; players?: RematchPlayer[]; _rematch: true };
    let nextLinkedPlayers: LinkedPlayer[] = [];

    if (game?.type === "chin" || game?.type === "ajedrez" || game?.type === "esquinados") {
      rematchDraft = { p1: playerNames[0] || "", p2: playerNames[1] || "", _rematch: true };
      nextLinkedPlayers = previousLinkedPlayers
        .map((linkedPlayer) => {
          const nameIndex = playerNames.indexOf(linkedPlayer.name ?? "");
          if (nameIndex === 0) return { ...linkedPlayer, playerId: "p1" };
          if (nameIndex === 1) return { ...linkedPlayer, playerId: "p2" };
          return null;
        })
        .filter(Boolean) as LinkedPlayer[];
    } else {
      const newPlayers = playerNames.map((name) => ({ id: mkId(), name }));
      rematchDraft = { players: newPlayers, _rematch: true };
      nextLinkedPlayers = previousLinkedPlayers
        .map((linkedPlayer) => {
          const match = newPlayers.find((player) => player.name === linkedPlayer.name);
          return match ? { ...linkedPlayer, playerId: match.id } : null;
        })
        .filter(Boolean) as LinkedPlayer[];
    }

    saveDraft(selected, rematchDraft);
    if (nextLinkedPlayers.length > 0) {
      setLinkedPlayers((current) => ({ ...current, [selected]: nextLinkedPlayers }));
    }
    setGameMatchKey((currentKey) => currentKey + 1);
    setGameTab("new");
    setPostSaveRematch(null);
    closeHistoryView?.();
  }, [saveDraft, selected, setLinkedPlayers]);

  return {
    selected,
    activeGame,
    gameTab,
    gameMatchKey,
    postSaveRematch,
    linkedPlayers: linkedPlayersState,
    saveDraft,
    clearDraft,
    getDraft,
    setSelected,
    setActiveGame,
    setGameTab,
    setGameMatchKey,
    setPostSaveRematch,
    setLinkedPlayers,
    applyRouteSelection,
    resetGameSession,
    clearGameSelection,
    openGame,
    handleHomeQuickAction,
    handleRematchRequest,
  };
}
