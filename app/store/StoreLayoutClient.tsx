'use client';

import { useEffect, useState } from 'react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { Toaster } from 'sonner';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';

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

  // Auto-login check using pagemode session
  useEffect(() => {
    if (!mounted) return;
    
    // Check if user has pagemode session
    const pagemodeSession = localStorage.getItem('bullmoney_session');
    if (pagemodeSession) {
      try {
        const session = JSON.parse(pagemodeSession);
        // Session exists - user is already logged in via pagemode
        console.log('[Store] Pagemode session active:', session.email);
      } catch (e) {
        console.error('[Store] Error parsing pagemode session:', e);
      }
    }
  }, [mounted]);

  // Apply store-specific styles on mount
  useEffect(() => {
    if (!mounted) return;
    
    // Hide theme overlays and blurs when store is active
    const hideOverlays = () => {
      // Hide theme overlays
      const overlays = document.querySelectorAll('[data-theme-overlay], #theme-filter-overlay, #theme-global-overlay, #theme-edge-glow');
      overlays.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.pointerEvents = 'none';
        (el as HTMLElement).style.zIndex = '-1';
      });
      
      // Hide any backdrop-blur elements outside store
      const blurElements = document.querySelectorAll('[class*="backdrop-blur"]:not([data-store-page] *)');
      blurElements.forEach(el => {
        if (!(el as HTMLElement).closest('[data-store-page]')) {
          (el as HTMLElement).style.backdropFilter = 'none';
          // Use setProperty for webkit prefix to avoid TypeScript error
          (el as HTMLElement).style.setProperty('-webkit-backdrop-filter', 'none');
        }
      });
    };
    
    hideOverlays();
    
    // Observe for any dynamically added overlays
    const observer = new MutationObserver(hideOverlays);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
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
        isolation: 'isolate',
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
          .store-layout section,
          [data-store-page],
          [data-store-page] > *,
          [data-store-page] main,
          [data-store-page] section {
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
            contain: none !important;
            content-visibility: visible !important;
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
        }
        
        /* Ensure store content scrolls properly */
        .store-layout {
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: contain !important;
          background: #000;
          position: relative !important;
          height: auto !important;
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
          html.is-mobile .store-layout,
          html.is-mobile [data-store-page],
          .store-layout,
          [data-store-page] {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            height: auto !important;
            max-height: none !important;
          }
          
          html.is-mobile .store-layout section,
          .store-layout section {
            contain: none !important;
            content-visibility: visible !important;
            contain-intrinsic-size: auto !important;
          }
        }
      `}</style>
      
      {/* Store Header - Fixed below main navbar */}
      <StoreHeader />
      
      {/* Main Content - Below store header */}
      <main 
        className="pt-16 md:pt-20 w-full"
        style={{ overflow: 'visible', height: 'auto' }}
      >
        {children}
      </main>
      
      {/* Cart Drawer */}
      <CartDrawer />
      
      {/* Toast Notifications - No blur */}
      <Toaster 
        position="bottom-right"
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
