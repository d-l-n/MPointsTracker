# Liquid Glass Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realinear la app con los principios de Liquid Glass, reduciendo el glass en la capa de contenido, preservándolo en la capa funcional y agregando una opción de accesibilidad para reducir animaciones y transparencias.

**Architecture:** La implementación se apoya en una separación explícita entre superficies funcionales y superficies de contenido. La base del cambio vive en tokens CSS globales y una preferencia persistida de accesibilidad (`reduceEffects`) aplicada mediante clases globales en el root. A partir de eso, se refactorizan gradualmente las pantallas para que navegación, overlays y acciones prioritarias mantengan glass, mientras que cards, formularios, tablas y vistas informativas pasen a superficies estables y más legibles.

**Tech Stack:** React 19, Vite, CSS global en `src/styles/app.css`, estado local con `useState`, persistencia en `localStorage`.

---

## Scope

- Separar visualmente `functional-glass` de `content-surface`.
- Reducir el uso de `backdrop-filter` y blur fuerte en contenido.
- Mantener glass principalmente en navegación, overlays, modales, toasts y acciones prioritarias.
- Agregar una opción de accesibilidad manual en Settings para reducir animaciones y transparencias.
- Integrar `prefers-reduced-motion` como señal adicional del sistema.
- Restaurar `focus-visible` consistente en toda la app.

## Out of Scope

- Reescritura completa del lenguaje visual.
- Migración a componentes nativos o adopción de APIs Apple nativas.
- Cambios de copy o i18n no relacionados con la nueva preferencia de accesibilidad.

## Files To Modify

- `src/styles/app.css`
  Responsabilidad: tokens visuales, separación de superficies, motion, foco visible, estilos de la nueva preferencia.
- `src/App.tsx`
  Responsabilidad: estado global de `reduceEffects`, persistencia, lectura de `prefers-reduced-motion`, clases globales en el root.
- `src/pages/SettingsPage.tsx`
  Responsabilidad: UI de la nueva opción de accesibilidad y wiring con el estado global.
- `src/components/ui/AppShell.tsx`
  Responsabilidad: verificar que las nuevas clases globales no rompan el shell y que la jerarquía visual quede clara.
- `src/pages/GameDetail.tsx`
  Responsabilidad: ajustar superficies de contenido y preservar sólo glass funcional donde corresponda.
- `src/pages/GlobalHistoryPage.tsx`
  Responsabilidad: convertir cards/filtros/búsqueda hacia superficies de contenido más estables.
- `src/pages/ChampsPage.tsx`
  Responsabilidad: bajar glass del contenido informativo y mantener énfasis sólo donde aporte jerarquía.
- `src/pages/RulesPage.tsx`
  Responsabilidad: mover cards de reglas a superficies de contenido.
- `src/pages/FeedbackPage.tsx`
  Responsabilidad: asegurar contraste, foco y compatibilidad con `reduceEffects`.

## Key CSS Targets

### Should stay functional-glass

- `.nav`
- `.navbtn.active`
- `.modal-box`
- `.toast`
- `.install-banner`
- `.usearch-sheet`
- `.ibtn` (a validar; probablemente conservar)

### Should migrate to content-surface

- `.gcard`
- `.gcollapse`
- `.sec-card`
- `.sb`
- `.mcard`
- `.scard`
- `.lbrow`
- `.rule-game-card`
- `.champ-hero`
- `.podium-row`
- `.cbg-card`
- `.h2h-panel`
- `.h2h-scoreboard`
- `.about-card`
- `.about-intro`
- `.admin-card`
- `.home-stat-card`
- `.inp`
- `.search-inp`
- `.fb-textarea`

### Motion/accessibility targets

- `.app-bg::before`
- `.app-bg::after`
- `.app-bg-shimmer`
- `.gcard::after`
- `.mcard::after`
- `.lbrow::after`
- `.podium-row.p1::after`
- `.gcollapse-body.open .gcard::after`
- `.round-feedback`
- `.splash-*`
- `.install-banner`
- `.ios-hint`

---

## Task 1: Introduce Global Reduce Effects State

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] Add persisted `reduceEffects` state in `src/App.tsx`, following the same persistence pattern already used for `themeMode`, `oledEnabled`, and `wakeLockEnabled`.
- [ ] Add a `prefersReducedMotion` detector using `window.matchMedia("(prefers-reduced-motion: reduce)")`.
- [ ] Define the effective flag so that explicit in-app preference wins, while system motion preference can still inform defaults.
- [ ] Apply a root class like `reduced-effects` on `document.documentElement`.
- [ ] Thread `reduceEffects` and `onToggleReduceEffects` down to `SettingsPage`.
- [ ] Add a new settings control labeled as accessibility, with copy that explicitly says it reduces animations and transparencies.

**Acceptance:**
- Toggling the option updates UI immediately.
- The value persists across reloads.
- The root receives/removes `reduced-effects` correctly.

---

## Task 2: Split Functional Glass from Content Surface in CSS

**Files:**
- Modify: `src/styles/app.css`

- [ ] Introduce new surface tokens in `:root`, `.dark`, `.light`, and `.oled.dark`.
- [ ] Keep existing glass tokens for navigation/overlay usage.
- [ ] Add a content-surface token family with lower transparency, lower blur, stronger separation, and simpler shadows.
- [ ] Migrate the content-target classes from `var(--glass)` / `var(--blur)` to the new content surface variables.
- [ ] Preserve visual consistency across light, dark, and OLED.

**Acceptance:**
- Navigation still reads as elevated glass.
- Content cards and forms stop looking like the same material as the nav.
- Text remains readable over all migrated surfaces.

---

## Task 3: Add Reduced Effects CSS Behavior

**Files:**
- Modify: `src/styles/app.css`

- [ ] Add a `.reduced-effects` section that reduces or disables:
  - `backdrop-filter` on content surfaces
  - infinite background drift
  - iridescent shimmer
  - non-essential scale/pop/slide effects
- [ ] Add a `@media (prefers-reduced-motion: reduce)` section that disables continuous decorative motion even if the in-app preference is not manually enabled.
- [ ] Keep minimal opacity/color transitions only where needed for usability.
- [ ] Ensure functional overlays remain legible when transparency is reduced.

**Acceptance:**
- With `reduceEffects` enabled, there is no continuous shimmer/drift.
- Content surfaces no longer rely on strong transparency.
- The app still feels responsive, but calmer.

---

## Task 4: Restore Focus Visibility

**Files:**
- Modify: `src/styles/app.css`

- [ ] Remove the global `outline: none` / `box-shadow: none` suppression in Settings-related selectors.
- [ ] Replace it with a visible, consistent `:focus-visible` style for:
  - buttons
  - inputs
  - tabs
  - settings rows
  - language pills
  - theme buttons
  - feedback type buttons
- [ ] Ensure the focus treatment works in dark, light, and reduced-effects modes.

**Acceptance:**
- Keyboard navigation is visually trackable everywhere.
- Focus style is consistent and not noisy.

---

## Task 5: Refactor Home and Shared Content Surfaces

**Files:**
- Modify: `src/styles/app.css`
- Review: `src/App.tsx`

- [ ] Migrate `.gcard`, `.gcollapse`, and `.home-stat-card` to content-surface styling.
- [ ] Keep `.nav` untouched except for any accessibility-compatible motion adjustments.
- [ ] Re-check the visual hierarchy between the floating nav and the home content.

**Acceptance:**
- The home grid reads as content.
- The nav remains the dominant functional layer.

---

## Task 6: Refactor Game, History, Champs, Rules, Settings, Feedback

**Files:**
- Modify: `src/styles/app.css`
- Review: `src/pages/GameDetail.tsx`
- Review: `src/pages/GlobalHistoryPage.tsx`
- Review: `src/pages/ChampsPage.tsx`
- Review: `src/pages/RulesPage.tsx`
- Review: `src/pages/SettingsPage.tsx`
- Review: `src/pages/FeedbackPage.tsx`

- [ ] Move content-heavy classes to content-surface styling.
- [ ] Preserve glass only in modal/overlay-like areas and key actions if they still benefit from it.
- [ ] Check each screen for contrast regressions after migration.
- [ ] Check that reduced-effects mode keeps these screens readable and visually coherent.

**Acceptance:**
- No screen uses glass as a blanket treatment for all cards and sections.
- Content remains visually grouped without blur-heavy dependency.

---

## Task 7: Final QA Pass

**Files:**
- Modify as needed: `src/styles/app.css`, `src/App.tsx`, `src/pages/SettingsPage.tsx`

- [ ] Validate light mode.
- [ ] Validate dark mode.
- [ ] Validate OLED mode.
- [ ] Validate `reduceEffects` enabled.
- [ ] Validate keyboard focus in Settings and feedback flows.
- [ ] Validate modals, toast, install banner, and user search modal.

**Acceptance checklist:**
- `nav` is the clearest glass surface.
- Content no longer competes visually with navigation.
- `reduceEffects` exists and works.
- `focus-visible` is restored.
- Decorative infinite motion is disabled when requested.

---

## Risks

- Because the app currently relies heavily on one shared visual language (`var(--glass)` + `var(--blur)`), changing tokens may create cross-screen regressions quickly.
- The focus reset removal may expose controls that need additional local styling.
- Reduced transparency can reveal that some surfaces depended on blur rather than contrast for legibility.

## Suggested Commit Sequence

1. `feat: add reduce effects accessibility preference`
2. `refactor: split functional glass from content surfaces`
3. `fix: restore visible focus states`
4. `refactor: align home and content screens with liquid glass hierarchy`
5. `fix: tune reduced effects and visual regressions`

## Verification Notes

- Prefer screenshot comparison for:
  - home
  - game detail
  - history
  - settings
- Manual checks are especially important for:
  - `reduceEffects`
  - keyboard focus
  - modal readability

## Handoff Prompt

Use this prompt in a new session:

```text
Continúa en C:\Users\dylan\mpoints-tracker con la implementación del plan docs/superpowers/plans/2026-04-19-liquid-glass-alignment.md.

Contexto clave:
- Ya se investigó Liquid Glass con fuentes primarias de Apple.
- La conclusión fue que la app sobreusa glass en la capa de contenido y no tiene adaptación suficiente para motion/transparencia/accesibilidad.
- Hay un requisito nuevo explícito: agregar una opción de accesibilidad para reducir animaciones y transparencias.

Objetivo de esta sesión:
1. Implementar la preferencia persistida `reduceEffects`.
2. Aplicarla globalmente con una clase en el root.
3. Añadir el control en Settings.
4. Empezar el refactor CSS separando `functional-glass` de `content-surface`.
5. Restaurar `focus-visible`.

Archivos prioritarios:
- src/App.tsx
- src/pages/SettingsPage.tsx
- src/styles/app.css

Reglas:
- Usa apply_patch para editar.
- No cambies comportamiento no relacionado.
- Verifica visualmente y con las pruebas disponibles lo que puedas.
- Si no alcanzas a completar todo, deja el trabajo en un estado consistente y resume lo pendiente contra el plan.
```

