import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test.describe("TypeScript migration contract for context and services", () => {
  test("AppContext runtime is sourced directly from TSX", () => {
    expect(existsSync(new URL("../src/context/AppContext.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/context/AppContext.jsx", import.meta.url))).toBe(false);
  });

  test("auth, user and match services are sourced directly from TS implementations", () => {
    ["authService", "userService", "matchService"].forEach((name) => {
      expect(existsSync(new URL(`../src/services/${name}.ts`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../src/services/${name}.js`, import.meta.url))).toBe(false);
    });
  });

  test("shared auth and context types stay available in both TS and JS type hubs", () => {
    const typesTsSource = read("src/types.ts");
    const typesJsSource = read("src/types.js");

    expect(typesTsSource).toContain("export interface LegacyUserDoc");
    expect(typesTsSource).toContain("export interface AppContextValue");

    expect(typesJsSource).toContain('@typedef {import("./types.ts").LegacyUserDoc} LegacyUserDoc');
    expect(typesJsSource).toContain('@typedef {import("./types.ts").AppContextValue} AppContextValue');
    expect(typesJsSource).not.toContain("@typedef {object} LegacyUserDoc");
    expect(typesJsSource).not.toContain("@typedef {object} AppContextValue");
  });
});
