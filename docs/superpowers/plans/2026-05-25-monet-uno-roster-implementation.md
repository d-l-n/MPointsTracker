# Monet Theme, Header Autohide, and UNO Roster Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bridge-ready Monet theming, extend header autohide across mobile pages, and refactor the UNO family to use aggregate round scoring plus safe in-progress roster editing.

**Architecture:** The work is split into three bounded tracks: theme state and token architecture, shared mobile chrome visibility, and UNO-family gameplay state. The theme track introduces an accent-source model and a dynamic-role bridge contract without claiming unavailable browser capabilities. The UNO track keeps saved data truthful by using explicit roster events and non-destructive leave semantics.

**Tech Stack:** React 19, TypeScript, Vite, CSS variables, localStorage-backed hooks, Playwright, Vitest

---

## File Structure

**Modify:**

- `src/hooks/useTheme.ts`
  Responsibility: derive effective theme mode, Monet fallback, OLED coexistence, and bridge consumption.
- `src/types.ts`
  Responsibility: shared types for theme accent source, dynamic color payload, UNO roster events, and updated UNO draft shape.
- `src/pages/SettingsPage.tsx`
  Responsibility: settings UI for color mode, Monet, OLED, and reduced effects.
- `src/components/ui/AppLayout.tsx`
  Responsibility: attach shared autohide classes to all page headers and wire chrome visibility state through header rendering.
- `src/hooks/useNavVisibility.ts`
  Responsibility: promote mobile scroll visibility state from nav-only to shared chrome visibility.
- `src/styles/tokens.css`
  Responsibility: semantic theme-role variable definitions and data-theme variants.
- `src/styles/app.css`
  Responsibility: component-level token use, mobile header autohide transitions, UNO scoreboard responsiveness.
- `src/components/games/UnoNewMatch.tsx`
  Responsibility: aggregate round entry, in-progress roster editing, draft persistence, and safe leave behavior.
- `tests/settings-accessibility.spec.js`
  Responsibility: settings behavior and accessibility-affecting theme controls.
- `tests/routing-theme.spec.js`
  Responsibility: theme routing/persistence coverage.
- `tests/games/uno.spec.js`
  Responsibility: UNO aggregate scoring and roster-edit flows.
- `tests/layout-mobile.spec.js`
  Responsibility: header autohide and scoreboard layout assertions on mobile.
- `README.md`
  Responsibility: document theme architecture, Monet bridge contract, and UNO roster behavior.

**Optional create (if extraction is needed during implementation):**

- `src/lib/monet.ts`
  Responsibility: validate and normalize bridge-injected dynamic color payloads.
- `src/components/games/uno/unoScoring.ts`
  Responsibility: pure aggregate scoring helpers for the UNO family.
- `src/components/games/uno/unoRoster.ts`
  Responsibility: roster mutation helpers and event application.

**Test:**

- `tests/settings-accessibility.spec.js`
- `tests/routing-theme.spec.js`
- `tests/games/uno.spec.js`
- `tests/layout-mobile.spec.js`

---

### Task 1: Add Theme Accent Source and Dynamic Role Contract

**Files:**
- Modify: `src/types.ts`
- Modify: `src/hooks/useTheme.ts`
- Optional Create: `src/lib/monet.ts`
- Test: `tests/routing-theme.spec.js`

- [ ] **Step 1: Write the failing theme-contract test**

Add a test that verifies the theme system can persist a Monet accent mode, keep OLED enabled at the same time, and fall back cleanly when no bridge payload exists.

Suggested assertions:

```js
test("Monet accent mode persists and can coexist with OLED", async ({ page }) => {
  await page.goto("/settings");
  await page.getByTestId("settings-row-prefs").click();
  await page.getByRole("button", { name: /app theme|tema de la app/i }).click();
  await page.getByRole("switch", { name: /monet/i }).click();
  await page.getByRole("switch", { name: /oled/i }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", /dark|oled/);
  await expect.poll(async () => page.evaluate(() => localStorage.getItem("bgt_theme_accent"))).toBe("monet");
  await expect.poll(async () => page.evaluate(() => localStorage.getItem("bgt_oled"))).toBe("1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\routing-theme.spec.js --grep "Monet accent mode persists and can coexist with OLED"
```

Expected:

- FAIL because `bgt_theme_accent` does not exist and the settings UI has no Monet control.

- [ ] **Step 3: Add theme accent types and storage keys**

Update `src/types.ts` and `src/hooks/useTheme.ts` to add:

```ts
export type ThemeAccentMode = "default" | "monet";

export interface DynamicThemeRoles {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  onError: string;
}
```

And in `useTheme.ts`:

```ts
const THEME_ACCENT_KEY = "bgt_theme_accent";

function readThemeAccent(): ThemeAccentMode {
  try {
    return localStorage.getItem(THEME_ACCENT_KEY) === "monet" ? "monet" : "default";
  } catch {
    return "default";
  }
}
```

- [ ] **Step 4: Implement bridge-ready derived theme state**

Extend `useTheme()` so it returns:

```ts
{
  activeTheme,
  dark,
  oledEnabled,
  reduceEffectsEnabled,
  themeMode,
  themeAccentMode,
  dynamicThemeRoles,
  handleThemeMode,
  handleThemeAccentMode,
  handleToggleOled,
  handleToggleReduceEffects,
}
```

Behavior rules:

- `themeAccentMode === "monet"` is independent from `oledEnabled`
- `activeTheme` still drives surface mode
- `dynamicThemeRoles` is `null` when unavailable
- root element gets:
  - `data-theme`
  - `data-theme-accent`
  - optional `data-theme-source`

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\routing-theme.spec.js --grep "Monet accent mode persists and can coexist with OLED"
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/hooks/useTheme.ts tests/routing-theme.spec.js
git commit -m "feat: add bridge-ready monet theme state"
```

### Task 2: Add Monet Controls to Settings

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Test: `tests/settings-accessibility.spec.js`

- [ ] **Step 1: Write the failing settings test**

Add a test that verifies the app theme page shows a Monet control and that enabling it does not disable OLED.

```js
test("theme settings expose Monet and keep OLED available", async ({ page }) => {
  await page.goto("/settings");
  await page.getByTestId("settings-row-prefs").click();
  await page.getByRole("button", { name: /app theme|tema de la app/i }).click();

  await expect(page.getByRole("switch", { name: /monet/i })).toBeVisible();
  await expect(page.getByRole("switch", { name: /oled/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\settings-accessibility.spec.js --grep "theme settings expose Monet and keep OLED available"
```

Expected:

- FAIL because there is no Monet switch.

- [ ] **Step 3: Add Monet control to the app theme subpage**

Update `AppThemeSubPage` in `src/pages/SettingsPage.tsx` to accept:

```ts
themeAccentMode: ThemeAccentMode;
onThemeAccentMode: (mode: ThemeAccentMode) => void;
```

Render a dedicated settings toggle row:

```tsx
<SettingsToggleRow
  title="Monet"
  desc={t("monetThemeDesc") || "Uses Material You colors when available on Android and a local fallback elsewhere."}
  enabled={themeAccentMode === "monet"}
  onToggle={(value) => onThemeAccentMode(value ? "monet" : "default")}
  color="var(--accent-primary, var(--accent, #7b6fff))"
  switchTestId="monet-toggle"
/>
```

- [ ] **Step 4: Ensure OLED remains independent**

Do not add disabling logic between Monet and OLED. Leave both controls active and visible at the same time.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\settings-accessibility.spec.js --grep "theme settings expose Monet and keep OLED available"
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/SettingsPage.tsx tests/settings-accessibility.spec.js
git commit -m "feat: add monet controls to theme settings"
```

### Task 3: Refactor CSS Tokens for Monet and OLED + Monet

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/app.css`
- Test: `tests/routing-theme.spec.js`

- [ ] **Step 1: Write the failing token-application test**

Add a test that verifies the root HTML element exposes the Monet accent marker and that a representative component can read Monet accent variables.

```js
test("Monet theme applies accent tokens to the root", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("bgt_theme_mode", "dark");
    localStorage.setItem("bgt_theme_accent", "monet");
  });
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-theme-accent", "monet");
  const value = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--accent-primary").trim()
  );
  expect(value.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\routing-theme.spec.js --grep "Monet theme applies accent tokens to the root"
```

Expected:

- FAIL because `--accent-primary` is not defined for Monet.

- [ ] **Step 3: Define semantic accent roles**

In `src/styles/tokens.css`, add Monet-capable variables:

```css
:root {
  --accent-primary: #7b6fff;
  --accent-primary-container: #d9d0ff;
  --accent-secondary: #52b788;
  --accent-tertiary: #38bdf8;
  --accent-outline: rgba(123, 111, 255, 0.35);
}

html[data-theme-accent="monet"] {
  --accent-primary: var(--monet-primary, #8b5cf6);
  --accent-primary-container: var(--monet-primary-container, #ede9fe);
  --accent-secondary: var(--monet-secondary, #0ea5a4);
  --accent-tertiary: var(--monet-tertiary, #f59e0b);
  --accent-outline: var(--monet-outline, rgba(139, 92, 246, 0.34));
}
```

- [ ] **Step 4: Map component aliases in app CSS**

In `src/styles/app.css`, replace hardcoded assumptions around `--gc` with aliases sourced from semantic roles:

```css
html[data-theme-accent="monet"] {
  --gc: var(--accent-primary);
}

.oled.dark[data-theme-accent="monet"],
html[data-theme="oled"][data-theme-accent="monet"] {
  --content-surface: rgba(5,5,5,.96);
  --content-surface-strong: #050505;
}
```

Keep OLED neutrals black while allowing Monet accents to tint focus, pills, buttons, and headers.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\routing-theme.spec.js --grep "Monet theme applies accent tokens to the root"
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/app.css tests/routing-theme.spec.js
git commit -m "feat: add monet css token layers"
```

### Task 4: Extend Scroll Autohide from Nav to Shared Mobile Chrome

**Files:**
- Modify: `src/hooks/useNavVisibility.ts`
- Modify: `src/components/ui/AppLayout.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/layout-mobile.spec.js`

- [ ] **Step 1: Write the failing mobile chrome test**

Add a mobile test that verifies a page header hides on downward scroll and returns after idle/reverse motion.

```js
test("mobile page headers auto-hide while scrolling", async ({ page }) => {
  await page.goto("/settings");
  const header = page.locator(".app-layout-header").first();

  await expect(header).toBeVisible();
  await page.mouse.wheel(0, 800);
  await expect(header).toHaveClass(/chrome--hidden/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\layout-mobile.spec.js --grep "mobile page headers auto-hide while scrolling"
```

Expected:

- FAIL because headers do not receive a hidden class.

- [ ] **Step 3: Promote nav visibility to shared chrome visibility**

Update `useNavVisibility.ts` to return:

```ts
return {
  isMobileBottomBar,
  navHiddenByScroll,
  chromeHiddenByScroll: navHiddenByScroll,
};
```

If more nuance is required, rename the internal state to `chromeHiddenByScroll` and derive nav/header visibility from it.

- [ ] **Step 4: Apply chrome visibility class to all app headers**

In `src/components/ui/AppLayout.tsx`, wrap every app-level header class with a shared hidden modifier:

```tsx
const chromeHeaderClass = `hdr page-header-compact app-layout-header${navHiddenByScroll ? " chrome--hidden" : ""}`;
```

Use it for:

- generic page header
- history subpage header
- profile/settings subpage header

- [ ] **Step 5: Add CSS motion for hidden headers**

In `src/styles/app.css`, add a mobile-only class:

```css
.app-layout-header {
  transition: transform .22s var(--ease), opacity .22s var(--ease);
}

@media (max-width: 899px) {
  .app-layout-header.chrome--hidden {
    transform: translateY(calc(-100% - 12px));
    opacity: 0;
    pointer-events: none;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\layout-mobile.spec.js --grep "mobile page headers auto-hide while scrolling"
```

Expected:

- PASS

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useNavVisibility.ts src/components/ui/AppLayout.tsx src/styles/app.css tests/layout-mobile.spec.js
git commit -m "feat: auto-hide mobile page headers with shared chrome state"
```

### Task 5: Convert UNO Family Round Entry to Aggregate Card-Type Scoring

**Files:**
- Modify: `src/components/games/UnoNewMatch.tsx`
- Optional Create: `src/components/games/uno/unoScoring.ts`
- Test: `tests/games/uno.spec.js`

- [ ] **Step 1: Write the failing UNO aggregate-scoring test**

Add a test that verifies one aggregated set of inputs drives winner scoring instead of per-loser rows.

```js
test("uno round scoring uses aggregated card-type leftovers", async ({ page }) => {
  await page.goto("/game/uno");
  await page.getByPlaceholder("Jugador 1").fill("Ana");
  await page.getByPlaceholder("Jugador 2").fill("Beto");

  await page.getByLabel(/number cards/i).fill("3");
  await page.getByLabel(/skip/i).fill("2");
  await page.getByLabel(/wild/i).fill("1");
  await page.getByRole("button", { name: /ana/i }).click();

  await expect(page.locator(".sbrow").filter({ hasText: "Ana" }).locator(".sbscore")).not.toHaveText("0");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\games\uno.spec.js --grep "aggregated card-type leftovers"
```

Expected:

- FAIL because current UI requires per-player round inputs.

- [ ] **Step 3: Extract or rewrite round scoring state**

Replace `ri` shape in `UnoNewMatch.tsx` from per-player leftovers to one aggregate round-input object.

Target shape:

```ts
interface UnoAggregateRoundInput {
  [key: string]: string | number | undefined;
}
```

And update helpers:

```ts
const [roundInput, setRoundInput] = useState<UnoAggregateRoundInput>({});
const setRoundField = (key: string, value: string) =>
  setRoundInput((current) => ({ ...current, [key]: value }));
const totalRoundPoints = table.calc(roundInput);
```

- [ ] **Step 4: Commit round points to selected winner**

Update `commitRound` to use `totalRoundPoints` once and credit only the selected winner:

```ts
const pts = table.calc(roundInput);
const nextScores = { ...scores, [winnerId]: (scores[winnerId] || 0) + pts };
```

Stop summing per-player leftovers.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\games\uno.spec.js --grep "aggregated card-type leftovers"
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/games/UnoNewMatch.tsx tests/games/uno.spec.js
git commit -m "feat: use aggregate round scoring for uno family"
```

### Task 6: Add In-Progress UNO Roster Editing with Safe Leave Semantics

**Files:**
- Modify: `src/types.ts`
- Modify: `src/components/games/UnoNewMatch.tsx`
- Test: `tests/games/uno.spec.js`

- [ ] **Step 1: Write the failing roster-edit test**

Add a test for adding a player after round 1 and removing a player while keeping them in the record.

```js
test("uno supports in-progress roster changes without rewriting prior rounds", async ({ page }) => {
  await page.goto("/game/uno");
  await page.getByPlaceholder("Jugador 1").fill("Ana");
  await page.getByPlaceholder("Jugador 2").fill("Beto");

  await page.getByLabel(/number cards/i).fill("2");
  await page.getByRole("button", { name: /ana/i }).click();

  await page.getByTestId("edit-roster").click();
  await page.getByTestId("add-player-in-progress").click();
  await page.getByPlaceholder("Jugador 3").fill("Carla");
  await page.getByTestId("save-roster").click();

  await expect(page.locator(".sbrow").filter({ hasText: "Carla" }).locator(".sbscore")).toHaveText("0");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\games\uno.spec.js --grep "in-progress roster changes"
```

Expected:

- FAIL because there is no in-progress roster editor.

- [ ] **Step 3: Extend UNO draft types**

In `src/types.ts` or the local UNO draft shape, add:

```ts
interface UnoRosterEvent {
  type: "join" | "leave";
  playerId: string;
  playerName: string;
  effectiveRound: number;
  retentionMode?: "keep-record" | "remove-safe";
}
```

And update `UnoDraft`:

```ts
rosterEvents?: UnoRosterEvent[];
inactivePlayers?: string[];
```

- [ ] **Step 4: Add roster editor UI and safe leave dialog**

In `UnoNewMatch.tsx`, add an in-progress roster editor available when `rounds > 0 || history.length > 0`.

Required controls:

- `edit roster` button
- add player action
- leave player action
- confirm modal for leave:
  - keep in record
  - cancel
  - optionally allow safe full removal only when no round impact exists

Core behavior:

```ts
const joinPlayer = (name: string) => {
  const id = mkId();
  setPlayers((current) => [...current, { id, name }]);
  setScores((current) => ({ ...current, [id]: 0 }));
  setRosterEvents((current) => [...current, {
    type: "join",
    playerId: id,
    playerName: name,
    effectiveRound: rounds + 1,
  }]);
};
```

For leave with retained record:

```ts
setInactivePlayers((current) => [...current, playerId]);
setRosterEvents((current) => [...current, {
  type: "leave",
  playerId,
  playerName: player.name,
  effectiveRound: rounds + 1,
  retentionMode: "keep-record",
}]);
```

- [ ] **Step 5: Ensure active round and future rounds use active roster only**

Update winner choices and round-entry participants so only non-inactive players can win future rounds or participate in future-round UI.

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\games\uno.spec.js --grep "in-progress roster changes"
```

Expected:

- PASS

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/components/games/UnoNewMatch.tsx tests/games/uno.spec.js
git commit -m "feat: support in-progress uno roster editing"
```

### Task 7: Make UNO Score Mini-Tiles Prioritize Name Visibility

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/components/games/UnoNewMatch.tsx`
- Test: `tests/layout-mobile.spec.js`

- [ ] **Step 1: Write the failing mobile layout test**

Add a test with several players and long names to verify scoreboard names stay visible more reliably.

```js
test("uno scoreboard prioritizes player name visibility on narrow screens", async ({ page }) => {
  await page.goto("/game/uno");
  await page.getByPlaceholder("Jugador 1").fill("Alejandra");
  await page.getByPlaceholder("Jugador 2").fill("Maximiliano");
  await page.getByTestId("add-player").click();
  await page.getByPlaceholder("Jugador 3").fill("Valentina");

  const widths = await page.locator(".sbname").evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().width)
  );
  expect(widths.every((value) => value > 48)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\layout-mobile.spec.js --grep "scoreboard prioritizes player name visibility"
```

Expected:

- FAIL because the current scoreboard uses rigid width distribution.

- [ ] **Step 3: Relax rigid scoreboard widths**

Update `src/styles/app.css` around scoreboard classes:

```css
.sbrow {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 36px minmax(40px, 56px);
  gap: 8px;
  align-items: center;
}

.sbname {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sbprog {
  width: auto;
  min-width: 28px;
}
```

Prioritize `sbname` before progress decoration.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\layout-mobile.spec.js --grep "scoreboard prioritizes player name visibility"
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/app.css src/components/games/UnoNewMatch.tsx tests/layout-mobile.spec.js
git commit -m "fix: improve uno scoreboard name visibility"
```

### Task 8: Document the Monet Bridge and UNO Roster Model

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add theme architecture docs**

Document:

- `themeMode`
- `themeAccentMode`
- `oledEnabled`
- browser fallback vs Android dynamic color bridge

Example section:

```md
### Theme layers

- `bgt_theme_mode`: `light | dark | system`
- `bgt_theme_accent`: `default | monet`
- `bgt_oled`: `"1"` when OLED dark surfaces are enabled

Monet in browser-only mode uses local fallback roles.
Real Android dynamic color requires an external bridge that injects Material You roles into the web runtime.
```

- [ ] **Step 2: Add UNO roster behavior docs**

Document:

- aggregate round scoring
- join/leave semantics
- retained-record recommendation

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: describe monet bridge and uno roster model"
```

### Task 9: Run Final Verification

**Files:**
- Test: `tests/settings-accessibility.spec.js`
- Test: `tests/routing-theme.spec.js`
- Test: `tests/games/uno.spec.js`
- Test: `tests/layout-mobile.spec.js`

- [ ] **Step 1: Run targeted theme and settings tests**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\settings-accessibility.spec.js tests\routing-theme.spec.js
```

Expected:

- PASS

- [ ] **Step 2: Run targeted UNO tests**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\games\uno.spec.js
```

Expected:

- PASS

- [ ] **Step 3: Run targeted mobile layout tests**

Run:

```bash
node .\node_modules\playwright\cli.js test --project=logic tests\layout-mobile.spec.js
```

Expected:

- PASS

- [ ] **Step 4: Run build verification**

Run:

```bash
node .\node_modules\vite\bin\vite.js build
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verify monet theme and uno roster changes"
```

---

## Self-Review

- Spec coverage:
  - Monet theme state: covered in Tasks 1-3
  - Settings UX: covered in Task 2
  - Header autohide: covered in Task 4
  - UNO aggregate scoring: covered in Task 5
  - UNO roster editing: covered in Task 6
  - Score tile visibility: covered in Task 7
  - Documentation: covered in Task 8
  - Verification: covered in Task 9

- Placeholder scan:
  - No `TBD`
  - No cross-task “similar to task N” references for execution-critical behavior
  - Commands and expected outcomes included

- Type consistency:
  - `ThemeAccentMode`, `DynamicThemeRoles`, and `UnoRosterEvent` are defined before downstream use
  - `themeAccentMode` and `handleThemeAccentMode` naming is consistent across theme and settings tasks

Plan complete and saved to `docs/superpowers/plans/2026-05-25-monet-uno-roster-implementation.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
