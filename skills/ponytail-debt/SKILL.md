---
name: ponytail-debt
description: >
 Harvest every `ponytail:` comment in the codebase into a debt ledger, so the
 deliberate shortcuts and deferrals ponytail leaves behind get tracked instead
 of rotting into "later means never". Use when the user says "ponytail debt",
 "/ponytail-debt", "what did ponytail defer", "list the shortcuts", "ponytail
 ledger", or "what did we mark to do later". One-shot report, changes nothing.
---

Every deliberate ponytail shortcut is marked with a `ponytail:` comment naming
its ceiling and upgrade path. This collects them into one ledger so a deferral
can't quietly become permanent.

## Scan

Grep the repo for comment markers, skipping `node_modules`, `.git`, and build
output:

`grep -rnE '(#|//) ?ponytail:' .` (add other comment prefixes if your stack uses them)

Each hit is one ledger row. The comment prefix keeps prose that merely mentions
the convention out of the ledger.

## Output

One row per marker, grouped by file:

`: — . ceiling: . upgrade: .`

The convention is `ponytail: , `, so pull the ceiling
and the trigger straight from the comment. Want an owner per row too? add
`git blame -L,`.

Flag the rot risk: any `ponytail:` comment that names no upgrade path or
trigger gets a `no-trigger` tag, those are the ones that silently rot.

End with ` markers,  with no trigger.` Nothing found: `No ponytail: debt. Clean ledger.`

## Boundaries

Reads and reports only, changes nothing. To persist it, ask and it writes the
ledger to a file (e.g. `PONYTAIL-DEBT.md`). One-shot. "stop ponytail-debt" or
"normal mode" to revert.
