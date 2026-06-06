import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for Custom and Canasta", () => {
  test("CustomNewMatch and CanastaNewMatch are sourced directly from TSX", () => {
    ["CustomNewMatch", "CanastaNewMatch"].forEach((name) => {
      expect(existsSync(new URL(`../src/components/games/${name}.tsx`, import.meta.url)), `${name} TSX file should exist`).toBe(true);
      expect(existsSync(new URL(`../src/components/games/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
