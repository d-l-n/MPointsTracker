import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for rules and public profile pages", () => {
  test("RulesPage is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/pages/RulesPage.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/pages/RulesPage.jsx", import.meta.url))).toBe(false);
  });

  test("PublicProfilePage is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/pages/PublicProfilePage.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/pages/PublicProfilePage.jsx", import.meta.url))).toBe(false);
  });
});
