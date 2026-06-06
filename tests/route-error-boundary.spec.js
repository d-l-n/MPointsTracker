import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test.describe("route error boundary contract", () => {
  test("app routes use the custom route error boundary", () => {
    const source = read("src/routes/routes.tsx");

    expect(source).toContain('import AppErrorBoundary from "./AppErrorBoundary"');
    expect(source).toContain("const appRouteError = <AppErrorBoundary />");
    expect((source.match(/errorElement:\s*appRouteError/g) || []).length).toBeGreaterThanOrEqual(8);
  });
});
