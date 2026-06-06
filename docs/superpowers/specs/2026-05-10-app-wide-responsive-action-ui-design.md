# App-Wide Responsive Action UI Design

## Goal

Expand the new `action card` UX/UI language from the Games home into the rest of the application, while keeping the non-mobile experience visually and behaviorally consistent with mobile.

## Approved Amendment — 2026-05-10

This spec includes the following approved scope adjustments and they override earlier wording when there is a conflict:

- `History` and in-game `Stats` are no longer separate visible surfaces in game detail. The visible merged surface is `Estadísticas` and each locale must translate that label naturally.
- The home filter set removes `Recientes`. Recent content may still appear in promoted sections, but it is no longer an explicit filter chip.
- Filtered views must show a dedicated no-results state instead of falling back to the generic no-matches empty copy.
- The Games filter ribbon must remain a single horizontal row with real `overflow-x` behavior and no wrapping.
- Sticky behavior is limited to the structural page chrome. In Games, the sticky region is the top header plus the filter ribbon. Featured, recent, and group headings are not sticky section headers.
- Navigation semantics stay shared across widths: mobile uses the bottom bar and may auto-hide while the user scrolls; desktop keeps the sidebar visible at all times and must not hide on scroll.

The target state is a single cross-screen design system:

- same visual grammar across mobile, tablet, and desktop
- same interaction semantics across widths
- no separate desktop-only UX model
- no emoji-led navigation, headers, or section identity
- no lazy loading for app sections or game screens

Desktop and tablet should feel like the same product as mobile, simply adjusted to available width.

## Product Intent

The current app mixes several UI generations:

- the new games home uses compact action cards and stronger hierarchy
- several pages still rely on emoji-heavy labels, older list cards, and larger vertical stacks
- desktop uses width, but not always in a way that preserves the newer mobile language

This redesign aligns the entire app around one system so that:

- navigation feels predictable regardless of screen size
- game-related flows and non-game flows belong to the same product
- the app becomes denser and easier to scan without becoming visually noisy
- larger screens reduce scroll and improve organization without introducing a different mental model

## Scope

This design includes:

- removing emojis from game and section identity across the app UI
- applying the new Games action-card language to all app sections
- redesigning non-mobile layouts to match mobile semantics and aesthetics
- removing lazy loading for app sections and game screens
- compacting game-related section layouts to match the newer design language
- normalizing shared headers, filters, chips, list cards, and section surfaces
- keeping routing and interaction contracts stable unless implementation requires a targeted adjustment

For avoidance of doubt, the merged `Estadísticas` surface and the mobile-only bottom-bar auto-hide are part of the approved scope.

This design covers:

- Games home
- Game detail
- History
- Stats-related entry surfaces
- Head to Head
- Rules
- Champions
- Profiles / public profiles
- Settings / About / Preferences / Theme / Advanced
- Admin and secondary utility pages where applicable

This design does not include:

- redesigning game scoring internals or rules content itself
- changing data models unless implementation reveals a missing derived-state need
- adding brand-new product features unrelated to the design alignment effort

## Core Design Principle

The app must use `the same UX/UI system across all screen sizes`.

This means:

- mobile defines the interaction model
- tablet and desktop adapt spacing, columns, and grouping
- tablet and desktop do not invent alternate workflows
- larger widths should improve scanability and density, not change how the product works

The guiding rule is:

`same aesthetics, same behavior, width-aware layout`

## Experience Rules

### 1. Mobile remains the source of truth

The non-mobile experience should inherit:

- the same content hierarchy
- the same action ordering
- the same naming and labels
- the same component semantics
- the same state language

Desktop should not introduce a second UI dialect.

### 2. Width changes distribution, not meaning

Allowed non-mobile adaptations:

- more columns
- better alignment of metadata and actions
- denser card rails or grids
- side-by-side surfaces when they preserve the same flow
- shorter vertical stacks where the same content can fit horizontally

Disallowed adaptations:

- replacing mobile cards with unrelated desktop table designs by default
- moving core actions into different interaction zones
- introducing desktop-only sidebars that change task order
- creating distinct page identities that break the shared system

### 3. Compactness without crowding

The app should become more compact, especially in game-adjacent sections, but compactness must preserve:

- touch reliability
- text readability
- theme contrast
- state clarity

The target is tighter vertical rhythm, not cramped UI.

## Visual System

### 1. No emojis as structural identity

Emojis should be removed from:

- game headers
- section headers
- filter chips
- list cards
- rules cards
- settings rows
- cross-game badges where emoji is the primary identifier

Identity should come from:

- typography
- color
- game accent tokens such as `--gc`
- hero SVGs
- spacing and component form
- restrained badges and labels

If any emoji remains in the product, it should be justified as content, not as core navigation or structural chrome.

### 2. Shared surface language

All major app surfaces should converge on a common structure:

- compact header area
- stable content shell
- cards or rows with shared radius, border, and surface treatment
- quiet metadata
- clear action placement

The newer Games home should be treated as the visual reference point.

### 3. Stronger component reuse

The app should prefer a small set of reusable patterns:

- hero / section headers
- action cards
- compact list cards
- chips and filters
- section labels
- info rows
- badges
- tab bars

The goal is to remove the sense that each page was designed independently.

### 4. Reduced visual noise

The redesign should actively reduce:

- unnecessary iconography
- over-large headers
- repeated ornamental labels
- inconsistent spacing between pages
- heavy button blocks where lighter controls are enough

The new system should feel more disciplined and more product-like.

## Home and Game Surfaces

### 1. Home remains the anchor pattern

The new home action-card model remains the system anchor:

- card tap enters the game
- quick actions remain explicit
- recent and featured content preserve current approved behavior
- game hero SVG identity remains the visual hero

### 2. Game sections become more compact

Game-related sections should visually align with the new home:

- tighter cards
- more controlled metadata
- less ornamental vertical space
- consistent spacing between sections
- cleaner headers and tabs

This includes:

- Game detail header and tab region
- History surfaces
- Head to Head surfaces
- Rules grouping cards
- champion/stat entry surfaces

### 3. Detail views keep the same flow

Game detail should preserve its current meaning:

- back
- game context
- tabs
- new match / history / stats flows

But its presentation should be normalized:

- no emoji-led title row
- more compact top chrome
- stronger visual relation to the home card language
- better desktop/tablet width usage without changing the tab behavior

## Non-Game Sections

### 1. Settings and About

These pages should move closer to the same design language:

- compact header hierarchy
- cleaner row/card design
- less visual dependence on emojis
- shared chip, card, and label treatment
- width-aware grouping that still behaves like mobile

Sub-pages such as preferences, theme, advanced, and about should feel like part of the same product as Games, not a different admin panel.

### 2. Champions, profiles, and utility pages

These sections should align to the same system through:

- shared section headers
- shared card density
- consistent badges and metadata styling
- removal of older ornamental motifs that clash with the Games redesign

### 3. Admin and secondary pages

Admin or utility pages do not need to become decorative, but they should still inherit:

- the same surface rules
- the same spacing rhythm
- the same typography hierarchy
- the same no-emoji structural rule

## Responsive Behavior

### 1. One responsive system

The app should scale from mobile to large desktop through a single set of rules:

- mobile-first base layouts
- width-based densification
- optional column increases where content remains semantically the same
- stable action order

### 2. Desktop and tablet adaptations

Expected non-mobile behaviors:

- content may shift from single column to two-column groupings
- card stacks may become tighter grids
- section headers may sit alongside utility controls when space allows
- long pages may use horizontal grouping to reduce scroll

These changes must preserve the same reading order and interaction meaning from mobile.

### 3. Navigation consistency

Shared shell and navigation behaviors must remain intact unless a targeted implementation change is required.

Desktop must not become a different app frame. It should remain the same app with better width usage.

## Loading Strategy

Lazy loading should be removed completely for app sections and game screens.

Target behavior:

- all main sections are available immediately in-session
- all game screens are available immediately in-session
- first-entry delays into sections should disappear

This may increase initial bundle cost, so implementation should be careful and explicit about the tradeoff, but the approved product direction is clear:

`prioritize immediate section availability over deferred section loading`

## Compatibility Constraints

Implementation should preserve whenever feasible:

- routing structure
- current navigation expectations
- `data-testid` contracts
- quick-action behavior
- current saved-match semantics
- draft and resume behavior

Any required contract adjustment should be minimal and updated in tests during the same change.

## Risks

The main risks are:

- pushing compactness too far and harming readability
- introducing inconsistencies while partially migrating older pages
- increasing bundle size after removing lazy loading
- making desktop feel denser but not actually clearer
- visual regressions across dark, light, and OLED themes

## Mitigations

The design mitigates those risks by:

- using one source system instead of per-page redesigns
- adapting width without changing semantics
- preserving tested interaction contracts
- validating visual legibility in all supported themes
- treating the Games home as the baseline reference for the rest of the app

## Testing and Validation Expectations

Implementation should validate at least:

- emoji removal from game and section UI chrome
- immediate availability of sections without first-entry lazy load delay
- consistency of desktop/tablet layouts with mobile semantics
- quick actions and game navigation remaining intact
- game detail tab behavior unchanged
- history, rules, settings, and profile flows still navigable
- dark, light, and OLED behavior
- mobile, tablet, and desktop layout quality
- no regressions to routing, overlays, or back navigation
- text legibility over hero SVGs and compact cards

## Design Summary

This redesign turns the Games action-card language into the app-wide UI system.

The resulting product should:

- feel like one app instead of multiple visual eras
- behave the same on mobile and non-mobile
- use larger widths to improve density and scanability without changing meaning
- remove emoji-led structural UI
- eliminate lazy loading across app sections and game screens
- make all shared pages visually consistent with the newer Games design direction
