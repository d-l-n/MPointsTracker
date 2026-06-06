import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for App", () => {
  test("App runtime is sourced directly from App.tsx", () => {
    expect(existsSync(new URL("../src/App.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/App.jsx", import.meta.url))).toBe(false);
  });
});
