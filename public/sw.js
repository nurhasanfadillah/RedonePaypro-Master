const CACHE_NAME = 'redonepaypro-v6';
const urlsToCache = [
  '/',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate SW & Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch Handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-http (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Navigation (HTML) — Network First, fallback ke cache '/'
  // Fallback aktif untuk SEMUA respons non-ok (4xx/5xx) bukan hanya network error,
  // agar PWA tidak menampilkan error page hosting saat offline atau URL bermasalah.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => (res.ok ? res : caches.match('/')))
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static Assets — Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
        }
        return res;
      }).catch(() => {});

      return cached || network;
    })
  );
});
