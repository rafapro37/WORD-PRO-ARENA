// PRO WORLD ARENA — Service Worker v3.0
// Estratégia segura: NÃO cacheia JS/CSS (evita servir versão velha / "tela piscando").
// Só intercepta NAVEGAÇÃO: network-first com fallback para página offline.

const CACHE_NAME = 'pwa-shell-v3';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

// ─── INSTALL — pré-cacheia só o essencial pro modo offline ──────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

// ─── ACTIVATE — limpa caches antigos ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── FETCH — só navegação. Tudo o mais vai direto pra rede (sem interceptar) ─
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Apenas requisições de navegação (abrir página). Assets passam direto.
  if (req.mode !== 'navigate') return;

  event.respondWith(
    fetch(req).catch(() =>
      caches.match(OFFLINE_URL).then((res) => res || new Response('Offline', { status: 503 }))
    )
  );
});

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'PRO WORLD ARENA', body: event.data.text() }; }
  const options = {
    body:  data.body  || 'Nova atualização disponível',
    icon:  data.icon  || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-72.png',
    tag:   data.tag   || 'pwa-notification',
    vibrate: [80, 40, 80],
    data:  data.url   ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(data.title || 'PRO WORLD ARENA', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) { if ('focus' in w) return w.focus(); }
      return clients.openWindow(url);
    })
  );
});
