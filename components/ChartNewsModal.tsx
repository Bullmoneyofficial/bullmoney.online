"use client";

/**
 * ChartNewsModal - Modal wrapper for Chart News (formerly inline on page)
 * Uses UIStateContext for state management like other modals
 */

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { X, BarChart3, Newspaper } from 'lucide-react';
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useChartNewsUI } from '@/contexts/UIStateContext';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { TradingViewDropdown } from '@/components/Chartnews';
import { NewsFeedButton } from '@/components/NewsFeedModalV2';

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within ChartNewsModal');
  return context;
};

// Main Modal Component - Uses centralized UIStateContext for mutual exclusion
export const ChartNewsModal = memo(() => {
  // Use centralized UI state for mutual exclusion with other modals
  const { isChartNewsOpen: isOpen, setChartNewsOpen: setIsOpen } = useChartNewsUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {createPortal(
        <AnimatePresence>
          {isOpen && <ChartNewsContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
ChartNewsModal.displayName = 'ChartNewsModal';

// Main Content
const ChartNewsContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  const [activeMarket, setActiveMarket] = useState<string>("all");

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  // ESC key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-5 bg-black/95 ${
        shouldDisableBackdropBlur ? '' : 'backdrop-blur-md'
      }`}
      onClick={handleClose}
    >
      {/* Animated tap to close hints - skip on mobile */}
      {!shouldSkipHeavyEffects && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
        >
          <span>↑</span> Tap anywhere to close <span>↑</span>
        </motion.div>
      )}
      {!shouldSkipHeavyEffects && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
        >
          <span>↓</span> Tap anywhere to close <span>↓</span>
        </motion.div>
      )}
      
      {/* Modal */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl"
      >
        {/* Shimmer Border - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
            <ShimmerBorder color="white" intensity="low" />
          </div>
        )}
        
        {/* Inner Container */}
        <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-white/20 overflow-hidden max-h-[92vh] flex flex-col">
          {!shouldSkipHeavyEffects && <ShimmerLine color="white" />}
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Market Analysis Hub</h2>
                <p className="text-xs text-white/60">Real-time charts & news</p>
              </div>
            </div>
            
            <motion.button
              whileHover={isMobile ? {} : { scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors group relative flex items-center justify-center"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ESC</span>
            </motion.button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              {/* Market News Section */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_16px_40px_-38px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Market News</p>
                    <p className="text-sm text-white/80">Stay updated with global market events</p>
                  </div>
                  <span className="hidden sm:inline-flex h-8 px-3 items-center rounded-full bg-white text-black text-xs font-semibold">View Feed</span>
                </div>
                <NewsFeedButton className="w-full" />
              </div>

              {/* Trading Charts Section */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_16px_40px_-38px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Trading Charts</p>
                    <p className="text-sm text-white/80">Professional TradingView charts for all markets</p>
                  </div>
                  <span className="hidden sm:inline-flex h-8 px-3 items-center rounded-full bg-white text-black text-xs font-semibold">View Charts</span>
                </div>
                <TradingViewDropdown onMarketChange={setActiveMarket} showTip={false} quiet={isMobile} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
ChartNewsContent.displayName = 'ChartNewsContent';

export default ChartNewsModal;
