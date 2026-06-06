# Action Game Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the home catalog around action cards with card-tap navigation, state-aware quick actions, generative hero SVGs, and a more operational mobile-first home layout without breaking existing routing, `data-testid` hooks, or shared game-detail contracts unless explicitly updated.

**Architecture:** Keep routing ownership in `src/App.tsx`, but stop rendering raw `gcard` rows inline. Introduce a small home-card view model plus dedicated presentational components for action cards and hero SVGs, then layer the new home information architecture on top of the same `GAMES`, `useDraft`, `useMatches`, and `GameDetail` flows that already exist. Preserve current game detail tabs and route structure, and make quick actions translate into the same underlying selection/history navigation state instead of inventing a parallel navigation system.

**Tech Stack:** React 19, Vite, React Router 7, app-local draft persistence via `useDraft`, app-local match storage via `useMatches`, CSS custom properties in `src/styles/*.css`, Playwright logic/layout tests

---

### File Map

**Create:**
- `C:/Users/dylan/mpoints-tracker/src/components/home/HomeActionCard.tsx`
- `C:/Users/dylan/mpoints-tracker/src/components/home/HomeActionCard.tsx`
- `C:/Users/dylan/mpoints-tracker/src/components/home/HomeGameHero.tsx`
- `C:/Users/dylan/mpoints-tracker/src/components/home/homeModel.ts`
- `C:/Users/dylan/mpoints-tracker/tests/home-action-cards.spec.js`

**Modify:**
- `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- `C:/Users/dylan/mpoints-tracker/src/data/games.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/es.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/en.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/de.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/fr.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/ja.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/zh.ts`
- `C:/Users/dylan/mpoints-tracker/src/styles/app.css`
- `C:/Users/dylan/mpoints-tracker/src/styles/components.css`
- `C:/Users/dylan/mpoints-tracker/tests/helpers.js`
- `C:/Users/dylan/mpoints-tracker/tests/layout-mobile.spec.js`
- `C:/Users/dylan/mpoints-tracker/tests/navigation.spec.js`
- `C:/Users/dylan/mpoints-tracker/tests/i18n-locales.spec.js`

**Documentation review:**
- `C:/Users/dylan/mpoints-tracker/docs/superpowers/specs/2026-05-10-action-game-cards-design.md`
- `C:/Users/dylan/mpoints-tracker/docs/agents/frontend-rules.md`

### Risks

- Card tap vs quick-action tap ambiguity can cause accidental navigation if events are not isolated at the button level.
- Featured continuation plus new action-card sections can break vertical rhythm or introduce mobile overflow if heights are not explicitly constrained.
- Hero SVG overlays can reduce title/meta contrast in dark/light/OLED if the art intensity is not capped by shared scrims.
- Reworking the home layout inside `App.tsx` can unintentionally break existing `openGame()` test flows if `data-testid="game-*"` or group wrappers disappear without test updates.
- Quick-action semantics can drift from the spec if `Continuar` leaves an empty slot or if “Estadísticas” stops mapping to the current history/stats entry behavior.

### Validation Strategy

- Logic/UI contract:
  - `node .\node_modules\playwright\cli.js test --project=logic tests\home-action-cards.spec.js`
  - Verify quick-action presence/order, no empty slot when there is no draft, card tap opens detail, and quick-action taps do not open detail accidentally.
- Shared navigation regressions:
  - `node .\node_modules\playwright\cli.js test --project=logic tests\navigation.spec.js tests\i18n-locales.spec.js`
- Mobile/layout regressions:
  - `node .\node_modules\playwright\cli.js test --project=logic tests\layout-mobile.spec.js`
- Translation parity:
  - `node .\node_modules\playwright\cli.js test --project=logic tests\translations-parity.spec.js`
- Production safety:
  - `node .\node_modules\vite\bin\vite.js build`

### Phase 1: Build the home-card view model and navigation contracts

**Files:**
- Create: `C:/Users/dylan/mpoints-tracker/src/components/home/homeModel.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/helpers.js`
- Test: `C:/Users/dylan/mpoints-tracker/tests/home-action-cards.spec.js`

- [ ] Derive a single home-card state object per game from `GAMES`, `getMatches(gameId)`, and `getDraft(gameId)`, including:
  - `hasDraft`
  - `matchCount`
  - `latestMatchDate`
  - `isRecent`
  - `isFavoriteCandidate`
  - `badge`
  - `metadata`
  - ordered quick actions where `continue` exists only when a continuable draft exists.
- [ ] Keep the primary card action mapped to the current `openGame(gameId)` flow so tapping the card still reaches the same detail route (`/game/:id`).
- [ ] Add explicit handlers for:
  - `continue` -> open the same game detail on `tab="new"` without clearing the draft
  - `new` -> clear existing draft if the user explicitly starts over, then open the same game detail on `tab="new"`
  - `stats` -> open current game detail stats or current game history flow according to existing contracts; prefer the existing stats tab unless the current implementation requires the history route.
- [ ] Preserve `data-testid="game-${game.id}"` on the main tappable card surface and add stable quick-action test IDs like:
  - `data-testid="game-${game.id}-action-continue"`
  - `data-testid="game-${game.id}-action-new"`
  - `data-testid="game-${game.id}-action-stats"`
- [ ] Write the initial failing Playwright cases before implementation:
  - card tap opens detail
  - draft shows `continue` first
  - no-draft state only shows `new` and `stats`
  - missing `continue` does not leave a third placeholder element
  - tapping a quick action does not trigger the card-level click.

### Phase 2: Implement action-card components, hero SVG system, and home IA

**Files:**
- Create: `C:/Users/dylan/mpoints-tracker/src/components/home/HomeActionCard.tsx`
- Create: `C:/Users/dylan/mpoints-tracker/src/components/home/HomeActionCard.tsx`
- Create: `C:/Users/dylan/mpoints-tracker/src/components/home/HomeGameHero.tsx`
- Modify: `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/games.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/styles/app.css`
- Modify: `C:/Users/dylan/mpoints-tracker/src/styles/components.css`

- [ ] Extract the current inline `HomeTab` game-row rendering into composable home components while leaving `HomeTab` as the container/orchestrator for data gathering and section ordering.
- [ ] Reorganize the home screen around:
  - compact header
  - utility-level search/filter rail placeholder or existing control slot if available
  - optional featured continuation card when any continuable draft exists
  - main action-card grid/list ordered by relevance before legacy taxonomy.
- [ ] Preserve current group discoverability in some form, but stop making collapsible groups the dominant visual unit if that conflicts with the approved action-card IA.
- [ ] Implement the shared hero SVG grammar in `GameCardHero.jsx` with per-game parameters from `src/data/games.ts`, using:
  - panoramic layout
  - 2 to 4 large layers
  - `--gc`-anchored tonal variation
  - state intensity knobs for idle / recent / in-progress
  - an overlay scrim that guarantees readable text across light, dark, and OLED.
- [ ] Extend `src/data/games.ts` with non-breaking optional metadata per game for the hero system, for example:
  - `heroFamily`
  - `heroSymbolSet`
  - `heroDensity`
  - `heroAngle`
  These must be additive only; do not break existing consumers of `GAMES`.
- [ ] Keep the card structure stable across all states:
  - hero zone
  - info zone
  - quick-action rail
  - restrained badge layer.
- [ ] Make quick actions lightweight pills/ghost controls, not heavy CTA bricks, and keep touch targets at or above the repo’s `40px` mobile minimum.
- [ ] Ensure the featured continuation card is a named stronger variant of the same card language, not a separate unrelated widget.

### Phase 3: Add translations, theme fidelity, and regression coverage

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/es.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/en.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/de.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/fr.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/ja.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/zh.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/home-action-cards.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/layout-mobile.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/navigation.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/i18n-locales.spec.js`

- [ ] Route every new label through translations, including:
  - quick actions (`continue`, `newMatch`, `stats`)
  - home search placeholder if changed
  - badges such as recent/in-progress/favorite if surfaced
  - featured continuation copy.
- [ ] Keep locale parity across all supported dictionaries in the same change.
- [ ] Add Playwright coverage for:
  - quick-action order/presence
  - no-gap behavior when `continue` is absent
  - light/dark/oled visibility of text over hero art
  - mobile scroll/overflow with long lists
  - safe interaction separation between card press and quick-action press.
- [ ] Update any helper that assumed group-open behavior if the new home layout no longer relies on collapsible sections to open a game.

### Phase 4: Documentation review, final verification, and delivery gate

**Files:**
- Modify if needed: `C:/Users/dylan/mpoints-tracker/docs/agents/frontend-rules.md`
- Modify if needed: `C:/Users/dylan/mpoints-tracker/docs/superpowers/specs/2026-05-10-action-game-cards-design.md`

- [ ] Confirm whether documentation changes are needed because the shipped implementation changes shared UI/testing contracts.
- [ ] If no documentation file needs edits, explicitly record that the spec already covers the new behavior and only implementation/test coverage changed.
- [ ] Run the full targeted verification set listed above after implementation, not before.
- [ ] Re-read the spec and check each required behavior against the shipped code:
  - card tap enters game detail
  - `Continuar` appears only for resumable state
  - no empty quick-action slot when `Continuar` is absent
  - home is reorganized around action cards
  - each game uses a consistent hero SVG family
  - dark/light/oled remain legible
  - mobile UX remains stable.
- [ ] Do not claim completion if any targeted Playwright run or build command fails; fix or report the exact gap with evidence.
