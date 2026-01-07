// Service Worker for Offline Support and Performance
// Version 2.1.0 - Smart Device-Aware Caching with Browser Detection

const CACHE_NAME = 'bullmoney-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';
const SPLINE_CACHE = 'bullmoney-spline-v2';
const WEBVIEW_CACHE = 'bullmoney-webview-v1';
const SAFARI_CACHE = 'bullmoney-safari-v1';
const CHROME_CACHE = 'bullmoney-chrome-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/scene1.splinecode',
  '/scene.splinecode',
  '/scene2.splinecode',
  '/scene3.splinecode',
  '/scene4.splinecode',
  '/scene5.splinecode',
  '/scene6.splinecode',
  '/bullmoney-logo.png',
  '/bullmoneyvantage.png',
  '/BULL.svg',
  '/favicon.svg',
  '/manifest.json',
  '/draco_wasm_wrapper.js',
  '/draco_decoder.wasm',
  '/process.js',
];

// Detect browser type and environment
function getBrowserType(request) {
  const ua = request.headers.get('user-agent') || '';

  const isWebView = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua) && !isWebView;
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);

  return {
    isWebView,
    isSafari,
    isChrome,
    isMobile,
    cacheName: isWebView ? WEBVIEW_CACHE : (isSafari ? SAFARI_CACHE : CHROME_CACHE)
  };
}

// Legacy compatibility
function isWebViewRequest(request) {
  return getBrowserType(request).isWebView;
}

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW v2] Installing with smart device caching...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache non-spline assets first (faster)
      const criticalAssets = PRECACHE_ASSETS.filter(url => !url.endsWith('.splinecode'));
      return cache.addAll(criticalAssets).catch(err => {
        console.warn('[SW v2] Some critical assets failed to cache:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW v2] Activating and cleaning old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('bullmoney-') &&
                   name !== CACHE_NAME &&
                   name !== RUNTIME_CACHE &&
                   name !== SPLINE_CACHE &&
                   name !== WEBVIEW_CACHE;
          })
          .map((name) => {
            console.log('[SW v2] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - Smart caching based on device and content type
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const request = event.request;
  const url = new URL(request.url);

  // Never cache Next.js build assets (prevents ChunkLoadError after updates/HMR)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  const isWebView = isWebViewRequest(request);

  // Spline scenes get special treatment with browser-specific caching
  if (request.url.endsWith('.splinecode')) {
    const browserInfo = getBrowserType(request);
    const cacheName = browserInfo.cacheName;
    event.respondWith(handleSplineRequest(request, cacheName, browserInfo));
    return;
  }

  const isAssetRequest =
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.url.endsWith('.wasm') ||
    /\.mp3$/.test(request.url);

  if (isAssetRequest) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              if (request.method === 'GET') {
                cache.put(request, responseToCache);
              }
            });

            return response;
          })
          .catch(() => caches.match(request));
      })
    );
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

// Smart Spline request handler with browser-specific optimization
async function handleSplineRequest(request, cacheName, browserInfo) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const browserType = browserInfo.isWebView ? 'WebView' : (browserInfo.isSafari ? 'Safari' : (browserInfo.isChrome ? 'Chrome' : 'Standard'));

  if (cached) {
    console.log(`[SW v2.1] Spline cache hit (${browserType}):`, request.url);

    // Update in background for WebView and mobile Safari (slower/unreliable networks)
    if (browserInfo.isWebView || (browserInfo.isSafari && browserInfo.isMobile)) {
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          console.log(`[SW v2.1] Background updated cache for ${browserType}`);
        }
      }).catch(() => {});
    }
    return cached;
  }

  try {
    console.log(`[SW v2.1] Fetching Spline scene (${browserType}):`, request.url);

    // Use appropriate fetch strategy based on browser
    const fetchOptions = {};

    // Safari benefits from explicit cache control
    if (browserInfo.isSafari) {
      fetchOptions.cache = 'force-cache';
    }

    const response = await fetch(request, fetchOptions);

    if (response.ok) {
      // Cache for future use
      cache.put(request, response.clone());
      console.log(`[SW v2.1] Cached Spline scene (${browserType}):`, request.url);

      // Also cache in SPLINE_CACHE for fallback
      if (cacheName !== SPLINE_CACHE) {
        caches.open(SPLINE_CACHE).then(fallbackCache => {
          fallbackCache.put(request, response.clone());
        }).catch(() => {});
      }
    }
    return response;
  } catch (error) {
    console.error(`[SW v2.1] Spline fetch failed (${browserType}):`, error);

    // Try fallback from SPLINE_CACHE
    if (cacheName !== SPLINE_CACHE) {
      const fallbackCache = await caches.open(SPLINE_CACHE);
      const fallbackCached = await fallbackCache.match(request);
      if (fallbackCached) {
        console.log(`[SW v2.1] Using fallback cache for ${browserType}`);
        return fallbackCached;
      }
    }

    throw error;
  }
}

// Message handler for cache control from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_SPLINE') {
    const { url, priority } = event.data;
    console.log(`[SW v2] Cache request for Spline (priority: ${priority}):`, url);

    caches.open(SPLINE_CACHE).then((cache) => {
      return fetch(url).then((response) => {
        if (response.ok) {
          cache.put(url, response.clone());
          console.log('[SW v2] Preloaded Spline scene:', url);
          event.ports[0]?.postMessage({ success: true, url });
        }
        return response;
      }).catch(err => {
        console.warn('[SW v2] Failed to preload Spline:', err);
        event.ports[0]?.postMessage({ success: false, url, error: err.message });
      });
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    const { cacheName } = event.data;
    caches.delete(cacheName || SPLINE_CACHE).then(() => {
      console.log(`[SW v2] Cleared cache:`, cacheName || SPLINE_CACHE);
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

// Background sync for failed requests (Progressive Web App feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW v2] Syncing data in background...');
}
