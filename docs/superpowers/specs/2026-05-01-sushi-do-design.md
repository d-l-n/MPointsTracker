# Sushi Do! Design

## Goal

Add `Sushi Do!` as a new standalone card game in the cards section of the app, with scoring and flow aligned to the rules provided by the user and the PDF.

The app will not simulate live card trading. It will track the match structure around that physical play: selected flavors in play, failed `Sushi Do!` calls, successful round wins, accumulated points, and match end at `500`.

## Product Rules

The implementation must follow these rules:

- `Sushi Do!` is a separate game entry from the existing `Sushi` porciones counter.
- Minimum players: `2`.
- Maximum players: `9`.
- The deck has `9` possible flavors:
  - `Roll` = `85`
  - `Temaki` = `70`
  - `Tempura` = `100`
  - `Maki` = `80`
  - `Sashimi` = `75`
  - `Palitos` = `50`
  - `Salsa de Soja` = `55`
  - `Wasabi` = `60`
  - `Niguiri` = `65`
- Before the match starts, the app must choose exactly one flavor per player.
- The default suggestion must use the highest-value flavors first, without repetition.
- The user can replace suggested flavors manually, but flavors cannot repeat.
- A round ends only when a player truly completes `6` cards of the same flavor and that flavor is confirmed in the app.
- If a player calls `Sushi Do!` incorrectly, the app must register a `-20` penalty and the same round must continue.
- A successful round win adds the fixed value of the chosen flavor one time only.
  - Example: winning with `Maki` adds `80`, not `80 x 6`.
- The match ends immediately when a player reaches or exceeds `500`.

## Scope

This design includes:

- new game catalog entry and navigation placement
- a dedicated `Sushi Do!` match screen
- pre-match flavor selection based on player count
- round resolution by successful flavor or failed call penalty
- draft persistence, undo, saved-match output, and targeted tests

This design does not include:

- simulation of card exchanges during play
- any modification to the existing `Sushi` game built on `PorcionNewMatch`
- new rules-page content unless implementation shows it is needed for consistency

## User Flow

### 1. Open game

The user opens `Sushi Do!` from the cards section.

### 2. Set up players

The setup screen follows the app's normal multiplayer pattern:

- linked players supported
- saved groups supported
- duplicate-name warning preserved
- start blocked unless player count is between `2` and `9`

### 3. Select flavors in play

After valid players are entered, the screen shows a flavor-selection step before the match can start.

Rules for this step:

- The number of selected flavors must equal the number of players.
- The initial suggestion is the top `N` flavors by score, where `N = player count`.
- No flavor may be repeated.
- Each selected slot can be changed manually.
- Only flavors not already used can be chosen for another slot.

For example:

- `2` players: `Tempura`, `Roll`
- `3` players: `Tempura`, `Roll`, `Maki`
- `5` players: `Tempura`, `Roll`, `Maki`, `Sashimi`, `Temaki`

The UI should also offer a reset action that restores the top-score suggestion.

### 4. Play match

Once the match starts, the app shows:

- accumulated scoreboard to `500`
- current round number
- active flavors in play for this match
- a control to choose which player called `Sushi Do!`

After choosing a player, the app shows two resolution paths:

- `Confirmar sabor completado`
- `Registrar penalización -20`

### 5. Resolve successful call

If the player actually completed `6` equal cards:

- the app shows only the flavors selected for this match
- the user chooses the completed flavor
- the app adds that flavor's fixed score to the selected player
- the round closes
- the round counter advances by `1`
- the event is recorded in the round log and history stack
- if the player reaches `500+`, the match ends

### 6. Resolve failed call

If the player called `Sushi Do!` incorrectly:

- the app subtracts `20` points from that player
- the event is recorded in the round log and history stack
- the current round stays open
- no flavor is consumed or selected
- the round counter does not advance
- the match continues immediately

## UI Design

## Setup Screen

The dedicated `Sushi Do!` setup should have three sections:

- player setup
- flavors in play
- start action

### Player setup

Reuse the app's familiar setup structure:

- group picker
- linked-player inputs
- add/remove player actions
- save group button

Constraints:

- min `2`, max `9`
- duplicate names blocked from start, consistent with existing game flows

### Flavors in play

This section appears when the player list is valid.

Each chosen flavor should be shown as a compact card with:

- ingredient/flavor name
- point value
- current slot index

Each slot needs a selector with only remaining unused flavors.

The section should also show:

- current suggestion basis: highest-value flavors
- count validation: `N de N sabores elegidos`
- a `Restaurar sugerencia` action

### Start action

The match can start only when:

- player count is valid
- all flavor slots are filled
- no flavor repeats

## Match Screen

### Scoreboard

The scoreboard should match the style of the app's other multiplayer games:

- sorted by highest score
- leader/winner highlight
- progress bar relative to `500`
- current round shown in header

### Active flavors panel

The screen should keep the match's selected flavors visible during play so users can verify which flavors are legal for the current match.

Each flavor chip/card should show:

- name
- score

### `Who called Sushi Do!` action

The main action area should ask which player called `Sushi Do!`.

The user chooses one player, then resolves the event through one of two actions:

- successful flavor completion
- failed call penalty

### Successful flavor selector

This selector must show only `flavorsInPlay`, not the full list of 9.

Each option should visibly show:

- ingredient/flavor
- fixed score

This directly supports the requested UX: choose the card and see the ingredient and its value.

### Penalty action

The penalty action should be a direct, explicit button:

- label clearly indicates `-20`
- does not require picking a flavor
- leaves the round active

### Round log

The active round needs a visible event log so users can understand what happened before the round closes.

Example entries:

- `Ana intentó Sushi Do!` → `-20`
- `Pedro completó Maki` → `+80`

This log should remain readable until the round is closed, and then roll into match history.

### Undo

The screen needs `Deshacer último evento`.

Undo must restore:

- player scores
- open/closed round state
- current round number
- event log
- winner/game-over state if affected

## Data Model

## Game catalog

Add a new game entry:

- id: `sushi_do`
- name: `Sushi Do!`
- type: dedicated new type, not `porcion`
- visible under the cards section

The existing `Sushi` game is out of scope for this change.

## Match draft shape

The in-progress draft needs at least:

```js
{
  players: [{ id, name }],
  selectedFlavors: ["tempura", "roll", "maki"],
  scores: { [playerId]: number },
  rounds: 0,
  history: [],
  roundEvents: [],
  inProgress: true,
  gameOver: false,
  winner: null
}
```

`selectedFlavors` is part of match identity and must persist in drafts and rematches.

## Event history shape

Each history item should be explicit enough to support undo:

```js
{
  type: "penalty" | "round_win",
  playerId,
  flavorKey: "maki" | null,
  delta: -20 | 80,
  roundBefore,
  scoreSnap,
  roundEventsSnap,
  winnerSnap
}
```

The implementation may use different property names, but it must preserve enough previous state to restore the full screen after undo.

## Saved match shape

Saved matches should remain compatible with the rest of the app:

```js
{
  id,
  date,
  players: [{ name, score }],
  winner,
  rounds,
  flavorsInPlay: ["tempura", "roll", "maki"],
  roundLog: [...]
}
```

The minimal compatibility requirements are:

- `players`
- `winner`
- `rounds`
- `date`

Additional metadata is allowed for future edit/history support.

## Architecture

Use a dedicated game component instead of extending `GenericNewMatch`.

Recommended responsibilities:

- `src/data/games.ts`
  - add `sushi_do` catalog metadata
- `src/pages/GameDetail.tsx`
  - route the new game type to a dedicated component
- `src/components/games/SushiDoNewMatch.tsx`
  - own setup, flavor selection, round resolution, scoring, draft persistence, save, and undo
- `src/data/sushiDo.ts`
  - centralize flavor definitions and score ordering
- tests
  - new game-specific Playwright coverage

The flavor list should not be duplicated inline across UI and tests. Keep a single source of truth for:

- flavor keys
- display labels
- scores
- default ranking order

## Validation Rules

## Setup validation

- block start below `2` players
- block start above `9` players
- block duplicate player names
- require exactly one flavor per player
- block repeated flavors

## Match validation

- cannot resolve `Sushi Do!` without selecting a player
- successful call can choose only from `flavorsInPlay`
- penalty always applies `-20`
- penalty never advances the round
- successful flavor always advances the round by exactly `1`
- successful flavor adds only its fixed value once
- game ends immediately at `500+`

## Edge Cases

- A player may go below `0` after a failed call.
- Multiple failed calls may happen in the same round.
- A round may contain many penalties before one valid winner.
- The player who first records a valid winning event at `500+` wins immediately.
- Draft restore must keep the same selected flavors and open round state.
- Rematch should preserve players and should preferably preserve selected flavors for convenience unless implementation constraints make that unsafe.

## Testing Strategy

## Targeted coverage

Add Playwright coverage for:

- opening `Sushi Do!` from the cards section
- setup enforcing min/max players
- auto-suggested flavors for a given player count
- manual flavor replacement with no duplicates allowed
- in-match successful call showing only selected flavors
- failed call applying `-20` and keeping the same round open
- valid round win adding the fixed flavor score exactly once
- match ending when a player reaches `500`
- undo restoring previous state after both penalty and round-win events

## Regression goals

The change must not break:

- game catalog navigation
- standard multiplayer setup behavior
- draft persistence
- saved match rendering in history/stats

## Acceptance Criteria

This design is successful if:

- `Sushi Do!` appears as a new standalone game in the cards section
- player count is restricted to `2-9`
- the setup suggests the top `N` scoring flavors and allows non-repeating replacement
- successful round resolution only offers flavors in play
- failed `Sushi Do!` calls apply `-20` and keep the same round open
- valid round wins add the selected flavor's fixed value once
- the match ends at `500+`
- undo and draft restore work with the round-open penalty flow
