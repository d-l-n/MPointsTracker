import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for QR/debug mini-cluster", () => {
  test("QRScanner and BlackjackCPU are sourced directly from TSX", () => {
    [
      ["src/components/auth", "QRScanner"],
      ["src/components/ui", "BlackjackCPU"],
    ].forEach(([dir, name]) => {
      expect(existsSync(new URL(`../${dir}/${name}.tsx`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../${dir}/${name}.jsx`, import.meta.url))).toBe(false);
    });
  });
});
