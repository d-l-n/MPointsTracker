# Monet Theme, Global Header Autohide, and UNO Roster Editing Design

**Date:** 2026-05-25

**Status:** Approved for planning

## Goal

Add a Material You / Monet theme path with real Android integration support, extend scroll-driven chrome autohide to all pages with headers, and refactor the entire UNO family so in-progress matches support roster changes and round scoring is entered by card type instead of by losing player.

## Scope

This design covers:

- app theme settings and theme state
- CSS token architecture for light, dark, OLED, and Monet variants
- Android integration contract for real dynamic color input
- global header autohide behavior
- UNO family scoring model changes
- UNO in-progress roster editing and persistence
- targeted verification and documentation

This design does not cover:

- non-UNO game scoring model changes
- native Android wrapper implementation inside this repository
- historical backfill of already-saved matches

## Current State

The repo already includes:

- `themeMode` with `light` / `dark` / `system`
- `oledEnabled`
- `reduceEffects`
- mobile bottom bar autohide on scroll
- UNO-family setup with add/remove players before the match starts

The repo does not currently include:

- a Monet theme option
- a web-to-Android dynamic color bridge
- global header autohide
- UNO-family aggregated round entry by card type
- UNO-family roster editing after the match has started

## Constraint: Real Monet Integration

The web app by itself cannot reliably read Android Material You wallpaper-derived dynamic colors through a standard web API. Real dynamic color integration therefore requires two layers:

1. A **web fallback layer** that can render a Monet-like token set and consume externally-provided dynamic tokens.
2. An **Android bridge contract** that a future native wrapper can implement to inject real Material You roles into the web runtime.

The design must never pretend that pure browser execution on Android exposes full Material You dynamic colors. The implementation should be honest:

- in plain web/PWA mode, use static Monet fallback tokens
- in Android-bridged mode, prefer injected dynamic roles

## User Decisions Already Confirmed

- Monet should be “real integration” when running on Android with bridge support.
- Monet and OLED must work together the way Android commonly combines accent colors with deep-black dark surfaces.
- Header autohide should apply to all pages with headers.
- UNO changes apply to the entire UNO family.
- Round entry should use one aggregated input per card type and points should always go to the round winner.
- Score mini-tiles should prioritize player-name visibility.
- In-progress roster edits must prompt whether the removed player’s data should remain in the record.

## Approach Options Considered

### Option 1: Web-only fake Monet

Use a static Material-like palette and market it as Monet.

Pros:

- simple
- no bridge contract

Cons:

- not real integration
- misleading behavior on Android

### Option 2: Hybrid bridge-ready Monet

Add a Monet theme mode, static fallback roles, and a runtime bridge contract that can override them with Android-provided dynamic roles.

Pros:

- honest platform behavior
- works now in web
- supports real Android integration later without redesign

Cons:

- more moving parts
- requires careful token architecture

### Option 3: Android-only Monet

Expose Monet only if a native wrapper is present.

Pros:

- avoids fallback ambiguity

Cons:

- poor UX in the current repo
- settings become environment-dependent and harder to test

### Recommendation

Use **Option 2**. It preserves truthfulness, supports the current repo, and avoids repainting the architecture later.

## Design

### 1. Theme Model

Theme state should become a combination of:

- base mode: `light | dark | system`
- accent mode: `default | monet`
- oled: `boolean`
- reduce effects: `boolean | system-derived`

Derived theme output should separate:

- surface mode
- accent source
- effective theme identifier for CSS

Examples:

- `light + default + oled=false`
- `dark + monet + oled=false`
- `dark + monet + oled=true`

OLED should affect surfaces and contrast behavior, not disable Monet. Monet should continue supplying accent and role colors while OLED forces deep-black neutral surfaces.

### 2. Android Dynamic Color Bridge Contract

The web runtime should support a read-only bridge payload available at startup and refreshable during runtime. The contract should be narrow and explicit:

- source marker: `android-dynamic-color`
- theme role payload
- timestamp/version marker

Expected role families:

- primary
- onPrimary
- primaryContainer
- onPrimaryContainer
- secondary
- onSecondary
- secondaryContainer
- onSecondaryContainer
- tertiary
- onTertiary
- tertiaryContainer
- onTertiaryContainer
- surface
- surfaceVariant
- onSurface
- onSurfaceVariant
- outline
- error
- onError

If the bridge is absent or invalid:

- fall back to local static Monet tokens
- do not fail rendering
- do not hide the Monet setting

### 3. CSS Token Architecture

The current token system should be refactored into layers:

1. structural neutrals
2. semantic accent roles
3. component aliases

Structural neutrals:

- background
- content surfaces
- glass surfaces
- borders
- shadows
- text ramps

Semantic accent roles:

- `--accent-primary`
- `--accent-primary-container`
- `--accent-secondary`
- `--accent-tertiary`
- `--accent-outline`

Component aliases:

- `--gc`
- navigation pill accents
- button emphasis
- game detail accent surfaces
- focus ring colors

OLED + Monet should:

- keep OLED black and near-black neutrals
- replace default accent hues with Monet roles
- preserve text contrast and reduced blur compatibility

### 4. Settings UX

Settings should group app appearance controls under one coherent area:

- color mode
- Monet accent mode
- OLED
- reduced effects / transparency

Behavior:

- Monet is available regardless of OLED
- Monet description must explain:
  - fallback in browser-only mode
  - dynamic colors when Android bridge is available
- OLED description must explain:
  - affects surfaces in dark mode
  - can coexist with Monet

The settings UI must not imply a conflict between Monet and OLED.

### 5. Global Header Autohide

Any page header that is part of app chrome should participate in the same scroll-response language as the mobile bottom bar.

Rules:

- applies to pages with app-level headers
- only on mobile bottom-bar layouts
- disabled when overlays/modals/nav-leave dialogs are active
- resets to visible on route changes and major context changes

Behavior:

- scrolling down hides header and bottom nav together
- idle or reverse interaction reveals them
- desktop sidebar layouts do not hide page chrome

Implementation should use shared visibility state rather than each page owning separate scroll listeners.

### 6. UNO Family Scoring Model

The UNO family should stop collecting card leftovers per losing player. Instead, the round UI should collect aggregated counts by card type for the whole table.

Meaning:

- number cards or low-value cards entered once per category
- action cards entered once per category
- wild/special cards entered once per category
- winner selected separately
- score calculator totals the aggregate leftovers and awards them to the winner

This model applies to the full UNO family handled by `UnoNewMatch.tsx`, including variants such as:

- classic UNO
- UNO Flip
- UNO No Mercy
- DOS if it shares the same screen logic

Variant-specific categories remain variant-specific, but the entry model becomes aggregated across the table.

### 7. UNO In-Progress Roster Editing

Roster editing should be allowed after the match begins.

#### Join behavior

- new players join from the next round onward
- initial score is `0`
- they have no participation in previous rounds
- they are eligible for future rounds only

#### Leave behavior

When removing a player after the match has started, the app must ask whether to preserve the player in the record.

Two supported outcomes:

1. **Keep in record** (recommended)
   - preserve historical score
   - mark the player inactive for future rounds
   - add a roster event noting the leave round

2. **Remove from active roster only when safe**
   - allowed only if the player has not affected persisted round history in a way that would make deletion misleading
   - otherwise the UI should steer the user back to “keep in record”

The implementation should prefer safety and auditability over destructive cleanup.

### 8. UNO Draft and Match Persistence

The draft format should grow explicit roster metadata:

- current roster
- inactive/left players
- roster events
- round boundaries that define join/leave timing

Roster events should minimally capture:

- event type: `join | leave`
- player id
- player name snapshot
- effective round number
- retention mode

Saved matches should preserve enough information to explain why a player appears with frozen score or partial participation. The exact persistence surface can be lightweight, but the saved artifact must remain truthful.

### 9. Score Mini-Tiles / Scoreboard Layout

The score mini-tiles should stop using rigid widths that hide names too aggressively.

Priority order:

1. keep full or near-full player names visible as long as possible
2. compress secondary decoration before truncating names
3. keep score legible
4. degrade gracefully on narrow screens

Likely adjustments:

- flexible name area
- smaller fixed progress region
- responsive rank/progress spacing
- more permissive min-width rules
- controlled wrapping or ellipsis strategy depending on variant

### 10. Testing Strategy

Required verification areas:

- theme settings behavior
- Monet fallback token application
- OLED + Monet coexistence
- header autohide on mobile pages with headers
- no header autohide regression on desktop
- UNO aggregate scoring logic
- UNO in-progress add/remove player flows
- UNO persistence behavior after roster edits
- scoreboard readability in narrow mobile widths

### 11. Documentation

Docs should be updated to explain:

- theme architecture and Monet bridge limitation/contract
- UNO roster event model
- verification expectations for this feature set

## Risks

1. `useTheme` is currently simple and local-storage based. Introducing an accent source plus optional external token injection can create regressions if the derived state model is not centralized cleanly.
2. `UnoNewMatch.tsx` currently owns many responsibilities. Roster editing plus scoring-model changes may justify extracting helpers or subcomponents.
3. Header autohide across all pages may cause perceptual jank if transitions are not applied consistently.
4. Saved-match truthfulness can drift if “remove player” is allowed destructively after the player already influenced scores.

## Explicit Product Recommendation for Removed Players

Default the leave flow to:

- “Keep player in record and stop counting future rounds”

Only expose destructive full removal when the player is effectively unused or when the draft can be safely rewritten without falsifying prior play.

This keeps the match log trustworthy and avoids subtle ranking corruption.

## Acceptance Summary

The feature is complete when:

- users can enable Monet from settings
- the app supports static Monet fallback in browser-only mode
- the app supports externally-injected Android dynamic roles without architecture changes
- Monet and OLED work together in dark mode
- all mobile pages with headers use shared autohide chrome behavior
- the UNO family uses aggregated card-type round entry
- in-progress UNO-family matches can add and remove players safely
- roster changes remain truthful in draft and saved records
- score mini-tiles show player names more reliably on narrow screens
