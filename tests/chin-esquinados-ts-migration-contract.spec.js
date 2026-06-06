import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contracts for Chin and Esquinados", () => {
  test("ChinNewMatch and EsquinadosNewMatch are sourced directly from TSX", () => {
    ["ChinNewMatch", "EsquinadosNewMatch"].forEach((name) => {
      expect(existsSync(new URL(`../src/components/games/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/components/games/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
