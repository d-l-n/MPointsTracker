/* ═══════════════════════════════════════════════════════════════════════════
   MPoints Tracker — Service Worker v3.7.2
   Phase 1 strategy map:
   - App shell / HTML      → Network-first, fallback a cache
   - Assets JS/CSS/img     → Cache-first
   - Rules route           → Stale-while-revalidate
   - Google Fonts          → Cache-first
   - Firebase API          → Bypass (SDK maneja offline por su cuenta)
   - Runtime fallback      → Stale-while-revalidate
════════════════════════════════════════════════════════════════════════════ */

const SW_VERSION   = "3.7.2";
const CACHE_SHELL  = `mpoints-shell-${SW_VERSION}`;
const CACHE_ASSETS = `mpoints-assets-${SW_VERSION}`;
const CACHE_RULES  = `mpoints-rules-${SW_VERSION}`;
const CACHE_FONTS  = "mpoints-fonts-v1"; // versionado por separado — fuentes raramente cambian

// URLs que siempre bypaseamos (Firebase, auth, Firestore, FCM)
const BYPASS_ORIGINS = [
  "firestore.googleapis.com",
  "firebase.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "cloudfunctions.net",
  "googleapis.com",
];

// Assets con hash en el nombre → cache-first eternamente
const HASHED_ASSET_PATTERNS = [
  /\/assets\/.+\.[a-f0-9]{8}\.(js|css|woff2?)$/,
  /\.(js|css)(\?v=.+)?$/,
];

// ── Install: precachear el shell ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) =>
      // Solo cacheamos el HTML raíz; los assets se cachean dinámicamente
      cache.addAll(["/"])
    ).then(() => self.skipWaiting()) // activar inmediatamente
  );
});

// ── Activate: limpiar caches viejos ──────────────────────────────────────
self.addEventListener("activate", (event) => {
  const validCaches = new Set([CACHE_SHELL, CACHE_ASSETS, CACHE_RULES, CACHE_FONTS]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !validCaches.has(k))
          .map((k) => {
            console.log("[SW] Limpiando cache viejo:", k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim()) // tomar control de todas las tabs
  );
});

// ── Fetch: estrategia por tipo de recurso ────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar non-GET
  if (request.method !== "GET") return;

  // 2. Bypass Firebase / Google APIs — dejar que el SDK maneje offline
  if (BYPASS_ORIGINS.some((origin) => url.hostname.includes(origin))) return;

  // 3. Bypass chrome-extension y otros esquemas raros
  if (!["http:", "https:"].includes(url.protocol)) return;

  // 4. Google Fonts → Cache-first, TTL largo
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirstFonts(request));
    return;
  }

  // 5. Assets con hash (JS/CSS del build de Vite) → Cache-first, nunca expiran
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirstAssets(request));
    return;
  }

  // 6. Ruta de reglas → SWR dedicado para acelerar reingresos a esa vista
  if (isRulesNavigation(url, request)) {
    event.respondWith(staleWhileRevalidateRules(request));
    return;
  }

  // 7. Navegación (HTML) → Network-first con fallback al shell cacheado
  if (request.mode === "navigate") {
    event.respondWith(networkFirstShell(request));
    return;
  }

  // 8. Todo lo demás → Stale-while-revalidate
  event.respondWith(staleWhileRevalidateRuntime(request));
});

// ── Mensaje desde la app ─────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "GET_VERSION") {
    event.ports[0]?.postMessage({ version: SW_VERSION });
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   ESTRATEGIAS DE CACHE
══════════════════════════════════════════════════════════════════════════ */

function isHashedAsset(url) {
  return HASHED_ASSET_PATTERNS.some((re) => re.test(url.pathname));
}

function isRulesNavigation(url, request) {
  return request.mode === "navigate" && url.pathname === "/rules";
}

// Cache-first para assets con hash (inmutables)
async function cacheFirstAssets(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_ASSETS);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Asset no disponible offline", { status: 503 });
  }
}

// Cache-first para fuentes (TTL 1 año)
async function cacheFirstFonts(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_FONTS);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Font no disponible offline", { status: 503 });
  }
}

// Network-first para HTML — si falla la red, sirve el shell cacheado
async function networkFirstShell(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_SHELL);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline: buscar en cache
    const cached =
      (await caches.match(request)) ||
      (await caches.match("/")) || // fallback al shell raíz
      new Response(offlineFallbackHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    return cached;
  }
}

// Stale-while-revalidate dedicado para la ruta de reglas
async function staleWhileRevalidateRules(request) {
  const cache = await caches.open(CACHE_RULES);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || (await caches.match("/")) || new Response("Sin conexión", { status: 503 });
}

// Stale-while-revalidate: sirve cache inmediatamente y actualiza en background
async function staleWhileRevalidateRuntime(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || new Response("Sin conexión", { status: 503 });
}

// Fallback HTML cuando todo falla (muy raro pero cubre el caso extremo)
function offlineFallbackHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MPoints Tracker — Sin conexión</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f0f12; color: #e2e8f0;
           display: flex; align-items: center; justify-content: center; min-height: 100dvh;
           margin: 0; flex-direction: column; gap: 12px; text-align: center; padding: 24px; }
    .icon { font-size: 3rem; }
    h1 { font-size: 1.4rem; margin: 0; }
    p { color: #94a3b8; font-size: .9rem; margin: 0; }
    button { margin-top: 16px; padding: 12px 24px; border-radius: 12px; border: none;
             background: #7b6fff; color: #fff; font-size: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="icon">📶</div>
  <h1>Sin conexión</h1>
  <p>La app no está cacheada todavía.<br>Conectate a internet y volvé a cargar.</p>
  <button onclick="location.reload()">Recargar</button>
</body>
</html>`;
}
