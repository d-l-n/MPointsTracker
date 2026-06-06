import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for Uno and Sushi Do!", () => {
  test("UnoNewMatch and SushiDoNewMatch are sourced directly from TSX", () => {
    ["UnoNewMatch", "SushiDoNewMatch"].forEach((name) => {
      expect(existsSync(new URL(`../src/components/games/${name}.tsx`, import.meta.url)), `${name} TSX file should exist`).toBe(true);
      expect(existsSync(new URL(`../src/components/games/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
