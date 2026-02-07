'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState, memo } from 'react';
import { Renderer, Program, Mesh, Color as OglColor, Triangle } from 'ogl';
import { createSupabaseClient } from '@/lib/supabase';
import UltimateHub from './UltimateHub';
import ProductsSection from './ProductsSection';
import { useUltimateHubUI, useProductsModalUI, useBgPickerModalUI } from '@/contexts/UIStateContext';
import dynamic from 'next/dynamic';

// Dynamic import for Spline (heavy 3D component)
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

// Available Spline scenes
const SPLINE_SCENES = ['/scene1.splinecode', '/scene.splinecode', '/scene2.splinecode'];

// =============================================================================
// SPLINE ULTRA-FAST CACHING SYSTEM
// Target: <10ms load time on cached visits
// =============================================================================
const SPLINE_CACHE_NAME = 'spline-scenes-v1';
const SPLINE_MEMORY_CACHE = new Map<string, ArrayBuffer>();
let splineCacheInitialized = false;

// Check for pre-populated cache from layout script
function getGlobalMemoryCache(): Record<string, ArrayBuffer> {
  if (typeof window !== 'undefined' && (window as any).__SPLINE_MEMORY_CACHE__) {
    return (window as any).__SPLINE_MEMORY_CACHE__;
  }
  return {};
}

// Preload and cache all Spline scenes on first visit
async function initSplineCache(): Promise<void> {
  if (splineCacheInitialized || typeof window === 'undefined') return;
  splineCacheInitialized = true;

  const startTime = performance.now();
  console.log('[SplineCache] Initializing ultra-fast cache...');

  // First, sync from global memory cache (populated by layout script)
  const globalCache = getGlobalMemoryCache();
  Object.entries(globalCache).forEach(([scene, buffer]) => {
    if (!SPLINE_MEMORY_CACHE.has(scene)) {
      SPLINE_MEMORY_CACHE.set(scene, buffer);
      console.log(`[SplineCache] Synced ${scene} from global cache`);
    }
  });

  try {
    // Open persistent cache
    const cache = await caches.open(SPLINE_CACHE_NAME);

    // Check and load each scene
    await Promise.all(SPLINE_SCENES.map(async (scene) => {
      try {
        // Check memory first (fastest)
        if (SPLINE_MEMORY_CACHE.has(scene)) {
          console.log(`[SplineCache] ${scene} already in memory`);
          return;
        }

        // Check Cache API (second fastest)
        const cachedResponse = await cache.match(scene);
        if (cachedResponse) {
          const buffer = await cachedResponse.arrayBuffer();
          SPLINE_MEMORY_CACHE.set(scene, buffer);
          console.log(`[SplineCache] ${scene} loaded from Cache API in ${(performance.now() - startTime).toFixed(1)}ms`);
          return;
        }

        // Fetch and cache (first load only)
        console.log(`[SplineCache] Fetching ${scene} from network...`);
        const response = await fetch(scene, { 
          cache: 'force-cache',
          priority: 'high' as RequestPriority
        });
        
        if (response.ok) {
          // Clone for Cache API storage
          const responseClone = response.clone();
          await cache.put(scene, responseClone);
          
          // Store in memory for instant access
          const buffer = await response.arrayBuffer();
          SPLINE_MEMORY_CACHE.set(scene, buffer);
          console.log(`[SplineCache] ${scene} cached in ${(performance.now() - startTime).toFixed(1)}ms`);
        }
      } catch (err) {
        console.warn(`[SplineCache] Failed to cache ${scene}:`, err);
      }
    }));

    console.log(`[SplineCache] All scenes cached in ${(performance.now() - startTime).toFixed(1)}ms`);
  } catch (err) {
    console.warn('[SplineCache] Cache initialization failed:', err);
  }
}

// Get cached scene URL (creates blob URL from memory cache for fastest load)
function getCachedSplineScene(scene: string): string {
  // First check local memory cache
  let buffer = SPLINE_MEMORY_CACHE.get(scene);
  
  // Then check global cache from layout
  if (!buffer) {
    const globalCache = getGlobalMemoryCache();
    buffer = globalCache[scene];
    if (buffer) {
      SPLINE_MEMORY_CACHE.set(scene, buffer); // Sync to local
    }
  }
  
  if (buffer) {
    // Create blob URL from cached buffer - browser loads this instantly
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    return URL.createObjectURL(blob);
  }
  return scene; // Fallback to network URL
}

// Check if scene is cached (for instant load detection)
function isSplineCached(scene: string): boolean {
  if (SPLINE_MEMORY_CACHE.has(scene)) return true;
  const globalCache = getGlobalMemoryCache();
  return !!globalCache[scene];
}

// Initialize cache immediately on module load (before component renders)
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for non-blocking initialization
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => initSplineCache(), { timeout: 100 });
  } else {
    setTimeout(initSplineCache, 0);
  }

  // Also preload with link tags for browser-level caching
  SPLINE_SCENES.forEach((scene) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = scene;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Import the cool background effects
import LiquidEther from './LiquidEther';
import DarkVeil from './DarkVeil';
import LightPillar from './LightPillar';
import { GridScan } from './GridScan';
import Galaxy from './Galaxy';
import LetterGlitch from './LetterGlitch';
import Ballpit from './Ballpit';
import GridDistortion from './GridDistortion';

// -----------------------------------------------------------------------------
// 1. RESPONSIVE STYLES (One File Requirement)
// -----------------------------------------------------------------------------
const Styles = () => (
  <style>{`
    :root {
      --bg-dark: #050507;
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
      overflow: hidden; /* Contain background elements */
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

    /* CYCLING BACKGROUND EFFECTS LAYER - Main Background */
    .cycling-bg-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: auto; /* Allow Spline interactions */
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
      pointer-events: auto; /* Enable interactions when active */
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
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 20px;
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
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
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
      white-space: nowrap;
      min-width: fit-content;
    }

    .bg-selector-toggle:hover {
      background: rgba(0, 0, 0, 0.65);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateX(-50%) scale(1.02);
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .bg-selector-toggle svg {
      width: 16px;
      height: 16px;
      opacity: 0.9;
      flex-shrink: 0;
    }

    .bg-selector-panel {
      position: fixed;
      top: 130px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9997;
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
        top: 70px;
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
        top: 120px;
        width: calc(100vw - 32px);
        max-width: none;
        left: 16px;
        transform: translateX(0);
        transform-origin: top left;
        max-height: calc(100vh - 160px);
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
        top: 65px;
        height: 36px;
        padding: 0 10px;
      }
      .bg-selector-panel {
        top: 110px;
        width: calc(100vw - 20px);
        left: 10px;
        max-height: calc(100vh - 130px);
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

// -----------------------------------------------------------------------------
// 2. FAULTY TERMINAL (Low Memory Optimized)
// -----------------------------------------------------------------------------

const terminalVert = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const terminalFrag = `
precision mediump float;
varying vec2 vUv;
uniform float iTime;
uniform vec3 iResolution;
uniform float uScale;
uniform vec2 uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3 uTint;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;
float hash21(vec2 p){ p = fract(p * 234.56); p += dot(p, p + 34.56); return fract(p.x * p.y); }
float noise(vec2 p){ return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2; }
mat2 rotate(float angle){ float c = cos(angle); float s = sin(angle); return mat2(c, -s, s, c); }
float fbm(vec2 p){
  p *= 1.1; float f = 0.0; float amp = 0.5 * uNoiseAmp;
  mat2 modify0 = rotate(time * 0.02); f += amp * noise(p); p = modify0 * p * 2.0; amp *= 0.454545;
  mat2 modify1 = rotate(time * 0.02); f += amp * noise(p); p = modify1 * p * 2.0; amp *= 0.454545;
  mat2 modify2 = rotate(time * 0.08); f += amp * noise(p);
  return f;
}
float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0); vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time); mat2 rot1 = rotate(0.1);
  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}
float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;
    }
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }
    p = fract(p); p *= uDigitSize;
    float px5 = p.x * 5.0; float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5); float y = fract(py5);
    float i = floor(py5) - 2.0; float j = floor(px5) - 2.0;
    float n = i * i + j * j; float f = n * 0.0625;
    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}
vec3 getColor(vec2 p){
    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;
    float y = p.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    float displacement = sin(p.y * 20.0 + iTime) * 0.0125 * (step(0.8, sin(iTime + 4.0 * cos(iTime * 2.0))) * uFlickerAmount) * (1.0 + cos(iTime * 60.0)) * window;
    p.x += displacement;
    if (uGlitchAmount != 1.0) { float extra = displacement * (uGlitchAmount - 1.0); p.x += extra; }
    float middle = digit(p);
    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
    vec3 baseColor = vec3(0.0) * (1.0 - middle) + (vec3(0.9) * middle + sum * 0.1 * vec3(1.0)) * bar;
    return baseColor;
}
vec2 barrel(vec2 uv){ vec2 c = uv * 2.0 - 1.0; float r2 = dot(c, c); c *= 1.0 + uCurvature * r2; return c * 0.5 + 0.5; }
void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;
    if(uCurvature != 0.0){ uv = barrel(uv); }
    vec2 p = uv * uScale;
    vec3 col = getColor(p);
    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }
    col *= uTint; col *= uBrightness;
    if(uDither > 0.0){ float rnd = hash21(gl_FragCoord.xy); col += (rnd - 0.5) * (uDither * 0.003922); }
    gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

interface FaultyTerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  scale?: number; gridMul?: [number, number]; digitSize?: number; timeScale?: number;
  pause?: boolean; scanlineIntensity?: number; glitchAmount?: number; flickerAmount?: number;
  noiseAmp?: number; chromaticAberration?: number; dither?: number | boolean; curvature?: number;
  tint?: string; mouseReact?: boolean; mouseStrength?: number; dpr?: number;
  pageLoadAnimation?: boolean; brightness?: number; timeOffset?: number;
}

const FaultyTerminal = ({
  scale = 1, gridMul = [2, 1], digitSize = 1.5, timeScale = 0.3, pause = false,
  scanlineIntensity = 0.3, glitchAmount = 1, flickerAmount = 1, noiseAmp = 1, chromaticAberration = 0,
  dither = 0, curvature = 0.2, tint = '#ffffff', mouseReact = true, mouseStrength = 0.2,
  dpr = 1, pageLoadAnimation = true, brightness = 1, timeOffset, style, className, ...rest
}: FaultyTerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<Program>(null);
  const rendererRef = useRef<Renderer>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const frozenTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const loadAnimationStartRef = useRef<number>(0);
  const timeOffsetRef = useRef<number>(timeOffset ?? Math.random() * 100);
  
  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(() => (typeof dither === 'boolean' ? (dither ? 1 : 0) : dither), [dither]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
  }, []);

  // Touch support for Mobile
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left) / rect.width;
    const y = 1 - (e.touches[0].clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const renderer = new Renderer({ dpr });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 0); 
    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: terminalVert,
      fragment: terminalFrag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new OglColor(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uScale: { value: scale },
        uGridMul: { value: new Float32Array(gridMul) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },
        uTint: { value: new OglColor(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: { value: new Float32Array([smoothMouseRef.current.x, smoothMouseRef.current.y]) },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: brightness }
      }
    });
    programRef.current = program;
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!ctn || !renderer) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.iResolution.value = new OglColor(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(ctn);
    resize();

    const update = (t: number) => {
      rafRef.current = requestAnimationFrame(update);
      if (pageLoadAnimation && loadAnimationStartRef.current === 0) loadAnimationStartRef.current = t;
      if (!pause) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        program.uniforms.iTime.value = elapsed;
        frozenTimeRef.current = elapsed;
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current;
      }
      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        const progress = Math.min(animationElapsed / animationDuration, 1);
        program.uniforms.uPageLoadProgress.value = progress;
      }
      if (mouseReact) {
        const damping = 0.08;
        smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * damping;
        smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * damping;
        const mu = program.uniforms.uMouse.value as Float32Array;
        mu[0] = smoothMouseRef.current.x; mu[1] = smoothMouseRef.current.y;
      }
      renderer.render({ scene: mesh });
    };
    rafRef.current = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);
    
    if (mouseReact) {
        ctn.addEventListener('mousemove', handleMouseMove);
        ctn.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (mouseReact) {
        ctn.removeEventListener('mousemove', handleMouseMove);
        ctn.removeEventListener('touchmove', handleTouchMove);
      }
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [dpr, pause, timeScale, scale, digitSize, scanlineIntensity, glitchAmount, flickerAmount, noiseAmp, chromaticAberration, ditherValue, curvature, mouseReact, mouseStrength, pageLoadAnimation, brightness, handleMouseMove, handleTouchMove, tintVec]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style }} {...rest} />;
};

// -----------------------------------------------------------------------------
// 4. CYCLING BACKGROUND EFFECTS
// -----------------------------------------------------------------------------

type BackgroundEffect = 'spline' | 'liquidEther' | 'darkVeil' | 'lightPillar' | 'gridScan' | 'galaxy' | 'letterGlitch' | 'ballpit' | 'gridDistortion' | 'terminal';

interface CyclingBackgroundProps {
  reloadsPerCycle?: number; // Number of reloads before switching to next effect
  effects?: BackgroundEffect[];
  videoId?: string;
  videoLoading?: boolean;
  videoError?: boolean;
  onVideoError?: () => void;
  onOpenHub?: () => void;
  onOpenShop?: () => void;
  onOpenNewShop?: () => void;
}

// All available effects list for mapping favorites to indices
const ALL_EFFECTS: BackgroundEffect[] = ['spline', 'liquidEther', 'galaxy', 'terminal', 'darkVeil', 'lightPillar', 'letterGlitch', 'gridScan', 'ballpit', 'gridDistortion'];

// Helper to get initial effect index from localStorage (runs only once)
// FAVORITES PRIORITY: If user has favorites, ALWAYS show one of their favorites (100%)
const getInitialEffectIndex = (effectsLength: number, reloadsPerCycle: number): number => {
  // SSR safety - always return Spline (index 0)
  if (typeof window === 'undefined') return 0;
  
  try {
    // Check for user favorites FIRST - they take 100% priority
    const prefsStr = localStorage.getItem('bg-preferences');
    if (prefsStr) {
      const prefs = JSON.parse(prefsStr);
      const favorites: BackgroundEffect[] = prefs.favorites || [];
      const enabled: BackgroundEffect[] = prefs.enabled || [];
      
      // If user has favorites, ALWAYS show one of them (100% of the time)
      if (favorites.length > 0) {
        // Pick a random favorite
        const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
        const favIndex = ALL_EFFECTS.indexOf(randomFav);
        if (favIndex !== -1) {
          console.log('[CyclingBG] Showing FAVORITE:', randomFav, 'at index', favIndex);
          localStorage.setItem('bg-effect-index', favIndex.toString());
          return favIndex;
        }
      }
      
      // If no favorites but has enabled list, pick from enabled
      if (enabled.length > 0) {
        const randomEnabled = enabled[Math.floor(Math.random() * enabled.length)];
        const enabledIndex = ALL_EFFECTS.indexOf(randomEnabled);
        if (enabledIndex !== -1) {
          console.log('[CyclingBG] Showing enabled effect:', randomEnabled, 'at index', enabledIndex);
          localStorage.setItem('bg-effect-index', enabledIndex.toString());
          return enabledIndex;
        }
      }
    }
    
    // FORCE CLEAR old cache on version change - ensures Spline shows
    const VERSION_KEY = 'bullmoney-bg-version';
    const CURRENT_VERSION = 'v4-favorites-first';
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion !== CURRENT_VERSION) {
      // Clear all old data and force Spline
      localStorage.removeItem('bg-effect-index');
      localStorage.removeItem('bg-reload-count');
      sessionStorage.removeItem('bullmoney-bg-session-started');
      sessionStorage.removeItem('bg-first-effect-shown');
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      console.log('[CyclingBG] Version change detected - clearing cache, showing Spline');
    }
    
    // ALWAYS show Spline on first load of each browser session (if no favorites)
    const sessionKey = 'bullmoney-bg-session-started';
    const hasSessionStarted = sessionStorage.getItem(sessionKey);
    
    if (!hasSessionStarted) {
      // First load of this session - FORCE Spline
      sessionStorage.setItem(sessionKey, Date.now().toString());
      localStorage.setItem('bg-effect-index', '0');
      localStorage.setItem('bg-reload-count', '0');
      console.log('[CyclingBG] First session load - showing Spline (index 0)');
      return 0; // Spline is at index 0 - ALWAYS first on session start
    }
    
    const storedIndex = localStorage.getItem('bg-effect-index');
    const storedReloads = localStorage.getItem('bg-reload-count');
    
    let effectIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
    let reloadCount = storedReloads ? parseInt(storedReloads, 10) : 0;
    
    // Increment reload count
    reloadCount += 1;
    
    // Check if we should cycle to next effect
    if (reloadCount >= reloadsPerCycle) {
      // SPLINE PRIORITY: 80% chance to show Spline, 20% chance for random other effect
      const random = Math.random();
      if (random < 0.8) {
        // 80% - Go back to Spline
        effectIndex = 0;
      } else {
        // 20% - Pick a RANDOM non-Spline effect (never in order)
        // Generate random index from 1 to effectsLength-1 (excluding Spline at 0)
        const randomNonSplineIndex = Math.floor(Math.random() * (effectsLength - 1)) + 1;
        effectIndex = randomNonSplineIndex;
      }
      reloadCount = 0;
    }
    
    // Store updated values
    localStorage.setItem('bg-effect-index', effectIndex.toString());
    localStorage.setItem('bg-reload-count', reloadCount.toString());
    
    console.log('[CyclingBG] Showing effect index:', effectIndex, '(0=Spline, 1=LiquidEther, etc)');
    return effectIndex;
  } catch (e) {
    console.error('[CyclingBG] Error:', e);
    return 0; // Fallback - show Spline
  }
};

// SEO Text Component for BullMoney
interface BullMoneyHeroTextProps {
  onOpenHub?: () => void;
  onOpenShop?: () => void;
  onOpenNewShop?: () => void;
}

const BullMoneyHeroText: React.FC<BullMoneyHeroTextProps> = ({ onOpenHub, onOpenShop, onOpenNewShop }) => (
  <div className="hero-seo-text">
    <h1 className="hero-title">
      <span className="gradient-text">BULL</span>MONEY
    </h1>
    <p className="hero-tagline">Elite Trading Community & VIP Shop</p>
    <p className="hero-description">
      Join thousands of successful traders. Access exclusive signals, premium courses, 
      and our VIP community. Start your trading journey today.
    </p>
    <div className="hero-cta-buttons">
      <button onClick={onOpenHub} className="btn-vip">Access Trades & Tools</button>
      <button onClick={onOpenShop} className="btn-shop">GET VIP</button>
      <button onClick={onOpenNewShop} className="btn-shop btn-new-shop">Visit Shop</button>
    </div>
  </div>
);

// YouTube Video Player Component
const YouTubePlayer: React.FC<{ videoId: string; loading?: boolean; error?: boolean; onError?: () => void }> = ({ 
  videoId, loading, error, onError 
}) => (
  <div className="hero-video-container">
    {loading ? (
      <div className="video-loading">Loading...</div>
    ) : error ? (
      <div className="video-error">Video unavailable</div>
    ) : (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="BullMoney Live"
        onError={onError}
      />
    )}
  </div>
);

// --- SPLINE BACKGROUND COMPONENT (for cycling backgrounds) ---
const SplineBackground = memo(function SplineBackground() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [cachedSceneUrl, setCachedSceneUrl] = useState<string | null>(null);
  const splineRef = useRef<any>(null);
  const loadStartTime = useRef<number>(0);
  const blobUrlRef = useRef<string | null>(null);
  
  // Use scene1 for fastest load
  const scene = SPLINE_SCENES[0];

  // Initialize cache and get cached URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadStartTime.current = performance.now();

    // Ensure cache is initialized
    initSplineCache().then(() => {
      // Get cached blob URL for instant loading
      const url = getCachedSplineScene(scene);
      blobUrlRef.current = url.startsWith('blob:') ? url : null;
      setCachedSceneUrl(url);
      
      if (isSplineCached(scene)) {
        console.log(`[SplineBackground] Using cached scene (${(performance.now() - loadStartTime.current).toFixed(1)}ms to blob URL)`);
      }
    });

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [scene]);

  const handleLoad = useCallback((splineApp: any) => {
    const loadTime = performance.now() - loadStartTime.current;
    console.log(`[SplineBackground] ✅ Spline loaded in ${loadTime.toFixed(1)}ms`);
    splineRef.current = splineApp;
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('[SplineBackground] Load error:', error);
    setHasError(true);
  }, []);

  // Don't render until we have the cached URL ready
  const sceneToLoad = cachedSceneUrl || scene;

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ 
        zIndex: 0,
        touchAction: 'pan-y', // Allow vertical scrolling, Spline handles other gestures
        backgroundColor: '#000',
        pointerEvents: 'auto', // Enable interactions with Spline
        WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
      }}
    >
      {/* SVG Filter for grayscale compatibility */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="grayscale-filter-hero">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.1" />
              <feFuncG type="linear" slope="1.1" />
              <feFuncB type="linear" slope="1.1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Animated gradient fallback */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 40%), #000',
          opacity: hasError || !isLoaded ? 1 : 0,
          transition: 'opacity 500ms ease-out',
          zIndex: -1,
        }}
      >
        {hasError && (
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Spline container - uses cached blob URL for instant loading */}
      {!hasError && cachedSceneUrl && (
        <Spline
          scene={sceneToLoad}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            opacity: isLoaded ? 1 : 0.6,
            transition: 'opacity 400ms ease-out',
            filter: 'grayscale(100%) saturate(0) contrast(1.1)',
            WebkitFilter: 'grayscale(100%) saturate(0) contrast(1.1)',
            pointerEvents: 'auto',
            zIndex: 1,
          } as React.CSSProperties}
        />
      )}

      {/* Color-kill overlay - above Spline for color effect, but pointer-events:none lets clicks through */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          backgroundColor: '#808080',
          mixBlendMode: 'color',
          WebkitMixBlendMode: 'color',
          pointerEvents: 'none',
        } as React.CSSProperties}
      />

      {/* Extra saturation kill overlay - above Spline for effect, pointer-events:none lets clicks through */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 11,
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
          mixBlendMode: 'saturation',
          WebkitMixBlendMode: 'saturation',
          pointerEvents: 'none',
        } as React.CSSProperties}
      />
    </div>
  );
});

// Background effect names for display
const EFFECT_NAMES: Record<BackgroundEffect, string> = {
  'spline': '3D Spline Scene',
  'liquidEther': 'Liquid Ether',
  'galaxy': 'Galaxy Stars',
  'terminal': 'Matrix Terminal',
  'darkVeil': 'Dark Veil',
  'lightPillar': 'Light Pillar',
  'letterGlitch': 'Letter Glitch',
  'gridScan': 'Grid Scan',
  'ballpit': 'Ball Pit',
  'gridDistortion': 'Grid Distortion'
};

// Load favorites and enabled effects from localStorage
const loadBgPreferences = (): { favorites: BackgroundEffect[], enabled: BackgroundEffect[] } => {
  if (typeof window === 'undefined') return { favorites: [], enabled: [] };
  try {
    const stored = localStorage.getItem('bg-preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[BGPrefs] Error loading:', e);
  }
  return { favorites: [], enabled: [] };
};

// Save preferences to localStorage
const saveBgPreferences = (favorites: BackgroundEffect[], enabled: BackgroundEffect[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bg-preferences', JSON.stringify({ favorites, enabled }));
  } catch (e) {
    console.error('[BGPrefs] Error saving:', e);
  }
};

const CyclingBackground: React.FC<CyclingBackgroundProps> = ({ 
  reloadsPerCycle = 2, // Switch background every 2 reloads
  // SPLINE FIRST (index 0) - prioritized 60% of the time
  effects = ['spline', 'liquidEther', 'galaxy', 'terminal', 'darkVeil', 'lightPillar', 'letterGlitch', 'gridScan', 'ballpit', 'gridDistortion'],
  videoId = 'jfKfPfyJRdk',
  videoLoading = false,
  videoError = false,
  onVideoError,
  onOpenHub,
  onOpenShop,
  onOpenNewShop
}) => {
  // Use context for BG picker panel state with mutual exclusion
  const { isOpen: showPanel, setIsOpen: setShowPanel } = useBgPickerModalUI();
  
  // Use lazy initialization to get index synchronously on first render - prevents flicker
  const [currentIndex, setCurrentIndex] = useState(() => getInitialEffectIndex(effects.length, reloadsPerCycle));
  const [isReady, setIsReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<BackgroundEffect[]>([]);
  const [enabledEffects, setEnabledEffects] = useState<BackgroundEffect[]>(effects as BackgroundEffect[]);

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadBgPreferences();
    if (prefs.favorites.length > 0) {
      setFavorites(prefs.favorites);
    }
    if (prefs.enabled.length > 0) {
      setEnabledEffects(prefs.enabled);
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Switch to specific background
  const switchToBackground = useCallback((index: number) => {
    if (index >= 0 && index < effects.length) {
      const effect = effects[index] as BackgroundEffect;
      if (!enabledEffects.includes(effect)) {
        showToast(`${EFFECT_NAMES[effect]} is disabled`);
        return;
      }
      setCurrentIndex(index);
      localStorage.setItem('bg-effect-index', index.toString());
      localStorage.setItem('bg-reload-count', '0');
      showToast(`Switched to ${EFFECT_NAMES[effect]}`);
    }
  }, [effects, enabledEffects, showToast]);

  // Toggle favorite
  const toggleFavorite = useCallback((effect: BackgroundEffect) => {
    setFavorites(prev => {
      const newFavs = prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect];
      saveBgPreferences(newFavs, enabledEffects);
      return newFavs;
    });
  }, [enabledEffects]);

  // Toggle enabled/disabled
  const toggleEnabled = useCallback((effect: BackgroundEffect) => {
    setEnabledEffects(prev => {
      // Don't allow disabling the last enabled effect
      if (prev.length === 1 && prev.includes(effect)) {
        showToast('At least one background must be enabled');
        return prev;
      }
      const newEnabled = prev.includes(effect)
        ? prev.filter(e => e !== effect)
        : [...prev, effect];
      saveBgPreferences(favorites, newEnabled);
      return newEnabled;
    });
  }, [favorites, showToast]);

  // Enable all effects
  const enableAll = useCallback(() => {
    setEnabledEffects(effects as BackgroundEffect[]);
    saveBgPreferences(favorites, effects as BackgroundEffect[]);
    showToast('All backgrounds enabled');
  }, [effects, favorites, showToast]);

  // Enable only favorites
  const enableFavoritesOnly = useCallback(() => {
    if (favorites.length === 0) {
      showToast('No favorites set');
      return;
    }
    setEnabledEffects(favorites);
    saveBgPreferences(favorites, favorites);
    showToast('Showing favorites only');
  }, [favorites, showToast]);

  // Keyboard shortcuts: Ctrl + 1-12 (or 0 for 10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl key (or Cmd on Mac)
      if (!e.ctrlKey && !e.metaKey) return;
      
      let index = -1;
      
      // Number keys 1-9 for backgrounds 1-9
      if (e.key >= '1' && e.key <= '9') {
        index = parseInt(e.key, 10) - 1;
      }
      // 0 key for background 10
      else if (e.key === '0') {
        index = 9;
      }
      // - key for background 11
      else if (e.key === '-') {
        index = 10;
      }
      // = key for background 12
      else if (e.key === '=') {
        index = 11;
      }
      // B key to toggle panel
      else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowPanel(!showPanel);
        return;
      }
      
      if (index >= 0 && index < effects.length) {
        e.preventDefault();
        switchToBackground(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effects.length, switchToBackground]);

  // Small delay to ensure component is fully mounted before showing
  useEffect(() => {
    // Use requestAnimationFrame to ensure we're past the paint
    const raf = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentEffect = effects[currentIndex];

  // Determine what content to show based on effect
  const getContentOverlay = (effect: BackgroundEffect) => {
    switch (effect) {
      case 'spline':
        return null; // No overlay for Spline - let it shine on its own
      case 'liquidEther':
      case 'galaxy':
      case 'terminal':
      case 'darkVeil':
        return <BullMoneyHeroText onOpenHub={onOpenHub} onOpenShop={onOpenShop} onOpenNewShop={onOpenNewShop} />;
      case 'lightPillar':
        return <YouTubePlayer videoId={videoId} loading={videoLoading} error={videoError} onError={onVideoError} />;
      case 'letterGlitch':
      case 'gridScan':
      case 'ballpit':
      case 'gridDistortion':
      default:
        return null; // No overlay
    }
  };

  // Render a single effect component - only one at a time for memory efficiency
  const renderEffect = (effect: BackgroundEffect) => {
    switch (effect) {
      case 'spline':
        return <SplineBackground />;
      case 'liquidEther':
        return (
          <LiquidEther
            colors={['#ffffff', '#e8e8e8', '#d0d0d0']}
            mouseForce={10}
            cursorSize={60}
            isViscous={false}
            viscous={15}
            iterationsViscous={8}
            iterationsPoisson={8}
            resolution={0.25}
            isBounce={false}
            autoDemo
            autoSpeed={0.3}
            autoIntensity={1.2}
            takeoverDuration={0.3}
            autoResumeDelay={3000}
            autoRampDuration={0.5}
          />
        );
      case 'darkVeil':
        return (
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <DarkVeil
              hueShift={0}
              noiseIntensity={0.01}
              scanlineIntensity={0}
              speed={0.3}
              scanlineFrequency={0}
              warpAmount={0.05}
              resolutionScale={1}
            />
          </div>
        );
      case 'lightPillar':
        return (
          <LightPillar
            topColor="#ffffff"
            bottomColor="#cccccc"
            intensity={0.6}
            rotationSpeed={0.15}
            glowAmount={0.002}
            pillarWidth={2}
            pillarHeight={0.3}
            noiseIntensity={0.2}
            pillarRotation={15}
            interactive={false}
            mixBlendMode="screen"
            quality="low"
          />
        );
      case 'gridScan':
        return (
          <GridScan
            sensitivity={0.4}
            lineThickness={1}
            linesColor="#444444"
            gridScale={0.15}
            scanColor="#ffffff"
            scanOpacity={0.3}
            enablePost={false}
            bloomIntensity={0}
            chromaticAberration={0}
            noiseIntensity={0.005}
            scanDuration={4}
            scanDelay={2}
          />
        );
      case 'galaxy':
        return (
          <Galaxy
            mouseRepulsion={false}
            mouseInteraction={false}
            density={0.8}
            glowIntensity={0.4}
            saturation={0}
            hueShift={0}
            twinkleIntensity={0.05}
            rotationSpeed={0.015}
            repulsionStrength={1}
            autoCenterRepulsion={0}
            starSpeed={0.15}
            speed={0.2}
            transparent={false}
            disableAnimation={false}
          />
        );
      case 'letterGlitch':
        return (
          <LetterGlitch
            glitchColors={['#ffffff', '#dddddd', '#bbbbbb']}
            glitchSpeed={80}
            centerVignette={true}
            outerVignette={true}
            smooth={false}
            characters="BULLMONEY"
          />
        );
      case 'ballpit':
        return (
          <Ballpit
            count={40}
            gravity={0.005}
            friction={0.99}
            wallBounce={0.85}
            followCursor={false}
          />
        );
      case 'gridDistortion':
        return (
          <GridDistortion
            imageSrc="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=60"
            grid={8}
            mouse={0.08}
            strength={0.08}
            relaxation={0.95}
          />
        );
      case 'terminal':
        return (
          <FaultyTerminal
            scale={1.5}
            gridMul={[1.5, 1]}
            digitSize={1}
            timeScale={0.3}
            scanlineIntensity={0.4}
            glitchAmount={0.5}
            flickerAmount={0.4}
            noiseAmp={0.8}
            curvature={0.03}
            tint="#ffffff"
            mouseReact={false}
            mouseStrength={0}
            pageLoadAnimation={false}
            brightness={0.5}
            dpr={0.75}
          />
        );
      default:
        return null;
    }
  };

  // Get shortcut key label
  const getShortcutKey = (index: number): string => {
    if (index < 9) return `Ctrl+${index + 1}`;
    if (index === 9) return 'Ctrl+0';
    if (index === 10) return 'Ctrl+-';
    if (index === 11) return 'Ctrl+=';
    return '';
  };

  return (
    <div className="cycling-bg-layer">
      {/* Single effect - only one rendered at a time for memory efficiency */}
      <div 
        className={`cycling-bg-item ${isReady ? 'active' : ''}`}
        key={`effect-${currentIndex}`}
      >
        {renderEffect(currentEffect)}
      </div>
      
      {/* Content overlay based on current effect */}
      {isReady && (
        <div className="hero-content-overlay">
          {getContentOverlay(currentEffect)}
        </div>
      )}

      {/* Background Selector Toggle Button */}
      <button 
        className="bg-selector-toggle"
        onClick={() => setShowPanel(!showPanel)}
        title="Background Settings (Ctrl+B)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>BG Picker</span>
      </button>

      {/* Background Selector Panel */}
      {showPanel && (
        <div className="bg-selector-panel">
          <div className="bg-selector-header">
            <div>
              <h3 className="bg-selector-title">Background Effects</h3>
              <p className="bg-selector-subtitle">Use Ctrl+1-0,-,= to quick switch</p>
            </div>
            <button 
              onClick={() => setShowPanel(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          
          <div className="bg-selector-list">
            {(effects as BackgroundEffect[]).map((effect, index) => {
              const isActive = currentIndex === index;
              const isEnabled = enabledEffects.includes(effect);
              const isFavorite = favorites.includes(effect);
              
              return (
                <div 
                  key={effect}
                  className={`bg-selector-item ${isActive ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}
                >
                  <div 
                    className={`bg-item-toggle ${isEnabled ? 'enabled' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(effect); }}
                    title={isEnabled ? 'Click to disable' : 'Click to enable'}
                  >
                    {isEnabled ? '✓' : ''}
                  </div>
                  
                  <div className="bg-item-info" onClick={() => isEnabled && switchToBackground(index)}>
                    <div className="bg-item-name">{EFFECT_NAMES[effect]}</div>
                    {index < 12 && (
                      <div className="bg-item-shortcut">{getShortcutKey(index)}</div>
                    )}
                  </div>
                  
                  <button
                    className={`bg-item-fav ${isFavorite ? 'favorited' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(effect); }}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite ? '★' : '☆'}
                  </button>
                  
                  <button
                    className="bg-item-select"
                    onClick={() => isEnabled && switchToBackground(index)}
                    disabled={!isEnabled}
                  >
                    {isActive ? 'Active' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="bg-selector-footer">
            <button className="bg-footer-btn" onClick={enableAll}>
              Enable All
            </button>
            <button className="bg-footer-btn primary" onClick={enableFavoritesOnly}>
              Favorites Only
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="bg-shortcut-toast">
          {toast}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 5. MAIN HERO COMPONENT
// -----------------------------------------------------------------------------

interface HeroProps {
  sources?: string[];
  onOpenModal?: () => void;
  variant?: string;
}

interface LiveStreamVideo {
  id: string;
  title: string;
  youtube_id: string;
  is_live: boolean;
  order_index: number;
}

export default function Hero({ sources, onOpenModal, variant }: HeroProps) {
  const [videos, setVideos] = useState<LiveStreamVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showNewShopModal, setShowNewShopModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use UIStateContext for proper modal management (mutual exclusion)
  const { isUltimateHubOpen, setUltimateHubOpen } = useUltimateHubUI();
  const { isOpen: isProductsModalOpen, setIsOpen: setProductsModalOpen } = useProductsModalUI();

  // Modal handlers
  const handleOpenHub = useCallback(() => {
    setUltimateHubOpen(true);
  }, [setUltimateHubOpen]);

  const handleOpenShop = useCallback(() => {
    setProductsModalOpen(true);
  }, [setProductsModalOpen]);

  const handleOpenNewShop = useCallback(() => {
    setShowNewShopModal(true);
  }, []);

  // Detect desktop vs mobile
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  // Fetch videos from Supabase livestream_videos table
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const supabase = createSupabaseClient();
        
        const { data, error } = await supabase
          .from('livestream_videos')
          .select('*')
          .order('is_live', { ascending: false }) // Prioritize live streams
          .order('order_index', { ascending: true });
        
        if (error) {
          console.error('Error fetching videos:', error);
        } else if (data && data.length > 0) {
          // Normalize is_live to boolean
          const normalizedVideos = data.map(video => ({
            ...video,
            is_live: video.is_live === true || video.is_live === 'true'
          }));
          setVideos(normalizedVideos);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  const currentVideo = videos[currentVideoIndex];
  
  // Skip to next video on error
  const handleVideoError = useCallback(() => {
    console.log('Video failed to load, trying next video...');
    setVideoError(true);
    
    // Try next video after a short delay
    setTimeout(() => {
      setCurrentVideoIndex(prev => {
        const nextIndex = (prev + 1) % videos.length;
        setVideoError(false);
        return nextIndex;
      });
    }, 1000);
  }, [videos.length]);

  // Listen for iframe errors
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('Video loaded successfully');
      setVideoError(false);
    };

    const handleError = () => {
      console.log('Video iframe error');
      handleVideoError();
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [handleVideoError, currentVideo]);
  
  // Auto-advance through videos every 3 minutes if not live
  useEffect(() => {
    if (!currentVideo || currentVideo.is_live || videos.length <= 1) return;
    
    const timer = setTimeout(() => {
      setCurrentVideoIndex(prev => (prev + 1) % videos.length);
    }, 180000); // 3 minutes
    
    return () => clearTimeout(timer);
  }, [currentVideo, videos.length]);
  
  const videoTitle = currentVideo?.title || 'Loading...';
  const isLive = currentVideo?.is_live || false;
  const videoId = currentVideo?.youtube_id || 'jfKfPfyJRdk';
  
  return (
    <>
      <Styles />
      <div className="hero-wrapper">
        
        {/* Cycling Background Effects - SPLINE FIRST */}
        <CyclingBackground 
          reloadsPerCycle={2} 
          effects={['spline', 'liquidEther', 'galaxy', 'terminal', 'darkVeil', 'lightPillar', 'letterGlitch', 'gridScan', 'ballpit', 'gridDistortion']}
          videoId={videoId}
          videoLoading={loading}
          videoError={videoError}
          onVideoError={handleVideoError}
          onOpenHub={handleOpenHub}
          onOpenShop={handleOpenShop}
          onOpenNewShop={handleOpenNewShop}
        />

      </div>

      {/* Ultimate Hub Modal - Uses UIStateContext */}
      {isUltimateHubOpen && (
        <div className="modal-overlay" onClick={() => setUltimateHubOpen(false)}>
          <div className="modal-content modal-content-hub" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setUltimateHubOpen(false)}>×</button>
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
              <UltimateHub />
            </div>
          </div>
        </div>
      )}

      {/* Products Modal - Uses UIStateContext */}
      {isProductsModalOpen && (
        <div className="modal-overlay" onClick={() => setProductsModalOpen(false)}>
          <div className="modal-content modal-content-hub" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProductsModalOpen(false)}>×</button>
            <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#0a0a0c' }}>
              <ProductsSection />
            </div>
          </div>
        </div>
      )}

      {/* New Shop Modal */}
      {showNewShopModal && (
        <div className="modal-overlay" onClick={() => setShowNewShopModal(false)}>
          <div className="modal-content modal-content-hub" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewShopModal(false)}>×</button>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #0a0a0c 0%, #151518 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#fff',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 700 }}>🛒 BullMoney Shop</h2>
              <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginBottom: '40px', maxWidth: '500px' }}>
                Premium trading merchandise, courses, and exclusive VIP access coming soon.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '30px',
                  width: '200px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Trading Courses</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '30px',
                  width: '200px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👕</div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Merch Store</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '30px',
                  width: '200px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💎</div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>VIP Membership</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}