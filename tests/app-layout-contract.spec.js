import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test.describe("AppLayout extraction contract", () => {
  test("App delegates render orchestration to AppLayout", () => {
    const appSource = read("src/App.tsx");
    const layoutSource = read("src/components/ui/AppLayout.tsx");

    expect(appSource).toContain('import AppLayout from "./components/ui/AppLayout"');
    expect(appSource).toContain("<AppLayout");
    expect(layoutSource).toContain("export default function AppLayout");
    expect(layoutSource).toContain("<AppShell");
    expect(layoutSource).toContain("<HomeTab");
    expect(layoutSource).toContain("<GameDetail");
    expect(layoutSource).toContain("pending-invite-banner");
    expect(layoutSource).toContain("navLeaveTarget");
    expect(read("src/components/ui/AppLayout.tsx")).toContain("AppShell");
  });
});
