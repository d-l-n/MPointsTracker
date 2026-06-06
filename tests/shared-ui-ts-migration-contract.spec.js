import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for shared UI slices", () => {
  test("shared UI slices are sourced directly from TSX", () => {
    [
      "PlayerInput",
      "AutocompleteInput",
      "GroupPicker",
      "SaveGroupButton",
      "EarlyFinishSaveAction",
      "EarlyFinishModal",
    ].forEach((name) => {
      expect(existsSync(new URL(`../src/components/ui/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/components/ui/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
