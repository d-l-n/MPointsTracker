import { redirect, type LoaderFunctionArgs } from "react-router-dom";

import { GAMES } from "../data/games";
import type { GameId } from "../types";

interface HistoryRouteData {
  source: string;
  gameId: string;
  lockGameFilter: boolean;
  playerFilter: string;
}

interface SettingsRouteData {
  profileUid: string | null;
  section: string | null;
}

function normalizeGameId(gameId: string | null): string {
  if (!gameId || gameId === "all") return "all";
  return GAMES[gameId as GameId] ? gameId : "all";
}

export async function appShellLoader() {
  return null;
}

export async function gameRouteLoader({ params }: LoaderFunctionArgs) {
  const gameId = params.gameId ? decodeURIComponent(params.gameId) : "";
  if (!GAMES[gameId as GameId]) {
    throw redirect("/");
  }

  return { gameId };
}

export async function historyRouteLoader({ request }: LoaderFunctionArgs): Promise<HistoryRouteData> {
  const url = new URL(request.url);
  return {
    source: url.searchParams.get("source") || "home",
    gameId: normalizeGameId(url.searchParams.get("gameId")),
    lockGameFilter: url.searchParams.get("lock") === "1",
    playerFilter: url.searchParams.get("player") || "",
  };
}

export async function settingsRouteLoader({ request }: LoaderFunctionArgs): Promise<SettingsRouteData> {
  const url = new URL(request.url);
  return {
    profileUid: url.searchParams.get("profile"),
    section: url.searchParams.get("section"),
  };
}
