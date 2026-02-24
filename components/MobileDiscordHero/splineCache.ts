import { SPLINE_SCENES } from './constants';

export const SPLINE_CACHE_NAME = 'spline-scenes-v1';
export const SPLINE_MEMORY_CACHE = new Map<string, ArrayBuffer>();
let splineCacheInitialized = false;
export const hasCacheAPI = typeof window !== 'undefined' && 'caches' in window;

function getGlobalMemoryCache(): Record<string, ArrayBuffer> {
  if (typeof window !== 'undefined' && (window as any).__SPLINE_MEMORY_CACHE__) {
    return (window as any).__SPLINE_MEMORY_CACHE__;
  }
  return {};
}

export async function initSplineCache(): Promise<void> {
  if (splineCacheInitialized || typeof window === 'undefined') return;
  splineCacheInitialized = true;

  const startTime = performance.now();
  const defaultScene = SPLINE_SCENES[0];
  console.log('[SplineCache] Initializing - caching default scene only...');

  const globalCache = getGlobalMemoryCache();
  Object.entries(globalCache).forEach(([scene, buffer]) => {
    if (!SPLINE_MEMORY_CACHE.has(scene)) {
      SPLINE_MEMORY_CACHE.set(scene, buffer);
      console.log(`[SplineCache] Synced ${scene} from global cache`);
    }
  });

  try {
    const cache = hasCacheAPI ? await caches.open(SPLINE_CACHE_NAME) : null;
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

    console.log(`[SplineCache] Init done in ${(performance.now() - startTime).toFixed(1)}ms`);
  } catch (err) {
    console.warn('[SplineCache] Cache initialization failed:', err);
  }
}

export function getCachedSplineScene(scene: string): string {
  let buffer = SPLINE_MEMORY_CACHE.get(scene);

  if (!buffer) {
    const globalCache = getGlobalMemoryCache();
    buffer = globalCache[scene];
    if (buffer) {
      SPLINE_MEMORY_CACHE.set(scene, buffer);
    }
  }

  if (buffer) {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    return URL.createObjectURL(blob);
  }
  return scene;
}

export function isSplineCached(scene: string): boolean {
  if (SPLINE_MEMORY_CACHE.has(scene)) return true;
  const globalCache = getGlobalMemoryCache();
  return !!globalCache[scene];
}

export async function resetAndReinitSplineCache(): Promise<void> {
  splineCacheInitialized = false;
  await initSplineCache();
}

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => initSplineCache(), { timeout: 100 });
  } else {
    setTimeout(initSplineCache, 0);
  }

  const defaultLink = document.createElement('link');
  defaultLink.rel = 'preload';
  defaultLink.as = 'fetch';
  defaultLink.href = SPLINE_SCENES[0];
  defaultLink.crossOrigin = 'anonymous';
  document.head.appendChild(defaultLink);
}
