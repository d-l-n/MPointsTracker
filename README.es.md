# MPOINTS TRACKER

> **26.08.11** · PWA React + Vite + Firebase · Registro de puntajes multidispositivo para juegos de mesa y cartas

**Leer en:** [English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [中文](README.zh.md)

---

## Resumen

MPoints Tracker es una **aplicación web progresiva** para registrar puntajes durante juegos de mesa y cartas con amigos. Tiene un catálogo de **23 juegos visibles** (familia UNO, Truco, Chinchón, Rummy, Póker, Blackjack, Generala, Ajedrez, Canasta, Burako y más), funciona **offline**, **sincroniza en la nube**, soporta **vinculación de jugadores e invitaciones**, y se puede **instalar en cualquier dispositivo**.

**Deploy:** Cloudflare Pages
**URL de producción:** `mpoints-tracker.pages.dev`
**Release actual:** `26.08.11`

### Destacados

- 🎲 **23 juegos** con planillas, reglas y estadísticas por juego (familia UNO, Truco, Póker, Blackjack, Generala, Ajedrez, Sushi Do!, Canasta, Burako, Chancho, Chinchón, Rummy y más).
- 📴 **Offline-first**: persistencia local con `localStorage` (`bgt_v6`) + caché offline en IndexedDB, con sync en la nube debounced.
- 🔗 **Jugadores e invitaciones**: vinculá jugadores por QR/UID, compartí partidas, aceptá invitaciones.
- 🎨 **Tematización completa**: claro / oscuro / OLED, acento Material You (Monet) y un selector de **color de acento propio**.
- 🌍 **6 idiomas**: ES, EN, DE, FR, JA, ZH.
- 🏆 **Campeones**: rankings globales, mano a mano y perfiles públicos.
- 🎵 **Mini reproductor Spotify** (opcional): controlá la música mientras jugás.
- 📦 **PWA instalable** con caché por service worker.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend / Auth | Firebase 11 (Auth + Firestore) |
| Persistencia local | `localStorage` (`bgt_v6`) + IndexedDB (Firestore offline) |
| Estilos | CSS custom properties + diseño Liquid Glass |
| i18n | Sistema custom (`TRANSLATIONS` + hook `useT`) |
| Tests | Playwright (multi-device) + Vitest |
| Deploy | Cloudflare Pages (`wrangler`) |

---

## Inicio rápido

```bash
npm install        # instalar dependencias (o: pnpm install)
npm run dev        # dev server en localhost:5173
npm run build      # build de producción en /dist
npm run preview    # preview del build
npm run deploy     # build + deploy a Cloudflare Pages
```

### Tests

```bash
npm run test:unit  # tests unitarios con Vitest (jsdom)
npm run test       # Playwright E2E (requiere el dev server activo)
npm run test:logic # suite lógica desktop de Playwright
npm run test:layout# suite multi-viewport de Playwright (7 proyectos)
npm run test:fast  # logic + foldable-closed
npm run lint       # ESLint
```

### Verificación local sin `npm`

El flujo local recomendado en esta máquina es:

```powershell
node .\scripts\verify-local.mjs
```

Ese runner ejecuta, en orden:

- `typecheck`
- `build`
- `vitest`
- una suite Playwright **browserless** de contratos de código
- una suite Playwright dirigida contra Settings/Champions/switches de juegos, levantando `vite preview` por su cuenta (navegador principal `msedge`, con fallback al Chromium empaquetado; si ninguno puede correr lo reporta en `test-results/local-verify/summary.json` en vez de mezclarlo con un fallo funcional)

Si necesitás correr pasos sueltos con binarios directos:

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switches.spec.js
```

`node .\scripts\typecheck.mjs` usa `node_modules/typescript` si existe y, si no, cae a un toolchain temporal vía `corepack pnpm dlx` (cache local en `.corepack/`).

---

## Estructura del proyecto

### Arquitectura en un vistazo

```
entry (main.tsx)
  └─ routes (routes.tsx / routeLoaders.ts)   → browser router, guardas de entrada, prewarming
       └─ App.tsx                             → orquestador del shell: hooks, contexto, layout
            └─ AppLayout.tsx                  → chrome: header, nav inferior, cambio de secciones
                 ├─ HomeTab / GameDetail / Rules / Champs / Settings / Admin / History
                 └─ AppContext (context/AppContext.tsx) → estado compartido de la app
```

- **Routing** impulsado por URL (`createBrowserRouter`) con páginas lazy y loaders que precalientan deep links para evitar fallbacks visibles.
- **Estado** en hooks enfocados (`useTheme`, `useAuth`, `useMatches`, `useGameSession`, `useNavigation`, …) expuestos globalmente vía `AppContext`.
- **Datos** a través de `services/*` (helpers de Firestore) y `lib/*` (storage, stats, confetti, cliente Spotify).
- **Estilos** en CSS por capas (`tokens → base → components → utilities`) guiados por design tokens; **sin CSS-in-JS**.
- **i18n** es un runtime custom chico: cada string visible vive en `src/data/translations/*.ts` y toda clave debe existir en **los 6 idiomas**.

### Árbol de directorios

```
src/
├── App.tsx                    # Orquestador del shell: auth, tema, navegación, wiring de contexto
├── main.tsx                   # Entry point: RouterProvider + registro del service worker
├── routes/
│   ├── routes.tsx             # Browser router + guardas de entrada + páginas lazy
│   └── routeLoaders.ts        # Prewarm/validación de deep links para shell, history, settings, juegos
├── index.css                  # Entrada de estilos (CSS por capas)
├── styles/
│   ├── tokens.css             # Design tokens + temas light/dark/oled + modos de acento
│   ├── base.css               # Reset / capa base
│   ├── components.css         # Capa de componentes
│   └── utilities.css          # Utilidades y helpers visuales
│
├── components/
│   ├── auth/                  # Login, escáner QR, búsqueda de usuarios, invitaciones, jugadores vinculados
│   ├── games/                 # Un formulario NewMatch por juego + inputs de puntaje compartidos
│   ├── home/                  # HomeTab: catálogo, filtros, cards hero, homeModel (view model)
│   ├── settings/              # Secciones de ajustes (tema, efectos, idioma, grupos, cuenta)
│   ├── seo/SEO.tsx            # Meta tags por ruta
│   └── ui/                    # Reutilizables: AppShell, AppHeader, GroupPicker, Toast, ThemeToggle, …
│
├── context/
│   └── AppContext.tsx         # Contexto compartido (partidas, grupos, prefs de Spotify, …)
│
├── data/
│   ├── games.ts               # Catálogo GAMES (ids, nombres, colores, íconos, tags)
│   ├── rules.ts               # Copy de reglas para RulesPage
│   ├── scoreTables.ts         # Tablas de puntuación de la familia UNO
│   ├── sushiDo.ts             # Constantes/helpers de Sushi Do!
│   ├── portionFoods.ts        # Catálogo de comidas del contador de porciones
│   └── translations/          # 6 idiomas: es (default), en, de, fr, ja, zh
│
├── hooks/                     # useTheme, useAuth, useMatches, useGameSession,
│                              # useNavigation, useOnlineStatus, useWakeLock, useHaptic, …
├── lib/                       # storage, stats, confetti, firebase, inviteService, spotifyClient
├── pages/                     # GameDetail, HomeTab, Rules, Champs, History, Settings, Admin, …
├── services/                  # authService, userService, matchService (helpers de Firestore)
└── types.ts                   # Tipos TypeScript compartidos
```

> **Convenciones:** targets táctiles ≥ 40px, `100dvh` (nunca `100vh`), `data-testid` en elementos interactivos, todas las strings en `TRANSLATIONS`, memoización con `React.memo`/`useCallback` donde importe, sub-funciones declaradas antes que su componente padre.

---

## Catálogo de juegos (23 visibles)

### Familia UNO
| ID | Nombre | Condición de victoria |
|----|--------|-----------------------|
| `uno` | UNO | 500 pts |
| `uno_no_mercy` | UNO No Mercy | 1000 pts + Mercy Rule |
| `uno_flip` | UNO Flip | 500 pts (lado claro/oscuro) |
| `uno_dos` | DOS | 200 pts |

### Cartas
| ID | Nombre | Tipo |
|----|--------|------|
| `truco` | Truco | Equipos o individual, 15/30 pts |
| `chancho` | Chancho | Eliminación por letras |
| `esquinados` | Esquinados | Ganador por ronda |
| `chin` | Chin | 1v1 sin cartas |
| `chinchon` | Chinchón | Eliminación, límite 100 pts |
| `canasta` | Canasta | 5000 pts · Equipos o individual |
| `sushi_do` | Sushi Do! | 500 pts · 6 iguales por sabor |
| `rummy` | Rummy | 500 pts · Combinaciones |
| `burako` | Burako | 2000 pts · Individual o equipos |

### Mesa y tablero
| ID | Nombre | Condición |
|----|--------|-----------|
| `ajedrez` | Ajedrez | 1v1, ganador por partida |
| `monopoly` | Monopoly | Ganador por partida |
| `life` | Life | Ganador por partida |

### Casino y dados
| ID | Nombre | Tipo |
|----|--------|------|
| `poker` | Póker | Ganador por ronda |
| `blackjack` | Blackjack | 21 con CPU opcional |
| `generala` | Generala | Combinaciones de 5 dados |

### Casuales
| ID | Nombre | Tipo |
|----|--------|------|
| `racha_perdida` | Racha Perdida | Registro de racha rota |
| `portion_counter` | Contador de Porciones | Elegí comida + contador simple |
| `basta_dym` | Basta! | 3 cartas de temática · letras A-Z por ronda |
| `custom` | Juego libre | Score libre / configurable |

### Home / Games

- `HomeTab` compone un bloque superior editorial con `featured` + `recent`.
- Solo **Reciente** usa rail horizontal; el catálogo normal no reutiliza un rail scrolleable.
- `homeModel.ts` evita duplicación visual: si un juego ya está promovido arriba, no vuelve a renderizarse en el catálogo inferior en la misma vista.
- Los covers del hero usan placeholder consistente y `loading="lazy"`; si la imagen falla, el hero vectorial sigue siendo el fallback visual.

### IDs internos ocultos

`sushi`, `pizza`, `hamburguesa`, `pancho`, `empanadas`, `facturas`, `sanguchitos`, `cookies`, `otros_porciones` — se mantienen por compatibilidad/historial y usan `PorcionNewMatch`, pero no aparecen como juegos visibles en Home.

---

## Arquitectura de datos

### localStorage (`bgt_v6`)

```js
{
  uno: [ /* array de partidas */ ],
  truco: [ /* ... */ ],
  __theme: true,        // legado: tema persistido
  // ... resto de IDs de juegos
}
```

### Firestore

```
users/{uid}/
  └── data: { misma forma que localStorage }

users/{uid}/shared_matches/
  └── {matchId}: {
        ...matchData,
        _gameId, _sharedBy, _sharedByUid, _sharedAt
      }
```

### Estructura de una partida (ejemplo UNO)

```js
{
  id: "lm8k2abc",          // mkId() → timestamp36 + random
  date: 1713000000000,     // Date.now()
  players: [
    { name: "Ana", score: 520 },
    { name: "Beto", score: 310 },
    { name: "Carlos", score: 480 }
  ],
  winner: "Ana",
  rounds: 12,
  duration: 18,
  // campos específicos del juego...
}
```

---

## Sistema i18n

**Idiomas:** `es` (default), `en`, `de`, `zh`, `ja`, `fr`

```js
// En App se crea el traductor y se comparte por contexto
const t = useT(lang);
t("saveMatch");

// NUNCA usar t() dentro de TRANSLATIONS
// NUNCA strings hardcodeados en componentes
// Toda clave nueva debe existir en todos los idiomas soportados
```

Detección: `detectLang()` → localStorage → `navigator.language` → fallback `es`

Decisión vigente: se evaluó `i18next` / `react-i18next` en mayo de 2026. La decisión actual es **mantener el sistema custom** por costo/beneficio y simplicidad del runtime. Ver [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md).

---

## Routing y Auth

```text
createBrowserRouter
  ├─ /                 → App shell + loader de precalentamiento
  ├─ /login            → Entry explícito de autenticación
  ├─ /rules            → Reglas
  ├─ /champions        → Campeones
  ├─ /settings         → Ajustes + normalización de query params
  ├─ /history          → Historial + normalización de filtros
  ├─ /game/:gameId     → Juego activo + validación de gameId + preload lazy
  └─ /admin            → ProtectedRoute → App shell
```

### Ciclo de acceso

```text
/login
  ├─ authChecked=false → loading auth
  ├─ offline           → banner global + copy local sin promesa de sync
  ├─ Google OAuth
  ├─ Email/Password → LoginForm (useFormStatus + useOptimistic)
  └─ Modo invitado → sin sync cloud

/admin
  ├─ fbAuth.currentUser || bgt_last_uid → entra
  └─ sin sesión → redirect a /login
```

### Persistencia y sync

- `src/services/authService.ts` inicializa `setPersistence(fbAuth, indexedDBLocalPersistence)`.
- `src/hooks/useAuth.ts` restaura sesión, carga `userdata/{uid}`, migra legado y absorbe `shared_matches`.
- `src/hooks/useMatches.ts` hace debounce (1200ms) tras cada cambio y llama `saveDataToCloud(uid, data)`.
- `src/hooks/useOnlineStatus.ts` alimenta los fallbacks visuales offline.
- `src/routes/routeLoaders.ts` precalienta `App` y el juego activo en entradas profundas para evitar fallbacks visibles.

---

## Tematización

### Modos de color

- `bgt_theme_mode`: `light | dark | system`
- El tema activo se deriva: `system` sigue al SO, y `dark` + `oled` activan superficies OLED negro puro (`bgt_oled`).

### Modos de acento

El acento impulsa el **chrome** de la app (pill activa de la nav, vista de estadísticas, controles activos), mientras las **cards de juegos** y la **pantalla de detalle** conservan su color por juego.

- `bgt_theme_accent`: `default | monet | custom`
  - **Por defecto** — el acento teal (`#006d77`).
  - **Monet** — colores Material You cuando están disponibles en Android (bridge `android-dynamic-color`) con paleta de fallback local.
  - **Color propio** — cualquier hex elegido por el usuario (swatches + selector libre en *Ajustes → Preferencias → Tema de la app*).
- `bgt_theme_custom_accent`: el hex elegido por el usuario (`#rrggbb`).
- El hex custom se expone inline como `--theme-custom-accent` / `--theme-custom-on-accent` (on-accent derivado por luminancia), y `html[data-theme-accent="custom"]` reconstruye todos los roles de acento vía `color-mix` (contenedores, outlines, pill de nav, controles) para light, dark y OLED.
- Con usuario autenticado, `themeAccent` / `themeCustomAccent` se sincronizan a `userdata/{uid}` (mismo patrón que `spotifyPosition`) y se restauran en otros dispositivos.

`useTheme.ts` separa modo base, acento y OLED. Monet usa un `DynamicThemeContract` + `data-theme-source="android-dynamic-color"` sin fingir una API web inexistente; el color propio es un modo independiente que no compite con el bridge.

En CSS:

- `html[data-theme]` controla las superficies light/dark/oled
- `html[data-theme-accent="monet"]` reasigna `--accent-*` a roles Material
- `html[data-theme-accent="custom"]` reasigna `--accent-*` desde el hex del usuario
- `html[data-theme-source="android-dynamic-color"]` permite que un bridge externo inyecte `--dynamic-*`

OLED y Monet/Custom conviven: OLED domina neutrales/superficies y el acento sigue tiñendo acentos, foco, pills y controles.

---

## Mini reproductor Spotify

La opción Spotify vive en *Ajustes → Preferencias* y viene **desactivada por defecto**. Al activarla, la app muestra un mini reproductor global con OAuth PKCE, Web Playback SDK y Spotify Web API: canción, artista, portada, dispositivo activo, progreso, cola desplegable, volumen en vivo, shuffle, repeat, anterior/siguiente, play/pause, sync de canción guardada, búsqueda de canciones, playlists guardadas, desconexión y transferencia al navegador cuando el SDK registra un `device_id`. Al scrollear, el reproductor se pliega en un botón flotante con la portada activa y se vuelve a desplegar al tocarlo.

En móvil: al tocar fuera del reproductor expandido se cierra; al hacer scroll también se colapsa. La posición de la "bolita" colapsada es configurable (Centro, Izquierda, Derecha, Arrastrable) y se guarda en `bgt_spotify_position` (nube: `spotifyPosition`).

Para habilitar la conexión real hay que configurar `VITE_SPOTIFY_CLIENT_ID` y agregar los redirect URIs:

- Producción: `https://tu-dominio/settings`
- Desarrollo local: `http://127.0.0.1:5173/settings` (y `http://localhost:5173/settings` si usás `localhost`)

Spotify exige cuenta **Premium** para integraciones web. Los tokens quedan en `localStorage` y se borran al desconectar, cerrar sesión o cuando Spotify rechaza el refresh. El callback OAuth valida `state`, consume el `code_verifier` una sola vez y limpia `code`/`state`/`error` de la URL.

Scopes: `streaming`, `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `user-library-read`, `user-library-modify`, `playlist-read-private`, `playlist-read-collaborative`. Las sesiones autorizadas antes de agregar biblioteca/playlists deben reconectarse para conceder esos scopes.

---

## Claves de localStorage

| Key | Uso |
|-----|-----|
| `bgt_v6` | Datos principales (partidas + tema) |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` / `"custom"` |
| `bgt_theme_custom_accent` | Hex del acento custom (`#rrggbb`) |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | Tokens OAuth PKCE de Spotify locales |
| `bgt_spotify_code_verifier` | Verifier temporal del login Spotify |
| `bgt_spotify_oauth_state` | State temporal del login Spotify |
| `bgt_wakelock` | `"1"` si wake lock activo |
| `bgt_oled` | `"1"` si superficies OLED activas |
| `bgt_splash_seen` | `"1"` si ya se mostró el splash |
| `bgt_lang` | Idioma guardado |
| `bgt_drafts` | Drafts de partida por juego (`{ [gameId]: draft }`) |
| `bgt_haptic` | `"0"` si feedback háptico desactivado |
| `bgt_reduce_effects` | `"1"` si efectos reducidos |
| `bgt_last_uid` | Último UID con sesión (hint de sesión) |
| `bgt_player_groups` | Grupos de jugadores guardados |
| `bgt_last_group_v` | Último grupo usado por juego |
| `bgt_nav_order` | Orden de la nav inferior |
| `bgt_onboarding_seen` | `"1"` si se completó el onboarding |
| `bgt_guest_mode` / `bgt_guest_name` | Modo invitado / nombre del invitado |
| `bgt_install_dismissed` / `_later` | Dismiss del banner de instalación |

### Backup e historial

*Ajustes → Preferencias → Avanzado* permite exportar un backup JSON completo de partidas e importarlo en otro dispositivo (la importación reemplaza los datos locales de partidas con las claves válidas del archivo y usa el flujo normal de persistencia/sync). El Historial también exporta el resultado filtrado actual (jugador, juego, fecha) como JSON.

---

## PWA / Service Worker

- `public/sw.js`: `CacheFirst` para assets, `NetworkFirst` para requests de Firestore, `StaleWhileRevalidate` para documentos de reglas/offline.
- `public/manifest.webmanifest`: instalable en Android/iOS/Desktop.
- Íconos en `public/icons/` (16, 32, 180, 192, 512px).
- Headers de seguridad/CORS en `public/_headers` (Cloudflare Pages) y redirects en `public/_redirects`.
- Se configura una Content-Security-Policy estricta para la app desplegada (incluye dominios WebSocket de Spotify).

---

## Reglas de desarrollo (críticas)

```text
✅ SIEMPRE 100dvh (nunca 100vh)
✅ Targets touch mínimo 40px
✅ Archivos completos (nunca diffs)
✅ Sub-funciones declaradas ANTES del componente padre
✅ React.memo / useMemo / useCallback donde corresponda
✅ data-testid en elementos interactivos
✅ Todas las strings en TRANSLATIONS (todos los idiomas soportados)
❌ NO strings hardcodeadas
❌ NO t() dentro de TRANSLATIONS
❌ NO variables globales privadas entre módulos
❌ NO circular dependencies
❌ NO inventar estructuras Firestore sin evidencia
```

---

## Variables CSS clave

```css
--bg        /* fondo principal */
--bg2       /* fondo secundario (cards, modales) */
--tx        /* texto principal */
--tx2       /* texto secundario */
--accent    /* acento global */
--gc        /* color de juego (se inyecta inline por juego activo) */
--r         /* radio base */
--blur      /* backdrop-filter blur */
--glass-border  /* borde estilo liquid glass */
--nomercy   /* color especial UNO No Mercy / Blackjack */
```

---

## Modelo de datos UNO

La familia UNO (`uno`, `uno_no_mercy`, `uno_flip`, `uno_dos`) ya no carga sobrantes por perdedor. Cada ronda usa un único input agregado por tipo de carta y `SCORE_TABLES` calcula el total; ese total se acredita una sola vez al ganador de la ronda.

Los drafts de UNO pueden persistir:

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` registra joins/leaves no destructivos con `effectiveRound`. Cuando un jugador sale de una partida empezada, la opción soportada por defecto es mantenerlo en el registro y sacarlo solo del roster activo futuro; el scoreboard conserva su score histórico y los botones de ganador usan solo jugadores activos.

---

## Admin

- Acceso admin por Firebase custom claims `{ admin: true }` (verificado en `useAuth.ts` vía `token.claims.admin`).
- Setear el claim desde un entorno Firebase Admin de confianza y forzar refresh del ID token.
- El nav item "Admin" solo es visible cuando el claim es `true`.
- `AdminPage.tsx` gestiona operaciones privilegiadas.

---

## Agregar un nuevo juego

1. Crear `src/components/games/NuevoJuegoNewMatch.tsx`
2. Agregar entrada en `src/data/games.ts` → objeto `GAMES`
3. Agregar claves nuevas en `src/data/translations/*.ts` para todos los idiomas soportados
4. Agregar mapping de `getTagline()` en `games.ts`
5. Agregar reglas en `src/data/rules.ts`
6. Importar el componente en `GameDetail.tsx` y conectarlo por `game.type`
7. Agregar al grupo correspondiente en `src/components/home/homeModel.ts`

---

## Dispositivos soportados (Playwright)

| Proyecto | Viewport |
|----------|---------|
| `mobile-small` | 375×667 |
| `mobile-large` | 430×932 |
| `tablet` | 768×1024 |
| `foldable-open` | 717×512 |
| `foldable-closed` | 412×914 |
| `desktop` | 1280×800 |
| `layout-legacy` | 1280×800 |
| `logic` | 1280×800 |

Tests en `./tests/` · Config en `playwright.config.js`
