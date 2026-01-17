"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

/**
 * Viewport State Context
 * 
 * Manages which sections are visible to the user
 * Allows components to optimize rendering based on scroll position
 * 
 * Prevents memory bloat by tracking only what's visible/near-visible
 */

interface ViewportState {
  visibleSections: Set<string>;
  nearbyElements: Set<string>;
  scrollY: number;
  scrollProgress: number;
}

interface ViewportContextType {
  state: ViewportState;
  registerSection: (sectionId: string, element: HTMLElement | null) => () => void;
  isSectionVisible: (sectionId: string) => boolean;
  isSectionNearby: (sectionId: string) => boolean;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function ViewportStateProvider({ children }: { children: ReactNode }) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [nearbyElements, setNearbyElements] = useState<Set<string>>(new Set());
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Use optimized scroll hook
  const {
    scrollY: scrollYFromHook,
    registerElement,
    isElementVisible,
  } = useScrollOptimization({
    throttleMs: 16.67,
    enableVisibilityTracking: true,
    enableMemoryOptimizations: true,
  });

  // Sync scroll position
  useEffect(() => {
    setScrollY(scrollYFromHook);
    
    // Calculate scroll progress
    if (typeof window !== 'undefined') {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollYFromHook / docHeight : 0;
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    }
  }, [scrollYFromHook]);

  // Register a section with visibility tracking
  const registerSection = useCallback((sectionId: string, element: HTMLElement | null) => {
    if (!element) return () => {};

    // Use the scroll optimization hook's element registration
    const cleanup = registerElement(sectionId, element, (isVisible) => {
      setVisibleSections((prev) => {
        const next = new Set(prev);
        if (isVisible) {
          next.add(sectionId);
          // Also add to nearby if visible
          const nearbySet = new Set(nearbyElements);
          nearbySet.add(sectionId);
          setNearbyElements(nearbySet);
        } else {
          next.delete(sectionId);
        }
        return next;
      });
    });

    // Add to nearby elements immediately (preload area)
    setNearbyElements((prev) => new Set(prev).add(sectionId));

    return () => {
      cleanup?.();
      setVisibleSections((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
      setNearbyElements((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    };
  }, [registerElement, nearbyElements]);

  // Check if a section is visible
  const isSectionVisible = useCallback((sectionId: string): boolean => {
    return visibleSections.has(sectionId);
  }, [visibleSections]);

  // Check if a section is in the nearby/preload area
  const isSectionNearby = useCallback((sectionId: string): boolean => {
    return nearbyElements.has(sectionId);
  }, [nearbyElements]);

  const state: ViewportState = {
    visibleSections,
    nearbyElements,
    scrollY,
    scrollProgress,
  };

  return (
    <ViewportContext.Provider
      value={{
        state,
        registerSection,
        isSectionVisible,
        isSectionNearby,
      }}
    >
      {children}
    </ViewportContext.Provider>
  );
}

/**
 * Hook to use viewport state
 */
export function useViewportState(): ViewportContextType {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewportState must be used within ViewportStateProvider');
  }
  return context;
}

/**
 * Hook to track a single section's visibility
 */
export function useVisibleSection(sectionId: string, elementRef: React.RefObject<HTMLElement>) {
  const { registerSection, isSectionVisible } = useViewportState();

  useEffect(() => {
    if (!elementRef.current) return;
    const cleanup = registerSection(sectionId, elementRef.current);
    return cleanup;
  }, [sectionId, elementRef, registerSection]);

  return isSectionVisible(sectionId);
}

/**
 * Hook to get scroll progress (0-1)
 */
export function useScrollProgress() {
  const { state } = useViewportState();
  return state.scrollProgress;
}
