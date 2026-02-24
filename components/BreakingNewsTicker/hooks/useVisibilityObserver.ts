"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observes whether the target element is visible in the viewport.
 * Returns [ref, isVisible] — attach `ref` to the container element.
 */
export function useVisibilityObserver(threshold = 0.1) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [threshold]);

  return { containerRef, isVisible } as const;
}
