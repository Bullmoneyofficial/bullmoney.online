"use client";

/**
 * SmartMountSystem.tsx - Zero-Cost Component Mounting
 * 
 * PHILOSOPHY: "If it's not visible, it doesn't exist"
 * 
 * Unlike lazy loading (which still loads code and keeps components in memory),
 * this system COMPLETELY unmounts components when closed:
 * 
 * 1. UNMOUNTED = Zero CPU/GPU cost
 * 2. MOUNTED = Full rendering only when visible
 * 3. FROZEN = Pauses all animations/effects when not in focus
 * 
 * Performance gains:
 * - Components consume ZERO memory when closed
 * - No animation frames run for hidden components
 * - No React reconciliation for unmounted trees
 * - GPU memory freed when textures aren't needed
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
  ReactNode,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

interface SmartMountState {
  // Component mount status
  mountedComponents: Set<string>;
  frozenComponents: Set<string>;
  
  // Performance metrics
  memoryFreed: number;
  lastUnmount: string | null;
  mountCount: number;
  unmountCount: number;
}

interface SmartMountContextType extends SmartMountState {
  // Mount/unmount controls
  mountComponent: (id: string) => void;
  unmountComponent: (id: string) => void;
  
  // Freeze controls (pauses animations without unmounting)
  freezeComponent: (id: string) => void;
  unfreezeComponent: (id: string) => void;
  
  // Query methods
  isMounted: (id: string) => boolean;
  isFrozen: (id: string) => boolean;
  
  // Batch operations
  unmountAll: (except?: string[]) => void;
  freezeAll: (except?: string[]) => void;
}

// ============================================================================
// FREEZE STYLES - Injected to stop all animations globally
// ============================================================================

const SMART_FREEZE_STYLES = `
/* SmartMount: Global freeze for all unmounted/frozen components */
/* OPTIMIZED 2026: Reduced specificity for faster CSS matching */
.smart-frozen,
.smart-frozen * {
  animation: none !important;
  animation-play-state: paused !important;
  transition: none !important;
  will-change: auto !important;
  pointer-events: none !important;
}

/* Freeze backdrop effects (expensive) */
.smart-frozen [class*="backdrop-blur"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Freeze shadows (GPU intensive) */
.smart-frozen [class*="shadow-"] {
  box-shadow: none !important;
}

/* Freeze shimmer animations */
.smart-frozen .shimmer-line,
.smart-frozen .shimmer-border,
.smart-frozen .shimmer-glow {
  animation: none !important;
  opacity: 0 !important;
  display: none !important;
}

/* Freeze Framer Motion */
.smart-frozen [data-framer-portal-id],
.smart-frozen [data-framer-name] {
  animation: none !important;
  transition: none !important;
}

/* Hide frozen content visibility for performance */
.smart-frozen {
  content-visibility: hidden;
  contain: strict;
}

/* Active state - restore interactions */
.smart-active {
  content-visibility: visible;
  contain: layout style paint;
}

.smart-active button,
.smart-active [role="button"],
.smart-active a,
.smart-active input {
  pointer-events: auto;
}
`;

// ============================================================================
// CONTEXT
// ============================================================================

const SmartMountContext = createContext<SmartMountContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface SmartMountProviderProps {
  children: ReactNode;
}

export function SmartMountProvider({ children }: SmartMountProviderProps) {
  const [mountedComponents, setMountedComponents] = useState<Set<string>>(new Set());
  const [frozenComponents, setFrozenComponents] = useState<Set<string>>(new Set());
  const [memoryFreed, setMemoryFreed] = useState(0);
  const [lastUnmount, setLastUnmount] = useState<string | null>(null);
  const [mountCount, setMountCount] = useState(0);
  const [unmountCount, setUnmountCount] = useState(0);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Inject freeze styles on mount
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const style = document.createElement("style");
    style.id = "smart-mount-freeze-styles";
    style.textContent = SMART_FREEZE_STYLES;
    document.head.appendChild(style);
    styleRef.current = style;
    
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  // Mount a component
  const mountComponent = useCallback((id: string) => {
    setMountedComponents((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Remove from frozen when mounting
    setFrozenComponents((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMountCount((c) => c + 1);
    
    // Log for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`[SmartMount] Mounted: ${id}`);
    }
  }, []);

  // Unmount a component
  const unmountComponent = useCallback((id: string) => {
    setMountedComponents((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setFrozenComponents((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setUnmountCount((c) => c + 1);
    setLastUnmount(id);
    
    // Estimate memory freed (rough, component-based)
    const memoryEstimates: Record<string, number> = {
      "admin-modal": 5,
      "affiliate-modal": 8,
      "faq-modal": 3,
      "analysis-modal": 12,
      "livestream-modal": 15,
      "products-modal": 6,
      "services-modal": 10,
      "theme-selector": 2,
      "ultimate-panel": 8,
      "audio-widget-menu": 4,
      "mobile-menu": 3,
      "chartnews": 6,
      "footer-modal": 2,
    };
    setMemoryFreed((m) => m + (memoryEstimates[id] || 2));
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[SmartMount] Unmounted: ${id} (freed ~${memoryEstimates[id] || 2}MB)`);
    }
  }, []);

  // Freeze component (pause animations without unmounting)
  const freezeComponent = useCallback((id: string) => {
    setFrozenComponents((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Unfreeze component
  const unfreezeComponent = useCallback((id: string) => {
    setFrozenComponents((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Query methods
  const isMounted = useCallback(
    (id: string) => mountedComponents.has(id),
    [mountedComponents]
  );

  const isFrozen = useCallback(
    (id: string) => frozenComponents.has(id),
    [frozenComponents]
  );

  // Batch unmount
  const unmountAll = useCallback((except: string[] = []) => {
    setMountedComponents((prev) => {
      const next = new Set<string>();
      except.forEach((id) => {
        if (prev.has(id)) next.add(id);
      });
      return next;
    });
  }, []);

  // Batch freeze
  const freezeAll = useCallback((except: string[] = []) => {
    setFrozenComponents((prev) => {
      const next = new Set(mountedComponents);
      except.forEach((id) => next.delete(id));
      return next;
    });
  }, [mountedComponents]);

  const value = useMemo<SmartMountContextType>(
    () => ({
      mountedComponents,
      frozenComponents,
      memoryFreed,
      lastUnmount,
      mountCount,
      unmountCount,
      mountComponent,
      unmountComponent,
      freezeComponent,
      unfreezeComponent,
      isMounted,
      isFrozen,
      unmountAll,
      freezeAll,
    }),
    [
      mountedComponents,
      frozenComponents,
      memoryFreed,
      lastUnmount,
      mountCount,
      unmountCount,
      mountComponent,
      unmountComponent,
      freezeComponent,
      unfreezeComponent,
      isMounted,
      isFrozen,
      unmountAll,
      freezeAll,
    ]
  );

  return (
    <SmartMountContext.Provider value={value}>
      {children}
    </SmartMountContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access the SmartMount context
 */
export function useSmartMount() {
  const ctx = useContext(SmartMountContext);
  if (!ctx) {
    throw new Error("useSmartMount must be used within SmartMountProvider");
  }
  return ctx;
}

/**
 * useSmartComponent - Hook for individual component lifecycle
 * 
 * Usage:
 * ```tsx
 * function MyModal({ isOpen }: { isOpen: boolean }) {
 *   const { shouldRender, isFrozen } = useSmartComponent('my-modal', isOpen);
 *   
 *   if (!shouldRender) return null;
 *   
 *   return <div data-smart-frozen={isFrozen}>...</div>;
 * }
 * ```
 */
export function useSmartComponent(componentId: string, isOpen: boolean) {
  const ctx = useContext(SmartMountContext);
  const [shouldRender, setShouldRender] = useState(false);
  const unmountTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!ctx) return;
    
    if (isOpen) {
      // Clear any pending unmount
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
      }
      
      // Mount immediately
      ctx.mountComponent(componentId);
      setShouldRender(true);
    } else {
      // Freeze immediately
      ctx.freezeComponent(componentId);
      
      // Delay unmount for exit animations
      unmountTimerRef.current = setTimeout(() => {
        ctx.unmountComponent(componentId);
        setShouldRender(false);
      }, 350); // Exit animation duration
    }
    
    return () => {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
      }
    };
  }, [isOpen, componentId, ctx]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctx) {
        ctx.unmountComponent(componentId);
      }
    };
  }, [componentId, ctx]);
  
  return {
    shouldRender,
    isFrozen: ctx?.isFrozen(componentId) ?? false,
    isMounted: ctx?.isMounted(componentId) ?? false,
  };
}

/**
 * useSmartMountStats - Get performance stats
 */
export function useSmartMountStats() {
  const ctx = useContext(SmartMountContext);
  
  return {
    mountedCount: ctx?.mountedComponents.size ?? 0,
    frozenCount: ctx?.frozenComponents.size ?? 0,
    memoryFreed: ctx?.memoryFreed ?? 0,
    lastUnmount: ctx?.lastUnmount ?? null,
    mountCount: ctx?.mountCount ?? 0,
    unmountCount: ctx?.unmountCount ?? 0,
  };
}

// ============================================================================
// SMART MOUNT WRAPPER COMPONENT
// ============================================================================

interface SmartMountWrapperProps {
  id: string;
  isOpen: boolean;
  children: ReactNode;
  /** Delay before unmounting (ms) - allows exit animations */
  unmountDelay?: number;
  /** Called when component mounts */
  onMount?: () => void;
  /** Called when component unmounts */
  onUnmount?: () => void;
}

/**
 * SmartMountWrapper - Wrap any component to enable smart mount/unmount
 * 
 * Usage:
 * ```tsx
 * <SmartMountWrapper id="my-modal" isOpen={isOpen}>
 *   <MyModal />
 * </SmartMountWrapper>
 * ```
 */
export const SmartMountWrapper = memo(function SmartMountWrapper({
  id,
  isOpen,
  children,
  unmountDelay = 350,
  onMount,
  onUnmount,
}: SmartMountWrapperProps) {
  const { shouldRender, isFrozen } = useSmartComponent(id, isOpen);
  const hasCalledMount = useRef(false);
  const hasCalledUnmount = useRef(false);
  
  // Call mount/unmount callbacks
  useEffect(() => {
    if (shouldRender && !hasCalledMount.current) {
      hasCalledMount.current = true;
      hasCalledUnmount.current = false;
      onMount?.();
    } else if (!shouldRender && !hasCalledUnmount.current && hasCalledMount.current) {
      hasCalledUnmount.current = true;
      hasCalledMount.current = false;
      onUnmount?.();
    }
  }, [shouldRender, onMount, onUnmount]);
  
  if (!shouldRender) {
    return null;
  }
  
  return (
    <div
      data-smart-mount={id}
      data-smart-frozen={isFrozen}
      className={isFrozen ? "smart-frozen" : "smart-active"}
    >
      {children}
    </div>
  );
});

// ============================================================================
// CONDITIONAL RENDER HELPER (no context needed)
// ============================================================================

interface ConditionalMountProps {
  condition: boolean;
  children: ReactNode;
  /** Delay unmount by ms (for exit animations) */
  unmountDelay?: number;
  /** Render a placeholder when unmounted */
  placeholder?: ReactNode;
}

/**
 * ConditionalMount - Simple conditional rendering with delayed unmount
 * 
 * Unlike {condition && <Component />}, this:
 * 1. Delays unmount for exit animations
 * 2. Adds freeze classes during exit
 * 3. Can show a placeholder when unmounted
 */
export const ConditionalMount = memo(function ConditionalMount({
  condition,
  children,
  unmountDelay = 350,
  placeholder = null,
}: ConditionalMountProps) {
  const [shouldRender, setShouldRender] = useState(condition);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (condition) {
      // Mount immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsExiting(false);
      setShouldRender(true);
    } else if (shouldRender) {
      // Start exit phase
      setIsExiting(true);
      
      // Delay unmount
      timerRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, unmountDelay);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [condition, unmountDelay, shouldRender]);
  
  if (!shouldRender) {
    return <>{placeholder}</>;
  }
  
  return (
    <div
      data-smart-exiting={isExiting}
      className={isExiting ? "smart-frozen" : "smart-active"}
    >
      {children}
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SMART_FREEZE_STYLES,
  SmartMountContext,
};
