import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for edit/match slices", () => {
  test("edit/match slices are sourced directly from TSX", () => {
    [
      ["src/components/ui", "EditMatchModal"],
      ["src/components/games", "MercyEliminator"],
    ].forEach(([dir, name]) => {
      expect(existsSync(new URL(`../${dir}/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../${dir}/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
