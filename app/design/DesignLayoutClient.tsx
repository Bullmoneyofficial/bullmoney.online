'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const StoreHeader = dynamic(
  () => import('@/components/store/StoreHeader').then(mod => ({ default: mod.StoreHeader })),
  { ssr: false, loading: () => <div className="h-12 w-full bg-black/40" /> }
);

const StoreFooter = dynamic(
  () => import(/* webpackChunkName: "store-footer" */ '@/components/shop/StoreFooter'),
  { ssr: false, loading: () => <div className="h-48 bg-black/50" /> }
);

export function DesignLayoutClient({ children }: { children: React.ReactNode }) {
  // Prevent auto-scroll to canvas on page load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Force manual scroll restoration so browser doesn't jump to anchor/focus
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    // Ensure page starts at top
    window.scrollTo(0, 0);

    // Guard against focus-scroll from Fabric.js canvas init.
    // Only blocks non-user-initiated scroll jumps (no touch/wheel active).
    let userScrolling = false;
    let guardActive = true;

    const onTouchStart = () => { userScrolling = true; };
    const onTouchEnd = () => { setTimeout(() => { userScrolling = false; }, 300); };
    const onWheel = () => { userScrolling = true; setTimeout(() => { userScrolling = false; }, 300); };

    const scrollGuard = () => {
      if (guardActive && !userScrolling && window.scrollY > 80) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', scrollGuard, { passive: true });

    // Disable guard after 4 seconds — canvas should be done initializing by then
    const timer = setTimeout(() => {
      guardActive = false;
      window.removeEventListener('scroll', scrollGuard);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('wheel', onWheel);
    }, 4000);

    return () => {
      guardActive = false;
      clearTimeout(timer);
      window.removeEventListener('scroll', scrollGuard);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('wheel', onWheel);
      window.history.scrollRestoration = prev;
    };
  }, []);

  return (
    <>
      <StoreHeader />
      <div style={{ paddingTop: 48 }}>{children}</div>
      <StoreFooter />
    </>
  );
}
