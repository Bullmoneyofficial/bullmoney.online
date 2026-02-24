'use client';

/**
 * DeferredMount.tsx
 *
 * Viewport-aware wrapper that defers rendering children until the host
 * element enters the viewport (+ rootMargin). Uses `content-visibility: auto`
 * to paint-skip off-screen subtrees at zero cost.
 */

import { useEffect, useRef, useState } from 'react';

interface DeferredMountProps {
  children: React.ReactNode;
  /** IntersectionObserver rootMargin — how early to start loading. Default "400px". */
  rootMargin?: string;
  /** Shown while the section has not yet entered the viewport. */
  fallback?: React.ReactNode;
}

export function DeferredMount({
  children,
  rootMargin = '400px',
  fallback = null,
}: DeferredMountProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const node = hostRef.current;

    // Immediately activate if IntersectionObserver is unavailable (SSR / old browser)
    if (!node || typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [ready, rootMargin]);

  return (
    <div
      ref={hostRef}
      style={{
        contentVisibility: ready ? 'visible' : 'auto',
        containIntrinsicSize: 'auto 600px',
      }}
    >
      {ready ? children : fallback}
    </div>
  );
}
