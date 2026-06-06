import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const SURFACES = [
  "src/App.tsx",
  "src/components/ui/AppLayout.tsx",
  "src/pages/GameDetail.tsx",
  "src/routes/routes.tsx",
  "src/routes/routeLoaders.ts",
  "src/components/home/HomeTab.tsx",
  "src/components/home/HomeActionCard.tsx",
  "src/data/translations.ts",
];

const RELATIVE_IMPLEMENTATION_EXTENSION_RE = /\b(?:from\s+|import\()\s*["']\.\.?(?:\/[^"']*)?\.(?:js|jsx|ts|tsx)["']/g;

test.describe("Typed surface import contract", () => {
  test("already-migrated TS surfaces avoid local wrapper and implementation-extension imports", () => {
    const offenders = SURFACES.flatMap((path) => {
      const source = read(path);
      const matches = [...source.matchAll(RELATIVE_IMPLEMENTATION_EXTENSION_RE)];

      return matches.map((match) => ({
        path,
        importStatement: match[0],
      }));
    });

    expect(offenders).toEqual([]);
  });
});
