import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Star } from 'lucide-react';
import type { UnifiedHubTab } from '@/components/ultimate-hub/types';
import { UNIFIED_HUB_TABS } from '@/components/ultimate-hub/constants';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

interface HubTabCarouselProps {
  activeTab: UnifiedHubTab;
  setActiveTab: (tab: UnifiedHubTab) => void;
  isDesktopFloating?: boolean;
}

export const HubTabCarousel = memo(({ activeTab, setActiveTab, isDesktopFloating = false }: HubTabCarouselProps) => {
  const [favoriteTab, setFavoriteTab] = useState<UnifiedHubTab | null>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('favorite_hub_tab') as UnifiedHubTab) || null;
    }
    return null;
  });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickJump, setShowQuickJump] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [isHoldingLeft, setIsHoldingLeft] = useState(false);
  const [isHoldingRight, setIsHoldingRight] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<number>(0);
  const quickJumpRef = useRef<HTMLDivElement>(null);
  
  const currentIndex = UNIFIED_HUB_TABS.findIndex(t => t.id === activeTab);
  const currentTab = UNIFIED_HUB_TABS[currentIndex];
  const Icon = currentTab?.icon || MessageSquare;
  const prevTab = UNIFIED_HUB_TABS[currentIndex > 0 ? currentIndex - 1 : UNIFIED_HUB_TABS.length - 1];
  const nextTab = UNIFIED_HUB_TABS[currentIndex < UNIFIED_HUB_TABS.length - 1 ? currentIndex + 1 : 0];
  
  // Navigate to previous tab
  const goToPrev = useCallback(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : UNIFIED_HUB_TABS.length - 1;
    setActiveTab(UNIFIED_HUB_TABS[prevIndex].id);
    SoundEffects.click();
  }, [currentIndex, setActiveTab]);
  
  // Navigate to next tab
  const goToNext = useCallback(() => {
    const nextIndex = currentIndex < UNIFIED_HUB_TABS.length - 1 ? currentIndex + 1 : 0;
    setActiveTab(UNIFIED_HUB_TABS[nextIndex].id);
    SoundEffects.click();
  }, [currentIndex, setActiveTab]);
  
  // Jump to specific index
  const jumpToIndex = useCallback((idx: number) => {
    setActiveTab(UNIFIED_HUB_TABS[idx].id);
    setShowQuickJump(false);
    SoundEffects.success();
  }, [setActiveTab]);
  
  // Toggle favorite
  const toggleFavorite = useCallback(() => {
    const newFav = favoriteTab === activeTab ? null : activeTab;
    setFavoriteTab(newFav);
    if (typeof window !== 'undefined') {
      if (newFav) {
        localStorage.setItem('favorite_hub_tab', newFav);
      } else {
        localStorage.removeItem('favorite_hub_tab');
      }
    }
    SoundEffects.success();
  }, [activeTab, favoriteTab]);
  
  // Go to favorite
  const goToFavorite = useCallback(() => {
    if (favoriteTab) {
      setActiveTab(favoriteTab);
      SoundEffects.click();
    }
  }, [favoriteTab, setActiveTab]);
  
  // Double-click handler for center area
  const handleCenterClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < 300) {
      // Double click - go to favorite
      if (favoriteTab) {
        setActiveTab(favoriteTab);
        SoundEffects.success();
      }
    }
    lastClickRef.current = now;
  }, [favoriteTab, setActiveTab]);
  
  // Hold navigation - start
  const startHold = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      setIsHoldingLeft(true);
      goToPrev();
    } else {
      setIsHoldingRight(true);
      goToNext();
    }
    
    // Start rapid navigation after 400ms hold
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        if (direction === 'left') goToPrev();
        else goToNext();
      }, 150);
    }, 400);
  }, [goToPrev, goToNext]);
  
  // Hold navigation - stop
  const stopHold = useCallback(() => {
    setIsHoldingLeft(false);
    setIsHoldingRight(false);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  }, []);
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);
  
  // Close quick jump when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickJumpRef.current && !quickJumpRef.current.contains(e.target as Node)) {
        setShowQuickJump(false);
      }
    };
    if (showQuickJump) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickJump]);
  
  // Load favorite on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorite_hub_tab') as UnifiedHubTab | null;
      if (saved && UNIFIED_HUB_TABS.some(t => t.id === saved)) {
        setFavoriteTab(saved);
      }
    }
  }, []);
  
  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    e.stopPropagation();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !isDragging) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStartX(null);
    setIsDragging(false);
  };
  
  // Mouse handlers for desktop swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStartX(e.clientX);
    setIsDragging(true);
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!touchStartX || !isDragging) return;
    const diff = touchStartX - e.clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStartX(null);
    setIsDragging(false);
    handleCenterClick();
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setTouchStartX(null);
      setIsDragging(false);
    }
  };

  const isFavorite = favoriteTab === activeTab;
  const hasFavorite = favoriteTab !== null;
  const favoriteTabData = hasFavorite ? UNIFIED_HUB_TABS.find(t => t.id === favoriteTab) : null;
  const PrevIcon = prevTab?.icon || MessageSquare;
  const NextIcon = nextTab?.icon || MessageSquare;

  // Desktop floating mode: Show all tabs in a horizontal row (excluding broker)
  if (isDesktopFloating) {
    const filteredTabs = UNIFIED_HUB_TABS.filter(tab => tab.id !== 'broker');
    
    const handleKeyDown = (e: React.KeyboardEvent, tabIndex: number) => {
      const currentIdx = tabIndex;
      let newIdx = currentIdx;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIdx = (currentIdx + 1) % filteredTabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIdx = (currentIdx - 1 + filteredTabs.length) % filteredTabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIdx = filteredTabs.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveTab(filteredTabs[currentIdx].id);
        return;
      }
      
      if (newIdx !== currentIdx) {
        // Focus the new tab
        const buttons = document.querySelectorAll('[data-floating-tab]');
        (buttons[newIdx] as HTMLElement)?.focus();
      }
    };

    return (
      <div className="flex items-center justify-between gap-1 p-2" role="tablist" aria-label="Hub navigation">
        {filteredTabs.map((tab, index) => {
          const TabIcon = tab.icon;
          const isActive = tab.id === activeTab;
          const isFav = tab.id === favoriteTab;
          return (
            <motion.button
              key={tab.id}
              data-floating-tab
              role="tab"
              aria-selected={isActive}
              aria-label={`${tab.label}${isFav ? ' (favorite)' : ''}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onDoubleClick={() => {
                if (favoriteTab === tab.id) {
                  setFavoriteTab(null);
                  localStorage.removeItem('favorite_hub_tab');
                } else {
                  setFavoriteTab(tab.id);
                  localStorage.setItem('favorite_hub_tab', tab.id);
                }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive
                  ? 'bg-white border-black/15 text-black shadow-md'
                  : 'bg-white/60 border-black/5 text-black/50 hover:bg-white hover:border-black/10 hover:text-black/70'
              }`}
              style={isActive ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' } : {}}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                isActive ? 'bg-black/8 border border-black/10' : 'bg-black/5'
              }`}>
                <TabIcon className="w-4 h-4" style={{}} />
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wide whitespace-nowrap hidden xl:block`} style={{}}>
                {tab.label}
              </span>
              {isFav && (
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white border border-black/10 rounded-lg shadow-lg text-[10px] text-black/70 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[10004]">
                {tab.label} {isFav && '⭐'}
                <div className="text-[9px] text-black/40">Double-click to {isFav ? 'unset' : 'set'} favorite</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Mobile/tablet: Keep the carousel navigation
  return (
    <div className="flex flex-col gap-1 p-1 sm:p-2 border-b border-black/10 shrink-0 bg-white/95 backdrop-blur-md relative" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {/* Main Carousel Row */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Favorite Button */}
        <motion.button
          onClick={hasFavorite ? goToFavorite : undefined}
          whileTap={{ scale: hasFavorite ? 0.9 : 1 }}
          className={`group relative flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border transition-all shrink-0 ${
            hasFavorite
              ? 'bg-white border-black/15 text-amber-500 cursor-pointer shadow-sm'
              : 'bg-white/60 border-black/5 text-black/20 cursor-default'
          }`}
          style={hasFavorite ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' } : {}}
        >
          <Star className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${hasFavorite ? 'fill-amber-500' : ''}`} />
          {/* Hover tooltip - desktop only */}
          {hasFavorite && (
            <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white border border-black/10 rounded-lg shadow-lg text-[10px] text-black/70 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              ⭐ {favoriteTabData?.label}
            </div>
          )}
        </motion.button>
        
        {/* Left Arrow */}
        <motion.button
          onMouseDown={() => startHold('left')}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold('left')}
          onTouchEnd={stopHold}
          animate={{ scale: isHoldingLeft ? 0.85 : 1 }}
          className="group relative flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-black/10 text-black/60 active:bg-black/5 transition-all shrink-0 shadow-sm"
          style={{ boxShadow: isHoldingLeft ? '0 2px 8px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.08)' }}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          {/* Hover tooltip - desktop only */}
          <div className="hidden sm:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white border border-black/10 rounded-lg shadow-lg text-[10px] text-black/70 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 items-center gap-1">
            <PrevIcon className="w-3 h-3" />
            {prevTab?.label}
          </div>
          {isHoldingLeft && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-black/20 pointer-events-none"
            />
          )}
        </motion.button>
        
        {/* Tab Display - Swipeable */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.12 }}
          className="flex-1 min-w-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ touchAction: 'pan-y' }}
        >
          <div 
            className="group relative flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-black/10 backdrop-blur-md active:bg-black/5 shadow-sm transition-all max-w-full"
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
          >
            <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-black/5 border border-black/8 shrink-0">
              <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black/70" style={{ filter: 'none' }} />
            </span>
            <span className="text-[11px] sm:text-sm font-bold text-black whitespace-nowrap uppercase tracking-wide sm:tracking-wider truncate" style={{}}>
              {currentTab?.label}
            </span>
            
            {/* Set as Favorite */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              whileTap={{ scale: 0.85 }}
              className={`p-1 sm:p-1.5 rounded-full transition-all shrink-0 ${
                isFavorite 
                  ? 'text-amber-500 bg-amber-500/10' 
                  : 'text-black/25 active:text-amber-500 active:bg-amber-500/10'
              }`}
            >
              <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </motion.button>
          </div>
        </motion.div>
        
        {/* Right Arrow */}
        <motion.button
          onMouseDown={() => startHold('right')}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold('right')}
          onTouchEnd={stopHold}
          animate={{ scale: isHoldingRight ? 0.85 : 1 }}
          className="group relative flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-black/10 text-black/60 active:bg-black/5 transition-all shrink-0 shadow-sm"
          style={{ boxShadow: isHoldingRight ? '0 2px 8px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.08)' }}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          {/* Hover tooltip - desktop only */}
          <div className="hidden sm:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white border border-black/10 rounded-lg shadow-lg text-[10px] text-black/70 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 items-center gap-1">
            {nextTab?.label}
            <NextIcon className="w-3 h-3" />
          </div>
          {isHoldingRight && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-black/20 pointer-events-none"
            />
          )}
        </motion.button>
        
        {/* Tab Counter - Click to open quick jump */}
        <div className="relative" ref={quickJumpRef}>
          <motion.button
            onClick={() => setShowQuickJump(!showQuickJump)}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg border text-[9px] sm:text-[10px] font-bold shrink-0 transition-all ${
              showQuickJump 
                ? 'bg-black/10 border-black/15 text-black/70' 
                : 'bg-white border-black/8 text-black/50 active:bg-black/5'
            }`}
          >
            <span>{currentIndex + 1}/{UNIFIED_HUB_TABS.length}</span>
            <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform ${showQuickJump ? 'rotate-180' : ''}`} />
          </motion.button>
          
          {/* Quick Jump Dropdown - Full width on mobile */}
          <AnimatePresence>
            {showQuickJump && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed sm:absolute inset-x-2 sm:inset-x-auto top-auto sm:top-full right-auto sm:right-0 bottom-auto mt-2 w-auto sm:w-44 max-h-[60vh] sm:max-h-72 overflow-y-auto bg-white border border-black/10 rounded-xl shadow-2xl z-[100] backdrop-blur-md"
                style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' }}
              >
                <div className="p-1.5 grid grid-cols-2 sm:grid-cols-1 gap-1">
                  <div className="col-span-2 sm:col-span-1 text-[9px] text-black/40 uppercase tracking-wider px-2 py-1">Quick Jump</div>
                  {UNIFIED_HUB_TABS.map((tab, idx) => {
                    const TabIcon = tab.icon;
                    const isActive = idx === currentIndex;
                    const isFav = tab.id === favoriteTab;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => jumpToIndex(idx)}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center gap-1.5 sm:gap-2 px-2 py-2 sm:py-1.5 rounded-lg text-left transition-all ${
                          isActive 
                            ? 'bg-blue-500/15 text-blue-600' 
                            : 'text-black/60 active:bg-black/5'
                        }`}
                      >
                        <span className={`flex items-center justify-center w-6 h-6 sm:w-5 sm:h-5 rounded-md ${
                          isActive ? 'bg-blue-500/20' : 'bg-black/5'
                        }`}>
                          <TabIcon className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </span>
                        <span className="text-[11px] sm:text-xs font-medium flex-1 truncate">{tab.label}</span>
                        {isFav && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Dot Indicators - Smaller gaps on mobile */}
      <div className="flex justify-center items-center gap-1 sm:gap-1.5 py-0.5 sm:py-1 relative">
        {UNIFIED_HUB_TABS.map((tab, idx) => {
          const DotIcon = tab.icon;
          return (
            <div key={tab.id} className="relative">
              <motion.button
                onClick={() => {
                  setActiveTab(tab.id);
                  SoundEffects.click();
                }}
                onMouseEnter={() => setHoveredDot(idx)}
                onMouseLeave={() => setHoveredDot(null)}
                whileTap={{ scale: 0.85 }}
                className={`rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'w-3.5 sm:w-5 h-1.5 sm:h-2 bg-black/70' 
                    : tab.id === favoriteTab 
                      ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-amber-400/60 ring-1 ring-amber-400/40' 
                      : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black/15 active:bg-black/30'
                }`}
                style={idx === currentIndex ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' } : {}}
              />
              {/* Hover label popup - desktop only */}
              <AnimatePresence>
                {hoveredDot === idx && idx !== currentIndex && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    className="hidden sm:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white border border-black/10 rounded-lg shadow-lg whitespace-nowrap z-50 items-center gap-1.5"
                    style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                  >
                    <DotIcon className="w-3 h-3 text-black/60" />
                    <span className="text-[10px] text-black/70 font-medium">{tab.label}</span>
                    {tab.id === favoriteTab && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
});
HubTabCarousel.displayName = 'HubTabCarousel';
