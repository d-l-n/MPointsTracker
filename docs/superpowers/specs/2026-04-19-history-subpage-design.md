# History As Sub-Page Design

## Goal

Replace the current top-level `History` navigation section with a reusable app-level sub-page that is reachable only from:

- the `Home` history widget
- each game's `History` entry point

The `Home` widget must open history pre-filtered to the game of the most recently saved match across the whole app. Entering history from a game must open the same page pre-filtered to that game.

## Current State

- `App.tsx` exposes `history` as a top-level nav pill and renders `GlobalHistoryPage`.
- `HomeTab` has a stats/history widget that currently navigates to `nav === "history"`.
- `GameDetail` renders an embedded `HistoryTab` inside each game.
- `GlobalHistoryPage` and `HistoryTab` overlap heavily in filtering, edit, delete, and empty-state behavior.

## Desired UX

### Entry points

- `Home` history widget opens the global history sub-page.
- The initial game filter is set to the game id of the newest saved match in the app.
- A game detail `History` entry opens the same history sub-page.
- The initial game filter is set to the current game id.

### Navigation

- The top-level nav pill for `history` is removed.
- `History` becomes a sub-page layered under the current app flow.
- When opened from `Home`, back returns to `Home`.
- When opened from a game, back returns to that game detail view.
- Android/system back follows the same behavior as tapping the back button.

### Filtering behavior

- The shared history page accepts an `initialGameFilter`.
- On first render, the page applies that filter automatically.
- When opened from a specific game, the game filter control is hidden because cross-game switching is no longer part of that flow.
- When opened from `Home`, the game filter control remains available so the user can change from the initial suggested game to another one.
- Search by player and date filters continue to work in both entry paths.

### Empty states

- If the app has no matches, `Home` does not show the history widget.
- If a game has no matches and its history sub-page is opened, the normal history empty state is shown.

## Recommended Implementation

### 1. Introduce app-level history sub-page state in `App.tsx`

Add state that represents whether the history sub-page is open and with what context:

- `source`: `"home"` or `"game"`
- `gameId`: initial game filter
- `lockGameFilter`: boolean

This state should sit outside the top-level nav model because history is no longer a first-class section.

### 2. Remove top-level `history` navigation

- Remove the `history` item from `NAV_BASE`.
- Remove the `nav === "history"` rendering branch.
- Update nav-related tests and counts accordingly.

### 3. Reuse `GlobalHistoryPage` as the single history UI

Expand `GlobalHistoryPage` so it can handle both contexts:

- accept `initialGameFilter`
- accept `lockGameFilter`
- optionally accept a `key` or reset signal if needed to ensure the initial filter is reapplied per entry

This page remains the only place that owns:

- search filter
- date filter
- game filter
- edit/delete match actions
- empty/no-results states

`GlobalHistoryPage.tsx` should stop being the main rendering path for history. It can be removed later if no longer referenced.

### 4. Convert game history access into navigation

The `GameDetail` history tab should no longer render the embedded list. Instead:

- selecting `history` opens the app-level history sub-page for that game
- returning from the sub-page lands back in the same game detail context

To minimize disruption to existing UI copy and tests, the game can keep a visible `History` tab button, but the button becomes an entry action rather than an embedded content panel.

### 5. Render the sub-page with its own header

Add a dedicated header in `App.tsx` for the history sub-page:

- back button
- title using the existing `globalHistory` translation
- existing right-side controls if they are consistent with other sub-pages

This keeps the history page visually aligned with `Settings` sub-pages and public profile flows.

## Data Flow

### Home entry

1. Flatten all matches across games.
2. Sort descending by `date`.
3. Take the newest match.
4. Open the history sub-page with:
   - `source: "home"`
   - `gameId: newestMatch._gid`
   - `lockGameFilter: false`

### Game entry

1. User activates the `History` entry from `GameDetail`.
2. App opens the history sub-page with:
   - `source: "game"`
   - `gameId: currentGame.id`
   - `lockGameFilter: true`

## Back Behavior

Back handling order must include the new history sub-page before generic section navigation:

- if history sub-page is open from a game, close it and restore game detail
- if history sub-page is open from home, close it and restore home

This prevents Android/system back from skipping directly to `Home` or collapsing the wrong layer.

## Testing

### Required updates

- update nav pill count tests because `history` is removed from top-level nav
- update widget navigation tests so they assert sub-page rendering instead of active nav pill state

### Required new coverage

- `Home` widget opens history pre-filtered to the newest match game
- entering history from a game opens the shared history page filtered to that game
- back from history returns to the correct origin
- date/search filters still work in the shared page
- edit/delete still work from the shared page in both entry contexts

## Risks

### Initial filter not resetting across openings

If the shared page instance persists state between openings, a later entry could keep stale filters. Mitigation: reset page-local filter state whenever the sub-page context changes.

### Tab semantics in `GameDetail`

Existing tests and user expectation may assume `History` is an in-place tab. Mitigation: keep the tab label, but use it as the entry to the sub-page and update tests accordingly.

### Back-stack regressions

The app already customizes browser back behavior. The new sub-page must be added to that priority order explicitly to avoid broken return flows.

## Out of Scope

- introducing URL routing
- redesigning history cards
- changing stats calculations
- changing match save/edit/delete data models
