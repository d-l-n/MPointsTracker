# AI Game Cover Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every visible Juegos card cover with a distinct AI-generated photographic WebP asset while preserving the existing card layout and fallback behavior.

**Architecture:** Keep `HomeGameHero` as the rendering contract and feed it through `coverImage` in `src/data/games.ts`. Store production assets in `public/games/covers/<game-id>.webp`, keep regeneration prompts in docs, and limit CSS changes to removing visual treatment that damages the generated artwork.

**Tech Stack:** React, Vite, TypeScript data definitions, CSS, WebP assets generated through the built-in image generation tool and optimized with `sharp`.

---

### Task 1: Confirm Scope and Current Contract

**Files:**
- Read: `docs/superpowers/specs/2026-05-29-ai-game-cover-cards-design.md`
- Read: `src/data/games.ts`
- Read: `src/components/home/HomeGameHero.tsx`
- Read: `src/styles/app.css`

- [ ] **Step 1: Extract visible game IDs**

Use `HOME_GROUPS` in `src/components/home/homeModel.ts` and `GAMES` in `src/data/games.ts` to confirm the visible catalog IDs:

```text
uno, uno_no_mercy, uno_flip, uno_dos, truco, chancho, esquinados, chin, chinchon, rummy, poker, blackjack, burako, generala, ajedrez, racha_perdida, sushi_do, portion_counter, basta_dym, monopoly, life, custom, canasta
```

- [ ] **Step 2: Confirm rendering path**

Verify that every visible game uses `game.coverImage -> HomeCardModel.coverImage -> HomeActionCard -> HomeGameHero`.

Expected: no card layout changes are required.

### Task 2: Generate and Optimize Covers

**Files:**
- Create/Replace: `public/games/covers/*.webp`
- Update: `docs/superpowers/covers/ai-prompts.md`

- [ ] **Step 1: Generate sources**

Generate one 16:9 photographic source per visible game using the shared prompt system in `docs/superpowers/covers/ai-prompts.md`.

- [ ] **Step 2: Export final assets**

Convert each generated PNG source to `1280x720` WebP at quality `78`, using the exact ID mapping from Task 1.

Expected: all final files exist at `public/games/covers/<game-id>.webp`, and variants do not share the same asset.

- [ ] **Step 3: Create contact sheet for QA**

Build a temporary contact sheet from the WebP outputs and visually check recognition, distinctiveness, text issues, and lower-third legibility.

Expected: contact sheet is kept outside `public/` or removed before final delivery.

### Task 3: Wire Data and CSS

**Files:**
- Modify if needed: `src/data/games.ts`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Ensure all visible games have `coverImage`**

Confirm `src/data/games.ts` contains a `coverImage` for every visible game ID listed in Task 1.

Expected: hidden legacy portion games remain hidden and do not need cover assets.

- [ ] **Step 2: Soften cover CSS**

Remove the loaded-cover brightness/contrast filter from `.home-card-hero--has-cover.is-loaded .home-card-hero-cover`.

Expected CSS:

```css
.home-card-hero--has-cover.is-loaded .home-card-hero-cover{opacity:1}
```

### Task 4: Verify Behavior

**Files:**
- Read/Run: `package.json`
- Review: rendered Juegos page in browser

- [ ] **Step 1: Build**

Run:

```powershell
node .\node_modules\vite\bin\vite.js build
```

Expected: build exits 0.

- [ ] **Step 2: Targeted tests**

Run the relevant home/card test subset if present, otherwise run the existing logic test project:

```powershell
node .\node_modules\playwright\cli.js test --project=logic
```

Expected: no regressions related to home cards, quick actions, or fallback behavior.

- [ ] **Step 3: Browser visual QA**

Open the local app, review Juegos on desktop and mobile widths, and check light, dark, and OLED themes.

Expected: covers load, card copy stays readable, quick actions remain clickable, and fallback still works if an image path is broken.
