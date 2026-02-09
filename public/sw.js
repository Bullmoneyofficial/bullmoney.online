// Service Worker for Offline Support + Push Notifications + Spline Caching
// Version 5.0.0 - Network-first approach + Push notification support + Spline scene caching
// Spline scenes are aggressively cached for instant loading

const CACHE_NAME = 'bullmoney-v5-spline';
const OFFLINE_CACHE = 'bullmoney-offline-v5';
const SPLINE_CACHE = 'spline-scenes-v1';

// MINIMAL cache - only offline fallback essentials
const PRECACHE_ASSETS = [
  '/offline.html',
  '/bullmoney-logo.png',
  '/ONcc2l601.svg',
  '/B.png',
];

// Spline scenes to aggressively cache
const SPLINE_SCENES = [
  '/scene1.splinecode',
  '/scene.splinecode', 
  '/scene2.splinecode',
  '/scene3.splinecode',
  '/scene4.splinecode',
  '/scene5.splinecode',
  '/scene6.splinecode',
];

// Detect browser type for logging only
function getBrowserType(request) {
  const ua = request.headers.get('user-agent') || '';
  const isWebView = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  return { isWebView, isSafari, isMobile };
}

// Install event - cache offline fallback + preload Spline scenes
self.addEventListener('install', (event) => {
  console.log('[SW v5] Installing with Spline scene caching...');
  event.waitUntil(
    Promise.all([
      // Cache offline essentials
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.warn('[SW v5] Offline assets failed to cache:', err);
        });
      }),
      // Aggressively cache Spline scenes for instant loading
      caches.open(SPLINE_CACHE).then((cache) => {
        console.log('[SW v5] Pre-caching Spline scenes...');
        return Promise.all(
          SPLINE_SCENES.map(scene => 
            fetch(scene, { cache: 'force-cache' })
              .then(response => {
                if (response.ok) {
                  cache.put(scene, response);
                  console.log(`[SW v5] Cached: ${scene}`);
                }
              })
              .catch(err => console.warn(`[SW v5] Failed to cache ${scene}:`, err))
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - CLEAR old caches, keep Spline cache
self.addEventListener('activate', (event) => {
  console.log('[SW v5] Activating - clearing old caches, keeping Spline cache...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== OFFLINE_CACHE && name !== SPLINE_CACHE) // Keep offline + spline
          .map((name) => {
            console.log('[SW v5] Deleting cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Check if URL is a Spline scene
function isSplineScene(url) {
  return url.endsWith('.splinecode');
}

// Fetch event - CACHE-FIRST for Spline scenes, NETWORK-FIRST for everything else
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (except for essential CDNs)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // SPLINE SCENES: Cache-first for instant loading (~10ms target)
  if (isSplineScene(url.pathname)) {
    event.respondWith(
      caches.open(SPLINE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log(`[SW v5] ⚡ Spline cache hit: ${url.pathname}`);
            return cachedResponse;
          }
          
          // Not cached - fetch and cache for next time
          console.log(`[SW v5] Spline cache miss, fetching: ${url.pathname}`);
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // EVERYTHING ELSE: Network-first (no caching)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        // Only provide offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
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
      // Clear ALL caches except Spline (optional: add flag to clear spline too)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== SPLINE_CACHE) // Keep Spline cache by default
            .map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log('[SW v5] Caches cleared (Spline cache preserved)');
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'CLEAR_ALL_CACHE':
      // Clear ALL caches including Spline
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log('[SW v5] ALL caches cleared including Spline');
        event.ports[0]?.postMessage({ success: true });
      });
      break;
    
    case 'PRECACHE_SPLINE':
      // Force refresh Spline cache
      caches.open(SPLINE_CACHE).then((cache) => {
        return Promise.all(
          SPLINE_SCENES.map(scene => 
            fetch(scene, { cache: 'reload' })
              .then(response => response.ok && cache.put(scene, response))
          )
        );
      }).then(() => {
        console.log('[SW v5] Spline scenes re-cached');
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
// Compatible with: Chrome, Firefox, Safari 16.4+, Edge, Opera, Samsung Internet
// Works on: Android lock screen, iOS lock screen (PWA), macOS/Windows notification center
self.addEventListener('push', (event) => {
  console.log('[SW v5] 🔔 Push event received!');

  // Default notification content
  let data = {
    title: 'BullMoney Trade Alert',
    body: 'New trade signal available!',
    icon: '/bullmoney-logo.png',
    badge: '/B.png',
    tag: 'trade-alert',
    url: '/',
    channel: 'trades',
  };

  // Parse the push payload
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
      console.log('[SW v5] Push payload parsed:', data.title);
    } catch (jsonErr) {
      // Try plain text fallback
      try {
        const text = event.data.text();
        if (text) data.body = text;
        console.log('[SW v5] Push payload as text:', text.substring(0, 50));
      } catch (textErr) {
        console.error('[SW v5] Could not parse push data');
      }
    }
  }

  // CRITICAL: Use unique tag per message so multiple notifications show
  // Using same tag collapses notifications into one
  const uniqueTag = data.tag || ('trade-alert-' + Date.now());

  // Build notification options — KEEP IT SIMPLE for max cross-browser compat
  const options = {
    body: data.body || 'Tap to view',
    icon: data.icon || '/bullmoney-logo.png',
    badge: data.badge || '/B.png',
    tag: uniqueTag,
    renotify: true,  // Re-alert even if same tag
    requireInteraction: !!data.requireInteraction,
    silent: false,    // ALWAYS play sound — critical for lock screen visibility
    data: {
      url: data.url || '/',
      channel: data.channel || 'trades',
      timestamp: Date.now(),
      messageId: data.tag,
    },
  };

  // Add vibration on Android (safe to include, ignored on unsupported)
  try { options.vibrate = [200, 100, 200, 100, 200]; } catch (e) {}

  // Add action buttons (Chrome/Edge only, ignored by Safari/Firefox)
  try {
    if ('actions' in Notification.prototype) {
      options.actions = [
        { action: 'view', title: '📈 View Trade' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    }
  } catch (e) {}

  // Add image if provided
  if (data.image) {
    try { options.image = data.image; } catch (e) {}
  }

  // CRITICAL: Must call showNotification inside waitUntil
  // Without this, the browser may kill the SW before the notification shows
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[SW v5] ✅ Notification displayed:', data.title);
      })
      .catch((err) => {
        console.error('[SW v5] showNotification failed, trying minimal:', err);
        // Absolute minimal fallback — works on ALL browsers
        return self.registration.showNotification(data.title || 'BullMoney', {
          body: data.body || 'New alert',
          icon: '/bullmoney-logo.png',
        });
      })
  );
});

// Notification click event - opens the app when user taps notification
// Compatible with all browsers including iOS Safari PWA
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v5] Notification clicked:', event.action);

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
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        // Try to find an existing window to focus
        for (const client of clientList) {
          if (client.url && client.url.startsWith(self.location.origin)) {
            try {
              await client.focus();
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: fullUrl,
                channel: channel,
              });
              return;
            } catch (focusErr) {
              // Can't focus, will open new window
            }
          }
        }

        // No existing window found, open new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      } catch (err) {
        console.error('[SW v5] Notification click error:', err);
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      }
    })()
  );
});

// Notification close event (analytics)
self.addEventListener('notificationclose', (event) => {
  // Fire-and-forget analytics
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

// Push subscription change event - CRITICAL: handles token refresh
// When a subscription expires, the browser fires this event
// We must re-subscribe and update the server immediately
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW v5] ⚠️ Push subscription changed — re-subscribing...');

  event.waitUntil(
    (async () => {
      try {
        // Re-subscribe with the same options
        const newSubscription = await self.registration.pushManager.subscribe(
          event.oldSubscription?.options || {
            userVisibleOnly: true,
          }
        );

        console.log('[SW v5] Got new subscription, sending to server...');

        // Send the new subscription to the server
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: newSubscription.toJSON(),
            oldEndpoint: event.oldSubscription?.endpoint,
            reason: 'subscription_change',
          }),
        });

        if (response.ok) {
          console.log('[SW v5] ✅ Subscription refreshed successfully');
        } else {
          console.error('[SW v5] ❌ Server rejected new subscription:', response.status);
        }
      } catch (err) {
        console.error('[SW v5] ❌ Failed to refresh subscription:', err);
      }
    })()
  );
});