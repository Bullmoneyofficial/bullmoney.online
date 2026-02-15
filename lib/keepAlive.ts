/**
 * ✅ COLD START PREVENTION: Keep-alive utility
 * 
 * Client-side utility that periodically pings the warmup endpoint
 * to prevent serverless cold starts. Uses invisible background requests.
 * 
 * FEATURES:
 * - Runs in background during user session
 * - Adapts ping frequency based on user activity
 * - Uses requestIdleCallback to avoid blocking main thread
 * - Minimal bandwidth (HEAD requests only)
 * - Pauses when tab is hidden (battery saving)
 * - Shorter intervals in development mode
 */

// Detect if we're in development mode
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

type WarmupConfig = {
  /** Ping interval when user is active (ms) */
  activeInterval: number;
  /** Ping interval when user is idle (ms) */
  idleInterval: number;
  /** Time until user is considered idle (ms) */
  idleTimeout: number;
  /** API endpoints to keep warm */
  endpoints: string[];
};

// PERFORMANCE OPTIMIZED:
// Dev: Aggressive (2/4 min) - no crons, want fast iteration
// Prod: Relaxed (8/15 min) - Vercel cron handles base warmth, client is supplemental
// This reduces client-side requests and bandwidth usage in production
const DEFAULT_CONFIG: WarmupConfig = {
  activeInterval: isDev ? 2 * 60 * 1000 : 8 * 60 * 1000,  // 2 min dev, 8 min prod
  idleInterval: isDev ? 4 * 60 * 1000 : 15 * 60 * 1000,   // 4 min dev, 15 min prod
  idleTimeout: isDev ? 60 * 1000 : 2 * 60 * 1000,         // 1 min dev, 2 min prod
  endpoints: ['/api/warmup'],
};

let isInitialized = false;
let keepAliveTimer: ReturnType<typeof setTimeout> | null = null;
let isUserActive = true;
let lastActivityTime = Date.now();
let config = DEFAULT_CONFIG;

// Track user activity
const updateActivityTime = () => {
  lastActivityTime = Date.now();
  if (!isUserActive) {
    isUserActive = true;
    // Restart with active interval
    restartKeepAlive();
  }
};

// Check if user is idle
const checkIdleState = () => {
  const timeSinceActivity = Date.now() - lastActivityTime;
  if (timeSinceActivity > config.idleTimeout && isUserActive) {
    isUserActive = false;
    // Restart with idle interval
    restartKeepAlive();
  }
};

// Ping warmup endpoints
const pingWarmup = async () => {
  // Don't ping if page is hidden (save battery/bandwidth)
  if (typeof document !== 'undefined' && document.hidden) {
    return;
  }
  
  // PERFORMANCE: In production, skip ping if we recently pinged
  // This prevents redundant requests when multiple tabs are open
  if (!isDev) {
    const lastPing = parseInt(sessionStorage.getItem('_bm_ping') || '0', 10);
    const minInterval = 5 * 60 * 1000; // 5 min minimum between pings
    if (Date.now() - lastPing < minInterval) {
      return;
    }
    sessionStorage.setItem('_bm_ping', Date.now().toString());
  }

  const pingEndpoint = async (endpoint: string) => {
    try {
      // Use HEAD request for minimal bandwidth
      await fetch(endpoint, {
        method: 'HEAD',
        cache: 'no-store',
        keepalive: true,
      });
    } catch {
      // Silent fail - warmup is best-effort
    }
  };

  // Ping all endpoints in parallel
  await Promise.all(config.endpoints.map(pingEndpoint));
};

// Schedule next ping
const scheduleNextPing = () => {
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
  }

  const interval = isUserActive ? config.activeInterval : config.idleInterval;
  
  keepAliveTimer = setTimeout(() => {
    // Check idle state before pinging
    checkIdleState();
    
    // Use requestIdleCallback to avoid blocking
    if ('requestIdleCallback' in window) {
      (window as Window).requestIdleCallback(() => {
        pingWarmup().then(() => {
          scheduleNextPing();
        });
      }, { timeout: 5000 });
    } else {
      pingWarmup().then(() => {
        scheduleNextPing();
      });
    }
  }, interval);
};

// Restart keep-alive with current interval
const restartKeepAlive = () => {
  if (!isInitialized) return;
  scheduleNextPing();
};

/**
 * Initialize the keep-alive system
 * Call this once in your app's root component
 */
export const initKeepAlive = (customConfig?: Partial<WarmupConfig>) => {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  
  config = { ...DEFAULT_CONFIG, ...customConfig };
  isInitialized = true;

  // Track user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    window.addEventListener(event, updateActivityTime, { passive: true });
  });

  // Handle visibility changes (pause when hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, pause keep-alive
      if (keepAliveTimer) {
        clearTimeout(keepAliveTimer);
        keepAliveTimer = null;
      }
    } else {
      // Page is visible again, immediate ping then restart
      pingWarmup().then(() => {
        scheduleNextPing();
      });
    }
  });

  // Initial ping to warm up immediately
  pingWarmup().then(() => {
    scheduleNextPing();
  });
};

/**
 * Stop the keep-alive system
 */
export const stopKeepAlive = () => {
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = null;
  }
  isInitialized = false;
};

/**
 * Manually trigger a warmup ping
 * Useful before navigation to heavy pages
 */
export const warmupNow = async () => {
  await pingWarmup();
};

/**
 * Pre-warm specific API routes before navigation
 * Call before navigating to pages that use these APIs
 */
export const prewarmRoutes = async (routes: string[]) => {
  if (typeof window === 'undefined') return;
  
  const warmRoute = async (route: string) => {
    try {
      await fetch(route, {
        method: 'HEAD',
        cache: 'no-store',
        keepalive: true,
      });
    } catch {
      // Silent fail
    }
  };

  await Promise.all(routes.map(warmRoute));
};

export default {
  initKeepAlive,
  stopKeepAlive,
  warmupNow,
  prewarmRoutes,
};
