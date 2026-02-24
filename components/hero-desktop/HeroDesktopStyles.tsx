import React from 'react';

// -----------------------------------------------------------------------------
// 1. RESPONSIVE STYLES (One File Requirement)
// -----------------------------------------------------------------------------
export const Styles = () => (
  <style>{`
    @keyframes spline-dl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
      min-height: 100vh; /* Fill at least one screen */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: visible; /* FIXED: Allow scroll to propagate through hero */
      overflow-x: hidden; /* Prevent horizontal overflow only */
      touch-action: pan-y; /* FIXED: Allow vertical scroll passthrough */
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
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* CYCLING BACKGROUND EFFECTS LAYER - Main Background */
    .cycling-bg-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: auto; /* Allow Spline mouse interaction on desktop */
      touch-action: pan-y; /* Allow scroll passthrough on touch */
      overflow: hidden;
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
    }

    .cycling-bg-item.active {
      opacity: 1;
      pointer-events: auto; /* Allow Spline mouse interaction on desktop */
      touch-action: pan-y;
    }

    .cycling-bg-item.fading-out {
      opacity: 0;
      transition: opacity 2s cubic-bezier(0.4, 0, 0.2, 1);
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 20px;
      box-sizing: border-box;
    }

    .hero-content-overlay > * {
      pointer-events: auto;
    }

    /* When content overlay has no content (only BG picker), center just the picker */
    .hero-content-overlay.picker-only {
      justify-content: center;
    }

    /* When content overlay has content, position picker at top with content centered below */
    .hero-content-overlay.has-content {
      justify-content: flex-start;
      padding-top: 60px;
    }

    .hero-content-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
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
      z-index: 9998;
      height: 40px;
      padding: 0 16px;
      border-radius: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 500;
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
        0 1px 3px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
      margin-bottom: 20px;
    }

    .bg-selector-toggle:hover {
      background: rgba(0, 0, 0, 0.65);
      border-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.02);
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .bg-selector-toggle svg {
      width: 16px;
      height: 16px;
      opacity: 0.9;
    }

    .bg-selector-panel {
      position: fixed;
      top: 130px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      width: 320px;
      max-height: 70vh;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      transform-origin: top center;
      animation: slideDown 0.3s ease;
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
      z-index: 9999;
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
        height: 38px;
        padding: 0 12px;
        font-size: 12px;
      }
      .bg-selector-panel {
        top: 100px;
        width: calc(100vw - 32px);
        max-width: 360px;
      }
      .hero-content-overlay.has-content {
        padding-top: 40px;
      }
    }

  `}</style>
);
