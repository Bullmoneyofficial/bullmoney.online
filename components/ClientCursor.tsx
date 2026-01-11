"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import TargetCursor to avoid SSR issues
const TargetCursor = dynamic(() => import('@/components/TargertCursor'), {
  ssr: false,
  loading: () => null,
});

/**
 * Client-side wrapper for the TargetCursor component
 * Only renders on desktop devices with hover capability
 * Prevents hydration issues and SSR errors
 */
export function ClientCursor() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show on desktop devices with hover capability (non-touch primary devices)
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isLargeScreen = window.innerWidth >= 768;
    
    // Also check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setShouldShow(isDesktop && isLargeScreen && !prefersReducedMotion);

    // Update on resize
    const handleResize = () => {
      const isDesktopNow = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const isLargeScreenNow = window.innerWidth >= 768;
      setShouldShow(isDesktopNow && isLargeScreenNow && !prefersReducedMotion);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!shouldShow) return null;

  return (
    <TargetCursor 
      targetSelector="a, button, input, .cursor-target, .interactive-object, [role='button']"
      autoMoveSelector="button, a, input, .cursor-target"
      spinDuration={2}
      hideDefaultCursor={true}
      idleTimeout={5}
    />
  );
}

export default ClientCursor;
