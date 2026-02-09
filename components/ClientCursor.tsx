"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { detectBrowser } from '@/lib/browserDetection';

// Dynamically import TargetCursor to avoid SSR issues
const TargetCursor = dynamic(() => import('@/components/TargetCursor'), {
  ssr: false,
  loading: () => null,
});

/**
 * Client-side wrapper for the TargetCursor component
 * Renders on both desktop and mobile devices
 * Shows a trading TP target that follows mouse/touch and spins
 * 
 * DISABLED in in-app browsers (Instagram, TikTok, etc.) to prevent crashes
 */
export function ClientCursor() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const browserInfo = detectBrowser();
    if (browserInfo.shouldReduceAnimations) {
      console.log('[ClientCursor] Disabled for:', browserInfo.browserName);
      setShouldShow(false);
      return;
    }
    
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
    
    // Skip on very low-memory touch devices
    if (isTouchDevice && browserInfo.isVeryLowMemoryDevice) {
      setShouldShow(false);
      return;
    }

    // Show on both desktop and mobile when safe
    setShouldShow(true);
  }, []);

  if (!shouldShow || !isMounted || typeof document === 'undefined') return null;

  return createPortal(
    <TargetCursor 
      targetSelector="a, button, input, .cursor-target, .interactive-object, [role='button']"
      autoMoveSelector="button, a, input, .cursor-target"
      spinDuration={2.5}
      hideDefaultCursor={false} // ALWAYS show real cursor - custom cursor is decorative only
      idleTimeout={5}
      enableOnMobile={true}
    />,
    document.body
  );
}

export default ClientCursor;
