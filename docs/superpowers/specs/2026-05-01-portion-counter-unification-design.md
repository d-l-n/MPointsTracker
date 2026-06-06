# Portion Counter Unification Design

## Goal

Replace the current `porciones` section, which is modeled as multiple separate food games, with a single unified game that lives under the `random` section.

The unified game must let the user pick one predefined food at match setup time, then use the existing tap-based counting flow for that chosen food.

## Product Rules

The implementation must follow these rules:

- The current `porciones` group disappears from the home catalog.
- The current separate food entries stop being directly playable catalog games:
  - `sushi`
  - `pizza`
  - `hamburguesa`
  - `pancho`
  - `empanadas`
  - `facturas`
  - `sanguchitos`
  - `cookies`
- A single new game appears under the `random` group.
- The unified game represents the whole portion-counter concept.
- The user must choose exactly one predefined food before the match starts.
- The food can only be chosen at the beginning of the match.
- The chosen food cannot be changed during the match.
- There is no free-text or custom-food option.
- The existing counting interaction remains the core mechanic:
  - choose player
  - tap the center food icon
  - increment that player's count
- The unified game tagline must be:
  - `Elegí la comida y apuesten a cuantas unidades llega cada uno!`

## Scope

This design includes:

- replacing the `porciones` catalog group with one unified game in `random`
- moving predefined foods from game-catalog entries into internal game data
- updating the portion-counter setup flow to require food selection
- preserving the current counting gameplay once the match starts
- saving the chosen food as part of the match record
- updating affected catalog, detail, rules, and about surfaces

This design does not include:

- custom foods
- changing food mid-match
- migrating historical saved matches
- adding a real betting mechanic

## User Flow

### 1. Enter from `random`

The user opens the unified portion-counter game from the `random` section.

The game card should communicate that the user chooses a food first, rather than opening into a generic counter with no identity.

### 2. Set up players

The setup keeps the familiar structure used by other multiplayer games:

- group picker
- linked players
- add/remove player controls
- save player group
- duplicate-name blocking

### 3. Choose food

Before the match can start, the setup must show a visual selection block for predefined foods.

Available foods:

- Sushi
- Pizza
- Hamburguesa
- Pancho
- Empanadas
- Facturas
- Sanguchitos
- Cookies

Each option must be presented as a selectable visual card with:

- emoji
- name
- color identity
- clearly visible selected state

The user can choose only one food.

### 4. Start match

The match can start only when:

- at least one valid named player exists
- no duplicate player names exist
- one food has been selected

When the match starts, the chosen food becomes fixed for that match.

### 5. Count portions

Once the match starts, the interaction remains based on the current `PorcionNewMatch` flow:

- scoreboard strip
- player selection
- radial player nodes
- center food icon for tap counting
- reset action with confirmation
- save action once there is meaningful progress

The chosen food must drive the visible identity of the match:

- center emoji
- accent color
- contextual labels where appropriate

## UX Design

## Setup Structure

The setup screen should have two clear blocks:

- `Players`
- `What are you counting?`

This keeps the existing multiplayer pattern while making the food choice feel like a first-class match decision.

## Food Selection UI

The food picker should feel like choosing the theme of the match, not like selecting from a dropdown.

Requirements:

- grid or card layout
- touch-friendly targets
- strong selected state
- mobile-first spacing

The visual selection should make the unified game feel intentionally redesigned rather than merely merged.

## Match Identity

Once the match begins, the chosen food must remain obvious without reopening setup.

At minimum:

- the center tap button shows the chosen food emoji
- the game accent color follows the chosen food color
- contextual text may refer to the chosen food

## Technical Design

## Catalog Changes

Update the game catalog in [src/data/games.ts](C:/Users/dylan/mpoints-tracker/src/data/games.ts):

- remove the old food entries from the playable catalog
- add one unified playable game entry under `random`
- keep a stable dedicated id for the new game, such as `portion_counter`

Update the home grouping in [src/App.tsx](C:/Users/dylan/mpoints-tracker/src/App.tsx):

- remove the `porciones` group
- add the new unified game id to `random`

## Food Data Model

The predefined foods should stop living as top-level playable games.

Move them into a dedicated data source, for example:

- [src/data/portionFoods.ts](C:/Users/dylan/mpoints-tracker/src/data/portionFoods.ts)

Each food should define:

- `key`
- `name`
- `emoji`
- `color`

This keeps the food catalog independent from navigation/game registration.

## Game Component Changes

Reuse [src/components/games/PorcionNewMatch.tsx](C:/Users/dylan/mpoints-tracker/src/components/games/PorcionNewMatch.tsx) as the implementation base.

Required changes:

- add setup state for selected food
- block match start until one food is selected
- persist the selected food in the draft
- use the selected food during the playing phase
- reset must return to setup and clear the active match state, including food selection

## Saved Match Data

Saved matches should preserve the current overall shape, with added food metadata.

Keep existing fields such as:

- `id`
- `date`
- `players`
- `winner`
- `rounds`

Add:

- `foodKey`
- `foodName`
- optionally `foodEmoji`

At minimum, `foodKey` and `foodName` should be saved so history remains understandable and future filtering remains possible.

## Historical Matches

Historical matches for the old separate food games remain untouched.

This design does not include migration.

Implications:

- old food-specific matches stay under their original game ids
- new portion-counter matches are saved under the unified game id

## Affected Screens

At minimum, review and update:

- [src/pages/GameDetail.tsx](C:/Users/dylan/mpoints-tracker/src/pages/GameDetail.tsx)
- [src/App.tsx](C:/Users/dylan/mpoints-tracker/src/App.tsx)
- [src/pages/SettingsPage.tsx](C:/Users/dylan/mpoints-tracker/src/pages/SettingsPage.tsx)
- [src/pages/RulesPage.tsx](C:/Users/dylan/mpoints-tracker/src/pages/RulesPage.tsx)

`AppInfoPage` should no longer need special collapsing behavior for `porcion`-type games once the catalog becomes truly unified.

## Translations

Update translations for:

- the new unified game name
- the unified game tagline:
  - `Elegí la comida y apuesten a cuantas unidades llega cada uno!`
- the food-selection block labels
- any contextual portion-counter copy that should reflect the selected food

Legacy food taglines may become unused, but they should not be removed blindly until implementation confirms they are no longer referenced anywhere.

## Testing

Add or update tests for:

- home catalog no longer shows the `porciones` group
- `random` contains the new unified game
- setup blocks start until a food is selected
- selected food is shown during the playing phase
- reset returns to setup
- saved match includes chosen food metadata
- draft persistence restores the selected food correctly

## Risks

- If the food definitions remain entangled with `GAMES`, the unified design will still be structurally modeled as multiple hidden games.
- If saved matches do not record the chosen food, the new history entries will lose important context.
- If translation cleanup is done too aggressively, old match views may lose labels needed for historical entries.

## Acceptance Criteria

- The `porciones` group no longer appears in the home catalog.
- A single unified portion-counter game appears under `random`.
- The user must select one predefined food before starting the match.
- The chosen food remains fixed during the match.
- The counting gameplay continues to work as before.
- New saved matches preserve which food was counted.
