'use client';

/**
 * useStoreResponsive.ts
 *
 * Detects device breakpoints reactively.  Clean up on unmount — no memory leaks.
 */

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/lib/mobileDetection';

export function useStoreResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(isMobileDevice());
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const ultraWideMq = window.matchMedia('(min-width: 1980px)');

    const updateDesktop = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const updateUltraWide = (e: MediaQueryListEvent) => setIsUltraWide(e.matches);

    setIsDesktop(desktopMq.matches);
    setIsUltraWide(ultraWideMq.matches);

    desktopMq.addEventListener('change', updateDesktop);
    ultraWideMq.addEventListener('change', updateUltraWide);

    return () => {
      desktopMq.removeEventListener('change', updateDesktop);
      ultraWideMq.removeEventListener('change', updateUltraWide);
    };
  }, []);

  return { isMobile, isDesktop, isUltraWide };
}
