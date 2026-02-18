'use client';

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StoreHeader } from '@/components/store/StoreHeader';
// CartDrawer is now rendered inside StoreHeader for global availability
import dynamic from 'next/dynamic';

const StoreSupportButton = dynamic(() => import('@/components/shop/StoreSupportButton'), { ssr: false });
import { Toaster } from 'sonner';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { syncSessionLayers } from '@/lib/sessionPersistence';
// AutoTranslateProvider moved to root LayoutProviders for global coverage

// ============================================================================
// STORE LAYOUT CLIENT WRAPPER
// Handles client-side rendering, scroll fixes, and overlay isolation
// Positions store below StoreHeader (fixed 48px)
// ============================================================================

const STORE_HEADER_HEIGHT = 48;

export function StoreLayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useRecruitAuth();
  const overlayOpacityRef = useRef<{ overlay?: string; edge?: string }>({});

  // Mark as mounted for client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-login check using pagemode session + sync all storage layers
  useEffect(() => {
    if (!mounted) return;
    
    // Sync session across all storage layers (localStorage, sessionStorage, cookie)
    // This ensures the store always has access to auth from the main app
    syncSessionLayers();
    
    if (isAuthenticated) {
      console.log('[Store] Session active via RecruitAuth context');
    } else {
      console.log('[Store] No active session');
    }
  }, [mounted, isAuthenticated]);

  // Fix scroll issues - ensure store page can scroll properly
  // Use useLayoutEffect so cleanup runs synchronously before next paint,
  // preventing store-active class from leaking to other pages on back-navigation
  useLayoutEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    const body = document.body;

    // Safety: clear residual splash sway class on route entry
    html.classList.remove('bm-sway', 'bm-sway-safe');
    body.classList.remove('bm-sway', 'bm-sway-safe');
    
    // NOTE: Don't remove drunk scroll here - it's used by showcase scroll animation
    // forceScrollEnabler will handle cleanup when showcase is not active
    
    // Store original styles
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyHeight = body.style.height;
    
    // Enable proper scrolling on store pages - allow document to scroll
    html.style.overflow = 'auto';
    html.style.overflowX = 'hidden';
    html.style.height = 'auto';
    html.style.scrollBehavior = 'auto';
    // Android/Samsung browsers can get "stuck" when body overflow is forced to visible.
    // Prefer a normal scrolling document.
    body.style.overflow = 'auto';
    body.style.overflowY = 'auto';
    body.style.overflowX = 'hidden';
    body.style.height = 'auto';
    body.style.scrollBehavior = 'auto';
    
    // Add store-active class for CSS targeting
    html.classList.add('store-active');
    body.classList.add('store-page-body');
    
    return () => {
      html.classList.remove('store-active');
      body.classList.remove('store-page-body');
      // Restore original styles
      html.style.overflow = originalHtmlOverflow;
      html.style.height = originalHtmlHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.height = originalBodyHeight;
    };
  }, [mounted]);

  // Boost theme overlay intensity on store pages for stronger color on whites
  useEffect(() => {
    if (!mounted) return;

    const applyOverlayBoost = () => {
      const overlay = document.getElementById('theme-global-overlay');
      const edgeGlow = document.getElementById('theme-edge-glow');
      const isLightTheme = document.documentElement.getAttribute('data-theme-light') === 'true';

      if (overlay) {
        if (overlayOpacityRef.current.overlay === undefined) {
          overlayOpacityRef.current.overlay = overlay.style.opacity;
        }
        // Reduced opacity to prevent glitching on white backgrounds
        overlay.style.opacity = isLightTheme ? '0.15' : '0.35';
      }

      if (edgeGlow) {
        if (overlayOpacityRef.current.edge === undefined) {
          overlayOpacityRef.current.edge = edgeGlow.style.opacity;
        }
        // Reduced opacity to prevent glitching on white backgrounds
        edgeGlow.style.opacity = isLightTheme ? '0.12' : '0.25';
      }
    };

    applyOverlayBoost();
    window.addEventListener('bullmoney-theme-change', applyOverlayBoost as EventListener);

    return () => {
      window.removeEventListener('bullmoney-theme-change', applyOverlayBoost as EventListener);
      const overlay = document.getElementById('theme-global-overlay');
      const edgeGlow = document.getElementById('theme-edge-glow');

      if (overlay) {
        overlay.style.opacity = overlayOpacityRef.current.overlay ?? '';
      }
      if (edgeGlow) {
        edgeGlow.style.opacity = overlayOpacityRef.current.edge ?? '';
      }
      overlayOpacityRef.current = {};
    };
  }, [mounted]);

  return (
    <div 
      className="store-layout bg-white text-black"
      data-store-page
      data-theme-aware
      style={{
        position: 'relative',
        paddingTop: `${STORE_HEADER_HEIGHT}px`,
        width: '100%',
        height: 'auto',
        overflow: 'visible',
        backgroundColor: '#ffffff',
      }}
    >
      {/* CSS for responsive navbar offset and overlay hiding */}
      <style jsx>{`
        @media (min-width: 768px) {
          .store-layout {
            padding-top: ${STORE_HEADER_HEIGHT}px !important;
          }
        }
        
        /* CRITICAL: Force store containers to expand infinitely on mobile */
        @media (max-width: 767px) {
          .store-layout,
          .store-layout > *,
          .store-layout main,
          [data-store-page],
          [data-store-page] > *,
          [data-store-page] main {
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          
          /* Sections inside store: allow natural flow but preserve hero height */
          .store-layout section,
          [data-store-page] section {
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
        }
        
        /* DESKTOP (≥1024px): same overflow safeguard as mobile, but
           EXCLUDE .column-focused elements so they can independently scroll */
        @media (min-width: 1024px) {
          .store-layout,
          .store-layout > *:not(.column-focused),
          .store-layout main,
          [data-store-page],
          [data-store-page] > *:not(.column-focused),
          [data-store-page] main {
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
        }
        
        /* Allow global theme overlays to render on store pages */
        
        /* Disable pointer events on any canvas elements while on store */
        :global(html.store-active canvas),
        :global(body.store-page-body canvas),
        :global([data-store-page] ~ canvas),
        :global(.store-layout ~ canvas) {
          pointer-events: none !important;
          z-index: -1 !important;
        }
        
        /* Ensure html/body allow scrolling */
        :global(html.store-active),
        :global(html.store-active body),
        :global(body.store-page-body) {
          background: #ffffff !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          /* Prevent page-level repaints during scroll */
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure store content scrolls properly */
        .store-layout {
          -webkit-overflow-scrolling: touch;
          background: #ffffff;
          position: relative !important;
          height: auto !important;
          /* NOTE: Do NOT use transform:translateZ(0) here — it creates a
             containing block that breaks position:fixed on the StoreHeader
             and traps its z-index inside this stacking context. */
        }
        
        /* Only contain overscroll on actual mobile touch devices */
        :global(html.is-mobile) .store-layout {
          overscroll-behavior: contain;
        }
        
        /* Ensure main content can scroll */
        .store-layout main {
          background: transparent;
          position: relative !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* MOBILE: Override any performance CSS that might clip products */
        @media (max-width: 767px) {
          /* Desktop small viewports: keep overflow visible so scrolling
             chains to html/body naturally via mousewheel/trackpad */
          .store-layout,
          [data-store-page] {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          
          /* Actual mobile (touch) devices: create a proper scroll container
             so touch scrolling and overscroll-behavior work correctly.
             Higher specificity via html.is-mobile wins over the above rule. */
          html.is-mobile .store-layout,
          html.is-mobile [data-store-page] {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            height: auto !important;
            max-height: none !important;
          }
          
          html.is-mobile .store-layout section,
          .store-layout section {
            /* Allow content-visibility: auto to work for performance */
          }
        }
      `}</style>

      {/* GPU Performance: shimmer keyframes + containment for store components */}
      <style jsx global>{`
        /* ================================================================
           GPU-ACCELERATED SHIMMER - replaces framer-motion Infinity loops
           Runs on compositor thread (transform + opacity only), zero JS cost
           ================================================================ */
        @keyframes store-shimmer {
          0%   { transform: translateX(-200%) translateZ(0); }
          100% { transform: translateX(200%) translateZ(0); }
        }
        @keyframes store-shimmer-border {
          0%   { transform: translateX(-50%) translateZ(0); }
          100% { transform: translateX(50%) translateZ(0); }
        }
        @keyframes store-spin {
          to { transform: rotate(360deg) translateZ(0); }
        }
        @keyframes store-particle {
          0%   { opacity: 0; transform: scale(0) translateY(0) translateZ(0); }
          50%  { opacity: 0.6; transform: scale(1.5) translateY(-50px) translateZ(0); }
          100% { opacity: 0; transform: scale(0) translateY(-100px) translateZ(0); }
        }
        /* GradientOrb ambient float */
        @keyframes store-orb-float {
          0%   { transform: scale(1) translate(0, 0) translateZ(0); opacity: 0.25; }
          50%  { transform: scale(1.2) translate(30px, -20px) translateZ(0); opacity: 0.4; }
          100% { transform: scale(1) translate(0, 0) translateZ(0); opacity: 0.25; }
        }
        /* Box-shadow glow pulse */
        @keyframes store-glow-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(25, 86, 180, 0.4), 0 0 80px rgba(25, 86, 180, 0.2); }
          50%      { box-shadow: 0 0 60px rgba(25, 86, 180, 0.6), 0 0 100px rgba(25, 86, 180, 0.3); }
        }
        /* Dot pulse */
        @keyframes store-pulse-dot {
          0%, 100% { transform: scale(1) translateZ(0); opacity: 1; }
          50%      { transform: scale(1.3) translateZ(0); opacity: 0.7; }
        }
        /* Scroll indicator bounce */
        @keyframes store-scroll-bounce {
          0%, 100% { transform: translateY(0) translateZ(0); }
          50%      { transform: translateY(12px) translateZ(0); }
        }
        /* Opacity pulse */
        @keyframes store-opacity-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.8; }
        }
        /* Float + rotate for mobile product cards */
        @keyframes store-card-float {
          0%, 100% { transform: translateY(0) rotate(var(--float-start-rot, -3deg)) translateZ(0); }
          50%      { transform: translateY(var(--float-y, -8px)) rotate(var(--float-end-rot, 3deg)) translateZ(0); }
        }
        .store-orb-float {
          animation: store-orb-float 8s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .store-glow-pulse {
          animation: store-glow-pulse 2s ease-in-out infinite;
        }
        .store-pulse-dot {
          animation: store-pulse-dot 1.5s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .store-scroll-bounce {
          animation: store-scroll-bounce 2s ease-in-out infinite;
          will-change: transform;
        }
        .store-opacity-pulse {
          animation: store-opacity-pulse 2s ease-in-out infinite;
          will-change: opacity;
        }
        .store-card-float {
          animation: store-card-float var(--float-duration, 4s) ease-in-out var(--float-delay, 0s) infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .store-shimmer {
          animation: store-shimmer 3s ease-in-out infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .store-shimmer-border {
          animation: store-shimmer-border 4s ease-in-out infinite;
          will-change: transform;
          backface-visibility: hidden;
          filter: blur(20px);
        }
        .store-shimmer-fast {
          animation: store-shimmer 2s linear 1s infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .store-spin {
          animation: store-spin 0.5s linear infinite;
          will-change: transform;
        }

        /* ================================================================
           CSS CONTAINMENT - prevents layout thrash between sections
           Each section is an independent layout/paint boundary
           ================================================================ */
        [data-section-id] {
          contain: layout style paint;
          content-visibility: auto;
          contain-intrinsic-size: auto 400px;
        }
        /* Hero needs full height hint - NO containment that blocks scroll */
        [data-section-id="hero"] {
          contain-intrinsic-size: auto 90vh;
          contain: style paint;
          touch-action: pan-y;
          content-visibility: visible;
        }
        /* Products grid can be large */
        [data-section-id="products"] {
          contain-intrinsic-size: auto 800px;
        }

        /* GPU layer promotion for animated containers */
        .circular-product-row,
        [data-products-grid] {
          transform: translateZ(0);
        }

        /* Product card images: GPU compositing only during transitions */
        [data-store-page] img {
          backface-visibility: hidden;
        }
      `}</style>
      
      {/* Store Header */}
      <StoreHeader />
      
      {/* Auto-translate provider is now in root LayoutProviders for global coverage */}
      
      {/* Main Content - Below store header */}
      <main
        className="w-full"
        style={{ overflow: 'visible', height: 'auto' }}
      >
        {children}
      </main>
      
      {/* Cart Drawer is now rendered inside StoreHeader */}
      
      
      {/* Toast Notifications - Top Center */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            zIndex: 1050,
          },
        }}
      />
    </div>
  );
}
