# History Sub-Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace top-level history navigation with a shared sub-page opened from Home and game detail, with an initial game filter derived from the latest saved match or current game.

**Architecture:** Keep history rendering centralized in `GlobalHistoryPage` and move navigation ownership into `App.tsx`. Reuse the existing game `History` tab as an entry action to the shared sub-page instead of keeping a second embedded history implementation.

**Tech Stack:** React 19, Vite, Playwright, existing app-local state navigation

---

### File Map

**Modify:**
- `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- `C:/Users/dylan/mpoints-tracker/src/pages/GlobalHistoryPage.tsx`
- `C:/Users/dylan/mpoints-tracker/src/pages/GameDetail.tsx`
- `C:/Users/dylan/mpoints-tracker/tests/champions.spec.js`
- `C:/Users/dylan/mpoints-tracker/tests/smoke.spec.js`
- `C:/Users/dylan/mpoints-tracker/tests/history.spec.js`

**Optional cleanup after green:**
- `C:/Users/dylan/mpoints-tracker/src/pages/GlobalHistoryPage.tsx`

### Task 1: Add failing navigation tests for the new history flow

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/tests/champions.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/smoke.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/history.spec.js`

- [ ] **Step 1: Write the failing test for Home widget -> shared history with initial game filter**

```js
test('home stats widget opens shared history filtered to the latest match game', async ({ page }) => {
  await page.goto('/');
  await seedMixedHistory(page);

  await page.locator('[data-testid="home-history-widget"]').click();

  await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();
  await expect(page.locator('[data-testid="history-filter-game-uno"]')).toHaveClass(/active/);
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "home stats widget opens shared history filtered to the latest match game"`
Expected: FAIL because the widget still navigates through the removed top-level history section and no `history-subpage` marker exists.

- [ ] **Step 3: Write the failing test for game History entry -> shared history locked to current game**

```js
test('game history entry opens shared history locked to that game', async ({ page }) => {
  await page.goto('/');
  await seedUnoHistory(page);
  await openGame(page, 'uno');

  await page.locator('[data-testid="tab-history"]').click();

  await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();
  await expect(page.locator('[data-testid="history-filter-game-uno"]')).toBeVisible();
  await expect(page.locator('[data-testid="history-filter-games"]')).toHaveCount(0);
});
```

- [ ] **Step 4: Run the targeted test to verify it fails**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "game history entry opens shared history locked to that game"`
Expected: FAIL because `GameDetail` still renders embedded `HistoryTab`.

- [ ] **Step 5: Write the failing test for nav count**

```js
test('guest nav pill count excludes history after moving history into a sub-page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid^="nav-pill-"]')).toHaveCount(4);
});
```

- [ ] **Step 6: Run the targeted test to verify it fails**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "guest nav pill count excludes history after moving history into a sub-page"`
Expected: FAIL because the app still shows the `history` nav pill.

### Task 2: Move history navigation ownership into `App.tsx`

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- Test: `C:/Users/dylan/mpoints-tracker/tests/champions.spec.js`
- Test: `C:/Users/dylan/mpoints-tracker/tests/smoke.spec.js`

- [ ] **Step 1: Implement app-level history sub-page state**

```jsx
const [historyView, setHistoryView] = useState(null);

const closeHistoryView = useCallback(() => setHistoryView(null), []);

const openHistoryView = useCallback((config) => {
  setHistoryView({
    source: config.source,
    gameId: config.gameId ?? "all",
    lockGameFilter: !!config.lockGameFilter,
    key: `${config.source}:${config.gameId ?? "all"}:${Date.now()}`,
  });
}, []);
```

- [ ] **Step 2: Remove top-level `history` from nav**

```jsx
const NAV_BASE = useMemo(() => [
  { id: "home", label: t("games"), icon: "🎮" },
  { id: "champs", label: t("champions"), icon: "🏆" },
  { id: "rules", label: t("rules"), icon: "📖" },
  { id: "about", label: t("info"), icon: "⚙️" },
  ...(isAdmin ? [{ id: "admin", label: t("admin"), icon: "🔧" }] : []),
], [t, isAdmin]);
```

- [ ] **Step 3: Route the Home widget into `openHistoryView()`**

```jsx
const latestGlobalMatch = useMemo(() => {
  return Object.entries(data)
    .filter(([gid, matches]) => !gid.startsWith("__") && Array.isArray(matches))
    .flatMap(([gid, matches]) => matches.map((match) => ({ ...match, _gid: gid })))
    .sort((a, b) => b.date - a.date)[0] ?? null;
}, [data]);

onOpenHistory={() => {
  if (!latestGlobalMatch?._gid) return;
  openHistoryView({ source: "home", gameId: latestGlobalMatch._gid, lockGameFilter: false });
}}
```

- [ ] **Step 4: Render the shared history sub-page branch**

```jsx
{historyView ? (
  <>
    <div className="hdr" data-testid="history-subpage-header">
      <button className="ibtn" onClick={closeHistoryView}>←</button>
      <div style={{ flex: 1 }}>
        <div className="big-title" style={{ fontSize: "2rem" }}>{t("globalHistory").toUpperCase()}</div>
      </div>
    </div>
    <div key={historyView.key}>
      <GlobalHistoryPage
        data-testid="history-subpage"
        data={data}
        onDelete={delMatch}
        onEdit={editMatch}
        t={t}
        initialGameFilter={historyView.gameId}
        lockGameFilter={historyView.lockGameFilter}
      />
    </div>
  </>
) : null}
```

- [ ] **Step 5: Add history sub-page handling to system back logic**

```jsx
if (historyView) { setHistoryView(null); return; }
```

- [ ] **Step 6: Run the three targeted tests to verify progress**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "home stats widget opens shared history filtered to the latest match game|guest nav pill count excludes history after moving history into a sub-page"`
Expected: the nav-count test should pass after this task; the game-entry test should still fail until `GameDetail` is updated.

### Task 3: Make `GlobalHistoryPage` support initial and locked game filters

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/src/pages/GlobalHistoryPage.tsx`
- Test: `C:/Users/dylan/mpoints-tracker/tests/champions.spec.js`
- Test: `C:/Users/dylan/mpoints-tracker/tests/history.spec.js`

- [ ] **Step 1: Add props and initialize filter state from context**

```jsx
function GlobalHistoryPage({
  data = {},
  onDelete,
  onEdit,
  t = (k) => k,
  initialGameFilter = "all",
  lockGameFilter = false,
}) {
  const [gameFilter, setGameFilter] = useState(initialGameFilter);

  useEffect(() => {
    setGameFilter(initialGameFilter || "all");
  }, [initialGameFilter]);
}
```

- [ ] **Step 2: Add stable test ids for the sub-page and filter buttons**

```jsx
<div data-testid="history-subpage">
  ...
  <div data-testid="history-filter-games">
    <button data-testid="history-filter-game-all" ...>{t("filterAll")}</button>
    {gamesInHistory.map((g) => (
      <button data-testid={`history-filter-game-${g.id}`} key={g.id} ...>
        {g.emoji} {g.name}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Hide the game filter row when the filter is locked**

```jsx
{!lockGameFilter && gamesInHistory.length > 1 && (
  <div data-testid="history-filter-games" style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
    ...
  </div>
)}
```

- [ ] **Step 4: Keep edit/delete/search/date behavior unchanged**

```jsx
const filtered = useMemo(() => {
  let list = allMatches;
  if (gameFilter !== "all") list = list.filter((m) => m._gid === gameFilter);
  ...
  return list;
}, [allMatches, search, dateFilter, gameFilter]);
```

- [ ] **Step 5: Run targeted history tests to verify green**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "home stats widget opens shared history filtered to the latest match game|history"`
Expected: new sub-page filter assertions pass and pre-existing history coverage still passes once updated for the shared page selectors.

### Task 4: Turn the game History tab into a shared-history entry

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/src/pages/GameDetail.tsx`
- Modify: `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- Test: `C:/Users/dylan/mpoints-tracker/tests/history.spec.js`

- [ ] **Step 1: Add an `onOpenHistory` callback prop to `GameDetail`**

```jsx
function GameDetail({
  game,
  ...,
  onOpenHistory,
}) {
```

- [ ] **Step 2: Intercept the History tab button**

```jsx
const handleTabClick = useCallback((nextTab) => {
  if (nextTab === "history") {
    onOpenHistory?.(game.id);
    return;
  }
  onTabChange?.(nextTab);
}, [game.id, onOpenHistory, onTabChange]);
```

- [ ] **Step 3: Keep the active tab semantics sane after opening sub-page**

```jsx
{[["new", t("newMatch")], ["history", t("history")], ["stats", t("stats")]].map(([id, l]) => (
  <button
    key={id}
    className={`tab${tab === id ? " active" : ""}`}
    onClick={() => handleTabClick(id)}
    data-testid={`tab-${id}`}
  >
    {l}
  </button>
))}
```

- [ ] **Step 4: Remove embedded `HistoryTab` rendering**

```jsx
{tab === "history" && null}
```

- [ ] **Step 5: Wire `GameDetail` from `App.tsx` into `openHistoryView()`**

```jsx
onOpenHistory={(gameId) => {
  openHistoryView({ source: "game", gameId, lockGameFilter: true });
}}
```

- [ ] **Step 6: Run the targeted game-entry test to verify it passes**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "game history entry opens shared history locked to that game"`
Expected: PASS

### Task 5: Clean up regression coverage and verify full behavior

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/tests/champions.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/smoke.spec.js`
- Modify: `C:/Users/dylan/mpoints-tracker/tests/history.spec.js`
- Optional cleanup: `C:/Users/dylan/mpoints-tracker/src/pages/GlobalHistoryPage.tsx`

- [ ] **Step 1: Update assertions that still reference `nav-pill-history`**

```js
await expect(page.locator('[data-testid="history-subpage"]')).toBeVisible();
await expect(page.locator('[data-testid="history-subpage-header"]')).toBeVisible();
```

- [ ] **Step 2: Update the smoke test nav count**

```js
await expect(navPills).toHaveCount(4);
```

- [ ] **Step 3: Keep or remove `GlobalHistoryPage.tsx` only after references are gone**

```bash
Select-String -Path src/**/*.tsx -Pattern 'HistoryTab'
```

- [ ] **Step 4: Run the focused regression suite**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\champions.spec.js tests\history.spec.js tests\smoke.spec.js`
Expected: PASS with 0 failures

- [ ] **Step 5: Run the broader logic smoke that covers nav and history-related flows**

Run: `node .\node_modules\playwright\cli.js test --project=logic --grep "home stats widget|nav pill count|history|can navigate between tabs|nav pills are clickable"`
Expected: PASS with 0 failures
