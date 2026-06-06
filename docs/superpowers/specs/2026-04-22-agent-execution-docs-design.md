# Agent Execution Docs Design

## Goal

Create an English documentation package that helps AI agents execute tasks in this repository without re-discovering the project structure, verification expectations, or common task workflows on every change.

The package is for operational task execution. It is not a product overview, a changelog, or a candid audit of current repo issues.

## Scope

This documentation package must include:

- one central guide that acts as the canonical entry point for agents
- a small set of supporting reference documents
- task-oriented runbooks for the highest-risk recurring change types

The package must stay focused on intended workflow and architecture only.

## Design Principles

### 1. One entry point

Agents should have one obvious file to open first instead of guessing between `README.md`, `DESIGN.md`, `AGENTS.md`, and prior feature specs.

### 2. Operational over descriptive

Each document should help an agent decide:

- where to look first
- what boundaries to respect
- what to verify before completion

### 3. Link instead of duplicate

Existing project documentation already contains useful material. The new package should consolidate and point to those sources where appropriate instead of copying large sections.

### 4. Short, high-signal documents

The package should stay compact. The target is a small number of evergreen docs with clear ownership and clear usage.

### 5. Checklist where omission creates regressions

If a task type is easy to do incompletely, that document should be a runbook/checklist rather than narrative prose.

## Deliverables

The package will live under `docs/agents/` and contain:

- `docs/agents/README.md`
- `docs/agents/architecture.md`
- `docs/agents/testing-and-verification.md`
- `docs/agents/frontend-rules.md`
- `docs/agents/runbooks/add-or-change-a-game.md`
- `docs/agents/runbooks/data-auth-sync.md`

## Document Design

### `docs/agents/README.md`

Purpose: canonical entry point for AI agents.

Contents:

- purpose of the package
- startup sequence for agents
- source-of-truth map
- repo mental model
- task triage by change type
- minimum verification rule
- hard constraints
- docs map
- when to open historical specs and plans

This document should stay short and act as a dispatcher to the rest of the package.

### `docs/agents/architecture.md`

Purpose: fast implementation map for where behavior lives.

Contents:

- application boot and runtime flow
- module boundaries
- runtime responsibilities
- task routing guide
- change boundaries between hooks, services, pages, and game components
- short design-reference boundary pointing to `DESIGN.md`

This document should tell an agent where to inspect before editing code.

### `docs/agents/testing-and-verification.md`

Purpose: canonical verification reference for agents.

Contents:

- verification principles
- canonical commands
- change-type verification matrix
- Playwright project map
- execution notes
- manual checks where automation is weak

This document should replace guesswork about what to run after a change.

### `docs/agents/frontend-rules.md`

Purpose: preserve frontend invariants during UI and copy changes.

Contents:

- i18n rules
- layout rules
- styling conventions
- interaction contracts
- when to consult `DESIGN.md`

This document should collect the frontend constraints most likely to be violated by incremental edits.

### `docs/agents/runbooks/add-or-change-a-game.md`

Purpose: make game-related changes complete and repeatable.

Contents:

- when to use the runbook
- code paths involved
- required implementation checklist
- verification checklist
- definition of done

This document should make it difficult to miss catalog, translation, routing, rules, or test updates during game work.

### `docs/agents/runbooks/data-auth-sync.md`

Purpose: guide safe changes to persistence, auth, sync, and public/shared data flows.

Contents:

- when to use the runbook
- data ownership map
- where to change what
- change safety rules
- verification checklist
- when to consult historical specs and plans

This document should reduce the chance of unsafe or incomplete data-layer changes.

## Source Strategy

The package should derive and consolidate existing repo knowledge from:

- `AGENTS.md` for workflow expectations
- `README.md` for repo overview, structure, and existing operational notes
- `DESIGN.md` for visual and design-system guidance
- `src/*`, `public/*`, `firestore.rules`, `package.json`, and `playwright.config.js` for current implementation truth
- `docs/superpowers/specs/*` and `docs/superpowers/plans/*` for feature-specific historical rationale

The new docs should clearly distinguish between evergreen execution guidance and historical design records.

## Out of Scope

This package will not:

- document every feature in the app exhaustively
- duplicate the full visual system from `DESIGN.md`
- become a release log or migration log
- include a dedicated section for current-state anomalies or repo defects

## Acceptance Criteria

The design is successful if:

- an agent can open `docs/agents/README.md` and know where to go next
- the package tells agents where to inspect code for the most common task types
- the package defines a clear verification path for each major change type
- the package stays concise enough to remain maintainable
- the docs are written in English and optimized for AI task execution
