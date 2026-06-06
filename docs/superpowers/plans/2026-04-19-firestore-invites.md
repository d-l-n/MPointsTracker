# Firestore Invite Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current URL-embedded invite token flow with Firestore-backed `invites/{code}` documents while preserving the existing pending-invite and auto-link UX.

**Architecture:** Move invite creation and resolution into `src/lib/inviteService.ts`, backed by Firestore queries and document reads. Keep `App.tsx` and `InviteLinkModal.tsx` using the same public invite-service API, and add a narrow browser test seam so Playwright can verify the app-level invite flow without needing a live Firestore fixture store.

**Tech Stack:** React 19, Firebase Auth, Firestore Web SDK, Playwright logic/E2E tests, Firestore security rules.

---

### Task 1: Align Firestore Rules With Invite Replacement

**Files:**
- Modify: `C:\Users\dylan\mpoints-tracker\firestore.rules`
- Modify: `C:\Users\dylan\mpoints-tracker\tests\firestore-rules.spec.js`
- Test: `C:\Users\dylan\mpoints-tracker\tests\firestore-rules.spec.js`

- [ ] **Step 1: Write the failing rules assertions**

Update `C:\Users\dylan\mpoints-tracker\tests\firestore-rules.spec.js` so the invite test expects owner delete support plus shape validation:

```js
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const rules = readFileSync("firestore.rules", "utf8");

test.describe("firestore rules", () => {
  test("users writes are limited to public profile fields", () => {
    expect(rules).toMatch(/match \/users\/\{userId\}[\s\S]*request\.resource\.data\.keys\(\)\.hasOnly\(\[\s*"displayName",\s*"photoURL",\s*"lastLogin",\s*"publicStats",\s*"statsUpdatedAt"\s*\]\)/);
  });

  test("invites support owner replacement without opening deletes globally", () => {
    expect(rules).toMatch(/match \/invites\/\{code\}[\s\S]*allow create:\s*if isAuth\(\)[\s\S]*request\.resource\.data\.uid == request\.auth\.uid/);
    expect(rules).toMatch(/match \/invites\/\{code\}[\s\S]*allow delete:\s*if isAdmin\(\) \|\| \(isAuth\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  });
});
```

- [ ] **Step 2: Run the rules test to verify it fails**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic firestore-rules.spec.js"
```

Expected: FAIL because `firestore.rules` still uses admin-only invite deletion or is missing the new assertion shape.

- [ ] **Step 3: Update the invite rules minimally**

Patch `C:\Users\dylan\mpoints-tracker\firestore.rules` so the `invites/{code}` block becomes:

```firestore
match /invites/{code} {
  allow read: if true;

  allow create: if isAuth()
    && request.resource.data.keys().hasOnly([
      "uid", "displayName", "photoURL", "createdAt", "expiresAt"
    ])
    && request.resource.data.keys().hasAll([
      "uid", "displayName", "createdAt", "expiresAt"
    ])
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.displayName is string
    && (
      !request.resource.data.keys().hasAny(["photoURL"])
      || request.resource.data.photoURL == null
      || request.resource.data.photoURL is string
    )
    && request.resource.data.createdAt is int
    && request.resource.data.expiresAt is int;

  allow delete: if isAdmin() || (isAuth() && resource.data.uid == request.auth.uid);
}
```

- [ ] **Step 4: Run the rules test to verify it passes**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic firestore-rules.spec.js"
```

Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules tests/firestore-rules.spec.js
git commit -m "test: tighten firestore invite rules"
```

### Task 2: Refactor Invite Service Around Firestore

**Files:**
- Modify: `C:\Users\dylan\mpoints-tracker\src\lib\inviteService.ts`
- Create: `C:\Users\dylan\mpoints-tracker\tests\invite-service.spec.js`
- Test: `C:\Users\dylan\mpoints-tracker\tests\invite-service.spec.js`

- [ ] **Step 1: Write the failing logic tests**

Create `C:\Users\dylan\mpoints-tracker\tests\invite-service.spec.js`:

```js
import { test, expect } from "@playwright/test";
import {
  INVITE_TTL_MS,
  buildInvitePayload,
  createInviteLinkWithStore,
  resolveInviteDoc,
} from "../src/lib/inviteService.ts";

test.describe("invite service", () => {
  test("buildInvitePayload uses display name fallback and 24h expiry", () => {
    const now = 1_700_000_000_000;
    expect(buildInvitePayload({
      uid: "user-1",
      email: "ana@test.dev",
      photoURL: null,
    }, now)).toEqual({
      uid: "user-1",
      displayName: "ana",
      photoURL: null,
      createdAt: now,
      expiresAt: now + INVITE_TTL_MS,
    });
  });

  test("resolveInviteDoc rejects expired docs and normalizes valid docs", () => {
    const now = 1_700_000_000_000;
    expect(resolveInviteDoc({
      uid: "user-1",
      displayName: "Ana",
      photoURL: null,
      expiresAt: now - 1,
    }, now)).toBeNull();

    expect(resolveInviteDoc({
      uid: "user-1",
      displayName: "Ana",
      photoURL: "https://img.test/ana.png",
      expiresAt: now + 10_000,
    }, now)).toEqual({
      uid: "user-1",
      displayName: "Ana",
      photoURL: "https://img.test/ana.png",
    });
  });

  test("createInviteLinkWithStore replaces the previous invite for the same user", async () => {
    const deleted = [];
    const written = [];

    const url = await createInviteLinkWithStore({
      user: { uid: "user-1", displayName: "Ana", photoURL: null },
      now: 1_700_000_000_000,
      listInvitesByUid: async () => [{ code: "old-code" }],
      deleteInviteByCode: async (code) => { deleted.push(code); },
      writeInvite: async (code, payload) => { written.push({ code, payload }); },
      generateCode: () => "new-code",
      getBaseUrl: () => "https://mpoints.test/app?foo=1#hash",
    });

    expect(deleted).toEqual(["old-code"]);
    expect(written).toHaveLength(1);
    expect(written[0].code).toBe("new-code");
    expect(url).toBe("https://mpoints.test/app?foo=1&invite=new-code");
  });
});
```

- [ ] **Step 2: Run the logic test to verify it fails**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic invite-service.spec.js"
```

Expected: FAIL because `createInviteLinkWithStore`, `resolveInviteDoc`, and the new payload shape do not exist yet.

- [ ] **Step 3: Implement the Firestore-backed service with a testable core**

Replace the body of `C:\Users\dylan\mpoints-tracker\src\lib\inviteService.ts` with this structure:

```js
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { fbDb } from "./firebase.js";

const INVITE_PARAM = "invite";
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function generateInviteCode() {
  return crypto.randomUUID().replace(/-/g, "");
}

function buildInvitePayload(user, now = Date.now()) {
  if (!user?.uid) throw new Error("missing-user");
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
    photoURL: user.photoURL || null,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
  };
}

function resolveInviteDoc(data, now = Date.now()) {
  if (!data?.uid || !data?.displayName || !data?.expiresAt) return null;
  if (data.expiresAt < now) return null;
  return {
    uid: data.uid,
    displayName: data.displayName,
    photoURL: data.photoURL || null,
  };
}

async function createInviteLinkWithStore({
  user,
  now = Date.now(),
  listInvitesByUid,
  deleteInviteByCode,
  writeInvite,
  generateCode = generateInviteCode,
  getBaseUrl = () => window.location.href,
}) {
  const payload = buildInvitePayload(user, now);
  const existing = await listInvitesByUid(payload.uid);
  await Promise.allSettled(existing.map((invite) => deleteInviteByCode(invite.code)));

  const code = generateCode();
  await writeInvite(code, payload);

  const url = new URL(getBaseUrl());
  url.searchParams.set(INVITE_PARAM, code);
  url.hash = "";
  return url.toString();
}

async function createInviteLink(user, now = Date.now()) {
  return createInviteLinkWithStore({
    user,
    now,
    listInvitesByUid: async (uid) => {
      const snap = await getDocs(query(collection(fbDb, "invites"), where("uid", "==", uid)));
      return snap.docs.map((entry) => ({ code: entry.id, ...entry.data() }));
    },
    deleteInviteByCode: async (code) => deleteDoc(doc(fbDb, "invites", code)),
    writeInvite: async (code, payload) => setDoc(doc(fbDb, "invites", code), payload),
  });
}

async function resolveInvite(code, now = Date.now()) {
  if (!code) return null;

  const browserTestInvites =
    typeof window !== "undefined" ? window.__MP_TEST_INVITES__ : null;
  if (browserTestInvites && browserTestInvites[code]) {
    return resolveInviteDoc(browserTestInvites[code], now);
  }

  const snap = await getDoc(doc(fbDb, "invites", code));
  return snap.exists() ? resolveInviteDoc(snap.data(), now) : null;
}
```

Keep `getInviteCodeFromUrl` and `clearInviteFromUrl` as they are today.

- [ ] **Step 4: Run the logic test to verify it passes**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic invite-service.spec.js"
```

Expected: PASS with `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inviteService.ts tests/invite-service.spec.js
git commit -m "feat: back invite links with firestore"
```

### Task 3: Switch App Boot Resolution to Async Firestore Invites

**Files:**
- Modify: `C:\Users\dylan\mpoints-tracker\src\App.tsx`
- Modify: `C:\Users\dylan\mpoints-tracker\src\components\auth\InviteLinkModal.tsx`
- Test: `C:\Users\dylan\mpoints-tracker\tests\invite-links.spec.js`

- [ ] **Step 1: Write the failing browser-flow expectations against Firestore codes**

Replace the token helper in `C:\Users\dylan\mpoints-tracker\tests\invite-links.spec.js` with a browser-test-store helper:

```js
import { test, expect } from "./fixtures.js";
import { openGame } from "./helpers.js";

async function openInvite(page, code, inviteDoc) {
  await page.context().addInitScript(({ seededCode, seededInvite }) => {
    window.__MP_TEST_INVITES__ = {
      [seededCode]: seededInvite,
    };
  }, { seededCode: code, seededInvite: inviteDoc });

  await page.goto(`/?invite=${code}`);
  // keep the existing guest-login/bootstrap flow exactly as today
}

test.describe("Invite links", () => {
  test("shows the pending invite banner from a firestore invite code and allows dismissing it", async ({ page }) => {
    await openInvite(page, "invite-code-1", {
      uid: "invite-user-1",
      displayName: "Ana Invitada",
      photoURL: null,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    await expect(page.locator('[data-testid="pending-invite-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-invite-name"]')).toHaveText(/Ana Invitada/i);
  });
});
```

- [ ] **Step 2: Run the invite-links spec to verify it fails**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic invite-links.spec.js"
```

Expected: FAIL because `App.tsx` still treats the query parameter as a local encoded payload.

- [ ] **Step 3: Update app boot invite resolution and keep modal compatibility**

Change the invite boot effect in `C:\Users\dylan\mpoints-tracker\src\App.tsx` to an async inner function:

```js
useEffect(() => {
  const code = getInviteCodeFromUrl();
  if (!code) return;

  clearInviteFromUrl();

  let cancelled = false;

  const loadInvite = async () => {
    const invite = await resolveInvite(code);
    if (cancelled) return;

    if (invite) {
      setPendingInvite(invite);
      showToast(`🔗 ${invite.displayName} ${t("inviteReady")}`);
      return;
    }

    showToast(t("inviteExpiredOrInvalid"));
  };

  loadInvite().catch(() => {
    if (!cancelled) showToast(t("inviteExpiredOrInvalid"));
  });

  return () => {
    cancelled = true;
  };
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Keep `InviteLinkModal.tsx` using the same async modal pattern:

```js
Promise.resolve()
  .then(() => createInviteLink(user))
  .then((nextLink) => {
    if (!mounted) return;
    setLink(nextLink);
    setLoading(false);
  })
```

No UX copy changes are needed.

- [ ] **Step 4: Run the invite-links spec to verify it passes**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic invite-links.spec.js"
```

Expected: PASS with the existing banner and auto-link assertions now driven by Firestore invite codes.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/auth/InviteLinkModal.tsx tests/invite-links.spec.js
git commit -m "feat: resolve invite codes from firestore"
```

### Task 4: Run Final Verification for the Invite Migration

**Files:**
- Modify: `C:\Users\dylan\mpoints-tracker\tests\invite-links.spec.js`
- Test: `C:\Users\dylan\mpoints-tracker\tests\firestore-rules.spec.js`
- Test: `C:\Users\dylan\mpoints-tracker\tests\invite-service.spec.js`
- Test: `C:\Users\dylan\mpoints-tracker\tests\invite-links.spec.js`
- Test: `C:\Users\dylan\mpoints-tracker\src\lib\inviteService.ts`

- [ ] **Step 1: Add one regression for expired invite docs**

Extend `C:\Users\dylan\mpoints-tracker\tests\invite-service.spec.js` or `tests\invite-links.spec.js` with this case:

```js
test("resolveInviteDoc returns null when the firestore invite is expired", () => {
  const now = 1_700_000_000_000;
  expect(resolveInviteDoc({
    uid: "invite-user-9",
    displayName: "Invite Expirado",
    photoURL: null,
    expiresAt: now - 1000,
  }, now)).toBeNull();
});
```

- [ ] **Step 2: Run the focused logic suite**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic invite-service.spec.js firestore-rules.spec.js"
```

Expected: PASS with all invite-service and rules checks green.

- [ ] **Step 3: Run the browser invite flow**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\playwright\cli.js test --project=logic invite-links.spec.js"
```

Expected: PASS with banner + auto-link flow still green.

- [ ] **Step 4: Run a production build**

Run:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command "node .\node_modules\vite\bin\vite.js build"
```

Expected: PASS with Vite build output and no module-resolution errors from the refactor.

- [ ] **Step 5: Commit**

```bash
git add tests/invite-service.spec.js tests/invite-links.spec.js src/lib/inviteService.ts src/App.tsx firestore.rules
git commit -m "test: verify firestore invite migration"
```
