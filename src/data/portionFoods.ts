type PortionFoodKey =
  | "sushi"
  | "pizza"
  | "hamburguesa"
  | "pancho"
  | "empanadas"
  | "facturas"
  | "sanguchitos"
  | "cookies";

export interface PortionFood {
  key: PortionFoodKey;
  name: string;
  emoji: string;
  color: string;
  tKey: string;
}

export const PORTION_FOODS: PortionFood[] = [
  { key: "sushi", name: "Sushi", emoji: "🍣", color: "#E74C3C", tKey: "foodSushi" },
  { key: "pizza", name: "Pizza", emoji: "🍕", color: "#E67E22", tKey: "foodPizza" },
  { key: "hamburguesa", name: "Hamburguesa", emoji: "🍔", color: "#D35400", tKey: "foodHamburguesa" },
  { key: "pancho", name: "Pancho", emoji: "🌭", color: "#F39C12", tKey: "foodPancho" },
  { key: "empanadas", name: "Empanadas", emoji: "🥟", color: "#E74C3C", tKey: "foodEmpanadas" },
  { key: "facturas", name: "Facturas", emoji: "🥐", color: "#F1C40F", tKey: "foodFacturas" },
  { key: "sanguchitos", name: "Sanguchitos", emoji: "🥪", color: "#27AE60", tKey: "foodSanguchitos" },
  { key: "cookies", name: "Cookies", emoji: "🍪", color: "#C0651A", tKey: "foodCookies" },
];

export const PORTION_FOODS_BY_KEY = Object.fromEntries(
  PORTION_FOODS.map((food) => [food.key, food]),
) as Record<PortionFoodKey, PortionFood>;

export function getPortionFoodByKey(foodKey: string): PortionFood | null {
  return PORTION_FOODS_BY_KEY[foodKey as PortionFoodKey] || null;
}
