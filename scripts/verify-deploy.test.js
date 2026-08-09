import { describe, it, expect } from "vitest";

import { analyzeIndexHtml } from "./verify-deploy.mjs";

describe("analyzeIndexHtml", () => {
  it("accepts a built index.html referencing /assets/", () => {
    const html =
      '<!doctype html><script type="module" src="/assets/index-a1b2c3d4.js"></script>';
    const result = analyzeIndexHtml(html);
    expect(result.ok).toBe(true);
    expect(result.builtBundles).toContain('src="/assets/index-a1b2c3d4.js"');
  });

  it("rejects the raw source entry /src/main.tsx (broken deploy)", () => {
    const html =
      '<!doctype html><script type="module" src="/src/main.tsx"></script>';
    const result = analyzeIndexHtml(html);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/main\.tsx/);
  });

  it("rejects HTML that references both the source entry and an asset (source wins)", () => {
    const html =
      '<script type="module" src="/src/main.tsx"></script><script src="/assets/index-a1b2c3d4.js"></script>';
    expect(analyzeIndexHtml(html).ok).toBe(false);
  });

  it("rejects HTML without any built bundle", () => {
    const html = "<html><head></head><body>plain</body></html>";
    const result = analyzeIndexHtml(html);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/assets/);
  });

  it("only flags the module entry (/src/main.tsx), not other source references", () => {
    // Una referencia a /src/App.tsx (no-entry) no debe fallar la verificación;
    // solo el entry point importa para detectar un deploy del source.
    const html =
      '<link rel="preload" href="/src/App.tsx">' +
      '<script type="module" src="/assets/index-a1b2c3d4.js"></script>';
    expect(analyzeIndexHtml(html).ok).toBe(true);
  });
});
