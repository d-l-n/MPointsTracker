# AI Game Cover Cards Design

## Goal

Redesign the game card cover artwork in the Juegos section as a complete set of AI-generated photographic covers.

The covers should make each game immediately recognizable while feeling like part of the MPOINTS visual system. The result should replace the current mixed set of real photos and SVG fallbacks with a coherent catalog of generated photo assets.

## Approved Direction

The approved direction is `system common + per-game environment`.

Each cover is an AI-generated photo, not an illustration and not a simple filter over the current asset. The image should look like a carefully staged product or tabletop scene:

- horizontal 16:9 composition;
- clear central object or game setup;
- realistic materials and lighting;
- shallow depth, soft background, and controlled contrast;
- enough calm space for the existing card overlay and text to remain legible;
- an environment tailored to the specific game;
- logo or game name visible when the real game has one and recognition benefits from it.

The shared system gives the catalog cohesion. The individual environment gives each game personality.

## Visual System

All covers should follow these common rules:

- Use a photographic product/tabletop language.
- Keep the game object readable at mobile card size.
- Use premium, intentional lighting rather than casual snapshots.
- Preserve the game's identity color as an ambient accent where useful.
- Avoid crowded backgrounds and fine details that disappear in a small card.
- Leave a darker or calmer lower area when possible because card copy overlays the hero.
- Avoid invented labels, extra UI text, illegible writing, or fake/incorrect brand marks.
- Prefer WebP assets for production delivery unless source tooling requires a lossless intermediate.

The app should not rely on CSS filters to create the final style. The asset itself should carry the direction. Existing CSS treatment on `.home-card-hero-cover` should be softened or removed if it damages color, logos, or recognition.

## Catalog Scope

The redesign applies to all visible game cards in Juegos:

- UNO
- UNO No Mercy
- UNO Flip
- DOS
- Truco
- Chancho
- Esquinados
- Chin
- Chinchon
- Rummy
- Poker
- Blackjack
- Burako
- Generala
- Ajedrez
- Racha Perdida
- Sushi Do!
- Contador de Porciones
- Basta!
- Monopoly
- Life
- Juego libre
- Canasta

Games that currently share a source photo should receive distinct generated covers. Variants can share family traits, but the final assets should not be duplicates.

## Game-Specific Direction

### UNO Family

UNO, UNO No Mercy, UNO Flip, and DOS should read as one family but with variant-specific identity.

- `UNO`: bright, energetic tabletop product photo with recognizable UNO cards or packaging.
- `UNO No Mercy`: darker, more intense scene with stronger contrast and hazard-like energy.
- `UNO Flip`: dual clear/dark composition, split lighting, visible flip identity.
- `DOS`: cleaner blue-leaning setup with DOS identity visible.

### Spanish/Card Table Family

These games should feel like card-table games, not generic poker imagery.

- `Truco`: warm Argentine table scene, Spanish cards, mate or subtle local table props if useful.
- `Chancho`: playful tabletop scene with cards arranged in a lively rhythm.
- `Esquinados`: cards or tiles arranged to emphasize corners and grid-like placement.
- `Chin`: tighter 1v1 duel composition with two opposing card areas.
- `Chinchon`: Spanish-card melds and discard feel, more classic and strategic.

### Classic Card and Casino Family

- `Rummy`: organized melds, clean card-table composition, tactical but approachable.
- `Canasta`: wider team/table feel, large melds or stacks, mature card-room atmosphere.
- `Burako`: tile/card set arranged in runs and groups, with clear table structure.
- `Poker`: casino-night photographic scene with chips/cards, but not too dark for card text.
- `Blackjack`: 21-oriented table scene, cards and chips, crisp focal point.

### Board, Dice, and Strategy Family

- `Generala`: tactile dice-focused scene with score-sheet hints and warm highlights.
- `Ajedrez`: sober chess-board composition, recognizable pieces, restrained premium lighting.
- `Monopoly`: recognizable board/property/money scene with Monopoly name or packaging when possible.
- `Life`: colorful board-game scene with car/pawn elements and Life identity visible when possible.

### Party, Food, and Utility Family

- `Sushi Do!`: playful sushi/card-game setup, sushi pieces and game identity clearly visible.
- `Contador de Porciones`: food-counting tabletop image with varied portions and a plate/counting cue.
- `Basta!`: word/category game setup with paper/cards/letters, clear but without fake readable words beyond intentional title treatment.
- `Racha Perdida`: streak-breaking concept as a photographic tabletop scene, using symbolic score marks, broken streak line, or dark game-night setup.
- `Juego libre`: flexible game-night scene with neutral cards, dice, tokens, and no specific brand.

## Asset and Code Strategy

Keep the current card layout and component contract. `HomeGameHero` already supports `coverImage`, loading, fallback, and state classes. The implementation should use that path instead of redesigning the card structure.

Planned technical direction:

- Create a new asset location such as `public/games/covers/<game-id>.webp`.
- Update `src/data/games.ts` so every visible game has a `coverImage`.
- Keep SVG fallback behavior in `HomeGameHero` if an image fails to load.
- Tune `.home-card-hero-cover` in `src/styles/app.css` so generated covers are not over-filtered.
- Keep any generated-source notes in documentation so assets can be regenerated consistently.

The current old assets in `public/games` can remain until final rollout is verified, unless cleanup is explicitly requested later.

## Prompt System

Each prompt should use a shared base and a game-specific scene description.

Shared prompt structure:

```text
AI-generated photographic horizontal 16:9 cover for a mobile game catalog card. Realistic staged tabletop/product photo. The game must be recognizable at small card size. Clear central subject, premium lighting, shallow depth of field, controlled contrast, soft background, and a calm lower area for UI text overlay. Use an ambient accent color compatible with the game identity and MPOINTS glass-style interface. Include the real logo or game name when it exists and helps recognition. Avoid extra invented text, fake labels, unreadable writing, cluttered background, hands, people, screenshots, UI elements, fake or incorrect brand marks, and distorted objects.
```

Each game then adds:

- game name;
- required recognizable object;
- environment mood;
- accent colors;
- specific exclusions.

## QA Criteria

Each final cover must pass a visual review:

- The game is recognizable in the actual card size on mobile.
- Logo or name is visible when applicable.
- There is no unwanted generated text.
- The image is not too dark under the overlay.
- The image works in light, dark, and OLED themes.
- Composition remains strong at 16:9 crop.
- File size is reasonable for web delivery.
- Variants are distinct from each other.
- The catalog reads as one collection despite per-game environments.

## Testing and Verification

Implementation verification should include:

- render check for the Juegos section;
- targeted home/action-card tests if current assertions depend on cover behavior;
- visual review in browser across mobile and desktop widths;
- check of light, dark, and OLED themes;
- fallback check by temporarily breaking one cover path or relying on existing error handling tests if present.

Because the main change is visual asset quality, browser review is required in addition to automated tests.

## Risks and Mitigations

### Trademark and Brand Risk

Some games have protected logos and product identities. The approved direction allows logos or names when they improve recognition. If distribution risk becomes a concern, the asset system should allow replacing a branded cover with a more generic recognizable object scene without changing the component architecture.

### Inconsistent AI Output

Generating all games at once can produce uneven lighting, detail, or style. The shared prompt base, per-game constraints, and QA matrix reduce this risk.

### Text Legibility

Busy photos can compete with card copy. Prompts should request calm lower areas and the CSS should avoid heavy filters that unpredictably alter generated covers.

### Asset Weight

Photographic covers can increase payload. Final files should be optimized WebP assets at the smallest acceptable resolution for the card's rendered size and density.

## Acceptance Criteria

- Every visible game card has an AI-generated photographic cover.
- Covers use distinct per-game environments while sharing a coherent MPOINTS collection feel.
- Branded games show logo/name when helpful and feasible.
- Existing card layout and quick actions remain unchanged.
- `HomeGameHero` fallback behavior remains available.
- Visual QA confirms recognition and text legibility across supported themes and responsive layouts.
