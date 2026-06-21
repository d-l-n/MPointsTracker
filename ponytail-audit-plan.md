# Ponytail Audit — Plan de Implementación

> **Generado:** 2026-06-18 | **Scope:** Rendimiento, Seguridad, Accesibilidad, SEO
> **Bundle actual:** 1.67MB JS (517KB gzip) — monolitico, sin code splitting
> **Proyecto:** 164 archivos fuente, 34.5K líneas, 39 test files (233 tests)

---

## Auditoría Resumida

| # | Categoría | Hallazgo | Riesgo | Prioridad | Impacto |
|---|-----------|----------|--------|-----------|---------|
| 1 | ⚡ Rendimiento | Bundle monolítico 1.67MB, sin code splitting ni lazy loading | 🔴 Crítico | **P0** | 181 módulos en 1 chunk. Lighthouse baja en mobile. Toda la app se descarga antes de renderizar |
| 2 | ⚡ Rendimiento | Imágenes sin optimizar: `chinchon.png` 880KB, `og-image.png` 173KB, etc. | 🟡 Medio | **P1** | 11 imágenes >100KB sin webP/avif ni srcset. Pesan \~2.5MB total |
| 3 | ⚡ Rendimiento | Google Fonts via `@import` en CSS bloquea renderizado | 🟡 Medio | **P1** | FCP retrasado hasta descargar CSS que importa fonts |
| 4 | ⚡ Rendimiento | Sin debounce en búsqueda del HomeTab | 🟢 Bajo | **P2** | Recalcula viewModel en cada keystroke |
| 5 | ⚡ Rendimiento | Polling cada 1s en `useOnlineStatus` | 🟢 Bajo | **P2** | setInterval innecesario; bastan eventos online/offline |
| 6 | 🔒 Seguridad | Regla `users`: `allow read: if isAuth()` expone perfiles de todos los usuarios autenticados | 🔴 Crítico | **P0** | Cualquier usuario logueado puede leer `displayName`, `photoURL`, `publicStats` de TODOS los usuarios |
| 7 | 🔒 Seguridad | Admin UID hardcodeado en `firestore.rules` | 🟠 Alto | **P0** | Si el UID se filtra, cualquiera sabe quién es admin. Sin rotación ni escalabilidad |
| 8 | 🔒 Seguridad | `dangerouslySetInnerHTML` en `BlackjackCPU.tsx` | 🟠 Alto | **P1** | XSS potencial si el input del usuario contiene HTML malicioso |
| 9 | 🔒 Seguridad | Sin Content-Security-Policy ni headers de seguridad | 🟡 Medio | **P0** | Sin protección contra XSS, clickjacking, MIME sniffing |
| 10 | 🔒 Seguridad | `invites` collection: `allow read: if true` — lectura pública | 🟡 Medio | **P1** | Cualquiera (sin auth) puede leer invites. Expone UID, displayName |
| 11 | 🔒 Seguridad | localStorage auth bypass en `ProtectedRoute` | 🟡 Medio | **P1** | `bgt_last_uid` en localStorage permite eludir verificación real de auth |
| 12 | 🔒 Seguridad | Spotify URLs sin validación antes de renderizar `<img>` | 🟢 Bajo | **P2** | Riesgo de data-URI injection vía coverUrl |
| 13 | ♿ Accesibilidad | 17 formularios de juego sin `<label htmlFor>` — inputs sin nombre accesible | 🔴 Crítico | **P0** | Screen readers no pueden identificar campos: Truco, UNO, Poker, Chinchón, etc. |
| 14 | ♿ Accesibilidad | Sin jerarquía de headings (`<h1>`, `<h2>`, `<h3>`) — todo con `<span class="htitle">` | 🔴 Crítico | **P0** | Navegación por encabezados imposible. Impacta SEO directamente |
| 15 | ♿ Accesibilidad | Modales sin semántica: sin `role="dialog"`, `aria-modal`, focus trap ni Escape key | 🟠 Alto | **P0** | Usuarios de teclado/screen reader quedan atrapados o no detectan el modal |
| 16 | ♿ Accesibilidad | Elementos interactivos con `<span onClick>` en lugar de `<button>` | 🟠 Alto | **P1** | No activables con Enter/Espacio. Zero keyboard accessibility |
| 17 | ♿ Accesibilidad | Sin skip-to-content link | 🟡 Medio | **P1** | Usuarios de teclado deben tabular toda la navegación antes del contenido |
| 18 | ♿ Accesibilidad | Sin `aria-live` en regiones dinámicas (scores, conectividad, loading) | 🟡 Medio | **P1** | Cambios no anunciados por screen readers |
| 19 | ♿ Accesibilidad | Tabs (GameDetail, AdminPage) sin `role="tablist"`, `aria-selected`, keyboard nav | 🟡 Medio | **P1** | Patrón WAI-ARIA tabs no implementado |
| 20 | ♿ Accesibilidad | ESLint jsx-a11y configurado como `warn` — zero hard errors | 🟡 Medio | **P2** | Violaciones de accesibilidad no bloquean CI |
| 21 | 📈 SEO | Sin meta tags dinámicos por ruta — mismo title/description en toda la app | 🟠 Alto | **P0** | Cada página comparte mismo `og:title` y meta description. Indexación sub-óptima |
| 22 | 📈 SEO | `react-helmet-async` en package.json pero **nunca usado** | 🟡 Medio | **P0** | Dependencia muerta de 14KB. Solución lista pero no implementada |
| 23 | 📈 SEO | `og:url` apunta a `mpoints.pages.dev` en vez de `mpoints-tracker.pages.dev` | 🟡 Medio | **P0** | URLs de OG inválidas, penaliza compartición en redes |
| 24 | 📈 SEO | Sin JSON-LD structured data | 🟡 Medio | **P1** | Sin rich snippets en Google. Competidores con schema WebApplication tienen ventaja |
| 25 | 📈 SEO | Sin sitemap completo (solo rutas estáticas) | 🟡 Medio | **P1** | Crawlers no descubren páginas de juego (`/game/uno`, `/game/truco`, etc.) |
| 26 | 📈 SEO | `og:image:width`/`height` en 512×512 cuando `og-image.png` real es 1200×630 | 🟢 Bajo | **P1** | Dimensiones incorrectas pueden afectar preview en redes |

---

## Fase 0: Bloqueante 🔴

Ejecutar **antes que nada**. Sin estos cambios hay fugas de datos activas o la app es inusable para usuarios con discapacidades.

### P0-1: Cerrar reglas de lectura en `users`
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🔴 Crítico — Seguridad |
| **Archivos** | `firestore.rules` |
| **Cambio** | `allow read: if isAuth()` → `allow read: if isOwner(userId) \|\| isAdmin()` |
| **QA** | `getAllUsers()` falla con reglas nuevas. AdminPage sigue funcionando |
| **Subagente** | Developer + Tester |

### P0-2: Code splitting por ruta + `React.lazy()`
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🔴 Crítico — Performance |
| **Archivos** | `routes.tsx`, `App.tsx` |
| **Cambio** | Reemplazar imports estáticos con `React.lazy(() => import(...))` + `<Suspense>` en cada ruta. Separar pages, games, translations en chunks dinámicos |
| **QA** | `npm run build` → múltiples chunks. JS inicial se reduce ~60% |
| **Subagente** | Developer + Tester |

### P0-3: `<label htmlFor>` en 17 formularios de juego
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🔴 Crítico — Accesibilidad |
| **Archivos** | `TrucoNewMatch`, `UnoNewMatch`, `GenericNewMatch`, `PokerNewMatch`, `BlackjackNewMatch` +12 más |
| **Cambio** | Agregar `id` único a cada `<input>`/`<select>`. Cambiar `<span className="flbl">` → `<label htmlFor={id}>` |
| **QA** | `document.querySelectorAll('label[for]').length` ≥ cantidad de inputs. axe-core: 0 violaciones |
| **Subagente** | Developer |

### P0-4: Jerarquía semántica de headings
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🔴 Crítico — SEO + Accesibilidad |
| **Archivos** | `GameDetail`, `AppLayout`, `HomeTab`, `StatsTab`, `SettingsPage`, `RulesPage`, `ChampsPage`, `AdminPage`, `PublicProfilePage` |
| **Cambio** | Reemplazar `<span className="htitle">` → `<h1>`. Mapear secciones a `<h2>`/`<h3>`. Exactamente un `<h1>` por página |
| **QA** | `querySelectorAll('h1,h2,h3')` → jerarquía sin saltos. Sin cambios visuales |
| **Subagente** | Developer + Tester |

### P0-5: Agregar Content-Security-Policy + security headers
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Seguridad |
| **Archivos** | `public/_headers` (Cloudflare Pages) |
| **Cambio** | Agregar CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **QA** | `curl -I https://mpoints-tracker.pages.dev` → todos los headers presentes |
| **Subagente** | Developer |

### P0-6: Activar `react-helmet-async` para meta tags dinámicos por ruta
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟠 Alto — SEO |
| **Archivos** | `App.tsx`, cada `pages/*.tsx` |
| **Cambio** | Envolver App con `<HelmetProvider>`. Cada página renderiza `<Helmet>` con title + meta + OG propios |
| **QA** | View source en cada ruta → title y meta tags específicos de la página |
| **Subagente** | Developer + Tester |

### P0-7: Corregir `og:url` y OG image URLs absolutas
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — SEO |
| **Archivos** | `index.html` |
| **Cambio** | `og:url` → `https://mpoints-tracker.pages.dev/`. `og:image` y `twitter:image` → URLs absolutas con dominio |
| **QA** | View source → URLs absolutas correctas |
| **Subagente** | Developer |

---

## Fase 1: Alto Impacto 🟠

### P1-1: Migrar admin UID hardcodeado a custom claims
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟠 Alto — Seguridad |
| **Archivos** | `firestore.rules`, `AdminPage.tsx` |
| **Cambio** | Cloud Function que setee `customClaims({ admin: true })`. Reglas: `request.auth.token.admin == true` |
| **Nota** | Requiere deploy de Cloud Function vía Firebase CLI |
| **Subagente** | Developer + Tester |

### P1-2: `dangerouslySetInnerHTML` → JSX seguro en BlackjackCPU
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟠 Alto — Seguridad |
| **Archivos** | `BlackjackCPU.tsx` |
| **Cambio** | Reemplazar con `<strong style={{ color: tk.tx }}>{...}</strong>` |
| **QA** | Texto visualmente idéntico. Sin etiquetas HTML en output |
| **Subagente** | Developer |

### P1-3: Dialog semantics + focus trap en modales
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟠 Alto — Accesibilidad |
| **Archivos** | `UserSearchModal`, `InviteLinkModal`, `QRScanner`, `AppLayout` (nav-leave, auth-modal) |
| **Cambio** | Agregar `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape key |
| **QA** | Modal abierto → Tab cíclico. Escape cierra. Screen reader anuncia "diálogo" + título |
| **Subagente** | Developer + Tester |

### P1-4: `<span onClick>` → `<button type="button">`
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟠 Alto — Accesibilidad |
| **Archivos** | `AppLayout` (avatar trigger), `VersionTapper`, `EmailAuthScreen` (auth-logo) |
| **Cambio** | Cambiar a `<button type="button">` con estilos `background:none; border:none; padding:0` |
| **QA** | Click + Enter + Space funcionan. Sin cambios visuales |
| **Subagente** | Developer |

### P1-5: Lazy loading de traducciones + QR + SpotifyMiniPlayer
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Performance |
| **Archivos** | `translations.ts`, `UserQRCode`, `QRScanner`, `SpotifyMiniPlayer` |
| **Cambio** | `import()` dinámico según idioma. `React.lazy()` para QR y Spotify |
| **QA** | Build produce chunks separados. Solo carga lo necesario |
| **Subagente** | Developer |

### P1-6: Lazy loading condicional — SpotifyMiniPlayer
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Performance |
| **Archivos** | `SpotifyMiniPlayer.tsx`, `AppLayout.tsx` |
| **Cambio** | Montar solo cuando `spotifyEnabled === true`. Usar `React.lazy()` |
| **QA** | Usuario sin Spotify → 0KB de ese chunk cargados |
| **Subagente** | Developer |

### P1-7: Optimizar imágenes de portada (~2.5MB → <400KB)
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Performance |
| **Archivos** | `public/games/covers/*` |
| **Cambio** | Convertir a webP/avif. Generar thumbnails 200px. `loading="lazy"`. `srcset` |
| **QA** | Network: imágenes lazy cuando scroll alcanza. Peso total <400KB |
| **Subagente** | Developer + UX |

### P1-8: Google Fonts en `<link rel="preconnect">` + `<link rel="stylesheet">`
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Performance |
| **Archivos** | `index.html`, CSS |
| **Cambio** | Quitar `@import` de CSS. Agregar preconnect + stylesheet en `<head>` |
| **QA** | Lighthouse: "Eliminar recursos bloqueantes" mejora |
| **Subagente** | Developer |

### P1-9: Skip-to-content link + footer landmark
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Accesibilidad |
| **Archivos** | `AppLayout.tsx` |
| **Cambio** | Agregar `<a href="#main-content" className="sr-only">` al inicio. `id="main-content"` en contenido. `<footer>` landmark |
| **QA** | Tab al inicio → link visible. Click → foco en contenido. `document.querySelector('footer')` existe |
| **Subagente** | Developer |

### P1-10: `aria-live` en regiones dinámicas
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Accesibilidad |
| **Archivos** | `BootShell`, `StatsTab`, `GameTabContent`, `OfflineBanner`, `SyncDot` |
| **Cambio** | `<div aria-live="polite">` en loading. `role="status"` en OfflineBanner |
| **QA** | Screen reader anuncia cambios sin intervención |
| **Subagente** | Developer |

### P1-11: Cercar `__MP_TEST_*` globals con `import.meta.env.DEV`
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟠 Alto — Seguridad |
| **Archivos** | `useAuth.ts`, `inviteService.ts`, `PublicProfilePage.tsx` |
| **Cambio** | Envolver cada `window.__MP_TEST_*` con `if (import.meta.env.DEV)` |
| **QA** | Build prod: `grep __MP_TEST_ dist/` → 0 resultados |
| **Subagente** | Developer |

### P1-12: JSON-LD structured data
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — SEO |
| **Archivos** | `index.html` |
| **Cambio** | Agregar schema `WebApplication` con nombre, descripción, `applicationCategory=GameApplication` |
| **QA** | Google Rich Results Test → schema válido, 0 errores |
| **Subagente** | Developer |

### P1-13: Remover localStorage auth bypass en ProtectedRoute
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — Seguridad |
| **Archivos** | `ProtectedRoute.tsx` |
| **Cambio** | Eliminar `hasStoredSessionHint()`. Usar solo `fbAuth.currentUser` |
| **QA** | Setear `bgt_last_uid` en localStorage → ruta protegida redirige a `/login` |
| **Subagente** | Developer |

### P1-14: Sitemap completo con rutas de juegos
| Campo | Valor |
|-------|-------|
| **Riesgo** | 🟡 Medio — SEO |
| **Archivos** | `public/sitemap.xml` |
| **Cambio** | Agregar rutas `/game/uno`, `/game/truco`, etc. `<lastmod>`, `<changefreq>` |
| **QA** | XML válido. Google Search Console → sitemap procesado sin errores |
| **Subagente** | Developer |

---

## Fase 2: Mejora Continua 🟡

| # | Ítem | Categoría | Archivos | Subagente |
|---|------|-----------|----------|-----------|
| P2-1 | Tabs con `role="tablist"`, `aria-selected`, flechas teclado | A11y | `GameDetail`, `AdminPage` | Developer + Tester |
| P2-2 | `aria-label` en botones icono (LinkedPlayerInput, hamburguesa) | A11y | `LinkedPlayerInput`, `AppLayout` | Developer |
| P2-3 | `:focus-visible` global + contraste `--text-tertiary` ≥4.5:1 | A11y | `app.css`, `tokens.css` | Developer + UX |
| P2-4 | Debounce 300ms en búsqueda HomeTab | Perf | `HomeTab.tsx` | Developer |
| P2-5 | Eliminar polling 1s en useOnlineStatus | Perf | `useOnlineStatus.ts` | Developer |
| P2-6 | Dividir AppContext monolítico (Auth, Data, Theme, UI) | Perf | `AppContext.tsx`, `App.tsx` | Developer + Tester |
| P2-7 | `React.memo` en listas y game components | Perf | `HomeActionCard`, 17 game forms | Developer |
| P2-8 | ESLint jsx-a11y: warn → error en reglas críticas | A11y | `eslint.config.js` | Developer |
| P2-9 | Validar URLs Spotify contra data-URI injection | Seg | `SpotifyMiniPlayer.tsx` | Developer |
| P2-10 | Validación build-time de env vars | Seg | `vite.config.js` | Developer |
| P2-11 | `prefers-reduced-motion` en animaciones y confetti | A11y | `confetti.ts`, `AppLayout.tsx` | Developer |
| P2-12 | `og:image` dimensiones correctas (1200×630) vía Helmet | SEO | Componente SEO | Developer |
| P2-13 | Precachear rutas adicionales en SW | Perf | `public/sw.js` | Developer |
| P2-14 | CSS crítico inline + diferir resto | Perf | `index.html`, `app.css` | Developer |

---

## Orden de Implementación Sugerido

```
Fase 0 (Bloqueante)
├── P0-1  Cerrar reglas users         [Dev + Tester]
├── P0-2  Code splitting rutas         [Dev + Tester]
├── P0-3  Labels en 17 game forms      [Dev]
├── P0-4  Jerarquía headings           [Dev + Tester]
├── P0-5  CSP + security headers       [Dev]
├── P0-6  react-helmet-async por ruta  [Dev + Tester]
└── P0-7  og:url + OG URLs absolutas   [Dev]

Fase 1 (Alto Impacto)
├── P1-1  Admin custom claims          [Dev + Tester]
├── P1-2  dangerouslySetInnerHTML      [Dev]
├── P1-3  Modales dialog + focus trap  [Dev + Tester]
├── P1-4  <span> → <button>            [Dev]
├── P1-5  Lazy translations + QR       [Dev]
├── P1-6  SpotifyMiniPlayer lazy       [Dev]
├── P1-7  Optimizar imágenes           [Dev + UX]
├── P1-8  Google Fonts en <head>       [Dev]
├── P1-9  Skip link + footer           [Dev]
├── P1-10 aria-live regiones           [Dev]
├── P1-11 Cercar __MP_TEST_*           [Dev]
├── P1-12 JSON-LD structured data      [Dev]
├── P1-13 localStorage auth bypass     [Dev]
└── P1-14 Sitemap completo             [Dev]

Fase 2 (Mejora Continua)
├── P2-1  Tabs ARIA + keyboard nav     [Dev + Tester]
├── P2-2  aria-label botones icono     [Dev]
├── P2-3  focus-visible + contraste    [Dev + UX]
├── P2-4  Debounce búsqueda            [Dev]
├── P2-5  Eliminar polling             [Dev]
├── P2-6  Dividir AppContext           [Dev + Tester]
├── P2-7  React.memo listas            [Dev]
├── P2-8  ESLint a11y warn → error     [Dev]
├── P2-9  Validar URLs Spotify         [Dev]
├── P2-10 Build-time env validation    [Dev]
├── P2-11 prefers-reduced-motion       [Dev]
├── P2-12 og:image dimensions           [Dev]
├── P2-13 SW precachear rutas          [Dev]
└── P2-14 CSS crítico inline           [Dev]
```

---

## Roles de Subagentes

| Rol | Responsabilidad |
|-----|----------------|
| **Developer** | Implementa cambios de código, reglas, config. Dueño de la solución técnica |
| **Tester / QA** | Verifica cada punto según su criterio de aceptación. Test de regresión global al final |
| **UX / UI** | Revisa imágenes (P1-7), labels visuales (P0-3), contraste (P2-3). Participación optativa |
| **Orchestrator / PM** | Decide orden, resuelve bloqueos, valida entrega final |

---

## Criterio de Entrega

- Cada item tiene un commit que lo resuelve
- `npm run build` produce chunks separados y pasa sin errores
- Todos los tests existentes pasan (`npm run test:unit`, `npm run test:logic`)
- **Performance:** Lighthouse Performance ≥ 85 (desktop) / ≥ 65 (mobile)
- **Seguridad:** Sin `__MP_TEST_*` en bundle prod. CSP y headers presentes. Reglas Firestore cerradas
- **Accesibilidad:** axe-core: 0 violaciones críticas/serias. Cada página: 1 `<h1>`, labels en todos los inputs, modales con `role="dialog"` + focus trap
- **SEO:** `og:url`/`og:image` con URLs absolutas. JSON-LD válido. Sitemap con 30+ URLs. Meta tags dinámicos por ruta
