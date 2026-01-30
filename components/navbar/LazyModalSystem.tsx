"use client";

/**
 * LazyModalSystem.tsx
 * 
 * Unified lazy loading, mount/unmount, and freeze system for ALL navbar modals.
 * Mirrors the ServicesShowcaseModal pattern for optimal performance.
 * 
 * Features:
 * - ZERO loading until modal is first opened
 * - Complete unmount after close (frees memory/stops processes)
 * - Animation freeze during scroll
 * - Content-visibility optimization for off-screen sections
 * - Viewport-aware rendering
 */

import React, { 
  lazy, 
  Suspense, 
  useState, 
  useEffect, 
  useRef, 
  createContext, 
  useContext, 
  memo
} from "react";
import { Loader2 } from "lucide-react";

// ============================================================================
// LAZY LOADING SYSTEM - Nothing loads until modal opens
// ============================================================================

// Track which modals have ever been opened - prevents ANY loading until first open
const modalOpenHistory = new Map<string, boolean>();

// Lazy load ALL heavy modal components - ONLY when actually opened
const AdminModalLazy = lazy(() => import("@/components/AdminHubModal"));
const AffiliateModalLazy = lazy(() => import("@/components/AffiliateModal"));
const BullMoneyModalLazy = lazy(() => import("@/components/Faq"));
const UltimateControlPanelLazy = lazy(() => import("@/components/UltimateControlPanel"));
const AccountManagerModalLazy = lazy(() => import("@/components/AccountManagerModal").then(mod => ({ default: mod.AccountManagerModal })));

// ============================================================================
// ANIMATION FREEZE CONTEXT - Smart freezing based on visibility
// ============================================================================

interface ModalFreezeState {
  isFrozen: boolean;
  isScrolling: boolean;
  prefersReducedMotion: boolean;
  activeModal: string | null;
}

const ModalFreezeContext = createContext<ModalFreezeState>({
  isFrozen: false,
  isScrolling: false,
  prefersReducedMotion: false,
  activeModal: null,
});

export const useModalFreeze = () => useContext(ModalFreezeContext);

// ============================================================================
// GLOBAL FREEZE STYLES - Injected only when any modal is open
// ============================================================================

const MODAL_FREEZE_STYLE = `
  /* GLOBAL: Prevent modal content from affecting main page performance */
  .navbar-modal-portal {
    contain: strict;
    isolation: isolate;
  }

  /* Content-visibility: skip rendering of off-screen sections */
  .navbar-modal-content .freeze-zone:not(.in-viewport) {
    content-visibility: auto;
    contain-intrinsic-size: 0 300px;
  }
  
  /* Aggressive freeze for off-screen content */
  .navbar-modal-content .freeze-zone:not(.in-viewport) * {
    animation: none !important;
    transition: none !important;
    will-change: auto !important;
  }
  
  /* During scroll: MAXIMUM PERFORMANCE MODE */
  .navbar-modal-content.is-scrolling * {
    animation-play-state: paused !important;
    transition: none !important;
    will-change: auto !important;
  }
  
  .navbar-modal-content.is-scrolling [class*="backdrop-blur"],
  .navbar-modal-content.is-scrolling [class*="backdrop-filter"] {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  
  .navbar-modal-content.is-scrolling [class*="shadow-"] {
    box-shadow: none !important;
  }
  
  /* Keep interactive elements responsive */
  .navbar-modal-content button,
  .navbar-modal-content [role="button"],
  .navbar-modal-content a,
  .navbar-modal-content input,
  .navbar-modal-content textarea,
  .navbar-modal-content .freeze-exempt,
  .navbar-modal-content .freeze-exempt * {
    animation-play-state: running !important;
    transition-duration: 0.15s !important;
    pointer-events: auto !important;
  }
  
  /* GPU layer optimization for visible content */
  .navbar-modal-content .freeze-zone.in-viewport {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* Reduced motion: respect user preference */
  @media (prefers-reduced-motion: reduce) {
    .navbar-modal-content * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

// ============================================================================
// DEVICE DETECTION - Skip lazy loading on desktop/Mac
// ============================================================================

function isDesktopOrMac(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobi|android|iphone|ipad|ipod/i.test(ua) || window.innerWidth < 768;
  return !isMobile;
}

// ============================================================================
// VIEWPORT FREEZE HOOK - Performance optimization
// Desktop/Mac: Always consider content in viewport (no lazy visibility)
// ============================================================================

export function useViewportFreeze(ref: React.RefObject<HTMLElement | null>) {
  const [isInViewport, setIsInViewport] = useState(false);
  
  useEffect(() => {
    // Desktop/Mac: Skip lazy viewport detection, always mark as in viewport
    if (isDesktopOrMac()) {
      setIsInViewport(true);
      return;
    }
    
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        requestAnimationFrame(() => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      { 
        threshold: 0,
        rootMargin: '150px 0px' // Pre-load 150px before visible
      }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  
  return isInViewport;
}

// ============================================================================
// FREEZE ZONE WRAPPER - For viewport-aware sections
// ============================================================================

export const FreezeZone = memo(function FreezeZone({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInViewport = useViewportFreeze(ref);
  
  return (
    <div 
      ref={ref} 
      className={`freeze-zone ${isInViewport ? "in-viewport" : ""} ${className}`}
      style={{
        contain: isInViewport ? 'layout style' : 'strict',
      }}
    >
      {children}
    </div>
  );
});

// ============================================================================
// LOADING SPINNER - Consistent loading UI
// ============================================================================

export const ModalLoadingSpinner = memo(function ModalLoadingSpinner({ 
  text = "Loading..." 
}: { 
  text?: string;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
      <p className="text-white/60 text-sm mt-4">{text}</p>
    </div>
  );
});

// ============================================================================
// LAZY MODAL LIFECYCLE HOOK - Manages mount/unmount timing
// ============================================================================

function useLazyModalLifecycle(modalId: string, isOpen: boolean) {
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Mount detection
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // CRITICAL: Complete unmount system - load when open, unload when closed
  useEffect(() => {
    if (isOpen) {
      // Clear any pending unmount
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
        unmountTimeoutRef.current = null;
      }
      // Immediately allow rendering when opening
      setShouldRender(true);
      modalOpenHistory.set(modalId, true);
      
      // Inject freeze styles
      if (mounted && !styleRef.current) {
        const style = document.createElement('style');
        style.id = `navbar-modal-freeze-styles-${modalId}`;
        style.textContent = MODAL_FREEZE_STYLE;
        document.head.appendChild(style);
        styleRef.current = style;
      }
    } else {
      // Remove freeze styles immediately
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      
      // Delay unmount to allow exit animations
      unmountTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 500); // Wait for exit animation
    }
    
    return () => {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [isOpen, modalId, mounted]);

  return { shouldRender, mounted };
}

// ============================================================================
// LAZY ADMIN MODAL - Complete mount/unmount lifecycle
// ============================================================================

interface LazyAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LazyAdminModal = memo(function LazyAdminModal({ 
  isOpen, 
  onClose 
}: LazyAdminModalProps) {
  const { shouldRender, mounted } = useLazyModalLifecycle('admin', isOpen);

  // Don't render anything until mounted and should render
  if (!mounted || !shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={<ModalLoadingSpinner text="Loading Admin Dashboard..." />}>
      <AdminModalLazy isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
});

// ============================================================================
// LAZY AFFILIATE MODAL - Complete mount/unmount lifecycle
// ============================================================================

interface LazyAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LazyAffiliateModal = memo(function LazyAffiliateModal({ 
  isOpen, 
  onClose 
}: LazyAffiliateModalProps) {
  const { shouldRender, mounted } = useLazyModalLifecycle('affiliate', isOpen);

  if (!mounted || !shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={<ModalLoadingSpinner text="Loading Affiliate Portal..." />}>
      <AffiliateModalLazy isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
});

// ============================================================================
// LAZY FAQ MODAL (BullMoney Modal) - Complete mount/unmount lifecycle
// ============================================================================

interface LazyFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LazyFaqModal = memo(function LazyFaqModal({ 
  isOpen, 
  onClose 
}: LazyFaqModalProps) {
  const { shouldRender, mounted } = useLazyModalLifecycle('faq', isOpen);

  if (!mounted || !shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={<ModalLoadingSpinner text="Loading FAQ..." />}>
      <BullMoneyModalLazy isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
});

// ============================================================================
// LAZY ULTIMATE CONTROL PANEL - Complete mount/unmount lifecycle
// ============================================================================

interface LazyUltimatePanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  [key: string]: any; // Allow pass-through of all other props
}

export const LazyUltimatePanel = memo(function LazyUltimatePanel({ 
  isOpen, 
  onOpenChange,
  ...props
}: LazyUltimatePanelProps) {
  const { shouldRender, mounted } = useLazyModalLifecycle('ultimate-panel', isOpen);

  if (!mounted || !shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <UltimateControlPanelLazy 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        {...props}
      />
    </Suspense>
  );
});

// ============================================================================
// LAZY ACCOUNT MANAGER MODAL - Complete mount/unmount lifecycle
// ============================================================================

interface LazyAccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LazyAccountManagerModal = memo(function LazyAccountManagerModal({ 
  isOpen, 
  onClose 
}: LazyAccountManagerModalProps) {
  const { shouldRender, mounted } = useLazyModalLifecycle('account-manager', isOpen);

  if (!mounted || !shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={<ModalLoadingSpinner text="Loading Account Manager..." />}>
      <AccountManagerModalLazy isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export {
  AdminModalLazy,
  AffiliateModalLazy,
  BullMoneyModalLazy,
  UltimateControlPanelLazy,
  AccountManagerModalLazy,
  modalOpenHistory,
  MODAL_FREEZE_STYLE,
  ModalFreezeContext,
};
