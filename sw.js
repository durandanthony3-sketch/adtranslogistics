// AD TRANS LOGISTICS — Service Worker v1.0
// Stratégie : Cache-first pour les assets, Network-first pour les pages HTML

const CACHE_NAME = 'adtl-v1.0';
const STATIC_CACHE = 'adtl-static-v1.0';

// Assets à mettre en cache immédiatement à l'installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/connexion.html',
  '/espace-client.html',
  '/negoce.html',
  '/vehicules.html',
  '/suivi.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// ─── INSTALLATION ──────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => {
        console.log('[SW] Pre-cache complete');
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] Pre-cache partial failure:', err))
  );
});

// ─── ACTIVATION ────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ne pas intercepter les requêtes Supabase (API)
  if (url.hostname.includes('supabase.co')) return;

  // Ne pas intercepter les fonts Google
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, 'adtl-fonts-v1'));
    return;
  }

  // Pages HTML → Network-first (toujours fraîches)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques → Cache-first
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ─── STRATÉGIES ────────────────────────────────────────────

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Page offline de fallback
    return caches.match('/index.html');
  }
}

async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status < 400) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    console.warn('[SW] Fetch failed for:', request.url);
    return new Response('Hors connexion — Ressource non disponible', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ─── NOTIFICATIONS PUSH (optionnel) ────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'AD TRANS LOGISTICS', {
    body: data.body || 'Mise à jour de votre dossier',
    icon: '/icons/icon-192.png',
    badge: '/icons/favicon-48.png',
    tag: data.tag || 'adtl-notification',
    renotify: true,
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
