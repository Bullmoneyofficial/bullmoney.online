// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, X, User } from 'lucide-react';
import { StoreAccountPageContent } from '@/app/store/account/page';
import { useUIState } from '@/contexts/UIStateContext';

interface StoreAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoreAccountDrawer({ isOpen, onClose }: StoreAccountDrawerProps) {
  const BACKDROP_Z = 2147483600;
  const PANEL_Z = 2147483601;
  const { shouldSkipHeavyEffects } = useUIState();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    } else {
      mediaQuery.addListener(updateMatch);
    }

    return () => {
      if (mediaQuery.addEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      } else {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      html.setAttribute('data-account-drawer-open', 'true');
      body.setAttribute('data-account-drawer-open', 'true');
      return () => {
        html.removeAttribute('data-account-drawer-open');
        body.removeAttribute('data-account-drawer-open');
      };
    }

    html.removeAttribute('data-account-drawer-open');
    body.removeAttribute('data-account-drawer-open');
  }, [isOpen]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={shouldSkipHeavyEffects ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldSkipHeavyEffects ? undefined : { opacity: 0 }}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ zIndex: BACKDROP_Z, background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.2)' }}
          />

          <motion.div
            initial={shouldSkipHeavyEffects ? false : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={shouldSkipHeavyEffects ? undefined : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { type: 'tween', duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[92vh] overflow-hidden'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden'
            }
            style={{ zIndex: PANEL_Z, color: '#1d1d1f', backgroundColor: '#ffffff', colorScheme: 'light' as const }}
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10 shrink-0">
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close account drawer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                <h2 className="text-lg md:text-xl font-light">My Account</h2>
              </div>

              <button
                onClick={onClose}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close account drawer"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
              <StoreAccountPageContent embedded />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawerContent, document.body);
}

export default StoreAccountDrawer;
