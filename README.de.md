# MPOINTS TRACKER

> **26.08.06** · React + Vite + Firebase PWA · Geräteübergreifender Punkte-Tracker für Brett- und Kartenspiele

**Lesen in:** [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [中文](README.zh.md)

---

## Überblick

MPoints Tracker ist eine **Progressive Web App** zum Erfassen von Punkten bei Brett- und Kartenspielen mit Freunden. Der Katalog umfasst **23 sichtbare Spiele** (UNO-Familie, Truco, Chinchón, Rummy, Poker, Blackjack, Generala, Schach, Canasta, Burako u. v. m.), funktioniert **offline**, **synchronisiert in die Cloud**, unterstützt **Spieler-Verknüpfungen und Einladungen** und kann auf **jedem Gerät installiert** werden.

**Deploy:** Cloudflare Pages
**Produktions-URL:** `mpoints-tracker.pages.dev`
**Aktuelle Version:** `26.08.06`

### Highlights

- 🎲 **23 Spiele** mit spielspezifischen Punktebrettern, Regeln und Statistiken (UNO-Familie, Truco, Poker, Blackjack, Generala, Schach, Sushi Do!, Canasta, Burako, Chancho, Chinchón, Rummy u. v. m.).
- 📴 **Offline-first**: lokale Speicherung über `localStorage` (`bgt_v6`) + IndexedDB-Offline-Cache, mit verzögertem Cloud-Sync.
- 🔗 **Spieler & Einladungen**: Spieler per QR/UID verknüpfen, Spiele teilen, Einladungen annehmen.
- 🎨 **Vollständige Gestaltung**: Hell / Dunkel / OLED, Material-You-Akzent (Monet) und ein Auswahlfeld für eine **eigene Akzentfarbe**.
- 🌍 **6 Sprachen**: ES, EN, DE, FR, JA, ZH.
- 🏆 **Champions**: globale Ranglisten, Direktvergleiche und öffentliche Profile.
- 🎵 **Spotify-Miniplayer** (optional): Musik steuern, während du spielst.
- 📦 **Installierbare PWA** mit Service-Worker-Caching.

---

## Tech-Stack

| Ebene | Technologie |
|-------|------------|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend / Auth | Firebase 11 (Auth + Firestore) |
| Lokale Speicherung | `localStorage` (`bgt_v6`) + IndexedDB (Firestore offline) |
| Styling | CSS-Custom-Properties + Liquid-Glass-Design |
| i18n | Eigenes System (`TRANSLATIONS` + `useT`-Hook) |
| Tests | Playwright (multi-device) + Vitest |
| Deploy | Cloudflare Pages (`wrangler`) |

---

## Schnellstart

```bash
npm install        # Abhängigkeiten installieren (oder: pnpm install)
npm run dev        # Dev-Server auf localhost:5173
npm run build      # Produktions-Build in /dist
npm run preview    # Build-Vorschau
npm run deploy     # Build + Deploy zu Cloudflare Pages
```

### Tests

```bash
npm run test:unit  # Unit-Tests mit Vitest (jsdom)
npm run test       # Playwright E2E (erfordert laufenden Dev-Server)
npm run test:logic # Playwright-Desktop-Logic-Suite
npm run test:layout# Playwright-Suite für mehrere Viewports (7 Projekte)
npm run test:fast  # logic + foldable-closed
npm run lint       # ESLint
```

### Lokale Verifikation ohne `npm`

Der empfohlene lokale Ablauf auf diesem Rechner:

```powershell
node .\scripts\verify-local.mjs
```

Dieser Runner führt der Reihe nach aus:

- `typecheck`
- `build`
- `vitest`
- eine Playwright-**Browserless**-Vertragssuite
- eine Playwright-Suite für Settings/Champions/Spiel-Switches, die `vite preview` selbst startet (Hauptbrowser `msedge`, Fallback zum gebündelten Chromium; wenn keiner läuft, wird es in `test-results/local-verify/summary.json` gemeldet, statt als funktionaler Fehler zu gelten)

Einzelschritte mit direkten Binaries:

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switches.spec.js
```

`node .\scripts\typecheck.mjs` verwendet `node_modules/typescript`, falls vorhanden, und fällt sonst auf ein temporäres Toolchain via `corepack pnpm dlx` zurück (lokaler Cache in `.corepack/`).

---

## Projektstruktur

### Architektur auf einen Blick

```
entry (main.tsx)
  └─ routes (routes.tsx / routeLoaders.ts)   → Browser-Router, Einstiegs-Guards, Prewarming
       └─ App.tsx                             → Shell-Orchestrierung: Hooks, Kontext, Layout
            └─ AppLayout.tsx                  → Chrome: Header, untere Navigation, Sektionswechsel
                 ├─ HomeTab / GameDetail / Rules / Champs / Settings / Admin / History
                 └─ AppContext (context/AppContext.tsx) → geteilter App-State
```

- **Routing** ist URL-getrieben (`createBrowserRouter`) mit Lazy-Pages und Loadern, die Deep Links vorwärmen, um sichtbare Fallbacks zu vermeiden.
- **State** liegt in fokussierten Hooks (`useTheme`, `useAuth`, `useMatches`, `useGameSession`, `useNavigation`, …) und wird global über `AppContext` bereitgestellt.
- **Daten** fließen über `services/*` (Firestore-Helfer) und `lib/*` (Storage, Stats, Konfetti, Spotify-Client).
- **Styling** ist geschichtetes CSS (`tokens → base → components → utilities`), gesteuert durch Design-Tokens; **kein CSS-in-JS**.
- **i18n** ist ein kleines Custom-Runtime: Jeder sichtbare String lebt in `src/data/translations/*.ts`, und jeder Key muss in **allen 6 Sprachen** existieren.

### Verzeichnisbaum

```
src/
├── App.tsx                    # Shell-Orchestrierung: Auth, Theme, Navigation, Kontext-Verdrahtung
├── main.tsx                   # Einstiegspunkt: RouterProvider + Service-Worker-Registrierung
├── routes/
│   ├── routes.tsx             # Browser-Router + Einstiegs-Guards + Lazy-Pages
│   └── routeLoaders.ts        # Deep-Link-Vorwärmung/-Validierung für Shell, History, Settings, Spiele
├── index.css                  # Style-Einstieg (geschichtetes CSS)
├── styles/
│   ├── tokens.css             # Design-Tokens + Light/Dark/OLED-Themes + Akzentmodi
│   ├── base.css               # Reset / Basis-Layer
│   ├── components.css         # Komponenten-Layer
│   └── utilities.css          # Utilities und visuelle Helfer
│
├── components/
│   ├── auth/                  # Login, QR-Scanner, Benutzersuche, Einladungslinks, verknüpfte Spieler
│   ├── games/                 # Ein NewMatch-Formular pro Spiel + geteilte Punkteingaben
│   ├── home/                  # HomeTab: Katalog, Filter, Hero-Karten, homeModel (View Model)
│   ├── settings/              # Settings-Sektionen (Theme, Effekte, Sprache, Gruppen, Konto)
│   ├── seo/SEO.tsx            # Meta-Tags pro Route
│   └── ui/                    # Wiederverwendbar: AppShell, AppHeader, GroupPicker, Toast, ThemeToggle, …
│
├── context/
│   └── AppContext.tsx         # Geteilter App-Kontext (Spiele, Gruppen, Spotify-Präferenzen, …)
│
├── data/
│   ├── games.ts               # GAMES-Katalog (IDs, Namen, Farben, Icons, Tags)
│   ├── rules.ts               # Regeltexte für RulesPage
│   ├── scoreTables.ts         # Punktetabellen der UNO-Familie
│   ├── sushiDo.ts             # Sushi-Do!-Konstanten/Helfer
│   ├── portionFoods.ts        # Lebensmittelkatalog des Portionszählers
│   └── translations/          # 6 Sprachen: es (Standard), en, de, fr, ja, zh
│
├── hooks/                     # useTheme, useAuth, useMatches, useGameSession,
│                              # useNavigation, useOnlineStatus, useWakeLock, useHaptic, …
├── lib/                       # storage, stats, confetti, firebase, inviteService, spotifyClient
├── pages/                     # GameDetail, HomeTab, Rules, Champs, History, Settings, Admin, …
├── services/                  # authService, userService, matchService (Firestore-Helfer)
└── types.ts                   # Geteilte TypeScript-Typen
```

> **Konventionen:** Touch-Targets ≥ 40px, `100dvh` (niemals `100vh`), `data-testid` auf interaktiven Elementen, alle Strings in `TRANSLATIONS`, Memoization mit `React.memo`/`useCallback`, Sub-Funktionen vor ihrem Elternkomponenten deklariert.

---

## Spielkatalog (23 sichtbare Spiele)

### UNO-Familie
| ID | Name | Siegbedingung |
|----|------|---------------|
| `uno` | UNO | 500 Pkt. |
| `uno_no_mercy` | UNO No Mercy | 1000 Pkt. + Mercy Rule |
| `uno_flip` | UNO Flip | 500 Pkt. (helle/dunkle Seite) |
| `uno_dos` | DOS | 200 Pkt. |

### Kartenspiele
| ID | Name | Typ |
|----|------|-----|
| `truco` | Truco | Teams oder einzeln, 15/30 Pkt. |
| `chancho` | Chancho | Eliminierung durch Buchstaben |
| `esquinados` | Esquinados | Rundensieger |
| `chin` | Chin | 1v1 ohne Karten |
| `chinchon` | Chinchón | Eliminierung, 100-Pkt.-Limit |
| `canasta` | Canasta | 5000 Pkt. · Teams oder einzeln |
| `sushi_do` | Sushi Do! | 500 Pkt. · 6 gleiche pro Geschmack |
| `rummy` | Rummy | 500 Pkt. · Kombinationen |
| `burako` | Burako | 2000 Pkt. · Einzeln oder Teams |

### Tisch & Brett
| ID | Name | Siegbedingung |
|----|------|---------------|
| `ajedrez` | Schach | 1v1, Partie-Sieger |
| `monopoly` | Monopoly | Partie-Sieger |
| `life` | Life | Partie-Sieger |

### Casino & Würfel
| ID | Name | Typ |
|----|------|-----|
| `poker` | Poker | Rundensieger |
| `blackjack` | Blackjack | 21 mit optionaler CPU |
| `generala` | Generala | 5-Würfel-Kombinationen |

### Freizeit
| ID | Name | Typ |
|----|------|-----|
| `racha_perdida` | Verlorene Serie | Tracker für gebrochene Serien |
| `portion_counter` | Portionszähler | Essen wählen + einfacher Zähler |
| `basta_dym` | Basta! | 3 Themenkarten · A-Z Buchstaben pro Runde |
| `custom` | Freies Spiel | Freie / konfigurierbare Punkte |

### Home / Games

- `HomeTab` komponiert einen oberen redaktionellen Block mit `featured` + `recent`.
- Nur **Recent** nutzt eine horizontale Leiste; der reguläre Katalog verwendet keine scrollbare Leiste.
- `homeModel.ts` vermeidet visuelle Duplikate: Ein oben bereits hervorgehobenes Spiel wird im unteren Katalog derselben Ansicht nicht erneut gerendert.
- Hero-Cover verwenden einen konsistenten Platzhalter und `loading="lazy"`; schlägt das Bild fehl, bleibt der Vektor-Hero als Fallback.

### Interne versteckte IDs

`sushi`, `pizza`, `hamburguesa`, `pancho`, `empanadas`, `facturas`, `sanguchitos`, `cookies`, `otros_porciones` — aus Kompatibilität/Historie beibehalten und verwenden `PorcionNewMatch`, erscheinen aber nicht als sichtbare Spiele in Home.

---

## Datenarchitektur

### localStorage (`bgt_v6`)

```js
{
  uno: [ /* Partien-Array */ ],
  truco: [ /* ... */ ],
  __theme: true,        // Legacy: gespeichertes Theme
  // ... restliche Spiel-IDs
}
```

### Firestore

```
users/{uid}/
  └── data: { gleiche Form wie localStorage }

users/{uid}/shared_matches/
  └── {matchId}: {
        ...matchData,
        _gameId, _sharedBy, _sharedByUid, _sharedAt
      }
```

### Partie-Struktur (UNO-Beispiel)

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
  // spielspezifische Felder...
}
```

---

## Internationalisierung (i18n)

**Sprachen:** `es` (Standard), `en`, `de`, `zh`, `ja`, `fr`

```js
// In App wird der Übersetzer erstellt und über den Kontext geteilt
const t = useT(lang);
t("saveMatch");

// NIE t() innerhalb von TRANSLATIONS verwenden
// NIE Strings in Komponenten hartkodieren
// Jeder neue Key muss in allen unterstützten Sprachen existieren
```

Erkennung: `detectLang()` → localStorage → `navigator.language` → Fallback `es`

Aktuelle Entscheidung: `i18next` / `react-i18next` wurden im Mai 2026 evaluiert. Die Entscheidung ist, **das eigene System zu behalten** (Kosten/Nutzen und Runtime-Einfachheit). Siehe [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md).

---

## Routing & Auth

```text
createBrowserRouter
  ├─ /                 → App-Shell + Prewarming-Loader
  ├─ /login            → Expliziter Auth-Einstieg
  ├─ /rules            → Regeln
  ├─ /champions        → Champions
  ├─ /settings         → Einstellungen + Query-Param-Normalisierung
  ├─ /history          → Verlauf + Filter-Normalisierung
  ├─ /game/:gameId     → Aktives Spiel + gameId-Validierung + Lazy-Preload
  └─ /admin            → ProtectedRoute → App-Shell
```

### Zugriffsablauf

```text
/login
  ├─ authChecked=false → Auth lädt
  ├─ offline           → globaler Banner + lokaler Modus (kein Sync-Versprechen)
  ├─ Google OAuth
  ├─ E-Mail/Passwort → LoginForm (useFormStatus + useOptimistic)
  └─ Gastmodus → kein Cloud-Sync

/admin
  ├─ fbAuth.currentUser || bgt_last_uid → Zugriff
  └─ keine Sitzung → Redirect zu /login
```

### Persistenz & Sync

- `src/services/authService.ts` initialisiert `setPersistence(fbAuth, indexedDBLocalPersistence)`.
- `src/hooks/useAuth.ts` stellt die Sitzung wieder her, lädt `userdata/{uid}`, migriert Legacy-Daten und übernimmt `shared_matches`.
- `src/hooks/useMatches.ts` entprellt (1200 ms) jede Änderung und ruft `saveDataToCloud(uid, data)` auf.
- `src/hooks/useOnlineStatus.ts` speist die Offline-Fallback-UI.
- `src/routes/routeLoaders.ts` wärmt `App` und das aktive Spiel bei tiefen Einstiegen vor, um sichtbare Fallbacks zu vermeiden.

---

## Theming

### Farbmodi

- `bgt_theme_mode`: `light | dark | system`
- Das aktive Theme wird abgeleitet: `system` folgt dem OS, und `dark` + `oled` aktivieren reine Schwarz-OLED-Flächen (`bgt_oled`).

### Akzentmodi

Der Akzent steuert das **Chrome** der App (aktive Bottom-Nav-Pill, Statistik-Ansicht, aktive Steuerelemente), während **Spielkarten** und der **Spiel-Detailbildschirm** ihre spielspezifische Farbe behalten.

- `bgt_theme_accent`: `default | monet | custom`
  - **Standard** — der Teal-Akzent (`#006d77`).
  - **Monet** — Material-You-Farben, wenn unter Android verfügbar (Bridge `android-dynamic-color`), mit lokaler Fallback-Palette.
  - **Eigene Farbe** — ein beliebiges Hex, das der Benutzer wählt (Swatches + freie Farbwahl unter *Einstellungen → Einstellungen → App-Design*).
- `bgt_theme_custom_accent`: das vom Benutzer gewählte Hex (`#rrggbb`).
- Das Custom-Hex wird inline als `--theme-custom-accent` / `--theme-custom-on-accent` bereitgestellt (on-accent per Luminanz abgeleitet), und `html[data-theme-accent="custom"]` baut alle Akzentrollen per `color-mix` neu auf (Container, Outlines, Nav-Pill, Steuerelemente) für Light, Dark und OLED.
- Mit authentifiziertem Benutzer werden `themeAccent` / `themeCustomAccent` in `userdata/{uid}` synchronisiert (gleiches Muster wie `spotifyPosition`) und auf anderen Geräten wiederhergestellt.

`useTheme.ts` trennt Basismodus, Akzent und OLED. Monet nutzt einen `DynamicThemeContract` + `data-theme-source="android-dynamic-color"`, ohne eine nicht existierende Web-API vorzutäuschen; die eigene Farbe ist ein unabhängiger Modus, der nicht mit der Bridge konkurriert.

In CSS:

- `html[data-theme]` steuert Light/Dark/OLED-Flächen
- `html[data-theme-accent="monet"]` mappt `--accent-*` auf Material-Rollen
- `html[data-theme-accent="custom"]` mappt `--accent-*` vom Benutzer-Hex
- `html[data-theme-source="android-dynamic-color"]` lässt eine externe Bridge `--dynamic-*` injizieren

OLED und Monet/Custom koexistieren: OLED dominiert Neutrale/Flächen, der Akzent färbt weiterhin Akzente, Fokus, Pills und Steuerelemente.

---

## Spotify-Miniplayer

Die Spotify-Option liegt unter *Einstellungen → Einstellungen* und ist **standardmäßig ausgeschaltet**. Nach dem Aktivieren zeigt die App einen globalen Miniplayer mit OAuth PKCE, Web-Playback-SDK und Spotify-Web-API: aktueller Song, Künstler, Cover, aktives Gerät, Fortschritt, aufklappbare Warteschlange, Live-Lautstärke, Shuffle, Repeat, Zurück/Vor, Play/Pause, Synchronisierung gespeicherter Songs, Songs-Suche, gespeicherte Playlists, Trennen und Übertragen an den Browser, wenn das SDK eine `device_id` registriert. Beim Scrollen kollabiert der Player zu einem schwebenden Button mit dem aktiven Cover und öffnet sich beim Antippen.

Mobil: Tippen außerhalb des erweiterten Players schließt ihn; Scrollen kollabiert ihn ebenfalls. Die Position der kollabierten „Blase" ist konfigurierbar (Mitte, Links, Rechts, Ziehbar) und wird in `bgt_spotify_position` gespeichert (Cloud: `spotifyPosition`).

Für die echte Verbindung müssen `VITE_SPOTIFY_CLIENT_ID` und die Redirect-URIs konfiguriert werden:

- Produktion: `https://deine-domain/settings`
- Lokale Entwicklung: `http://127.0.0.1:5173/settings` (und `http://localhost:5173/settings`, falls `localhost` verwendet wird)

Spotify verlangt ein **Premium**-Konto für Web-Integrationen. Tokens bleiben in `localStorage` und werden bei Trennung, Abmeldung oder abgelehntem Refresh entfernt. Der OAuth-Callback validiert `state`, verbraucht den `code_verifier` einmal und entfernt `code`/`state`/`error` aus der URL.

Scopes: `streaming`, `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `user-library-read`, `user-library-modify`, `playlist-read-private`, `playlist-read-collaborative`. Vor dem Hinzufügen von Bibliothek/Playlists autorisierte Sitzungen müssen sich neu verbinden, um diese Scopes zu erhalten.

---

## localStorage-Keys

| Key | Verwendung |
|-----|------------|
| `bgt_v6` | Hauptdaten (Partien + Theme) |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` / `"custom"` |
| `bgt_theme_custom_accent` | Custom-Akzent-Hex (`#rrggbb`) |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | Lokale Spotify-OAuth-PKCE-Tokens |
| `bgt_spotify_code_verifier` | Temporärer OAuth-Login-Verifier |
| `bgt_spotify_oauth_state` | Temporärer OAuth-Login-State |
| `bgt_wakelock` | `"1"`, wenn Screen-Wake-Lock aktiv |
| `bgt_oled` | `"1"`, wenn OLED-Flächen aktiv |
| `bgt_splash_seen` | `"1"`, sobald der Splash gezeigt wurde |
| `bgt_lang` | Gespeicherte Sprache |
| `bgt_drafts` | Laufende Entwürfe pro Spiel (`{ [gameId]: draft }`) |
| `bgt_haptic` | `"0"`, wenn haptisches Feedback deaktiviert |
| `bgt_reduce_effects` | `"1"`, wenn Effekte reduziert |
| `bgt_last_uid` | Letzte UID mit Sitzung (Sitzungshinweis) |
| `bgt_player_groups` | Gespeicherte Spielergruppen |
| `bgt_last_group_v` | Zuletzt verwendete Gruppe pro Spiel |
| `bgt_nav_order` | Reihenfolge der unteren Navigation |
| `bgt_onboarding_seen` | `"1"`, sobald das Onboarding abgeschlossen ist |
| `bgt_guest_mode` / `bgt_guest_name` | Gastmodus / Gastname |
| `bgt_install_dismissed` / `_later` | Install-Banner-Ablehnung |

### Backup & Verlauf

*Einstellungen → Einstellungen → Erweitert* erlaubt es, ein vollständiges JSON-Backup der Partien zu exportieren und auf einem anderen Gerät zu importieren (der Import ersetzt die lokalen Partiedaten mit den gültigen Spielkeys und nutzt dann den normalen Persistenz-/Sync-Fluss). Die Verlaufsansicht exportiert das aktuell gefilterte Ergebnis (Spieler, Spiel, Datum) ebenfalls als JSON.

---

## PWA / Service Worker

- `public/sw.js`: `CacheFirst` für Assets, `NetworkFirst` für Firestore-Requests, `StaleWhileRevalidate` für Regel-/Offline-Dokumente.
- `public/manifest.webmanifest`: installierbar auf Android/iOS/Desktop.
- Icons in `public/icons/` (16, 32, 180, 192, 512px).
- Sicherheits-/CORS-Header in `public/_headers` (Cloudflare Pages) und Redirects in `public/_redirects`.
- Für die bereitgestellte App ist eine strikte Content-Security-Policy konfiguriert (inkl. Spotify-WebSocket-Domains).

---

## Entwicklungsregeln (kritisch)

```text
✅ IMMER 100dvh (niemals 100vh)
✅ Touch-Targets mindestens 40px
✅ Vollständige Dateien (niemals Diffs)
✅ Sub-Funktionen VOR dem Elternkomponenten deklarieren
✅ React.memo / useMemo / useCallback wo angebracht
✅ data-testid auf interaktiven Elementen
✅ Alle Strings in TRANSLATIONS (alle unterstützten Sprachen)
❌ KEINE hartkodierten Strings
❌ KEIN t() innerhalb von TRANSLATIONS
❌ KEINE privaten globalen Variablen zwischen Modulen
❌ KEINE zirkulären Abhängigkeiten
❌ KEINE Firestore-Strukturen ohne Belege erfinden
```

---

## Wichtige CSS-Variablen

```css
--bg        /* Haupt-Hintergrund */
--bg2       /* Sekundärer Hintergrund (Karten, Modals) */
--tx        /* Haupttext */
--tx2       /* Sekundärtext */
--accent    /* globaler Akzent */
--gc        /* Spiel-Farbe (inline pro aktivem Spiel injiziert) */
--r         /* Basis-Radius */
--blur      /* backdrop-filter blur */
--glass-border  /* Liquid-Glass-Rahmen */
--nomercy   /* spezielle UNO No Mercy / Blackjack-Farbe */
```

---

## UNO-Datenmodell

Die UNO-Familie (`uno`, `uno_no_mercy`, `uno_flip`, `uno_dos`) belastet keine Restpunkte mehr pro Verlierer. Jede Runde nutzt eine einzige aggregierte Eingabe pro Kartentyp, und `SCORE_TABLES` berechnet die Summe; diese wird einmal dem Rundensieger gutgeschrieben.

UNO-Entwürfe können persistieren:

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` protokolliert nicht-destruktive Join/Leave-Ereignisse mit `effectiveRound`. Wenn ein Spieler eine laufende Partie verlässt, ist die unterstützte Standardoption, ihn im Protokoll zu behalten und nur aus dem künftigen aktiven Roster zu entfernen; das Scoreboard behält seinen historischen Punktestand, und die Sieger-Buttons verwenden nur aktive Spieler.

---

## Admin

- Admin-Zugriff über Firebase-Custom-Claims `{ admin: true }` (in `useAuth.ts` über `token.claims.admin` verifiziert).
- Claim aus einer vertrauenswürdigen Firebase-Admin-Umgebung setzen und ID-Token-Refresh erzwingen.
- Der „Admin"-Navigationspunkt ist nur sichtbar, wenn der Claim `true` ist.
- `AdminPage.tsx` verwaltet privilegierte Operationen.

---

## Neues Spiel hinzufügen

1. `src/components/games/NuevoJuegoNewMatch.tsx` erstellen
2. Eintrag in `src/data/games.ts` → `GAMES`-Objekt hinzufügen
3. Neue Keys in `src/data/translations/*.ts` für alle unterstützten Sprachen hinzufügen
4. `getTagline()`-Mapping in `games.ts` hinzufügen
5. Regeln in `src/data/rules.ts` hinzufügen
6. Komponente in `GameDetail.tsx` importieren und über `game.type` verbinden
7. Zur entsprechenden Gruppe in `src/components/home/homeModel.ts` hinzufügen

---

## Unterstützte Geräte (Playwright)

| Projekt | Viewport |
|---------|----------|
| `mobile-small` | 375×667 |
| `mobile-large` | 430×932 |
| `tablet` | 768×1024 |
| `foldable-open` | 717×512 |
| `foldable-closed` | 412×914 |
| `desktop` | 1280×800 |
| `layout-legacy` | 1280×800 |
| `logic` | 1280×800 |

Tests in `./tests/` · Konfiguration in `playwright.config.js`
