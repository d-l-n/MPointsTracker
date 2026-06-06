# Frontend Rules

Use this file as a quick checklist before changing shared UI.
This is a frontend-only checklist. Repo-wide product and setup context lives in [../../README.md](../../README.md), while agent routing and verification guidance lives in [README.md](README.md) and the other docs in `docs/agents/`.

## i18n Rules

- Route every user-facing string through the translation system.
- Keep new translation keys in parity across all supported locales.
- Do not put translation logic, branching, or formatting behavior inside locale dictionaries.

## Layout Rules

- When editing shared layout, verify nav transitions, overlay open and close behavior, back navigation, settings access, and page-to-page routing still behave the same unless the task explicitly changes them.
- Preserve intended behavior across desktop and mobile viewports.
- Use `100dvh`, not `100vh`, for viewport-height layouts.
- Keep interactive targets at least `40px` for reliable mobile use.

## Styling Conventions

- Reuse existing CSS custom properties before introducing new tokens.
- Reuse existing game-color tokens and patterns such as `--gc` instead of inventing per-surface palettes.
- Match existing spacing, radius, glass treatment, and token usage in shared shell surfaces. Open `DESIGN.md` if the change alters those patterns.

## Interaction Contracts

- Preserve existing `data-testid` hooks unless the UI contract is intentionally changing; if you rename or remove one, update affected tests in the same change.
- Prefer incremental changes within existing patterns over broad UI rewrites.
- Treat shared controls and page-level actions as compatibility-sensitive unless the task says otherwise.

## When to Open `DESIGN.md`

- Open [DESIGN.md](../../DESIGN.md) for substantial visual work, layout re-theming, new surface patterns, or changes that affect the shared design language.
- Do not copy large portions of it into this file.
