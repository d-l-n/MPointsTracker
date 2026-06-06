import { describe, expect, test } from "vitest";

import {
  PORTION_FOODS,
  PORTION_FOODS_BY_KEY,
  getPortionFoodByKey,
} from "./portionFoods.ts";
import {
  SUSHI_DO_FLAVORS,
  SUSHI_DO_MAX_PLAYERS,
  getSuggestedSushiDoFlavors,
  getSushiDoFlavorByKey,
} from "./sushiDo.ts";
import { RULES_DATA, getRulesData } from "./rules.ts";
import { SCORE_TABLES } from "./scoreTables.ts";
import {
  DEFAULT_LANG,
  TRANSLATIONS,
  flattenTranslationKeys,
  getTranslationParityReport,
} from "./translations.ts";

describe("TypeScript data module migration", () => {
  test("preserves portion food exports in the TypeScript module", () => {
    expect(PORTION_FOODS_BY_KEY.pizza).toBe(PORTION_FOODS[1]);
    expect(getPortionFoodByKey("cookies")).toEqual(
      expect.objectContaining({ key: "cookies", name: "Cookies" }),
    );
  });

  test("preserves sushi do exports in the TypeScript module", () => {
    expect(getSuggestedSushiDoFlavors(SUSHI_DO_MAX_PLAYERS)).toEqual(
      SUSHI_DO_FLAVORS.map((flavor) => flavor.key),
    );
    expect(getSushiDoFlavorByKey("tempura")).toEqual(
      expect.objectContaining({ key: "tempura", points: 100 }),
    );
  });

  test("preserves score table calculations in the TypeScript module", () => {
    expect(SCORE_TABLES.uno_classic.calc({ numbers: "12", actions: "2", wilds: "1" })).toBe(102);
    expect(SCORE_TABLES.uno_flip.calc({ draw_one: "2", wild_drawcolor: "1" })).toBe(80);
  });

  test("preserves rules exports in the TypeScript module", () => {
    const translatedRules = getRulesData((key) => `translated:${key}`);

    expect(RULES_DATA[0]).toEqual(
      expect.objectContaining({ id: "uno", name: "UNO" }),
    );
    expect(translatedRules[0]).toEqual(
      expect.objectContaining({
        name: "translated:gn_uno",
        sections: expect.arrayContaining([
          expect.objectContaining({
            title: "translated:rsObjective",
            text: "translated:r_uno_0",
          }),
        ]),
      }),
    );
  });

  test("preserves translation exports in the TypeScript module", () => {
    expect(DEFAULT_LANG).toBe("es");
    expect(TRANSLATIONS.es.r_uno_0).toBe(RULES_DATA[0].sections[0].text);
    expect(TRANSLATIONS.en.r_uno_0).toContain("Be the first");
    expect(flattenTranslationKeys({ a: { b: "x" }, c: "y" })).toEqual(["a.b", "c"]);
    expect(getTranslationParityReport().en.extra).toEqual([]);
  });
});
