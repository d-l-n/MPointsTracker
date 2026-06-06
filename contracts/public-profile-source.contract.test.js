import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const source = readFileSync(resolve(process.cwd(), "src/pages/PublicProfilePage.jsx"), "utf8");

test("PublicProfilePage composes shared surface classes on the hero and dense panels", () => {
  assert.match(
    source,
    /className="[^"]*public-profile-hero[^"]*surface-card[^"]*"/,
    "Expected the hero to reuse the shared surface-card class"
  );

  const densePanels = source.match(/className="[^"]*public-profile-panel[^"]*surface-card--dense[^"]*"/g) || [];
  assert.ok(
    densePanels.length >= 2,
    `Expected at least two public profile panels to reuse surface-card--dense, found ${densePanels.length}`
  );
});
