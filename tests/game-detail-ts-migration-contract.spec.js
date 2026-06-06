import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for game detail pages", () => {
  test("game detail pages are sourced directly from TSX implementations", () => {
    ["GameDetail", "StatsTab", "RachaPerdidaStatsTab"].forEach((name) => {
      expect(existsSync(new URL(`../src/pages/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/pages/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
