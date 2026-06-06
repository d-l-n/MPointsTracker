# Agent Execution Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an English `docs/agents/` documentation package that helps AI agents execute common tasks in this repo with clear routing, constraints, and verification guidance.

**Architecture:** Add one short central guide plus five focused support docs under `docs/agents/`. Derive content from current repo truth (`src/*`, `public/*`, `firestore.rules`, `package.json`, `playwright.config.js`, `AGENTS.md`, `README.md`, `DESIGN.md`) and keep the package operational, concise, and link-heavy rather than duplicative.

**Tech Stack:** Markdown documentation, React/Vite/Firebase codebase references, Playwright verification guidance

---

## File Structure

- Create: `docs/agents/README.md`
- Create: `docs/agents/architecture.md`
- Create: `docs/agents/testing-and-verification.md`
- Create: `docs/agents/frontend-rules.md`
- Create: `docs/agents/runbooks/add-or-change-a-game.md`
- Create: `docs/agents/runbooks/data-auth-sync.md`
- Reference: `AGENTS.md`
- Reference: `README.md`
- Reference: `DESIGN.md`
- Reference: `package.json`
- Reference: `playwright.config.js`
- Reference: `firestore.rules`
- Reference: `src/App.tsx`
- Reference: `src/context/AppContext.tsx`
- Reference: `src/hooks/useAuth.ts`
- Reference: `src/hooks/useMatches.ts`
- Reference: `src/pages/GameDetail.tsx`
- Reference: `src/data/games.ts`
- Reference: `src/data/rules.ts`
- Reference: `src/data/translations.ts`
- Reference: `src/lib/storage.ts`
- Reference: `src/lib/inviteService.ts`
- Reference: `src/services/userService.ts`
- Reference: `src/services/matchService.ts`

### Task 1: Create the Central Agent Guide

**Files:**
- Create: `docs/agents/README.md`
- Reference: `AGENTS.md`
- Reference: `README.md`
- Reference: `DESIGN.md`
- Reference: `package.json`
- Reference: `playwright.config.js`

- [ ] **Step 1: Draft the central guide with the approved section structure**

```md
# Agent Docs

## Purpose of This Package

Use these docs to execute tasks in this repository. Start here before making changes.

## Start Here

1. Read `AGENTS.md` for workflow expectations.
2. Read this file for repo-specific execution guidance.
3. Open the support doc that matches the task type.
4. Inspect the named code paths before editing.
5. Run the smallest sufficient verification set before completion.

## Source of Truth

- Workflow: `AGENTS.md`
- Agent execution docs: `docs/agents/*`
- Runtime implementation truth: `src/*`, `public/*`, `firestore.rules`, `package.json`, `playwright.config.js`
- Design language: `DESIGN.md`
- Historical feature rationale: `docs/superpowers/specs/*`, `docs/superpowers/plans/*`
```

- [ ] **Step 2: Add repo mental model, task triage, and hard constraints**

```md
## Repo Mental Model

- `src/App.tsx` orchestrates the shell, auth gates, navigation, sub-pages, and save flow.
- `src/hooks/useAuth.ts` owns auth lifecycle and initial cloud/bootstrap loading.
- `src/hooks/useMatches.ts` owns local persistence, debounced cloud sync, and match mutations.
- `src/services/*` owns Firebase and Firestore calls.
- `src/data/*` owns catalog, rules, and translations.
- `src/pages/*` composes higher-level flows.
- `src/components/games/*` owns game-specific match UIs.

## Task Triage

- UI/layout/copy: open `frontend-rules.md`
- Game changes: open `runbooks/add-or-change-a-game.md`
- Storage/history/stats changes: open `architecture.md` and `testing-and-verification.md`
- Auth/invite/public-data changes: open `runbooks/data-auth-sync.md`
- Verification selection: open `testing-and-verification.md`

## Hard Constraints

- Do not hardcode user-facing strings.
- Do not invent Firestore structures or public/private data rules.
- Preserve multi-viewport behavior.
- Preserve stable `data-testid` hooks where possible.
- Prefer existing module boundaries before introducing new ones.
```

- [ ] **Step 3: Add docs map and historical-spec guidance**

```md
## Docs Map

- `architecture.md`: where runtime behavior lives
- `testing-and-verification.md`: which verification to run by change type
- `frontend-rules.md`: frontend invariants and design handoff rules
- `runbooks/add-or-change-a-game.md`: checklist for game work
- `runbooks/data-auth-sync.md`: checklist for auth, persistence, sync, and public/shared data

## When to Open Historical Specs

Open `docs/superpowers/specs/*` and `docs/superpowers/plans/*` only when you are touching an area that already has feature-specific rationale there. Treat them as historical decision records, not evergreen implementation truth.
```

- [ ] **Step 4: Review for concision, duplicated statements, and broken relative links**

Run:

```powershell
Get-Content docs/agents/README.md
```

Expected: a short operational entrypoint with working relative file references and no sections that duplicate `README.md` or `DESIGN.md`.

- [ ] **Step 5: Commit**

```bash
git add docs/agents/README.md
git commit -m "docs: add agent execution entry guide"
```

### Task 2: Write the Architecture Reference

**Files:**
- Create: `docs/agents/architecture.md`
- Reference: `src/App.tsx`
- Reference: `src/context/AppContext.tsx`
- Reference: `src/hooks/useAuth.ts`
- Reference: `src/hooks/useMatches.ts`
- Reference: `src/pages/GameDetail.tsx`
- Reference: `src/data/games.ts`
- Reference: `src/data/rules.ts`
- Reference: `src/data/translations.ts`
- Reference: `src/services/userService.ts`
- Reference: `src/services/matchService.ts`
- Reference: `src/lib/storage.ts`
- Reference: `src/lib/inviteService.ts`

- [ ] **Step 1: Write application flow and module boundary sections**

```md
# Architecture for Agents

## Application Flow

- `index.html` loads `src/main.tsx`.
- `src/main.tsx` renders `App` and registers the service worker in production.
- `src/App.tsx` is the runtime orchestrator for splash, auth gates, nav state, sub-pages, invite bootstrap, and save flows.

## Core Boundaries

- `src/App.tsx`: shell and orchestration hotspot
- `src/context/AppContext.tsx`: shared app-level context contract
- `src/hooks/useAuth.ts`: auth lifecycle and cloud bootstrap
- `src/hooks/useMatches.ts`: persistence, sync, and match mutations
- `src/services/*`: Firestore/Auth I/O boundaries
- `src/pages/*`: feature flows and composed views
- `src/components/games/*`: game-specific match forms and interactions
- `src/data/*`: catalog, rules, and translations
```

- [ ] **Step 2: Add runtime responsibilities and task routing guide**

```md
## Runtime Responsibilities

- Auth bootstrap: `src/hooks/useAuth.ts`
- Local persistence and sync: `src/hooks/useMatches.ts`
- Invite parsing and resolution: `src/lib/inviteService.ts`
- Match sharing: `src/services/matchService.ts`
- Private/public user data access: `src/services/userService.ts`
- Game routing by type: `src/pages/GameDetail.tsx`

## Task Routing Guide

- Nav, sub-pages, splash, auth gates, shared save flow: inspect `src/App.tsx`
- New game type or game UI behavior: inspect `src/components/games/*`, `src/pages/GameDetail.tsx`, `src/data/games.ts`, `src/data/rules.ts`
- Translation behavior or locale additions: inspect `src/data/translations.ts` and `src/data/translations/*`
- Data storage, history, stats, sync, or shared matches: inspect `src/hooks/useMatches.ts`, `src/services/*`, and `src/lib/storage.ts`
- Auth and profile/invite/public data work: inspect `src/hooks/useAuth.ts`, `src/services/userService.ts`, and `src/lib/inviteService.ts`
```

- [ ] **Step 3: Add change-boundary rules and design reference note**

```md
## Change Boundaries

- Change `services/*` before changing remote call sites if the contract itself is wrong.
- Change `hooks/*` when mutation flow, bootstrap, or sync semantics change.
- Change `pages/*` when view composition or routing behavior changes.
- Change `components/games/*` for game-specific match-entry behavior.
- Change `src/App.tsx` only when the concern is truly app-global.

## Design Reference Boundary

Use `DESIGN.md` for visual language and design-system direction. Keep this file focused on implementation routing and ownership, not visual theory.
```

- [ ] **Step 4: Verify every referenced path exists and the task-routing statements match current code**

Run:

```powershell
Get-ChildItem docs/agents
Get-Content docs/agents/architecture.md
```

Expected: the file references only current paths and routes each common task type to concrete code locations.

- [ ] **Step 5: Commit**

```bash
git add docs/agents/architecture.md
git commit -m "docs: add architecture reference for agents"
```

### Task 3: Write the Verification Reference

**Files:**
- Create: `docs/agents/testing-and-verification.md`
- Reference: `package.json`
- Reference: `playwright.config.js`
- Reference: `tests/*`

- [ ] **Step 1: Document verification principles and canonical commands**

```md
# Testing and Verification

## Verification Principles

- Run the smallest sufficient verification set for the touched area.
- Prefer evidence from current config over older scattered references.
- If automation is weak for the changed area, add a targeted manual check.

## Canonical Commands

- Build: `node .\\node_modules\\vite\\bin\\vite.js build`
- Lint: `node .\\node_modules\\eslint\\bin\\eslint.js .`
- List all Playwright tests: `node .\\node_modules\\playwright\\cli.js test --list`
- List logic tests: `node .\\node_modules\\playwright\\cli.js test --project=logic --list`
```

- [ ] **Step 2: Add the change-type verification matrix**

```md
## Change-Type Matrix

- Copy/i18n: build, translation parity, locale coverage
- Layout/nav shell: build, smoke, navigation, multi-viewport layout coverage
- Game-specific behavior: matching game spec plus shared history/stats checks if save flow changes
- Storage/history/stats/champions: history, stats, champions, public-data checks
- Auth/invites/public data: invite and public-data checks plus targeted manual validation
- App context/preferences: smoke, navigation, app-context, settings-accessibility
```

- [ ] **Step 3: Add the Playwright project map and execution notes**

```md
## Playwright Project Map

- `mobile-small`
- `mobile-large`
- `tablet`
- `foldable-open`
- `foldable-closed`
- `desktop`
- `layout-legacy`
- `logic`

## Execution Notes

- Playwright assumes the app is already running at `http://localhost:5173`.
- Use this document and `playwright.config.js` as the canonical source for project names.
- Layout-sensitive changes require multi-viewport verification, not just `logic`.
```

- [ ] **Step 4: Add manual-check guidance for weakly automated areas**

```md
## Manual Checks

- Logged-in auth and real sync behavior
- Admin-only screens
- Service worker and install/update behavior
- Weakly covered games or shared components used by many games
```

- [ ] **Step 5: Review for drift against `package.json` and `playwright.config.js`, then commit**

Run:

```powershell
Get-Content package.json
Get-Content playwright.config.js
Get-Content docs/agents/testing-and-verification.md
```

Expected: command names, project names, and execution notes match current repo configuration.

```bash
git add docs/agents/testing-and-verification.md
git commit -m "docs: add agent verification matrix"
```

### Task 4: Write the Frontend Rules Reference

**Files:**
- Create: `docs/agents/frontend-rules.md`
- Reference: `README.md`
- Reference: `DESIGN.md`
- Reference: `src/data/translations.ts`
- Reference: `src/data/translations/*`
- Reference: `src/styles/app.css`
- Reference: `src/App.tsx`

- [ ] **Step 1: Draft i18n and layout invariants**

```md
# Frontend Rules

## i18n Rules

- Route all user-facing strings through the translation system.
- Keep new keys in parity across supported locales.
- Do not put translation logic inside locale dictionaries.

## Layout Rules

- Preserve multi-viewport behavior.
- Use `100dvh`, not `100vh`, for viewport-height layouts.
- Keep touch targets large enough for mobile use.
- Re-check nav, overlays, and sub-page flows when changing shell layout.
```

- [ ] **Step 2: Add styling conventions and interaction contracts**

```md
## Styling Conventions

- Reuse existing CSS custom properties before introducing new tokens.
- Respect game-color usage patterns when styling game-specific surfaces.
- Keep shared shell styling aligned with the existing visual system.

## Interaction Contracts

- Preserve existing `data-testid` attributes where possible.
- Preserve history, settings, and navigation flow semantics when editing shared UI.
- Prefer incremental changes within existing patterns over broad UI rewrites.
```

- [ ] **Step 3: Add the design handoff rule**

```md
## When to Open `DESIGN.md`

Open `DESIGN.md` for substantial visual work, component redesigns, or changes that affect the visual language of the shell. Do not copy large portions of it into this file.
```

- [ ] **Step 4: Review for overlap with the central guide and commit**

Run:

```powershell
Get-Content docs/agents/frontend-rules.md
Get-Content docs/agents/README.md
```

Expected: this file captures frontend-specific invariants without duplicating the central guide.

```bash
git add docs/agents/frontend-rules.md
git commit -m "docs: add frontend rules for agents"
```

### Task 5: Write the Game Change Runbook

**Files:**
- Create: `docs/agents/runbooks/add-or-change-a-game.md`
- Reference: `src/data/games.ts`
- Reference: `src/data/rules.ts`
- Reference: `src/pages/GameDetail.tsx`
- Reference: `src/App.tsx`
- Reference: `src/components/games/*`
- Reference: `tests/games/*`

- [ ] **Step 1: Write the runbook header and usage conditions**

```md
# Add or Change a Game

## When to Use This Runbook

Use this runbook when adding a new game, changing game setup or save behavior, changing game-specific copy, or touching shared components used by multiple games.
```

- [ ] **Step 2: Add the code-path map and required implementation checklist**

```md
## Code Paths Involved

- `src/data/games.ts`
- `src/data/rules.ts`
- `src/data/translations.ts` and `src/data/translations/*`
- `src/pages/GameDetail.tsx`
- `src/App.tsx`
- `src/components/games/*`

## Required Checklist

- Add or update the catalog entry.
- Add or update the game UI component.
- Add or update translations for all supported locales.
- Add or update rules text if user-facing rules changed.
- Ensure the game is reachable from the correct routing and home grouping.
- Verify save/history/stats behavior if match data shape changed.
```

- [ ] **Step 3: Add verification checklist and definition of done**

```md
## Verification Checklist

- Run the matching `tests/games/*.spec.js` when present.
- If save flow changed, also run history and stats coverage.
- If shared components changed, run the smallest relevant cross-game regression set.
- Add a manual save/history/stats check for games with weak automated coverage.

## Definition of Done

- The game is reachable from the intended UI path.
- All user-facing copy is translated.
- History and stats still behave for the changed game flow.
- Verification evidence matches the touched surface.
```

- [ ] **Step 4: Review checklist completeness against current game architecture and commit**

Run:

```powershell
Get-Content docs/agents/runbooks/add-or-change-a-game.md
Get-Content src/pages/GameDetail.tsx
Get-Content src/data/games.ts
```

Expected: the runbook covers catalog, routing, translations, rules, and verification without omitting core game-change steps.

```bash
git add docs/agents/runbooks/add-or-change-a-game.md
git commit -m "docs: add game change runbook for agents"
```

### Task 6: Write the Data/Auth/Sync Runbook

**Files:**
- Create: `docs/agents/runbooks/data-auth-sync.md`
- Reference: `src/hooks/useAuth.ts`
- Reference: `src/hooks/useMatches.ts`
- Reference: `src/services/userService.ts`
- Reference: `src/services/matchService.ts`
- Reference: `src/lib/inviteService.ts`
- Reference: `src/lib/storage.ts`
- Reference: `firestore.rules`
- Reference: `docs/superpowers/specs/*`
- Reference: `docs/superpowers/plans/*`

- [ ] **Step 1: Write usage conditions and the data ownership map**

```md
# Data, Auth, and Sync Runbook

## When to Use This Runbook

Use this runbook when changing auth flows, local persistence, cloud sync, invite flows, shared matches, public profile data, or Firestore rules.

## Data Ownership Map

- Local storage and app versioning: `src/lib/storage.ts`
- Draft persistence: `src/hooks/useDraft.ts`
- Auth lifecycle and bootstrap: `src/hooks/useAuth.ts`
- Match persistence and sync: `src/hooks/useMatches.ts`
- Remote data access: `src/services/userService.ts`, `src/services/matchService.ts`
- Invite resolution: `src/lib/inviteService.ts`
- Security boundaries: `firestore.rules`
```

- [ ] **Step 2: Add where-to-change guidance and safety rules**

```md
## Where to Change What

- Change `services/*` when the remote contract or Firestore call changes.
- Change `hooks/*` when bootstrap, local mutation flow, or sync semantics change.
- Change `firestore.rules` when access boundaries change.
- Change `lib/*` when storage helpers or invite parsing logic changes.

## Change Safety Rules

- Do not invent new Firestore structures without code evidence and explicit intent.
- Preserve compatibility with existing stored data shapes unless migration is part of the task.
- Verify whether public and private data are intentionally separated before moving fields.
- Treat sync behavior as app-global and regression-prone.
```

- [ ] **Step 3: Add verification checklist and historical-spec usage**

```md
## Verification Checklist

- Run the relevant Playwright coverage for invites, public data, history, stats, and app shell behavior.
- Run build after data-layer changes that can affect imports or runtime wiring.
- Add targeted manual validation for logged-in and real-sync behavior when automation does not cover it.

## When to Consult Historical Specs

If the touched area already has a feature spec or implementation plan in `docs/superpowers/specs/*` or `docs/superpowers/plans/*`, read it before changing the behavior. Use it as feature rationale, not as a replacement for current code truth.
```

- [ ] **Step 4: Review for consistency with hooks/services/rules boundaries and commit**

Run:

```powershell
Get-Content docs/agents/runbooks/data-auth-sync.md
Get-Content src/hooks/useAuth.ts
Get-Content src/hooks/useMatches.ts
Get-Content firestore.rules
```

Expected: the runbook routes auth, persistence, sync, and rules work to the correct files and states the core safety constraints clearly.

```bash
git add docs/agents/runbooks/data-auth-sync.md
git commit -m "docs: add data and auth runbook for agents"
```

### Task 7: Final Package Review

**Files:**
- Review: `docs/agents/*`

- [ ] **Step 1: Review the full package for overlap, missing cross-links, and tone**

Run:

```powershell
Get-ChildItem docs/agents -Recurse
Get-Content docs/agents/README.md
Get-Content docs/agents/architecture.md
Get-Content docs/agents/testing-and-verification.md
Get-Content docs/agents/frontend-rules.md
Get-Content docs/agents/runbooks/add-or-change-a-game.md
Get-Content docs/agents/runbooks/data-auth-sync.md
```

Expected: each file has a distinct purpose, the package is English-only, and the central guide dispatches cleanly to the support docs.

- [ ] **Step 2: Verify all relative links and referenced paths are valid**

Run:

```powershell
Test-Path docs/agents/README.md
Test-Path docs/agents/architecture.md
Test-Path docs/agents/testing-and-verification.md
Test-Path docs/agents/frontend-rules.md
Test-Path docs/agents/runbooks/add-or-change-a-game.md
Test-Path docs/agents/runbooks/data-auth-sync.md
```

Expected: every planned file exists and can be resolved from the repo root.

- [ ] **Step 3: Commit the completed documentation package**

```bash
git add docs/agents
git commit -m "docs: add agent execution documentation package"
```
