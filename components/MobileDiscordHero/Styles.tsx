'use client';

export const Styles = () => (
  <style>{`
    @keyframes spline-dl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ── Aesthetic Mobile Hero Animations ── */
    @keyframes aesthetic-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(30px, -20px) scale(1.05); }
      50% { transform: translate(-20px, 15px) scale(0.95); }
      75% { transform: translate(15px, 25px) scale(1.02); }
    }
    @keyframes aesthetic-drift-2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(-40px, 20px) scale(1.08); }
      66% { transform: translate(25px, -30px) scale(0.92); }
    }
    @keyframes aesthetic-drift-3 {
      0%, 100% { transform: translate(0, 0) scale(1.05); }
      50% { transform: translate(20px, 30px) scale(0.9); }
    }
    @keyframes aesthetic-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.7; }
    }
    @keyframes aesthetic-grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-5%, -10%); }
      20% { transform: translate(-15%, 5%); }
      30% { transform: translate(7%, -25%); }
      40% { transform: translate(-5%, 25%); }
      50% { transform: translate(-15%, 10%); }
      60% { transform: translate(15%, 0%); }
      70% { transform: translate(0%, 15%); }
      80% { transform: translate(3%, 35%); }
      90% { transform: translate(-10%, 10%); }
    }
    @keyframes aesthetic-line-drift {
      0% { transform: translateX(-100%) rotate(-45deg); }
      100% { transform: translateX(200%) rotate(-45deg); }
    }
    @keyframes aesthetic-fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes aesthetic-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes nav-dropdown-in {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    .aesthetic-hero-root {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: #000;
      pointer-events: none;
      touch-action: pan-y;
    }
    .aesthetic-hero-grain {
      position: absolute;
      inset: -50%;
      width: 200%;
      height: 200%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      animation: aesthetic-grain 8s steps(10) infinite;
      pointer-events: none;
      z-index: 1;
      opacity: 0.5;
    }
    .aesthetic-hero-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
      will-change: transform;
      pointer-events: none;
    }
    .aesthetic-hero-line {
      position: absolute;
      width: 200%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      animation: aesthetic-line-drift 12s linear infinite;
      pointer-events: none;
      z-index: 2;
    }
    .aesthetic-nav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .aesthetic-nav-btn:active {
      transform: scale(0.96);
      background: rgba(255,255,255,0.08);
    }
    .aesthetic-nav-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: nav-backdrop-in 0.2s ease forwards;
      padding: 16px;
    }
    @keyframes nav-backdrop-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .aesthetic-nav-dropdown {
      position: relative;
      width: calc(100vw - 32px);
      max-width: 400px;
      background: rgba(12, 12, 14, 0.95);
      backdrop-filter: blur(40px) saturate(1.4);
      -webkit-backdrop-filter: blur(40px) saturate(1.4);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 8px;
      animation: nav-dropdown-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset;
    }
    .aesthetic-nav-dropdown-title {
      text-align: center;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      padding: 8px 0 4px;
    }
    .aesthetic-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 10px;
      color: rgba(255,255,255,0.65);
      font-size: 12px;
      font-weight: 450;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }
    .aesthetic-nav-item:active {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }
    .aesthetic-nav-item-icon {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .aesthetic-scroll-hint {
      animation: aesthetic-fade-up 1s ease 1.5s both;
    }
    .aesthetic-title-shimmer {
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%);
      background-size: 200% 100%;
      animation: aesthetic-shimmer 3s ease-in-out infinite;
    }

    :root {
      --bg-dark: #000000;
      --text-main: #ffffff;
      --text-muted: #86868b;
      --glass-border: rgba(255, 255, 255, 0.1);
      --glass-bg: rgba(20, 20, 23, 0.6);
      --accent: #2997ff;
    }
    
    * { box-sizing: border-box; }

    body, html { 
      margin: 0; 
      padding: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-dark); 
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden; /* Prevent horizontal scroll on mobile */
    }

    .hero-wrapper {
      position: relative;
      width: 100%;
      min-height: 100vh; /* Fallback for older browsers */
      min-height: 100dvh; /* Dynamic viewport height — accounts for in-app browser toolbars (Discord, IG, etc.) */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: visible; /* FIXED: Allow scroll to propagate through hero */
      overflow-x: hidden; /* Prevent horizontal overflow only */
      touch-action: pan-y; /* Allow vertical scrolling on mobile */
    }

    /* BACKGROUND LAYER */
    .trail-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      opacity: 0.6;
      pointer-events: none; /* Crucial for mobile scrolling */
    }

    .cycling-bg-layer.scene-switching .cycling-bg-item,
    .cycling-bg-layer.scene-switching ~ * {
      animation-play-state: paused !important;
      transition: none !important;
      will-change: auto !important;
    }
    .cycling-bg-layer.scene-switching::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 10;
    }

    /* CYCLING BACKGROUND EFFECTS LAYER - Main Background */
    .cycling-bg-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none; /* Let scroll pass through on mobile */
      touch-action: pan-y; /* Allow vertical scrolling */
      overflow: visible; /* Let hero-content-overlay escape clipping on in-app browsers */
    }

    @media (min-width: 769px) {
      .cycling-bg-layer {
        pointer-events: auto; /* Allow Spline interactions on desktop */
      }
    }

    .cycling-bg-item {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 2s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: opacity;
      backface-visibility: hidden;
      transform: translateZ(0);
      pointer-events: none;
      overflow: hidden; /* Contain background effects within each item */
    }

    .cycling-bg-item.active {
      opacity: 1;
      pointer-events: none; /* Don't block scrolling on mobile */
      touch-action: pan-y; /* Allow vertical scrolling */
    }

    @media (min-width: 769px) {
      .cycling-bg-item.active {
        pointer-events: auto; /* Enable interactions on desktop */
      }
    }

    .cycling-bg-item.fading-out {
      opacity: 0;
      transition: opacity 2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .spline-scene {
      width: 100%;
      height: 100%;
      transform-origin: center center;
      will-change: transform;
      pointer-events: none; /* Don't block scrolling */
      touch-action: pan-y;
    }

    .spline-scene-inner {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transform-origin: center center;
      will-change: transform;
      pointer-events: none; /* Don't block scrolling */
      touch-action: pan-y;
    }

    /* Spline canvas itself - disable touch capture on mobile */
    .spline-scene-inner canvas,
    .spline-scene-inner > div {
      pointer-events: none !important;
      touch-action: pan-y !important;
    }

    @media (min-width: 769px) {
      .spline-scene,
      .spline-scene-inner,
      .spline-scene-inner canvas,
      .spline-scene-inner > div {
        pointer-events: auto !important;
        touch-action: auto !important;
      }
    }

    /* MOBILE SPLINE PLAY MODE — unlock 3D interaction when toggled */
    .hero-wrapper.spline-play-mode .cycling-bg-layer,
    .hero-wrapper.spline-play-mode .cycling-bg-item.active,
    .hero-wrapper.spline-play-mode .spline-scene,
    .hero-wrapper.spline-play-mode .spline-scene-inner,
    .hero-wrapper.spline-play-mode .spline-scene-inner canvas,
    .hero-wrapper.spline-play-mode .spline-scene-inner > div {
      pointer-events: auto !important;
      touch-action: pan-y !important;
    }
    .hero-wrapper.spline-play-mode .hero-content-overlay {
      opacity: 0;
      pointer-events: none !important;
      transition: opacity 0.3s ease;
    }

    @media (max-width: 768px) {
      .spline-scene-inner {
        width: 118%;
        height: 118%;
        left: -9%;
        top: -9%;
        transform: scale(0.85);
      }
    }

    /* Hero Content Overlay */
    .hero-content-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 20px;
      padding-top: max(20px, env(safe-area-inset-top, 20px)); /* Prevent top clipping on in-app browsers */
      box-sizing: border-box;
    }

    .hero-content-overlay > * {
      pointer-events: auto;
    }

    /* SEO Hero Text Styles */
    .hero-seo-text {
      text-align: center;
      padding: 20px;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .hero-title {
      font-size: clamp(3rem, 12vw, 7rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      margin: 0 0 16px 0;
      color: #fff;
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .hero-title .gradient-text {
      color: #fff;
    }

    .hero-tagline {
      font-size: clamp(1.2rem, 4vw, 1.8rem);
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      margin: 0 0 20px 0;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    .hero-description {
      font-size: clamp(0.95rem, 3vw, 1.15rem);
      line-height: 1.6;
      color: rgba(255,255,255,0.75);
      max-width: 600px;
      margin: 0 auto 32px auto;
      text-shadow: 0 1px 5px rgba(0,0,0,0.5);
    }

    .hero-cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-vip, .btn-shop {
      padding: 12px 28px;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      border: none;
    }

    .btn-vip {
      background: #fff;
      color: #000;
      box-shadow: 0 4px 20px rgba(255,255,255,0.3);
    }

    .btn-vip:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(255,255,255,0.5);
    }

    .btn-shop {
      background: rgba(255,255,255,0.1);
      color: #fff;
      border: 2px solid rgba(255,255,255,0.3) !important;
      backdrop-filter: blur(10px);
    }

    .btn-shop:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.5);
      transform: translateY(-2px);
    }

    .btn-new-shop {
      background: linear-gradient(135deg, rgba(41, 151, 255, 0.2), rgba(41, 151, 255, 0.1));
      border: 2px solid rgba(41, 151, 255, 0.4) !important;
    }

    .btn-new-shop:hover {
      background: linear-gradient(135deg, rgba(41, 151, 255, 0.3), rgba(41, 151, 255, 0.2));
      border-color: rgba(41, 151, 255, 0.6) !important;
    }

    /* YouTube Video Container */
    .hero-video-container {
      width: 90%;
      max-width: 800px;
      aspect-ratio: 16/9;
      background: rgba(0,0,0,0.5);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .hero-video-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .video-loading, .video-error {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.7);
      font-size: 1rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }

    .modal-content {
      position: relative;
      width: 95%;
      height: 90%;
      max-width: 1200px;
      background: #111;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .modal-close:hover {
      background: rgba(255,255,255,0.2);
    }

    .modal-content-hub {
      width: 98%;
      height: 95%;
      max-width: none;
      background: transparent;
    }

    /* CONTENT GRID */
    .content-layer {
      position: relative;
      z-index: 20;
      width: 100%;
      max-width: 1200px; /* Cap width for big screens */
      display: grid;
      gap: 40px;
      grid-template-columns: 1fr; /* Default mobile stack */
      align-items: center;
    }

    /* TEXT BLOCK */
    .hero-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center; /* Center text on mobile */
      align-items: center;
    }

    h1 {
      /* Fluid typography: scales between 2.5rem and 5rem based on width */
      font-size: clamp(2.5rem, 8vw, 5rem);
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 24px 0;
      background: linear-gradient(180deg, #fff 0%, #a1a1aa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p.subtext {
      font-size: clamp(1rem, 4vw, 1.25rem);
      line-height: 1.5;
      color: var(--text-muted);
      max-width: 500px;
      margin-bottom: 32px;
    }

    /* BUTTONS */
    .cta-group { 
      display: flex; 
      flex-direction: row; /* Keep buttons side by side even on small mobile */
      gap: 12px; 
      width: 100%;
      justify-content: center;
    }
    
    .btn {
      padding: 14px 28px;
      border-radius: 999px;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
      transition: transform 0.2s ease, opacity 0.2s;
    }
    .btn:active { transform: scale(0.96); }

    .btn-primary {
      background: #fff;
      color: #000;
    }
    
    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: #fff;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }

    /* YOUTUBE VIDEO CARD */
    .hero-visual {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .video-card {
      position: relative;
      width: 100%;
      max-width: 600px;
      aspect-ratio: 16/9;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5);
      overflow: hidden;
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
    }

    /* Desktop MacBook wrapper */
    .macbook-wrapper {
      width: 100%;
      height: auto;
    }

    .macbook-video-container {
      width: 100%;
      height: 100%;
      background: #000;
      position: relative;
    }

    .macbook-video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }

    .video-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
      z-index: 10;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .video-card:hover .video-info {
      transform: translateY(0);
    }

    .video-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
      line-height: 1.4;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #ff0000;
      color: #fff;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 8px;
    }

    .live-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #fff;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* ---------------------------------------------------- */
    /* RESPONSIVE BREAKPOINTS */
    /* ---------------------------------------------------- */

    /* TABLET & DESKTOP (> 768px) */
    @media (min-width: 768px) {
      .content-layer {
        grid-template-columns: 1fr; /* Single column for text only */
        text-align: center;
        padding: 0 40px;
        justify-items: center;
      }
      
      .hero-text {
        align-items: center;
        text-align: center;
        max-width: 800px;
      }

      .cta-group {
        justify-content: center;
      }

      .hero-visual {
        display: none; /* Hide video on desktop */
      }

      .video-card {
        max-width: 800px;
      }
    }

    /* ULTRA WIDE (> 1400px) */
    @media (min-width: 1400px) {
       .content-layer {
          gap: 80px;
       }
       h1 { font-size: 5.5rem; }
    }

    /* SMALL MOBILE (< 380px) */
    @media (max-width: 380px) {
      .btn { padding: 12px 20px; font-size: 0.9rem; }
      h1 { font-size: 2.2rem; }
    }

    /* Background Selector Panel */
    .bg-selector-toggle {
      position: relative;
      top: auto;
      left: auto;
      transform: none;
      z-index: 2147483647;
      height: 40px;
      padding: 0 16px;
      border-radius: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%);
      border: 1px solid rgba(255, 255, 255, 0.8);
      color: #000000;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 4px 20px rgba(255, 255, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
      white-space: nowrap;
      min-width: fit-content;
      overflow: hidden;
    }

    .bg-selector-toggle::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%
      );
      animation: shimmer 2.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% {
        left: -100%;
      }
      50%, 100% {
        left: 100%;
      }
    }

    .bg-selector-toggle:hover {
      background: linear-gradient(135deg, #ffffff 0%, #e8e8e8 50%, #ffffff 100%);
      border-color: rgba(255, 255, 255, 1);
      transform: scale(1.02);
      box-shadow: 
        0 4px 16px rgba(0, 0, 0, 0.2),
        0 8px 32px rgba(255, 255, 255, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 1);
    }

    .bg-selector-toggle svg {
      width: 16px;
      height: 16px;
      opacity: 1;
      flex-shrink: 0;
      stroke: #000000;
    }

    .bg-selector-panel {
      position: fixed;
      top: max(150px, calc(150px + env(safe-area-inset-top, 0px)));
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      width: 320px;
      max-height: 70vh;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      backdrop-filter: blur(30px) saturate(200%);
      -webkit-backdrop-filter: blur(30px) saturate(200%);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      transform-origin: top center;
      animation: slideDown 0.3s ease;
      box-sizing: border-box;
      max-width: calc(100vw - 32px);
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }

    .bg-selector-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
      background: rgba(10, 10, 14, 0.95);
    }

    .bg-selector-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .bg-selector-subtitle {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 4px;
    }

    .bg-selector-list {
      padding: 12px;
      max-height: 50vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      -webkit-overflow-scrolling: touch;
      background: rgba(8, 8, 12, 0.9);
    }

    .bg-selector-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .bg-selector-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .bg-selector-item.active {
      background: rgba(41, 151, 255, 0.15);
      border-color: rgba(41, 151, 255, 0.4);
    }

    .bg-selector-item.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .bg-item-toggle {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .bg-item-toggle.enabled {
      background: rgba(41, 151, 255, 0.3);
      border-color: rgba(41, 151, 255, 0.6);
    }

    .bg-item-info {
      flex: 1;
      min-width: 0;
    }

    .bg-item-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bg-item-shortcut {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 2px;
    }

    .bg-item-fav {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.3);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .bg-item-fav:hover {
      color: #2997ff;
      background: rgba(41, 151, 255, 0.1);
    }

    .bg-item-fav.favorited {
      color: #2997ff;
    }

    .bg-item-select {
      padding: 6px 12px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #fff;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .bg-item-select:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .bg-selector-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      background: rgba(10, 10, 14, 0.95);
    }

    .bg-footer-btn {
      flex: 1;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .bg-footer-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .bg-footer-btn.primary {
      background: rgba(41, 151, 255, 0.2);
      border-color: rgba(41, 151, 255, 0.4);
    }

    .bg-footer-btn.primary:hover {
      background: rgba(41, 151, 255, 0.3);
    }

    /* Keyboard shortcut toast */
    .bg-shortcut-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      padding: 12px 24px;
      background: rgba(20, 20, 23, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      color: #fff;
      font-size: 0.9rem;
      backdrop-filter: blur(10px);
      animation: toastIn 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    /* Mobile responsive for selector panel */
    @media (max-width: 480px) {
      .bg-selector-toggle {
        height: 40px;
        padding: 0 12px;
        font-size: 12px;
        gap: 6px;
        min-width: 44px;
      }
      .bg-selector-toggle span {
        display: none;
      }
      .bg-selector-panel {
        top: max(140px, calc(140px + env(safe-area-inset-top, 0px)));
        width: calc(100vw - 32px);
        max-width: none;
        left: 16px;
        transform: translateX(0);
        transform-origin: top left;
        max-height: calc(100vh - 180px - env(safe-area-inset-top, 0px));
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    }

    /* Extra small mobile (< 360px) */
    @media (max-width: 359px) {
      .bg-selector-toggle {
        height: 36px;
        padding: 0 10px;
      }
      .bg-selector-panel {
        top: max(130px, calc(130px + env(safe-area-inset-top, 0px)));
        width: calc(100vw - 20px);
        left: 10px;
        max-height: calc(100vh - 150px - env(safe-area-inset-top, 0px));
        border-radius: 12px;
      }
      .bg-selector-header {
        padding: 12px 16px;
      }
      .bg-selector-title {
        font-size: 0.85rem;
      }
      .bg-selector-subtitle {
        font-size: 0.65rem;
      }
      .bg-selector-list {
        max-height: 40vh;
        padding: 8px;
        gap: 4px;
      }
      .bg-selector-item {
        padding: 8px 10px;
        gap: 10px;
      }
      .bg-item-name {
        font-size: 0.8rem;
      }
      .bg-item-shortcut {
        font-size: 0.6rem;
      }
      .bg-item-select {
        padding: 4px 10px;
        font-size: 0.7rem;
      }
    }

  `}</style>
);
