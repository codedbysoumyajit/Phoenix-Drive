// public/sw.js
const CACHE_NAME = 'phoenix-xshare-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/register',
  '/upload',
  '/favicon.ico',
  '/site.webmanifest',
  '/browserconfig.xml',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
];

// Install: Cache core assets and offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip proxy API requests, direct CDN requests, or hot reloader tools
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/cdn/') || url.pathname.includes('_next') || url.pathname.includes('webpack')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful network responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request was for a document/page, show offline cache fallback
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          return Response.error();
        });
      })
  );
});
