import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for AdminPage", () => {
  test("AdminPage runtime is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/pages/AdminPage.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/pages/AdminPage.jsx", import.meta.url))).toBe(false);
  });
});
