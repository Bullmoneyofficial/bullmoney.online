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
  '/ONcc2l601.svg',
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

// Message handler for cache control and app communication
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      // Clear ALL caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log('[SW v4] All caches cleared');
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'GET_SUBSCRIPTION':
      // Allow app to check subscription status
      self.registration.pushManager.getSubscription()
        .then((subscription) => {
          event.ports[0]?.postMessage({
            success: true,
            subscription: subscription ? subscription.toJSON() : null
          });
        })
        .catch((err) => {
          event.ports[0]?.postMessage({ success: false, error: err.message });
        });
      break;

    case 'PING':
      // Health check from app
      event.ports[0]?.postMessage({ success: true, timestamp: Date.now() });
      break;

    default:
      console.log('[SW v4] Unknown message type:', event.data.type);
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
// Compatible with all browsers: Chrome, Firefox, Safari, Edge, Opera, Samsung Internet
self.addEventListener('push', (event) => {
  console.log('[SW v4] Push event received');

  let data = {
    title: 'BullMoney Trade Alert',
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
      try {
        data.body = event.data.text();
      } catch (textErr) {
        console.error('[SW v4] Could not get text from push data');
      }
    }
  }

  // Build notification options with cross-browser compatibility
  const options = {
    body: data.body,
    icon: data.icon || '/bullmoney-logo.png',
    badge: data.badge || '/B.png',
    tag: data.tag || 'trade-alert-' + Date.now(),
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      channel: data.channel || 'trades',
      timestamp: Date.now(),
    },
  };

  // Vibration pattern - supported on Android, some desktop browsers
  // Wrapped in try-catch for Safari compatibility
  try {
    options.vibrate = [200, 100, 200, 100, 200];
  } catch (e) {
    // Vibration not supported
  }

  // Actions - supported on Chrome/Edge, not Safari
  // Check if actions are supported before adding
  try {
    if ('actions' in Notification.prototype) {
      options.actions = [
        { action: 'view', title: 'View Trade' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    }
  } catch (e) {
    // Actions not supported
  }

  // Add image if provided (for trade screenshots, charts, etc.)
  // Supported on Chrome/Edge Android, not iOS Safari
  if (data.image) {
    try {
      options.image = data.image;
    } catch (e) {
      // Image not supported
    }
  }

  // Silent option for iOS - prevents sound when app is in foreground
  if (data.silent) {
    options.silent = true;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .catch((err) => {
        console.error('[SW v4] showNotification error:', err);
        // Fallback: try with minimal options for maximum compatibility
        return self.registration.showNotification(data.title, {
          body: data.body,
          icon: '/bullmoney-logo.png',
          tag: data.tag || 'trade-alert',
        });
      })
  );
});

// Notification click event - opens the app when user taps notification
// Compatible with all browsers including iOS Safari PWA
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v4] Notification clicked:', event.action);

  // Always close the notification first
  event.notification.close();

  // If user clicked dismiss action, just close
  if (event.action === 'dismiss') {
    return;
  }

  // Get the URL to open from notification data
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';
  const channel = notificationData.channel;

  // Build full URL with tracking params
  let fullUrl = urlToOpen;
  if (channel && !urlToOpen.includes('channel=')) {
    const separator = urlToOpen.includes('?') ? '&' : '?';
    fullUrl = `${urlToOpen}${separator}channel=${channel}&from=notification`;
  }

  // Make URL absolute if it's relative
  if (fullUrl.startsWith('/')) {
    fullUrl = self.location.origin + fullUrl;
  }

  event.waitUntil(
    (async () => {
      try {
        // Get all open windows/tabs for this app
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        // Try to find an existing window to focus
        for (const client of clientList) {
          // Check if this client is from our origin
          if (client.url && client.url.startsWith(self.location.origin)) {
            // Try to focus and navigate
            try {
              await client.focus();
              // Send message to navigate
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: fullUrl,
                channel: channel,
              });
              return;
            } catch (focusErr) {
              console.log('[SW v4] Could not focus client, will open new window');
            }
          }
        }

        // No existing window found or couldn't focus, open new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      } catch (err) {
        console.error('[SW v4] Notification click error:', err);
        // Last resort fallback
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      }
    })()
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

// Push subscription change event - handles token refresh
// This is important for long-lived subscriptions
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW v4] Push subscription changed');

  event.waitUntil(
    (async () => {
      try {
        // Get the new subscription
        const newSubscription = await self.registration.pushManager.subscribe(
          event.oldSubscription?.options || {
            userVisibleOnly: true,
          }
        );

        // Send the new subscription to the server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: newSubscription.toJSON(),
            oldEndpoint: event.oldSubscription?.endpoint,
            reason: 'subscription_change',
          }),
        });

        console.log('[SW v4] Subscription refreshed successfully');
      } catch (err) {
        console.error('[SW v4] Failed to refresh subscription:', err);
      }
    })()
  );
});