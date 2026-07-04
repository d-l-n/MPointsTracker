import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

import { GAMES } from "../data/games";
import type { GameType } from "../data/games";
import type { GameId } from "../types";

type GameComponent = LazyExoticComponent<ComponentType<Record<string, unknown>>>;
type GameLoaderKey =
  | "uno"
  | "truco"
  | "chin"
  | "esquinados"
  | "ajedrez"
  | "chancho"
  | "burako"
  | "racha_perdida"
  | "poker"
  | "blackjack"
  | "generic"
  | "generala"
  | "sushi_do"
  | "porcion"
  | "custom"
  | "canasta";

const GAME_COMPONENTS: Record<GameLoaderKey, GameComponent> = {
  uno: lazy(() => import("../components/games/UnoNewMatch")),
  truco: lazy(() => import("../components/games/TrucoNewMatch")),
  chin: lazy(() => import("../components/games/ChinNewMatch")),
  esquinados: lazy(() => import("../components/games/EsquinadosNewMatch")),
  ajedrez: lazy(() => import("../components/games/AjedrezNewMatch")),
  chancho: lazy(() => import("../components/games/ChanchoNewMatch")),
  burako: lazy(() => import("../components/games/BurakoNewMatch")),
  racha_perdida: lazy(() => import("../components/games/RachaPerdidaNewMatch")),
  poker: lazy(() => import("../components/games/PokerNewMatch")),
  blackjack: lazy(() => import("../components/games/BlackjackNewMatch")),
  generic: lazy(() => import("../components/games/GenericNewMatch")),
  generala: lazy(() => import("../components/games/GeneralaNewMatch")),
  sushi_do: lazy(() => import("../components/games/SushiDoNewMatch")),
  porcion: lazy(() => import("../components/games/PorcionNewMatch")),
  custom: lazy(() => import("../components/games/CustomNewMatch")),
  canasta: lazy(() => import("../components/games/CanastaNewMatch")),
};

const LOADER_KEY_MAP: Partial<Record<GameType, GameLoaderKey>> = {
  truco: "truco", chin: "chin", esquinados: "esquinados",
  ajedrez: "ajedrez", chancho: "chancho", burako: "burako",
  racha_perdida: "racha_perdida", poker: "poker", blackjack: "blackjack",
  generala: "generala", sushi_do: "sushi_do", porcion: "porcion",
  custom: "custom", canasta: "canasta",
  chinchon: "generic", rummy: "generic", monopoly: "generic",
  life: "generic", basta_dym: "generic",
};

function resolveLoaderKey(gameType: GameType): GameLoaderKey {
  return LOADER_KEY_MAP[gameType] ?? "uno";
}

export function getGameComponent(gameType: GameType) {
  const loaderKey = resolveLoaderKey(gameType);
  return GAME_COMPONENTS[loaderKey];
}

