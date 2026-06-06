import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for Porcion", () => {
  test("PorcionNewMatch is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/components/games/PorcionNewMatch.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/components/games/PorcionNewMatch.jsx", import.meta.url))).toBe(false);
  });
});
