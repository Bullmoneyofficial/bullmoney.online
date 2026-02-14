// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Shield, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useUIState } from '@/contexts/UIStateContext';

// Reuse the existing AdminHubModal logic, but render it embedded (no overlay)
const AdminHubModal = dynamic(() => import('@/components/AdminHubModal'), { ssr: false, loading: () => null });

// ============================================================================
// ADMIN HUB DRAWER — StoreHeader drawer shell
// Matches CourseDrawer / CartDrawer: white background, header spacing/typography,
// slide-in animation (right on mobile, top on desktop), portal + backdrop.
// ============================================================================

export function AdminHubDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Admin Hub should always remain lightweight on all devices.
  // Force skip-heavy-effects for drawer transitions regardless of global state.
  const shouldSkipHeavyEffects = true;
  const ADMIN_DRAWER_BACKDROP_Z_INDEX = 2147483596;
  const ADMIN_DRAWER_PANEL_Z_INDEX = 2147483597;
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', updateMatch);
    else mediaQuery.addListener(updateMatch);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', updateMatch);
      else mediaQuery.removeListener(updateMatch);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldSkipHeavyEffects ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldSkipHeavyEffects ? undefined : { opacity: 0 }}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{
              zIndex: ADMIN_DRAWER_BACKDROP_Z_INDEX,
              background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.2)',
            }}
            data-storeheader-lock-ui="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={shouldSkipHeavyEffects ? false : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={shouldSkipHeavyEffects ? undefined : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            transition={
              shouldSkipHeavyEffects
                ? { duration: 0 }
                : { type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }
            }
            onClick={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh] overflow-hidden'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden'
            }
            style={{
              zIndex: ADMIN_DRAWER_PANEL_Z_INDEX,
              color: '#1d1d1f',
              backgroundColor: '#ffffff',
              colorScheme: 'light' as const,
            }}
            data-storeheader-lock-ui="true"
          >
            {/* Header (Store drawer chrome) */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close admin hub"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <h2 className="text-lg md:text-xl font-light">Admin Hub</h2>
              </div>

              <button
                onClick={onClose}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Body */}
            <div
              className="flex-1 min-h-0 overflow-hidden"
            >
              {/* Embedded AdminHub content (no full-screen overlay, no internal header) */}
              <div
                className="h-full min-h-0 flex flex-col"
                style={{ background: '#ffffff', height: '100%' }}
              >
                <AdminHubModal
                  isOpen={true}
                  onClose={onClose}
                  embedded={true}
                  showHeader={false}
                  bwMode={true}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
