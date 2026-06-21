# Prompt — Audit 2: Accesibilidad & SEO

> Prompt único para implementar TODOS los cambios del audit de accesibilidad y SEO.
> Copiar y pegar a la IA (Developer con acceso a herramientas de edición de archivos).

---

Eres un Developer Senior especializado en accesibilidad web (WCAG 2.2 AA), SEO técnico y React. Implementá TODOS los cambios listados abajo en el proyecto ubicado en `D:\Mi Home\Desktop\proyectos\mpoints-tracker`.

Lee SIEMPRE cada archivo antes de editarlo. No hagas cambios que no estén listados. Trabajá secuencialmente: leé, editá, verificá, pasá al siguiente.

---

## 0. PRE-REQUISITOS

```bash
# Verificar estado inicial
npm run build && npx vitest run && npm run lint
```

Si falla algo, reportalo y detenete. Si pasa, continuá.

---

## 1. SEO — BLOQUEANTE

### 1.1 Corregir og:url y rutas de imágenes OG/Twitter

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\index.html`

Línea 32: Cambiar:
```html
<meta property="og:url" content="https://mpoints.pages.dev/" />
```
por:
```html
<meta property="og:url" content="https://mpoints-tracker.pages.dev/" />
```

Línea 36: Cambiar:
```html
<meta property="og:image" content="/og-image.png" />
```
por:
```html
<meta property="og:image" content="https://mpoints-tracker.pages.dev/og-image.png" />
```

Línea 45: Cambiar:
```html
<meta name="twitter:image" content="/og-image.png" />
```
por:
```html
<meta name="twitter:image" content="https://mpoints-tracker.pages.dev/og-image.png" />
```

### 1.2 Corregir dimensiones OG image en SEO component

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\seo\SEO.tsx`

Líneas ~36-37: Cambiar los valores de og:image:width/height de 512 a 1200 y 630 respectivamente. Buscar donde se setean y reemplazar.

### 1.3 Agregar JSON‑LD structured data

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\index.html`

Dentro de `<head>`, después de las meta tags, agregar:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "MPoints Tracker",
  "description": "Registrá partidas de UNO, Truco, Chinchón y más. Seguí estadísticas, rankings y mirá quién lidera entre tus amigos.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "url": "https://mpoints-tracker.pages.dev/",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

### 1.4 Completar sitemap con rutas dinámicas

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\public\sitemap.xml`

Reemplazar el contenido con un sitemap que incluya TODAS las rutas. Usar el archivo `src/data/games.ts` para obtener la lista de juegos. El formato debe ser:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://mpoints-tracker.pages.dev/</loc><priority>1.0</priority><changefreq>daily</changefreq><lastmod>2026-06-18</lastmod></url>
  <url><loc>https://mpoints-tracker.pages.dev/rules</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://mpoints-tracker.pages.dev/champions</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://mpoints-tracker.pages.dev/settings</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://mpoints-tracker.pages.dev/history</loc><priority>0.6</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://mpoints-tracker.pages.dev/feedback</loc><priority>0.4</priority><changefreq>monthly</changefreq></url>
  <!-- + UNA ENTRADA POR CADA JUEGO, ej: -->
  <url><loc>https://mpoints-tracker.pages.dev/game/uno</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://mpoints-tracker.pages.dev/game/truco</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <!-- ... todos los juegos -->
</urlset>
```

---

## 2. ACCESIBILIDAD — HEADINGS (CRÍTICO)

### 2.1 `<h1>` en cada página principal

Buscar y reemplazar en TODAS las páginas el `<span className="htitle...">` principal por `<h1 className="htitle...">`. Mantener EXACTAMENTE las mismas clases CSS. NO cambiar estilos.

Páginas a modificar (una lista por archivo):

**`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\pages\GameDetail.tsx`**
Línea ~180: `<span className="htitle detail-title">` → `<h1 className="htitle detail-title">`

**`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\AppLayout.tsx`**
Buscar cada sección de página y cambiar el título principal a `<h1>`. Secciones: Settings (~840), Rules (~580), Champs (~500), History, Admin.

**`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\home\HomeTab.tsx`**
El título principal del Home debe ser `<h1>`.

**`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\pages\PublicProfilePage.tsx`**
El nombre del usuario debe ser `<h1>`.

**`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\pages\AdminPage.tsx`**
El título "Admin" debe ser `<h1>`.

### 2.2 Jerarquía de headings `<h2>` / `<h3>`

Convertir títulos de secciones a `<h2>` y subsecciones a `<h3>`:

- **HomeTab.tsx:** Grupos de juegos → `<h2 className="home-group-title">` (líneas ~269, 291)
- **StatsTab.tsx:** Cada sección de estadísticas → `<h2>` / `<h3>`
- **SettingsPage.tsx:** "Perfil", "Preferencias", "Spotify", etc. → `<h2>`
- **RulesPage.tsx:** Categorías de reglas → `<h2>`
- **AdminPage.tsx:** Tabs → `<h2>`, subsecciones → `<h3>`
- **PublicProfilePage.tsx:** Secciones del perfil → `<h2>`
- **GameDetail.tsx:** Stats, Historial → `<h2>`
- **GameTabContent.tsx:** Resultados → `<h2>`

---

## 3. ACCESIBILIDAD — FORM LABELS

### 3.1 Labels en los 17 formularios de juego

En CADA archivo dentro de `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\games\`:

1. Identificar cada `<span className="flbl">` que sirve como label de un input
2. Agregar un `id` único al input (ej: `id="truco-players-input"`)
3. Cambiar `<span className="flbl">` por `<label htmlFor="ese-id" className="flbl">`

Juegos a modificar (todos en `src/components/games/`):
- `TrucoNewMatch.tsx` — líneas ~149, 163, 177, 180-186, 215
- `UnoNewMatch.tsx` — líneas ~437, 542, 607, 617
- `GenericNewMatch.tsx` — líneas ~339, 397, 492, 574, 587, 677, 708
- `PokerNewMatch.tsx` — líneas ~207, 289, 377, 584, 623
- `BlackjackNewMatch.tsx` — líneas ~172, 252, 421
- `ChinchonNewMatch.tsx`
- `RummyNewMatch.tsx`
- `SieteYMediaNewMatch.tsx`
- `EsquinadosNewMatch.tsx`
- `TuteNewMatch.tsx`
- `MusNewMatch.tsx`
- `ContratoNewMatch.tsx`
- `BriscaNewMatch.tsx`
- `DurakNewMatch.tsx`
- `AjedrezNewMatch.tsx`
- `PadelNewMatch.tsx`
- `PortionCounterNewMatch.tsx`
- `UnoNoMercyNewMatch.tsx`

### 3.2 Labels en EditMatchModal

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\EditMatchModal.tsx`

- Línea ~137: Agregar `<label htmlFor>` al input de fecha (hoy tiene solo `aria-label`)
- Líneas ~148-165: Agregar `<label htmlFor>` a cada input de nombre de jugador y score (en el loop)
- Línea ~178: Winner selection: cambiar `<span className="flbl">` por `<fieldset><legend>`, y los botones de winner usar `<label>` con `role="radio"` y `aria-checked`

---

## 4. ACCESIBILIDAD — MODALES (DIALOG SEMANTICS)

Para CADA modal, aplicar el mismo patrón:

1. Agregar `role="dialog"` y `aria-modal="true"` al contenedor principal
2. Agregar `aria-labelledby` linkeado al `id` del título del modal
3. Importar `useFocusTrap` de `src/hooks/useFocusTrap` (YA EXISTE en el proyecto)
4. Usar `const focusRef = useFocusTrap(isOpen);` y asignar `ref={focusRef}` al contenedor del modal
5. Agregar cierre con tecla Escape (`onKeyDown`)

### 4.1 UserSearchModal

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\auth\UserSearchModal.tsx`

Aplicar el patrón completo. El overlay existe, agregar dialog semantics + focus trap + Escape.

### 4.2 InviteLinkModal

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\auth\InviteLinkModal.tsx`

Mismo patrón.

### 4.3 QRScanner

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\auth\QRScanner.tsx`

Mismo patrón.

### 4.4 nav-leave-overlay + auth-modal-shell

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\AppLayout.tsx`

Líneas ~777 y ~807-819: Son overlays modales sin semantics. Aplicar mismo patrón.

---

## 5. ACCESIBILIDAD — ARIA E INTERACTIVOS

### 5.1 Keyboard navigation en tabs

**Archivos:** `GameDetail.tsx:197-204` y `AdminPage.tsx:590-611`

Agregar `onKeyDown` al elemento con `role="tablist"`:
```tsx
const handleTabKeyDown = (e: React.KeyboardEvent) => {
  let nextIndex = activeTab;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    nextIndex = (activeTab + 1) % tabs.length;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    nextIndex = (activeTab - 1 + tabs.length) % tabs.length;
  } else return;
  e.preventDefault();
  setActiveTab(nextIndex);
};
```

### 5.2 `<span onClick>` → `<button type="button">`

Reemplazar 4 instancias de `<span>` con `onClick` por `<button type="button">`:

1. **`AppLayout.tsx:367`** — `<span className="app-layout-avatar-trigger">`
2. **`AppLayout.tsx:661`** — otro avatar trigger
3. **`AppLayout.tsx:677`** — otro avatar trigger
4. **`VersionTapper.tsx:35`** — `<span className="about-value">`

Agregar CSS inline:
```tsx
style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
```

### 5.3 aria-label en LinkedPlayerInput

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\auth\LinkedPlayerInput.tsx`

Líneas ~163, 168, 174: Agregar `aria-label` a los botones que solo usan `title`:
```tsx
<button aria-label={t("searchUser")} title={t("searchUser")} ...>
```

### 5.4 aria-live en BootShell

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\BootShell.tsx`

Envolver el texto de loading:
```tsx
<div aria-live="polite">{loadingText}</div>
```

### 5.5 aria-live para scores y conectividad

- **StatsTab.tsx:** Agregar `aria-live="polite"` al contenedor de estadísticas
- **GameTabContent.tsx:** Agregar `aria-live="polite"` al contenedor de resultados
- **OfflineBanner.tsx:** Agregar `role="status"` al banner
- **SyncDot.tsx:** Agregar `role="status"` al contenedor

---

## 6. ACCESIBILIDAD — FOOTER, FOCUS, CONTRASTE

### 6.1 Agregar `<footer>` landmark

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\AppLayout.tsx`

Al final del shell (antes del cierre del componente), agregar:
```tsx
<footer className="app-footer" aria-label="Pie de página">
  <span>MPoints Tracker v3.7.2</span>
</footer>
```

### 6.2 focus-visible en `.usearch-inp`

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\styles\app.css`

Buscar el bloque de `:focus-visible` overrides (~líneas 2110-2122) y agregar:
```css
.usearch-inp:focus-visible {
  outline: none !important;
  box-shadow: var(--focus-ring);
}
```

### 6.3 Contraste de `--text-tertiary`

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\styles\tokens.css`

Localizar la definición de `--text-tertiary` en el tema claro. Si es `#585878`, cambiarlo a `#484868` (o un valor que dé ≥4.5:1 de contraste contra el fondo claro).

---

## 7. VERIFICACIÓN FINAL

Ejecutar en orden:

```bash
# 1. Build
npm run build

# 2. Tests unitarios
npx vitest run

# 3. Lint
npm run lint

# 4. Verificar headings en el build
rg "<h1" dist/index.html  # debe mostrar el h1 del index
rg "<h1" dist/assets/     # buscar h1 en chunks

# 5. Verificar JSON-LD
rg "application/ld+json" dist/index.html

# 6. Verificar OG tags
rg "og:url|og:image" dist/index.html

# 7. Verificar sitemap
python -c "import xml.etree.ElementTree as ET; tree = ET.parse('public/sitemap.xml'); root = tree.getroot(); ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}; urls = root.findall('.//s:loc', ns); print(f'{len(urls)} URLs en sitemap')"

# 8. Verificar dangerouslySetInnerHTML no quedó (excepto sw.js)
rg "dangerouslySetInnerHTML" src/ --include "*.tsx"

# 9. Verificar que no hay <span onClick> que deberían ser button
rg "<span[^>]*onClick" src/ --include "*.tsx"
```

Si todo pasa, el audit de Accesibilidad y SEO está completo. Reportá el resumen de cambios hechos.
