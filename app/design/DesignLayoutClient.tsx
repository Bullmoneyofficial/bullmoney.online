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
    // Only corrects the initial jump if the user has not interacted yet.
    let userInteracted = false;
    const markInteracted = () => { userInteracted = true; };
    window.addEventListener('pointerdown', markInteracted, { passive: true });
    window.addEventListener('touchstart', markInteracted, { passive: true });
    window.addEventListener('wheel', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted, { passive: true });

    const guardOnce = () => {
      if (!userInteracted && window.scrollY > 80) {
        window.scrollTo(0, 0);
      }
    };

    const timer = setTimeout(guardOnce, 250);
    const timer2 = setTimeout(guardOnce, 900);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
      window.removeEventListener('wheel', markInteracted);
      window.removeEventListener('keydown', markInteracted);
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
