import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_ROOT = fileURLToPath(new URL("../src", import.meta.url));
const LEGACY_IMPORT_RE = /\b(?:from\s+|import\()\s*["'][^"']*\.(?:js|jsx)["']/g;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return walk(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(fullPath)) {
      return [];
    }

    return [fullPath];
  });
}

function findLegacyImports(filePath) {
  const source = readFileSync(filePath, "utf8");
  const offenders = [];

  source.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(LEGACY_IMPORT_RE);
    if (!match) return;

    offenders.push({
      file: relative(REPO_ROOT, filePath).replaceAll("\\", "/"),
      line: index + 1,
      import: match[0],
    });
  });

  return offenders;
}

test.describe("Legacy import contract for productive TS sources", () => {
  test("src TS/TSX files do not import local .js/.jsx wrappers", () => {
    const tsFiles = walk(SRC_ROOT);
    const offenders = tsFiles.flatMap(findLegacyImports);

    expect(offenders).toEqual([]);
  });
});
