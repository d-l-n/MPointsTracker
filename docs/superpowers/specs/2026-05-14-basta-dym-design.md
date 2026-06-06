# Basta! de DyM Design

## Goal

Add `Basta! de DyM` as a new playable entry in the app without introducing a custom game screen. The app should expose it from the visible catalog, route it through the shared generic match flow, and include it in rules and statistics surfaces.

## Product Shape

- Visible catalog entry:
  - `id`: `basta_dym`
  - `name`: `Basta! de DyM`
  - `type`: `basta_dym`
  - `color`: dedicated blue accent
  - `tagline`: score-based word/category play
- Home placement:
  - group: `Random`
- Detail screen:
  - uses `GenericNewMatch.jsx`
  - supports round scoring, winner selection, undo, and early finish save
- Rules:
  - appears under `Random`
  - keeps the approved app-wide action-card language

## Rules Scope

This addition documents and supports the app-tracking layer, not a full digital simulation.

- The app tracks accumulated round scores.
- The app lets the group assign a round winner and save the full match.
- The app does not enforce category validation or duplicate-answer adjudication.
- The app assumes the physical game is played off-screen and the app records outcomes.

## UX Requirements

- `Basta! de DyM` must look consistent with the rest of the modernized catalog.
- The game must open from Home without introducing divergent navigation.
- The rules entry must match the shared action-card grammar now used across `Rules`.
- Translations must stay in parity for any new visible copy keys.

## Acceptance Criteria

1. `Basta! de DyM` is visible in Home under `Random`.
2. Clicking the card opens `/game/basta_dym`.
3. The detail view renders the generic scoring flow and can save a match.
4. The saved match appears in stats/history consumers that read from shared game data.
5. The rules page shows a `Basta! de DyM` entry inside the `Random` group.
6. New copy keys are present in every supported locale.
