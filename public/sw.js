// Service Worker for Offline Support - Minimal Caching
// Version 3.0.0 - Network-first approach for freshest content
// Caching DISABLED for most assets to ensure users always get latest content

const CACHE_NAME = 'bullmoney-v3-minimal';
const OFFLINE_CACHE = 'bullmoney-offline-v3';

// MINIMAL cache - only offline fallback essentials
// No longer caching Spline scenes or runtime assets
const PRECACHE_ASSETS = [
  '/offline.html',
  '/bullmoney-logo.png',
  '/favicon.svg',
];

// Detect browser type for logging only
function getBrowserType(request) {
  const ua = request.headers.get('user-agent') || '';
  const isWebView = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  return { isWebView, isSafari, isMobile };
}

// Install event - cache ONLY minimal offline fallback
self.addEventListener('install', (event) => {
  console.log('[SW v3] Installing minimal offline support (caching disabled)...');
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW v3] Offline assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - CLEAR ALL old caches for fresh start
self.addEventListener('activate', (event) => {
  console.log('[SW v3] Activating - clearing ALL old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== OFFLINE_CACHE) // Keep only offline cache
          .map((name) => {
            console.log('[SW v3] Deleting cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - NETWORK FIRST for all requests (no caching)
// Only fall back to offline page if network fails for navigation
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // ALWAYS fetch from network first - no caching
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Return fresh network response - don't cache it
        return response;
      })
      .catch(() => {
        // Only provide offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        // For other requests, return network error
        return new Response('Network unavailable', { status: 503 });
      })
  );
});

// Message handler for cache control from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear ALL caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      console.log('[SW v3] All caches cleared');
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

// Background sync (keep for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW v3] Background sync triggered');
  }
});