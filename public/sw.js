// PRO WORLD ARENA — Service Worker v2.0 (simplificado)
// Apenas push notifications — sem cache de navegação para evitar tela piscando

const CACHE_NAME = 'pwa-v2';

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ─── ACTIVATE — limpa caches antigos ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH — sempre network, sem interceptar (evita 503 e tela piscando) ─────
// Não registramos handler de fetch: o navegador busca tudo direto da rede.

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'PRO WORLD ARENA', body: event.data.text() }; }
  const options = {
    body:  data.body  || 'Nova atualização disponível',
    icon:  data.icon  || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-72.png',
    tag:   data.tag   || 'pwa-notification',
    data:  data.url   ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(data.title || 'PRO WORLD ARENA', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
