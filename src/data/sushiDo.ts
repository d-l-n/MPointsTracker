export interface SushiDoFlavor {
  key: string;
  label: string;
  points: number;
}

export const SUSHI_DO_WIN_SCORE = 500;
export const SUSHI_DO_MAX_PLAYERS = 9;
export const SUSHI_DO_MIN_PLAYERS = 2;
export const SUSHI_DO_PENALTY = 20;

export const SUSHI_DO_FLAVORS: SushiDoFlavor[] = [
  { key: "tempura", label: "Tempura", points: 100 },
  { key: "roll", label: "Roll", points: 85 },
  { key: "maki", label: "Maki", points: 80 },
  { key: "sashimi", label: "Sashimi", points: 75 },
  { key: "temaki", label: "Temaki", points: 70 },
  { key: "niguiri", label: "Niguiri", points: 65 },
  { key: "wasabi", label: "Wasabi", points: 60 },
  { key: "salsa_soja", label: "Salsa de Soja", points: 55 },
  { key: "palitos", label: "Palitos", points: 50 },
];

export function getSuggestedSushiDoFlavors(playerCount: number): string[] {
  return SUSHI_DO_FLAVORS.slice(0, playerCount).map((flavor) => flavor.key);
}

export function getSushiDoFlavorByKey(flavorKey: string): SushiDoFlavor | null {
  return SUSHI_DO_FLAVORS.find((flavor) => flavor.key === flavorKey) || null;
}
