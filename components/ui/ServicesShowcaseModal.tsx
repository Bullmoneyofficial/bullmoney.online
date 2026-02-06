"use client";

import React, { useEffect, useState, useCallback, lazy, Suspense, useRef, createContext, useContext, memo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Gamepad2, Sparkles, Loader2 } from "lucide-react";
import { UI_Z_INDEX, useUIState } from "@/contexts/UIStateContext";
import { cn } from "@/lib/utils";

// ============================================================================
// LAZY LOADING SYSTEM - Nothing loads until modal opens
// ============================================================================

// Animation freeze context - smart freezing based on visibility and interaction
interface AnimationFreezeState {
  isFrozen: boolean;
  isGameOpen: boolean;
  prefersReducedMotion: boolean;
}
const AnimationFreezeContext = createContext<AnimationFreezeState>({
  isFrozen: false,
  isGameOpen: false,
  prefersReducedMotion: false,
});
export const useAnimationFreeze = () => useContext(AnimationFreezeContext);

// Track if modal has ever been opened - prevents ANY loading until first open
let hasModalEverOpened = false;

// Lazy load ALL heavy components - ONLY when modal actually opens
const AboutContent = lazy(() => import("@/components/AboutContent").then(m => ({ default: m.AboutContent })));
const Pricing = lazy(() => import("@/components/Mainpage/pricing").then(m => ({ default: m.Pricing })));
const VipHeroMain = lazy(() => import("@/app/VIP/heromain"));
const Orb = lazy(() => import("@/components/Mainpage/Orb"));
import { Features } from "@/components/Mainpage/features";
const ProductsSection = lazy(() => import("@/app/VIP/ProductsSection"));
const GameBoyPacman = lazy(() => import("@/app/oldstore/ShopScrollFunnel"));
const Testimonial = lazy(() => import("@/app/Testimonial").then(m => ({ default: m.AboutContent })));
const Footer = lazy(() => import("@/components/Mainpage/footer").then(m => ({ default: m.Footer })));

// Lazy load ShopProvider separately
const ShopProviderLazy = lazy(() => import("@/app/VIP/ShopContext").then(m => ({ default: m.ShopProvider })));

// ============================================================================
// GLOBAL FREEZE STYLES - Injected only when modal is open
// ============================================================================
const SMART_FREEZE_STYLE = `
  /* GLOBAL: Prevent any services modal content from affecting main page */
  .services-modal-portal {
    contain: strict;
    isolation: isolate;
  }

  /* Content-visibility: skip rendering of off-screen sections */
  .services-modal-content .freeze-zone:not(.in-viewport) {
    content-visibility: auto;
    contain-intrinsic-size: 0 500px;
  }
  
  /* Aggressive freeze for off-screen content */
  .services-modal-content .freeze-zone:not(.in-viewport) * {
    animation: none !important;
    transition: none !important;
    will-change: auto !important;
  }
  
  /* During scroll: MAXIMUM PERFORMANCE MODE */
  .services-modal-content.is-scrolling * {
    animation-play-state: paused !important;
    transition: none !important;
    will-change: auto !important;
  }
  
  .services-modal-content.is-scrolling [class*="backdrop-blur"],
  .services-modal-content.is-scrolling [class*="backdrop-filter"] {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  
  .services-modal-content.is-scrolling [class*="shadow-"] {
    box-shadow: none !important;
  }
  
  /* Always keep Orb running */
  .services-modal-content .orb-container,
  .services-modal-content .orb-container * {
    animation-play-state: running !important;
    content-visibility: visible !important;
  }
  
  /* Keep interactive elements responsive */
  .services-modal-content button,
  .services-modal-content [role="button"],
  .services-modal-content a,
  .services-modal-content .freeze-exempt,
  .services-modal-content .freeze-exempt * {
    animation-play-state: running !important;
    transition-duration: 0.15s !important;
    pointer-events: auto !important;
  }
  
  /* GPU layer optimization for visible content */
  .services-modal-content .freeze-zone.in-viewport {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* Reduced motion: respect user preference */
  @media (prefers-reduced-motion: reduce) {
    .services-modal-content *:not(.orb-container):not(.orb-container *) {
      animation: none !important;
      transition: none !important;
    }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Hook for viewport-aware freezing with better performance
function useViewportFreeze(ref: React.RefObject<HTMLElement | null>) {
  const [isInViewport, setIsInViewport] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Use requestAnimationFrame to batch DOM reads
        requestAnimationFrame(() => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      { 
        threshold: 0,
        rootMargin: '200px 0px' // Pre-load 200px before visible
      }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  
  return isInViewport;
}

// Wrapper component for viewport-aware sections with content-visibility
function FreezeZone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInViewport = useViewportFreeze(ref);
  
  return (
    <div 
      ref={ref} 
      className={cn("freeze-zone", isInViewport && "in-viewport", className)}
      style={{
        // CSS containment for better performance
        contain: isInViewport ? 'layout style' : 'strict',
      }}
    >
      {children}
    </div>
  );
}

// Loading spinner component
function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-white animate-spin freeze-exempt" />
      <p className="text-white/60 text-sm">{text}</p>
    </div>
  );
}

// Interactive Orb Section with tips and animations - LAZY LOADED
// Orb is exempt from animation freeze
function InteractiveOrbSection({ onPlayGame }: { onPlayGame: () => void }) {
  const [orbLoaded, setOrbLoaded] = useState(false);
  const freezeState = useAnimationFreeze();

  // Only load orb after a small delay to prioritize visible content
  useEffect(() => {
    const timer = setTimeout(() => setOrbLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FreezeZone className="relative rounded-3xl overflow-hidden border-2 border-white/30 bg-linear-to-br from-black via-blue-950/30 to-black p-4 sm:p-8">
      {/* Static top text - no animation */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-white/30 to-white/30 border border-white/40 backdrop-blur-sm">
          <Gamepad2 className="w-5 h-5 text-white" />
          <span className="text-base font-semibold text-white">🕹️ Hidden Game Inside!</span>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* The Orb area - LAZY LOADED & EXEMPT FROM FREEZE */}
      <div className="relative w-full h-[400px] sm:h-[450px] md:h-[500px] flex items-center justify-center mt-12">
        {/* Orb container is exempt from animation freeze */}
        <div className="w-full h-full max-w-[500px] mx-auto pointer-events-none orb-container freeze-exempt">
          {orbLoaded ? (
            <Suspense fallback={<LoadingSpinner text="Loading Orb..." />}>
              <Orb 
                hue={0} 
                hoverIntensity={0.3} 
                rotateOnHover={false}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-white/20 to-white/20 animate-pulse freeze-exempt" />
            </div>
          )}
        </div>
        {/* Play Button */}
        <button
          type="button"
          onClick={onPlayGame}
          className="absolute z-[200] px-10 py-5 text-xl rounded-full font-bold text-white 
            bg-linear-to-r from-white via-white to-white
            shadow-[0_0_40px_rgba(255, 255, 255,0.6)] hover:shadow-[0_0_80px_rgba(255, 255, 255,0.9)]
            hover:scale-110 active:scale-95
            transition-all duration-300 cursor-pointer
            border-2 border-white/40 hover:border-white/80
            freeze-exempt"
        >
          🎮 Play Pac-Man!
        </button>
      </div>

      {/* Static tip text at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="px-8 py-4 rounded-2xl bg-black/70 border border-white/40 backdrop-blur-md">
          <p className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white via-white to-white">
            🎮 Click the button to play!
          </p>
        </div>
      </div>

      {/* Corner decorations - static */}
      <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-white/50 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-white/50 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-white/50 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-white/50 rounded-br-xl pointer-events-none" />
    </FreezeZone>
  );
}

// Pac-Man Game Modal - Renders via portal to center on screen
function PacManGameModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render anything on server or before mount
  if (!mounted || typeof window === "undefined") return null;
  
  // Don't render portal if not open (prevents DOM manipulation when closed)
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="pacman-game-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/95 backdrop-blur-lg freeze-exempt"
        style={{ zIndex: 2147483646 }} // Just below max z-index
        onClick={onClose}
      >
        <motion.div
          key="pacman-game-modal"
          initial={{ scale: 0.7, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[85vh] sm:max-h-[90vh] overflow-auto rounded-2xl sm:rounded-3xl border-2 border-yellow-400/50 bg-black shadow-[0_0_80px_rgba(250,204,21,0.4)] freeze-exempt"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - larger touch target on mobile */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 inline-flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 transition hover:bg-yellow-400/40 hover:scale-110 active:scale-95 freeze-exempt"
            aria-label="Close modal"
            data-modal-close="true"
          >
            <X size={22} />
          </button>
          
          <div className="p-3 sm:p-4 md:p-6 freeze-exempt">
            {/* Header */}
            <div className="text-center mb-3 sm:mb-4 pt-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-400 to-yellow-400">
                🎮 PAC-MAN ARCADE 🎮
              </h2>
              <p className="text-yellow-400/70 text-xs sm:text-sm mt-1 sm:mt-2">
                Use arrow keys or swipe to move!
              </p>
            </div>
            
            {/* Game container - responsive sizing */}
            <div className="w-full aspect-square max-w-[min(100%,500px)] mx-auto freeze-exempt">
              <Suspense fallback={<LoadingSpinner text="Loading Pac-Man..." />}>
                <GameBoyPacman />
              </Suspense>
            </div>
            
            {/* Mobile hint */}
            <p className="text-center text-yellow-400/50 text-xs mt-3 sm:hidden">
              Tap outside to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

interface ServicesShowcaseModalProps {
  btnText?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  compactMode?: boolean;
}

// Memoized modal content wrapper - prevents re-renders when not needed
const ModalContentWrapper = memo(function ModalContentWrapper({
  contentReady,
  freezeState,
  isScrolling,
  handlePlayGame,
  compact,
}: {
  contentReady: boolean;
  freezeState: AnimationFreezeState;
  isScrolling: boolean;
  handlePlayGame: () => void;
  compact?: boolean;
}) {
  if (!contentReady) {
    return <LoadingSpinner text="Loading services..." />;
  }

  const isCompact = Boolean(compact);

  return (
    <AnimationFreezeContext.Provider value={freezeState}>
      <div className={cn(
        "relative z-10 flex flex-col gap-10 px-3 py-6 sm:px-5 sm:py-8 md:px-8 services-modal-content",
        isScrolling && "is-scrolling",
        isCompact && "gap-6 px-2 py-4 sm:px-4"
      )}
      style={{
        // Optimize compositing
        contain: 'layout style paint',
      }}
      >
        {/* VIP Hero - Lazy loaded with ShopProvider */}
        <FreezeZone>
          <Suspense fallback={<LoadingSpinner text="Loading VIP section..." />}>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black">
              <ShopProviderLazy>
                <VipHeroMain embedded />
              </ShopProviderLazy>
            </div>
          </Suspense>
        </FreezeZone>

        {/* About Content */}
        <FreezeZone>
          <Suspense fallback={<LoadingSpinner text="Loading about..." />}>
            <AboutContent />
          </Suspense>
        </FreezeZone>

        {/* Pricing */}
        <FreezeZone>
          <Suspense fallback={<LoadingSpinner text="Loading pricing..." />}>
            <Pricing />
          </Suspense>
        </FreezeZone>

        {/* Interactive Orb Section - Always visible, never frozen */}
        <InteractiveOrbSection onPlayGame={handlePlayGame} />

        {/* Features */}
        <FreezeZone>
          <Features />
        </FreezeZone>

        {/* Products Section */}
        <FreezeZone>
          <Suspense fallback={<LoadingSpinner text="Loading products..." />}>
            <ShopProviderLazy>
              <ProductsSection />
            </ShopProviderLazy>
          </Suspense>
        </FreezeZone>

        {/* Testimonial */}
        <FreezeZone>
          <Suspense fallback={<LoadingSpinner text="Loading testimonials..." />}>
            <Testimonial />
          </Suspense>
        </FreezeZone>

        {/* Footer */}
        <FreezeZone>
          <Suspense fallback={<LoadingSpinner text="Loading footer..." />}>
            <Footer />
          </Suspense>
        </FreezeZone>
      </div>
    </AnimationFreezeContext.Provider>
  );
});

export default function ServicesShowcaseModal({
  btnText = "View Services",
  isOpen: externalIsOpen,
  onOpenChange,
  showTrigger = true,
  compactMode,
}: ServicesShowcaseModalProps) {
  // Use UIState for centralized state management
  const { 
    isServicesModalOpen, 
    setServicesModalOpen,
    openServicesModal 
  } = useUIState();
  
  const [mounted, setMounted] = useState(false);
  const [shouldRenderContent, setShouldRenderContent] = useState(false); // Controls full unmount
  const [contentReady, setContentReady] = useState(false);
  const [showPacMan, setShowPacMan] = useState(false); // Pac-Man game state
  const [isScrolling, setIsScrolling] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [detectedCompactViewport, setDetectedCompactViewport] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use UIState as single source of truth, with external override support
  const open = externalIsOpen ?? isServicesModalOpen;
  
  // CRITICAL: Complete unmount system - load when open, unload when closed
  // This frees memory and stops ALL background processes for better FPS
  useEffect(() => {
    if (open) {
      // Clear any pending unmount
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
        unmountTimeoutRef.current = null;
      }
      // Immediately allow rendering when opening
      setShouldRenderContent(true);
      hasModalEverOpened = true;
    } else {
      // Delay unmount slightly to allow exit animations
      unmountTimeoutRef.current = setTimeout(() => {
        setShouldRenderContent(false);
        setContentReady(false);
        setShowPacMan(false);
        setIsScrolling(false);
      }, 500); // Wait for exit animation to complete
    }
    
    return () => {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
    };
  }, [open]);
  
  // Smart freeze state - considers game open, scrolling, and reduced motion
  const freezeState: AnimationFreezeState = {
    isFrozen: open && !showPacMan,
    isGameOpen: showPacMan,
    prefersReducedMotion,
  };

  const isCompactViewport = compactMode ?? detectedCompactViewport;
  
  const setOpen = useCallback((value: boolean) => {
    // Update UIState (handles mutual exclusion automatically)
    setServicesModalOpen(value);
    
    // Also call external handler if provided
    if (onOpenChange) {
      onOpenChange(value);
    }
    // Note: Cleanup is now handled by the shouldRenderContent effect
  }, [setServicesModalOpen, onOpenChange]);

  // Handle opening via UIState
  const handleOpen = useCallback(() => {
    openServicesModal();
    if (onOpenChange) {
      onOpenChange(true);
    }
  }, [openServicesModal, onOpenChange]);

  // Handle Pac-Man game open
  const handlePlayGame = useCallback(() => {
    setShowPacMan(true);
  }, []);

  // Handle Pac-Man game close
  const handleCloseGame = useCallback(() => {
    setShowPacMan(false);
  }, []);

  // Handle scroll events - AGGRESSIVE throttling for smooth FPS
  const handleScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Resume animations 200ms after scrolling stops (longer delay = smoother scroll)
    scrollTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsScrolling(false);
      });
    }, 200);
  }, [isScrolling]);

  useEffect(() => {
    setMounted(true);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      setMounted(false);
      mediaQuery.removeEventListener('change', handleChange);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const evaluateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const shortEdge = Math.min(width, height);
      const longEdge = Math.max(width, height);
      const iphone11Width = 414;
      const iphone11Height = 896;

      setDetectedCompactViewport(
        shortEdge <= 430 ||
        (shortEdge <= 480 && longEdge <= iphone11Height + 40) ||
        (width <= iphone11Width && height <= iphone11Height)
      );
    };

    evaluateViewport();
    window.addEventListener("resize", evaluateViewport);
    return () => window.removeEventListener("resize", evaluateViewport);
  }, []);

  // Inject/remove smart freeze styles based on modal state
  useEffect(() => {
    if (!mounted) return;

    if (open) {
      // Inject smart freeze styles
      if (!styleRef.current) {
        const style = document.createElement('style');
        style.id = 'services-modal-smart-freeze-styles';
        style.textContent = SMART_FREEZE_STYLE;
        document.head.appendChild(style);
        styleRef.current = style;
      }
    } else {
      // Remove freeze styles when modal closes
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [open, mounted]);

  // Only prepare content after modal opens - reduces initial load
  useEffect(() => {
    if (open && !contentReady) {
      // Small delay to let modal animation start first
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [open, contentReady]);

  // Manage body scroll via UIState
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, mounted]);

  // EARLY RETURN: If modal has never been opened, render ONLY the trigger button
  // This ensures ZERO lazy imports are resolved until user clicks to open
  if (!mounted || typeof window === "undefined") {
    return showTrigger ? (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold",
          "bg-white text-black shadow-lg transition-transform hover:-translate-y-0.5",
          "dark:bg-white dark:text-black"
        )}
      >
        {btnText}
      </button>
    ) : null;
  }

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold",
            "bg-white text-black shadow-lg transition-transform hover:-translate-y-0.5",
            "dark:bg-white dark:text-black"
          )}
        >
          {btnText}
        </button>
      )}

      {/* CRITICAL: Full unmount system - renders only when shouldRenderContent is true
          When modal closes, everything unmounts after 500ms (for exit animations)
          This frees memory and stops ALL background processes for maximum FPS */}
      {shouldRenderContent && createPortal(
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="services-showcase-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm services-modal-portal",
                isCompactViewport && "items-start pt-8"
              )}
              style={{ zIndex: UI_Z_INDEX.MODAL_BACKDROP }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                key="services-showcase-modal"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className={cn(
                  "relative w-[95vw] max-w-6xl rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl",
                  isCompactViewport && "w-full max-w-[480px] rounded-2xl border-white/5"
                )}
                style={{
                  zIndex: UI_Z_INDEX.MODAL_CONTENT,
                  ...(isCompactViewport ? { margin: "0 auto" } : undefined),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20",
                    isCompactViewport && "right-3 top-3 h-9 w-9"
                  )}
                >
                  <X size={18} />
                </button>

                <div 
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className={cn(
                    "max-h-[85dvh] overflow-y-auto overscroll-contain scroll-smooth",
                    isCompactViewport && "max-h-[78dvh]"
                  )}
                  style={{
                    // GPU acceleration for smooth scrolling
                    transform: 'translateZ(0)',
                    willChange: isScrolling ? 'scroll-position' : 'auto',
                  }}
                >
                  <ModalContentWrapper
                    contentReady={contentReady}
                    freezeState={freezeState}
                    isScrolling={isScrolling}
                    handlePlayGame={handlePlayGame}
                    compact={isCompactViewport}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Pac-Man Game Modal - Only rendered when content should render */}
      {shouldRenderContent && <PacManGameModal isOpen={showPacMan} onClose={handleCloseGame} />}
    </>
  );
}
