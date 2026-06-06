---
name: task-brief-and-implement
description: Use when raw requirements, QA findings, UX/UI notes, or one or more markdown reports need to be normalized into a clean implementation brief, or when an existing Task Brief should drive precise code changes with minimal context usage.
---

# Task Brief and Implement

## Overview

Use this skill in two modes:

- `brief-only`: turn raw input into a normalized `Task Brief`
- `brief-and-implement`: generate or refine the `Task Brief`, then implement from it

This skill is for execution preparation and controlled implementation. Treat source notes as request input, not as code truth.

## Quick Start

### Mode 1: Brief only

Use this when the user has:

- rough requirements
- QA notes
- UX/UI feedback
- multiple `.md` reports

Output only a clean `Task Brief` in markdown.

### Mode 2: Brief and implement

Use this when the user wants implementation in the same session.

Workflow:

1. Normalize the input into a short `Task Brief`
2. Read repo-specific guidance before coding
3. Inspect only the smallest relevant code paths
4. Implement the smallest correct change set
5. Run the smallest sufficient verification

## Required References

- Always read [references/task-brief-template.md](references/task-brief-template.md) before generating the brief.
- If the source input is messy, overlapping, or repetitive, also read [references/normalization-rules.md](references/normalization-rules.md).

## Brief Generation Rules

- Write the brief in English.
- Be concise and implementation-oriented.
- Separate `Problem` from `Expected outcome`.
- Merge overlapping findings when that reduces duplication.
- Keep ambiguities explicit in `Notes` or `Open Questions`.
- If file paths are unknown, use functional areas instead of inventing them.
- If verification is missing, propose the smallest sensible verification in generic terms.
- Do not write code in the brief.

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

- Treating raw reports as implementation truth
- Repeating the same issue in multiple work items
- Mixing desired outcome with implementation details
- Inventing file paths or schemas
- Over-scanning the repo before routing through the brief
- Over-verifying unrelated areas instead of using the smallest sufficient set

## Minimal Invocation Patterns

### From raw request

`Use $task-brief-and-implement in brief-only mode. Convert these requirements into a Task Brief.`

### From multiple markdown reports

`Use $task-brief-and-implement in brief-only mode. Normalize these markdown reports into one Task Brief.`

### From brief to code

`Use $task-brief-and-implement in brief-and-implement mode. Treat this Task Brief as the task contract and implement it with minimal edits.`
