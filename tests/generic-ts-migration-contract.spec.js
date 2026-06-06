import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for GenericNewMatch", () => {
  test("GenericNewMatch is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/components/games/GenericNewMatch.tsx", import.meta.url)), "GenericNewMatch TSX file should exist").toBe(true);
    expect(existsSync(new URL("../src/components/games/GenericNewMatch.jsx", import.meta.url))).toBe(false);
  });
});
