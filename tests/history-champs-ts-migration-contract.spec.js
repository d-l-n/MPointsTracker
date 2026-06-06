import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for history and champions pages", () => {
  test("history and champions pages are sourced directly from TSX", () => {
    ["GlobalHistoryPage", "HeadToHeadPage", "ChampsPage"].forEach((name) => {
      expect(existsSync(new URL(`../src/pages/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/pages/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
