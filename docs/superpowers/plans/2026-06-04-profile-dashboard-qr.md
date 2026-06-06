# Profile Dashboard QR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the main settings/profile view into a hybrid player dashboard where a large centered QR code is visible on the first screen.

**Architecture:** Keep the work scoped to the existing `SettingsPage` own-profile surface and shared CSS. Reuse `UserQRCode`, existing translation keys, and existing stats helpers instead of changing Firebase data shape or public profile persistence.

**Tech Stack:** React 19, TypeScript, CSS in `src/styles/app.css`, Vitest/Testing Library, Vite.

---

### Task 1: Settings Profile Layout

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Test: `src/pages/SettingsPage.test.jsx`

- [ ] Move the own-profile screen from a settings-first layout to a dashboard order: identity header, large centered QR, quick stats, profile/preference actions, sign-out action.
- [ ] Keep name editing behavior intact for logged-in and guest users.
- [ ] Reuse existing keys: `myQR`, `qrCodeHint`, `status`, `nameLabel`, `totalMatches`, `profileWins`, `profileWinrate`, `profileStreak`, `viewProfile`, `settingsPrefs`, `settingsAbout`.
- [ ] Add focused tests that assert the QR panel is present and appears before profile stats/actions in the rendered document.

### Task 2: Dashboard Styling

**Files:**
- Modify: `src/styles/app.css`

- [ ] Add profile dashboard classes for a compact identity header, large QR panel, and stat grid.
- [ ] Preserve mobile-first layout and keep desktop width aligned with existing `.page` behavior.
- [ ] Keep QR large and centered without nested card clutter.

### Task 3: Verification

**Commands:**
- `npm run test:unit -- src/pages/SettingsPage.test.jsx`
- `npm run build`

- [ ] Confirm the targeted unit tests pass.
- [ ] Confirm the production build passes.
- [ ] Documentation review: no user-facing docs are required because this is a UI layout change; this plan records the implementation intent.
