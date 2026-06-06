# Testing and Verification

Use this file to choose the smallest sufficient verification set for the changed surface. Prefer direct commands that match repo config, capture what you ran, and call out anything you could not verify.

## Verification Principles

- Verify the changed behavior directly, then verify the nearest shared surface that could regress.
- Prefer repo-truth commands over package script aliases.
- Run `lint` for code changes. Run `build` for runtime, UI, config, or production-path changes.
- For Playwright, select the smallest sufficient spec or project first, then widen only if the change crosses shared boundaries.
- If automation is weak for the touched area, add manual checks and record evidence.

## Canonical Commands

> [!NOTE]
> **PowerShell Execution Restrictions:** If PowerShell execution policy restricts running scripts on Windows (e.g. throwing `UnauthorizedAccess` / `SecurityError` for `npm`), prefix commands with `cmd.exe /c` (like `cmd.exe /c npm run test:coverage`) or invoke `npx` / `node_modules` directly.

If `npm` is unavailable on the machine, prefer the direct `node_modules` binaries below instead of `npm run ...`.

If a change adds or migrates `.ts` sources, only claim typecheck coverage when one of these commands is actually available and run:

```powershell
node .\scripts\typecheck.mjs
```

The helper prefers local `node_modules/typescript` and falls back to `corepack pnpm dlx` with `COREPACK_HOME` inside the repo when needed.

Run the app in a separate repo-root shell before Playwright:

```powershell
node .\node_modules\vite\bin\vite.js
```

Run verification commands as one-shot repo-root commands:

```powershell
node .\scripts\verify-local.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --list
node .\node_modules\playwright\cli.js test --project=logic --list
node .\node_modules\playwright\cli.js test --project=logic
node .\node_modules\playwright\cli.js test tests\history.spec.js --project=logic
node .\node_modules\playwright\cli.js test --project=mobile-small
```

## Change-Type Matrix

Matrix rows are additive to the principles above, including `build` for runtime, UI, config, or production-path changes.

| Change type | Minimum verification |
| --- | --- |
| Copy / i18n | `eslint`; `tests\i18n.spec.js`, `tests\i18n-locales.spec.js`, `tests\translations-parity.spec.js` on `logic`; add layout projects if text length affects cards, nav, tabs, or rules. |
| Rules / rules page | `eslint`; `tests\rules.spec.js` on `logic`; add i18n coverage if rules copy or locale keys changed. |
| Layout / nav shell | `eslint`; `mobile-small`, `mobile-large`, `tablet`, `foldable-open`, `foldable-closed`, `desktop`, and `layout-legacy`; add `tests\navigation.spec.js` and `tests\smoke.spec.js` on `logic`. |
| Game-specific behavior | `eslint`; the touched `tests\games\*.spec.js` file on `logic`; add the nearest save/history/stats flow if the game persists or summarizes data. |
| Storage / history / stats / champions | `eslint`; `tests\history.spec.js`, `tests\stats.spec.js`, `tests\champions.spec.js` on `logic`; add the affected game flow when mutations originate in game screens. |
| Auth / signed-in sync | `eslint`; `tests/auth-phase2.spec.js` on `logic`; add manual logged-in checks for sign-in state, profile-linked behavior, cross-session sync, reload persistence, and `/admin` route access. |
| Invites | `eslint`; `tests\invite-links.spec.js` and `tests\invite-service.spec.js` on `logic`; add `tests\firestore-rules.spec.js` when invite document shape or access rules change. |
| Public data / privacy boundaries | `eslint`; `tests\public-data.spec.js` on `logic`; add `tests\firestore-rules.spec.js` when public/private field exposure or access rules change. |
| App context / preferences | `eslint`; `tests\app-context.spec.js`, `tests\settings-accessibility.spec.js`, `tests\smoke.spec.js` on `logic`; add `tests\navigation.spec.js` if state crosses tabs. |

## Playwright Project Map

| Project | Coverage |
| --- | --- |
| `mobile-small` | `tests\layout-mobile.spec.js` at 375x667 |
| `mobile-large` | `tests\layout-mobile.spec.js` at 430x932 |
| `tablet` | `tests\layout-mobile.spec.js` at 768x1024 |
| `foldable-open` | `tests\layout-mobile.spec.js` at 717x512 |
| `foldable-closed` | `tests\layout-mobile.spec.js` at 412x914 |
| `desktop` | `tests\layout-mobile.spec.js` at 1280x800 |
| `layout-legacy` | `tests\layout.spec.js` at 1280x800 |
| `logic` | All non-layout specs in desktop Chromium |

## Execution Notes

- **Vitest Unit Test & Coverage Baseline:** The codebase has a unit test suite under Vitest (run via `cmd.exe /c npm run test:coverage` or `node .\node_modules\vitest\vitest.mjs run`). The current baseline has **39 test files**, **233 tests** passing, and **38.61% statement / 40.72% line coverage**. Always verify code edits do not regress this baseline.
- Playwright uses `PLAYWRIGHT_BASE_URL` when it is set; otherwise it falls back to `http://localhost:5173`.
- `node .\scripts\verify-local.mjs` is the preferred one-command local flow on this machine. It runs typecheck, build, Vitest, a browserless Playwright contract suite, then lifts `vite preview` and runs the targeted browser suite on `msedge`.
- If Edge cannot launch locally, the runner tries bundled Chromium once before marking the browser suite as environment-blocked. The final state is written explicitly to `test-results\local-verify\summary.json`.
- `playwright.config.js` still does not define `webServer`, so ad-hoc Playwright commands outside `verify-local` need the app to already be running before Playwright starts.
- Use `--list` before running large suites when you are unsure which specs or projects apply.
- Most non-layout work belongs on `--project=logic`.
- Narrow runs with an exact spec path first. Use `--grep` only when a spec already contains the needed scenario.
- Auth-route coverage lives in `tests/auth-phase2.spec.js`; use it first when touching `/login`, `ProtectedRoute`, auth persistence, offline auth copy, or React 19 login feedback.

## Manual Checks

- Logged-in auth and sync flows: sign-in state, profile-linked behavior, cross-session sync, reload persistence, and post-login redirect away from `/login`.
- Admin-only screens or controls: visibility, access rules, and failure states.
- Service worker behavior: install prompt, update pickup, stale asset recovery, and refresh behavior after deploys.
- Weakly covered games and shared scoring components: run a short create, score, save, reopen, and undo cycle for the touched path.
- Any change that affects public/private boundaries: verify the intended data is shown and private data stays hidden.

## Phase 2 Baseline

When the change is specifically in the strict auth/offline scope from the redesign plan, the minimum passing set is:

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\node_modules\vite\bin\vite.js build
node .\node_modules\playwright\cli.js test --project=logic tests\auth-phase2.spec.js
node .\node_modules\playwright\cli.js test --project=logic tests\smoke.spec.js tests\navigation.spec.js tests\routing-theme.spec.js tests\settings-accessibility.spec.js
node .\node_modules\playwright\cli.js test tests\layout-mobile.spec.js --project=mobile-large --project=tablet --project=desktop
```
