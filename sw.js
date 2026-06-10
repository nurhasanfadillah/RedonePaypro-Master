const CACHE_NAME = 'redonepaypro-v3';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate SW & Clean old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip non-http requests (like chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 2. Handle Supabase/API - Network Only (JANGAN di-cache)
  if (url.href.includes('supabase')) {
    return;
  }

  // 3. Handle Navigation (HTML) - Network First, Fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 4. Handle Static Assets (JS, CSS, Images, Fonts) - Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Ambil versi terbaru dari network secara background
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cek validitas respon sebelum caching
        // Kita izinkan type 'cors' agar CDN (Tailwind, jsPDF) bisa di-cache
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Network gagal, tidak apa-apa jika sudah ada cache
      });

      // Kembalikan cache jika ada, jika tidak tunggu network
      return cachedResponse || fetchPromise;
    })
  );
});