import { describe, expect, test } from "vitest";
import { SCORE_TABLES } from "./scoreTables.ts";

describe("scoreTables", () => {
  test("uno_classic calc uses multipliers correctly", () => {
    expect(SCORE_TABLES.uno_classic.calc({ numbers: "12", actions: "2", wilds: "1" })).toBe(102);
    expect(SCORE_TABLES.uno_classic.calc({})).toBe(0);
  });

  test("uno_nomercy calc matches uno_classic pattern with mercyBonus metadata", () => {
    expect(SCORE_TABLES.uno_nomercy.calc({ numbers: "10", actions: "3", wilds: "2" })).toBe(10 + 3 * 20 + 2 * 50);
    expect(SCORE_TABLES.uno_nomercy.mercyBonus).toBe(250);
    expect(SCORE_TABLES.uno_nomercy.calc({})).toBe(0);
  });

  test("uno_flip calc handles both light and dark side inputs", () => {
    expect(SCORE_TABLES.uno_flip.calc({ draw_one: "2", wild_drawcolor: "1" })).toBe(80);
    expect(SCORE_TABLES.uno_flip.calc({ numbers: 5, actions_light: 1, skip_everyone: 1, wilds_dark: 1 }))
      .toBe(5 + 20 + 30 + 40);
    expect(SCORE_TABLES.uno_flip.calc({})).toBe(0);
  });

  test("uno_dos calc uses multiplier for wild cards", () => {
    expect(SCORE_TABLES.uno_dos.calc({ numbers: "15", wild_dos: "2", wild_num: "1" })).toBe(15 + 40 + 40);
    expect(SCORE_TABLES.uno_dos.calc({})).toBe(0);
  });

  test("parsePoints handles undefined and non-numeric strings", () => {
    expect(SCORE_TABLES.uno_classic.calc({ numbers: undefined })).toBe(0);
    expect(SCORE_TABLES.uno_classic.calc({ numbers: "abc" })).toBe(0);
  });
});
