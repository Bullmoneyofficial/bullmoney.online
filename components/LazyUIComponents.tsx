"use client";

/**
 * LazyUIComponents.tsx - Smart Mount/Unmount System for Global Modals
 * 
 * PERFORMANCE PHILOSOPHY: "Closed = Unmounted = Zero Cost"
 * 
 * These components COMPLETELY unmount when closed:
 * - Zero CPU cycles for closed modals
 * - Zero GPU memory for closed modals  
 * - Zero React reconciliation for unmounted trees
 * - Exit animations complete before unmount
 * 
 * NOTE: All these modals use UIStateContext internally for their open/close state.
 * The LazyWrapper just handles the mount/unmount lifecycle based on that state.
 */

import React, { 
  Suspense, 
  useState, 
  useEffect, 
  useRef, 
  memo,
  lazy,
} from "react";
import { Loader2 } from "lucide-react";

// ============================================================================
// LAZY IMPORTS - Code doesn't load until modal first opens
// ============================================================================

// Auth & Social - These modals manage their own state via UIStateContext
const AuthModalLazy = lazy(() => import("@/components/auth/AuthModal").then(m => ({ default: m.AuthModal })));
const BullFeedModalLazy = lazy(() => import("@/components/bull-feed/BullFeedModal").then(m => ({ default: m.BullFeedModal })));

// Analysis & Charts - Import the actual modal content, not the trigger
const EnhancedAnalysisModalLazy = lazy(() => import("@/components/analysis-enhanced/EnhancedAnalysisModal").then(m => ({ default: m.EnhancedAnalysisModal })));

// Live & Products - These modals use UIStateContext internally
const LiveStreamModalLazy = lazy(() => import("@/components/LiveStreamModal").then(m => ({ default: m.LiveStreamModal })));
const ProductsModalLazy = lazy(() => import("@/components/ProductsModal").then(m => ({ default: m.ProductsModal })));

// Services
const ServicesShowcaseModalLazy = lazy(() => import("@/components/ui/ServicesShowcaseModal").then(m => ({ default: m.default })));

// ============================================================================
// SMART MOUNT HOOK - Handles delayed unmount for exit animations
// ============================================================================

function useSmartMount(isOpen: boolean, unmountDelay = 350) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const unmountTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Clear pending unmount
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
      }
      // Mount immediately
      setIsFrozen(false);
      setShouldRender(true);
    } else if (shouldRender) {
      // Freeze animations for exit
      setIsFrozen(true);
      
      // Delay unmount for exit animation
      unmountTimerRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsFrozen(false);
      }, unmountDelay);
    }

    return () => {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
      }
    };
  }, [isOpen, unmountDelay, shouldRender]);

  return { shouldRender, isFrozen };
}

// ============================================================================
// LOADING FALLBACK
// ============================================================================

const ModalLoadingFallback = memo(function ModalLoadingFallback({ 
  text = "Loading..." 
}: { 
  text?: string;
}) {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
      <p className="text-white/60 text-sm mt-4 font-medium">{text}</p>
    </div>
  );
});

// ============================================================================
// LAZY AUTH MODAL
// Note: AuthModal manages its own state via UIStateContext
// This wrapper just handles the lazy loading and smart mount lifecycle
// ============================================================================

export const LazyAuthModal = memo(function LazyAuthModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  const { shouldRender } = useSmartMount(isOpen);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={<ModalLoadingFallback text="Loading Auth..." />}>
      <AuthModalLazy />
    </Suspense>
  );
});

// ============================================================================
// LAZY BULL FEED MODAL
// Note: BullFeedModal manages its own state via UIStateContext
// ============================================================================

export const LazyBullFeedModal = memo(function LazyBullFeedModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  const { shouldRender } = useSmartMount(isOpen);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={<ModalLoadingFallback text="Loading Feed..." />}>
      <BullFeedModalLazy />
    </Suspense>
  );
});

// ============================================================================
// LAZY POST COMPOSER MODAL - REMOVED (doesn't exist)
// If PostComposerModal is added later, add it here
// ============================================================================

export const LazyPostComposerModal = memo(function LazyPostComposerModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  // PostComposerModal doesn't exist yet, return null
  return null;
});

// ============================================================================
// LAZY ANALYSIS MODAL
// Note: EnhancedAnalysisModal manages its own state via UIStateContext
// This is the actual modal content, not just a trigger
// ============================================================================

export const LazyAnalysisModal = memo(function LazyAnalysisModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  const { shouldRender } = useSmartMount(isOpen);

  if (!shouldRender) return null;

  // EnhancedAnalysisModal internally uses useAnalysisModalUI() hook
  // which reads from the same UIStateContext, so it will be in sync
  return (
    <Suspense fallback={<ModalLoadingFallback text="Loading Analysis..." />}>
      <EnhancedAnalysisModalLazy />
    </Suspense>
  );
});

// ============================================================================
// LAZY LIVESTREAM MODAL
// Note: LiveStreamModal manages its own state via UIStateContext
// This wrapper just handles the lazy loading aspect
// ============================================================================

export const LazyLiveStreamModal = memo(function LazyLiveStreamModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  const { shouldRender } = useSmartMount(isOpen, 400); // Slightly longer for video cleanup

  if (!shouldRender) return null;

  // The LiveStreamModal internally uses useLiveStreamModalUI() hook
  // which reads from the same UIStateContext, so it will be in sync
  return (
    <Suspense fallback={<ModalLoadingFallback text="Loading Live Stream..." />}>
      <LiveStreamModalLazy />
    </Suspense>
  );
});

// ============================================================================
// LAZY PRODUCTS MODAL
// Note: ProductsModal manages its own state via UIStateContext  
// This wrapper just handles the lazy loading aspect
// ============================================================================

export const LazyProductsModal = memo(function LazyProductsModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  const { shouldRender } = useSmartMount(isOpen);

  if (!shouldRender) return null;

  // The ProductsModal internally uses useProductsModalUI() hook
  // which reads from the same UIStateContext, so it will be in sync
  return (
    <Suspense fallback={<ModalLoadingFallback text="Loading Products..." />}>
      <ProductsModalLazy />
    </Suspense>
  );
});

// ============================================================================
// LAZY SERVICES MODAL
// Note: ServicesShowcaseModal can accept external isOpen/onOpenChange props
// ============================================================================

export const LazyServicesModal = memo(function LazyServicesModal({ 
  isOpen, 
  onClose 
}: { isOpen: boolean; onClose: () => void }) {
  const { shouldRender } = useSmartMount(isOpen);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={<ModalLoadingFallback text="Loading Services..." />}>
      <ServicesShowcaseModalLazy 
        isOpen={isOpen} 
        onOpenChange={(open: boolean) => !open && onClose()}
        showTrigger={false}
      />
    </Suspense>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export { useSmartMount, ModalLoadingFallback };
