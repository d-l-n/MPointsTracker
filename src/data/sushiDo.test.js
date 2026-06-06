import { describe, expect, test } from "vitest";

import {
  getSuggestedSushiDoFlavors,
  getSushiDoFlavorByKey,
  SUSHI_DO_FLAVORS,
  SUSHI_DO_MAX_PLAYERS,
  SUSHI_DO_MIN_PLAYERS,
} from "./sushiDo.ts";

describe("sushiDo helpers", () => {
  test("returns unique suggested flavors up to the requested player count", () => {
    const flavors = getSuggestedSushiDoFlavors(4);

    expect(flavors).toHaveLength(4);
    expect(new Set(flavors).size).toBe(4);
    expect(flavors).toEqual(SUSHI_DO_FLAVORS.slice(0, 4).map((flavor) => flavor.key));
  });

  test("respects the supported player limits and flavor lookup", () => {
    expect(SUSHI_DO_MIN_PLAYERS).toBe(2);
    expect(SUSHI_DO_MAX_PLAYERS).toBe(9);
    expect(getSuggestedSushiDoFlavors(SUSHI_DO_MAX_PLAYERS)).toHaveLength(SUSHI_DO_MAX_PLAYERS);
    expect(getSushiDoFlavorByKey("wasabi")).toEqual(expect.objectContaining({ key: "wasabi" }));
    expect(getSushiDoFlavorByKey("missing")).toBeNull();
  });
});
