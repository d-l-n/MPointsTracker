# Sushi Do! Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Sushi Do!` as a new standalone card game with flavor setup, round resolution, undo, draft persistence, and match saving without changing the existing `Sushi` porciones game.

**Architecture:** Add a new dedicated game type (`sushi_do`) wired through the catalog, cards-section home list, and `GameDetail` lazy routing. Keep flavor definitions in one shared data module, then build a dedicated `SushiDoNewMatch.jsx` component that owns setup, in-match state, round events, undo snapshots, draft persistence, and final save payload.

**Tech Stack:** React 19, Vite, local draft persistence via `useDraft`, app-local match storage via `useMatches`, Playwright logic tests

---

### File Map

**Create:**
- `C:/Users/dylan/mpoints-tracker/src/data/sushiDo.ts`
- `C:/Users/dylan/mpoints-tracker/src/components/games/SushiDoNewMatch.tsx`
- `C:/Users/dylan/mpoints-tracker/tests/games/sushi-do.spec.js`

**Modify:**
- `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- `C:/Users/dylan/mpoints-tracker/src/data/games.ts`
- `C:/Users/dylan/mpoints-tracker/src/pages/GameDetail.tsx`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/de.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/es.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/en.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/fr.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/ja.ts`
- `C:/Users/dylan/mpoints-tracker/src/data/translations/zh.ts`

### Delivery Note

- The shipped draft/undo state uses `currentRound`, `completedRounds`, and `undoStack` in `SushiDoNewMatch.jsx`.
- `roundEvents` represents the still-open round, while `completedRounds` stores closed-round history that also feeds the saved match payload.
- `src/data/translations/de.ts` was updated too because the repo’s translation-parity coverage validates every locale against `es`.

### Task 1: Add failing Playwright coverage for `Sushi Do!`

**Files:**
- Create: `C:/Users/dylan/mpoints-tracker/tests/games/sushi-do.spec.js`
- Test: `C:/Users/dylan/mpoints-tracker/tests/helpers.js`

- [ ] **Step 1: Write the failing smoke test for opening `Sushi Do!` from the cards section**

```js
import { test, expect } from '../fixtures.js';
import { openGame, fillPlayers } from '../helpers.js';

test.describe('Sushi Do! Game', () => {
  test('appears in the cards section as a dedicated game', async ({ page }) => {
    await openGame(page, 'cards', 'sushi_do');
    await expect(page.locator('[data-testid="sushi-do-setup"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-input"]').first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the targeted smoke test to verify it fails**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js --grep "appears in the cards section as a dedicated game"`
Expected: FAIL because `sushi_do` is not yet in `App.tsx` group lists or `GAMES`.

- [ ] **Step 3: Write the failing setup-validation and flavor-suggestion tests**

```js
test('enforces 2-9 players and suggests the top flavors without duplicates', async ({ page }) => {
  await openGame(page, 'cards', 'sushi_do');

  await fillPlayers(page, ['Ana']);
  await expect(page.locator('[data-testid="sushi-do-start"]')).toBeDisabled();

  await page.locator('[data-testid="add-player"]').click();
  await fillPlayers(page, ['Ana', 'Beto']);
  await expect(page.locator('[data-testid="sushi-do-flavor-slot-0"]')).toContainText(/Tempura/i);
  await expect(page.locator('[data-testid="sushi-do-flavor-slot-1"]')).toContainText(/Roll/i);
});

test('allows manual flavor replacement but never duplicate flavors', async ({ page }) => {
  await openGame(page, 'cards', 'sushi_do');
  await fillPlayers(page, ['Ana', 'Beto', 'Carla']);

  await page.locator('[data-testid="sushi-do-flavor-select-2"]').selectOption('temaki');
  await expect(page.locator('[data-testid="sushi-do-flavor-slot-2"]')).toContainText(/Temaki/i);
  await expect(page.locator('[data-testid="sushi-do-flavor-select-1"] option[value="temaki"]')).toHaveCount(0);
});
```

- [ ] **Step 4: Run the targeted setup tests to verify they fail**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js --grep "enforces 2-9 players|allows manual flavor replacement"`
Expected: FAIL because no `Sushi Do!` setup UI or flavor-selection controls exist yet.

- [ ] **Step 5: Write the failing in-match tests for success, penalty, undo, persistence, and 500-point finish**

```js
test('successful Sushi Do! only offers flavors in play and adds the fixed value once', async ({ page }) => {
  await startThreePlayerSushiDo(page);

  await page.locator('[data-testid="sushi-do-caller-ana"]').click();
  await page.locator('[data-testid="sushi-do-resolve-success"]').click();

  await expect(page.locator('[data-testid="sushi-do-flavor-option-tempura"]')).toBeVisible();
  await expect(page.locator('[data-testid="sushi-do-flavor-option-roll"]')).toBeVisible();
  await expect(page.locator('[data-testid="sushi-do-flavor-option-salsa_soja"]')).toHaveCount(0);

  await page.locator('[data-testid="sushi-do-flavor-option-tempura"]').click();
  await expect(page.locator('[data-testid="sushi-do-score-ana"]')).toHaveText('100');
  await expect(page.locator('[data-testid="sushi-do-round-number"]')).toContainText('2');
});

test('failed Sushi Do! applies -20, keeps the round open, and undo restores the round state', async ({ page }) => {
  await startThreePlayerSushiDo(page);

  await page.locator('[data-testid="sushi-do-caller-beto"]').click();
  await page.locator('[data-testid="sushi-do-resolve-penalty"]').click();
  await expect(page.locator('[data-testid="sushi-do-score-beto"]')).toHaveText('-20');
  await expect(page.locator('[data-testid="sushi-do-round-number"]')).toContainText('1');
  await expect(page.locator('[data-testid="sushi-do-round-log"]')).toContainText(/-20/);

  await page.locator('[data-testid="sushi-do-undo"]').click();
  await expect(page.locator('[data-testid="sushi-do-score-beto"]')).toHaveText('0');
  await expect(page.locator('[data-testid="sushi-do-round-log"]')).not.toContainText(/-20/);
});

test('restores selected flavors from draft and ends the match at 500+', async ({ page }) => {
  await startThreePlayerSushiDo(page);
  await page.reload();

  await openGame(page, 'cards', 'sushi_do');
  await expect(page.locator('[data-testid="sushi-do-active-flavors"]')).toContainText(/Tempura/);

  for (let i = 0; i < 5; i++) {
    await page.locator('[data-testid="sushi-do-caller-ana"]').click();
    await page.locator('[data-testid="sushi-do-resolve-success"]').click();
    await page.locator('[data-testid="sushi-do-flavor-option-tempura"]').click();
  }

  await expect(page.locator('[data-testid="sushi-do-game-over"]')).toContainText(/500/);
  await expect(page.locator('[data-testid="save-match"]')).toBeVisible();
});
```

- [ ] **Step 6: Run the targeted in-match tests to verify they fail**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js --grep "successful Sushi Do!|failed Sushi Do!|restores selected flavors"`
Expected: FAIL because the match flow, undo stack, and draft restore do not exist.

### Task 2: Add catalog and shared data support for the new game

**Files:**
- Create: `C:/Users/dylan/mpoints-tracker/src/data/sushiDo.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/games.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/App.tsx`
- Modify: `C:/Users/dylan/mpoints-tracker/src/pages/GameDetail.tsx`

- [ ] **Step 1: Create the single source of truth for flavors and score ordering**

```js
export const SUSHI_DO_WIN_SCORE = 500;
export const SUSHI_DO_MAX_PLAYERS = 9;
export const SUSHI_DO_MIN_PLAYERS = 2;
export const SUSHI_DO_PENALTY = 20;

export const SUSHI_DO_FLAVORS = [
  { key: 'tempura', label: 'Tempura', points: 100 },
  { key: 'roll', label: 'Roll', points: 85 },
  { key: 'maki', label: 'Maki', points: 80 },
  { key: 'sashimi', label: 'Sashimi', points: 75 },
  { key: 'temaki', label: 'Temaki', points: 70 },
  { key: 'niguiri', label: 'Niguiri', points: 65 },
  { key: 'wasabi', label: 'Wasabi', points: 60 },
  { key: 'salsa_soja', label: 'Salsa de Soja', points: 55 },
  { key: 'palitos', label: 'Palitos', points: 50 },
];

export function getSuggestedSushiDoFlavors(playerCount) {
  return SUSHI_DO_FLAVORS.slice(0, playerCount).map((flavor) => flavor.key);
}

export function getSushiDoFlavorByKey(flavorKey) {
  return SUSHI_DO_FLAVORS.find((flavor) => flavor.key === flavorKey) || null;
}
```

- [ ] **Step 2: Add the new game entry without touching the existing `sushi` porciones game**

```js
sushi_do: {
  id: "sushi_do",
  name: "Sushi Do!",
  emoji: "🍣",
  color: "#D94841",
  type: "sushi_do",
  winScore: 500,
  tagline: "500 pts · 6 iguales por sabor",
},
sushi: {
  id: "sushi", name: "Sushi", emoji: "🍣", color: "#E74C3C",
  type: "porcion",
  tagline: "Contá tus porciones",
},
```

- [ ] **Step 3: Wire `taglineSushiDo` through the translation lookup table**

```js
const TL = {
  ...
  "sushi_do": "taglineSushiDo",
  "sushi": "taglineSushi",
  ...
};
```

- [ ] **Step 4: Move `sushi_do` into the cards section and leave `sushi` under porciones**

```jsx
const groups = [
  { key:"cards", icon:"🃏", name:t("cardsGroup"), ids:["truco","chinchon","chancho","chin","esquinados","canasta","sushi_do"] },
  { key:"porciones", icon:"🍽️", name:t("porcionesGroup"), ids:["sushi","pizza","hamburguesa","pancho","empanadas","facturas","sanguchitos","cookies"] },
];
```

- [ ] **Step 5: Lazy-load and route the dedicated component in `GameDetail.jsx`**

```jsx
const SushiDoNewMatch = lazy(() => import("../components/games/SushiDoNewMatch.jsx"));

...
} else if (game.type === "sushi_do") {
  GameComponent = <SushiDoNewMatch key={matchKey} {...commonProps} game={game} />;
}
...
import("../components/games/SushiDoNewMatch.jsx").catch(()=>{});
```

- [ ] **Step 6: Run the opening smoke test to verify it turns green before building match logic**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js --grep "appears in the cards section as a dedicated game"`
Expected: PASS once the catalog, cards section, and lazy route exist, even if deeper setup tests still fail.

### Task 3: Build `SushiDoNewMatch.jsx` setup flow with TDD

**Files:**
- Create: `C:/Users/dylan/mpoints-tracker/src/components/games/SushiDoNewMatch.tsx`
- Test: `C:/Users/dylan/mpoints-tracker/tests/games/sushi-do.spec.js`
- Reference: `C:/Users/dylan/mpoints-tracker/src/components/games/PorcionNewMatch.tsx`
- Reference: `C:/Users/dylan/mpoints-tracker/src/components/games/AjedrezNewMatch.tsx`

- [ ] **Step 1: Implement player setup state with the repository’s existing multiplayer controls**

```jsx
const [players, setPlayers] = useState(
  draft?.players || [{ id: mkId(), name: "" }, { id: mkId(), name: "" }]
);
const [phase, setPhase] = useState(draft?.phase || "setup");

const namedPlayers = useMemo(
  () => players.filter((player) => player.name.trim()),
  [players]
);

const hasDuplicateNames = useMemo(() => {
  const counts = {};
  namedPlayers.forEach((player) => {
    const key = player.name.trim().toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.values(counts).some((count) => count > 1);
}, [namedPlayers]);
```

- [ ] **Step 2: Derive the suggested flavors from player count and keep manual picks unique**

```jsx
const initialFlavorKeys = useMemo(() => {
  if (Array.isArray(draft?.selectedFlavors) && draft.selectedFlavors.length > 0) {
    return draft.selectedFlavors;
  }
  return getSuggestedSushiDoFlavors(Math.max(namedPlayers.length, SUSHI_DO_MIN_PLAYERS));
}, [draft?.selectedFlavors, namedPlayers.length]);

const [selectedFlavors, setSelectedFlavors] = useState(initialFlavorKeys);

useEffect(() => {
  if (phase !== "setup") return;
  const count = namedPlayers.length;
  if (count < SUSHI_DO_MIN_PLAYERS || count > SUSHI_DO_MAX_PLAYERS) return;
  setSelectedFlavors((current) => {
    if (current.length === count && new Set(current).size === current.length) return current;
    return getSuggestedSushiDoFlavors(count);
  });
}, [namedPlayers.length, phase]);
```

- [ ] **Step 3: Render flavor slots with per-slot selectors that exclude already-chosen flavors**

```jsx
function getFlavorOptions(slotIndex, currentSelection) {
  const used = new Set(currentSelection.filter((_, index) => index !== slotIndex));
  return SUSHI_DO_FLAVORS.filter((flavor) => !used.has(flavor.key));
}

{selectedFlavors.map((flavorKey, index) => {
  const flavor = getSushiDoFlavorByKey(flavorKey);
  return (
    <div key={`${index}-${flavorKey}`} data-testid={`sushi-do-flavor-slot-${index}`} className="sec-card">
      <div>{index + 1}. {flavor?.label}</div>
      <div>{flavor?.points} pts</div>
      <select
        data-testid={`sushi-do-flavor-select-${index}`}
        value={flavorKey}
        onChange={(event) => replaceFlavorAt(index, event.target.value)}
      >
        {getFlavorOptions(index, selectedFlavors).map((option) => (
          <option key={option.key} value={option.key}>{option.label}</option>
        ))}
      </select>
    </div>
  );
})}
```

- [ ] **Step 4: Block start unless the player count and flavor count are both valid**

```jsx
const validPlayerCount = namedPlayers.length >= SUSHI_DO_MIN_PLAYERS && namedPlayers.length <= SUSHI_DO_MAX_PLAYERS;
const uniqueFlavorCount = new Set(selectedFlavors).size === selectedFlavors.length;
const exactFlavorCount = selectedFlavors.length === namedPlayers.length;
const canStart = validPlayerCount && !hasDuplicateNames && uniqueFlavorCount && exactFlavorCount;

<button
  className="btnpri"
  data-testid="sushi-do-start"
  disabled={!canStart}
  onClick={startMatch}
>
  {t("startGame")}
</button>
```

- [ ] **Step 5: Persist the setup draft once the match has started**

```jsx
useEffect(() => {
  if (phase !== "playing") return;
  onDraftChange?.({
    phase,
    players,
    selectedFlavors,
    scores,
    rounds,
    roundEvents,
    history,
    gameOver,
    winner,
  });
}, [phase, players, selectedFlavors, scores, rounds, roundEvents, history, gameOver, winner, onDraftChange]);
```

- [ ] **Step 6: Run the setup-focused tests to verify green**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js --grep "enforces 2-9 players|allows manual flavor replacement"`
Expected: PASS with no duplicate flavor options available in the slot selectors.

### Task 4: Implement round resolution, undo, game-over, and saved-match output

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/src/components/games/SushiDoNewMatch.tsx`
- Test: `C:/Users/dylan/mpoints-tracker/tests/games/sushi-do.spec.js`

- [ ] **Step 1: Add match-state primitives for scores, rounds, open-round log, history snapshots, and winner**

```jsx
const [scores, setScores] = useState(draft?.scores || {});
const [rounds, setRounds] = useState(draft?.rounds || 1);
const [roundEvents, setRoundEvents] = useState(draft?.roundEvents || []);
const [history, setHistory] = useState(draft?.history || []);
const [selectedCallerId, setSelectedCallerId] = useState(null);
const [resolutionMode, setResolutionMode] = useState(null);
const [gameOver, setGameOver] = useState(draft?.gameOver || false);
const [winner, setWinner] = useState(draft?.winner || null);
```

- [ ] **Step 2: Implement penalty resolution without advancing the round**

```jsx
function applyPenalty(playerId) {
  const previousScores = { ...scores };
  const nextScores = { ...scores, [playerId]: (scores[playerId] || 0) - SUSHI_DO_PENALTY };
  const nextRoundEvents = [...roundEvents, {
    type: "penalty",
    playerId,
    flavorKey: null,
    delta: -SUSHI_DO_PENALTY,
    round: rounds,
  }];

  setHistory((entries) => [...entries, {
    type: "penalty",
    scoreSnap: previousScores,
    roundBefore: rounds,
    roundEventsSnap: roundEvents,
    gameOverSnap: gameOver,
    winnerSnap: winner,
    selectedCallerSnap: selectedCallerId,
    resolutionModeSnap: resolutionMode,
  }]);
  setScores(nextScores);
  setRoundEvents(nextRoundEvents);
  setSelectedCallerId(null);
  setResolutionMode(null);
}
```

- [ ] **Step 3: Implement successful flavor confirmation using only the active flavors**

```jsx
function applyRoundWin(playerId, flavorKey) {
  const flavor = getSushiDoFlavorByKey(flavorKey);
  if (!flavor) return;

  const previousScores = { ...scores };
  const nextScore = (scores[playerId] || 0) + flavor.points;
  const nextScores = { ...scores, [playerId]: nextScore };
  const nextRoundEvents = [...roundEvents, {
    type: "round_win",
    playerId,
    flavorKey,
    delta: flavor.points,
    round: rounds,
  }];
  const winningPlayer = namedPlayers.find((player) => player.id === playerId);
  const reachedGoal = nextScore >= SUSHI_DO_WIN_SCORE;

  setHistory((entries) => [...entries, {
    type: "round_win",
    scoreSnap: previousScores,
    roundBefore: rounds,
    roundEventsSnap: roundEvents,
    gameOverSnap: gameOver,
    winnerSnap: winner,
    selectedCallerSnap: selectedCallerId,
    resolutionModeSnap: resolutionMode,
  }]);
  setScores(nextScores);
  setRoundEvents([]);
  setRounds((current) => current + 1);
  setSelectedCallerId(null);
  setResolutionMode(null);
  setGameOver(reachedGoal);
  setWinner(reachedGoal ? winningPlayer?.name || null : null);
}
```

- [ ] **Step 4: Add undo that restores full round-open state**

```jsx
function undoLastEvent() {
  const last = history[history.length - 1];
  if (!last) return;

  setScores(last.scoreSnap);
  setRounds(last.roundBefore);
  setRoundEvents(last.roundEventsSnap);
  setGameOver(last.gameOverSnap);
  setWinner(last.winnerSnap);
  setSelectedCallerId(last.selectedCallerSnap);
  setResolutionMode(last.resolutionModeSnap);
  setHistory((entries) => entries.slice(0, -1));
}
```

- [ ] **Step 5: Save a compatible match payload that includes `flavorsInPlay` and `roundLog`**

```jsx
function handleSave() {
  const sorted = [...namedPlayers].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  onSave({
    id: mkId(),
    date: new Date().toISOString(),
    players: sorted.map((player) => ({ name: player.name, score: scores[player.id] || 0 })),
    winner,
    rounds: Math.max(rounds - 1, 0),
    flavorsInPlay: selectedFlavors,
    roundLog: history.map((entry) => ({
      type: entry.type,
      round: entry.roundBefore,
      playerId: namedPlayers.find((player) => player.id === entry.selectedCallerSnap)?.name || null,
      flavorKey: entry.flavorKey || null,
      delta: entry.delta || null,
    })),
  });
}
```

- [ ] **Step 6: Run the match-flow tests to verify green**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js --grep "successful Sushi Do!|failed Sushi Do!|restores selected flavors"`
Expected: PASS with only `selectedFlavors` rendered in the success picker, penalties leaving the round open, undo restoring the previous snapshot, and the match ending as soon as a score reaches `500`.

### Task 5: Add translation keys and stable test hooks

**Files:**
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/es.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/en.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/fr.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/ja.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/data/translations/zh.ts`
- Modify: `C:/Users/dylan/mpoints-tracker/src/components/games/SushiDoNewMatch.tsx`

- [ ] **Step 1: Add a tagline key for the new game in every locale**

```js
"taglineSushiDo": "500 pts · 6 iguales por sabor",
```

- [ ] **Step 2: Add the UI labels used by the dedicated screen in every locale file**

```js
"sushiDoFlavors": "Sabores en juego",
"sushiDoRestoreSuggestion": "Restaurar sugerencia",
"sushiDoCallerPrompt": "¿Quién gritó Sushi Do!?",
"sushiDoResolveSuccess": "Confirmar sabor completado",
"sushiDoResolvePenalty": "Registrar penalización -20",
"sushiDoRoundLog": "Eventos de la ronda",
"sushiDoGameOver": "Partida terminada",
```

- [ ] **Step 3: Add stable `data-testid` hooks instead of depending on translated copy**

```jsx
<div data-testid="sushi-do-setup">...</div>
<div data-testid="sushi-do-active-flavors">...</div>
<div data-testid="sushi-do-round-log">...</div>
<div data-testid="sushi-do-game-over">...</div>
<button data-testid="sushi-do-resolve-success">...</button>
<button data-testid="sushi-do-resolve-penalty">...</button>
<button data-testid="sushi-do-undo">...</button>
<button data-testid="save-match">...</button>
```

- [ ] **Step 4: Run i18n parity and the game-specific test file**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\translations-parity.spec.js tests\games\sushi-do.spec.js`
Expected: PASS with no missing translation keys and no selector drift from localized copy.

### Task 6: Run targeted regressions and final verification

**Files:**
- Test: `C:/Users/dylan/mpoints-tracker/tests/games/sushi-do.spec.js`
- Test: `C:/Users/dylan/mpoints-tracker/tests/navigation.spec.js`
- Test: `C:/Users/dylan/mpoints-tracker/tests/history.spec.js`

- [ ] **Step 1: Run the dedicated `Sushi Do!` logic suite**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\games\sushi-do.spec.js`
Expected: PASS with all new `Sushi Do!` scenarios green.

- [ ] **Step 2: Run navigation and history regressions that cover catalog and saved-match behavior**

Run: `node .\node_modules\playwright\cli.js test --project=logic tests\navigation.spec.js tests\history.spec.js`
Expected: PASS with `sushi_do` added to the catalog and no regressions in shared-history flows.

- [ ] **Step 3: Run the production build**

Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS with exit code `0`.

- [ ] **Step 4: Re-read the spec and confirm every acceptance criterion is covered before final delivery**

```txt
- new standalone game in cards section -> Task 2
- player count 2-9 -> Task 3
- top-N flavor suggestion + manual unique replacement -> Task 3
- success picker only shows selected flavors -> Task 4
- failed call applies -20 and keeps round open -> Task 4
- fixed-value scoring once per win -> Task 4
- end at 500+ -> Task 4
- undo + draft restore -> Task 4
```

- [ ] **Step 5: Report any remaining gaps explicitly instead of claiming completion without evidence**

```txt
If any targeted Playwright test, translation parity, or build command fails, stop and fix the code before final delivery.
```
