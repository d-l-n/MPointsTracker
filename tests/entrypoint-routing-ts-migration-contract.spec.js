import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test.describe("TypeScript migration contract for entrypoint and routing", () => {
  test("main is loaded directly from the TSX entrypoint", () => {
    expect(existsSync(new URL("../src/main.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/main.jsx", import.meta.url))).toBe(false);
    expect(read("index.html")).toContain('src="/src/main.tsx"');
  });

  test("routes are sourced directly from routes.tsx", () => {
    expect(existsSync(new URL("../src/routes/routes.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/routes/routes.jsx", import.meta.url))).toBe(false);
  });

  test("main gates service worker registration behind the PROD entrypoint guard", () => {
    const source = read("src/main.tsx");

    expect(source).toContain('if ("serviceWorker" in navigator && import.meta.env.PROD)');
    expect(source).toMatch(
      /navigator\.serviceWorker\s*[\r\n]+\s*\.register\("\/sw\.js", \{ scope: "\/" \}\)/,
    );
  });

  test("service worker cache version stays aligned with the app version", () => {
    const storageSource = read("src/lib/storage.ts");
    const serviceWorkerSource = read("public/sw.js");
    const appVersion = storageSource.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
    const serviceWorkerVersion = serviceWorkerSource.match(/SW_VERSION\s*=\s*"([^"]+)"/)?.[1];

    expect(serviceWorkerVersion).toBe(appVersion);
  });

  test('routes keeps the catch-all route redirecting back to "/"', () => {
    const source = read("src/routes/routes.tsx");

    expect(source).toContain('{ path: "*", element: <Navigate to="/" replace /> }');
  });
});
