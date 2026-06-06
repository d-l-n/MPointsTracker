import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for casino games", () => {
  test("BlackjackNewMatch and PokerNewMatch are sourced directly from TSX", () => {
    ["BlackjackNewMatch", "PokerNewMatch"].forEach((name) => {
      expect(existsSync(new URL(`../src/components/games/${name}.tsx`, import.meta.url)), `${name} TSX file should exist`).toBe(true);
      expect(existsSync(new URL(`../src/components/games/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
