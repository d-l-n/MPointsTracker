# Data, Auth, and Sync

## When to Use This Runbook

- [ ] Use this runbook when changing auth lifecycle, local persistence, cloud sync, invites, shared/public data, or Firestore access rules.

## Data Ownership Map

- [ ] `src/lib/storage.ts` owns the app-wide local storage key/version and the base local persistence helpers used by match state.
- [ ] `src/hooks/useDraft.ts` owns local draft storage for unsaved per-game drafts; it is browser-local only and does not sync to Firestore.
- [ ] `src/hooks/useAuth.ts` owns auth session lifecycle, initial cloud pull, legacy user-doc fallback, player-group sync, guest mode, and shared-match import on login.
- [ ] `src/routes/routes.tsx` owns explicit auth entry paths and route mapping for `/login` and `/admin`.
- [ ] `src/components/auth/ProtectedRoute.tsx` owns route-level access control for private screens.
- [ ] `src/components/auth/LoginForm.tsx` owns email sign-in submit UX, including React 19 `useFormStatus` and `useOptimistic` feedback.
- [ ] `src/hooks/useOnlineStatus.ts` owns browser online/offline detection used by the shell and auth entry fallback UI.
- [ ] `src/hooks/useMatches.ts` owns in-memory match state, local persistence on change, debounced cloud save, public stats publication, and cloud/shared merge behavior.
- [ ] `src/services/userService.ts` owns Firestore reads/writes for public `users/{uid}`, private `userdata/{uid}`, legacy user-doc reads, public stats writes, and shared-match inbox pull/delete.
- [ ] `src/services/matchService.ts` owns cross-user shared-match writes to `users/{uid}/shared_matches` and the share metadata attached to those payloads.
- [ ] `src/lib/inviteService.ts` owns invite code generation, URL param handling, Firestore `invites/{code}` persistence, TTL handling, and invite payload validation on read.
- [ ] `src/lib/publicData.ts` owns public profile normalization and public stats shape/aggregation helpers used before publishing or reading public-facing data.
- [ ] `firestore.rules` owns the enforcement boundary for public `users`, private `userdata`, shared-match inboxes, invites, and allowed document keys.

## Where to Change What

- [ ] Change `src/services/*` when Firestore collection paths, doc shapes, serialization, or cross-user writes need to change.
- [ ] Change `src/hooks/*` when React lifecycle, hydration order, merge timing, debounced sync, session transitions, or UI-facing auth/sync behavior changes.
- [ ] Change `src/routes/routes.tsx` or `src/components/auth/ProtectedRoute.tsx` when auth entry URLs, redirect behavior, or private-route access rules change.
- [ ] Change `src/lib/publicData.ts` when public profile normalization, public stats shaping, or shared public-data contracts change.
- [ ] Change `firestore.rules` when access control, allowed fields, or public/private collection boundaries change; keep rules aligned with the exact payloads written by services.
- [ ] Change `src/lib/*` for storage keys, invite URL helpers, TTL helpers, or other low-level browser/data utilities that hooks and services depend on.

## Change Safety Rules

- [ ] Do not invent new Firestore collections, documents, or fields without code evidence and explicit task intent.
- [ ] Preserve compatibility with existing localStorage, serialized JSON, and Firestore data shapes unless migration is explicitly part of the task.
- [ ] Verify public/private separation before moving fields between `users/{uid}` and `userdata/{uid}`.
- [ ] Treat sync behavior as app-global and regression-prone; review login hydration, local persistence, cloud persistence, public stats publication, and shared/invite flows together.
- [ ] Treat `/login` and `/admin` as part of the auth contract; auth changes are incomplete if route entry/redirect behavior is not reviewed.
- [ ] Keep `firestore.rules` and service payloads in lockstep; a field/key change in one is incomplete without the other.
- [ ] Preserve legacy read/migration behavior in `useAuth` and `userService` unless the task explicitly removes or replaces it.
- [ ] Prefer existing serialization patterns such as stored JSON strings for `data` and `playerGroups` unless an approved migration says otherwise.

## Verification Checklist

- [ ] Run `tests/invite-links.spec.js` and `tests/invite-service.spec.js` when invite creation, invite parsing, invite TTL behavior, or invite persistence changes.
- [ ] Run `tests/public-data.spec.js` when touching public profile/stats publication, `users/{uid}` reads, or public/private field placement.
- [ ] Run `tests/history.spec.js` and `tests/stats.spec.js` when match shape, merge behavior, or sync timing can affect downstream history/stats consumers.
- [ ] Run `tests/smoke.spec.js` and the smallest relevant app-shell coverage (`tests/app-context.spec.js`, `tests/navigation.spec.js`, `tests/layout.spec.js`, `tests/layout-mobile.spec.js`) when auth/data-layer changes can affect app boot, routing, or shell state.
- [ ] Run `tests/auth-phase2.spec.js` when changing auth persistence, `/login`, `ProtectedRoute`, offline auth messaging, or login-form submit UX.
- [ ] Run `tests/firestore-rules.spec.js` when `firestore.rules` or allowed Firestore payload keys change.
- [ ] Build after data-layer changes that can affect runtime wiring, imports, or app initialization.
- [ ] If automation does not cover the changed path, manually validate logged-in behavior, `/admin` access, `/login` redirect behavior, and real sync behavior against Firestore.
- [ ] Manually validate both private data flows and public/shared surfaces when fields are added, removed, or moved.

## When to Consult Historical Specs

- [ ] Check `docs/superpowers/specs/*` and `docs/superpowers/plans/*` when the touched area already has a feature spec or implementation plan, especially for invites, history, or related agent docs.
- [ ] Use those documents as rationale and prior decision context, not as a replacement for current code truth.
- [ ] If a spec/plan disagrees with current code or rules, treat current code as the implementation source of truth and reconcile the difference explicitly before changing behavior.
