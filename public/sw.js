// Service Worker for Offline Support + Push Notifications + Spline Caching
// Version 7.0.0 - Universal Push + iOS & Android Optimized
// iOS Safari 16.4+ PWA: Web Push via PushManager
// Android Chrome/Samsung/Firefox: Full push + vibration + actions
// macOS Safari 16+: Web Push API
// Windows/Linux Chrome/Edge/Firefox: Full push support
// Spline scenes are aggressively cached for instant loading

const CACHE_VERSION = '7.0.0';
const CACHE_NAME = 'bullmoney-v7-mobile';
const OFFLINE_CACHE = 'bullmoney-offline-v7';
const SPLINE_CACHE = 'spline-scenes-v2';
const META_CACHE = 'bm-meta-v1';
const TELEGRAM_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const MARKETING_LIMIT_PER_DAY = 2;

// iOS Safari cache limit: ~50MB per origin
// Android Chrome: ~200MB+ (more generous)
const MAX_CACHE_SIZE_MB = 45; // Stay under iOS limit
const MAX_CACHE_ENTRIES = 150; // Prevent iOS cache eviction

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

// Detect browser type and OS for optimizations
function getBrowserType(request) {
  const ua = request.headers.get('user-agent') || '';
  const isWebView = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  return { isWebView, isSafari, isMobile, isIOS, isAndroid };
}

// iOS-specific: Trim cache to stay under 50MB limit
async function trimCacheForIOS() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  if (keys.length > MAX_CACHE_ENTRIES) {
    // Remove oldest 25% when limit reached
    const toRemove = keys.slice(0, Math.floor(keys.length * 0.25));
    await Promise.all(toRemove.map(key => cache.delete(key)));
    console.log(`[SW iOS] Trimmed ${toRemove.length} cache entries`);
  }
}

// Android-specific: Check if we should use background sync
function supportsBackgroundSync() {
  return 'sync' in self.registration;
}

// Install event - cache offline fallback + preload Spline scenes (iOS/Android optimized)
self.addEventListener('install', (event) => {
  console.log('[SW v6 Mobile] Installing with iOS/Android optimizations...');
  event.waitUntil(
    Promise.all([
      // Cache offline essentials
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.warn('[SW v6] Offline assets failed to cache (non-critical):', err);
        });
      }),
      // Spline scenes: More conservative on iOS (respects memory limits)
      caches.open(SPLINE_CACHE).then((cache) => {
        console.log('[SW v6] Pre-caching Spline scenes (mobile-optimized)...');
        return Promise.all(
          SPLINE_SCENES.map(scene => 
            fetch(scene, { 
              cache: 'force-cache',
              // iOS Safari: Add timeout to prevent hanging
              signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
            })
              .then(response => {
                if (response.ok) {
                  cache.put(scene, response);
                  console.log(`[SW v6] Cached: ${scene}`);
                }
              })
              .catch(err => {
                // iOS: Non-critical, continue install
                console.warn(`[SW v6] Failed to cache ${scene} (non-critical):`, err);
              })
          )
        );
      })
    ]).then(() => {
      console.log('[SW v6] Installation complete - iOS/Android ready');
      return self.skipWaiting();
    })
  );
});

// Activate event - CLEAR old caches, keep Spline cache, trim for iOS
self.addEventListener('activate', (event) => {
  console.log('[SW v6] Activating - clearing old caches (iOS/Android optimized)...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => 
            name !== CACHE_NAME && 
            name !== OFFLINE_CACHE && 
            name !== SPLINE_CACHE
          )
          .map((name) => {
            console.log('[SW v6] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => trimCacheForIOS()) // iOS: Ensure we're under cache limit
    .then(() => {
      console.log('[SW v6] Activation complete - taking control');
      return self.clients.claim();
    })
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
            console.log(`[SW v7] ⚡ Spline cache hit: ${url.pathname}`);
            return cachedResponse;
          }
          
          // Not cached - fetch and cache for next time
          console.log(`[SW v7] Spline cache miss, fetching: ${url.pathname}`);
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
        console.log('[SW v7] Caches cleared (Spline cache preserved)');
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
        console.log('[SW v7] ALL caches cleared including Spline');
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
        console.log('[SW v7] Spline scenes re-cached');
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
      event.ports[0]?.postMessage({ success: true, timestamp: Date.now(), version: CACHE_VERSION });
      break;

    case 'REFRESH_PUSH':
      // Re-validate push subscription
      self.registration.pushManager.getSubscription()
        .then((sub) => {
          if (sub) {
            // Re-send to server to keep it fresh
            return fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub.toJSON(),
                reason: 'periodic_refresh',
              }),
            });
          }
        })
        .then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
        .catch((err) => {
          event.ports[0]?.postMessage({ success: false, error: err.message });
        });
      break;

    default:
      console.log('[SW v7] Unknown message type:', event.data.type);
  }
});

// ============================================================================
// PERIODIC BACKGROUND SYNC — Keeps push subscription alive on Android/Chrome
// Fires approx every 12 hours when registered. Keeps subscription from expiring.
// ============================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'push-keepalive') {
    console.log('[SW v7] Periodic sync: push-keepalive');
    event.waitUntil(
      self.registration.pushManager.getSubscription()
        .then((sub) => {
          if (sub) {
            return fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub.toJSON(),
                reason: 'periodic_sync',
              }),
            });
          }
        })
        .catch((err) => {
          console.warn('[SW v7] Periodic sync failed:', err);
        })
    );
  }
});

// Background sync (keep for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW v7] Background sync triggered');
  }
  if (event.tag === 'notification-analytics') {
    console.log('[SW v7] Syncing notification analytics');
  }
});

// ============================================================================
// PUSH NOTIFICATIONS - Handle incoming push events
// Universal: Works on ALL push-capable browsers even when app/browser is closed
// ============================================================================

async function getMetaValue(key) {
  try {
    const cache = await caches.open(META_CACHE);
    const res = await cache.match(key);
    if (!res) return null;
    const text = await res.text();
    return text ? parseInt(text, 10) : null;
  } catch (e) {
    return null;
  }
}

async function setMetaValue(key, value) {
  try {
    const cache = await caches.open(META_CACHE);
    await cache.put(key, new Response(String(value)));
  } catch (e) {}
}

async function getLastTelegramAt() {
  const v = await getMetaValue('/__bm_last_telegram');
  return v || 0;
}

async function setLastTelegramAt(ts) {
  return setMetaValue('/__bm_last_telegram', ts);
}

async function getMarketingCountForToday() {
  const key = '/__bm_marketing_count_' + new Date().toISOString().slice(0, 10);
  const v = await getMetaValue(key);
  return v || 0;
}

async function incrementMarketingCount() {
  const key = '/__bm_marketing_count_' + new Date().toISOString().slice(0, 10);
  const current = await getMetaValue(key);
  const next = (current || 0) + 1;
  await setMetaValue(key, next);
  return next;
}

// Push event - this is where notifications are received (works even when app is closed!)
// Compatible with: Chrome, Firefox, Safari 16.4+, Edge, Opera, Samsung Internet, Brave, Vivaldi
// Works on: Android lock screen, iOS lock screen (PWA), macOS/Windows/Linux notification center
// Samsung Internet 14+: Full push support with vibration
// Huawei Browser: Push via Chrome engine
// UC Browser: Limited — basic notifications only
self.addEventListener('push', (event) => {
  console.log('[SW v7] 🔔 Push event received!');

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

  // Parse the push payload (handle JSON, text, and ArrayBuffer)
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
      console.log('[SW v7] Push payload parsed:', data.title);
    } catch (jsonErr) {
      // Try plain text fallback
      try {
        const text = event.data.text();
        if (text) {
          // Try to parse text as JSON (some servers send JSON as text)
          try {
            const parsed = JSON.parse(text);
            data = { ...data, ...parsed };
          } catch (e) {
            data.body = text;
          }
        }
        console.log('[SW v7] Push payload as text:', (text || '').substring(0, 50));
      } catch (textErr) {
        // Try ArrayBuffer fallback
        try {
          const ab = event.data.arrayBuffer();
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(ab);
          if (text) data.body = text;
        } catch (abErr) {
          console.error('[SW v7] Could not parse push data in any format');
        }
      }
    }
  }

  // CRITICAL: Use unique tag per message so multiple notifications show
  // Using same tag collapses notifications into one
  const uniqueTag = data.tag || ('trade-alert-' + Date.now());

  const source = data.source || 'marketing';

  // Build notification options — KEEP IT SIMPLE for max cross-browser compat
  // LOCKSCREEN OPTIMIZED: requireInteraction=true keeps notification visible until dismissed
  const options = {
    body: data.body || 'Tap to view',
    icon: data.icon || '/bullmoney-logo.png',
    badge: data.badge || '/B.png',
    tag: uniqueTag,
    renotify: true,  // Re-alert even if same tag
    requireInteraction: data.requireInteraction !== false, // DEFAULT TRUE for lockscreen
    silent: false,    // ALWAYS play sound — critical for lock screen visibility
    timestamp: Date.now(), // Shows time on lockscreen (Android/Windows)
    data: {
      url: data.url || '/',
      channel: data.channel || 'trades',
      timestamp: Date.now(),
      messageId: data.tag,
    },
  };

  // Vibration pattern per channel type — Android/Samsung/Huawei
  try {
    if (data.channel === 'vip') {
      options.vibrate = [300, 100, 300, 100, 300, 100, 300]; // Long urgent
    } else if (data.channel === 'trades') {
      options.vibrate = [200, 100, 200, 100, 200]; // Trade alert
    } else if (data.channel === 'news') {
      options.vibrate = [150, 75, 150]; // Short news
    } else {
      options.vibrate = [200, 100, 200]; // Default
    }
  } catch (e) {}

  // Add action buttons (Chrome/Edge/Samsung Internet, ignored by Safari/Firefox)
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
  event.waitUntil((async () => {
    try {
      if (source === 'telegram') {
        await setLastTelegramAt(Date.now());
      } else {
        const lastTelegramAt = await getLastTelegramAt();
        if (Date.now() - lastTelegramAt < TELEGRAM_COOLDOWN_MS) {
          console.log('[SW v7] Skipping marketing push due to recent Telegram alert');
          return;
        }
        const marketingCount = await getMarketingCountForToday();
        if (marketingCount >= MARKETING_LIMIT_PER_DAY) {
          console.log('[SW v7] Skipping marketing push (daily limit reached)');
          return;
        }
        await incrementMarketingCount();
      }

      await self.registration.showNotification(data.title, options);
      console.log('[SW v7] ✅ Notification displayed:', data.title);

      // Track delivery (fire-and-forget)
      fetch('/api/notifications/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delivered',
          tag: uniqueTag,
          channel: data.channel,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch (err) {
      console.error('[SW v7] showNotification failed, trying minimal:', err);
      // Absolute minimal fallback — works on ALL browsers
      return self.registration.showNotification(data.title || 'BullMoney', {
        body: data.body || 'New alert',
        icon: '/bullmoney-logo.png',
      });
    }
  })());
});

// Notification click event - opens the app when user taps notification
// Compatible with all browsers including iOS Safari PWA, Samsung Internet, Huawei
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v7] Notification clicked:', event.action);

  // Always close the notification first
  event.notification.close();

  // If user clicked dismiss action, just close
  if (event.action === 'dismiss') {
    // Track dismiss
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismissed',
        tag: event.notification.tag,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
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
        console.error('[SW v7] Notification click error:', err);
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
  console.log('[SW v7] ⚠️ Push subscription changed — re-subscribing...');

  event.waitUntil(
    (async () => {
      try {
        // Re-subscribe with the same options
        const newSubscription = await self.registration.pushManager.subscribe(
          event.oldSubscription?.options || {
            userVisibleOnly: true,
          }
        );

        console.log('[SW v7] Got new subscription, sending to server...');

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
          console.log('[SW v7] ✅ Subscription refreshed successfully');
        } else {
          console.error('[SW v7] ❌ Server rejected new subscription:', response.status);
        }
      } catch (err) {
        console.error('[SW v7] ❌ Failed to refresh subscription:', err);
      }
    })()
  );
});