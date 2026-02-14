// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCourseDrawerUI, useUIState } from '@/contexts/UIStateContext';

// Lazy-load TradingCourse since it's large and SQL-backed
const TradingCourse = dynamic(() => import('@/components/TradingCourse'), { ssr: false, loading: () => null });

// ============================================================================
// COURSE DRAWER — CartDrawer-style slide-out panel with React Portal
// Matches CartDrawer / ProductsModal style: header, layout, sizing, animations.
// Uses the same SQL-backed course tables (TradingCourse).
// ============================================================================

export function CourseDrawer() {
  const { shouldSkipHeavyEffects } = useUIState();
  const { isOpen, setIsOpen } = useCourseDrawerUI();
  const COURSE_DRAWER_BACKDROP_Z_INDEX = 2147483598;
  const COURSE_DRAWER_PANEL_Z_INDEX = 2147483599;
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [renderContent, setRenderContent] = useState(false);

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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    if (isOpen) {
      html.setAttribute('data-course-open', 'true');
      body.setAttribute('data-course-open', 'true');
      return () => {
        html.removeAttribute('data-course-open');
        body.removeAttribute('data-course-open');
      };
    }
    html.removeAttribute('data-course-open');
    body.removeAttribute('data-course-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setRenderContent(false);
      return;
    }
    // Defer heavy course mount until after the drawer transition.
    const delayMs = shouldSkipHeavyEffects ? 0 : 160;
    const timer = setTimeout(() => setRenderContent(true), delayMs);
    return () => clearTimeout(timer);
  }, [isOpen, shouldSkipHeavyEffects]);

  if (!mounted) return null;

  const close = () => setIsOpen(false);

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
            onClick={close}
            className="fixed inset-0"
            style={{
              zIndex: COURSE_DRAWER_BACKDROP_Z_INDEX,
              background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.2)',
            }}
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
            style={{ zIndex: COURSE_DRAWER_PANEL_Z_INDEX, color: '#1d1d1f', backgroundColor: '#ffffff', colorScheme: 'light' as const }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              <button
                onClick={close}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close course"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                <h2 className="text-lg md:text-xl font-light">Trading Course</h2>
              </div>

              <button
                onClick={close}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Body */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="p-4 md:p-6">
                {renderContent ? (
                  <TradingCourse appearance="drawer" />
                ) : (
                  <div className="flex items-center justify-center py-12 bg-white">
                    <div className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>Loading course…</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
