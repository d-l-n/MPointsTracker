import { PORTION_FOODS, getPortionFoodByKey } from "./portionFoods";
import type { GameDefinition, GameId } from "../types";

const LEGACY_PORTION_GAMES = Object.fromEntries(
  PORTION_FOODS.map((food) => [
    food.key as GameId,
    {
      id: food.key as GameId,
      name: food.name,
      emoji: food.emoji,
      color: food.color,
      type: "porcion",
      hiddenFromCatalog: true,
      tagline: "Conta tus porciones",
    } satisfies GameDefinition,
  ]),
) as Record<
  Extract<GameId, "sushi" | "pizza" | "hamburguesa" | "pancho" | "empanadas" | "facturas" | "sanguchitos" | "cookies">,
  GameDefinition
>;

const GAMES: Record<GameId, GameDefinition> = {
  uno: {
    id: "uno", name: "UNO", emoji: "🃏", color: "#E63946",
    type: "uno_classic", winScore: 500,
    tagline: "500 pts · Clasico",
    coverImage: "/games/covers/uno.webp"},
  uno_no_mercy: {
    id: "uno_no_mercy", name: "UNO No Mercy", emoji: "💀", color: "var(--nomercy)",
    type: "uno_nomercy", winScore: 1000,
    tagline: "1000 pts · Mercy Rule",
    coverImage: "/games/covers/uno_no_mercy.webp"},
  uno_flip: {
    id: "uno_flip", name: "UNO Flip", emoji: "🔄", color: "#7B2FBE",
    type: "uno_flip", winScore: 500,
    tagline: "500 pts · Lado Claro y Oscuro · 2 a 6 jugadores",
    coverImage: "/games/covers/uno_flip.webp"},
  uno_dos: {
    id: "uno_dos", name: "DOS", emoji: "✌️", color: "#2980B9",
    type: "uno_dos", winScore: 200,
    tagline: "200 pts · Dos pilas",
    coverImage: "/games/covers/uno_dos.webp"},
  truco: {
    id: "truco", name: "Truco", emoji: "🧉", color: "#8B5E3C",
    type: "truco",
    tagline: "15 o 30 pts · Equipos o Individual",
    coverImage: "/games/covers/truco.webp"},
  chancho: {
    id: "chancho", name: "Chancho", emoji: "🐷", color: "#E91E8C",
    type: "chancho",
    tagline: "Eliminacion · C-H-A-N-C-H-O",
    coverImage: "/games/covers/chancho.webp"},
  esquinados: {
    id: "esquinados", name: "Esquinados", emoji: "🟩", color: "#2E7D32",
    type: "esquinados",
    tagline: "Ganador por ronda · Maldon",
    coverImage: "/games/covers/esquinados.webp"},
  chin: {
    id: "chin", name: "Chin", emoji: "🎯", color: "#8B1A1A",
    type: "chin",
    tagline: "1v1 · Quien se queda sin cartas gana",
    coverImage: "/games/covers/chin.webp"},
  chinchon: {
    id: "chinchon", name: "Chinchon", emoji: "🀄", color: "#E67E22",
    type: "chinchon",
    tagline: "Eliminacion · Limite 100 pts",
    coverImage: "/games/covers/chinchon.webp"},
  rummy: {
    id: "rummy", name: "Rummy", emoji: "🃏", color: "#2980B9",
    type: "rummy",
    tagline: "500 pts · Combinaciones",
    coverImage: "/games/covers/rummy.webp"},
  poker: {
    id: "poker", name: "Poker", emoji: "♦️", color: "#E63946",
    type: "poker",
    tagline: "Ganador por ronda",
    coverImage: "/games/covers/poker.webp"},
  blackjack: {
    id: "blackjack", name: "Blackjack", emoji: "♣️", color: "var(--nomercy)",
    type: "blackjack",
    tagline: "21 · Ganador por ronda",
    coverImage: "/games/covers/blackjack.webp"},
  burako: {
    id: "burako", name: "Burako", emoji: "🅱️", color: "#8E44AD",
    type: "burako",
    tagline: "2000 pts · Individual o Equipos",
    coverImage: "/games/covers/burako.webp"},
  generala: {
    id: "generala", name: "Generala", emoji: "🎲", color: "#D4A017",
    type: "generala",
    tagline: "Combinaciones de dados · 5 dados",
    coverImage: "/games/covers/generala.webp"},
  ajedrez: {
    id: "ajedrez", name: "Ajedrez", emoji: "♟️", color: "#4A4A6A",
    type: "ajedrez",
    tagline: "1v1 · Ganador por partida",
    coverImage: "/games/covers/ajedrez.webp"},
  racha_perdida: {
    id: "racha_perdida", name: "Racha Perdida", emoji: "💀", color: "#6C3483",
    type: "racha_perdida",
    tagline: "Registra quien rompio la racha",
    coverImage: "/games/covers/racha_perdida.webp"},
  sushi_do: {
    id: "sushi_do", name: "Sushi Do!", emoji: "🍣", color: "#D94841",
    type: "sushi_do", winScore: 500,
    tagline: "500 pts · 6 iguales por sabor",
    coverImage: "/games/covers/sushi_do.webp"},
  portion_counter: {
    id: "portion_counter", name: "Contador de Porciones", emoji: "🍽️", color: "#1ABC9C",
    type: "porcion",
    tagline: "Elegi la comida y apuesten a cuantas unidades llega cada uno!",
    coverImage: "/games/covers/portion_counter.webp"},
  basta_dym: {
    id: "basta_dym", name: "Basta!", emoji: "🔤", color: "#2F7DE1",
    type: "basta_dym", winScore: 3,
    tagline: "3 cartas · Letras y tematicas",
    coverImage: "/games/covers/basta_dym.webp"},
  ...LEGACY_PORTION_GAMES,
  otros_porciones: {
    id: "otros_porciones", name: "Otros", emoji: "🍽️", color: "#1ABC9C",
    type: "porcion",
    hiddenFromCatalog: true,
    tagline: "Contador personalizado"},
  monopoly: {
    id: "monopoly", name: "Monopoly", emoji: "🎩", color: "#E63946",
    type: "monopoly",
    tagline: "Ganador por partida",
    coverImage: "/games/covers/monopoly.webp"},
  life: {
    id: "life", name: "Life", emoji: "🚗", color: "#27AE60",
    type: "life",
    tagline: "Ganador por partida",
    coverImage: "/games/covers/life.webp"},
  custom: {
    id: "custom", name: "Juego libre", emoji: "🎮", color: "#006D77",
    type: "custom", winScore: 0,
    tagline: "Puntaje libre · Sin limite fijo",
    coverImage: "/games/covers/custom.webp"},
  canasta: {
    id: "canasta", name: "Canasta", emoji: "🃏", color: "#C0392B",
    type: "canasta", winScore: 5000,
    tagline: "5000 pts · Equipos o individual",
    coverImage: "/games/covers/canasta.webp"},
};

const TAGLINE_KEYS: Partial<Record<GameId, string>> = {
  uno: "taglineUno",
  uno_no_mercy: "taglineUnoNM",
  uno_flip: "taglineUnoFlip",
  uno_dos: "taglineUnoDos",
  truco: "taglineTruco",
  chancho: "taglineChancho",
  esquinados: "taglineEsquinados",
  chin: "taglineChin",
  chinchon: "taglineChinchon",
  rummy: "taglineRummy",
  poker: "taglinePoker",
  blackjack: "taglineBlackjack",
  burako: "taglineBurako",
  generala: "taglineGenerala",
  ajedrez: "taglineAjedrez",
  racha_perdida: "taglineRacha",
  sushi_do: "taglineSushiDo",
  portion_counter: "taglinePortionCounter",
  basta_dym: "taglineBastaDym",
  sushi: "taglineSushi",
  pizza: "taglinePizza",
  hamburguesa: "taglineHamburguesa",
  pancho: "taglinePancho",
  otros_porciones: "taglineOtros",
  empanadas: "taglineEmpanadas",
  facturas: "taglineFacturas",
  sanguchitos: "taglineSanguchitos",
  cookies: "taglineCookies",
  monopoly: "taglineMonopoly",
  life: "taglineLife",
  custom: "taglineCustom",
  canasta: "taglineCanasta",
};

function getTagline(gameId: string, t: (key: string) => string): string {
  const key = TAGLINE_KEYS[gameId as GameId];
  return key ? t(key) : "";
}

const GAME_NAME_KEYS: Partial<Record<GameId, string>> = {
  uno: "gn_uno",
  uno_no_mercy: "gn_uno_no_mercy",
  uno_flip: "gn_uno_flip",
  uno_dos: "gn_uno_dos",
  truco: "gn_truco",
  chancho: "gn_chancho",
  esquinados: "gn_esquinados",
  chin: "gn_chin",
  chinchon: "gn_chinchon",
  rummy: "gn_rummy",
  poker: "gn_poker",
  blackjack: "gn_blackjack",
  burako: "gn_burako",
  generala: "gn_generala",
  racha_perdida: "gn_racha_perdida",
  canasta: "gn_canasta",
  sushi_do: "gn_sushi_do",
  portion_counter: "gn_portion_counter",
  basta_dym: "gn_basta_dym",
  ajedrez: "gn_ajedrez",
  monopoly: "gn_monopoly",
  life: "gn_life",
  custom: "customGame",
};

function getGameName(gameId: string, t: (key: string) => string): string {
  const key = GAME_NAME_KEYS[gameId as GameId];
  if (key) return t(key);
  const food = getPortionFoodByKey(gameId);
  if (food) return t(food.tKey) || food.name;
  return GAMES[gameId as GameId]?.name || gameId;
}

export { GAMES, getTagline, getGameName };
