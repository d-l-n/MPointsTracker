# MPOINTS TRACKER

> **26.08.06** · PWA React + Vite + Firebase · Suivi de scores multi-appareils pour jeux de société et de cartes

**Lire en :** [English](README.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [日本語](README.ja.md) · [中文](README.zh.md)

---

## Vue d'ensemble

MPoints Tracker est une **application web progressive** pour enregistrer les scores pendant des jeux de société et de cartes entre amis. Elle propose un catalogue de **23 jeux visibles** (famille UNO, Truco, Chinchón, Rummy, Poker, Blackjack, Generala, Échecs, Canasta, Burako et plus), fonctionne **hors ligne**, **se synchronise dans le cloud**, prend en charge le **jumeau de joueurs et les invitations**, et peut être **installée sur n'importe quel appareil**.

**Déploiement :** Cloudflare Pages
**URL de production :** `mpoints-tracker.pages.dev`
**Version actuelle :** `26.08.06`

### Points forts

- 🎲 **23 jeux** avec tableaux de scores, règles et statistiques spécifiques (famille UNO, Truco, Poker, Blackjack, Generala, Échecs, Sushi Do!, Canasta, Burako, Chancho, Chinchón, Rummy et plus).
- 📴 **Offline-first** : persistance locale via `localStorage` (`bgt_v6`) + cache hors ligne IndexedDB, avec synchronisation cloud différée.
- 🔗 **Joueurs & invitations** : associer des joueurs par QR/UID, partager des matchs, accepter des invitations.
- 🎨 **Personnalisation complète** : clair / sombre / OLED, accent Material You (Monet) et un sélecteur de **couleur d'accent personnalisée**.
- 🌍 **6 langues** : ES, EN, DE, FR, JA, ZH.
- 🏆 **Champions** : classements mondiaux, face-à-face et profils publics.
- 🎵 **Mini-lecteur Spotify** (optionnel) : contrôler la musique pendant la partie.
- 📦 **PWA installable** avec mise en cache du service worker.

---

## Pile technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 8 + TypeScript |
| Backend / Auth | Firebase 11 (Auth + Firestore) |
| Persistance locale | `localStorage` (`bgt_v6`) + IndexedDB (Firestore hors ligne) |
| Styles | Custom properties CSS + design Liquid Glass |
| i18n | Système maison (`TRANSLATIONS` + hook `useT`) |
| Tests | Playwright (multi-appareils) + Vitest |
| Déploiement | Cloudflare Pages (`wrangler`) |

---

## Démarrage rapide

```bash
npm install        # installer les dépendances (ou : pnpm install)
npm run dev        # serveur de dev sur localhost:5173
npm run build      # build de production dans /dist
npm run preview    # prévisualiser le build
npm run deploy     # build + déploiement sur Cloudflare Pages
```

### Tests

```bash
npm run test:unit  # tests unitaires avec Vitest (jsdom)
npm run test       # Playwright E2E (nécessite le serveur de dev actif)
npm run test:logic # suite logique desktop Playwright
npm run test:layout# suite multi-viewport Playwright (7 projets)
npm run test:fast  # logic + foldable-closed
npm run lint       # ESLint
```

### Vérification locale sans `npm`

Le flux local recommandé sur cette machine :

```powershell
node .\scripts\verify-local.mjs
```

Ce runner exécute, dans l'ordre :

- `typecheck`
- `build`
- `vitest`
- une suite Playwright **sans navigateur** de contrats de code
- une suite Playwright ciblant Settings/Champions/switches de jeux, en lançant `vite preview` elle-même (navigateur principal `msedge`, repli sur Chromium embarqué ; si aucun ne peut tourner, il le signale dans `test-results/local-verify/summary.json` au lieu de le confondre avec une panne fonctionnelle)

Pour exécuter des étapes isolées avec des binaires directs :

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switches.spec.js
```

`node .\scripts\typecheck.mjs` utilise `node_modules/typescript` s'il existe, sinon une toolchain temporaire via `corepack pnpm dlx` (cache local dans `.corepack/`).

---

## Structure du projet

### Architecture en un coup d'œil

```
entry (main.tsx)
  └─ routes (routes.tsx / routeLoaders.ts)   → routeur navigateur, gardes d'entrée, préchauffage
       └─ App.tsx                             → orchestration du shell : hooks, contexte, layout
            └─ AppLayout.tsx                  → chrome : en-tête, nav inférieure, changement de sections
                 ├─ HomeTab / GameDetail / Rules / Champs / Settings / Admin / History
                 └─ AppContext (context/AppContext.tsx) → état partagé de l'application
```

- **Le routage** est piloté par l'URL (`createBrowserRouter`) avec des pages lazy et des loaders qui préchauffent les liens profonds pour éviter les fallbacks visibles.
- **L'état** vit dans des hooks ciblés (`useTheme`, `useAuth`, `useMatches`, `useGameSession`, `useNavigation`, …) exposés globalement via `AppContext`.
- **Les données** transitent par `services/*` (helpers Firestore) et `lib/*` (storage, stats, confettis, client Spotify).
- **Les styles** sont du CSS en couches (`tokens → base → components → utilities`) piloté par des design tokens ; **pas de CSS-in-JS**.
- **L'i18n** est un petit runtime maison : chaque chaîne visible vit dans `src/data/translations/*.ts`, et chaque clé doit exister dans **les 6 langues**.

### Arborescence

```
src/
├── App.tsx                    # Orchestration du shell : auth, thème, navigation, câblage du contexte
├── main.tsx                   # Point d'entrée : RouterProvider + enregistrement du service worker
├── routes/
│   ├── routes.tsx             # Routeur navigateur + gardes d'entrée + pages lazy
│   └── routeLoaders.ts        # Préchauffage/validation des liens profonds (shell, history, settings, jeux)
├── index.css                  # Entrée des styles (CSS en couches)
├── styles/
│   ├── tokens.css             # Design tokens + thèmes light/dark/oled + modes d'accent
│   ├── base.css               # Reset / couche de base
│   ├── components.css         # Couche composants
│   └── utilities.css          # Utilitaires et aides visuelles
│
├── components/
│   ├── auth/                  # Connexion, scanner QR, recherche d'utilisateurs, liens d'invitation
│   ├── games/                 # Un formulaire NewMatch par jeu + saisies de scores partagées
│   ├── home/                  # HomeTab : catalogue, filtres, cartes hero, homeModel (view model)
│   ├── settings/              # Sections des réglages (thème, effets, langue, groupes, compte)
│   ├── seo/SEO.tsx            # Meta tags par route
│   └── ui/                    # Réutilisables : AppShell, AppHeader, GroupPicker, Toast, ThemeToggle, …
│
├── context/
│   └── AppContext.tsx         # Contexte partagé (matchs, groupes, préférences Spotify, …)
│
├── data/
│   ├── games.ts               # Catalogue GAMES (ids, noms, couleurs, icônes, tags)
│   ├── rules.ts               # Textes des règles pour RulesPage
│   ├── scoreTables.ts         # Tables de scores de la famille UNO
│   ├── sushiDo.ts             # Constantes/helpers de Sushi Do!
│   ├── portionFoods.ts        # Catalogue alimentaire du compteur de portions
│   └── translations/          # 6 langues : es (défaut), en, de, fr, ja, zh
│
├── hooks/                     # useTheme, useAuth, useMatches, useGameSession,
│                              # useNavigation, useOnlineStatus, useWakeLock, useHaptic, …
├── lib/                       # storage, stats, confetti, firebase, inviteService, spotifyClient
├── pages/                     # GameDetail, HomeTab, Rules, Champs, History, Settings, Admin, …
├── services/                  # authService, userService, matchService (helpers Firestore)
└── types.ts                   # Types TypeScript partagés
```

> **Conventions :** cibles tactiles ≥ 40px, `100dvh` (jamais `100vh`), `data-testid` sur les éléments interactifs, toutes les chaînes dans `TRANSLATIONS`, mémoïsation avec `React.memo`/`useCallback`, sous-fonctions déclarées avant leur composant parent.

---

## Catalogue de jeux (23 jeux visibles)

### Famille UNO
| ID | Nom | Condition de victoire |
|----|-----|-----------------------|
| `uno` | UNO | 500 pts |
| `uno_no_mercy` | UNO No Mercy | 1000 pts + règle de la miséricorde |
| `uno_flip` | UNO Flip | 500 pts (côté clair/sombre) |
| `uno_dos` | DOS | 200 pts |

### Jeux de cartes
| ID | Nom | Type |
|----|-----|------|
| `truco` | Truco | Équipes ou individuel, 15/30 pts |
| `chancho` | Chancho | Élimination par lettres |
| `esquinados` | Esquinados | Vainqueur par manche |
| `chin` | Chin | 1v1 sans cartes |
| `chinchon` | Chinchón | Élimination, limite 100 pts |
| `canasta` | Canasta | 5000 pts · Équipes ou individuel |
| `sushi_do` | Sushi Do! | 500 pts · 6 identiques par saveur |
| `rummy` | Rummy | 500 pts · Combinaisons |
| `burako` | Burako | 2000 pts · Individuel ou équipes |

### Plateau & société
| ID | Nom | Condition |
|----|-----|-----------|
| `ajedrez` | Échecs | 1v1, vainqueur du match |
| `monopoly` | Monopoly | Vainqueur du match |
| `life` | Life | Vainqueur du match |

### Casino & dés
| ID | Nom | Type |
|----|-----|------|
| `poker` | Poker | Vainqueur par manche |
| `blackjack` | Blackjack | 21 avec CPU optionnelle |
| `generala` | Generala | Combinaisons de 5 dés |

### Détente
| ID | Nom | Type |
|----|-----|------|
| `racha_perdida` | Série perdue | Suivi de série interrompue |
| `portion_counter` | Compteur de portions | Choix d'aliments + compteur simple |
| `basta_dym` | Basta! | 3 cartes thématiques · lettres A-Z par manche |
| `custom` | Jeu libre | Score libre / configurable |

### Home / Games

- `HomeTab` compose un bloc éditorial supérieur avec `featured` + `recent`.
- Seul **Recent** utilise un rail horizontal ; le catalogue normal ne réutilise pas de rail défilant.
- `homeModel.ts` évite la duplication visuelle : un jeu déjà mis en avant en haut n'est pas re-rendu dans le catalogue inférieur de la même vue.
- Les covers des heroes utilisent un placeholder cohérent et `loading="lazy"` ; si l'image échoue, le hero vectoriel reste le fallback.

### IDs internes cachés

`sushi`, `pizza`, `hamburguesa`, `pancho`, `empanadas`, `facturas`, `sanguchitos`, `cookies`, `otros_porciones` — conservés pour compatibilité/historique et utilisent `PorcionNewMatch`, mais n'apparaissent pas comme jeux visibles dans Home.

---

## Architecture des données

### localStorage (`bgt_v6`)

```js
{
  uno: [ /* tableau de matchs */ ],
  truco: [ /* ... */ ],
  __theme: true,        // legacy : thème persisté
  // ... reste des IDs de jeux
}
```

### Firestore

```
users/{uid}/
  └── data: { même forme que localStorage }

users/{uid}/shared_matches/
  └── {matchId}: {
        ...matchData,
        _gameId, _sharedBy, _sharedByUid, _sharedAt
      }
```

### Structure d'un match (exemple UNO)

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
  // champs spécifiques au jeu...
}
```

---

## Internationalisation (i18n)

**Langues :** `es` (défaut), `en`, `de`, `zh`, `ja`, `fr`

```js
// Dans App, le traducteur est créé et partagé via le contexte
const t = useT(lang);
t("saveMatch");

// JAMAIS appeler t() dans TRANSLATIONS
// JAMAIS de chaînes codées en dur dans les composants
// Toute nouvelle clé doit exister dans toutes les langues supportées
```

Détection : `detectLang()` → localStorage → `navigator.language` → repli `es`

Décision en vigueur : `i18next` / `react-i18next` ont été évalués en mai 2026. La décision actuelle est de **garder le système maison** (coût/bénéfice et simplicité du runtime). Voir [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md).

---

## Routage & Auth

```text
createBrowserRouter
  ├─ /                 → Shell de l'app + loader de préchauffage
  ├─ /login            → Entrée d'authentification explicite
  ├─ /rules            → Règles
  ├─ /champions        → Champions
  ├─ /settings         → Réglages + normalisation des query params
  ├─ /history          → Historique + normalisation des filtres
  ├─ /game/:gameId     → Jeu actif + validation du gameId + preload lazy
  └─ /admin            → ProtectedRoute → Shell de l'app
```

### Flux d'accès

```text
/login
  ├─ authChecked=false → chargement de l'auth
  ├─ offline           → bannière globale + mode local (aucune promesse de sync)
  ├─ Google OAuth
  ├─ Email/Mot de passe → LoginForm (useFormStatus + useOptimistic)
  └─ Mode invité → pas de sync cloud

/admin
  ├─ fbAuth.currentUser || bgt_last_uid → accès
  └─ sans session → redirection vers /login
```

### Persistance & synchronisation

- `src/services/authService.ts` initialise `setPersistence(fbAuth, indexedDBLocalPersistence)`.
- `src/hooks/useAuth.ts` restaure la session, charge `userdata/{uid}`, migre les données legacy et absorbe les `shared_matches`.
- `src/hooks/useMatches.ts` anti-rebond (1200 ms) après chaque changement et appelle `saveDataToCloud(uid, data)`.
- `src/hooks/useOnlineStatus.ts` alimente les visuels de repli hors ligne.
- `src/routes/routeLoaders.ts` préchauffe `App` et le jeu actif sur les entrées profondes pour éviter les fallbacks visibles.

---

## Thème

### Modes de couleur

- `bgt_theme_mode` : `light | dark | system`
- Le thème actif est dérivé : `system` suit l'OS, et `dark` + `oled` activent les surfaces OLED noir pur (`bgt_oled`).

### Modes d'accent

L'accent pilote le **chrome** de l'app (pilule active de la nav inférieure, vue statistiques, contrôles actifs), tandis que les **cartes de jeux** et l'**écran de détail** conservent leur couleur par jeu.

- `bgt_theme_accent` : `default | monet | custom`
  - **Par défaut** — l'accent sarcelle (`#006d77`).
  - **Monet** — les couleurs Material You quand elles sont disponibles sur Android (bridge `android-dynamic-color`) avec une palette de repli locale.
  - **Couleur personnalisée** — n'importe quel hex choisi par l'utilisateur (swatches + sélecteur libre dans *Réglages → Préférences → Thème de l'app*).
- `bgt_theme_custom_accent` : l'hex choisi par l'utilisateur (`#rrggbb`).
- L'hex personnalisé est exposé en ligne via `--theme-custom-accent` / `--theme-custom-on-accent` (on-accent dérivé de la luminance), et `html[data-theme-accent="custom"]` reconstruit tous les rôles d'accent via `color-mix` (conteneurs, contours, pilule nav, contrôles) pour light, dark et OLED.
- Avec un utilisateur authentifié, `themeAccent` / `themeCustomAccent` sont synchronisés dans `userdata/{uid}` (même modèle que `spotifyPosition`) et restaurés sur d'autres appareils.

`useTheme.ts` sépare mode de base, accent et OLED. Monet utilise un `DynamicThemeContract` + `data-theme-source="android-dynamic-color"` sans simuler une API web inexistante ; la couleur personnalisée est un mode indépendant qui ne concurrence pas le bridge.

En CSS :

- `html[data-theme]` contrôle les surfaces light/dark/oled
- `html[data-theme-accent="monet"]` remappe `--accent-*` vers les rôles Material
- `html[data-theme-accent="custom"]` remappe `--accent-*` depuis l'hex utilisateur
- `html[data-theme-source="android-dynamic-color"]` permet à un bridge externe d'injecter `--dynamic-*`

OLED et Monet/Custom coexistent : OLED domine les neutres/surfaces, l'accent continue de teinter accents, focus, pilules et contrôles.

---

## Mini-lecteur Spotify

L'option Spotify vit dans *Réglages → Préférences* et est **désactivée par défaut**. Une fois activée, l'app affiche un mini-lecteur global avec OAuth PKCE, Web Playback SDK et Spotify Web API : chanson, artiste, pochette, appareil actif, progression, file d'attente dépliable, volume en direct, shuffle, repeat, précédent/suivant, play/pause, synchronisation des chansons sauvegardées, recherche, playlists sauvegardées, déconnexion et transfert vers le navigateur quand le SDK enregistre un `device_id`. Au défilement, le lecteur se replie en bouton flottant avec la pochette active et se déplie au toucher.

Sur mobile : toucher hors du lecteur déplié le ferme ; le défilement le replie aussi. La position de la « bulle » repliée est configurable (Centre, Gauche, Droite, Glissable) et enregistrée dans `bgt_spotify_position` (cloud : `spotifyPosition`).

Pour une vraie connexion, configurez `VITE_SPOTIFY_CLIENT_ID` et les URI de redirection :

- Production : `https://votre-domaine/settings`
- Dev local : `http://127.0.0.1:5173/settings` (et `http://localhost:5173/settings` si vous utilisez `localhost`)

Spotify exige un compte **Premium** pour les intégrations web. Les jetons restent dans `localStorage` et sont supprimés à la déconnexion, à la déconnexion du compte ou au rejet du refresh. Le callback OAuth valide `state`, consomme le `code_verifier` une seule fois et nettoie `code`/`state`/`error` de l'URL.

Scopes : `streaming`, `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `user-library-read`, `user-library-modify`, `playlist-read-private`, `playlist-read-collaborative`. Les sessions autorisées avant l'ajout de la bibliothèque/des playlists doivent se reconnecter pour accorder ces scopes.

---

## Clés localStorage

| Clé | Usage |
|-----|-------|
| `bgt_v6` | Données principales (matchs + thème) |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` / `"custom"` |
| `bgt_theme_custom_accent` | Hex de l'accent personnalisé (`#rrggbb`) |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | Jetons OAuth PKCE Spotify locaux |
| `bgt_spotify_code_verifier` | Verifier temporaire du login Spotify |
| `bgt_spotify_oauth_state` | State temporaire du login Spotify |
| `bgt_wakelock` | `"1"` si le wake lock est actif |
| `bgt_oled` | `"1"` si les surfaces OLED sont actives |
| `bgt_splash_seen` | `"1"` une fois le splash affiché |
| `bgt_lang` | Langue enregistrée |
| `bgt_drafts` | Brouillons par jeu (`{ [gameId]: draft }`) |
| `bgt_haptic` | `"0"` si le retour haptique est désactivé |
| `bgt_reduce_effects` | `"1"` si les effets sont réduits |
| `bgt_last_uid` | Dernier UID avec session (indice de session) |
| `bgt_player_groups` | Groupes de joueurs enregistrés |
| `bgt_last_group_v` | Dernier groupe utilisé par jeu |
| `bgt_nav_order` | Ordre de la nav inférieure |
| `bgt_onboarding_seen` | `"1"` une fois l'onboarding terminé |
| `bgt_guest_mode` / `bgt_guest_name` | Mode invité / nom d'invité |
| `bgt_install_dismissed` / `_later` | Refus de la bannière d'installation |

### Sauvegarde & historique

*Réglages → Préférences → Avancé* permet d'exporter une sauvegarde JSON complète des matchs et de l'importer sur un autre appareil (l'import remplace les données locales avec les clés de jeux valides du fichier, puis utilise le flux normal de persistance/sync). L'Historique exporte aussi le résultat filtré actuel (joueur, jeu, date) en JSON.

---

## PWA / Service Worker

- `public/sw.js` : `CacheFirst` pour les assets, `NetworkFirst` pour les requêtes Firestore, `StaleWhileRevalidate` pour les documents de règles/hors ligne.
- `public/manifest.webmanifest` : installable sur Android/iOS/Desktop.
- Icônes dans `public/icons/` (16, 32, 180, 192, 512px).
- En-têtes de sécurité/CORS dans `public/_headers` (Cloudflare Pages) et redirections dans `public/_redirects`.
- Une Content-Security-Policy stricte est configurée pour l'app déployée (domaines WebSocket Spotify inclus).

---

## Règles de développement (critiques)

```text
✅ TOUJOURS 100dvh (jamais 100vh)
✅ Cibles tactiles minimum 40px
✅ Fichiers complets (jamais de diffs)
✅ Sous-fonctions déclarées AVANT le composant parent
✅ React.memo / useMemo / useCallback là où c'est pertinent
✅ data-testid sur les éléments interactifs
✅ Toutes les chaînes dans TRANSLATIONS (toutes les langues supportées)
❌ AUCUNE chaîne codée en dur
❌ PAS de t() dans TRANSLATIONS
❌ AUCUNE variable globale privée entre modules
❌ AUCUNE dépendance circulaire
❌ NE PAS inventer de structures Firestore sans preuve
```

---

## Variables CSS clés

```css
--bg        /* fond principal */
--bg2       /* fond secondaire (cartes, modales) */
--tx        /* texte principal */
--tx2       /* texte secondaire */
--accent    /* accent global */
--gc        /* couleur de jeu (injectée en ligne par jeu actif) */
--r         /* rayon de base */
--blur      /* backdrop-filter blur */
--glass-border  /* bordure liquid glass */
--nomercy   /* couleur spéciale UNO No Mercy / Blackjack */
```

---

## Modèle de données UNO

La famille UNO (`uno`, `uno_no_mercy`, `uno_flip`, `uno_dos`) ne facture plus les restes par perdant. Chaque manche utilise une seule saisie agrégée par type de carte et `SCORE_TABLES` calcule le total ; ce total est crédité une seule fois au vainqueur de la manche.

Les brouillons UNO peuvent persister :

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` enregistre les événements join/leave non destructifs avec `effectiveRound`. Quand un joueur quitte une partie en cours, l'option prise en charge par défaut est de le conserver dans l'historique et de le retirer seulement du roster actif futur ; le tableau de scores conserve son score historique et les boutons de vainqueur n'utilisent que les joueurs actifs.

---

## Admin

- Accès admin via les custom claims Firebase `{ admin: true }` (vérifié dans `useAuth.ts` via `token.claims.admin`).
- Définir le claim depuis un environnement Firebase Admin de confiance et forcer le rafraîchissement de l'ID token.
- L'élément de navigation « Admin » n'est visible que si le claim est `true`.
- `AdminPage.tsx` gère les opérations privilégiées.

---

## Ajouter un nouveau jeu

1. Créer `src/components/games/NuevoJuegoNewMatch.tsx`
2. Ajouter une entrée dans `src/data/games.ts` → objet `GAMES`
3. Ajouter de nouvelles clés dans `src/data/translations/*.ts` pour toutes les langues supportées
4. Ajouter le mapping `getTagline()` dans `games.ts`
5. Ajouter les règles dans `src/data/rules.ts`
6. Importer le composant dans `GameDetail.tsx` et le connecter via `game.type`
7. L'ajouter au groupe correspondant dans `src/components/home/homeModel.ts`

---

## Appareils pris en charge (Playwright)

| Projet | Viewport |
|--------|----------|
| `mobile-small` | 375×667 |
| `mobile-large` | 430×932 |
| `tablet` | 768×1024 |
| `foldable-open` | 717×512 |
| `foldable-closed` | 412×914 |
| `desktop` | 1280×800 |
| `layout-legacy` | 1280×800 |
| `logic` | 1280×800 |

Tests dans `./tests/` · Configuration dans `playwright.config.js`
