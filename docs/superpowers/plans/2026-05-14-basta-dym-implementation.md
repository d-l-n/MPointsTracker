# Basta! de DyM Implementation Plan

> Execute incrementally with implementation, verification, and documentation review before closure.

## Goal

Ship `Basta! de DyM` as a new visible game using the existing generic match system and include it in catalog, rules, translations, and stats surfaces.

## File Map

**Modify**
- `C:/Users/dylan/mpoints-tracker/src/data/games.ts`
- `C:/Users/dylan/mpoints-tracker/src/components/home/homeModel.ts`
- `C:/Users/dylan/mpoints-tracker/src/pages/GameDetail.tsx`
- `C:/Users/dylan/mpoints-tracker/src/data/rules.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/es.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/en.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/de.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/fr.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/ja.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/zh.ts`
- `C:/Users/dylan/mpoints-tracker/src/pages/ChampsPage.tsx`
- `C:/Users/dylan/mpoints-tracker/README.md`

**Create**
- `C:/Users/dylan/mpoints-tracker/tests/games/basta.spec.js`
- `C:/Users/dylan/mpoints-tracker/docs/superpowers/specs/2026-05-14-basta-dym-design.md`

## Tasks

- [ ] Add the catalog entry and tagline mapping in `games.js`.
- [ ] Add `basta_dym` to the Home `Random` group in `homeModel.js`.
- [ ] Route `basta_dym` through `GenericNewMatch.jsx` in `GameDetail.jsx`.
- [ ] Add the rules entry in `rules.js`.
- [ ] Add translation keys in every locale.
- [ ] Include the game in Champions/static game listings that still enumerate IDs.
- [ ] Add a focused Playwright spec that opens the game and saves a match.
- [ ] Update README and ship-supporting docs.

## Verification

- Focused logic suite:
  - `tests/games/basta.spec.js`
  - `tests/rules.spec.js`
  - `tests/routing-theme.spec.js`
- Shared regressions:
  - `tests/home-action-cards.spec.js`
  - `tests/champions.spec.js`
  - `tests/i18n.spec.js`
  - `tests/i18n-locales.spec.js`
  - `tests/translations-parity.spec.js`
