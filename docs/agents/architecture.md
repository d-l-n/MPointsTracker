# Architecture Map

Use this file as a fast implementation map. Open the listed paths first before editing behavior in the same area.

## Application Flow

- `index.html` boots the app by loading `src/main.tsx` directly.
- `src/main.tsx` is the typed entry point: it renders `RouterProvider` from `src/routes/routes.tsx` and registers `/sw.js` from `public/sw.js` only in production.
- `src/routes/routes.tsx` owns browser routing, top-level route coverage, and `ProtectedRoute` wrapping for `/admin`.
- `src/routes/routeLoaders.ts` owns route-entry normalization for history/settings URLs plus deep-link preload/validation for lazy game detail modules.
- `src/App.tsx` is the typed runtime orchestrator for splash flow, URL-derived nav state, auth screens, invite bootstrap, history/settings transitions, offline banners, and save-related app flows.
- `src/context/AppContext.tsx` provides the shared app-level context contract used below the app shell.
- `src/components/ui/AppLayout.tsx` owns the typed shell composition below `App.tsx`.
- `src/components/home/HomeTab.tsx` composes the typed Home/Games screen, and `src/components/home/homeModel.ts` derives grouping, featured, recent, filters, search results, and promoted-vs-catalog dedupe behavior.
- `src/pages/GameDetail.tsx` keeps the shared detail shell and mounts per-game forms through the lazy registry in `src/pages/gameDetailRegistry.tsx`.
- `src/pages/GlobalHistoryPage.tsx`, `src/pages/HeadToHeadPage.tsx`, and `src/pages/ChampsPage.tsx` own the typed history/champions surfaces; `GlobalHistoryPage.tsx` now uses pragmatic windowing for larger history sets.
- `src/pages/RulesPage.tsx` and `src/pages/PublicProfilePage.tsx` own the typed rules and public-profile surfaces.
- `src/pages/SettingsPage.tsx` owns the typed settings/profile surface, including nested prefs/theme/advanced/about subpages.
- `src/pages/FeedbackPage.tsx`, `src/components/auth/UserQRCode.tsx`, `src/components/auth/UserSearchModal.tsx`, `src/components/ui/ConfirmModal.tsx`, and `src/components/ui/VersionTapper.tsx` own the typed settings-adjacent satellite surfaces.
- `src/pages/AdminPage.tsx` owns the typed admin surface, and `src/components/auth/QRScanner.tsx` plus `src/components/ui/BlackjackCPU.tsx` close the typed QR/debug mini-cluster.

## Core Boundaries

- App shell and global flow: `src/App.tsx`
- Typed shell layout orchestration: `src/components/ui/AppLayout.tsx`
- Home/Games composition, promoted top-block layout, and view-model logic: `src/components/home/HomeTab.tsx`, `src/components/home/homeModel.ts`
- URL routing, route preload, and route guards: `src/routes/routes.tsx`, `src/routes/routeLoaders.ts`, `src/components/auth/ProtectedRoute.tsx`
- Shared app contract: `src/context/AppContext.tsx`
- Auth lifecycle and cloud bootstrap: `src/hooks/useAuth.ts`
- Shared debug logging: `src/hooks/useDebugLog.ts`
- Route-derived nav state and back-button behavior: `src/hooks/useNavigation.ts`
- Game selection/rematch session state: `src/hooks/useGameSession.ts`
- Nav mobile visibility and auto-hide behavior: `src/hooks/useNavVisibility.ts`
- Auth primitives and wrapper calls: `src/services/authService.ts`
- Online/offline shell state: `src/hooks/useOnlineStatus.ts`
- Local persistence, debounced sync, and match mutations: `src/hooks/useMatches.ts`
- Remote user and data I/O: `src/services/userService.ts`
- Remote shared-match I/O: `src/services/matchService.ts`
- Invite bootstrap state: `src/hooks/usePendingInvite.ts`
- Wake lock lifecycle: `src/hooks/useWakeLock.ts`
- Invite URL parsing and resolution: `src/lib/inviteService.ts`
- History/stat aggregation helpers: `src/lib/stats.ts`
- Typed history and champions pages: `src/pages/GlobalHistoryPage.tsx`, `src/pages/HeadToHeadPage.tsx`, `src/pages/ChampsPage.tsx`
- Typed rules and public-profile pages: `src/pages/RulesPage.tsx`, `src/pages/PublicProfilePage.tsx`
- Typed settings/profile page: `src/pages/SettingsPage.tsx`
- Typed settings-adjacent satellites: `src/pages/FeedbackPage.tsx`, `src/components/auth/UserQRCode.tsx`, `src/components/auth/UserSearchModal.tsx`, `src/components/ui/ConfirmModal.tsx`, `src/components/ui/VersionTapper.tsx`
- Typed admin and QR/debug surfaces: `src/pages/AdminPage.tsx`, `src/components/auth/QRScanner.tsx`, `src/components/ui/BlackjackCPU.tsx`
- Catalog, rules, and translations: `src/data/*`
- Game-specific match UI and input logic: `src/components/games/*`

## Runtime Responsibilities

- `src/App.tsx`
  - Composes hooks, context, route-derived view state, auth screens, game entry, and top-level UI state.
  - Owns invite bootstrap on mount, `/login` redirect-out when a user is already present, and offline banner behavior.
- `src/components/ui/AppLayout.tsx`
  - Owns screen-level shell rendering for auth, home, game detail, settings/profile, history subpage, nav chrome, and auth/nav-leave overlays.
- `src/routes/routes.tsx`
  - Owns `createBrowserRouter`, direct `App` mounting for top-level paths, route-level loader wiring, and path mapping for `/`, `/login`, `/rules`, `/champions`, `/settings`, `/history`, `/game/:gameId`, and `/admin`.
- `src/routes/routeLoaders.ts`
  - Owns invalid `gameId` redirects, lazy game-detail preload for `/game/:gameId`, and route-entry normalization for history/settings URLs.
- `src/components/auth/ProtectedRoute.tsx`
  - Owns route-level gating for private screens by checking `fbAuth.currentUser` and the stored session hint.
- `src/hooks/useAuth.ts`
  - Handles auth listener setup, redirect result handling, IndexedDB-backed persistence init, session state, profile bootstrap, cloud data pull, and shared match import.
- `src/services/authService.ts`
  - Owns sign-in, sign-out, redirect result handling, auth-state subscription wrappers, and `indexedDBLocalPersistence` setup.
- `src/hooks/useOnlineStatus.ts`
  - Owns browser online/offline detection for UI fallback, using events plus foreground reconciliation.
- `src/hooks/useMatches.ts`
  - Owns local state, local persistence, debounced cloud save, public stats save, and match CRUD helpers.
- `src/hooks/useNavigation.ts`
  - Owns route-to-shell state mapping, nav intent handling, history subpage entry/exit, and custom back-button behavior.
- `src/hooks/useGameSession.ts`
  - Owns selected game state, active tab, rematch draft creation, and linked-player session state.
- `src/hooks/useNavVisibility.ts`
  - Owns viewport-dependent nav mode and scroll-driven bottom-bar auto-hide behavior.
- `src/services/userService.ts`
  - Owns Firestore reads and writes for `users`, `userdata`, profile data, private data, public stats, and shared-match pull cleanup.
- `src/services/matchService.ts`
  - Owns Firestore fan-out for shared match delivery to linked players.
- `src/lib/inviteService.ts`
  - Owns invite code creation, URL parsing, invite lookup, expiry checks, and URL cleanup.
- `src/lib/stats.ts`
  - Owns shared stats aggregation and formatting helpers used by history, champions, and player/game stats views.
- `src/pages/GameDetail.tsx`
  - Owns the shared game-detail shell, tabs, rematch flow, and back/discard handling while delegating per-game form loading to the lazy registry.
- `src/pages/gameDetailRegistry.tsx`
  - Owns the lazy import registry and preload helpers for game-specific match components.
- `src/pages/SettingsPage.tsx`
  - Owns the settings/profile screen, typed nested subpages, local preference toggles, account actions, and player-group linking UI behind the shared shell route.
- `src/pages/FeedbackPage.tsx`, `src/components/auth/UserQRCode.tsx`, `src/components/auth/UserSearchModal.tsx`, `src/components/ui/ConfirmModal.tsx`, `src/components/ui/VersionTapper.tsx`
  - Own the typed feedback form, QR identity surface, player-link search flow, confirmation overlay, and version/debug entry points used by the settings/profile experience.
- `src/pages/AdminPage.tsx`
  - Owns the admin screen with reports, user summaries, aggregate stats, and privileged moderation actions behind the protected admin route.
- `src/pages/RulesPage.tsx`, `src/pages/PublicProfilePage.tsx`
  - Own the typed rules explorer and public-profile experience, including rules search/accordion state and public stats/head-to-head presentation plus account action confirmations on the self-profile path.
- `src/components/auth/QRScanner.tsx`, `src/components/ui/BlackjackCPU.tsx`
  - Own the typed QR capture flow used by player linking and the typed debug/easter-egg modal launched from the version entry point.
- `src/data/*`
  - Owns static definitions. Treat it as the source for game metadata, rules copy, and translations.

## Task Routing Guide

- App startup, shell behavior, route transitions, splash, auth gate, nav, settings/history transitions:
  - Inspect `src/routes/routes.tsx` and `src/routes/routeLoaders.ts` first for path ownership plus route-entry preload/validation, then `src/App.tsx` for top-level state, `src/components/ui/AppLayout.tsx` for shell composition, `src/pages/SettingsPage.tsx` for settings/profile subpages, and the typed settings satellites when the issue is in feedback, QR, version/debug, modal confirmation, or player-link search.
- Auth, login, logout, session restore, cloud bootstrap, player groups:
  - Inspect `src/hooks/useAuth.ts` first, then `src/services/authService.ts`, `src/components/auth/LoginForm.tsx`, `src/components/auth/UserSearchModal.tsx`, `src/components/auth/UserQRCode.tsx`, `src/components/auth/QRScanner.tsx`, and `src/services/userService.ts` for profile and data bootstrap concerns.
- Route access or private-screen redirects:
  - Inspect `src/components/auth/ProtectedRoute.tsx` and `src/routes/routes.tsx` first; include `src/pages/AdminPage.tsx` when the issue is inside admin-only UI after routing succeeds.
- Match save flow, local persistence, debounced sync, public stats, CRUD mutations:
  - Inspect `src/hooks/useMatches.ts` first, then `src/services/userService.ts`.
- Offline shell/auth fallback:
  - Inspect `src/hooks/useOnlineStatus.ts`, `src/components/ui/OfflineBanner.tsx`, and the auth entry wiring in `src/App.tsx`.
- Invite links and invite-driven entry flows:
  - Inspect `src/lib/inviteService.ts` and the invite bootstrap in `src/App.tsx`.
- Shared match delivery to linked users:
  - Inspect `src/services/matchService.ts` and the call sites that pass linked players.
- Game-specific scoring, forms, or validations:
  - Inspect `src/pages/GameDetail.tsx` and `src/pages/gameDetailRegistry.tsx` first, then the matching file in `src/components/games/*`.
- Home catalog, recent rail, featured/top-block layout, promoted/catalog dedupe, action cards, search, or grouping behavior:
  - Inspect `src/components/home/HomeTab.tsx` and `src/components/home/homeModel.ts` first, then `src/data/games.ts` if the issue is in catalog metadata.
- History, shared history pages, or player/game stats presentation:
  - Inspect `src/pages/HistoryTab.tsx`, `src/pages/GlobalHistoryPage.tsx`, `src/pages/HeadToHeadPage.tsx`, `src/pages/ChampsPage.tsx`, `src/pages/StatsTab.tsx`, `src/pages/RachaPerdidaStatsTab.tsx`, and `src/lib/stats.ts` first.
- Game catalog, rules content, labels, or translations:
  - Inspect `src/pages/RulesPage.tsx` for page behavior, then `src/data/*` for the underlying rules copy and metadata.
- Public profile, shared stats snapshot, or self-profile account actions:
  - Inspect `src/pages/PublicProfilePage.tsx` first, then `src/lib/publicData.ts`, `src/lib/stats.ts`, and `src/services/userService.ts` if the issue reaches normalization or persisted stats.
- Deep component needs shared app state or helpers:
  - Inspect `src/context/AppContext.tsx` before adding new props or duplicate local state.
- Version/debug easter egg or QR-specific interaction issues:
  - Inspect `src/components/ui/VersionTapper.tsx`, `src/components/ui/BlackjackCPU.tsx`, and `src/components/auth/QRScanner.tsx` first.

## Change Boundaries

- Keep app-wide orchestration in `src/App.tsx`. Do not push unrelated global flow into game components.
- Keep screen composition and shell chrome in `src/components/ui/AppLayout.tsx`. Do not re-spread that branching render logic back into `src/App.tsx`.
- Keep auth lifecycle and cloud bootstrap in `src/hooks/useAuth.ts`. Do not duplicate auth setup in pages or components.
- Keep route ownership in `src/routes/routes.tsx`, route-entry preload/validation in `src/routes/routeLoaders.ts`, and route-level access checks in `src/components/auth/ProtectedRoute.tsx`.
- Keep persistence and match mutations in `src/hooks/useMatches.ts`. Do not bypass it with ad hoc localStorage or Firestore writes from UI code.
- Keep remote I/O inside `src/services/*`, with `.ts` sources as implementation. UI, pages, and hooks should call service functions instead of embedding Firestore operations directly.
- Keep invite parsing and resolution in `src/lib/inviteService.ts`. Do not re-parse invite URLs in multiple places.
- Keep game-specific behavior in `src/pages/GameDetail.tsx` and `src/components/games/*`, not in `src/App.tsx`.
- Keep catalog, rules, and translation changes in `src/data/*`. Do not duplicate user-facing strings into components when translation data already owns them.
- Treat `src/context/AppContext.tsx` as a contract boundary. If you change its shape, review all consumers.
- Keep service worker registration behavior anchored in `src/main.tsx`.
- Keep auth form interactivity localized to `src/components/auth/LoginForm.tsx`; do not re-embed raw email sign-in markup into multiple screens.

## Design Reference Boundary

- For visual system, styling direction, or UI design rules, open `DESIGN.md`.
- Keep this document focused on runtime ownership and task routing, not visual guidance.
