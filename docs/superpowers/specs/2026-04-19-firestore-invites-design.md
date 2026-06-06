# Firestore Invite Links Design

## Goal

Replace the current local URL-encoded invite token flow with a Firestore-backed invite flow that uses `invites/{code}` documents.

The resulting invite URL format remains `/?invite=<code>`, but invite resolution must come only from Firestore.

## User Decisions Locked In

- invite resolution is **Firestore-only**
- invites remain valid until `expiresAt`
- each user can have **at most one active invite**
- creating a new invite replaces the previous one for that same user

## Current State

- `src/lib/inviteService.ts` builds a base64url token directly in the browser URL.
- `App.tsx` reads `invite` from the query string and resolves it locally with no network request.
- `InviteLinkModal.tsx` depends on `createInviteLink(user)` returning a full URL.
- `LinkedPlayerInput.tsx` and `App.tsx` already have a stable `pendingInvite` flow that should be preserved.
- `tests/invite-links.spec.js` currently assumes local token decoding.

## Desired Behavior

### Create

- When a signed-in user opens the invite modal, the app creates a Firestore invite document in `invites/{code}`.
- Before creating the new document, the app deletes any previous invite documents with the same `uid`.
- The resulting link uses the generated `code` and keeps the same visible URL shape:
  `/?invite=<code>`.

### Resolve

- On app boot, if `invite=<code>` exists in the URL, the app reads `invites/{code}` from Firestore.
- If the document exists and `expiresAt` is still in the future, it becomes the current `pendingInvite`.
- If the document is missing or expired, the app shows the existing invalid/expired invite message.
- Invite documents are **not consumed** on read. The same link can be used repeatedly until expiration.

### Replace

- Creating a new invite for a user invalidates the old one by deleting any previous docs for that same `uid`.
- There is no requirement to preserve old codes once a new invite is created.

## Data Model

Collection: `invites/{code}`

Document fields:

- `uid`: Firebase Auth user id of the inviter
- `displayName`: inviter display name fallback used by the pending invite banner and auto-link flow
- `photoURL`: inviter photo URL or `null`
- `createdAt`: creation timestamp in milliseconds
- `expiresAt`: expiration timestamp in milliseconds

`code` is an opaque random identifier generated client-side. It must not be derived from `uid`.

## Recommended Implementation

### 1. Rework `inviteService.js` around Firestore

`inviteService.js` should become the only module that knows how invite docs are created and resolved.

Recommended exported surface:

- `createInviteLink(user)`
- `resolveInvite(code)`
- `getInviteCodeFromUrl(url?)`
- `clearInviteFromUrl(url?)`

Recommended internal helpers:

- `buildInvitePayload(user, now?)`
- `generateInviteCode()`
- `deleteExistingInvitesForUser(uid)`

`createInviteLink(user)` should:

1. build the payload
2. query `invites` for existing docs with `uid == user.uid`
3. best-effort delete those docs
4. create a new doc with a fresh random code
5. return the final absolute URL

`resolveInvite(code)` should:

1. fetch `invites/{code}`
2. return `null` if missing
3. return `null` if expired
4. otherwise return `{ uid, displayName, photoURL }`

### 2. Preserve existing UI contracts

`InviteLinkModal.tsx` should keep its current behavior:

- open modal
- generate link
- allow copy/share
- show the same generic error on creation failure

`App.tsx` should keep the current `pendingInvite` state model and only swap the source from local token decoding to async Firestore resolution.

`LinkedPlayerInput.tsx` should remain unchanged unless a small compatibility fix is needed.

### 3. Remove local token decoding logic

The app should stop treating the URL parameter as a serialized payload.

The query string contains only the Firestore document code. Any old locally encoded links are intentionally no longer supported.

## Error Handling

### Invite creation failure

- If Firestore create/query/delete fails, the modal shows the existing `inviteCreateError` copy.
- The modal should not expose partial data or a malformed link.

### Invite resolution failure

- Missing doc, expired doc, malformed code, or Firestore read failure should result in the existing invalid/expired invite toast path.

### Cleanup

- Expired invites may remain in Firestore until a later best-effort cleanup.
- Cleanup is not required for correctness in this change.

## Security and Rules Expectations

The Firestore rules already reserve `invites/{code}`. The implementation should conform to:

- public read
- authenticated create
- created `uid` must match `request.auth.uid`
- admin-only delete at the rules layer

Because user-level delete is not allowed by rules, replacement must be handled by adjusting either:

1. the rules to permit deleting invites where `resource.data.uid == request.auth.uid`, or
2. the implementation to use deterministic overwrite semantics instead of delete-then-create

Given the user requirement of `invites/{code}` with opaque random codes plus “replace previous invite,” the recommended design is to update rules so the invite owner can delete their own invite docs.

## Testing

### New logic coverage

- creating a new invite replaces the previous invite for the same `uid`
- resolving a valid Firestore invite returns `{ uid, displayName, photoURL }`
- resolving an expired invite returns `null`

### Existing E2E coverage updates

- `tests/invite-links.spec.js` should stop building local base64 payloads
- the suite should validate the URL-to-pending-invite behavior against the Firestore-backed service path or a stable test seam around it

## Risks

### Rules mismatch

The current rules only allow admin delete for `invites/{code}`. That conflicts with “new invite replaces old invite.” This must be resolved before the flow is considered complete.

### Offline behavior regression

The old flow worked without network because resolution was purely local. The new flow depends on Firestore reads, so invite opening without connectivity will fail.

### Query cleanup complexity

Deleting old invites by `uid` introduces extra Firestore round trips during invite creation. This is acceptable for the current scope because invite creation is a low-frequency action.

## Out of Scope

- adding Cloud Functions or scheduled cleanup jobs
- redesigning the invite modal
- making old local token links backward-compatible
- changing linked-player UI behavior beyond reading invites from Firestore
