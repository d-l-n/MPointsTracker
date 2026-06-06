import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for Racha Perdida", () => {
  test("RachaPerdidaNewMatch is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/components/games/RachaPerdidaNewMatch.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/components/games/RachaPerdidaNewMatch.jsx", import.meta.url))).toBe(false);
  });
});
