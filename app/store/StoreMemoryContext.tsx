'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

// ============================================================================
// STORE MEMORY CONTEXT - Smart Visibility & Resource Management
// Uses IntersectionObserver + idle detection to pause/unmount heavy components
// Works on mobile (no hover dependency), saves GPU/CPU/network
// ============================================================================

type SectionId = 'hero' | 'featured' | 'products' | 'fluidGlass' | 'footer';

interface SectionState {
  /** Section is in the viewport (IntersectionObserver) */
  inView: boolean;
  /** Section should be fully rendered (in or near viewport) */
  shouldRender: boolean;
  /** Heavy animations/fetches should be running */
  shouldAnimate: boolean;
}

interface StoreMemoryContextType {
  /** Per-section visibility & animation state */
  sections: Record<SectionId, SectionState>;
  /** Register a section ref for IntersectionObserver tracking */
  registerSection: (id: SectionId, el: HTMLElement | null) => void;
  /** True when user is actively interacting (scrolling, clicking, hovering products) */
  isUserActive: boolean;
  /** Legacy compat - true when any interactive section is being hovered */
  hideHeavyElements: boolean;
  setHideHeavyElements: (hide: boolean) => void;
}

const DEFAULT_SECTION: SectionState = {
  inView: false,
  shouldRender: false,
  shouldAnimate: false,
};

const DEFAULT_SECTIONS: Record<SectionId, SectionState> = {
  hero: { ...DEFAULT_SECTION, shouldRender: true, shouldAnimate: true }, // visible on load
  featured: { ...DEFAULT_SECTION },
  products: { ...DEFAULT_SECTION },
  fluidGlass: { ...DEFAULT_SECTION },
  footer: { ...DEFAULT_SECTION },
};

const StoreMemoryContext = createContext<StoreMemoryContextType | undefined>(undefined);

export function StoreMemoryProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<SectionId, SectionState>>(DEFAULT_SECTIONS);
  const [isUserActive, setIsUserActive] = useState(true);
  const [hideHeavyElements, setHideHeavyElements] = useState(false);

  // Track element refs for each section
  const elementsRef = useRef<Map<SectionId, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    setIsUserActive(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsUserActive(false);
    }, 20000); // 20s idle = pause off-screen animations
  }, []);

  // Set up IntersectionObserver with generous rootMargin (preload nearby sections)
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setSections((prev) => {
          const next = { ...prev };
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.sectionId as SectionId;
            if (!id) continue;
            const inView = entry.isIntersecting;
            next[id] = {
              inView,
              // Keep rendered if in view OR was recently in view (prevent flicker)
              shouldRender: inView || prev[id].shouldRender,
              // Animate only when in view
              shouldAnimate: inView,
            };
          }
          return next;
        });
      },
      {
        // Render 50vh before section enters viewport, keep 25vh after leaving
        rootMargin: '50% 0px 50% 0px',
        threshold: [0, 0.1],
      }
    );

    // Observe all registered elements
    elementsRef.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  // Unrender sections that have been off-screen for a while (cleanup timer)
  useEffect(() => {
    const cleanup = setInterval(() => {
      setSections((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of Object.keys(next) as SectionId[]) {
          if (!next[id].inView && next[id].shouldRender) {
            // Off-screen + still rendered → unrender after grace period
            next[id] = { ...next[id], shouldRender: false, shouldAnimate: false };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 8000); // 8s grace period before unrendering off-screen sections
    return () => clearInterval(cleanup);
  }, []);

  // Pause animations on idle
  useEffect(() => {
    if (!isUserActive) {
      setSections((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of Object.keys(next) as SectionId[]) {
          if (next[id].shouldAnimate && !next[id].inView) {
            next[id] = { ...next[id], shouldAnimate: false };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [isUserActive]);

  // Listen for user activity (scroll, pointer, touch)
  useEffect(() => {
    const events = ['scroll', 'pointermove', 'pointerdown', 'touchstart', 'keydown'] as const;
    const handler = () => resetIdleTimer();

    for (const evt of events) {
      window.addEventListener(evt, handler, { passive: true });
    }
    resetIdleTimer(); // start fresh

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, handler);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Register/unregister section elements
  const registerSection = useCallback((id: SectionId, el: HTMLElement | null) => {
    if (el) {
      el.dataset.sectionId = id;
      elementsRef.current.set(id, el);
      observerRef.current?.observe(el);
    } else {
      const existing = elementsRef.current.get(id);
      if (existing) {
        observerRef.current?.unobserve(existing);
        elementsRef.current.delete(id);
      }
    }
  }, []);

  return (
    <StoreMemoryContext.Provider 
      value={{ sections, registerSection, isUserActive, hideHeavyElements, setHideHeavyElements }}
    >
      {children}
    </StoreMemoryContext.Provider>
  );
}

export function useStoreMemory() {
  const context = useContext(StoreMemoryContext);
  if (!context) {
    throw new Error('useStoreMemory must be used within StoreMemoryProvider');
  }
  return context;
}

/** Hook for individual section - returns visibility/animation state + ref callback */
export function useStoreSection(id: SectionId) {
  const { sections, registerSection } = useStoreMemory();
  const state = sections[id] || DEFAULT_SECTION;

  const ref = useCallback(
    (el: HTMLElement | null) => registerSection(id, el),
    [id, registerSection]
  );

  return { ...state, ref };
}
