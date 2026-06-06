import { describe, expect, test } from "vitest";

import { getPortionFoodByKey, PORTION_FOODS, PORTION_FOODS_BY_KEY } from "./portionFoods.ts";

describe("portionFoods dataset", () => {
  test("contains a complete keyed structure with unique entries", () => {
    expect(PORTION_FOODS.length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(PORTION_FOODS_BY_KEY)).toHaveLength(PORTION_FOODS.length);

    for (const food of PORTION_FOODS) {
      expect(food).toEqual({
        key: expect.any(String),
        name: expect.any(String),
        emoji: expect.any(String),
        color: expect.any(String),
        tKey: expect.any(String),
      });
      expect(PORTION_FOODS_BY_KEY[food.key]).toBe(food);
    }
  });

  test("looks up foods by key", () => {
    expect(getPortionFoodByKey("pizza")).toEqual(expect.objectContaining({ key: "pizza", name: "Pizza" }));
    expect(getPortionFoodByKey("missing-food")).toBeNull();
  });
});
