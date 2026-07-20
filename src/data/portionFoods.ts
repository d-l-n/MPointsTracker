import { FoodTray, PizzaSlice, Cookie } from "reicon-react";
import type { IconComponent } from "reicon-react";

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
  icon: IconComponent;
  color: string;
  tKey: string;
}

export const PORTION_FOODS: PortionFood[] = [
  { key: "sushi", name: "Sushi", emoji: "🍣", icon: FoodTray, color: "#E74C3C", tKey: "foodSushi" },
  { key: "pizza", name: "Pizza", emoji: "🍕", icon: PizzaSlice, color: "#E67E22", tKey: "foodPizza" },
  { key: "hamburguesa", name: "Hamburguesa", emoji: "🍔", icon: FoodTray, color: "#D35400", tKey: "foodHamburguesa" },
  { key: "pancho", name: "Pancho", emoji: "🌭", icon: FoodTray, color: "#F39C12", tKey: "foodPancho" },
  { key: "empanadas", name: "Empanadas", emoji: "🥟", icon: FoodTray, color: "#E74C3C", tKey: "foodEmpanadas" },
  { key: "facturas", name: "Facturas", emoji: "🥐", icon: FoodTray, color: "#F1C40F", tKey: "foodFacturas" },
  { key: "sanguchitos", name: "Sanguchitos", emoji: "🥪", icon: FoodTray, color: "#27AE60", tKey: "foodSanguchitos" },
  { key: "cookies", name: "Cookies", emoji: "🍪", icon: Cookie, color: "#C0651A", tKey: "foodCookies" },
];

export const PORTION_FOODS_BY_KEY: Record<string, PortionFood> = Object.fromEntries(
  PORTION_FOODS.map((food) => [food.key, food]),
);

export function getPortionFoodByKey(foodKey: string): PortionFood | null {
  return PORTION_FOODS_BY_KEY[foodKey as PortionFoodKey] || null;
}
