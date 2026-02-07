'use client';

import { useEffect, useState } from 'react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CartDrawer } from '@/components/shop/CartDrawer';
import dynamic from 'next/dynamic';

const StoreSupportButton = dynamic(() => import('@/components/shop/StoreSupportButton'), { ssr: false });
import { Toaster } from 'sonner';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { syncSessionLayers } from '@/lib/sessionPersistence';
// AutoTranslateProvider moved to root LayoutProviders for global coverage

// ============================================================================
// STORE LAYOUT CLIENT WRAPPER
// Handles client-side rendering, scroll fixes, and overlay isolation
// Positions store BELOW main navbar (80px desktop, 64px mobile)
// ============================================================================

const MAIN_NAVBAR_HEIGHT = {
  mobile: 64,
  desktop: 80,
};

export function StoreLayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useRecruitAuth();

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

  // Apply store-specific styles on mount
  useEffect(() => {
    if (!mounted) return;
    
    // Hide theme overlays and blurs when store is active
    const hideOverlays = () => {
      // Hide theme overlays — ONE-SHOT (no MutationObserver needed).
      // The CSS rules below already handle any dynamically-added overlays via
      // :global selectors. Previously a MutationObserver watched the entire
      // document.body with subtree:true which caused a mutation storm:
      //   GlobalThemeProvider creates overlay → observer fires → hides it →
      //   OffscreenAnimationController observer fires → etc.
      const overlays = document.querySelectorAll('[data-theme-overlay], #theme-filter-overlay, #theme-global-overlay, #theme-edge-glow');
      overlays.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.pointerEvents = 'none';
        (el as HTMLElement).style.zIndex = '-1';
      });
    };
    
    hideOverlays();
    
    // Re-run once after a short delay to catch any overlays created during hydration
    const timer = setTimeout(hideOverlays, 1500);
    
    return () => {
      clearTimeout(timer);
      // Restore overlays when leaving store
      const overlays = document.querySelectorAll('[data-theme-overlay], #theme-filter-overlay, #theme-global-overlay, #theme-edge-glow');
      overlays.forEach(el => {
        (el as HTMLElement).style.display = '';
        (el as HTMLElement).style.opacity = '';
        (el as HTMLElement).style.pointerEvents = '';
        (el as HTMLElement).style.zIndex = '';
      });
    };
  }, [mounted]);

  // Fix scroll issues - ensure store page can scroll properly
  useEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    const body = document.body;
    
    // Store original styles
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyHeight = body.style.height;
    
    // Enable proper scrolling on store pages - allow document to scroll
    html.style.overflow = 'auto';
    html.style.overflowX = 'hidden';
    html.style.height = 'auto';
    body.style.overflow = 'visible';
    body.style.overflowX = 'hidden';
    body.style.height = 'auto';
    
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

  return (
    <div 
      className="store-layout bg-black text-white"
      data-store-page
      style={{
        position: 'relative',
        zIndex: 1,
        paddingTop: `${MAIN_NAVBAR_HEIGHT.mobile}px`,
        width: '100%',
        height: 'auto',
        overflow: 'visible',
      }}
    >
      {/* CSS for responsive navbar offset and overlay hiding */}
      <style jsx>{`
        @media (min-width: 768px) {
          .store-layout {
            padding-top: ${MAIN_NAVBAR_HEIGHT.desktop}px !important;
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
        
        /* Hide all blurs and backdrops when store is active */
        :global([data-theme-overlay]),
        :global(#theme-filter-overlay),
        :global(#theme-global-overlay),
        :global(#theme-edge-glow),
        :global(.theme-backdrop),
        :global(.theme-lens),
        :global([id*="theme-overlay"]),
        :global([class*="theme-overlay"]) {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }

        /* Kill theme overlay pseudo-elements on store pages */
        :global(html.store-active::before),
        :global(html.store-active::after) {
          content: none !important;
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
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
          background: #000 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          /* Prevent page-level repaints during scroll */
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure store content scrolls properly */
        .store-layout {
          -webkit-overflow-scrolling: touch;
          background: #000;
          position: relative !important;
          height: auto !important;
          /* GPU compositing for the entire store shell */
          transform: translateZ(0);
          backface-visibility: hidden;
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
        className="pt-16 md:pt-20 w-full"
        style={{ overflow: 'visible', height: 'auto' }}
      >
        {children}
      </main>
      
      {/* Cart Drawer */}
      <CartDrawer />
      
      {/* Floating Support Button */}
      <StoreSupportButton />
      
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
