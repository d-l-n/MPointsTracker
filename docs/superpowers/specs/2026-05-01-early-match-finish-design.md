# Early Match Finish Design

## Goal

Add a consistent way to end a match before its natural target condition is reached, with an explicit confirmation flow and a clear winner decision.

This must work across the app's competitive match flows, including score-target games such as `Sushi Do!`, without changing the saved match shape or breaking natural end behavior.

## Product Rules

The implementation must follow these rules:

- Any game that already has enough in-progress state to be saved must also support manual early finish.
- If the match has already ended naturally according to that game's existing rules, saving should behave exactly as it does today.
- If the match has progress but has not ended naturally, the primary save action must become an explicit early-finish action.
- Early finish must require confirmation before the match is saved.
- The early-finish confirmation flow must offer two winner outcomes:
  - save with `no winner`
  - save with a manually selected winner
- A manually selected early-finish winner does not need to match the player currently leading on points.
- Choosing `no winner` must persist `winner: null`.
- The saved `players` ordering should continue following each game's current ranking logic unless that game already uses a different established ordering rule.

## Scope

This design includes:

- a shared UI flow for early finish confirmation
- contextual save/finish action text
- winner override handling during save
- rollout across competitive `*NewMatch.jsx` components that already support saving match progress
- targeted test coverage for natural finish and early finish

This design does not include:

- changing the saved match schema
- altering scoring rules, elimination rules, or target scores
- retroactive migration of existing saved matches
- applying the flow to non-competitive trackers that do not store a meaningful winner

## User Flow

### 1. Match reaches savable progress

The user starts a match and records enough progress for that game's current save flow to become meaningful, such as:

- one or more rounds recorded
- a live in-progress board with meaningful state
- a draft-backed playing state that is already persisted

### 2. Primary action reflects match state

If the match ended naturally:

- the primary action remains the normal `save match` action
- clicking it saves immediately using the game's existing winner logic

If the match is still in progress:

- the primary action label changes to an explicit early-finish label such as `Finish match`
- clicking it opens a confirmation modal instead of saving immediately

### 3. Confirm early finish

The confirmation modal explains that the match will be closed before reaching its normal finish condition.

The modal then offers:

- `No winner`
- `Choose winner`

If the user cancels, the match remains open and nothing is saved.

### 4. Resolve winner outcome

If the user chooses `No winner`:

- the modal confirms the early finish
- the match is saved with `winner: null`

If the user chooses `Choose winner`:

- the modal shows the eligible players for that match
- the user selects exactly one player
- the match is saved with that player's name as `winner`

## UX Design

## Primary Button Behavior

Use a single contextual primary action rather than separate permanent buttons.

- natural end state: `Save match`
- in-progress state: `Finish match`

This keeps the interface compact while making the early-finish intent explicit.

## Modal Behavior

The early-finish flow should follow the app's existing modal language and visual structure:

- same overlay behavior as `ConfirmModal`
- same action density and typography
- no branching into a separate page or screen

The content must remain short and direct:

- one title
- one explanatory message
- one clear winner choice step

## Winner Selection Rules

The modal must allow these outcomes:

- explicit `No winner`
- explicit single-player winner selection

The modal must not infer a winner automatically once the user has entered the early-finish flow. The user must choose either no winner or a specific winner.

## Technical Design

## Shared Component

Create a reusable UI component, proposed location:

- [src/components/ui/EarlyFinishModal.tsx](C:/Users/dylan/mpoints-tracker/src/components/ui/EarlyFinishModal.tsx)

Responsibilities:

- show early-finish confirmation text
- offer `no winner` vs `choose winner`
- show the list of eligible players when manual winner selection is chosen
- return a structured outcome to the parent component

Proposed result contract:

- confirm with no winner
- confirm with selected winner name
- cancel

The exact prop names can be chosen during implementation, but the output must be explicit enough that game components do not guess intent.

## Per-Game Integration

Each game component that already supports saving progress should define:

- whether there is enough progress to allow saving
- whether the match has reached its natural finished state
- which player names are eligible for manual winner selection

Eligibility must follow the existing game semantics:

- standard score races: all named players still in the match
- elimination flows: only players not already eliminated
- team or side based games: the same winner granularity the component already persists today

Each component's save handler should accept an optional winner override:

- default save path keeps existing behavior
- early-finish path passes a manual override or `null`

The component must preserve its existing ranking logic for `players`, while `winner` can be overridden by the early-finish decision.

## Initial Rollout Targets

At minimum, the rollout should cover:

- [src/components/games/SushiDoNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/SushiDoNewMatch.tsx)
- [src/components/games/UnoNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/UnoNewMatch.tsx)
- [src/components/games/GenericNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/GenericNewMatch.tsx)
- [src/components/games/TrucoNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/TrucoNewMatch.tsx)
- [src/components/games/BurakoNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/BurakoNewMatch.tsx)
- [src/components/games/CanastaNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/CanastaNewMatch.tsx)

Other competitive match components that already expose a save action before natural finish should adopt the same pattern in the same implementation pass if their integration is mechanically similar.

## Translation Changes

Add shared translation keys for all supported locales. Minimum expected keys:

- `finishMatchNow`
- `finishMatchEarlyTitle`
- `finishMatchEarlyMsg`
- `finishMatchNoWinner`
- `finishMatchChooseWinner`
- `finishMatchConfirm`
- `finishMatchSelectWinner`

Reuse existing `noWinner` where appropriate rather than duplicating that concept.

## Edge Cases

- If the user opens early finish and cancels, the current match state must remain untouched.
- If the user chooses manual winner selection, confirm must remain blocked until one player is selected.
- If the natural end condition is reached later, the component must still use the normal save path with no extra confirmation.
- Team-based games may still expose a single winner name only if that is how they already persist winners today.
- Games that already save with `winner: null` in some valid scenarios must continue supporting that output.

## Testing

Add targeted tests that cover:

- early finish becomes available once meaningful progress exists
- early finish opens confirmation instead of saving immediately
- early finish with `no winner` saves `winner: null`
- early finish with manual winner saves the selected player's name
- natural end state still saves without the early-finish confirmation flow

Minimum required coverage:

- `Sushi Do!` because it currently blocks save until `500+`
- one existing multi-round game that already allows partial saving, such as `UNO` or a `GenericNewMatch`-based game

## Risks

- Several components currently derive `winner` inline from ranking during save. Those paths must be updated carefully so manual winner overrides are not silently discarded.
- Some games use different state flags for natural completion, so the implementation should normalize the decision locally instead of assuming a single shared shape.
- UI copy needs to stay short enough for mobile layouts while still making early finish explicit.

## Acceptance Criteria

- `Sushi Do!` can be closed and saved before `500` through the early-finish flow.
- Competitive games with existing partial-save support use the same contextual finish behavior.
- Natural match endings still save exactly as before.
- The user can explicitly choose either `no winner` or a manual winner during early finish.
- Saved match records keep their existing structure.
