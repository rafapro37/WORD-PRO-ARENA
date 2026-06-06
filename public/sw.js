// PRO WORLD ARENA — Service Worker v1.0
// Cache offline + Push Notifications

const CACHE_NAME = 'pwa-v1';
const OFFLINE_URL = '/offline.html';

// Assets para cache imediato (shell da aplicação)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache apenas o que existir — não falha se algum asset não existir ainda
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          fetch(url).then(res => {
            if (res.ok) return cache.put(url, res);
          }).catch(() => {/* silencioso */})
        )
      );
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH — Estratégia: Network First, Cache Fallback ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-GET e de outras origens
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API do Supabase: sempre network (sem cache)
  if (url.hostname.includes('supabase')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Guardar no cache se for bem-sucedido
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        // Offline: tentar cache; fallback para offline.html em navegação
        caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 503 });
        })
      )
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'PRO WORLD ARENA', body: event.data.text() }; }

  const options = {
    body:    data.body    || 'Nova atualização disponível',
    icon:    data.icon    || '/icons/icon-192.png',
    badge:   data.badge   || '/icons/icon-72.png',
    tag:     data.tag     || 'pwa-notification',
    data:    data.url     ? { url: data.url } : {},
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PRO WORLD ARENA', options)
  );
});

// Clique na notificação — navegar para a URL relevante
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focar janela existente se possível
      const existing = clients.find(c => c.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

// ─── BACKGROUND SYNC (retry de ações offline) ────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncPendingResults());
  }
});

async function syncPendingResults() {
  // Placeholder — a lógica real é tratada pelo useSync no AppContext
  console.log('[SW] Background sync: sync-results');
}
