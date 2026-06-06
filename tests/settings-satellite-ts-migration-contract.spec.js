import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for settings-adjacent satellite files", () => {
  test("satellite runtime files are sourced directly from TSX implementations", () => {
    [
      ["src/pages", "FeedbackPage"],
      ["src/components/auth", "UserQRCode"],
      ["src/components/auth", "UserSearchModal"],
      ["src/components/ui", "ConfirmModal"],
      ["src/components/ui", "VersionTapper"],
    ].forEach(([dir, name]) => {
      expect(existsSync(new URL(`../${dir}/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../${dir}/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
