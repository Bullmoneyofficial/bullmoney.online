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
 * Renders on both desktop and mobile devices
 * Shows a trading TP target that follows mouse/touch and spins
 */
export function ClientCursor() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Don't show if user prefers reduced motion
    if (prefersReducedMotion) {
      setShouldShow(false);
      return;
    }

    // Check if mobile/touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(isTouchDevice);
    
    // Show on all devices (desktop with mouse, mobile with touch)
    setShouldShow(true);
  }, []);

  if (!shouldShow) return null;

  return (
    <TargetCursor 
      targetSelector="a, button, input, .cursor-target, .interactive-object, [role='button']"
      autoMoveSelector="button, a, input, .cursor-target"
      spinDuration={2.5}
      hideDefaultCursor={!isMobile} // Only hide default cursor on desktop
      idleTimeout={5}
      enableOnMobile={true}
    />
  );
}

export default ClientCursor;
