# i18n Evaluation — 2026-05-20

## Scope

This note closes Phase 5.3 of the post-TypeScript modernization plan.

The goal was to compare the current runtime i18n system against a realistic `i18next` / `react-i18next` adoption path and decide whether the migration would pay for itself now.

## Current Runtime Baseline

The app currently uses:

- `src/data/translations.ts` as the single runtime translation registry
- `useT(lang)` as a stable translator hook
- `detectLang()` + `saveLang()` for client-side language persistence
- `getTranslationParityReport()` to keep locale keys aligned with the default locale
- pre-bundled translation resources, with no async language backend and no provider-level initialization step

That already covers the requirements this app uses today:

- static resources bundled in the client
- nested translation keys
- local language detection and persistence
- predictable fallback behavior
- parity checks across shipped locales

## i18next PoC

I reviewed the current official docs for `i18next` and `react-i18next` and mapped the concrete migration shape against this repo.

Official references:

- [i18next getting started](https://www.i18next.com/overview/getting-started)
- [i18next API](https://www.i18next.com/overview/api)
- [react-i18next getting started](https://react.i18next.com/getting-started)
- [react-i18next i18next instance](https://react.i18next.com/latest/i18next-instance)

For this repo, a real adoption path would require at least:

1. Adding `i18next` and `react-i18next` runtime dependencies.
2. Creating and owning a global `i18n` instance module.
3. Wrapping app startup with provider binding.
4. Replacing `useT(lang)` call sites with `useTranslation()`.
5. Reworking translation parity tooling so it still runs against the new resource shape.
6. Auditing route and auth entry timing so initialization never regresses first paint or route transitions.

## Decision

Do **not** migrate to `i18next` in the current phase.

## Why

- The current system is already synchronous, small, and aligned with the app's actual needs.
- The repo does not currently need remote namespace loading, interpolation-heavy localization flows, ICU/plural pipelines, or translator-facing tooling that would justify the extra runtime and integration complexity.
- Adopting `react-i18next` would add a second initialization lifecycle to a codebase that already has route loaders, auth bootstrap, offline handling, and splash/login timing concerns.
- The existing parity report already solves one of the main operational problems for this app: keeping shipped locales aligned.

## Reinterpretation Of Phase 5.3

The original plan item said to evaluate `i18next` with a PoC and document the decision.

That was implemented as:

- official-doc review against the current toolchain
- concrete integration mapping to this repo's runtime
- explicit keep-vs-migrate decision

It was **not** implemented as a dependency installation or partial runtime migration, because the evaluation did not justify carrying that change into production.

## Revisit Trigger

Re-open this decision only if one of these becomes true:

- locales move out of the bundle and need async loading
- translators need external tooling or namespace workflows
- interpolation/pluralization requirements become materially more complex
- SSR or multi-surface localization requirements arrive
