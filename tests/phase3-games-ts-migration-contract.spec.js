import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for Phase 3 game slices", () => {
  test("Chancho, Truco, and Burako are sourced directly from TSX", () => {
    ["ChanchoNewMatch", "TrucoNewMatch", "BurakoNewMatch"].forEach((name) => {
      expect(existsSync(new URL(`../src/components/games/${name}.tsx`, import.meta.url)), `${name} TSX file should exist`).toBe(true);
      expect(existsSync(new URL(`../src/components/games/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
