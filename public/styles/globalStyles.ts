export const GLOBAL_STYLES = `
  :root {
    --apple-font: "SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    --apple-surface: rgba(255,255,255,0.04);
    --apple-border: rgba(255,255,255,0.12);
    --apple-highlight: rgba(255,255,255,0.75);
    --apple-shadow: 0 30px 80px rgba(0,0,0,0.45);
    --apple-gradient: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.08), transparent 35%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.05), transparent 40%);
  }

  body, button, input, textarea {
    font-family: var(--apple-font);
    letter-spacing: -0.01em;
  }

  body {
    background-image: var(--apple-gradient);
    background-color: black;
  }

  .apple-surface {
    background-color: var(--apple-surface);
    border: 1px solid var(--apple-border);
    box-shadow: var(--apple-shadow);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
  }

  .apple-divider {
    height: 1px;
    width: 100%;
    background: linear-gradient(90deg, transparent, var(--apple-border), transparent);
  }

  .apple-cta {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75));
    color: #0f172a;
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  }

  .apple-cta::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0.4), transparent 55%);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .apple-cta:hover::after {
    opacity: 1;
  }

  /* --- MOBILE SCROLL FIXES START --- */
  // FIX #1: Remove fixed positioning that causes scroll issues
  html, body {
    background-color: black;
    overflow: hidden; /* Prevent native window scroll */
    overscroll-behavior-y: none; /* Kill rubber-banding vertically */
    width: 100%;
    height: 100%;
  }

  // FIX #1: Remove snap-scroll on mobile for smooth Instagram/TikTok-like scrolling
  .mobile-scroll {
    overflow-y: auto;
    overflow-x: hidden;
    height: 100dvh; /* Dynamic viewport height */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: none; /* Changed from 'contain' */
  }

  /* Remove scrollbars but keep functionality */
  .mobile-scroll::-webkit-scrollbar { display: none; }
  .mobile-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  // FIX #5: Use min-height for flexibility instead of fixed height
  section {
    width: 100%;
    min-height: 100dvh; /* Changed from fixed height */
    position: relative;
    overflow: hidden;
    will-change: transform;
  }

  /* Desktop only: Enable snap scrolling */
  @media (min-width: 769px) {
    .mobile-scroll {
      scroll-snap-type: y mandatory;
    }
    section {
      scroll-snap-align: start;
      scroll-snap-stop: always;
      height: 100dvh;
    }
  }
  /* --- MOBILE SCROLL FIXES END --- */

  @keyframes spin-border {
    0% { --bg-angle: 0deg; }
    100% { --bg-angle: 360deg; }
  }
  @keyframes particleFloat {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-100vh) scale(0); opacity: 0; }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOutLeft {
    from { transform: translateX(0) scale(1); opacity: 1; }
    to { transform: translateX(-200px) scale(0.5); opacity: 0; }
  }

  @keyframes slideOutRight {
    from { transform: translateX(0) scale(1); opacity: 1; }
    to { transform: translateX(200px) scale(0.5); opacity: 0; }
  }

  .animate-slideOutLeft {
    animation: slideOutLeft 0.5s ease-out forwards;
  }

  .animate-slideOutRight {
    animation: slideOutRight 0.5s ease-out forwards;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes pageFlip {
    0% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
    50% { transform: perspective(1000px) rotateY(90deg); opacity: 0.5; }
    100% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
  }
  
  .shining-border {
    position: relative;
    border-radius: 0.5rem;
    z-index: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .shining-border::before {
    content: "";
    position: absolute;
    inset: -2px;
    z-index: -1;
    background: conic-gradient(
      from var(--bg-angle),
      transparent 0%,
      #0088ff 20%,
      #0000ff 40%,
      transparent 60%
    );
    animation: spin-border 3s linear infinite;
  }
  
  .shining-border::after {
    content: "";
    position: absolute;
    inset: 1px;
    z-index: -1;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 0.5rem;
  }
  
  @property --bg-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
   
  .profit-reveal {
    animation: profitReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes profitReveal {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes music-bar-1 { 0%, 100% { height: 33%; } 50% { height: 100%; } }
  @keyframes music-bar-2 { 0%, 100% { height: 66%; } 50% { height: 33%; } }
  @keyframes music-bar-3 { 0%, 100% { height: 100%; } 50% { height: 66%; } }
  
  .animate-music-bar-1 { animation: music-bar-1 0.8s ease-in-out infinite; }
  .animate-music-bar-2 { animation: music-bar-2 1.1s ease-in-out infinite; }
  .animate-music-bar-3 { animation: music-bar-3 0.9s ease-in-out infinite; }
  
  .shimmer-effect {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .hover-lift {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-5px) scale(1.02);
  }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  html, body { 
    background-color: black; 
    overflow-x: hidden;
    cursor: auto;
  }

  /* Enable custom cursor only when explicitly toggled */
  html.use-custom-cursor, body.use-custom-cursor {
    cursor: none;
  }

  /* Never hide cursor on coarse pointer devices */
  @media (pointer: coarse) {
    html.use-custom-cursor, body.use-custom-cursor {
      cursor: auto !important;
    }
  }
  
  /* Custom Cursor Trail */
  .cursor-trail {
    position: fixed;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999999;
    mix-blend-mode: screen;
  }
  
  /* Parallax layers */
  .parallax-layer {
    transition: transform 0.1s ease-out;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* ULTRA-OPTIMIZED Mobile performance - Locked 60fps target */
  @media (max-width: 768px) {
    .mobile-optimize {
      will-change: transform;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      -webkit-perspective: 1000;
      perspective: 1000;
    }

    /* GPU-accelerated everything for mobile */
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    /* Keep fixed elements pinned to the viewport on mobile Safari */
    html, body, #__next {
      -webkit-transform: none !important;
      transform: none !important;
      will-change: auto;
    }

    .fixed, .sticky {
      -webkit-transform: none !important;
      transform: none !important;
      will-change: auto;
    }

    /* Optimize heavy animations for mobile - slower = smoother */
    .shining-border::before {
      animation-duration: 6s !important;
      will-change: auto;  /* Remove will-change after animation starts */
    }

    /* Smooth transitions optimized for 60fps with hardware acceleration */
    section {
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: auto;
      transform: translate3d(0, 0, 0);
    }

    /* Reduce layout shifts - force GPU layer */
    button, a, .hover-lift {
      transform: translate3d(0, 0, 0);
      will-change: transform;
      transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    /* Optimize input elements */
    input, select, textarea {
      font-size: 16px !important;  /* Prevent zoom on iOS */
      transform: translateZ(0);
    }

    /* Reduce animation complexity on mobile */
    @keyframes particleFloat {
      0% { opacity: 1; transform: translateY(0) scale(1) translateZ(0); }
      100% { opacity: 0; transform: translateY(-50vh) scale(0.5) translateZ(0); }
    }
  }

  // FIX #1: Remove restrictive touch-action that blocks swipe gestures
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y; /* Removed pinch-zoom restriction */
    overscroll-behavior-y: none; /* Changed from contain */
    scroll-behavior: smooth;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  section {
    touch-action: pan-y; /* Removed pinch-zoom restriction */
    contain: layout style paint;
    /* Ensure smooth rendering in all browsers */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  /* Performance hints */
  .spline-container {
    will-change: transform;
    transform: translateZ(0);
    contain: strict;
    /* Force GPU acceleration on iOS */
    -webkit-transform: translate3d(0,0,0);
    transform: translate3d(0,0,0);
  }

  /* Prevent layout shifts */
  img, video, iframe {
    max-width: 100%;
    height: auto;
  }

  /* Fix for Instagram/TikTok in-app browsers */
  html, body {
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
    position: relative;
  }

  /* Ensure scrolling works like desktop on mobile */
  html {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }

  @media (max-width: 768px) {
    html {
      scroll-snap-type: y proximity; /* Less strict on mobile */
    }
  }

  /* ============================================================ */
  /* THEME PERSISTENCE & OVERLAY STYLING */
  /* ============================================================ */
  
  /* Theme overlay - applied as persistent background filter */
  #theme-overlay {
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  /* Navbar theme-aware styling */
  [data-active-theme] .navbar,
  [data-active-theme] .mobile-navbar {
    transition: filter 0.3s ease, background-color 0.3s ease;
  }

  /* Action buttons theme-aware styling */
  [data-active-theme] .action-button,
  [data-active-theme] .quick-actions {
    transition: filter 0.3s ease, background-color 0.3s ease;
  }

  /* Theme color variable usage throughout the app */
  :root[data-active-theme] {
    --theme-transition: filter 0.3s ease, background-color 0.3s ease;
  }

  /* Ensure theme filter applies to all elements */
  [data-active-theme="t01"] {
    /* Bitcoin Orange theme - applies to entire page when set */
  }

  [data-active-theme="t02"] {
    /* Ethereum Purple theme - applies to entire page when set */
  }

  [data-active-theme="t03"] {
    /* Solana Green theme - applies to entire page when set */
  }

  /* Smooth transitions when theme changes */
  * {
    transition-property: background-color, border-color, color, filter;
    transition-duration: 0.3s;
    transition-timing-function: ease;
  }

  /* Prevent transition delay on specific interactive elements */
  button, a, input, textarea {
    transition-property: background-color, border-color, color;
    transition-duration: 0.15s;
  }

  /* Performance: Don't animate theme filter on transforms */
  .will-change-transform,
  .will-change-auto {
    filter: none;
  }

  /* Mobile optimization: Reduce motion on small devices */
  @media (max-width: 640px) {
    * {
      transition-duration: 0.15s;
    }

    #theme-overlay {
      transition: opacity 0.15s ease;
    }
  }

  /* Prefers-reduced-motion: Respect user preferences */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition-duration: 0ms !important;
      animation-duration: 0ms !important;
    }

    #theme-overlay {
      transition: none;
    }
  }
`;
