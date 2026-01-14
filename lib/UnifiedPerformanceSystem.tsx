"use client";

/**
 * UNIFIED PERFORMANCE SYSTEM
 * 
 * Single source of truth for ALL performance optimizations.
 * Consolidates:
 * - FPS monitoring (single RAF loop)
 * - IntersectionObserver pool (shared observers)
 * - Smart component caching (usage-based preload/unload)
 * - Device capability detection (cached, runs once)
 * - Visibility tracking (unified hook)
 * 
 * This replaces the need for:
 * - Multiple FPS monitoring loops in PerformanceProvider, usePerformanceInit, etc.
 * - 27+ individual IntersectionObserver instances
 * - Duplicate device detection code
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  ReactNode,
} from 'react';
import type { DeviceInfo as DeviceMonitorInfo } from '@/lib/deviceMonitor';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceTier = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
export type ShimmerQuality = 'high' | 'medium' | 'low' | 'disabled';
export type PerformanceMode = 'ultra' | 'balanced' | 'power-saver';

// Trackable components for smart caching
export type TrackedComponent = 
  | 'navbar' 
  | 'footer' 
  | 'audioWidget' 
  | 'ultimatePanel' 
  | 'spline' 
  | 'modal' 
  | 'staticTip' 
  | 'movingTip'
  | 'hero'
  | 'features'
  | 'chartnews'
  | 'testimonials'
  | 'ticker'
  | 'themeSelectorModal'
  | 'adminModal'
  | 'affiliateModal'
  | 'faqModal'
  | 'servicesModal'
  | 'contactModal'
  | 'musicEmbedModal'
  | 'liveStreamModal'
  | 'analysisModal'
  | 'pagemode'
  | 'multiStepLoader';

// Component cache entry for smart storage
interface ComponentCacheEntry {
  id: TrackedComponent;
  mountedAt: number;
  lastVisible: number;
  lastInteraction: number;
  interactionCount: number;
  isVisible: boolean;
  isMounted: boolean;
  priority: number; // 1-10, higher = keep loaded longer
  avgRenderTime: number;
  renderCount: number;
}

// Intersection observer entry
interface ObserverEntry {
  element: Element;
  callback: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
  threshold: number;
  rootMargin: string;
}

// Main state interface
export interface UnifiedPerformanceState {
  // Device info (computed once, cached)
  deviceTier: DeviceTier;
  isMobile: boolean;
  isTablet: boolean;
  isSafari: boolean;
  isIOS: boolean;
  isAppleSilicon: boolean;
  refreshRate: 30 | 60 | 90 | 120;
  
  // Live metrics (single RAF loop)
  currentFps: number;
  averageFps: number;
  isThrottled: boolean;
  isScrolling: boolean;
  isIdle: boolean;
  
  // Quality levels (dynamic)
  shimmerQuality: ShimmerQuality;
  performanceMode: PerformanceMode;
  animationMultiplier: number;
  
  // Feature flags
  enableBlur: boolean;
  enableShadows: boolean;
  enable3D: boolean;
  enableParticles: boolean;
  enableHoverAnimations: boolean;
  enableScrollAnimations: boolean;
  
  // Smart caching
  componentCache: Map<TrackedComponent, ComponentCacheEntry>;
  loadedComponents: Set<TrackedComponent>;
  preloadQueue: TrackedComponent[];
  unloadQueue: TrackedComponent[];
  
  // Actions
  registerComponent: (id: TrackedComponent, priority?: number) => void;
  unregisterComponent: (id: TrackedComponent) => void;
  trackInteraction: (id?: TrackedComponent) => void;
  setComponentVisibility: (id: TrackedComponent, visible: boolean) => void;
  shouldRenderComponent: (id: TrackedComponent) => boolean;
  shouldEnableShimmer: (id: TrackedComponent) => boolean;
  getComponentPriority: (id: TrackedComponent) => number;
  
  // Observer pool access
  observe: (element: Element, callback: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void, options?: { threshold?: number; rootMargin?: string }) => () => void;
  
  // Force quality override
  forceQuality: (quality: ShimmerQuality) => void;
  resetQuality: () => void;
}

// ============================================================================
// CONSTANTS & DEFAULTS
// ============================================================================

// Component priority defaults (higher = more important to keep loaded)
const COMPONENT_PRIORITIES: Record<TrackedComponent, number> = {
  navbar: 10,
  hero: 9,
  footer: 8,
  audioWidget: 7,
  ticker: 7,
  ultimatePanel: 6,
  chartnews: 6,
  features: 5,
  testimonials: 4,
  modal: 4,
  staticTip: 3,
  movingTip: 3,
  spline: 2, // Heavy 3D, low priority for keeping loaded
  // Modal priorities (lower = unload faster when closed)
  themeSelectorModal: 3,
  adminModal: 3,
  affiliateModal: 3,
  faqModal: 3,
  servicesModal: 3,
  contactModal: 3,
  musicEmbedModal: 3,
  liveStreamModal: 3,
  analysisModal: 3,
  pagemode: 8, // High priority during load
  multiStepLoader: 8, // High priority during load
};

// Quality thresholds
const FPS_THRESHOLDS = {
  critical: 15,
  veryLow: 25,
  low: 35,
  medium: 50,
  good: 55,
};

// Default state
const defaultState: UnifiedPerformanceState = {
  deviceTier: 'high',
  isMobile: false,
  isTablet: false,
  isSafari: false,
  isIOS: false,
  isAppleSilicon: false,
  refreshRate: 60,
  currentFps: 60,
  averageFps: 60,
  isThrottled: false,
  isScrolling: false,
  isIdle: false,
  shimmerQuality: 'high',
  performanceMode: 'balanced',
  animationMultiplier: 1,
  enableBlur: true,
  enableShadows: true,
  enable3D: true,
  enableParticles: true,
  enableHoverAnimations: true,
  enableScrollAnimations: true,
  componentCache: new Map(),
  loadedComponents: new Set(),
  preloadQueue: [],
  unloadQueue: [],
  registerComponent: () => {},
  unregisterComponent: () => {},
  trackInteraction: () => {},
  setComponentVisibility: () => {},
  shouldRenderComponent: () => true,
  shouldEnableShimmer: () => true,
  getComponentPriority: () => 5,
  observe: () => () => {},
  forceQuality: () => {},
  resetQuality: () => {},
};

// ============================================================================
// SINGLETON MANAGERS (Run outside React for true singleton behavior)
// ============================================================================

/**
 * Single FPS Monitor - Only one RAF loop for the entire app
 */
class FPSMonitor {
  private static instance: FPSMonitor;
  private subscribers: Set<(fps: number, avg: number) => void> = new Set();
  private frameCount = 0;
  private lastTime = 0;
  private fpsHistory: number[] = [];
  private rafId: number | null = null;
  private isRunning = false;
  
  static getInstance(): FPSMonitor {
    if (!FPSMonitor.instance) {
      FPSMonitor.instance = new FPSMonitor();
    }
    return FPSMonitor.instance;
  }
  
  subscribe(callback: (fps: number, avg: number) => void): () => void {
    this.subscribers.add(callback);
    if (!this.isRunning && this.subscribers.size > 0) {
      this.start();
    }
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }
  
  private start() {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(performance.now());
  }
  
  private stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }
  
  private loop = (timestamp: number) => {
    this.frameCount++;
    const elapsed = timestamp - this.lastTime;
    
    // Update every second
    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }
      const avg = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
      
      // Notify all subscribers
      this.subscribers.forEach(cb => cb(fps, avg));
      
      this.frameCount = 0;
      this.lastTime = timestamp;
    }
    
    this.rafId = requestAnimationFrame(this.loop);
  };
}

/**
 * Shared IntersectionObserver Pool - One observer per threshold/rootMargin combo
 */
class ObserverPool {
  private static instance: ObserverPool;
  private observers: Map<string, IntersectionObserver> = new Map();
  private entries: Map<Element, ObserverEntry> = new Map();
  
  static getInstance(): ObserverPool {
    if (!ObserverPool.instance) {
      ObserverPool.instance = new ObserverPool();
    }
    return ObserverPool.instance;
  }
  
  private getKey(threshold: number, rootMargin: string): string {
    return `${threshold}:${rootMargin}`;
  }
  
  private getOrCreateObserver(threshold: number, rootMargin: string): IntersectionObserver {
    const key = this.getKey(threshold, rootMargin);
    
    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const stored = this.entries.get(entry.target);
            if (stored) {
              stored.callback(entry.isIntersecting, entry);
            }
          });
        },
        { threshold, rootMargin }
      );
      this.observers.set(key, observer);
    }
    
    return this.observers.get(key)!;
  }
  
  observe(
    element: Element,
    callback: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void,
    options: { threshold?: number; rootMargin?: string } = {}
  ): () => void {
    const threshold = options.threshold ?? 0;
    const rootMargin = options.rootMargin ?? '0px';
    
    const entry: ObserverEntry = { element, callback, threshold, rootMargin };
    this.entries.set(element, entry);
    
    const observer = this.getOrCreateObserver(threshold, rootMargin);
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
      this.entries.delete(element);
    };
  }
  
  disconnect() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers.clear();
    this.entries.clear();
  }
}

/**
 * Smart Component Cache - Tracks usage patterns for preload/unload decisions
 */
class SmartCache {
  private static instance: SmartCache;
  private cache: Map<TrackedComponent, ComponentCacheEntry> = new Map();
  private usageHistory: Map<TrackedComponent, number[]> = new Map(); // Timestamps of when component was viewed
  private maxHistorySize = 50;
  
  static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache();
    }
    return SmartCache.instance;
  }
  
  register(id: TrackedComponent, priority?: number): ComponentCacheEntry {
    const now = Date.now();
    const existing = this.cache.get(id);
    
    if (existing) {
      existing.isMounted = true;
      existing.mountedAt = now;
      return existing;
    }
    
    const entry: ComponentCacheEntry = {
      id,
      mountedAt: now,
      lastVisible: now,
      lastInteraction: now,
      interactionCount: 0,
      isVisible: true,
      isMounted: true,
      priority: priority ?? COMPONENT_PRIORITIES[id] ?? 5,
      avgRenderTime: 0,
      renderCount: 0,
    };
    
    this.cache.set(id, entry);
    return entry;
  }
  
  unregister(id: TrackedComponent) {
    const entry = this.cache.get(id);
    if (entry) {
      entry.isMounted = false;
    }
  }
  
  trackVisibility(id: TrackedComponent, visible: boolean) {
    const entry = this.cache.get(id);
    if (entry) {
      entry.isVisible = visible;
      if (visible) {
        entry.lastVisible = Date.now();
        this.addToHistory(id);
      }
    }
  }
  
  trackInteraction(id: TrackedComponent) {
    const entry = this.cache.get(id);
    if (entry) {
      entry.lastInteraction = Date.now();
      entry.interactionCount++;
    }
  }
  
  private addToHistory(id: TrackedComponent) {
    const history = this.usageHistory.get(id) || [];
    history.push(Date.now());
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    this.usageHistory.set(id, history);
  }
  
  /**
   * Get components that should be preloaded based on usage patterns
   */
  getPreloadSuggestions(currentVisible: TrackedComponent[]): TrackedComponent[] {
    const now = Date.now();
    const suggestions: TrackedComponent[] = [];
    
    // Find components frequently viewed after current ones
    currentVisible.forEach(current => {
      const history = this.usageHistory.get(current) || [];
      if (history.length < 3) return;
      
      // Check what was viewed after this component in the past
      this.usageHistory.forEach((viewHistory, id) => {
        if (id === current) return;
        
        // Count how often this component was viewed shortly after current
        let followCount = 0;
        history.forEach(viewTime => {
          const wasViewedAfter = viewHistory.some(t => t > viewTime && t < viewTime + 30000);
          if (wasViewedAfter) followCount++;
        });
        
        if (followCount >= 2 && !suggestions.includes(id)) {
          suggestions.push(id);
        }
      });
    });
    
    return suggestions.sort((a, b) => 
      (COMPONENT_PRIORITIES[b] ?? 5) - (COMPONENT_PRIORITIES[a] ?? 5)
    );
  }
  
  /**
   * Get components that can be safely unloaded to save memory
   */
  getUnloadSuggestions(loadedComponents: Set<TrackedComponent>, currentFps: number): TrackedComponent[] {
    const now = Date.now();
    const suggestions: TrackedComponent[] = [];
    
    this.cache.forEach((entry, id) => {
      if (!loadedComponents.has(id)) return;
      if (entry.isVisible) return; // Don't unload visible components
      if (entry.priority >= 8) return; // Don't unload high priority
      
      const timeSinceVisible = now - entry.lastVisible;
      const timeSinceInteraction = now - entry.lastInteraction;
      
      // Unload if: not visible for 60s AND no interaction for 90s AND FPS is struggling
      const shouldUnload = 
        (timeSinceVisible > 60000 && timeSinceInteraction > 90000 && currentFps < 45) ||
        (timeSinceVisible > 120000 && currentFps < 35) ||
        (timeSinceVisible > 180000); // Always unload after 3 minutes
      
      if (shouldUnload) {
        suggestions.push(id);
      }
    });
    
    // Sort by priority (unload lowest priority first)
    return suggestions.sort((a, b) => 
      (COMPONENT_PRIORITIES[a] ?? 5) - (COMPONENT_PRIORITIES[b] ?? 5)
    );
  }
  
  getEntry(id: TrackedComponent): ComponentCacheEntry | undefined {
    return this.cache.get(id);
  }
  
  getAllEntries(): Map<TrackedComponent, ComponentCacheEntry> {
    return this.cache;
  }
}

// ============================================================================
// DEVICE DETECTION (Runs once, cached)
// ============================================================================

interface DeviceCapabilities {
  tier: DeviceTier;
  isMobile: boolean;
  isTablet: boolean;
  isSafari: boolean;
  isIOS: boolean;
  isAppleSilicon: boolean;
  refreshRate: 30 | 60 | 90 | 120;
  memory: number;
  cores: number;
  gpuTier: 'low' | 'medium' | 'high';
}

let cachedCapabilities: DeviceCapabilities | null = null;

function detectDeviceCapabilities(): DeviceCapabilities {
  if (cachedCapabilities) return cachedCapabilities;
  if (typeof window === 'undefined') {
    return {
      tier: 'high',
      isMobile: false,
      isTablet: false,
      isSafari: false,
      isIOS: false,
      isAppleSilicon: false,
      refreshRate: 60,
      memory: 8,
      cores: 4,
      gpuTier: 'medium',
    };
  }
  
  const ua = navigator.userAgent.toLowerCase();
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const width = window.innerWidth;
  
  // Device type
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  // Browser detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS = /ipad|iphone|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Apple Silicon detection
  let isAppleSilicon = false;
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        isAppleSilicon = renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer));
        
        // GPU tier detection
        if (renderer.includes('nvidia') || renderer.includes('radeon') || isAppleSilicon) {
          gpuTier = 'high';
        } else if (renderer.includes('intel iris') || renderer.includes('intel uhd')) {
          gpuTier = 'medium';
        } else if (renderer.includes('intel hd') || renderer.includes('mali') || renderer.includes('adreno 5')) {
          gpuTier = 'low';
        }
      }
    }
  } catch (e) {}
  
  // Refresh rate detection
  let refreshRate: 30 | 60 | 90 | 120 = 60;
  if (isAppleSilicon || (isIOS && /iphone 1[3-9]|iphone 2/i.test(ua))) {
    refreshRate = 120; // ProMotion devices
  }
  
  // Device tier calculation
  let tier: DeviceTier = 'medium';
  
  if (isAppleSilicon || (gpuTier === 'high' && memory >= 16 && cores >= 8)) {
    tier = 'ultra';
  } else if (gpuTier === 'high' && memory >= 8) {
    tier = 'high';
  } else if (gpuTier === 'medium' || (memory >= 4 && cores >= 4)) {
    tier = 'medium';
  } else if (memory < 4 || cores < 4) {
    tier = memory < 2 ? 'minimal' : 'low';
  }
  
  // Mobile penalty
  if (isMobile && tier === 'ultra') tier = 'high';
  if (isMobile && tier === 'high' && memory < 6) tier = 'medium';
  
  cachedCapabilities = {
    tier,
    isMobile,
    isTablet,
    isSafari,
    isIOS,
    isAppleSilicon,
    refreshRate,
    memory,
    cores,
    gpuTier,
  };
  
  console.log('[UnifiedPerformance] Device detected:', cachedCapabilities);
  return cachedCapabilities;
}

function clampRefreshRate(rate: unknown): 30 | 60 | 90 | 120 {
  const n = typeof rate === 'number' ? rate : Number(rate);
  if (n >= 120) return 120;
  if (n >= 90) return 90;
  if (n >= 60) return 60;
  return 30;
}

function computeTierFromDeviceMonitor(info: DeviceMonitorInfo, fallback: DeviceCapabilities): DeviceCapabilities {
  const deviceType = info?.device?.type;
  const isMobile = deviceType === 'mobile' ? true : fallback.isMobile;
  const isTablet = deviceType === 'tablet' ? true : fallback.isTablet;

  const browserName = (info?.device?.browser || '').toLowerCase();
  const osName = (info?.device?.os || '').toLowerCase();
  const isSafari = browserName.includes('safari') ? true : fallback.isSafari;
  const isIOS = osName.includes('ios') ? true : fallback.isIOS;

  const memory = info?.performance?.memory?.total ?? fallback.memory;
  const cores = info?.performance?.cpu?.cores ?? fallback.cores;
  const gpuTier = info?.performance?.gpu?.tier ?? fallback.gpuTier;

  const cpuName = (info?.performance?.cpu?.name || '').toLowerCase();
  const gpuRenderer = (info?.performance?.gpu?.renderer || '').toLowerCase();
  const isAppleSilicon =
    cpuName.includes('apple m') ||
    (gpuRenderer.includes('apple') && (gpuRenderer.includes('gpu') || /m[1-9]/.test(gpuRenderer))) ||
    fallback.isAppleSilicon;

  const refreshRate = clampRefreshRate(info?.screen?.refreshRate ?? fallback.refreshRate);

  let tier: DeviceTier = 'medium';
  if (!isMobile && (isAppleSilicon || (gpuTier === 'high' && memory >= 16 && cores >= 8))) {
    tier = 'ultra';
  } else if (gpuTier === 'high' && memory >= 8) {
    tier = 'high';
  } else if (gpuTier === 'medium' || (memory >= 4 && cores >= 4)) {
    tier = 'medium';
  } else if (memory < 4 || cores < 4) {
    tier = memory < 2 ? 'minimal' : 'low';
  }

  if (isMobile && tier === 'ultra') tier = 'high';
  if (isMobile && tier === 'high' && memory < 6) tier = 'medium';

  return {
    tier,
    isMobile,
    isTablet,
    isSafari,
    isIOS,
    isAppleSilicon,
    refreshRate,
    memory,
    cores,
    gpuTier,
  };
}

// ============================================================================
// CONTEXT
// ============================================================================

const UnifiedPerformanceContext = createContext<UnifiedPerformanceState>(defaultState);

/**
 * Main hook to access the unified performance system
 */
export function useUnifiedPerformance() {
  return useContext(UnifiedPerformanceContext);
}

// ============================================================================
// PROVIDER
// ============================================================================

interface UnifiedPerformanceProviderProps {
  children: ReactNode;
  /** Delay before starting FPS monitoring (ms) */
  startDelay?: number;
  /** FPS monitoring interval (ms) */
  monitoringInterval?: number;
}

export const UnifiedPerformanceProvider = memo(function UnifiedPerformanceProvider({
  children,
  startDelay = 3000,
}: UnifiedPerformanceProviderProps) {
  // Get singletons
  const fpsMonitor = useMemo(() => FPSMonitor.getInstance(), []);
  const observerPool = useMemo(() => ObserverPool.getInstance(), []);
  const smartCache = useMemo(() => SmartCache.getInstance(), []);
  
  // Device capabilities (computed once)
  const [device, setDevice] = useState<DeviceCapabilities | null>(null);
  
  // Live metrics
  const [currentFps, setCurrentFps] = useState(60);
  const [averageFps, setAverageFps] = useState(60);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  // Quality state
  const [shimmerQuality, setShimmerQuality] = useState<ShimmerQuality>('high');
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');
  const [qualityOverride, setQualityOverride] = useState<ShimmerQuality | null>(null);
  
  // Component tracking
  const [loadedComponents, setLoadedComponents] = useState<Set<TrackedComponent>>(new Set());
  const [preloadQueue, setPreloadQueue] = useState<TrackedComponent[]>([]);
  const [unloadQueue, setUnloadQueue] = useState<TrackedComponent[]>([]);
  
  // Refs for performance
  const lastQualityUpdateRef = useRef(0);
  const lastIdleCheckRef = useRef(Date.now());
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Initialize device detection
  useEffect(() => {
    setDevice(detectDeviceCapabilities());
  }, []);

  // Hydrate device detection with real device monitor info (async, runs after load/reload)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const hydrate = async () => {
      try {
        const mod = await import('@/lib/deviceMonitor');
        const info = mod.deviceMonitor.getInfo();
        const base = cachedCapabilities ?? detectDeviceCapabilities();
        const next = computeTierFromDeviceMonitor(info as DeviceMonitorInfo, base);

        if (cancelled) return;
        cachedCapabilities = next;
        setDevice(prev => {
          if (!prev) return next;
          const unchanged =
            prev.tier === next.tier &&
            prev.isMobile === next.isMobile &&
            prev.isTablet === next.isTablet &&
            prev.isSafari === next.isSafari &&
            prev.isIOS === next.isIOS &&
            prev.isAppleSilicon === next.isAppleSilicon &&
            prev.refreshRate === next.refreshRate &&
            prev.memory === next.memory &&
            prev.cores === next.cores &&
            prev.gpuTier === next.gpuTier;
          return unchanged ? prev : next;
        });
      } catch (e) {
        // Device monitor is optional; keep best-effort baseline.
      }
    };

    // Let initial render settle, then hydrate.
    const t = window.setTimeout(hydrate, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  // Keep mobile/tablet flags accurate on resize (tier doesn't change, viewport can)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      setDevice(prev => {
        if (!prev) return prev;
        if (prev.isMobile === isMobile && prev.isTablet === isTablet) return prev;
        const next = { ...prev, isMobile, isTablet };
        cachedCapabilities = next;
        return next;
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  
  // Subscribe to FPS monitor
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (device?.tier === 'minimal') return; // Skip on ultra low-end for battery/stability
    
    const timeoutId = setTimeout(() => {
      const unsubscribe = fpsMonitor.subscribe((fps, avg) => {
        setCurrentFps(fps);
        setAverageFps(avg);
        // Feed FPS into DeviceMonitor (avoids a second RAF loop).
        try {
          (window as any).deviceMonitor?.setExternalFps?.(fps, avg);
        } catch {}
        
        // Throttle quality updates to prevent thrashing
        const now = performance.now();
        if (now - lastQualityUpdateRef.current < 2000) return;
        
        // Dynamic quality adjustment
        let newQuality: ShimmerQuality = 'high';
        if (avg < FPS_THRESHOLDS.critical) {
          newQuality = 'disabled';
        } else if (avg < FPS_THRESHOLDS.veryLow) {
          newQuality = 'disabled';
        } else if (avg < FPS_THRESHOLDS.low) {
          newQuality = 'low';
        } else if (avg < FPS_THRESHOLDS.medium) {
          newQuality = 'medium';
        }
        
        if (newQuality !== shimmerQuality && !qualityOverride) {
          setShimmerQuality(newQuality);
          lastQualityUpdateRef.current = now;
          
          // Apply CSS classes
          const root = document.documentElement;
          root.classList.remove('shimmer-quality-high', 'shimmer-quality-medium', 'shimmer-quality-low', 'shimmer-quality-disabled');
          root.classList.add(`shimmer-quality-${newQuality}`);
          
          if (newQuality === 'disabled' || newQuality === 'low') {
            root.classList.add('reduce-animations');
          } else {
            root.classList.remove('reduce-animations');
          }
          
          console.log(`[UnifiedPerformance] Quality: ${newQuality} (avg FPS: ${avg})`);
        }
      });
      
      return () => unsubscribe();
    }, startDelay);
    
    return () => clearTimeout(timeoutId);
  }, [device?.isMobile, fpsMonitor, shimmerQuality, qualityOverride, startDelay]);
  
  // Scroll detection (pause animations during scroll)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setIsScrolling(true);
      document.documentElement.classList.add('is-scrolling');
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        document.documentElement.classList.remove('is-scrolling');
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);
  
  // Idle detection (reduce quality when idle)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const resetIdle = () => {
      lastIdleCheckRef.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
        // Restore quality on activity
        if (!qualityOverride && shimmerQuality !== (device?.tier === 'ultra' ? 'high' : 'medium')) {
          setShimmerQuality(device?.tier === 'ultra' || device?.tier === 'high' ? 'high' : 'medium');
        }
      }
    };
    
    const checkIdle = setInterval(() => {
      const idleTime = Date.now() - lastIdleCheckRef.current;
      if (idleTime > 60000 && !isIdle) {
        setIsIdle(true);
        // Reduce quality when idle
        if (!qualityOverride && shimmerQuality === 'high') {
          setShimmerQuality('medium');
          console.log('[UnifiedPerformance] Idle detected - reducing quality');
        }
      }
      if (idleTime > 120000 && shimmerQuality !== 'low' && shimmerQuality !== 'disabled') {
        setShimmerQuality('low');
        console.log('[UnifiedPerformance] Extended idle - minimal shimmers');
      }
    }, 5000);
    
    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    
    return () => {
      clearInterval(checkIdle);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('scroll', resetIdle);
    };
  }, [isIdle, shimmerQuality, qualityOverride, device?.tier]);
  
  // Smart cache: check for preload/unload suggestions periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkCacheState = setInterval(() => {
      const visibleComponents = Array.from(loadedComponents).filter(id => {
        const entry = smartCache.getEntry(id);
        return entry?.isVisible;
      });
      
      // Get preload suggestions
      const toPreload = smartCache.getPreloadSuggestions(visibleComponents as TrackedComponent[]);
      if (toPreload.length > 0) {
        setPreloadQueue(toPreload);
      }
      
      // Get unload suggestions when FPS is struggling
      if (averageFps < 45) {
        const toUnload = smartCache.getUnloadSuggestions(loadedComponents, averageFps);
        if (toUnload.length > 0) {
          setUnloadQueue(toUnload);
          console.log('[UnifiedPerformance] Suggesting unload:', toUnload);
        }
      }
    }, 10000);
    
    return () => clearInterval(checkCacheState);
  }, [loadedComponents, averageFps, smartCache]);
  
  // Apply device tier CSS on mount
  useEffect(() => {
    if (!device) return;
    
    const root = document.documentElement;
    root.classList.remove('device-ultra', 'device-high', 'device-medium', 'device-low', 'device-minimal');
    root.classList.add(`device-${device.tier}`);
    root.classList.add(`fps-${device.tier}`);
    
    if (device.isMobile) root.classList.add('is-mobile');
    if (device.isTablet) root.classList.add('is-tablet');
    if (device.isSafari) root.classList.add('is-safari');
    if (device.isIOS) root.classList.add('is-ios');
    if (device.refreshRate >= 120) root.classList.add('display-120hz');
    
    // Set initial quality based on device
    const initialQuality: ShimmerQuality = 
      device.tier === 'ultra' || device.tier === 'high' ? 'high' :
      device.tier === 'medium' ? 'medium' : 'low';
    setShimmerQuality(initialQuality);
    root.classList.add(`shimmer-quality-${initialQuality}`);
    
  }, [device]);
  
  // ==================== CALLBACKS ====================
  
  const registerComponent = useCallback((id: TrackedComponent, priority?: number) => {
    smartCache.register(id, priority);
    setLoadedComponents(prev => new Set([...prev, id]));
    document.documentElement.classList.remove(`component-inactive-${id}`);
  }, [smartCache]);
  
  const unregisterComponent = useCallback((id: TrackedComponent) => {
    smartCache.unregister(id);
    setLoadedComponents(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    document.documentElement.classList.add(`component-inactive-${id}`);
  }, [smartCache]);
  
  const trackInteraction = useCallback((id?: TrackedComponent) => {
    lastIdleCheckRef.current = Date.now();
    if (id) {
      smartCache.trackInteraction(id);
    }
  }, [smartCache]);
  
  const setComponentVisibility = useCallback((id: TrackedComponent, visible: boolean) => {
    smartCache.trackVisibility(id, visible);
    if (typeof document !== 'undefined') {
      if (visible) {
        document.documentElement.classList.remove(`component-inactive-${id}`);
      } else {
        document.documentElement.classList.add(`component-inactive-${id}`);
      }
    }
  }, [smartCache]);
  
  const shouldRenderComponent = useCallback((id: TrackedComponent): boolean => {
    // Always render high priority components
    const priority = COMPONENT_PRIORITIES[id] ?? 5;
    if (priority >= 7) return true;
    
    // Check if FPS is critical
    if (averageFps < FPS_THRESHOLDS.critical && priority < 5) return false;
    
    // Check unload queue
    if (unloadQueue.includes(id)) return false;
    
    return true;
  }, [averageFps, unloadQueue]);
  
  const shouldEnableShimmer = useCallback((id: TrackedComponent): boolean => {
    if (qualityOverride === 'disabled' || shimmerQuality === 'disabled') return false;
    
    const entry = smartCache.getEntry(id);
    if (entry && !entry.isVisible) return false;
    
    const priority = COMPONENT_PRIORITIES[id] ?? 5;
    
    // Critical FPS - only navbar
    if (averageFps < FPS_THRESHOLDS.critical) return priority >= 10;
    
    // Very low FPS - high priority only
    if (shimmerQuality === 'low') return priority >= 8;
    
    // Medium quality - most components
    if (shimmerQuality === 'medium') return priority >= 4;
    
    return true;
  }, [shimmerQuality, qualityOverride, averageFps, smartCache]);
  
  const getComponentPriority = useCallback((id: TrackedComponent): number => {
    return COMPONENT_PRIORITIES[id] ?? 5;
  }, []);
  
  const observe = useCallback((
    element: Element,
    callback: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void,
    options?: { threshold?: number; rootMargin?: string }
  ) => {
    return observerPool.observe(element, callback, options);
  }, [observerPool]);
  
  const forceQuality = useCallback((quality: ShimmerQuality) => {
    setQualityOverride(quality);
    setShimmerQuality(quality);
  }, []);
  
  const resetQuality = useCallback(() => {
    setQualityOverride(null);
  }, []);
  
  // Build state object
  const state = useMemo<UnifiedPerformanceState>(() => ({
    deviceTier: device?.tier ?? 'high',
    isMobile: device?.isMobile ?? false,
    isTablet: device?.isTablet ?? false,
    isSafari: device?.isSafari ?? false,
    isIOS: device?.isIOS ?? false,
    isAppleSilicon: device?.isAppleSilicon ?? false,
    refreshRate: device?.refreshRate ?? 60,
    currentFps,
    averageFps,
    isThrottled: averageFps < 50,
    isScrolling,
    isIdle,
    shimmerQuality: qualityOverride ?? shimmerQuality,
    performanceMode,
    animationMultiplier: shimmerQuality === 'disabled' ? 0.1 : shimmerQuality === 'low' ? 0.4 : shimmerQuality === 'medium' ? 0.7 : 1,
    enableBlur: shimmerQuality !== 'disabled' && shimmerQuality !== 'low',
    enableShadows: shimmerQuality !== 'disabled' && shimmerQuality !== 'low',
    enable3D: (device?.tier ?? 'high') !== 'minimal',
    enableParticles: (device?.tier ?? 'high') === 'ultra' || (device?.tier ?? 'high') === 'high',
    enableHoverAnimations: shimmerQuality !== 'disabled',
    enableScrollAnimations: shimmerQuality !== 'disabled' && shimmerQuality !== 'low',
    componentCache: smartCache.getAllEntries(),
    loadedComponents,
    preloadQueue,
    unloadQueue,
    registerComponent,
    unregisterComponent,
    trackInteraction,
    setComponentVisibility,
    shouldRenderComponent,
    shouldEnableShimmer,
    getComponentPriority,
    observe,
    forceQuality,
    resetQuality,
  }), [
    device, currentFps, averageFps, isScrolling, isIdle,
    shimmerQuality, qualityOverride, performanceMode,
    loadedComponents, preloadQueue, unloadQueue, smartCache,
    registerComponent, unregisterComponent, trackInteraction,
    setComponentVisibility, shouldRenderComponent, shouldEnableShimmer,
    getComponentPriority, observe, forceQuality, resetQuality,
  ]);
  
  return (
    <UnifiedPerformanceContext.Provider value={state}>
      {children}
    </UnifiedPerformanceContext.Provider>
  );
});

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for using shared IntersectionObserver
 * Replaces individual observer instances in components
 */
export function useObserver(
  ref: React.RefObject<Element>,
  callback: (isIntersecting: boolean) => void,
  options?: { threshold?: number; rootMargin?: string; enabled?: boolean }
) {
  const { observe } = useUnifiedPerformance();
  
  useEffect(() => {
    if (!ref.current || options?.enabled === false) return;
    
    return observe(ref.current, (isIntersecting) => callback(isIntersecting), {
      threshold: options?.threshold,
      rootMargin: options?.rootMargin,
    });
  }, [ref, callback, observe, options?.threshold, options?.rootMargin, options?.enabled]);
}

/**
 * Hook for visibility tracking with IntersectionObserver
 * Replaces useVisibility implementations
 */
export function useVisibility(
  ref: React.RefObject<Element>,
  options?: { threshold?: number; rootMargin?: string; once?: boolean }
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const hasBeenVisibleRef = useRef(false);
  const { observe } = useUnifiedPerformance();
  
  useEffect(() => {
    if (!ref.current) return;
    if (options?.once && hasBeenVisibleRef.current) return;
    
    return observe(ref.current, (visible) => {
      if (visible) {
        hasBeenVisibleRef.current = true;
      }
      if (options?.once && hasBeenVisibleRef.current) {
        setIsVisible(true);
        return;
      }
      setIsVisible(visible);
    }, {
      threshold: options?.threshold ?? 0,
      rootMargin: options?.rootMargin ?? '0px',
    });
  }, [ref, observe, options?.threshold, options?.rootMargin, options?.once]);
  
  return isVisible;
}

/**
 * Hook for component lifecycle with smart caching
 */
export function useComponentLifecycle(id: TrackedComponent, priority?: number) {
  const { 
    registerComponent, 
    unregisterComponent, 
    shouldEnableShimmer,
    shouldRenderComponent,
    trackInteraction,
    shimmerQuality,
  } = useUnifiedPerformance();
  
  useEffect(() => {
    registerComponent(id, priority);
    return () => unregisterComponent(id);
  }, [id, priority, registerComponent, unregisterComponent]);
  
  return useMemo(() => ({
    shimmerEnabled: shouldEnableShimmer(id),
    shouldRender: shouldRenderComponent(id),
    shimmerQuality,
    shimmerSettings: {
      disabled: shimmerQuality === 'disabled',
      intensity: shimmerQuality === 'high' ? 'medium' as const : 'low' as const,
      speed: shimmerQuality === 'high' ? 'normal' as const : 'slow' as const,
    },
    trackInteraction: () => trackInteraction(id),
  }), [id, shouldEnableShimmer, shouldRenderComponent, shimmerQuality, trackInteraction]);
}

/**
 * Optimized shimmer settings hook (replaces useOptimizedShimmer)
 */
export function useShimmerSettings() {
  const { shimmerQuality, isScrolling, isIdle } = useUnifiedPerformance();
  
  return useMemo(() => ({
    disabled: shimmerQuality === 'disabled' || isScrolling,
    quality: shimmerQuality,
    intensity: shimmerQuality === 'high' ? 'medium' as const : 'low' as const,
    speed: shimmerQuality === 'high' ? 'normal' as const : 'slow' as const,
    pauseOnScroll: true,
    isIdle,
  }), [shimmerQuality, isScrolling, isIdle]);
}

export default UnifiedPerformanceProvider;
