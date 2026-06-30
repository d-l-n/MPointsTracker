import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

import { GAMES } from "../data/games";
import type { GameId, GameType } from "../types";

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

function resolveLoaderKey(gameType: GameType): GameLoaderKey {
  switch (gameType) {
    case "truco":
      return "truco";
    case "chin":
      return "chin";
    case "esquinados":
      return "esquinados";
    case "ajedrez":
      return "ajedrez";
    case "chancho":
      return "chancho";
    case "burako":
      return "burako";
    case "racha_perdida":
      return "racha_perdida";
    case "poker":
      return "poker";
    case "blackjack":
      return "blackjack";
    case "generala":
      return "generala";
    case "sushi_do":
      return "sushi_do";
    case "porcion":
      return "porcion";
    case "custom":
      return "custom";
    case "canasta":
      return "canasta";
    case "chinchon":
    case "rummy":
    case "monopoly":
    case "life":
    case "basta_dym":
      return "generic";
    case "uno_classic":
    case "uno_nomercy":
    case "uno_flip":
    case "uno_dos":
    default:
      return "uno";
  }
}

export function getGameComponent(gameType: GameType) {
  const loaderKey = resolveLoaderKey(gameType);
  return GAME_COMPONENTS[loaderKey];
}

