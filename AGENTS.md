# AGENTS.md

<!-- MEMANTO-MANAGED-SECTION -->
## MEMANTO - Your Active Memory Companion

**MEMANTO is not a passive store. It is an active companion agent that works alongside you.**
Don't treat MEMANTO like a static blob you query once and forget. It's a teammate you keep
talking to, every preference, decision, and correction flows through it. MEMANTO remembers,
recalls, and answers so you hold context across sessions, honor prior decisions, and avoid
repeating mistakes the user already corrected.

Every memory operation in this session goes through MEMANTO. There is no exception.

> **CRITICAL**: All `memanto` commands are **shell commands**. Always run them using the terminal.
> Never simulate, describe, or "pretend to call" them. If you cannot run the shell, say so explicitly instead of inventing memory state.

### NON-NEGOTIABLE RULES

These are not suggestions. Follow each one on every turn.

1. **Read `MEMORY.md` before doing anything.** It is auto-synced at session start and holds
   the user's preferences, facts, goals, instructions, decisions, and commitments from every
   prior session. You MUST honor what is written there. If you act against it, you are
   breaking continuity the user is paying for.
2. **Search memory before saying you don't know.** If the user asks about past context, an
   earlier decision, a preference, or anything you are unsure about, you MUST run `recall`
   or `answer` first. Saying "I don't have context" without searching is a failure.
3. **Store proactively. Do not wait to be asked.** The moment a memory-worthy event happens
   — a preference stated, a decision made, a fact learned, an instruction given, a goal set,
   a mistake corrected — run `memanto remember` immediately, in the same turn.
4. **Always pass full metadata to `remember`.** Every `memanto remember` call MUST include
   `--type`, `--confidence`, `--provenance`, and `--source <your_agent_name>`. Never let
   these default. Untyped, unsourced memories pollute the agent's recall quality.
5. **One memory operation goes through MEMANTO. All of them do.** Do not keep mental notes,
   in-context scratch pads, or "I'll remember this for next time" promises. If it matters
   beyond this turn, it goes into MEMANTO. If it doesn't, drop it.

### Memory Operations — Use the Right One

MEMANTO gives you three primitives. They are equal-priority. Pick by intent, not by habit.

| You want to... | Use | Why |
|---|---|---|
| Read raw memory chunks and apply them as context | `memanto recall "query"` | Best for context-building, multi-step work, comparing options |
| Get one synthesized, grounded answer to a direct question | `memanto answer "question"` | Best for "what did we decide / prefer / commit to?" — saves you reading and merging |
| Persist something memory-worthy | `memanto remember "content" --type ... --confidence ... --provenance ... --source ...` | Every preference, decision, fact, instruction, goal, lesson |
| See what changed since last time | `memanto recall --changed-since "last 7 days"` | Catching up after a break |
| See the most recent memories | `memanto recall --recent` | Fast context refresh |

Do NOT always default to `recall`. If the user asked a direct question, `answer` is usually
the right tool — it returns a grounded synthesis so you don't burn tokens re-reading raw
chunks.

### When to Call `remember` (Examples — Run Immediately)

- User says *"I prefer tabs over spaces"*:
  `memanto remember "User prefers tabs over spaces for indentation" --type preference --confidence 1.0 --provenance explicit_statement --source <your_agent_name>`
- You decide to use Library X for reason Y:
  `memanto remember "Chose Library X for reason Y; commit abc123" --type decision --confidence 0.95 --provenance inferred --source <your_agent_name>`
- User corrects an approach:
  `memanto remember "User corrected: use pytest, not unittest" --type learning --confidence 1.0 --provenance corrected --source <your_agent_name>`
- A failed approach taught you something:
  `memanto remember "Batch size > 100 fails with TimeoutError" --type error --confidence 0.95 --provenance observed --source <your_agent_name>`

### Command Reference

```bash
# Store — ALWAYS pass full metadata
memanto remember "content" --type <type> --confidence <0.0-1.0> --provenance <provenance> --source <agent_name>

# Recall raw context
memanto recall "query"                              # semantic search
memanto recall "query" --type <type> --limit 10     # filtered search
memanto recall --recent --limit 10                  # newest first, no query
memanto recall --as-of "2026-01-15"                 # state at a point in time
memanto recall --changed-since "last 7 days"        # what changed since

# Synthesized answer (grounded RAG over memories)
memanto answer "question"

# Re-sync MEMORY.md (project-local cache)
memanto memory sync --project-dir .
```

**Memory types** (use the closest fit, do not invent new ones):
`fact`, `preference`, `instruction`, `decision`, `event`, `goal`, `commitment`,
`observation`, `learning`, `relationship`, `context`, `artifact`, `error`.

**Provenance values**: `explicit_statement`, `inferred`, `observed`, `corrected`,
`validated`, `imported`.

**Confidence**: `1.0` for explicit user statements; `0.9-0.95` for strong consensus;
`0.8-0.85` for observed patterns (3+ times); `0.6-0.75` for emerging patterns.

> **Note**: The `memanto-memory` skill in `.agents/skills/memanto/` contains detailed reference guidelines.
<!-- /MEMANTO-MANAGED-SECTION -->

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
