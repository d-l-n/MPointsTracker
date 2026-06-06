import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for settings page", () => {
  test("settings page is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/pages/SettingsPage.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/pages/SettingsPage.jsx", import.meta.url))).toBe(false);
  });
});
