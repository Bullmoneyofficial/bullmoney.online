"use client";

import React, { useEffect, useState, memo } from 'react';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

/**
 * ThemeOverlay v2.0
 * 
 * A global color overlay that applies theme effects across the entire app.
 * 
 * ARCHITECTURE:
 * - Uses position:fixed with pointer-events:none to not block interactions
 * - Applies CSS filter effects as an overlay layer (not on html/body)
 * - Works with all browsers including Safari/iOS
 * - Does NOT break scroll functionality
 * - Does NOT break fixed positioning
 * 
 * IMPORTANT: This component should be placed as a SIBLING to content, not wrapping it.
 */

interface ThemeOverlayProps {
  /** Enable/disable the filter overlay (filter can be GPU intensive) */
  enableFilter?: boolean;
  /** Custom z-index for the overlay */
  zIndex?: number;
}

export const ThemeOverlay = memo(function ThemeOverlay({ 
  enableFilter = true,
  zIndex = 0  // FIXED: Was 99998, now 0 - overlays should never be above content
}: ThemeOverlayProps) {
  const { activeTheme, isMobile } = useGlobalTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  // Detect low performance devices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkPerformance = () => {
      const html = document.documentElement;
      const isLow = html.classList.contains('fps-low') || 
                   html.classList.contains('fps-minimal') ||
                   html.classList.contains('is-ios');
      setIsLowPerformance(isLow);
    };
    
    checkPerformance();
    
    // Listen for FPS class changes
    const observer = new MutationObserver(checkPerformance);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Fade in after mount to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render filter overlay on low-performance devices
  if (!enableFilter || !activeTheme || isLowPerformance) {
    return null;
  }

  const filter = isMobile ? activeTheme.mobileFilter : activeTheme.filter;
  
  // Don't render if no filter is defined
  if (!filter || filter === 'none') {
    return null;
  }

  return (
    <div
      id="theme-filter-overlay"
      aria-hidden="true"
      data-theme-overlay
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        // CRITICAL: These prevent the overlay from blocking interactions
        pointerEvents: 'none',
        userSelect: 'none',
        touchAction: 'none',
        // Apply the theme filter
        filter: filter,
        WebkitFilter: filter,
        // Mix blend for natural color application
        mixBlendMode: 'normal',
        // Smooth transitions
        opacity: isVisible ? 0.08 : 0,
        transition: 'opacity 0.5s ease-in-out, filter 0.5s ease-in-out',
        // GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'opacity, filter',
        // FIXED: Don't use contain:strict - it creates stacking context issues
        contain: 'none',
        overflow: 'visible',
        // Ensure it's truly invisible to interactions
        isolation: 'auto',
      }}
    />
  );
});

/**
 * ThemeFilterWrapper
 * 
 * A wrapper that applies the theme filter to its children.
 * Use this to wrap specific sections that should have the filter applied.
 * 
 * SAFE to use - doesn't break scroll or fixed elements.
 */
interface ThemeFilterWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Whether to apply the filter */
  enabled?: boolean;
}

export const ThemeFilterWrapper = memo(function ThemeFilterWrapper({
  children,
  className = '',
  enabled = true
}: ThemeFilterWrapperProps) {
  const { activeTheme, isMobile } = useGlobalTheme();
  
  const filter = enabled && activeTheme 
    ? (isMobile ? activeTheme.mobileFilter : activeTheme.filter) 
    : 'none';

  return (
    <div
      className={`theme-filter-wrapper ${className}`}
      style={{
        filter: filter || 'none',
        WebkitFilter: filter || 'none',
        transition: 'filter 0.5s ease-in-out',
        // Ensure children can still scroll and be interactive
        touchAction: 'pan-y',
        overflowY: 'visible',
      }}
      data-allow-scroll
    >
      {children}
    </div>
  );
});

/**
 * useThemeFilter hook
 * 
 * Returns the current theme filter string for use in inline styles.
 */
export function useThemeFilter() {
  const { activeTheme, isMobile } = useGlobalTheme();
  
  const filter = activeTheme 
    ? (isMobile ? activeTheme.mobileFilter : activeTheme.filter) 
    : 'none';
    
  return {
    filter: filter || 'none',
    style: {
      filter: filter || 'none',
      WebkitFilter: filter || 'none',
      transition: 'filter 0.5s ease-in-out',
    }
  };
}

export default ThemeOverlay;
