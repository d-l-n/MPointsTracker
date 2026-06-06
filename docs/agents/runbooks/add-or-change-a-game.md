# Add or Change a Game

## When to Use This Runbook

- [ ] Use this runbook when adding a new game, adding a variant, or changing an existing game's UI, catalog entry, rules, translations, routing, save shape, history, or stats behavior.

## Code Paths Involved

- [ ] `src/data/games.ts` for the game catalog entry, `id`, `type`, display metadata, and tagline mapping.
- [ ] `src/data/rules.ts` for rules-page content when the game needs rules text or revised sections.
- [ ] `src/data/translations.ts` and `src/data/translations/*.ts` for shared translation wiring and locale-specific copy (`es`, `en`, `de`, `fr`, `ja`, `zh`).
- [ ] `src/pages/GameDetail.tsx` for per-game component selection and detail-tab behavior.
- [ ] `src/components/home/homeModel.ts` for home grouping, promoted-vs-catalog behavior, selection flow, and reachability from the intended UI path.
- [ ] `src/components/games/*` for the game-specific match entry UI.

## Required Checklist

- [ ] Add or update the game catalog entry in `src/data/games.ts` with a stable `id`, correct `type`, and display metadata that matches the intended card/group behavior.
- [ ] Add or update the game UI component in `src/components/games/*`, then wire it in `src/pages/GameDetail.tsx` so the correct match screen renders for the game type.
- [ ] Add or update user-facing copy in every supported locale file under `src/data/translations/*.ts`. Keep `src/data/translations.ts` aligned with the locale set and avoid shipping new hardcoded strings.
- [ ] Add or update `src/data/rules.ts` if the game should appear on the rules page or if the existing rules text changed.
- [ ] Confirm the game is reachable from the intended UI path in `src/components/home/homeModel.ts`, including the correct home grouping, promoted-vs-catalog behavior, and selection flow.
- [ ] If the match payload, scoring model, or saved shape changes, review save/load, history, and stats consumers before stopping.

## Verification Checklist

- [ ] Run the matching `tests/games/*.spec.js` file when one exists for the touched game.
- [ ] If shared components used by multiple games changed, run the smallest relevant cross-game regression set.
- [ ] If user-facing copy or locale keys changed, run the canonical i18n coverage: `tests/i18n.spec.js`, `tests/i18n-locales.spec.js`, and `tests/translations-parity.spec.js`.
- [ ] If rules text or rules-page behavior changed, run `tests/rules.spec.js`.
- [ ] If the save flow or match shape changed, also run the shared history/stats checks that cover the affected path.
- [ ] If the game is weakly covered or has no dedicated spec, do a manual create, save, history, and stats pass for that game.
- [ ] Manually confirm the game opens from the intended home/nav path and renders the expected game UI.
- [ ] If the flow now supports game-specific round metadata or draft persistence, manually confirm that in-progress state survives reload and that saved history/stats consume the final payload correctly.
- [ ] Manually confirm changed user-facing copy is translated where it appears.

## Definition of Done

- [ ] The game is reachable from the intended UI path.
- [ ] User-facing copy is translated for all supported locales.
- [ ] History and stats still behave correctly for the changed game flow.
- [ ] Verification evidence matches the touched surface.
