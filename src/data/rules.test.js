import { describe, expect, test } from "vitest";
import { RULES_DATA, getRulesData } from "./rules";

describe("rules", () => {
  test("exports RULES_DATA array with game entries", () => {
    expect(Array.isArray(RULES_DATA)).toBe(true);
    expect(RULES_DATA.length).toBeGreaterThan(0);
    expect(RULES_DATA[0]).toHaveProperty("id");
    expect(RULES_DATA[0]).toHaveProperty("name");
    expect(RULES_DATA[0]).toHaveProperty("sections");
  });

  test("getRulesData translates game names and sections", () => {
    const result = getRulesData((key) => `[[${key}]]`);
    expect(result[0].name).toBe("[[gn_uno]]");
    expect(result[0].sections[0].title).toContain("[[");
    expect(result[0].sections[0].text).toContain("[[");
  });

  test("getRulesData falls back to original name when translation is empty", () => {
    const result = getRulesData(() => "");
    expect(result[0].name).toBe("UNO");
  });

  test("getRulesData preserves untranslated titles when TM entry is missing", () => {
    const result = getRulesData((key) => key);
    const firstSection = result[0].sections[0];
    expect(firstSection.title).toBeTruthy();
    expect(typeof firstSection.title).toBe("string");
  });
});
