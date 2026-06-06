# App TS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `src/App.tsx` to a typed `src/App.tsx` implementation while preserving the existing runtime behavior and a thin JSX compatibility wrapper.

**Architecture:** Keep `App` as the top-level orchestration layer only. Reuse the existing typed hooks, `AppContext.tsx`, and `AppLayout.tsx`, and introduce only the minimal local types needed for the `App` runtime state and callback wiring.

**Tech Stack:** React 19, TypeScript, Vite, Playwright

---

### Task 1: Lock the migration contract in tests

**Files:**
- Create: `tests/app-ts-migration-contract.spec.js`
- Modify: `tests/app-layout-contract.spec.js`
- Modify: `tests/app-hooks-contract.spec.js`
- Modify: `tests/app-context.spec.js`

- [ ] **Step 1: Write the failing test**

Add a new contract test that requires `src/App.tsx` to exist and `src/App.tsx` to re-export it. Update existing source-inspection tests so they read `src/App.tsx` as the implementation source.

- [ ] **Step 2: Run test to verify it fails**

Run: `node .\node_modules\playwright\cli.js test --project=logic "tests/app-ts-migration-contract.spec.js" "tests/app-layout-contract.spec.js" "tests/app-hooks-contract.spec.js" "tests/app-context.spec.js"`

Expected: FAIL because `src/App.tsx` does not exist yet and/or tests still target the old source file.

- [ ] **Step 3: Write minimal implementation**

Do not touch production code in this task.

- [ ] **Step 4: Run test to verify it still fails correctly**

Run the same Playwright command and confirm the failure is specifically about the missing `App.tsx` / wrapper contract.

### Task 2: Migrate App implementation to TSX with a thin wrapper

**Files:**
- Create: `src/App.tsx`
- Modify: `src/App.tsx`
- Optional read-only references: `src/types.ts`, `src/context/AppContext.tsx`, `src/components/ui/AppLayout.tsx`, `src/hooks/*.ts`

- [ ] **Step 1: Implement the typed App source**

Port `src/App.tsx` into `src/App.tsx`, keeping behavior intact and adding only minimal local typing for refs, callback payloads, auth modal state, and the context value shape.

- [ ] **Step 2: Replace the JSX file with a thin wrapper**

Set `src/App.tsx` to:

```js
export { default } from "./App.tsx";
```

- [ ] **Step 3: Run targeted tests to verify green**

Run: `node .\node_modules\playwright\cli.js test --project=logic "tests/app-ts-migration-contract.spec.js" "tests/app-layout-contract.spec.js" "tests/app-hooks-contract.spec.js" "tests/app-context.spec.js"`

Expected: PASS.

### Task 3: Full verification and docs review

**Files:**
- Optional modify if stale: `README.md`
- Optional modify if stale: `docs/agents/architecture.md`

- [ ] **Step 1: Run typecheck**

Run: `node .\scripts\typecheck.mjs`

Expected: PASS.

- [ ] **Step 2: Run build**

Run: `node .\node_modules\vite\bin\vite.js build`

Expected: PASS.

- [ ] **Step 3: Run focused regression tests**

Run: `node .\node_modules\playwright\cli.js test --project=logic "tests/app-ts-migration-contract.spec.js" "tests/app-layout-contract.spec.js" "tests/app-hooks-contract.spec.js" "tests/app-context.spec.js" "tests/navigation.spec.js" "tests/smoke.spec.js"`

Expected: PASS.

- [ ] **Step 4: Update docs only if the technical map changed**

If docs enumerate typed surfaces explicitly, update them to mention `src/App.tsx` plus the compatibility wrapper. Otherwise leave docs unchanged and record that no update was needed.
