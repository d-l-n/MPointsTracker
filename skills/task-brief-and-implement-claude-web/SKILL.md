---
name: task-brief-and-implement-claude-web
description: Use when raw requirements, QA findings, UX/UI notes, or markdown reports need to be turned into a clean Task Brief for implementation, or when an existing Task Brief should drive precise code changes with minimal context usage in Claude apps.
---

# Task Brief and Implement for Claude Web

## Overview

Use this skill in one of two modes:

- `brief-only`
- `brief-and-implement`

This version is self-contained in one file so it is easier to reuse in Claude web.

## Mode Selection

### `brief-only`

Use this when the input is:

- raw requirements
- QA findings
- UX/UI improvements
- one or more markdown reports

Output only a normalized `Task Brief` in markdown.

### `brief-and-implement`

Use this when the user wants implementation in the same session.

Workflow:

1. Normalize the input into a `Task Brief`
2. Read repo-specific guidance before coding
3. Inspect only the smallest relevant code paths
4. Implement the smallest correct change set
5. Run the smallest sufficient verification

## Brief Generation Rules

- Write the brief in English.
- Be concise and implementation-oriented.
- Separate `Problem` from `Expected outcome`.
- Merge overlapping findings when useful.
- Keep ambiguities explicit in `Notes` or `Open Questions`.
- If file paths are unknown, use functional areas instead of inventing them.
- If verification is missing, propose the smallest sensible verification in generic terms.
- Do not write code in the brief.

## Task Brief Template

Use this exact structure:

```md
# Task Brief

## Objective
Briefly describe what this batch of changes is trying to improve.

## Source Documents
- `<source file>`
- `<source file>`

## Scope
In scope:
- <items>

Out of scope:
- <items>

## Constraints
- <constraint>
- <constraint>

## Work Items

### 1. <Short title>
Type:
- UI / UX / QA / Accessibility / Copy / Logic / Data / Performance / Other

Source:
- `<source-file>#<section-or-topic>`
- `<source-file>#<section-or-topic>`

Problem:
- <what is wrong now>

Expected outcome:
- <what should be true after the fix>

Relevant files/areas:
- `<file, module, page, or area if known>`
- `<file, module, page, or area if known>`

Priority:
- High / Medium / Low

Verification:
- <test, check, or manual verification>

Notes:
- <optional edge case, dependency, ambiguity, or implementation hint>

### 2. <Short title>
(same structure for each item)

## Acceptance Criteria
- [ ] <observable result>
- [ ] <observable result>
- [ ] <observable result>

## Open Questions
- <question if unresolved>
- <question if unresolved>
```

If the user did not provide source documents, omit `Source Documents`.

## Normalization Rules

### Keep

- explicit problems
- explicit desired outcomes
- stated priorities
- stated constraints
- real dependencies or risks
- direct verification expectations

### Collapse

- duplicate findings
- the same issue repeated across QA and UX notes
- multiple notes that point to one root problem

### Move to Notes

- implementation hints
- speculative solutions
- edge cases
- unresolved ambiguity

### Do Not Invent

- exact file paths
- schema changes
- hidden business rules
- precise verification commands unless the repo already makes them obvious

## Implementation Rules

If the user wants implementation after the brief:

1. Read the repo entrypoint first.
If the repo has `docs/agents/README.md`, read it before touching code.

2. Read only the relevant supporting docs.
Typical routing:
- UI/layout/copy: `docs/agents/frontend-rules.md`
- game work: `docs/agents/runbooks/add-or-change-a-game.md`
- auth/data/sync/invites/public data: `docs/agents/runbooks/data-auth-sync.md`
- architecture/ownership: `docs/agents/architecture.md`
- verification: `docs/agents/testing-and-verification.md`

3. Inspect only the code paths named by the brief and those docs.

4. Before editing, produce a short execution summary:
- target outcome
- files to inspect/edit
- out-of-scope areas
- verification plan (include both Vitest unit tests under `src/` and Playwright specs under `tests/`)
- assumptions or blockers (e.g. PowerShell script execution restrictions requiring `cmd.exe /c npm ...` for npm scripts)

5. Then implement with minimal edits.

6. Finish with:
- files changed
- what changed
- what was verified (keep the test suite green and do not regress the coverage baseline of 38.61% stmts / 40.72% lines)
- residual risks or unverified areas

## Output Contract

### If the user asks for a brief only

Return only the normalized markdown brief.

### If the user asks for implementation too

Use the brief as the task contract, then implement from it. Do not keep re-explaining the brief once coding starts.

## Common Mistakes

- treating raw reports as implementation truth
- repeating the same issue in multiple work items
- mixing desired outcome with implementation details
- inventing file paths or schemas
- over-scanning the repo before routing through the brief
- over-verifying unrelated areas instead of using the smallest sufficient set

## Suggested Invocation

### From raw request

`Use $task-brief-and-implement-claude-web in brief-only mode. Convert these requirements into a Task Brief.`

### From multiple markdown reports

`Use $task-brief-and-implement-claude-web in brief-only mode. Normalize these markdown reports into one Task Brief.`

### From brief to code

`Use $task-brief-and-implement-claude-web in brief-and-implement mode. Treat this Task Brief as the task contract and implement it with minimal edits.`
