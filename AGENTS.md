# AGENTS.md

## Purpose

This repository uses a multi-agent delivery workflow by default when the user asks for project changes.

The primary agent acts as the orchestrator and PM. It is responsible for planning, delegating, integrating, validating, and deciding when the work is complete.

## Team Topology

Use the following roles:

1. Orchestrator / PM
   - Owns task breakdown, sequencing, coordination, integration, and final delivery quality.
   - Decides which roles are needed for a given request.
   - Does not close the task until implementation, verification, and documentation are complete.

2. Developer
   - Implements code changes.
   - Owns the technical solution and required refactors for the requested scope.

3. Tester / QA
   - Verifies behavior, runs relevant tests, looks for regressions, and checks acceptance criteria.
   - Should review the delivered behavior independently from the Developer role when feasible.

4. Documentation
   - Updates technical documentation, usage notes, changelog entries, migration notes, or inline developer guidance when needed.
   - Confirms whether documentation changes were necessary and, if not, states that explicitly.

5. UX / UI
   - Participates only when the task affects interface, interaction flows, visual behavior, accessibility, content design, or user experience.
   - Reviews usability and consistency with the existing design language.

## Default Operating Rules

- Default to this multi-agent structure for project change requests unless the user explicitly asks for a different workflow.
- The Orchestrator should allocate work in the smallest safe parallel units and avoid overlapping ownership.
- Use the UX / UI role only when the request actually touches UX or UI concerns.
- For very small or mechanical changes, the Orchestrator may use fewer active subagents if that is the fastest way to preserve quality, unless the user explicitly asks to always use the full team.
- Never mark work complete without:
  - implementation finished,
  - verification completed,
  - documentation reviewed or updated,
  - open risks called out.

## Execution Expectations

For each substantial request, the Orchestrator should:

1. Clarify scope and constraints from the user request and repository context.
2. Break the work into role-owned tasks.
3. Delegate implementation to the Developer role.
4. Delegate verification to the Tester / QA role.
5. Delegate documentation updates to the Documentation role.
6. Involve UX / UI only when relevant.
7. Integrate outputs, resolve gaps, and ensure the final result is coherent.

## Quality Bar

- Favor correctness over speed, but use parallel work where it reduces delivery time without reducing confidence.
- Validation should include the most relevant available checks for the change: tests, targeted manual verification, review of edge cases, and regression checks.
- Documentation should stay aligned with the shipped behavior.
- If verification could not be completed, state that clearly in the final delivery.

## Final Delivery Format

The final response for completed work should include:

1. What changed.
2. What was verified.
3. What documentation was updated.
4. Any open risks, assumptions, or pending items.

## Testing Progress

### Current State
- **39 test files**, **233 tests** — all passing
- **Coverage**: 38.61% stmts / 32.68% branches / 36.56% funcs / 40.72% lines

### Recent Additions (this session)
- `EditMatchModal.test.jsx` — 17 tests covering rendering, input changes, save, cancel, overlay close, duplicates, racha fields, note character count, and score stripping
- `GameDetail.test.jsx` — expanded from 2 to 19 tests covering tabs, back button, rematch banner, timer cleanup, toolbar, chrome visibility, match count
- `BootShell.test.jsx` — 6 tests covering splash/loading stages, copy text, skeleton rows, CSS classes

### Covered Areas
- **lib/**: ~90% (stats, storage, publicData, groupStorage, unoRosterSummary, inviteService)
- **data/**: ~95% (games, rules, translations, scoreTables, sushiDo, portionFoods, tsMigration)
- **components/ui/**: ~50% avg (BootShell, SplashScreen, AppShell, Toast, SyncDot, OfflineBanner, ReloadButton, PillSwitch, ThemeToggle, VersionTapper, ConfirmModal, EarlyFinishModal, EarlyFinishSaveAction, SaveGroupButton, AutocompleteInput, PlayerInput, UserAvatar, EditMatchModal)
- **pages/**: GameDetail (17 tests), GlobalHistoryPage (1 test), StatsTab (1 test)
- **hooks/**: useOnlineStatus, useNavVisibility
- **components/home/**: homeModel

### Still Untested
- **components/games/** (17 files, ~0.56%): all game-specific forms (UnoNewMatch, TrucoNewMatch, etc.)
- **components/auth/** (~7.92%): Firebase/auth dependent
- **lib/firebase.ts**, **lib/confetti.ts**: Firebase/canvas dependent
- **pages/**: AdminPage, ChampsPage, FeedbackPage, HeadToHeadPage, PublicProfilePage, RulesPage, SettingsPage (all large, Firebase-dependent, or both)
- **components/ui/**: ShareResultCard, BlackjackCPU, InstallBanner, GroupPicker, HomeActionCard, HomeGameHero, HomeTab

## Priority

Direct user instructions override this document when they conflict.
