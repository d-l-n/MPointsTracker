# Task Brief Template

Use this exact structure when generating a normalized implementation brief.

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
- <optional edge case, dependency, or ambiguity>

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

If the user did not provide source documents, omit the `Source Documents` section and keep `Source:` entries inside each work item only if they are still meaningful.
