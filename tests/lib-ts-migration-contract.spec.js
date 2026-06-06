import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.describe("TypeScript migration contract for productive lib modules", () => {
  test("runtime lib modules are sourced directly from TS implementations", () => {
    ["confetti", "firebase", "groupStorage", "inviteService", "publicData"].forEach((name) => {
      expect(existsSync(new URL(`../src/lib/${name}.ts`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/lib/${name}.js`, import.meta.url))).toBe(false);
    });
  });
});
