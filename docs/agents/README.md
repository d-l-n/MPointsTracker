# Agent Docs

## Purpose of This Package

Use this package as the operational entry point for AI task execution in this repo. It tells you what to open first, where behavior lives, and what to verify before you stop.

## Start Here

1. Read [AGENTS.md](../../AGENTS.md) for workflow expectations and multi-agent roles (Orchestrator, Developer, Tester, Documentation, UX/UI).
2. Read this file for repo-specific routing and constraints.
3. Open the support doc that matches the task type.
4. Inspect the named code paths before editing.
5. Run the smallest sufficient verification set before completion.

## Source of Truth

- Workflow expectations: [AGENTS.md](../../AGENTS.md)
- Agent execution package: `docs/agents/*`
- Runtime implementation truth: `src/*`, `public/*`, `firestore.rules`, `package.json`, `playwright.config.js`
- Design language: [DESIGN.md](../../DESIGN.md)
- Product/repo overview: [README.md](../../README.md)
- Historical rationale: [../superpowers/specs/](../superpowers/specs/) and [../superpowers/plans/](../superpowers/plans/)

## Local Agent Skills

- Codex has the Google Cloud Skills from [`google/skills`](https://github.com/google/skills) installed locally from `skills/cloud`.
- Use those skills as optional development assistance for Firebase, Google Cloud, Gemini, BigQuery, Cloud Run, Cloud SQL, GKE, AlloyDB, `gcloud`, and Google Cloud Well-Architected Framework tasks.
- These skills are environment tooling only. They are not app runtime dependencies and should not change production behavior by themselves.
- Restart Codex after installing or updating local skills so they appear in the available skills list.

## Repo Mental Model

- `src/App.tsx` is the typed app-global orchestrator.
- `src/components/home/HomeTab.tsx` composes the Home/Games surface and `src/components/home/homeModel.ts` owns grouping, search, featured, and recent-card derivation.
- `src/hooks/useAuth.ts` owns auth lifecycle and bootstrap.
- `src/hooks/useMatches.ts` owns persistence, sync, and match mutations.
- `src/services/*` owns Firebase and Firestore I/O.
- `src/data/*` owns catalog, rules, and translations.
- `src/pages/*` composes feature flows.
- `src/components/games/*` owns game-specific UI.

## Task Triage

- App shell, navigation, sub-page flow, or app-global state: inspect `src/App.tsx` first.
- Home/Games layout, action cards, grouping, search, or recent/featured behavior: inspect `src/components/home/HomeTab.tsx` and `src/components/home/homeModel.ts` first.
- UI, layout, accessibility, or copy: open `docs/agents/frontend-rules.md`.
- Game work: open `docs/agents/runbooks/add-or-change-a-game.md`.
- Storage, history, stats, persistence, or sync behavior: open `docs/agents/architecture.md`, `docs/agents/testing-and-verification.md`, and `docs/agents/runbooks/data-auth-sync.md`.
- Auth, invites, public data, or Firestore-boundary work: open `docs/agents/runbooks/data-auth-sync.md`.

## Minimum Verification Rule

Run the smallest sufficient verification set for the changed surface. Select that set through `docs/agents/testing-and-verification.md`, not by guesswork.

## Hard Constraints

- Do not hardcode user-facing strings.
- Do not invent Firestore structures, sync behavior, or public/private data rules.
- Preserve multi-viewport behavior for shared UI.
- Preserve stable `data-testid` hooks where practical.
- Prefer existing module boundaries before introducing new ones.

## Docs Map

- `docs/agents/architecture.md`: implementation map and ownership boundaries
- `docs/agents/testing-and-verification.md`: verification selection and command guidance
- `docs/agents/frontend-rules.md`: frontend invariants and design-boundary rules
- `docs/agents/runbooks/add-or-change-a-game.md`: checklist for game changes
- `docs/agents/runbooks/data-auth-sync.md`: checklist for auth, persistence, sync, and shared/public data work

## When to Open Historical Specs

Open [../superpowers/specs/](../superpowers/specs/) and [../superpowers/plans/](../superpowers/plans/) only when the touched area already has feature-specific rationale there. Treat them as historical decision records, not evergreen implementation truth.
