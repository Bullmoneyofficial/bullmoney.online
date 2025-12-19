// Service Worker for Offline Support and Performance
// Version 1.0.0

const CACHE_NAME = 'bullmoney-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(RUNTIME_CACHE).then((cache) => {
          // Only cache GET requests
          if (event.request.method === 'GET') {
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for failed requests (Progressive Web App feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement data sync logic here
  console.log('Syncing data in background...');
}
