'use client';

import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gamepad2, X } from 'lucide-react';
import { useGamesDrawerUI } from '@/contexts/UIStateContext';

const GamesPageClient = dynamic(
  () => import('@/app/games/GamesPageClient').then(mod => ({ default: mod.GamesPageClient })),
  { ssr: false, loading: () => <div className="min-h-[40vh] w-full bg-[#0a0a0c]" /> }
);

export function GamesDrawer() {
  const { isOpen, setIsOpen } = useGamesDrawerUI();
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop/mobile for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const closeDrawer = () => setIsOpen(false);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop - Highest z-index minus 1 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={closeDrawer}
            className="fixed inset-0"
            style={{ zIndex: 2147483646, background: 'rgba(0,0,0,0.3)' }}
          />

          {/* Drawer Panel - 75% width on desktop, full width on mobile */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed top-0 right-0 bottom-0 bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom ${
              isDesktop 
                ? 'w-[75vw] max-w-none' // 75% width on desktop
                : 'w-full max-w-full'   // Full width on mobile
            }`}
            style={{
              zIndex: 2147483647,
              color: '#1d1d1f',
              height: '100vh',
              maxHeight: '100vh',
              minHeight: '100vh',
              width: isDesktop ? undefined : '100vw',
              maxWidth: isDesktop ? undefined : '100vw',
              minWidth: 0,
              overscrollBehavior: 'contain', // Prevent page scroll when drawer scrolls
              pointerEvents: 'auto', // Ensure interactions work
              isolation: 'isolate', // Create new stacking context
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            data-apple-section
            role="dialog"
            aria-modal="true"
            aria-label="Games drawer"
          >
            <div className="flex-none flex items-center justify-between p-4 md:p-6 border-b border-black/10 bg-white">
              <button
                onClick={closeDrawer}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
                <h2 className="text-lg md:text-xl font-light">Games</h2>
              </div>

              <button
                onClick={closeDrawer}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Scrollable content area with enhanced desktop scrolling */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto overscroll-contain games-drawer-scroll ${
                isDesktop ? 'scroll-smooth' : ''
              }`}
              data-modal-scroll
              style={{
                background: '#0a0a0c',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                minWidth: 0,
                // Enhanced desktop scrolling
                scrollbarWidth: isDesktop ? 'thin' : 'none',
                scrollbarColor: isDesktop ? 'rgba(255,255,255,0.3) transparent' : 'transparent',
                // Ensure scrolling works properly
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'auto',
              }}
            >
              <div 
                style={{
                  minHeight: '100%',
                  minWidth: 0,
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                }}
              >
                <GamesPageClient embedMode />
              </div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return (
    <>
      <style jsx>{`
        /* Desktop scrollbar styling */
        @media (min-width: 1024px) {
          .games-drawer-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .games-drawer-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          .games-drawer-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }
          .games-drawer-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        }
      `}</style>
      {createPortal(drawerContent, document.body)}
    </>
  );
}

export default GamesDrawer;
