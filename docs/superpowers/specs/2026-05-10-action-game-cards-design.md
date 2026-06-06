# Action Game Cards Design

## Goal

Redesign the games home and its shared interaction language around `action cards`, with a stronger mobile-first UX and a generative SVG identity per game.

## Alignment Note — 2026-05-10

This home-spec remains the conceptual base for the app-wide rollout, with these approved clarifications:

- `Recientes` is no longer a standalone filter chip.
- Recent content can still exist as promoted content, but not as a separate filter surface.
- The third quick action now represents the merged `Estadísticas` surface, which includes the relevant history preview/entry behavior instead of a separate visible `History` tab.
- Home filters are expected to support a dedicated no-results state per filtered/search view.
- The Games filter rail is intentionally single-row and horizontally scrollable.

The new system must make the games surface feel less like a flat catalog and more like a decision hub:

- tap on a game card to enter that game's detail screen
- expose a small set of high-value quick actions directly on the card
- reflect relevant match state without changing the card's structural layout
- give each game a distinct but consistent visual identity through generative SVG artwork

## Product Intent

The current home already has a strong shell and visual style, but the game list behaves mostly like a styled list of entries. This redesign shifts the center of gravity toward the card itself as a reusable operational unit.

The product intent is:

- make the home faster for repeat use
- reduce friction to resume or start a match
- preserve visual personality without sacrificing scanability
- establish a UI grammar that can later extend to recent matches, favorites, and other launcher-style surfaces

## Scope

This design includes:

- redesign of the home game cards as action cards
- quick-action behavior and rules
- state behavior for inactive, recent, and in-progress games
- generative SVG direction per game
- home information architecture centered on action cards
- visual and UX constraints needed to keep the system readable

This design does not include:

- implementation details for a specific component split
- final SVG code generation logic
- changes to game-detail internals beyond the new entry behavior from home
- changes to rules, scoring, or saved-match data models unless implementation reveals a missing field for state derivation

## Core Interaction Model

Each game card becomes a `micro action hub`.

Primary interaction:

- tapping the card enters the game detail screen

Quick actions:

1. `Continuar`
2. `Nueva partida`
3. `Estadísticas`

Rules:

- `Continuar` is shown only when there is a resumable or clearly continuable match for that game
- when `Continuar` is not available, it must not leave an empty slot
- in that case, `Nueva partida` and `Estadísticas` move forward as the visible actions
- quick actions must always preserve order semantics, even if one is absent

This yields a stable model:

- card tap = explore / enter
- quick action 1 = resume if possible
- quick action 2 = start a fresh flow
- quick action 3 = inspect performance / history summary

## Card Structure

Each card should use a fixed structural template across all games.

### 1. Hero zone

The upper portion of the card is reserved for the game's generative SVG.

Requirements:

- visually dominant area
- wide horizontal composition
- readable under text overlay
- constrained enough to work in dark, light, and OLED variants

This zone carries identity first, not operational detail.

### 2. Info zone

The info zone contains:

- game name
- one short metadata line
- one optional status badge

The metadata line should not try to summarize everything. It should choose the most useful secondary signal for the current state, for example:

- `500 pts · Clásico`
- `En curso · 4 jugadores`
- `12 partidas · Última hace 2 días`

Only one metadata line should be visible in the default card state.

### 3. Quick-action zone

The lower band of the card holds the quick actions.

Requirements:

- actions must be explicit, not hidden behind a menu
- they must stay in the same vertical region across all cards
- the action band must not overpower the hero art
- the band should read as a compact operational rail, not as a block of heavy buttons

### 4. Status layer

State signals should be additive and restrained:

- `En curso`
- `Reciente`
- `Favorito`
- `12 partidas`

Only one strong badge should be promoted at a time. Secondary status signals can exist, but they must remain quiet and not compete with the card title or actions.

## Game State Behavior

The card layout should remain structurally stable. State changes must alter emphasis, not architecture.

### 1. No recent activity

Behavior:

- quiet card state
- hero SVG carries more presence
- visible quick actions: `Nueva partida`, `Estadísticas`

The card should feel inviting rather than empty.

### 2. Recent activity without active match

Behavior:

- subtle `Reciente` treatment
- metadata can shift toward recency or usage
- visible quick actions remain `Nueva partida`, `Estadísticas`

This state gives memory without creating urgency.

### 3. Match in progress

Behavior:

- show `En curso` as the dominant badge
- `Continuar` becomes the first visible quick action
- `Nueva partida` remains available
- `Estadísticas` stays available but visually quieter

The card should clearly invite resuming, but not mutate into a separate component.

### 4. Frequent or favorite game

Behavior:

- same layout as the base card
- optional secondary signal such as favorite badge or pinned ordering

Do not redesign the card for this state. Ranking or ordering should do more work than decoration.

## Quick Action Rules

Quick actions should feel immediate and touch-friendly, but visually lightweight enough to preserve hierarchy.

Recommended rules:

- `Continuar` gets the strongest emphasis when present
- `Nueva partida` is always available
- `Estadísticas` is always the most visually silent action
- avoid disabled buttons for unavailable actions
- avoid hidden overflow menus for primary gameplay actions

Interaction rules:

- the card body and hero remain tappable as a large target to enter the game
- quick actions must not cause accidental navigation into the detail screen
- the hit areas must remain comfortably mobile-sized

## Generative SVG System

The SVG layer should behave as a semantic identity system, not as decorative wallpaper.

Each game's artwork should derive from a controlled visual grammar:

- limited number of layers
- clear silhouette or large-shape composition
- restrained motion or state-based intensity when needed
- shared rendering logic with per-game parameters

### Shared grammar

All game SVGs should share these constraints:

- panoramic composition
- 2 to 4 layers maximum
- large, legible forms
- limited fine detail
- controlled use of transparency
- restrained text inside artwork

This keeps the catalog coherent and avoids a patchwork effect.

### Family motifs

Artwork should reflect game mechanics or physical affordances:

- `UNO / DOS / Flip`: card stacks, curves, number/symbol cutouts, layered motion
- `Truco / Chinchón / Canasta / Rummy`: straighter card geometry, diagonals, framed tension, table tactics
- `Chancho`: playful circular motifs, fragmented letters, noisier rhythm
- `Generala`: grids, pips, repeated modular dice structures
- `Ajedrez`: board geometry, lines of control, inferred piece presence
- `Blackjack / Poker`: suit symbols, chips, stronger contrast, nightlife tension

The goal is recognition through pattern language, not literal illustration.

### Color behavior

Each game should still derive from its existing color identity, but the artwork should use tonal variation instead of a single flat fill:

- base hue
- darker support tone
- translucent surface tone
- one controlled highlight tone

This preserves depth without forcing generic gradients.

### State response in artwork

The SVG can shift subtly by state:

- `En curso`: slightly stronger highlight, active edge, or living accent
- `Reciente`: mild contrast lift
- idle state: calmer, flatter energy

These changes must remain subtle. State should not require separate art per condition.

### Implementation direction

The preferred technical direction is a small SVG template engine with a few reusable composition families and parameters such as:

- motif
- density
- angle
- symbol set
- accent color
- state intensity

This supports a larger game catalog without requiring handcrafted one-off art for every entry.

## Home Information Architecture

The home should stop behaving like a plain list of game entries and become a `launcher + resume hub + catalog`.

### 1. Compact header

The header should remain expressive, but it should consume less vertical space than it does today.

Recommended contents:

- strong page title
- saved matches count as secondary info
- avatar / sync / lightweight status controls on the right

The goal is to give more breathing room to the cards themselves.

### 2. Search as utility

The search control should remain available but lose visual dominance.

Recommended behavior:

- utility-level prominence
- placeholder aligned to action intent, such as `Buscar juego o partida`
- integration with nearby filters rather than acting like a major card itself

### 3. More operational filters

Filters should not be only catalog categories. They should also support intent and current context.

Suggested filter set:

- `Todos`
- `En curso`
- `Recientes`
- `Favoritos`
- `Cartas`
- `Fichas`
- `Clásicos`

This helps the home feel useful even for returning users who already know the catalog.

### 4. Featured continuation row

If there is an in-progress match, the home should promote one featured card above the standard list.

This promoted card should:

- use the same design language as the regular cards
- feel like a stronger instance, not a different widget
- prioritize resuming the current session

### 5. Main card rail / grid

The main body should organize cards by relevance, not only by family taxonomy.

Recommended order:

1. in-progress or continuation-promoted content
2. recent games
3. full game catalog

This ordering better matches actual use than a flat category-first stack.

## Visual Rules

This redesign only works if the system actively limits visual noise.

### 1. One dominant zone per card

The hero zone is the main visual moment. Quick actions, badges, and metadata must support it, not compete with it.

### 2. Lightweight quick actions

Quick actions should not be heavy CTA bricks.

Preferred treatment:

- pill or ghost-like controls
- one stronger emphasis when `Continuar` is present
- clear touch targets
- restrained fill and border weight

### 3. Minimal text

Each card should stay within:

- game name
- one metadata line
- one optional prominent badge

Any deeper explanation belongs in the game detail screen.

### 4. State by emphasis, not redesign

State changes should adjust:

- badge
- border/accent emphasis
- quick-action emphasis
- SVG intensity

State changes should not produce a structurally different card.

### 5. Reduced glass inside cards

The app already uses a strong shell-level liquid glass language. To protect the artwork and improve legibility, the cards themselves should lean closer to translucent solid surfaces than to heavy blur-rich glass.

Recommended balance:

- strong glass for shell, nav, search, overlays
- softer, more stable surfaces for action cards

### 6. Motion restraint

Only a small motion set should be used:

- card entrance
- press / lift feedback
- subtle activation when a card becomes in-progress

Avoid constant shimmer or ongoing animation across the full catalog.

### 7. Stable sizing

Regular catalog cards should share one base height. If a featured continuation card exists, it should be a named variant with explicit layout rules.

### 8. Accessibility constraints

The redesign must preserve:

- readable text over the hero area
- sufficient contrast in all themes
- focus-visible states
- action labels that do not rely on color alone
- touch targets at least consistent with repo mobile rules

## Constraints and Compatibility

The implementation should preserve current routing expectations:

- tapping the game card still leads into the game detail flow
- quick actions may add deeper entry points, but must not break current navigation assumptions
- shared shell behaviors, bottom nav behavior, and mobile viewport constraints must remain intact unless deliberately changed

Existing styling conventions should be reused where possible:

- keep `--gc` as the game-level accent anchor
- reuse shared spacing and radius tokens before inventing new ones
- preserve the current mobile-first behavior of the shell

## Risks

The main risks of this redesign are:

- visual overload from combining generative art, glass, badges, and actions
- action ambiguity if the card tap target and quick actions are not clearly separated
- inconsistent game art quality across a large catalog
- overfitting the home to active users while making discovery worse for infrequent users

The design mitigates those risks by:

- keeping one stable card structure
- limiting text and badge density
- using a shared SVG grammar
- using state emphasis instead of state-specific layouts

## Testing and Validation Expectations

Implementation should validate at least:

- mobile usability of card tap versus quick-action tap
- presence/absence logic for `Continuar`
- no empty quick-action gaps when continuation is unavailable
- home layout behavior in dark, light, and OLED modes
- visual legibility of hero SVGs under real game names and metadata lengths
- behavior with long lists, no recent games, and multiple active drafts if supported

## Design Summary

The redesign establishes a consistent action-card system for the game catalog:

- the card itself opens the game
- quick actions provide direct operational shortcuts
- state is expressed through emphasis, not layout changes
- generative SVGs provide a reusable, semantic visual identity per game
- the home becomes a decision surface instead of a decorative list

This is the intended foundation for a more action-oriented, visually distinctive, and scalable game-launching UX.
