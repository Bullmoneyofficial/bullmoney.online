'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const StoreHeader = dynamic(
  () => import('@/components/store/StoreHeader').then(mod => ({ default: mod.StoreHeader })),
  { ssr: false }
);

const HEADER_HEIGHT = 48;

export function GamesLayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const overlayOpacityRef = useRef<{ overlay?: string; edge?: string }>({});

  useEffect(() => { setMounted(true); }, []);

  // Fix scroll & body background — match store behavior
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const body = document.body;

    const origHtmlOverflow = html.style.overflow;
    const origBodyOverflow = body.style.overflow;
    const origHtmlHeight = html.style.height;
    const origBodyHeight = body.style.height;

    html.style.overflow = 'auto';
    html.style.overflowX = 'hidden';
    html.style.height = 'auto';
    html.style.minHeight = '100vh';
    body.style.overflow = 'auto';
    body.style.overflowX = 'hidden';
    body.style.height = 'auto';
    body.style.minHeight = '100vh';

    html.classList.add('store-active');
    body.classList.add('store-page-body');

    return () => {
      html.classList.remove('store-active');
      body.classList.remove('store-page-body');
      html.style.overflow = origHtmlOverflow;
      html.style.height = origHtmlHeight;
      body.style.overflow = origBodyOverflow;
      body.style.height = origBodyHeight;
    };
  }, [mounted]);

  // Boost theme overlay for white backgrounds — match store behavior
  useEffect(() => {
    if (!mounted) return;

    const applyOverlayBoost = () => {
      const overlay = document.getElementById('theme-global-overlay');
      const edgeGlow = document.getElementById('theme-edge-glow');
      const isLight = document.documentElement.getAttribute('data-theme-light') === 'true';

      if (overlay) {
        if (overlayOpacityRef.current.overlay === undefined)
          overlayOpacityRef.current.overlay = overlay.style.opacity;
        overlay.style.opacity = isLight ? '0.15' : '0.35';
      }
      if (edgeGlow) {
        if (overlayOpacityRef.current.edge === undefined)
          overlayOpacityRef.current.edge = edgeGlow.style.opacity;
        edgeGlow.style.opacity = isLight ? '0.12' : '0.25';
      }
    };

    applyOverlayBoost();
    window.addEventListener('bullmoney-theme-change', applyOverlayBoost as EventListener);

    return () => {
      window.removeEventListener('bullmoney-theme-change', applyOverlayBoost as EventListener);
      const overlay = document.getElementById('theme-global-overlay');
      const edgeGlow = document.getElementById('theme-edge-glow');
      if (overlay) overlay.style.opacity = overlayOpacityRef.current.overlay ?? '';
      if (edgeGlow) edgeGlow.style.opacity = overlayOpacityRef.current.edge ?? '';
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
        paddingTop: `${HEADER_HEIGHT}px`,
        width: '100%',
        minHeight: '100vh',
        height: 'auto',
        overflowX: 'hidden',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style jsx>{`
        :global(html.store-active),
        :global(html.store-active body),
        :global(body.store-page-body) {
          background: #ffffff !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          min-height: 100vh;
          -webkit-overflow-scrolling: touch;
        }
        /* Only hide the background Spline canvas, never game canvases */
        :global(html.store-active > body > div > canvas),
        :global(body.store-page-body > div > canvas) {
          pointer-events: none !important;
          z-index: -1 !important;
        }
        /* Ensure iframes and game content are always clickable — SCOPED to main only */
        /* Do NOT use .store-layout selector — it also targets invisible StoreHeader dropdown links */
        :global(.store-layout > main iframe),
        :global(.store-layout > main button),
        :global(.store-layout > main a),
        :global(.store-layout > main input),
        :global(.store-layout > main select),
        :global(.store-layout > main textarea) {
          pointer-events: auto !important;
        }
        /* Prevent touch delay on mobile */
        :global(.store-layout) {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        /* Game iframe containers: full touch + click passthrough (mobile + desktop) */
        :global(html.store-active [data-game-iframe]),
        :global([data-game-iframe]) {
          touch-action: auto !important;
          -webkit-overflow-scrolling: touch;
          position: relative;
          z-index: 5;
        }
        :global(html.store-active [data-game-iframe] iframe),
        :global(html.store-active iframe[data-game-frame]),
        :global([data-game-iframe] iframe),
        :global(iframe[data-game-frame]) {
          touch-action: auto !important;
          pointer-events: auto !important;
          position: relative;
          z-index: 5;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        /* CRITICAL: Isolate game content from StoreHeader hover/click interactions */
        :global(.bullcasino-page),
        :global(.bullcasino-page *) {
          /* Ensure all game content captures its own events */
        }
        :global(.bullcasino-page) {
          isolation: isolate;
          position: relative;
          z-index: 10;
        }
        /* Disable StoreHeader dropdown/hover triggers when over game content */
        :global(.store-main-nav) {
          pointer-events: auto;
        }
        /* Game content area must capture all pointer events */
        :global(.store-layout main .bullcasino-page) {
          pointer-events: auto !important;
        }
        /* Prevent StoreHeader hidden overlays from capturing clicks over game area */
        /* The always-rendered desktop dropdown is opacity-0 + pointer-events-none when closed,
           but child <a>/<button> elements must NOT get pointer-events:auto from global rules */
        :global(.store-layout [data-apple-section][class*="pointer-events-none"]) *,
        :global(.store-layout [class*="opacity-0"][class*="pointer-events-none"]) * {
          pointer-events: none !important;
        }
      `}</style>

      <StoreHeader />
      <main className="w-full min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
