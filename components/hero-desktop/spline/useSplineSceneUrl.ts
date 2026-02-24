import { useEffect, useMemo, useRef, useState } from 'react';

import { getCachedSplineScene } from './splineCache';

function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Returns the fastest-available URL for a Spline scene.
 *
 * If the scene is cached in memory, this creates a blob URL for instant loads.
 * Blob URLs are revoked on change/unmount to prevent memory leaks.
 */
export function useSplineSceneUrl(sceneUrl: string): string {
  const [resolved, setResolved] = useState(sceneUrl);
  const lastBlobUrlRef = useRef<string | null>(null);

  // Keep stable for the sceneUrl; resolve synchronously.
  const nextResolved = useMemo(() => getCachedSplineScene(sceneUrl), [sceneUrl]);

  useEffect(() => {
    // Revoke any previous blob URL before replacing it.
    if (lastBlobUrlRef.current && lastBlobUrlRef.current !== nextResolved) {
      try {
        URL.revokeObjectURL(lastBlobUrlRef.current);
      } catch {
        // noop
      }
      lastBlobUrlRef.current = null;
    }

    setResolved(nextResolved);

    // Revoke on unmount.
    return () => {
      if (lastBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(lastBlobUrlRef.current);
        } catch {
          // noop
        }
        lastBlobUrlRef.current = null;
      }
    };
  }, [nextResolved]);

  useEffect(() => {
    if (isBlobUrl(resolved)) {
      lastBlobUrlRef.current = resolved;
    }
  }, [resolved]);

  return resolved;
}
