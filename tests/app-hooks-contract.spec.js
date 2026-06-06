import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test.describe("App hook extraction contract", () => {
  test("App imports and consumes the navigation and game session hooks", () => {
    const appSource = read("src/App.tsx");
    const navHookSource = read("src/hooks/useNavigation.ts");
    const gameSessionHookSource = read("src/hooks/useGameSession.ts");

    expect(appSource).toContain('from "./hooks/useNavigation"');
    expect(appSource).toContain('from "./hooks/useGameSession"');
    expect(appSource).toContain("useNavigation({");
    expect(appSource).toContain("useGameSession({ navigate })");

    expect(navHookSource).toContain("export function useNavigation");
    expect(navHookSource).toContain("function getRouteState");
    expect(navHookSource).toContain("function buildHomePath");
    expect(navHookSource).toContain("window.addEventListener(\"popstate\"");

    expect(gameSessionHookSource).toContain("export function useGameSession");
    expect(gameSessionHookSource).toContain("const { saveDraft, clearDraft, getDraft } = useDraft()");
    expect(gameSessionHookSource).toContain("const handleRematchRequest = useCallback");
  });
});
