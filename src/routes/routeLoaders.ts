import { redirect, type LoaderFunctionArgs } from "react-router-dom";

import { GAMES } from "../data/games";
import type { GameId } from "../types";

function normalizeGameId(gameId: string | null): string {
  if (!gameId || gameId === "all") return "all";
  return GAMES[gameId as GameId] ? gameId : "all";
}

export async function routeLoader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/settings") {
    return { profileUid: url.searchParams.get("profile"), section: url.searchParams.get("section") };
  }

  if (pathname === "/history") {
    return {
      source: url.searchParams.get("source") || "home",
      gameId: normalizeGameId(url.searchParams.get("gameId")),
      lockGameFilter: url.searchParams.get("lock") === "1",
      playerFilter: url.searchParams.get("player") || "",
    };
  }

  if (pathname.startsWith("/game/")) {
    const gameId = params.gameId ? decodeURIComponent(params.gameId) : "";
    if (!GAMES[gameId as GameId]) throw redirect("/");
    return { gameId };
  }

  return null;
}
