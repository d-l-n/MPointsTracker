# Prompt — Audit 1: Rendimiento & Seguridad

> Prompt único para implementar TODOS los cambios del audit de rendimiento y seguridad.
> Copiar y pegar a la IA (Developer con acceso a herramientas de edición de archivos).

---

Eres un Developer Senior especializado en React, Firebase y performance web. Implementá TODOS los cambios listados abajo en el proyecto ubicado en `D:\Mi Home\Desktop\proyectos\mpoints-tracker`.

Lee SIEMPRE cada archivo antes de editarlo. No hagas cambios que no estén listados. Trabajá secuencialmente: leé, editá, verificá, pasá al siguiente.

---

## 0. PRE-REQUISITOS

```bash
# Verificar estado inicial
npm run build && npx vitest run && npm run lint
```

Si falla algo, reportalo y detenete. Si pasa, continuá.

---

## 1. SEGURIDAD — BLOQUEANTE

### 1.1 Cerrar reglas Firestore — colección `users`

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\firestore.rules`

En la línea 23, cambiar:
```
allow read: if isAuth() || isAdmin();
```
por:
```
allow read: if isOwner(userId) || isAdmin();
```

### 1.2 Migrar admin UID hardcodeado a custom claims

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\firestore.rules`

Línea 12: Cambiar la función `isAdmin()`:
```
function isAdmin() {
  return isAuth()
      && request.auth.token.admin == true;
}
```

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\lib\storage.ts`

Línea ~40: Eliminar la constante `ADMIN_UID`. Exportar una nueva función:

```ts
export const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  const token = await user.getIdTokenResult();
  return token.claims.admin === true;
};
```

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\App.tsx`

Línea ~104: Reemplazar:
```tsx
const isAdmin = user?.uid === ADMIN_UID;
```
por:
```tsx
const [isAdmin, setIsAdmin] = useState(false);
useEffect(() => {
  if (user) checkIsAdmin(user).then(setIsAdmin);
  else setIsAdmin(false);
}, [user]);
```

**Nota:** Este cambio requiere crear y deployar una Cloud Function de Firebase que setee `customClaims({ admin: true })` para la UID deseada. Eso está fuera del alcance de este prompt. Implementá solo el cambio client-side y en las reglas.

### 1.3 Cercar `__MP_TEST_*` globals

Tres archivos a modificar. En CADA aparición de `window.__MP_TEST_*`, envolver con `if (import.meta.env.DEV) { ... }`:

- **`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\hooks\useAuth.ts`** — líneas ~60-64 y ~260-278
- **`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\lib\inviteService.ts`** — línea ~49
- **`D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\pages\PublicProfilePage.tsx`** — línea ~103

Ejemplo de cambio:
```ts
// ANTES:
(window as any).__MP_TEST_AUTH_USER__ = ...;

// DESPUÉS:
if (import.meta.env.DEV) {
  (window as any).__MP_TEST_AUTH_USER__ = ...;
}
```

### 1.4 Remover localStorage auth bypass en ProtectedRoute

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\auth\ProtectedRoute.tsx`

Eliminar la función `hasStoredSessionHint()` (líneas ~10-19) y el `|| hasStoredSessionHint()` del condicional (línea ~20). Dejar solo:
```tsx
if (fbAuth.currentUser) return <>{children}</>;
return <Navigate to="/login" replace />;
```

### 1.5 Eliminar dangerouslySetInnerHTML en BlackjackCPU

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\BlackjackCPU.tsx`

Línea ~657: Reemplazar:
```tsx
dangerouslySetInnerHTML={{
  __html: t("bjCpuInsuranceDesc").replace(
    "{n}",
    `<strong style="color:${tk.tx}">${Math.floor(bet/2)}</strong>`
  )
}}
```
por:
```tsx
(() => {
  const [before, after] = t("bjCpuInsuranceDesc").split("{n}");
  return <>{before}<strong style={{ color: tk.tx }}>{Math.floor(bet / 2)}</strong>{after}</>;
})()
```

### 1.6 Validar URLs de Spotify contra data-URI injection

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\SpotifyMiniPlayer.tsx`

Línea ~108, función `getTrackCover`:
```ts
function getTrackCover(track?: SpotifyTrack | null): string | undefined {
  const url = track?.album?.images?.[0]?.url;
  return url?.startsWith("https://") ? url : undefined;
}
```

### 1.7 Content-Security-Policy + headers de seguridad

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\public\_headers`

Agregar AL FINAL (después del bloque existente):
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://sdk.scdn.co https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.spotify.com https://accounts.spotify.com https://firestore.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 2. RENDIMIENTO — BUNDLE

### 2.1 Code splitting por ruta + React.lazy

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\routes\routes.tsx`

Reemplazar imports estáticos de páginas:
```tsx
const LoginPage = lazy(() => import("../pages/LoginPage"));
const GameDetail = lazy(() => import("../pages/GameDetail"));
const GlobalHistoryPage = lazy(() => import("../pages/GlobalHistoryPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const RulesPage = lazy(() => import("../pages/RulesPage"));
const ChampsPage = lazy(() => import("../pages/ChampsPage"));
const AdminPage = lazy(() => import("../pages/AdminPage"));
const PublicProfilePage = lazy(() => import("../pages/PublicProfilePage"));
const FeedbackPage = lazy(() => import("../pages/FeedbackPage"));
const HeadToHeadPage = lazy(() => import("../pages/HeadToHeadPage"));
```

Envolver el `<RouterProvider>` o la salida del router con `<Suspense fallback={<div className="boot-shell-slim">Cargando...</div>}>`.

### 2.2 Lazy loading de componentes de juego

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\pages\gameDetailRegistry.tsx`

Convertir el mapa de componentes a lazy:
```tsx
import { lazy } from "react";

const GAME_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  uno: lazy(() => import("../components/games/UnoNewMatch")),
  truco: lazy(() => import("../components/games/TrucoNewMatch")),
  chinchon: lazy(() => import("../components/games/ChinchonNewMatch")),
  rummy: lazy(() => import("../components/games/RummyNewMatch")),
  esquinados: lazy(() => import("../components/games/EsquinadosNewMatch")),
  sieteymedia: lazy(() => import("../components/games/SieteYMediaNewMatch")),
  tute: lazy(() => import("../components/games/TuteNewMatch")),
  mus: lazy(() => import("../components/games/MusNewMatch")),
  contrato: lazy(() => import("../components/games/ContratoNewMatch")),
  brisca: lazy(() => import("../components/games/BriscaNewMatch")),
  blackjack: lazy(() => import("../components/games/BlackjackNewMatch")),
  poker: lazy(() => import("../components/games/PokerNewMatch")),
  durak: lazy(() => import("../components/games/DurakNewMatch")),
  ajedrez: lazy(() => import("../components/games/AjedrezNewMatch")),
  padel: lazy(() => import("../components/games/PadelNewMatch")),
  portion_counter: lazy(() => import("../components/games/PortionCounterNewMatch")),
  uno_no_mercy: lazy(() => import("../components/games/UnoNoMercyNewMatch")),
};
```

### 2.3 Lazy loading de traducciones

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\data\translations.ts`

Reemplazar imports estáticos:
```ts
// ELIMINAR:
import de from "./translations/de";
import en from "./translations/en";
import es from "./translations/es";
import fr from "./translations/fr";
import ja from "./translations/ja";
import zh from "./translations/zh";
```

Modificar la función `loadTranslations` (o donde se carguen) para que use import dinámico:
```ts
export async function loadTranslations(lang: string): Promise<Record<string, string>> {
  const mod = await import(`./translations/${lang}`);
  return mod.default;
}
```

Si la función se llama sincrónicamente, ajustar los consumidores para que sean async o usar un estado de loading.

### 2.4 Lazy loading de componentes QR

Envolver `UserQRCode` y `QRScanner` con `React.lazy()` en sus respectivos padres:
```tsx
const UserQRCode = lazy(() => import("./UserQRCode"));
const QRScanner = lazy(() => import("./QRScanner"));
```

---

## 3. RENDIMIENTO — RENDERIZADO REACT

### 3.1 Dividir AppContext monolítico

**Archivos:** `src/context/AppContext.tsx`, `src/App.tsx`, y todos los consumidores de `useAppContext`.

Crear CUATRO contextos separados:

1. **AuthContext** — valores: `user`. Hook: `useAuthContext()`.
2. **DataContext** — valores: `data`, `getMatches`, `addMatch`, `delMatch`, `editMatch`, `playerGroups`, `savePlayerGroups`, `knownNames`. Hook: `useDataContext()`.
3. **ThemeContext** — valores: `dark`, `lang`, `t`, `spotifyEnabled`, `spotifyPosition`, `saveSpotifyPreference`, `saveSpotifyPosition`. Hook: `useThemeContext()`.
4. **UIContext** — valores: `showToast`, `pendingInvite`, `claimPendingInvite`. Hook: `useUIContext()`.

En `App.tsx`, anidar los 4 providers:
```tsx
<AuthProvider>
  <DataProvider>
    <ThemeProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </ThemeProvider>
  </DataProvider>
</AuthProvider>
```

En cada componente consumidor, reemplazar `useAppContext()` por el hook específico que necesita. Por ejemplo:
- `SpotifyMiniPlayer` solo necesita `useThemeContext()` y `useAuthContext()`
- `HomeTab` solo necesita `useDataContext()` y `useThemeContext()`
- `GameDetail` solo necesita `useDataContext()` y `useThemeContext()`

### 3.2 Refactor App.tsx

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\App.tsx`

- Reducir `App.tsx` a solo la composición de providers
- Mover lógica de hooks a los contextos correspondientes
- Eliminar inline callbacks que se re-crean en cada render

### 3.3 Refactor AppLayout.tsx

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\AppLayout.tsx`

- Extraer cada sección de página en su propio subcomponente con `React.memo`
- Extraer `standardHeaderActions` y `pageHeader` como componentes memoizados
- Revisar que las funciones inline en JSX no rompan la memoización

### 3.4 React.memo en componentes de lista y juego

Agregar `export default React.memo(...)` o `export default React.memo(ComponentName)` en:
- `HomeActionCard.tsx`
- `HomeGameHero.tsx`
- `UnoNewMatch.tsx`, `TrucoNewMatch.tsx`, `ChinchonNewMatch.tsx`, `RummyNewMatch.tsx`, `EsquinadosNewMatch.tsx`, `SieteYMediaNewMatch.tsx`, `TuteNewMatch.tsx`, `MusNewMatch.tsx`, `ContratoNewMatch.tsx`, `BriscaNewMatch.tsx`, `BlackjackNewMatch.tsx`, `PokerNewMatch.tsx`, `DurakNewMatch.tsx`, `AjedrezNewMatch.tsx`, `PadelNewMatch.tsx`, `PortionCounterNewMatch.tsx`, `UnoNoMercyNewMatch.tsx`

En los padres, revisar que no pasen objetos/arrays inline como props.

---

## 4. RENDIMIENTO — ASSETS Y CSS

### 4.1 Google Fonts: de @import a <link>

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\styles\app.css`

Eliminar la línea 2: `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Google+Sans:wght@300;400;500;600;700&display=swap');`

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\index.html`

En `<head>`, agregar:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Google+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 4.2 Optimizar imágenes de portada

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\home\HomeGameHero.tsx`

Línea ~367: Cambiar `loading="eager"` por `loading="lazy"` en todas las cards.

**Archivos:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\public\games\covers\*.webp`

Generar thumbnails de 200px de ancho usando `sharp` (Node) o cualquier herramienta disponible. Target: <15KB por imagen. Si no hay herramientas instaladas, saltear este paso pero dejar constancia.

### 4.3 Eliminar polling de useOnlineStatus

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\hooks\useOnlineStatus.ts`

Eliminar el `setInterval` de la línea ~23. Mantener solo los event listeners de `online`/`offline` + `focus`/`visibilitychange`.

### 4.4 Debounce en búsqueda del HomeTab

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\home\HomeTab.tsx`

Línea ~152: Usar `useDeferredValue` de React 19:
```tsx
import { useDeferredValue } from "react";
const [search, setSearch] = useState("");
const deferredSearch = useDeferredValue(search);
```
Y usar `deferredSearch` en el `useMemo` de `buildHomeViewModel`.

### 4.5 Lazy conditional de SpotifyMiniPlayer

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\src\components\ui\AppLayout.tsx`

Renderizar condicionalmente:
```tsx
{spotifyEnabled && <SpotifyMiniPlayer />}
```

### 4.6 Service Worker — precachear rutas adicionales

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\public\sw.js`

Línea ~40: Agregar al array de precache:
```js
"/rules",
"/champions",
"/settings",
"/history",
"/feedback"
```

### 4.7 Validación build-time de env vars

**Archivo:** `D:\Mi Home\Desktop\proyectos\mpoints-tracker\vite.config.js`

Agregar validación:
```js
const requiredVars = ["VITE_SPOTIFY_CLIENT_ID"];
requiredVars.forEach(key => {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing env var: ${key}`);
  }
});
```

---

## 5. VERIFICACIÓN FINAL

Ejecutar en orden:

```bash
# 1. Build
npm run build

# 2. Tests unitarios
npx vitest run

# 3. Lint
npm run lint

# 4. Verificar que no hay __MP_TEST_* en producción
rg "__MP_TEST_" dist/

# 5. Verificar chunks separados
Get-ChildItem dist/assets/*.js

# 6. Verificar firestore.rules no tiene isAuth() sola en users
rg "isAuth\(\)" firestore.rules
```

Si todo pasa, el audit de Rendimiento y Seguridad está completo. Reportá el resumen de cambios hechos.
