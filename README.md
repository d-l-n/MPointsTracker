# MPOINTS TRACKER

> **26.08.09** · React + Vite + Firebase PWA · Multi-device score tracker for board and card games

**Read this in:** [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [中文](README.zh.md)

---

## Overview

MPoints Tracker is a **progressive web app** for keeping score during board and card games with friends. It has a catalog of **23 visible games** (UNO family, Truco, Chinchón, Rummy, Poker, Blackjack, Generala, Chess, Canasta, Burako and more), works **offline**, **syncs to the cloud**, supports **player linking and invitations**, and can be **installed on any device**.

**Deploy:** Cloudflare Pages
**Production URL:** `mpoints-tracker.pages.dev`
**Current release:** `26.08.09`

### Highlights

- 🎲 **23 games** with game-specific scoreboards, rules and stats (UNO family, Truco, Poker, Blackjack, Generala, Chess, Sushi Do!, Canasta, Burako, Chancho, Chinchón, Rummy and more).
- 📴 **Offline-first**: local persistence with `localStorage` (`bgt_v6`) + IndexedDB offline cache, with debounced cloud sync.
- 🔗 **Players & invitations**: link players by QR/UID, share matches, claim invites.
- 🎨 **Full theming**: light / dark / OLED, Material You (Monet) accent and a **custom accent color** picker.
- 🌍 **6 languages**: ES, EN, DE, FR, JA, ZH.
- 🏆 **Champions**: global rankings, head-to-head and public profiles.
- 🎵 **Spotify mini player** (optional): control music while you play.
- 📦 **Installable PWA** with service worker caching.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend / Auth | Firebase 11 (Auth + Firestore) |
| Local persistence | `localStorage` (`bgt_v6`) + IndexedDB (Firestore offline) |
| Styling | CSS custom properties + Liquid Glass design |
| i18n | Custom system (`TRANSLATIONS` + `useT` hook) |
| Tests | Playwright (multi-device) + Vitest |
| Deploy | Cloudflare Pages (`wrangler`) |

---

## Quick Start

```bash
npm install        # install dependencies (or: pnpm install)
npm run dev        # dev server on localhost:5173
npm run build      # production build in /dist
npm run preview    # preview the production build
npm run deploy     # build + deploy to Cloudflare Pages
```

### Testing

```bash
npm run test:unit  # unit tests with Vitest (jsdom)
npm run test       # Playwright E2E (requires the dev server running)
npm run test:logic # Playwright desktop logic suite
npm run test:layout# Playwright multi-viewport suite (7 projects)
npm run test:fast  # logic + foldable-closed
npm run lint       # ESLint
```

### Local verification without `npm`

The recommended local flow on this machine is:

```powershell
node .\scripts\verify-local.mjs
```

That runner executes, in order:

- `typecheck`
- `build`
- `vitest`
- a Playwright **browserless** contract suite
- a Playwright suite targeting Settings/Champions/game switches, booting `vite preview` itself (primary browser `msedge`, falling back to bundled Chromium; if neither can run it reports it in `test-results/local-verify/summary.json` instead of mixing it with a functional failure)

If you need to run individual steps with direct binaries:

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switches.spec.js
```

`node .\scripts\typecheck.mjs` uses `node_modules/typescript` when present and falls back to a temporary toolchain via `corepack pnpm dlx` (local cache in `.corepack/`).

---

## Project Structure

### Architecture at a glance

```
entry (main.tsx)
  └─ routes (routes.tsx / routeLoaders.ts)   → browser router, entry guards, prewarming
       └─ App.tsx                             → shell orchestrator: hooks, context, layout
            └─ AppLayout.tsx                  → chrome: header, bottom nav, section switching
                 ├─ HomeTab / GameDetail / Rules / Champs / Settings / Admin / History
                 └─ AppContext (context/AppContext.tsx) → shared app state
```

- **Routing** is URL-driven (`createBrowserRouter`) with lazy-loaded pages and route loaders that prewarm deep links to avoid visible fallbacks.
- **State** lives in focused hooks (`useTheme`, `useAuth`, `useMatches`, `useGameSession`, `useNavigation`, …) and is exposed app-wide through `AppContext`.
- **Data** flows through `services/*` (Firestore helpers) and `lib/*` (storage, stats, confetti, Spotify client).
- **Styling** is layered CSS (`tokens → base → components → utilities`) driven by design tokens; **no CSS-in-JS**.
- **i18n** is a small custom runtime: every visible string lives in `src/data/translations/*.ts` and every key must exist in **all 6 locales**.

### Directory tree

```
src/
├── App.tsx                    # Shell orchestrator: auth, theme, navigation, context wiring
├── main.tsx                   # Entry point: RouterProvider + service worker registration
├── routes/
│   ├── routes.tsx             # Browser router + entry guards + lazy pages
│   └── routeLoaders.ts        # Deep-link prewarming / validation for shell, history, settings, games
├── index.css                  # Style entry (layered CSS)
├── styles/
│   ├── tokens.css             # Design tokens + light/dark/oled themes + accent modes
│   ├── base.css               # Reset / base layer
│   ├── components.css         # Component layer
│   └── utilities.css          # Utilities and visual helpers
│
├── components/
│   ├── auth/                  # Login, QR scanner, user search, invite links, linked players
│   ├── games/                 # One NewMatch form per game + shared score inputs
│   ├── home/                  # HomeTab: catalog, filters, hero cards, homeModel (view model)
│   ├── settings/              # Settings sections (theme, effects, language, groups, account)
│   ├── seo/SEO.tsx            # Per-route meta tags
│   └── ui/                    # Reusable: AppShell, AppHeader, GroupPicker, Toast, ThemeToggle, …
│
├── context/
│   └── AppContext.tsx         # Shared app context (matches, groups, spotify prefs, …)
│
├── data/
│   ├── games.ts               # GAMES catalog (ids, names, colors, icons, tags)
│   ├── rules.ts               # Rules copy for RulesPage
│   ├── scoreTables.ts         # UNO family scoring tables
│   ├── sushiDo.ts             # Sushi Do! constants/helpers
│   ├── portionFoods.ts        # Portion counter food catalog
│   └── translations/          # 6 locales: es (default), en, de, fr, ja, zh
│
├── hooks/                     # useTheme, useAuth, useMatches, useGameSession,
│                              # useNavigation, useOnlineStatus, useWakeLock, useHaptic, …
├── lib/                       # storage, stats, confetti, firebase, inviteService, spotifyClient
├── pages/                     # GameDetail, HomeTab, Rules, Champs, History, Settings, Admin, …
├── services/                  # authService, userService, matchService (Firestore helpers)
└── types.ts                   # Shared TypeScript types
```

> **Conventions:** touch targets ≥ 40px, `100dvh` (never `100vh`), `data-testid` on interactive elements, all strings in `TRANSLATIONS`, memoization with `React.memo`/`useCallback` where it matters, sub-functions declared before their parent component.

---

## Game Catalog (23 visible games)

### UNO family
| ID | Name | Win condition |
|----|------|---------------|
| `uno` | UNO | 500 pts |
| `uno_no_mercy` | UNO No Mercy | 1000 pts + Mercy Rule |
| `uno_flip` | UNO Flip | 500 pts (light/dark side) |
| `uno_dos` | DOS | 200 pts |

### Card games
| ID | Name | Type |
|----|------|------|
| `truco` | Truco | Teams or individual, 15/30 pts |
| `chancho` | Chancho | Elimination by letters |
| `esquinados` | Esquinados | Round winner |
| `chin` | Chin | 1v1 without cards |
| `chinchon` | Chinchón | Elimination, 100 pts limit |
| `canasta` | Canasta | 5000 pts · Teams or individual |
| `sushi_do` | Sushi Do! | 500 pts · 6 equal per flavor |
| `rummy` | Rummy | 500 pts · Combinations |
| `burako` | Burako | 2000 pts · Individual or teams |

### Tabletop & board
| ID | Name | Win condition |
|----|------|---------------|
| `ajedrez` | Chess | 1v1, match winner |
| `monopoly` | Monopoly | Match winner |
| `life` | Life | Match winner |

### Casino & dice
| ID | Name | Type |
|----|------|------|
| `poker` | Poker | Round winner |
| `blackjack` | Blackjack | 21 with optional CPU |
| `generala` | Generala | 5-dice combinations |

### Casual
| ID | Name | Type |
|----|------|------|
| `racha_perdida` | Lost Streak | Broken-streak tracker |
| `portion_counter` | Portion Counter | Food picker + simple counter |
| `basta_dym` | Basta! | 3 theme cards · A-Z letters per round |
| `custom` | Free Play | Free / configurable score |

### Home / Games

- `HomeTab` composes a top editorial block with `featured` + `recent`.
- Only **Recent** uses a horizontal rail; the regular catalog does not reuse a scrollable rail.
- `homeModel.ts` avoids visual duplication: a game already promoted at the top is not rendered again in the lower catalog on the same view.
- Hero covers use a consistent placeholder and `loading="lazy"`; if the image fails, the vector hero remains as fallback.

### Internal hidden IDs

`sushi`, `pizza`, `hamburguesa`, `pancho`, `empanadas`, `facturas`, `sanguchitos`, `cookies`, `otros_porciones` — kept for compatibility/history and use `PorcionNewMatch`, but do not appear as visible games in Home.

---

## Data Architecture

### localStorage (`bgt_v6`)

```js
{
  uno: [ /* match array */ ],
  truco: [ /* ... */ ],
  __theme: true,        // legacy: persisted theme
  // ... rest of game IDs
}
```

### Firestore

```
users/{uid}/
  └── data: { same shape as localStorage }

users/{uid}/shared_matches/
  └── {matchId}: {
        ...matchData,
        _gameId, _sharedBy, _sharedByUid, _sharedAt
      }
```

### Match shape (UNO example)

```js
{
  id: "lm8k2abc",          // mkId() → timestamp36 + random
  date: 1713000000000,     // Date.now()
  players: [
    { name: "Ana", score: 520 },
    { name: "Beto", score: 310 },
    { name: "Carlos", score: 480 }
  ],
  winner: "Ana",
  rounds: 12,
  duration: 18,
  // game-specific fields...
}
```

---

## Internationalization (i18n)

**Languages:** `es` (default), `en`, `de`, `zh`, `ja`, `fr`

```js
// In App, the translator is created and shared via context
const t = useT(lang);
t("saveMatch");

// NEVER call t() inside TRANSLATIONS
// NEVER hardcode strings in components
// Every new key must exist in all supported languages
```

Detection: `detectLang()` → localStorage → `navigator.language` → fallback `es`

Decision in effect: `i18next` / `react-i18next` were evaluated in May 2026. The current decision is to **keep the custom system** for cost/benefit and runtime simplicity. See [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md).

---

## Routing & Auth

```text
createBrowserRouter
  ├─ /                 → App shell + prewarming loader
  ├─ /login            → Explicit auth entry
  ├─ /rules            → Rules
  ├─ /champions        → Champions
  ├─ /settings         → Settings + query-param normalization
  ├─ /history          → History + filter normalization
  ├─ /game/:gameId     → Active game + gameId validation + lazy preload
  └─ /admin            → ProtectedRoute → App shell
```

### Access flow

```text
/login
  ├─ authChecked=false → loading auth
  ├─ offline           → global banner + local copy (no sync promise)
  ├─ Google OAuth
  ├─ Email/Password → LoginForm (useFormStatus + useOptimistic)
  └─ Guest mode → no cloud sync

/admin
  ├─ fbAuth.currentUser || bgt_last_uid → allowed
  └─ no session → redirect to /login
```

### Persistence & sync

- `src/services/authService.ts` initializes `setPersistence(fbAuth, indexedDBLocalPersistence)`.
- `src/hooks/useAuth.ts` restores the session, loads `userdata/{uid}`, migrates legacy data and absorbs `shared_matches`.
- `src/hooks/useMatches.ts` debounces (1200ms) every change and calls `saveDataToCloud(uid, data)`.
- `src/hooks/useOnlineStatus.ts` feeds the offline fallback visuals.
- `src/routes/routeLoaders.ts` prewarms `App` and the active game on deep entries to avoid visible fallbacks.

---

## Theming

### Color modes

- `bgt_theme_mode`: `light | dark | system`
- Active theme derives: `system` follows the OS, and `dark` + `oled` enable pure-black OLED surfaces (`bgt_oled`).

### Accent modes

The accent drives the app **chrome** (bottom nav pill, stats view, active controls), while **game cards** and the **game detail screen** keep their per-game color.

- `bgt_theme_accent`: `default | monet | custom`
  - **Default** — the teal accent (`#006d77`).
  - **Monet** — Material You colors when available on Android (`android-dynamic-color` bridge) with a local fallback palette.
  - **Custom** — any hex chosen by the user (swatches + free color picker in *Settings → Preferences → App Theme*).
- `bgt_theme_custom_accent`: the user-picked hex (`#rrggbb`).
- The custom hex is exposed as inline `--theme-custom-accent` / `--theme-custom-on-accent` (on-accent derived from luminance), and `html[data-theme-accent="custom"]` rebuilds all accent roles via `color-mix` (containers, outlines, nav pill, controls) for light, dark and OLED.
- With an authenticated user, `themeAccent` / `themeCustomAccent` sync to `userdata/{uid}` (same pattern as `spotifyPosition`) and restore on other devices.

`useTheme.ts` separates base mode, accent and OLED. Monet uses a `DynamicThemeContract` + `data-theme-source="android-dynamic-color"` without faking a non-existent web API; custom color is an independent mode that does not compete with the bridge.

In CSS:

- `html[data-theme]` controls light/dark/oled surfaces
- `html[data-theme-accent="monet"]` re-maps `--accent-*` to Material roles
- `html[data-theme-accent="custom"]` re-maps `--accent-*` from the user hex
- `html[data-theme-source="android-dynamic-color"]` lets an external bridge inject `--dynamic-*`

OLED and Monet/Custom coexist: OLED dominates neutral/surfaces and the accent keeps tinting accents, focus, pills and controls.

---

## Spotify Mini Player

The Spotify option lives in *Settings → Preferences* and is **off by default**. When enabled, the app shows a global mini player with OAuth PKCE, Web Playback SDK and Spotify Web API: current song, artist, cover, active device, progress, expandable queue, live volume, shuffle, repeat, previous/next, play/pause, saved-song sync, song search, saved playlists, disconnect and transfer to the browser when the SDK registers a `device_id`. On scroll the player collapses into a floating button with the active cover and expands on tap.

Mobile specifics: tapping outside the expanded player closes it; scrolling also collapses it. The collapsed "bubble" position is configurable (Center, Left, Right, Draggable) and persisted in `bgt_spotify_position` (cloud: `spotifyPosition`).

To connect for real, set `VITE_SPOTIFY_CLIENT_ID` and add the redirect URIs:

- Production: `https://your-domain/settings`
- Local dev: `http://127.0.0.1:5173/settings` (and `http://localhost:5173/settings` if you use `localhost`)

Spotify requires a **Premium** account for web integrations. Tokens stay in `localStorage` and are removed on disconnect, logout or when Spotify rejects the refresh. The OAuth callback validates `state`, consumes the `code_verifier` once and cleans `code`/`state`/`error` from the URL.

Scopes: `streaming`, `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `user-library-read`, `user-library-modify`, `playlist-read-private`, `playlist-read-collaborative`. Sessions authorized before adding library/playlists must reconnect to grant those scopes.

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `bgt_v6` | Main data (matches + theme) |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` / `"custom"` |
| `bgt_theme_custom_accent` | Custom accent hex (`#rrggbb`) |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | Local Spotify OAuth PKCE tokens |
| `bgt_spotify_code_verifier` | Temporary OAuth login verifier |
| `bgt_spotify_oauth_state` | Temporary OAuth login state |
| `bgt_wakelock` | `"1"` if screen wake lock active |
| `bgt_oled` | `"1"` if OLED surfaces enabled |
| `bgt_splash_seen` | `"1"` once the splash was shown |
| `bgt_lang` | Saved language |
| `bgt_drafts` | In-progress drafts per game (`{ [gameId]: draft }`) |
| `bgt_haptic` | `"0"` if haptic feedback disabled |
| `bgt_reduce_effects` | `"1"` if reduced effects |
| `bgt_last_uid` | Last UID with a session (session hint) |
| `bgt_player_groups` | Saved player groups |
| `bgt_last_group_v` | Last group used per game |
| `bgt_nav_order` | Bottom nav order |
| `bgt_onboarding_seen` | `"1"` once onboarding is complete |
| `bgt_guest_mode` / `bgt_guest_name` | Guest mode / guest name |
| `bgt_install_dismissed` / `_later` | Install banner dismissal |

### Backup & history

*Settings → Preferences → Advanced* lets you export a full JSON backup of matches and import it on another device (import replaces local match data with the valid game keys, then uses the normal persistence/sync flow). The History view also exports the current filtered result (player, game, date) as JSON.

---

## PWA / Service Worker

- `public/sw.js`: `CacheFirst` for assets, `NetworkFirst` for Firestore requests, `StaleWhileRevalidate` for rules/offline documents.
- `public/manifest.webmanifest`: installable on Android/iOS/Desktop.
- Icons in `public/icons/` (16, 32, 180, 192, 512px).
- CORS/security headers in `public/_headers` (Cloudflare Pages) and redirects in `public/_redirects`.
- A strict Content-Security-Policy is configured for the deployed app (Spotify WebSocket domains included).

---

## Development Rules (critical)

```text
✅ ALWAYS 100dvh (never 100vh)
✅ Touch targets minimum 40px
✅ Complete files (never diffs)
✅ Sub-functions declared BEFORE the parent component
✅ React.memo / useMemo / useCallback where appropriate
✅ data-testid on interactive elements
✅ All strings in TRANSLATIONS (all supported languages)
❌ NO hardcoded strings
❌ NO t() inside TRANSLATIONS
❌ NO private global variables across modules
❌ NO circular dependencies
❌ NO inventing Firestore structures without evidence
```

---

## Key CSS Variables

```css
--bg        /* main background */
--bg2       /* secondary background (cards, modals) */
--tx        /* main text */
--tx2       /* secondary text */
--accent    /* global accent */
--gc        /* game color (injected inline per active game) */
--r         /* base radius */
--blur      /* backdrop-filter blur */
--glass-border  /* liquid glass border */
--nomercy   /* special UNO No Mercy / Blackjack color */
```

---

## UNO Data Model

The UNO family (`uno`, `uno_no_mercy`, `uno_flip`, `uno_dos`) no longer charges leftovers per loser. Each round uses a single aggregated input per card type and `SCORE_TABLES` computes the total; that total is credited once to the round winner.

UNO drafts can persist:

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` records non-destructive joins/leaves with `effectiveRound`. When a player leaves an ongoing match, the supported default is to keep them in the record and remove them only from the future active roster; the scoreboard keeps their historical score and winner buttons use only active players.

---

## Admin

- Admin access via Firebase custom claims `{ admin: true }` (verified in `useAuth.ts` via `token.claims.admin`).
- Set the claim from a trusted Firebase Admin environment and force an ID token refresh.
- The "Admin" nav item is only visible when the claim is `true`.
- `AdminPage.tsx` manages privileged operations.

---

## Adding a New Game

1. Create `src/components/games/NuevoJuegoNewMatch.tsx`
2. Add an entry in `src/data/games.ts` → `GAMES` object
3. Add new keys in `src/data/translations/*.ts` for all supported languages
4. Add a `getTagline()` mapping in `games.ts`
5. Add rules in `src/data/rules.ts`
6. Import the component in `GameDetail.tsx` and connect it via `game.type`
7. Add it to the corresponding group in `src/components/home/homeModel.ts`

---

## Supported Devices (Playwright)

| Project | Viewport |
|----------|---------|
| `mobile-small` | 375×667 |
| `mobile-large` | 430×932 |
| `tablet` | 768×1024 |
| `foldable-open` | 717×512 |
| `foldable-closed` | 412×914 |
| `desktop` | 1280×800 |
| `layout-legacy` | 1280×800 |
| `logic` | 1280×800 |

Tests live in `./tests/` · Config in `playwright.config.js`
