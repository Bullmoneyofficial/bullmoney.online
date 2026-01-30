"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS, GAME_UI_CONFIG } from '@/lib/uiLayers';
import { playClick, playHover, playSwipe } from '@/lib/interactionUtils';
import { ShimmerBorder, ShimmerLine, useOptimizedShimmer } from '@/components/ui/UnifiedShimmer';
import { PremiumGlassCard } from './PremiumUIComponents';
import { Hint } from '@/components/ui/Hint';

interface PageConfig {
  id: number;
  label?: string;
  type: string;
  labelA?: string;
  labelB?: string;
}

interface UnifiedNavigationProps {
  currentPage: number;
  totalPages: number;
  pages: PageConfig[];
  onPageChange: (page: number) => void;
  accentColor?: string;
  disabled?: boolean;
}

/**
 * UnifiedNavigation - Premium game-like navigation with blue shimmer
 * Features:
 * - Floating navigation orb in bottom-right with shimmer
 * - Grid view for all pages with premium glass cards
 * - Left/Right arrow navigation with shimmer borders
 * - Page indicator at bottom center
 * - Mobile optimized tap targets (44px+)
 */
export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  currentPage,
  totalPages,
  pages,
  onPageChange,
  accentColor = '#ffffff',
  disabled = false
}) => {
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [_isHovering, setIsHovering] = useState(false);

  const handlePrevPage = () => {
    if (disabled || currentPage <= 1) return;
    playSwipe();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (disabled || currentPage >= totalPages) return;
    playSwipe();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    onPageChange(currentPage + 1);
  };

  const handlePageSelect = (pageNum: number) => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onPageChange(pageNum);
    setIsGridOpen(false);
  };

  const toggleGrid = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    setIsGridOpen(!isGridOpen);
  };

  return (
    <>
      {/* Page Indicator - Bottom Center with Premium Styling */}
      <AnimatePresence>
        {!isGridOpen && (
          <motion.div
            key="page-indicator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.PROGRESS_BAR,
              bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.div
                  key={page}
                  layoutId={`indicator-${page}`}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: page === currentPage ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: page === currentPage ? accentColor : 'rgba(255,255,255,0.3)',
                    boxShadow: page === currentPage ? `0 0 12px ${accentColor}` : 'none',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Arrows - MOBILE OPTIMIZED with Shimmer */}
      {/* Left Arrow */}
      <AnimatePresence>
        {!isGridOpen && (
          <motion.div
            key="left-arrow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div
              className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full overflow-hidden"
              style={{
                zIndex: UI_LAYERS.NAV_ARROWS,
              }}
            >
              <ShimmerBorder 
                color="blue" 
                intensity={currentPage > 1 ? "medium" : "low"}
                speed="normal"
              />
              <button
                onClick={handlePrevPage}
                disabled={disabled || currentPage <= 1}
                className={`
                  relative z-10 w-11 h-11 md:w-14 md:h-14 rounded-full
                  bg-gradient-to-br from-slate-950 to-black
                  border border-white/30
                  flex items-center justify-center
                  transition-all duration-300 touch-manipulation
                  hover:from-slate-900 hover:to-neutral-900
                  ${disabled || currentPage <= 1 ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:scale-110 active:scale-95'}
                `}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px',
                  minWidth: '44px',
                } as React.CSSProperties}
                onMouseEnter={() => {
                  if (currentPage > 1) playHover();
                }}
                aria-label="Previous page"
              >
                <ChevronLeft
                  size={22}
                  className="md:w-7 md:h-7"
                  style={{ color: currentPage > 1 ? accentColor : 'rgba(255,255,255,0.3)' }}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Arrow */}
      <AnimatePresence>
        {!isGridOpen && (
          <motion.div
            key="right-arrow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div
              className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full overflow-hidden"
              style={{
                zIndex: UI_LAYERS.NAV_ARROWS,
              }}
            >
              <ShimmerBorder 
                color="blue" 
                intensity={currentPage < totalPages ? "medium" : "low"}
                speed="normal"
              />
              <button
                onClick={handleNextPage}
                disabled={disabled || currentPage >= totalPages}
                className={`
                  relative z-10 w-11 h-11 md:w-14 md:h-14 rounded-full
                  bg-gradient-to-br from-slate-950 to-black
                  border border-white/30
                  flex items-center justify-center
                  transition-all duration-300 touch-manipulation
                  hover:from-slate-900 hover:to-neutral-900
                  ${disabled || currentPage >= totalPages ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:scale-110 active:scale-95'}
                `}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px',
                  minWidth: '44px',
                } as React.CSSProperties}
                onMouseEnter={() => {
                  if (currentPage < totalPages) playHover();
                }}
                aria-label="Next page"
              >
                <ChevronRight
                  size={22}
                  className="md:w-7 md:h-7"
                  style={{ color: currentPage < totalPages ? accentColor : 'rgba(255,255,255,0.3)' }}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Navigation Orb - Bottom Right with Shimmer */}
      <AnimatePresence>
        {!isGridOpen && (
          <motion.div
            key="nav-fab"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed rounded-full overflow-hidden"
            style={{
              zIndex: UI_LAYERS.NAV_MOBILE_FAB,
              bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              right: 'calc(0.75rem + env(safe-area-inset-right, 0px))',
              width: 'clamp(56px, 16vw, 64px)',
              height: 'clamp(56px, 16vw, 64px)',
            }}
          >
            <ShimmerBorder 
              color="blue" 
              intensity={disabled ? "low" : "medium"}
              speed="normal"
            />
            <motion.button
              onClick={toggleGrid}
              disabled={disabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/30 flex items-center justify-center group"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
                minWidth: '56px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              } as React.CSSProperties}
              onMouseEnter={() => {
                setIsHovering(true);
                if (!disabled) playHover();
              }}
              onMouseLeave={() => setIsHovering(false)}
              aria-label="Open page navigation"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: isGridOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Grid3x3 
                    size={24} 
                    className="text-white group-hover:text-white transition-colors"
                  />
                </motion.div>
                
                {/* Current page badge */}
                <motion.div
                  key={`badge-${currentPage}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 0 12px ${accentColor}`,
                  }}
                >
                  {currentPage}
                </motion.div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid View Modal - Full Screen with Premium Cards */}
      <AnimatePresence>
        {isGridOpen && (
          <motion.div
            key="grid-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsGridOpen(false);
              playClick();
            }}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 z-[UI_LAYERS.NAV_MOBILE_OVERLAY]"
            style={{ zIndex: UI_LAYERS.NAV_MOBILE_OVERLAY }}
          >
            {/* Close button */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute top-6 right-6 rounded-full overflow-hidden"
            >
              <ShimmerBorder 
                color="blue" 
                intensity="low"
                speed="normal"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGrid();
                }}
                className="relative z-10 w-12 h-12 rounded-full bg-slate-950 border border-white/30 hover:bg-slate-900 flex items-center justify-center transition-all hover:scale-110 active:scale-95 touch-manipulation"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px',
                  minWidth: '44px',
                } as React.CSSProperties}
                onMouseEnter={() => playHover()}
                aria-label="Close navigation"
              >
                <X size={20} className="text-white" />
              </button>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-black text-white mb-8 text-center uppercase tracking-wider"
            >
              Navigate Pages
            </motion.h2>

            {/* Page Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl overflow-y-auto max-h-[65vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {pages.map((page, idx) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                >
                  <PremiumGlassCard
                    className="h-full cursor-pointer min-h-[140px]"
                    interactive
                    glowing={page.id === currentPage}
                    onClick={() => handlePageSelect(page.id)}
                  >
                    <div className="relative h-full flex flex-col justify-between p-4">
                      {/* Page number badge */}
                      <motion.div
                        layoutId={`grid-badge-${page.id}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{
                          backgroundColor: page.id === currentPage ? accentColor : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {page.id}
                      </motion.div>

                      {/* Page label */}
                      <div>
                        <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wider">
                          {page.label || page.labelA || `Page ${page.id}`}
                        </h3>
                        <p className="text-xs text-white/60 uppercase tracking-wider">
                          {page.type}
                        </p>
                      </div>

                      {/* Current page indicator */}
                      {page.id === currentPage && (
                        <motion.div
                          layoutId="active-indicator"
                          className="h-1 rounded-full w-full"
                          style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 0 10px ${accentColor}`,
                          }}
                        />
                      )}
                    </div>
                  </PremiumGlassCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

