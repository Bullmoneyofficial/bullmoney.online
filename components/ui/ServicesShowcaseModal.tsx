"use client";

import React, { useEffect, useState, useCallback, lazy, Suspense, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Gamepad2, Sparkles, Loader2 } from "lucide-react";
import { UI_Z_INDEX, useUIState } from "@/contexts/UIStateContext";
import { cn } from "@/lib/utils";

// Animation freeze context - pauses all animations except Orb for FPS optimization
const AnimationFreezeContext = createContext<boolean>(false);
export const useAnimationFreeze = () => useContext(AnimationFreezeContext);

// Lazy load ALL heavy components - only load when modal opens
const AboutContent = lazy(() => import("@/components/AboutContent").then(m => ({ default: m.AboutContent })));
const Pricing = lazy(() => import("@/components/Mainpage/pricing").then(m => ({ default: m.Pricing })));
const VipHeroMain = lazy(() => import("@/app/VIP/heromain"));
const Orb = lazy(() => import("@/components/Mainpage/Orb"));
const Features = lazy(() => import("@/components/Mainpage/features").then(m => ({ default: m.Features })));
const ProductsSection = lazy(() => import("@/app/VIP/ProductsSection"));
const GameBoyPacman = lazy(() => import("@/app/shop/ShopScrollFunnel"));
const Testimonial = lazy(() => import("@/app/Testimonial").then(m => ({ default: m.AboutContent })));
const Footer = lazy(() => import("@/components/Mainpage/footer").then(m => ({ default: m.Footer })));

// Lazy load ShopProvider separately
const ShopProviderLazy = lazy(() => import("@/app/VIP/ShopContext").then(m => ({ default: m.ShopProvider })));

// CSS styles to freeze animations (injected when modal is open)
const FREEZE_ANIMATIONS_STYLE = `
  .services-modal-content *:not(.orb-container):not(.orb-container *) {
    animation-play-state: paused !important;
    transition-duration: 0s !important;
  }
  .services-modal-content .freeze-exempt,
  .services-modal-content .freeze-exempt * {
    animation-play-state: running !important;
    transition-duration: unset !important;
  }
`;

// Loading spinner component
function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-400 animate-spin freeze-exempt" />
      <p className="text-white/60 text-sm">{text}</p>
    </div>
  );
}

// Interactive Orb Section with tips and animations - LAZY LOADED
// Orb is exempt from animation freeze
function InteractiveOrbSection({ onPlayGame }: { onPlayGame: () => void }) {
  const [orbLoaded, setOrbLoaded] = useState(false);
  const isFrozen = useAnimationFreeze();

  // Only load orb after a small delay to prioritize visible content
  useEffect(() => {
    const timer = setTimeout(() => setOrbLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-black via-blue-950/30 to-black p-4 sm:p-8">
      {/* Static top text - no animation */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/40 backdrop-blur-sm">
          <Gamepad2 className="w-5 h-5 text-blue-400" />
          <span className="text-base font-semibold text-blue-300">🕹️ Hidden Game Inside!</span>
          <Sparkles className="w-5 h-5 text-cyan-400" />
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
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 animate-pulse freeze-exempt" />
            </div>
          )}
        </div>
        {/* Play Button */}
        <button
          type="button"
          onClick={onPlayGame}
          className="absolute z-[200] px-10 py-5 text-xl rounded-full font-bold text-white 
            bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500
            shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:shadow-[0_0_80px_rgba(56,189,248,0.9)]
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
        <div className="px-8 py-4 rounded-2xl bg-black/70 border border-blue-400/40 backdrop-blur-md">
          <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
            🎮 Click the button to play!
          </p>
        </div>
      </div>

      {/* Corner decorations - static */}
      <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-blue-400/50 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-blue-400/50 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-cyan-400/50 rounded-br-xl pointer-events-none" />
    </div>
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
          >
            <X size={22} />
          </button>
          
          <div className="p-3 sm:p-4 md:p-6 freeze-exempt">
            {/* Header */}
            <div className="text-center mb-3 sm:mb-4 pt-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400">
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
}

export default function ServicesShowcaseModal({
  btnText = "View Services",
  isOpen: externalIsOpen,
  onOpenChange,
  showTrigger = true,
}: ServicesShowcaseModalProps) {
  // Use UIState for centralized state management
  const { 
    isServicesModalOpen, 
    setServicesModalOpen,
    openServicesModal 
  } = useUIState();
  
  const [mounted, setMounted] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [animationsFrozen, setAnimationsFrozen] = useState(true); // Start frozen for FPS
  const [showPacMan, setShowPacMan] = useState(false); // Pac-Man game state
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Use UIState as single source of truth, with external override support
  const open = externalIsOpen ?? isServicesModalOpen;
  
  const setOpen = useCallback((value: boolean) => {
    // Update UIState (handles mutual exclusion automatically)
    setServicesModalOpen(value);
    
    // Also call external handler if provided
    if (onOpenChange) {
      onOpenChange(value);
    }
    
    // Reset content ready state when closing (but keep hasEverOpened)
    if (!value) {
      setContentReady(false);
      setShowPacMan(false); // Close game when modal closes
    }
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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Inject/remove animation freeze styles based on modal state
  useEffect(() => {
    if (!mounted) return;

    if (open && animationsFrozen) {
      // Inject freeze styles
      if (!styleRef.current) {
        const style = document.createElement('style');
        style.id = 'services-modal-freeze-styles';
        style.textContent = FREEZE_ANIMATIONS_STYLE;
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
  }, [open, animationsFrozen, mounted]);

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

  // Modal content - only rendered when modal is open AND content is ready
  const renderModalContent = useCallback(() => {
    if (!contentReady) {
      return <LoadingSpinner text="Loading services..." />;
    }

    return (
      <AnimationFreezeContext.Provider value={animationsFrozen}>
        <div className="relative z-10 flex flex-col gap-10 px-3 py-6 sm:px-5 sm:py-8 md:px-8 services-modal-content">
          {/* VIP Hero - Lazy loaded with ShopProvider */}
          <Suspense fallback={<LoadingSpinner text="Loading VIP section..." />}>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black">
              <ShopProviderLazy>
                <VipHeroMain embedded />
              </ShopProviderLazy>
            </div>
          </Suspense>

          {/* About Content */}
          <Suspense fallback={<LoadingSpinner text="Loading about..." />}>
            <AboutContent />
          </Suspense>

          {/* Pricing */}
          <Suspense fallback={<LoadingSpinner text="Loading pricing..." />}>
            <Pricing />
          </Suspense>

          {/* Interactive Orb Section - Heavy component, lazy loaded, EXEMPT from freeze */}
          <InteractiveOrbSection onPlayGame={handlePlayGame} />

          {/* Features */}
          <Suspense fallback={<LoadingSpinner text="Loading features..." />}>
            <Features />
          </Suspense>

          {/* Products Section */}
          <Suspense fallback={<LoadingSpinner text="Loading products..." />}>
            <ShopProviderLazy>
              <ProductsSection />
            </ShopProviderLazy>
          </Suspense>

          {/* Testimonial */}
          <Suspense fallback={<LoadingSpinner text="Loading testimonials..." />}>
            <Testimonial />
          </Suspense>

          {/* Footer */}
          <Suspense fallback={<LoadingSpinner text="Loading footer..." />}>
            <Footer />
          </Suspense>
        </div>
      </AnimationFreezeContext.Provider>
    );
  }, [contentReady, animationsFrozen, handlePlayGame]);


  if (!mounted || typeof window === "undefined") return null;

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

      {/* Only render portal when mounted AND open */}
      {mounted && open && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key="services-showcase-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            style={{ zIndex: UI_Z_INDEX.MODAL_BACKDROP }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="services-showcase-modal"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative w-[95vw] max-w-6xl rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl"
              style={{ zIndex: UI_Z_INDEX.MODAL_CONTENT }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={18} />
              </button>

              <div className="max-h-[85dvh] overflow-y-auto overscroll-contain">
                {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Pac-Man Game Modal - Rendered via portal, centered on screen */}
      <PacManGameModal isOpen={showPacMan} onClose={handleCloseGame} />
    </>
  );
}
