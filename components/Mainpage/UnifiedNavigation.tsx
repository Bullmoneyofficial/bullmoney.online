"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, X } from 'lucide-react';
import { UI_LAYERS, GAME_UI_CONFIG } from '@/lib/uiLayers';
import { playClick, playHover, playSwipe } from '@/lib/interactionUtils';
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
 * UnifiedNavigation - Game-like navigation that's identical on mobile and desktop
 * Features:
 * - Floating navigation orb in bottom-right
 * - Grid view for all pages
 * - Left/Right arrow navigation
 * - Page indicator at bottom center
 * - Same experience across all devices
 */
export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  currentPage,
  totalPages,
  pages,
  onPageChange,
  accentColor = '#3b82f6',
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
      {/* Page Indicator - Bottom Center */}
      <div
        className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          zIndex: UI_LAYERS.PROGRESS_BAR,
          bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              className="transition-all duration-300"
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
      </div>

      {/* Navigation Arrows - MOBILE OPTIMIZED */}
      {/* Left Arrow - NOW VISIBLE ON ALL DEVICES */}
      <Hint label="Previous page">
        <button
          onClick={handlePrevPage}
          disabled={disabled || currentPage <= 1}
          className={`
            fixed left-2 md:left-4 top-1/2 -translate-y-1/2
            w-11 h-11 md:w-14 md:h-14 rounded-full
            bg-black/70 backdrop-blur-xl border border-white/20
            flex items-center justify-center
            transition-all duration-300 touch-manipulation
            ${disabled || currentPage <= 1 ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'hover:scale-110 active:scale-95 opacity-75 hover:opacity-100'}
          `}
          style={{
            zIndex: UI_LAYERS.NAV_ARROWS,
            boxShadow: currentPage > 1 ? `0 0 20px ${accentColor}40` : 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={() => {
            if (currentPage > 1) playHover();
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.9)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = '';
          }}
          aria-label="Previous page"
        >
          <ChevronLeft
            size={22}
            className="md:w-7 md:h-7"
            style={{ color: currentPage > 1 ? accentColor : 'rgba(255,255,255,0.3)' }}
          />
        </button>
      </Hint>

      {/* Right Arrow - NOW VISIBLE ON ALL DEVICES */}
      <Hint label="Next page">
        <button
          onClick={handleNextPage}
          disabled={disabled || currentPage >= totalPages}
          className={`
            fixed right-2 md:right-4 top-1/2 -translate-y-1/2
            w-11 h-11 md:w-14 md:h-14 rounded-full
            bg-black/70 backdrop-blur-xl border border-white/20
            flex items-center justify-center
            transition-all duration-300 touch-manipulation
            ${disabled || currentPage >= totalPages ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'hover:scale-110 active:scale-95 opacity-75 hover:opacity-100'}
          `}
          style={{
            zIndex: UI_LAYERS.NAV_ARROWS,
            boxShadow: currentPage < totalPages ? `0 0 20px ${accentColor}40` : 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={() => {
            if (currentPage < totalPages) playHover();
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'translate(50%, -50%) scale(0.9)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = '';
          }}
          aria-label="Next page"
        >
          <ChevronRight
            size={22}
            className="md:w-7 md:h-7"
            style={{ color: currentPage < totalPages ? accentColor : 'rgba(255,255,255,0.3)' }}
          />
        </button>
      </Hint>

      {/* Floating Navigation Orb - Bottom Right */}
      <Hint label={isGridOpen ? 'Close navigation' : 'Open navigation'}>
        <button
          onClick={toggleGrid}
          onMouseEnter={() => {
            setIsHovering(true);
            playHover();
          }}
          onMouseLeave={() => setIsHovering(false)}
          disabled={disabled}
          className={`
            fixed
            w-14 h-14 sm:w-16 sm:h-16 rounded-full
            bg-black/80 backdrop-blur-2xl border-2
            flex items-center justify-center
            transition-all duration-300
            hover:scale-110 active:scale-95
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            zIndex: UI_LAYERS.NAV_MOBILE_FAB,
            borderColor: accentColor,
            boxShadow: `0 0 30px ${accentColor}60, 0 4px 20px rgba(0,0,0,0.5)`,
            bottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))',
            right: 'calc(0.75rem + env(safe-area-inset-right, 0px))',
          }}
          aria-label={isGridOpen ? 'Close navigation' : 'Open navigation'}
        >
          <div className="relative">
            <Grid3x3 size={24} className="sm:w-7 sm:h-7" style={{ color: accentColor }} />
            {/* Page number badge */}
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: accentColor,
                color: 'white',
                boxShadow: `0 0 10px ${accentColor}`,
              }}
            >
              {currentPage}
            </div>
          </div>
        </button>
      </Hint>

      {/* Grid Overlay - Full Screen Navigation */}
      {isGridOpen && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300"
          style={{ zIndex: UI_LAYERS.NAV_MOBILE_OVERLAY }}
          onClick={() => {
            setIsGridOpen(false);
            playClick();
          }}
        >
          {/* Close button */}
          <Hint label="Close">
            <button
              onClick={toggleGrid}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              onMouseEnter={() => playHover()}
              aria-label="Close navigation"
            >
              <X size={24} style={{ color: accentColor }} />
            </button>
          </Hint>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Navigate
          </h2>

          {/* Page Grid */}
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl overflow-y-auto max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageSelect(page.id)}
                onMouseEnter={() => playHover()}
                className={`
                  relative p-6 rounded-2xl border-2
                  transition-all duration-300
                  hover:scale-105 active:scale-95
                  ${page.id === currentPage ? 'ring-2' : ''}
                `}
                style={{
                  backgroundColor: page.id === currentPage ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                  borderColor: page.id === currentPage ? accentColor : 'rgba(255,255,255,0.1)',
                  boxShadow: page.id === currentPage ? `0 0 30px ${accentColor}40` : 'none',
                  ['--ring-color' as any]: accentColor,
                }}
              >
                {/* Page number badge */}
                <div
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: page.id === currentPage ? accentColor : 'rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                >
                  {page.id}
                </div>

                {/* Page label */}
                <div className="text-left mt-2">
                  <h3 className="text-lg font-bold text-white mb-1">{page.label || page.labelA || `Page ${page.id}`}</h3>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{page.type}</p>
                </div>

                {/* Current page indicator */}
                {page.id === currentPage && (
                  <div
                    className="absolute bottom-3 left-3 right-3 h-1 rounded-full"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 10px ${accentColor}`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedNavigation;
