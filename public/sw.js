// Service Worker for Offline Support + Push Notifications
// Version 4.0.0 - Network-first approach + Push notification support
// Caching DISABLED for most assets to ensure users always get latest content

const CACHE_NAME = 'bullmoney-v4-push';
const OFFLINE_CACHE = 'bullmoney-offline-v4';

// MINIMAL cache - only offline fallback essentials
// No longer caching Spline scenes or runtime assets
const PRECACHE_ASSETS = [
  '/offline.html',
  '/bullmoney-logo.png',
  '/favicon.svg',
  '/B.png',
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
    console.log('[SW v4] Background sync triggered');
  }
  if (event.tag === 'notification-analytics') {
    console.log('[SW v4] Syncing notification analytics');
  }
});

// ============================================================================
// PUSH NOTIFICATIONS - Handle incoming push events
// ============================================================================

// Push event - this is where notifications are received (works even when app is closed!)
self.addEventListener('push', (event) => {
  console.log('[SW v4] Push event received');

  let data = {
    title: 'BullMoney Trade Alert 🚀',
    body: 'New trade signal available!',
    icon: '/bullmoney-logo.png',
    badge: '/B.png',
    tag: 'trade-alert',
    url: '/',
    channel: 'trades',
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW v4] Error parsing push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/bullmoney-logo.png',
    badge: data.badge || '/B.png',
    tag: data.tag || 'trade-alert-' + Date.now(),
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      channel: data.channel || 'trades',
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'view',
        title: '📈 View Trade',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  // Add image if provided (for trade screenshots, charts, etc.)
  if (data.image) {
    options.image = data.image;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - opens the app when user taps notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v4] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  const channel = event.notification.data?.channel;

  // Build full URL with tracking params
  let fullUrl = urlToOpen;
  if (channel && !urlToOpen.includes('channel=')) {
    const separator = urlToOpen.includes('?') ? '&' : '?';
    fullUrl = `${urlToOpen}${separator}channel=${channel}&from=notification`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the notification URL
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: fullUrl,
            channel: channel,
          });
          return client.focus();
        }
      }

      // No window open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});

// Notification close event (for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW v4] Notification closed without action');
  
  // Track notification dismissal (fire and forget)
  fetch('/api/notifications/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'close',
      tag: event.notification.tag,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
});