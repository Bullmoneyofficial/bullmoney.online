"use client";

/**
 * FpsScrollOptimizer - Ultra-lightweight scroll performance optimizer
 * 
 * This component runs at the root level and:
 * 1. Detects scroll events and adds `is-scrolling` class to html
 * 2. Detects page visibility and adds `page-hidden` class
 * 3. Detects active interaction and adds `is-interacting` class
 * 
 * CSS rules in globals.css and fps-optimization.css respond to these classes
 * to pause expensive animations during scroll/interaction.
 * 
 * PERFORMANCE: This is a ZERO-RENDER component - no state, no re-renders
 */

import { useEffect, memo } from 'react';

// Singleton pattern - only initialize once globally
let isInitialized = false;
let scrollTimeout: number | null = null;
let interactionTimeout: number | null = null;

function initScrollOptimizer() {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  isInitialized = true;
  
  const html = document.documentElement;
  
  // ========================================
  // SCROLL DETECTION
  // ========================================
  let isScrolling = false;
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    scrollVelocity = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;
    
    // Only trigger class changes for significant scroll
    if (!isScrolling && scrollVelocity > 2) {
      isScrolling = true;
      html.classList.add('is-scrolling');
    }
    
    // Clear existing timeout
    if (scrollTimeout !== null) {
      cancelAnimationFrame(scrollTimeout);
    }
    
    // Use RAF for debounce - smoother than setTimeout
    scrollTimeout = requestAnimationFrame(() => {
      // Double RAF for next frame
      scrollTimeout = requestAnimationFrame(() => {
        // Check if scroll has stopped (velocity near zero)
        if (scrollVelocity < 1) {
          isScrolling = false;
          html.classList.remove('is-scrolling');
        }
      });
    });
  };
  
  // Use passive listener for best scroll performance
  window.addEventListener('scroll', handleScroll, { passive: true, capture: false });
  
  // ========================================
  // PAGE VISIBILITY DETECTION
  // ========================================
  const handleVisibilityChange = () => {
    if (document.hidden) {
      html.classList.add('page-hidden');
    } else {
      html.classList.remove('page-hidden');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
  
  // ========================================
  // INTERACTION DETECTION (for touch/drag)
  // ========================================
  let isInteracting = false;
  
  const handleInteractionStart = () => {
    if (!isInteracting) {
      isInteracting = true;
      html.classList.add('is-interacting');
    }
    
    if (interactionTimeout !== null) {
      clearTimeout(interactionTimeout);
    }
    
    // End interaction state after 100ms of no activity
    interactionTimeout = window.setTimeout(() => {
      isInteracting = false;
      html.classList.remove('is-interacting');
    }, 100);
  };
  
  // Touch events - most important for mobile performance
  window.addEventListener('touchstart', handleInteractionStart, { passive: true });
  window.addEventListener('touchmove', handleInteractionStart, { passive: true });
  
  // Pointer events for desktop dragging
  window.addEventListener('pointerdown', handleInteractionStart, { passive: true });
  
  // ========================================
  // LOW-POWER MODE DETECTION (if available)
  // ========================================
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && connection.saveData) {
      html.classList.add('save-data-mode');
    }
    
    connection?.addEventListener('change', () => {
      if (connection.saveData) {
        html.classList.add('save-data-mode');
      } else {
        html.classList.remove('save-data-mode');
      }
    });
  }
  
  // ========================================
  // REDUCED MOTION PREFERENCE
  // ========================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handleMotionPreference = (e: MediaQueryList | MediaQueryListEvent) => {
    if (e.matches) {
      html.classList.add('reduce-motion');
    } else {
      html.classList.remove('reduce-motion');
    }
  };
  
  handleMotionPreference(prefersReducedMotion);
  prefersReducedMotion.addEventListener('change', handleMotionPreference);
  
  // ========================================
  // INITIAL STATE
  // ========================================
  // Set initial visibility state
  if (document.hidden) {
    html.classList.add('page-hidden');
  }
  
  console.log('[FpsScrollOptimizer] Initialized - scroll/visibility/interaction detection active');
}

/**
 * FpsScrollOptimizer Component
 * 
 * Renders nothing - purely side-effect based for maximum performance.
 * Include once at the root of your app.
 */
export const FpsScrollOptimizer = memo(function FpsScrollOptimizer() {
  useEffect(() => {
    initScrollOptimizer();
  }, []);
  
  // Render nothing - this is a pure side-effect component
  return null;
});

export default FpsScrollOptimizer;
