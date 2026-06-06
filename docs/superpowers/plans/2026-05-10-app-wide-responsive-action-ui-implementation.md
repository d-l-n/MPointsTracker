# App-Wide Responsive Action UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the new Games action-card visual system to the entire app, remove emoji-led structural UI, eliminate lazy loading, and make desktop/tablet match mobile semantics while adapting only for width.

**Architecture:** Keep the current routing and page ownership intact, but converge page chrome, cards, chips, tabs, and list surfaces into a single shared visual language rooted in the current Games home. Prefer incremental refactors through shared CSS primitives and focused page updates over a broad rewrite.

**Tech Stack:** React, React Router, Vite, shared CSS files in `src/styles/`, Playwright test suite.

## Amendment Snapshot — 2026-05-10

Use this snapshot as the authoritative continuation point for Task 4 onward:

- Home filters must expose a filtered no-results state.
- Remove the `Recientes` filter chip.
- Merge visible game-detail `History` + `Stats` into a single visible `Estadísticas` surface, while preserving navigation contracts as much as possible.
- Keep the Games filter ribbon horizontal, single-row, and scrollable.
- Keep only structural chrome sticky. In Games, that means the top header plus the filter ribbon. Featured/recent/group headings are not sticky headers.
- Auto-hide on scroll applies only to the mobile bottom bar. The desktop sidebar remains visible at all times.
- Continue using local verification commands only; do not rely on version-control workflow steps inside this plan.

---

## File Map

### Shared shell, routing, and loading

- Modify: `src/App.tsx`
- Modify: `src/pages/GameDetail.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/base.css`

### Home and shared game surfaces

- Modify: `src/components/home/HomeActionCard.tsx`
- Modify: `src/components/home/HomeGameHero.tsx`
- Modify: `src/components/home/HomeTab.tsx`
- Modify: `src/components/home/homeModel.ts`

### Cross-game views

- Modify: `src/pages/GlobalHistoryPage.tsx`
- Modify: `src/pages/HeadToHeadPage.tsx`
- Modify: `src/pages/RulesPage.tsx`
- Modify: `src/pages/ChampsPage.tsx`
- Modify: `src/pages/PublicProfilePage.tsx`

### Settings and utility views

- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/FeedbackPage.tsx`
- Modify: `src/pages/AdminPage.tsx`

### Tests

- Modify: `tests/home-action-cards.spec.js`
- Modify: `tests/navigation.spec.js`
- Modify: `tests/routing-theme.spec.js`
- Modify: `tests/settings-accessibility.spec.js`
- Modify: `tests/layout.spec.js`
- Modify: `tests/layout-mobile.spec.js`
- Modify: `tests/history.spec.js`
- Modify: `tests/rules.spec.js`
- Modify: `tests/champions.spec.js`
- Modify or add: targeted tests under `tests/games/*.spec.js` only if the page-chrome changes require them

### Documentation

- Modify: `docs/superpowers/specs/2026-05-10-app-wide-responsive-action-ui-design.md`
- Modify: `docs/superpowers/plans/2026-05-10-app-wide-responsive-action-ui-implementation.md`

---

### Task 1: Remove section and game lazy loading

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/GameDetail.tsx`
- Test: `tests/navigation.spec.js`
- Test: `tests/routing-theme.spec.js`

- [ ] **Step 1: Write the failing verification notes and targeted test adjustments**

Add assertions in existing navigation-focused tests that section navigation does not rely on a fallback loader on first entry. Reuse current page transitions rather than creating a synthetic benchmark.

Example expectation shape:

```js
await page.locator('[data-testid="nav-pill-rules"]').click();
await expect(page.locator('text=Cargando')).toHaveCount(0);
await expect(page.locator('[data-testid="tab-new"]')).toHaveCount(0);
```

- [ ] **Step 2: Run targeted tests to confirm the current lazy behavior is still possible**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/navigation.spec.js" "tests/routing-theme.spec.js"
```

Expected: either an explicit failing loader assertion or evidence that the current code still uses `lazy` and `Suspense`.

- [ ] **Step 3: Replace app section lazy imports with eager imports**

In `src/App.tsx`, replace:

```js
const importGameDetail = () => import("./pages/GameDetail.jsx");
const GameDetail = lazy(importGameDetail);
```

with direct imports:

```js
import GameDetail from "./pages/GameDetail.jsx";
import RulesPage from "./pages/RulesPage.jsx";
import ChampsPage from "./pages/ChampsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import PublicProfilePage from "./pages/PublicProfilePage.jsx";
import GlobalHistoryPage from "./pages/GlobalHistoryPage.jsx";
```

Then remove `PRELOAD_IMPORTS`, page-level `lazy(...)`, and section-level `Suspense` wrappers that only existed for route loading.

- [ ] **Step 4: Replace lazy-loaded game match components with eager imports**

In `src/pages/GameDetail.tsx`, replace all `lazy(() => import(...))` game imports with direct imports and remove `GameLoadingFallback` plus the `Suspense` wrapper around `GameTabContent`.

Target shape:

```js
import UnoNewMatch from "../components/games/UnoNewMatch.jsx";
import TrucoNewMatch from "../components/games/TrucoNewMatch.jsx";
```

Also remove the `useEffect` preloading block because it becomes obsolete once eager imports are in place.

- [ ] **Step 5: Run targeted tests again**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/navigation.spec.js" "tests/routing-theme.spec.js"
```

Expected: pass, with no loader-related regressions.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/pages/GameDetail.tsx tests/navigation.spec.js tests/routing-theme.spec.js
git commit -m "refactor: remove lazy loading from app sections and games"
```

---

### Task 2: Create shared non-emoji page chrome and compact surface primitives

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/app.css`
- Modify: `src/styles/base.css`
- Test: `tests/layout.spec.js`
- Test: `tests/layout-mobile.spec.js`

- [ ] **Step 1: Write targeted layout expectations**

Add or update tests so they validate:

- no overflow regressions in compact desktop/tablet layout
- headers and grouped surfaces still fit mobile
- nav and overlay behavior remain stable

Example expectation shape:

```js
await expect(page.locator('.page')).toBeVisible();
await expect(page.locator('.nav')).toBeVisible();
```

- [ ] **Step 2: Run current layout tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test "tests/layout.spec.js" "tests/layout-mobile.spec.js" --project=mobile-small --project=mobile-large --project=tablet
```

Expected: establish the current baseline before CSS refactor.

- [ ] **Step 3: Add shared CSS primitives for the new system**

Introduce or normalize CSS classes for:

- compact page headers
- section labels
- dense surface cards
- utility rails
- compact list rows
- width-aware page grids

Suggested class families:

```css
.page-shell {}
.page-header-compact {}
.page-title-block {}
.page-kicker {}
.surface-card {}
.surface-card--dense {}
.surface-grid {}
.utility-chip-row {}
.list-card {}
.list-card-meta {}
```

Keep `--gc` and existing tokens as anchors. Reuse existing radius, border, and glass variables before adding new ones.

- [ ] **Step 4: Define responsive rules that preserve mobile semantics**

In shared CSS, add breakpoints that:

- keep single-column structure on mobile
- allow denser two-column grouping on tablet and desktop
- do not introduce sidebars that change reading order

Target shape:

```css
@media (min-width: 900px) {
  .surface-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 5: Run layout tests again**

Run:

```powershell
node .\node_modules\playwright\cli.js test "tests/layout.spec.js" "tests/layout-mobile.spec.js" --project=mobile-small --project=mobile-large --project=tablet
```

Expected: pass after the shared CSS groundwork.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/components.css src/styles/app.css src/styles/base.css tests/layout.spec.js tests/layout-mobile.spec.js
git commit -m "feat: add shared responsive action-ui surface primitives"
```

---

### Task 3: Remove emoji-led structural UI from games and shared headers

**Files:**
- Modify: `src/pages/GameDetail.tsx`
- Modify: `src/pages/GlobalHistoryPage.tsx`
- Modify: `src/pages/HeadToHeadPage.tsx`
- Modify: `src/pages/RulesPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/PublicProfilePage.tsx`
- Modify: `src/pages/ChampsPage.tsx`
- Modify: `src/pages/AdminPage.tsx`
- Test: `tests/history.spec.js`
- Test: `tests/rules.spec.js`
- Test: `tests/champions.spec.js`
- Test: `tests/settings-accessibility.spec.js`

- [ ] **Step 1: Write failing tests or strengthen current assertions**

Add assertions that structural headers and filters use text/color treatment without emoji prefixes where applicable.

Example shape:

```js
await expect(page.locator('.rule-game-emoji')).toHaveCount(0);
await expect(page.locator('.htitle')).not.toContainText('🎮');
```

- [ ] **Step 2: Run page-specific tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/history.spec.js" "tests/rules.spec.js" "tests/champions.spec.js" "tests/settings-accessibility.spec.js"
```

Expected: fail where emoji-led chrome is still present.

- [ ] **Step 3: Remove emoji use from page chrome and structural lists**

Make focused page updates:

- `GameDetail.jsx`: remove `game.emoji` from the title row and replace it with color/badge/header treatment
- `GlobalHistoryPage.jsx`: remove emoji from filter buttons, empty states if decorative-only, and game badges where emoji is primary
- `HeadToHeadPage.jsx`: remove combat/game emojis from structural headings and repeated cards
- `RulesPage.jsx`: replace emoji-leading rule rows with compact accent-led rows
- `SettingsPage.jsx`: remove emoji icons from rows, theme options, and chips that are structural rather than content

Keep semantic labels and `data-testid` contracts intact unless a targeted update is required in the same patch.

- [ ] **Step 4: Run the same page-specific tests again**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/history.spec.js" "tests/rules.spec.js" "tests/champions.spec.js" "tests/settings-accessibility.spec.js"
```

Expected: pass, confirming emoji removal did not break flows.

- [ ] **Step 5: Commit**

```bash
git add src/pages/GameDetail.tsx src/pages/GlobalHistoryPage.tsx src/pages/HeadToHeadPage.tsx src/pages/RulesPage.tsx src/pages/SettingsPage.tsx src/pages/PublicProfilePage.tsx src/pages/ChampsPage.tsx src/pages/AdminPage.tsx tests/history.spec.js tests/rules.spec.js tests/champions.spec.js tests/settings-accessibility.spec.js
git commit -m "refactor: remove emoji-led structural ui across shared pages"
```

---

### Task 4: Align Home and Game Detail to the compact shared system

**Files:**
- Modify: `src/components/home/HomeActionCard.tsx`
- Modify: `src/components/home/HomeGameHero.tsx`
- Modify: `src/components/home/HomeTab.tsx`
- Modify: `src/components/home/homeModel.ts`
- Modify: `src/pages/GameDetail.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/home-action-cards.spec.js`
- Test: `tests/games/uno.spec.js`
- Test: `tests/games/truco.spec.js`

- [ ] **Step 1: Extend action-card and detail tests for compact shared chrome**

Add assertions that:

- quick actions remain present and ordered
- card tap vs quick-action tap still stays separated
- detail header remains functional after visual compacting

Example:

```js
await expect(page.locator('[data-testid="game-uno-action-new"]')).toBeVisible();
await expect(page.locator('[data-testid="tab-history"]')).toBeVisible();
```

- [ ] **Step 2: Run targeted home and game tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/home-action-cards.spec.js" "tests/games/uno.spec.js" "tests/games/truco.spec.js"
```

- [ ] **Step 3: Compact home and detail surfaces without changing semantics**

Apply focused updates:

- reduce header chrome height
- align badges, metadata, and tabs to shared compact rules
- ensure desktop/tablet use extra width through denser grouping, not new behaviors
- preserve quick actions exactly as approved

Do not change:

- card tap destination
- quick-action contracts
- draft/resume behavior
- tab meaning

- [ ] **Step 4: Run the same targeted tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/home-action-cards.spec.js" "tests/games/uno.spec.js" "tests/games/truco.spec.js"
```

Expected: pass with interaction behavior unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HomeActionCard.tsx src/components/home/HomeGameHero.tsx src/components/home/HomeTab.tsx src/components/home/homeModel.ts src/pages/GameDetail.tsx src/styles/app.css tests/home-action-cards.spec.js tests/games/uno.spec.js tests/games/truco.spec.js
git commit -m "feat: align home and game detail with compact shared action-ui"
```

---

### Task 5: Migrate history, rules, head-to-head, and champions surfaces

**Files:**
- Modify: `src/pages/GlobalHistoryPage.tsx`
- Modify: `src/pages/RulesPage.tsx`
- Modify: `src/pages/HeadToHeadPage.tsx`
- Modify: `src/pages/ChampsPage.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/history.spec.js`
- Test: `tests/rules.spec.js`
- Test: `tests/champions.spec.js`

- [ ] **Step 1: Strengthen tests around list usability and filters**

Add assertions for:

- history search and filters still work
- rules remain openable and readable
- champions remains navigable

Example:

```js
await page.getByTestId('history-filter-game-all').click();
await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();
```

- [ ] **Step 2: Run targeted tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/history.spec.js" "tests/rules.spec.js" "tests/champions.spec.js"
```

- [ ] **Step 3: Convert these pages to the shared dense-surface language**

Implementation goals:

- history becomes denser and more scannable without losing edit/delete clarity
- rules cards use the same compact card logic and cleaner header rows
- head-to-head score, by-game, and recent-match cards align to shared surfaces
- champions uses the same section and card grammar rather than an older distinct motif

- [ ] **Step 4: Re-run the targeted tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/history.spec.js" "tests/rules.spec.js" "tests/champions.spec.js"
```

Expected: pass with preserved interaction and improved consistency.

- [ ] **Step 5: Commit**

```bash
git add src/pages/GlobalHistoryPage.tsx src/pages/RulesPage.tsx src/pages/HeadToHeadPage.tsx src/pages/ChampsPage.tsx src/styles/app.css tests/history.spec.js tests/rules.spec.js tests/champions.spec.js
git commit -m "feat: migrate history rules and champions to shared action-ui"
```

---

### Task 6: Migrate settings, profiles, about, feedback, and admin surfaces

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/PublicProfilePage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/FeedbackPage.tsx`
- Modify: `src/pages/AdminPage.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/settings-accessibility.spec.js`
- Test: `tests/routing-theme.spec.js`

- [ ] **Step 1: Add or tighten settings/profile assertions**

Cover:

- settings navigation remains accessible
- profile view still opens
- theme/settings pages remain navigable after compacting surfaces

Example:

```js
await page.getByTestId('settings-row-prefs').click();
await expect(page.getByTestId('reduce-effects-toggle')).toBeVisible();
```

- [ ] **Step 2: Run targeted tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/settings-accessibility.spec.js" "tests/routing-theme.spec.js"
```

- [ ] **Step 3: Rebuild utility pages using the shared design language**

Implementation goals:

- row and card styling matches the compact action-ui system
- profile and about pages no longer feel visually detached from Games
- admin remains functional but visually aligned
- no desktop-only alternate layout logic appears

- [ ] **Step 4: Re-run the targeted tests**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/settings-accessibility.spec.js" "tests/routing-theme.spec.js"
```

Expected: pass with settings/profile behavior preserved.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx src/pages/PublicProfilePage.tsx src/pages/SettingsPage.tsx src/pages/FeedbackPage.tsx src/pages/AdminPage.tsx src/styles/app.css tests/settings-accessibility.spec.js tests/routing-theme.spec.js
git commit -m "feat: align settings profiles and utility pages with shared action-ui"
```

---

### Task 7: Full responsive sweep and contract verification

**Files:**
- Modify: any touched files from prior tasks only as needed
- Test: `tests/navigation.spec.js`
- Test: `tests/layout.spec.js`
- Test: `tests/layout-mobile.spec.js`
- Test: `tests/home-action-cards.spec.js`
- Test: `tests/history.spec.js`
- Test: `tests/rules.spec.js`
- Test: `tests/champions.spec.js`
- Test: `tests/settings-accessibility.spec.js`

- [ ] **Step 1: Run the main logic regression suite**

Run:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/home-action-cards.spec.js" "tests/navigation.spec.js" "tests/history.spec.js" "tests/rules.spec.js" "tests/champions.spec.js" "tests/settings-accessibility.spec.js" "tests/routing-theme.spec.js"
```

- [ ] **Step 2: Run the responsive layout suite**

Run:

```powershell
node .\node_modules\playwright\cli.js test "tests/layout-mobile.spec.js" --project=mobile-small --project=mobile-large --project=tablet
```

- [ ] **Step 3: Run a production build**

Run:

```powershell
node .\node_modules\vite\bin\vite.js build
```

Expected: build succeeds cleanly after eager loading and CSS refactors.

- [ ] **Step 4: Perform manual visual verification**

Verify in-browser:

- dark, light, OLED
- desktop and tablet widths
- card legibility over hero SVGs
- header density
- absence of emoji-led structural UI
- no layout divergence from mobile semantics

- [ ] **Step 5: Commit final fixes if any verification gaps were found**

```bash
git add <touched-files>
git commit -m "fix: resolve final responsive action-ui regressions"
```

---

### Task 8: Documentation review and closeout

**Files:**
- Modify: `docs/superpowers/specs/2026-05-10-app-wide-responsive-action-ui-design.md` only if implementation clarifies a real requirement
- Modify: `docs/superpowers/plans/2026-05-10-app-wide-responsive-action-ui-implementation.md` only if execution reality requires precise updates

- [ ] **Step 1: Compare implementation against the approved spec**

Checklist:

- all shared pages migrated to the same system
- no lazy loading remains for app sections and game screens
- no emoji-led structural UI remains
- desktop matches mobile semantics
- compactness does not break touch/readability

- [ ] **Step 2: Update docs only if behavior meaningfully changed during implementation**

If no doc changes are needed, record that explicitly in the final delivery.

- [ ] **Step 3: Prepare final verification evidence**

Collect:

- exact Playwright commands run
- exact build command run
- manual visual checks completed
- residual risks, especially bundle-size tradeoffs and any pages with unavoidable legacy remnants

- [ ] **Step 4: Commit documentation updates if any**

```bash
git add docs/superpowers/specs/2026-05-10-app-wide-responsive-action-ui-design.md docs/superpowers/plans/2026-05-10-app-wide-responsive-action-ui-implementation.md
git commit -m "docs: align responsive action-ui documentation"
```

---

## Risks and Implementation Notes

- Removing lazy loading will likely increase the initial JS payload. Measure build output after Task 1 and again after the full migration.
- `SettingsPage.jsx` is currently dense and likely benefits from extracting small presentational helpers only if the file becomes unmanageable during visual cleanup.
- `GameDetail.jsx` and shared CSS changes are compatibility-sensitive. Preserve routing, draft, rematch, and `data-testid` behavior unless a test-backed change is required.
- Desktop responsiveness must not turn into a parallel design system. If a layout idea changes workflow order, reject it.

## Validation Strategy

Primary verification commands:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/home-action-cards.spec.js" "tests/navigation.spec.js" "tests/history.spec.js" "tests/rules.spec.js" "tests/champions.spec.js" "tests/settings-accessibility.spec.js" "tests/routing-theme.spec.js"
node .\node_modules\playwright\cli.js test "tests/layout-mobile.spec.js" --project=mobile-small --project=mobile-large --project=tablet
node .\node_modules\vite\bin\vite.js build
```

Secondary targeted commands during execution:

```powershell
node .\node_modules\playwright\cli.js test --project=logic "tests/games/uno.spec.js" "tests/games/truco.spec.js"
node .\node_modules\playwright\cli.js test --project=logic "tests/history.spec.js" "tests/rules.spec.js"
```

## Self-Review

- Spec coverage: the plan covers app-wide migration, lazy-loading removal, emoji removal, compact responsive alignment, shared surface normalization, and verification.
- Placeholder scan: no `TODO` or unresolved steps remain.
- Type consistency: paths, page names, and verification commands match the current repo structure inspected before writing the plan.
