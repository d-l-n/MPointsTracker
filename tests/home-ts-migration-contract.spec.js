import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for home cluster", () => {
  test("home components are sourced directly from TSX implementations", () => {
    ["HomeTab", "HomeActionCard", "HomeGameHero"].forEach((name) => {
      expect(existsSync(new URL(`../src/components/home/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/components/home/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });

  test("home model is sourced directly from TS", () => {
    expect(existsSync(new URL("../src/components/home/homeModel.ts", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/components/home/homeModel.js", import.meta.url))).toBe(false);
  });
});
