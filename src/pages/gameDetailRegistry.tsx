import type { ComponentType } from "react";

import { GAMES } from "../data/games";
import type { GameId, GameType } from "../types";

import UnoNewMatch from "../components/games/UnoNewMatch";
import TrucoNewMatch from "../components/games/TrucoNewMatch";
import ChinNewMatch from "../components/games/ChinNewMatch";
import EsquinadosNewMatch from "../components/games/EsquinadosNewMatch";
import AjedrezNewMatch from "../components/games/AjedrezNewMatch";
import ChanchoNewMatch from "../components/games/ChanchoNewMatch";
import BurakoNewMatch from "../components/games/BurakoNewMatch";
import RachaPerdidaNewMatch from "../components/games/RachaPerdidaNewMatch";
import PokerNewMatch from "../components/games/PokerNewMatch";
import BlackjackNewMatch from "../components/games/BlackjackNewMatch";
import GenericNewMatch from "../components/games/GenericNewMatch";
import GeneralaNewMatch from "../components/games/GeneralaNewMatch";
import SushiDoNewMatch from "../components/games/SushiDoNewMatch";
import PorcionNewMatch from "../components/games/PorcionNewMatch";
import CustomNewMatch from "../components/games/CustomNewMatch";
import CanastaNewMatch from "../components/games/CanastaNewMatch";

type GameComponent = ComponentType<Record<string, unknown>>;
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
  uno: UnoNewMatch,
  truco: TrucoNewMatch,
  chin: ChinNewMatch,
  esquinados: EsquinadosNewMatch,
  ajedrez: AjedrezNewMatch,
  chancho: ChanchoNewMatch,
  burako: BurakoNewMatch,
  racha_perdida: RachaPerdidaNewMatch,
  poker: PokerNewMatch,
  blackjack: BlackjackNewMatch,
  generic: GenericNewMatch,
  generala: GeneralaNewMatch,
  sushi_do: SushiDoNewMatch,
  porcion: PorcionNewMatch,
  custom: CustomNewMatch,
  canasta: CanastaNewMatch,
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


