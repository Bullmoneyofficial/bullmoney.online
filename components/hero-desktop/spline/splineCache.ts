export const SPLINE_SCENES = [
  '/scene.splinecode',
  '/scene1.splinecode',
  '/scene2.splinecode',
  '/scene3.splinecode',
  '/scene4.splinecode',
  '/scene5.splinecode',
  '/scene6.splinecode',
];

// Desktop default scene index
export const DESKTOP_DEFAULT_SCENE_INDEX = 1;

// Spline scene names for display
export const SPLINE_SCENE_NAMES: Record<string, string> = {
  '/scene.splinecode': 'Default Scene',
  '/scene1.splinecode': 'Scene 1',
  '/scene2.splinecode': 'Scene 2',
  '/scene3.splinecode': 'Scene 3',
  '/scene4.splinecode': 'Scene 4',
  '/scene5.splinecode': 'Scene 5',
  '/scene6.splinecode': 'Scene 6',
};

// =============================================================================
// SPLINE ULTRA-FAST CACHING SYSTEM
// Target: <10ms load time on cached visits
// =============================================================================
export const SPLINE_CACHE_NAME = 'spline-scenes-v1';
const SPLINE_MEMORY_CACHE = new Map<string, ArrayBuffer>();
let splineCacheInitialized = false;

export const hasCacheAPI = typeof window !== 'undefined' && 'caches' in window;

// Check for pre-populated cache from layout script
function getGlobalMemoryCache(): Record<string, ArrayBuffer> {
  if (typeof window !== 'undefined' && (window as any).__SPLINE_MEMORY_CACHE__) {
    return (window as any).__SPLINE_MEMORY_CACHE__;
  }
  return {};
}

export function resetSplineCacheInitialization(): void {
  splineCacheInitialized = false;
}

export function putSplineSceneInMemoryCache(scene: string, buffer: ArrayBuffer): void {
  SPLINE_MEMORY_CACHE.set(scene, buffer);
}

export function clearSplineMemoryCache(): void {
  SPLINE_MEMORY_CACHE.clear();
}

export function clearGlobalSplineMemoryCache(): void {
  if (typeof window !== 'undefined' && (window as any).__SPLINE_MEMORY_CACHE__) {
    const globalCache = (window as any).__SPLINE_MEMORY_CACHE__ as Record<string, ArrayBuffer>;
    Object.keys(globalCache).forEach(k => delete globalCache[k]);
  }
}

// Preload and cache ONLY the default scene on first visit
// Additional scenes are downloaded on-demand and cached in the app
export async function initSplineCache(): Promise<void> {
  if (splineCacheInitialized || typeof window === 'undefined') return;
  splineCacheInitialized = true;

  const startTime = performance.now();
  const defaultScene = SPLINE_SCENES[0]; // scene1 always loads
  console.log('[SplineCache] Initializing - caching default scene only...');

  // First, sync from global memory cache (populated by layout script)
  const globalCache = getGlobalMemoryCache();
  Object.entries(globalCache).forEach(([scene, buffer]) => {
    if (!SPLINE_MEMORY_CACHE.has(scene)) {
      SPLINE_MEMORY_CACHE.set(scene, buffer);
      console.log(`[SplineCache] Synced ${scene} from global cache`);
    }
  });

  try {
    // Open persistent cache (if available)
    const cache = hasCacheAPI ? await caches.open(SPLINE_CACHE_NAME) : null;

    // Only cache the default scene on init
    try {
      if (SPLINE_MEMORY_CACHE.has(defaultScene)) {
        console.log(`[SplineCache] ${defaultScene} already in memory`);
      } else {
        const cachedResponse = cache ? await cache.match(defaultScene) : null;
        if (cachedResponse) {
          const buffer = await cachedResponse.arrayBuffer();
          SPLINE_MEMORY_CACHE.set(defaultScene, buffer);
          console.log(
            `[SplineCache] ${defaultScene} loaded from Cache API in ${(performance.now() - startTime).toFixed(1)}ms`,
          );
        } else {
          console.log(`[SplineCache] Fetching ${defaultScene} from network...`);
          const response = await fetch(defaultScene, {
            cache: 'force-cache',
            priority: 'high' as RequestPriority,
          });
          if (response.ok) {
            const responseClone = response.clone();
            if (cache) await cache.put(defaultScene, responseClone);
            const buffer = await response.arrayBuffer();
            SPLINE_MEMORY_CACHE.set(defaultScene, buffer);
            console.log(`[SplineCache] ${defaultScene} cached in ${(performance.now() - startTime).toFixed(1)}ms`);
          }
        }
      }
    } catch (err) {
      console.warn(`[SplineCache] Failed to cache ${defaultScene}:`, err);
    }

    // Extra scenes (2-7) are NOT auto-restored — they require explicit download
    console.log(`[SplineCache] Init done in ${(performance.now() - startTime).toFixed(1)}ms`);
  } catch (err) {
    console.warn('[SplineCache] Cache initialization failed:', err);
  }
}

// Get cached scene URL (creates blob URL from memory cache for fastest load)
export function getCachedSplineScene(scene: string): string {
  // First check local memory cache
  let buffer = SPLINE_MEMORY_CACHE.get(scene);

  // Then check global cache from layout
  if (!buffer) {
    const globalCache = getGlobalMemoryCache();
    buffer = globalCache[scene];
    if (buffer) {
      SPLINE_MEMORY_CACHE.set(scene, buffer); // Sync to local
    }
  }

  if (buffer) {
    // Create blob URL from cached buffer - browser loads this instantly
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    return URL.createObjectURL(blob);
  }
  return scene; // Not cached — fall back to direct URL so Spline still loads
}

// Check if scene is cached (for instant load detection)
export function isSplineCached(scene: string): boolean {
  if (SPLINE_MEMORY_CACHE.has(scene)) return true;
  const globalCache = getGlobalMemoryCache();
  return !!globalCache[scene];
}

function ensureDefaultPreloadLink(): void {
  if (typeof document === 'undefined') return;
  const href = SPLINE_SCENES[0];
  const existing = document.head.querySelector(`link[rel="preload"][as="fetch"][href="${href}"]`);
  if (existing) return;

  // Also preload with link tag for browser-level caching (default scene only)
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'preload';
  defaultLink.as = 'fetch';
  defaultLink.href = href;
  defaultLink.crossOrigin = 'anonymous';
  document.head.appendChild(defaultLink);
}

// Initialize cache immediately on module load (before component renders)
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for non-blocking initialization
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => initSplineCache(), { timeout: 100 });
  } else {
    setTimeout(initSplineCache, 0);
  }
  ensureDefaultPreloadLink();
}
