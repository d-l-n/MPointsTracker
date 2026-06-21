# MPOINTS TRACKER — README

> **v3.7.2** · React + Vite + Firebase PWA · Multi-device score tracker

---

## ¿Qué es?

PWA para registrar puntajes de juegos de mesa y cartas entre amigos. El catálogo visible incluye 23 juegos, funciona offline, sincroniza en la nube, soporta invitaciones/enlace de jugadores y es instalable en cualquier dispositivo.

**Deploy:** Cloudflare Pages  
**URL prod:** `mpoints-tracker.pages.dev`  
**Release actual:** `3.7.2`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 |
| Backend / Auth | Firebase 11 (Auth + Firestore) |
| Persistencia local | localStorage (`bgt_v6`) + IndexedDB (Firestore offline) |
| Estilos | CSS custom properties + Liquid Glass design |
| i18n | Sistema custom (`TRANSLATIONS` + `useT` hook) |
| Tests | Playwright (multi-device) + Vitest |
| Deploy | Cloudflare Pages (`wrangler`) |

---

## Herramientas de agente

- Este proyecto usa el flujo multi-agente descrito en [AGENTS.md](AGENTS.md) y el paquete operativo de [docs/agents/README.md](docs/agents/README.md).
- Las Google Cloud Skills de [`google/skills`](https://github.com/google/skills), ruta `skills/cloud`, están instaladas localmente en Codex para asistir tareas de Firebase, Google Cloud, Gemini, BigQuery, Cloud Run, Cloud SQL, GKE, AlloyDB, `gcloud` y Well-Architected Framework.
- Las skills son herramientas del entorno de desarrollo, no dependencias runtime de la PWA. Para que Codex las detecte después de instalarlas o actualizarlas, reiniciá Codex.

---

## Comandos

```bash
npm run dev        # Dev server en localhost:5173
npm run build      # Build en /dist
npm run preview    # Preview del build
npm run verify:local # Runner local end-to-end (cuando npm vuelva a estar usable)
npm run deploy     # Build + deploy a Cloudflare Pages
npm run test       # Tests Playwright (requiere dev server activo)
npm run test:unit  # Tests unitarios con Vitest (jsdom)
npm run test:logic # Suite lógica desktop
npm run test:layout # Suite responsive multi-device
npm run test:fast  # Logic + layout foldable closed
npm run lint       # ESLint
```

### Verificación directa sin `npm`

El flujo local recomendado en esta máquina es:

```powershell
node .\scripts\verify-local.mjs
```

Ese runner ejecuta:

- `typecheck`
- `build`
- `vitest`
- una suite Playwright browserless para contratos de código
- una suite Playwright dirigida contra Settings/Champions/switches de juegos levantando `vite preview` por su cuenta en `msedge`

En esta PC el runner usa `msedge` como navegador principal. Si Edge no puede abrirse y/o Playwright cae por una limitación local, el runner intenta una vez más con el Chromium empaquetado y, si igual no puede correr, lo reporta en `test-results/local-verify/summary.json` en vez de mezclarlo con un fallo funcional del código.

Si necesitás correr pasos sueltos con binarios directos de `node_modules`, seguí teniendo disponibles:

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switch-contract.spec.js
```

`node .\scripts\typecheck.mjs` usa `node_modules/typescript` si existe y, si no, cae a un toolchain temporal vía `corepack pnpm dlx` con cache local en `.corepack/`.

---

## Estado de migración

- La implementación runtime de `src/` ya quedó consolidada en `*.ts` y `*.tsx`, sin wrappers `*.js`/`*.jsx` productivos.

- Al modificar comportamiento productivo, tomá `*.ts` y `*.tsx` como fuente de verdad.

---

## Estructura del proyecto

```
src/
├── App.tsx                    # Fuente tipada del runtime principal: shell, navegación por URL, auth y offline
├── main.tsx                   # Fuente tipada del entry point: RouterProvider + registro SW
├── routes/
│   ├── routes.tsx             # Fuente tipada del browser router + loaders de entrada + ProtectedRoute
│   ├── routeLoaders.ts        # Prewarm/validación de rutas para shell, history, settings y game detail
├── index.css                  # Entrada de estilos por @layer
├── styles/
│   ├── tokens.css             # Design tokens, temas light/dark/oled y glass
│   ├── base.css               # Reset/base layer
│   ├── components.css         # Capa de componentes
│   └── utilities.css          # Utilidades y helpers visuales
│
├── components/
│   ├── auth/
│   │   ├── EmailAuthScreen.tsx     # Fuente tipada del entry auth: login/registro/guest
│   │   ├── LoginForm.tsx           # Fuente tipada del sign-in email/password con useFormStatus + useOptimistic
│   │   ├── ProtectedRoute.tsx      # Fuente tipada de la guardia de ruta para secciones privadas
│   │   ├── InviteLinkModal.tsx     # Fuente tipada del modal de invitaciones por link
│   │   ├── LinkedPlayerInput.tsx   # Fuente tipada de vinculación de jugadores por UID
│   │   ├── QRScanner.tsx           # Fuente tipada del escáner de QR para vinculación de usuarios
│   │   ├── UserQRCode.tsx          # Fuente tipada del QR del usuario logueado
│   │   ├── UserSearchModal.tsx     # Fuente tipada de búsqueda/vinculación de usuarios por nombre, mail o QR
│   │
│   ├── games/                 # Un componente por juego (NewMatch)
│   │   ├── UnoNewMatch.tsx         # Fuente tipada de UNO / No Mercy / Flip / DOS
│   │   ├── TrucoNewMatch.tsx       # Fuente tipada del flujo de Truco (equipos o individual)
│   │   ├── BurakoNewMatch.tsx      # Fuente tipada del flujo de Burako
│   │   ├── GeneralaNewMatch.tsx    # Fuente tipada de Generala y su planilla oficial
│   │   ├── BlackjackNewMatch.tsx   # Fuente tipada de Blackjack (banca, apuestas y neto)
│   │   ├── PokerNewMatch.tsx       # Fuente tipada de Póker (buy-in, pozo y stacks)
│   │   ├── ChanchoNewMatch.tsx     # Fuente tipada del flujo de Chancho (eliminación)
│   │   ├── ChinNewMatch.tsx        # Fuente tipada del flujo 1v1 de Chin
│   │   ├── EsquinadosNewMatch.tsx  # Fuente tipada del flujo de Esquinados
│   │   ├── AjedrezNewMatch.tsx     # Fuente tipada de Ajedrez (1v1, reloj y sesión)
│   │   ├── SushiDoNewMatch.tsx     # Fuente tipada de Sushi Do!
│   │   ├── PorcionNewMatch.tsx     # Fuente tipada del contador de porciones
│   │   ├── RachaPerdidaNewMatch.tsx # Fuente tipada del flujo de Racha Perdida
│   │   ├── CanastaNewMatch.tsx     # Fuente tipada del flujo de Canasta
│   │   ├── CustomNewMatch.tsx      # Fuente tipada del juego libre/configurable
│   │   ├── GenericNewMatch.tsx     # Fuente tipada del template genérico (Chinchón, Rummy, Monopoly, Life, Basta!)
│   │   ├── MercyEliminator.tsx     # Fuente tipada de la UI de eliminación UNO No Mercy
│   │
│   ├── home/
│   │   ├── HomeTab.tsx             # Fuente tipada de Home/Games: shell, filtros, secciones y composición de cards
│   │   ├── HomeActionCard.tsx      # Fuente tipada de la card compartida del catálogo/home
│   │   ├── HomeGameHero.tsx        # Fuente tipada del hero visual por familia + señales por juego
│   │   ├── homeModel.ts            # Fuente tipada del view model de Home: agrupación, búsqueda, recientes, destacados y dedupe visual
│   │
│   └── ui/                    # Componentes reutilizables
│       ├── AppLayout.tsx          # Fuente tipada del shell principal y la orquestación de vistas
│       ├── AppShell.tsx           # Fuente tipada del shell base con toast y scroll container
│       ├── AutocompleteInput.tsx   # Fuente tipada del input con sugerencias de nombres
│       ├── BlackjackCPU.tsx        # Fuente tipada del easter egg/modal Blackjack vs CPU
│       ├── CollapseSection.jsx     # Sección colapsable
│       ├── ConfirmModal.tsx        # Fuente tipada del modal de confirmación genérico
│       ├── EditMatchModal.tsx      # Fuente tipada de la edición de partidas pasadas
│       ├── GroupPicker.tsx         # Fuente tipada del selector de grupo de jugadores
│       ├── InstallBanner.tsx       # Fuente tipada del banner "Instalar app"
│       ├── OfflineBanner.tsx       # Fuente tipada del banner offline del shell/auth
│       ├── PlayerInput.tsx         # Fuente tipada del input/autocomplete de jugador
│       ├── ReloadButton.tsx        # Fuente tipada del control de reload/update del SW
│       ├── SaveGroupButton.tsx     # Fuente tipada del guardado rápido de grupos
│       ├── ShareResultCard.tsx     # Fuente tipada del share card y helpers de imagen/tema
│       ├── SplashScreen.tsx        # Fuente tipada de la pantalla de bienvenida (one-time)
│       ├── SyncDot.tsx             # Fuente tipada del indicador de sync con Firebase
│       ├── ThemeToggle.tsx        # Fuente tipada del toggle light/dark con long-press
│       ├── Toast.tsx               # Fuente tipada de notificaciones efímeras
│       ├── UserAvatar.tsx          # Fuente tipada del avatar con foto o inicial
│       ├── VersionTapper.tsx       # Fuente tipada del easter egg de versión/debug
│
├── context/
│   ├── AppContext.tsx          # Fuente tipada del contexto compartido de app
│
├── data/
│   ├── games.ts                # Fuente tipada del catálogo GAMES
│   ├── portionFoods.ts         # Fuente tipada del catálogo del contador de porciones
│   ├── rules.ts                # Fuente tipada de reglas/base copy para RulesPage
│   ├── scoreTables.ts          # Fuente tipada de tablas de puntuación para variantes de UNO
│   ├── sushiDo.ts              # Fuente tipada de constantes/helpers de Sushi Do!
│   ├── translations/
│       ├── es.ts               # Fuente tipada del locale Español
│       ├── en.ts               # Fuente tipada del locale English
│       ├── de.ts               # Fuente tipada del locale Deutsch
│       ├── zh.ts               # Fuente tipada del locale 中文
│       ├── ja.ts               # Fuente tipada del locale 日本語
│       ├── fr.ts               # Fuente tipada del locale Français
│   ├── translations.ts         # Fuente tipada del runtime i18n + parity helpers + defaults de reglas
│
├── hooks/
│   ├── useAuth.ts              # Firebase Auth (Google, email, guest, QR share)
│   ├── useDebugLog.ts          # Log interno para debug panel
│   ├── useDraft.ts             # Draft de partida en curso (localStorage)
│   ├── useGameSession.ts       # Selección de juego, rematch y session state
│   ├── useMatches.ts           # CRUD de partidas (local + cloud sync debounced)
│   ├── useNavigation.ts        # Estado de navegación por URL, back button e history subpages
│   ├── useNavVisibility.ts     # Estado de nav móvil y auto-hide por scroll
│   ├── useNavVisibility.js     # Estado de nav móvil y auto-hide por scroll
│   ├── useOnlineStatus.ts      # Estado online/offline para UI y fallback
│   ├── usePendingInvite.ts     # Resolución de invites desde URL + claim/dismiss
│   ├── useTheme.ts             # Tema light/dark/oled/system + persistencia
│   ├── useToast.ts             # Estado del toast global
│   ├── useWakeLock.ts          # Wake Lock de pantalla + persistencia
│
├── lib/
│   ├── confetti.ts             # Fuente tipada del burst visual al guardar partida
│   ├── firebase.ts             # Fuente tipada de init Firebase (Auth + Firestore con offline cache)
│   ├── groupStorage.ts         # Fuente tipada de helpers del último grupo usado por juego
│   ├── inviteService.ts        # Fuente tipada de invitaciones por URL/código + TTL
│   ├── publicData.ts           # Fuente tipada de datos públicos / perfiles compartidos
│   ├── stats.ts                # Fuente tipada de buildStats(), getAllPastPlayerNames(), fmtDate()
│   ├── storage.ts              # Fuente tipada de localStorage helpers + APP_VERSION + ADMIN_UID
│
├── pages/
│   ├── AboutPage.jsx           # Información/landing interna
│   ├── AdminPage.tsx           # Fuente tipada del panel de admin (solo ADMIN_UID)
│   ├── AppInfoPage.jsx         # Información de versión y app
│   ├── ChampsPage.tsx          # Fuente tipada del ranking global de campeones
│   ├── FeedbackPage.tsx        # Fuente tipada del formulario de feedback
│   ├── GameDetail.tsx          # Fuente tipada del detalle de juego: shell compartido + tabs New / History / Stats
│   ├── gameDetailRegistry.tsx  # Registro lazy/preload de componentes NewMatch por tipo de juego
│   ├── GlobalHistoryPage.tsx   # Fuente tipada del historial cross-game compartido
│   ├── HeadToHeadPage.tsx      # Fuente tipada del mano a mano integrado en campeones
│   ├── HistoryTab.jsx          # Historial filtrable por jugador
│   ├── PublicProfilePage.tsx   # Fuente tipada del perfil público de otro usuario
│   ├── RachaPerdidaStatsTab.tsx# Fuente tipada de stats específicos de Racha Perdida
│   ├── RulesPage.tsx           # Fuente tipada de reglas, búsqueda y expansión por juego
│   ├── SettingsPage.tsx        # Fuente tipada de ajustes: perfil, prefs, tema y avanzado
│   ├── StatsTab.tsx            # Fuente tipada de stats por jugador dentro de un juego
│
└── services/
    ├── authService.ts          # Fuente tipada de helpers de Firebase Auth
    ├── matchService.ts         # Fuente tipada de shareMatchWithPlayers() → Firestore shared_matches
    ├── userService.ts          # Fuente tipada de users/userdata/shared_matches
```

---

## Juegos visibles en catálogo (23)

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
- Solo `Reciente` usa rail horizontal; el catálogo normal no reutiliza un rail scrolleable.
- `homeModel.ts` evita duplicación visual: si un juego ya está promovido arriba, no vuelve a renderizarse en el catálogo inferior en la misma vista.
- Los covers del hero usan placeholder consistente y `loading="lazy"`; si la imagen falla, el hero vectorial sigue siendo el fallback visual.

### IDs internos ocultos del catálogo
`sushi`, `pizza`, `hamburguesa`, `pancho`, `empanadas`, `facturas`, `sanguchitos`, `cookies`, `otros_porciones`  
→ Se mantienen por compatibilidad/historial y usan `PorcionNewMatch`, pero no aparecen como juegos visibles en Home.

---

## Arquitectura de datos

### localStorage (`bgt_v6`)
```js
{
  uno: [ /* array de partidas */ ],
  truco: [ /* ... */ ],
  __theme: true,        // legado: tema persistido
  // ... resto de juego IDs
}
```

### Firestore
```
users/{uid}/
  └── data: { mismo objeto que localStorage }

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

Decisión vigente:

- Se evaluó `i18next` / `react-i18next` en mayo de 2026.
- La decisión actual es **mantener el sistema custom** por costo/beneficio y simplicidad del runtime.
- Ver [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md).

---

## Routing y Auth

```
createBrowserRouter
  ├─ /                 → App shell + loader de precalentamiento
  ├─ /login            → Entry explícito de autenticación
  ├─ /rules            → Reglas
  ├─ /champions        → Campeones
  ├─ /settings         → Ajustes + normalización de query params
  ├─ /history          → Historial + normalización de filtros
  ├─ /game/:gameId     → Juego activo + validación de gameId + preload del componente lazy
  └─ /admin            → ProtectedRoute → App shell
```

### Ciclo de acceso

```
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
- `src/hooks/useAuth.ts` restaura sesión, carga `userdata/{uid}`, migra legado si hace falta y absorbe `shared_matches`.
- `src/hooks/useMatches.ts` hace debounce de 1200ms tras cada cambio y llama `saveDataToCloud(uid, data)`.
- `src/hooks/useOnlineStatus.ts` alimenta el fallback visual offline del shell y de la pantalla de auth.
- `src/routes/routeLoaders.ts` precalienta `App` y el juego activo en entradas profundas para evitar fallbacks visibles en navegación inicial.

---

## Dispositivos soportados (Playwright)

| Proyecto | Viewport |
|----------|---------|
| `mobile-small` | Pixel 5 |
| `mobile-large` | iPhone 14 Pro |
| `tablet` | iPad Pro 11 |
| `foldable-open` | 768×1024 |
| `foldable-closed` | 360×740 |
| `desktop` | 1440×900 |
| `layout-legacy` | 1280×800 |
| `logic` | 1440×900 |

Tests en `./tests/` · Config en `playwright.config.js`

---

## Reglas de desarrollo (críticas)

```
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
--accent    /* color de acento global */
--gc        /* game color (se inyecta inline por juego activo) */
--r         /* border radius base */
--blur      /* backdrop-filter blur */
--glass-border  /* borde estilo liquid glass */
--nomercy   /* color especial UNO No Mercy / Blackjack */
```

---

## Capas de tema

- `bgt_theme_mode`: `light | dark | system`
- `bgt_theme_accent`: `default | monet`
- `bgt_spotify_enabled`: `"1"` / `"0"` para habilitar el mini reproductor Spotify
- `bgt_oled`: `"1"` cuando las superficies dark usan negros profundos

`useTheme.ts` separa modo base, acento y OLED. `Monet` en navegador puro usa tokens locales de fallback; la integración dinámica real queda bridge-ready mediante `DynamicThemeContract` y `data-theme-source="android-dynamic-color"`, sin fingir una API web inexistente.

En CSS:

- `html[data-theme]` controla superficies light/dark/oled
- `html[data-theme-accent="monet"]` reasigna roles semánticos `--accent-*`
- `html[data-theme-source="android-dynamic-color"]` permite que un bridge externo inyecte `--dynamic-*`

OLED y Monet conviven: OLED domina neutrales/superficies y Monet sigue tiñendo acentos, foco, pills y controles.

---

## Integración Spotify

La opción Spotify vive en Ajustes > Preferencias y viene desactivada por defecto. Al activarla, la app muestra un mini reproductor global con OAuth PKCE, Web Playback SDK y Spotify Web API. El reproductor muestra canción, artista, portada, dispositivo activo, progreso, cola desplegable, volumen en vivo, shuffle, repeat, anterior/siguiente, play/pause, sincronización de canción guardada, búsqueda de canciones, playlists guardadas, desconexión y transferencia al navegador cuando el SDK registra un `device_id`. Al scrollear, el reproductor se pliega en un botón flotante con la portada activa y se vuelve a desplegar al tocarlo.

Para mejorar la experiencia en dispositivos móviles y evitar obstrucciones, el reproductor cuenta con características dedicadas: al tocar fuera del reproductor expandido, este se cierra automáticamente; al hacer scroll en la página, también se colapsa. Además, la posición de la "bolita" colapsada se puede configurar (Centro, Izquierda, Derecha, Arrastrable). La preferencia de posición se guarda localmente en `bgt_spotify_position` y, si hay usuario autenticado, en la nube bajo la propiedad `spotifyPosition` de Firestore.

Para habilitar la conexión real hay que configurar `VITE_SPOTIFY_CLIENT_ID` con el Client ID de una app registrada en Spotify y agregar los redirect URI de la app:

- Producción: `https://tu-dominio/settings`
- Desarrollo local: `http://127.0.0.1:5173/settings`
- Si usás `localhost` en vez de `127.0.0.1`, agregá también `http://localhost:5173/settings`

Spotify exige cuenta Premium para reproducir desde integraciones web. La preferencia `bgt_spotify_enabled` se guarda en `localStorage` y, si hay usuario autenticado, también en `userdata/{uid}.spotifyEnabled` para restaurarla en otros dispositivos. Los tokens OAuth quedan solo en `localStorage` del dispositivo y se borran al desconectar Spotify, cerrar sesión o cuando Spotify rechaza el refresh del token. El callback OAuth valida `state`, consume el `code_verifier` una sola vez y limpia `code`, `state` y `error` de la URL conservando otros parámetros de la pantalla.

Scopes usados por el mini reproductor: `streaming`, `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `user-library-read`, `user-library-modify`, `playlist-read-private` y `playlist-read-collaborative`. Si una sesión fue autorizada antes de agregar biblioteca/playlists, el usuario debe desconectar y volver a conectar Spotify para conceder esos permisos.

---

## LocalStorage keys

| Key | Uso |
|-----|-----|
| `bgt_v6` | Datos principales (partidas + tema) |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | Tokens OAuth PKCE de Spotify locales |
| `bgt_spotify_code_verifier` | Verifier temporal del login Spotify |
| `bgt_spotify_oauth_state` | State temporal del login Spotify |
| `bgt_wakelock` | `"1"` si wake lock activo |
| `bgt_oled` | `"1"` si modo OLED activo |
| `bgt_splash_seen` | `"1"` si ya se mostró el splash |
| `bgt_lang` | Idioma guardado |
| `bgt_drafts` | Drafts de partida por juego (`{ [gameId]: draft }`) |

---

## Modelo UNO

La familia UNO (`uno`, `uno_no_mercy`, `uno_flip`, `uno_dos`) ya no carga sobrantes por perdedor. La ronda usa un único input agregado por tipo de carta y `SCORE_TABLES` calcula el total; ese total se acredita una sola vez al ganador de la ronda.

Los drafts de UNO ahora pueden persistir:

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` registra joins/leaves no destructivos con `effectiveRound`. Cuando un jugador sale de una partida empezada, la opción soportada por defecto es mantenerlo en el registro y sacarlo solo del roster activo futuro; el scoreboard conserva su score histórico y los botones de ganador usan solo jugadores activos.

---

## Admin

- `ADMIN_UID = "5UpEw50cQXcNnZQS4i7AaDQzY7J2"` (hardcodeado en `storage.ts`)
- Nav item "Admin" solo visible para ese UID
- `AdminPage.tsx` gestiona operaciones privilegiadas.

---

## PWA / Service Worker

- `public/sw.js` → `CacheFirst` para assets, `NetworkFirst` para requests de Firestore y `StaleWhileRevalidate` para documentos de reglas/offline
- `public/manifest.json` → instalable en Android/iOS/Desktop
- Icons en `public/icons/` (16, 32, 180, 192, 512px)
- Headers CORS en `public/_headers` (Cloudflare Pages)
- `public/_redirects` → redirects/fallbacks estáticos

---

## Agregar un nuevo juego

1. Crear `src/components/games/NuevoJuegoNewMatch.tsx`
2. Agregar entrada en `src/data/games.ts` → objeto `GAMES`
3. Agregar claves nuevas en `src/data/translations/*.ts` para todos los idiomas soportados
4. Agregar `getTagline()` mapping en `games.ts`
5. Agregar reglas en `src/data/rules.ts`
6. Importar el componente en `GameDetail.tsx` y conectarlo por `game.type`
7. Agregar al grupo correspondiente en `src/components/home/homeModel.ts`
