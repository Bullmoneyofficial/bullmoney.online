"use client";

/**
 * FPS Optimizer - Device-Aware Performance Optimization System
 * 
 * This is the SINGLE SOURCE OF TRUTH for FPS-based performance optimization.
 * All components should use this for consistent device-aware optimization.
 * 
 * Features:
 * - Detects device tier (ultra/high/medium/low/minimal)
 * - Monitors real-time FPS and adjusts quality dynamically
 * - Optimizes UI animations, 3D scenes, and shimmers based on device
 * - DOES NOT block rendering - just loads smarter based on device
 * 
 * Usage:
 * 1. Wrap app with <FpsOptimizerProvider /> in layout.tsx
 * 2. Use useFpsOptimizer() hook in components for optimization decisions
 * 3. Use getDeviceTierConfig() for initial load optimization
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
  ReactNode,
} from 'react';
import type { DeviceInfo } from '@/lib/deviceMonitor';

// ============================================================================
// TYPES
// ============================================================================

// Device tier for optimization levels (extends deviceMonitor's gpu.tier)
export type DeviceTier = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

export type ShimmerQuality = 'high' | 'medium' | 'low' | 'disabled';
export type SplineQuality = 'ultra' | 'high' | 'medium' | 'low' | 'disabled';

// Component usage tracking for performance optimization
export type TrackedComponent = 'navbar' | 'footer' | 'audioWidget' | 'ultimatePanel' | 'spline' | 'modal' | 'staticTip' | 'movingTip';

// Component interaction tracking for smart shimmer optimization
export interface ComponentUsage {
  mountedAt: number;
  lastInteraction: number;
  interactionCount: number;
  isVisible: boolean;
}

export interface FpsOptimizerState {
  // Device info
  deviceTier: DeviceTier;
  isMobile: boolean;
  isTablet: boolean;
  isSafari: boolean;
  isIOS: boolean;
  
  // Live metrics
  currentFps: number;
  averageFps: number;
  
  // Optimization levels
  shimmerQuality: ShimmerQuality;
  splineQuality: SplineQuality;
  animationMultiplier: number; // 0.1 to 1.0
  
  // Feature flags - what to enable based on device
  enableBlur: boolean;
  enableShadows: boolean;
  enable3D: boolean;
  enableParticles: boolean;
  enableGlassEffects: boolean;
  enableHoverAnimations: boolean;
  enableScrollAnimations: boolean;
  
  // 3D specific
  maxPolygons: number;
  textureQuality: '4k' | '2k' | '1k' | '512';
  targetFrameRate: 30 | 60 | 90 | 120;
  
  // Component usage tracking - disable shimmers on unused components
  activeComponents: Set<TrackedComponent>;
  componentUsage: Map<TrackedComponent, ComponentUsage>;
  componentInteractionCount: number; // How many interactions have occurred
  timeSinceLastInteraction: number; // Ms since last user interaction
  
  // Actions
  refreshDeviceInfo: () => void;
  setShimmerQuality: (q: ShimmerQuality) => void;
  setSplineQuality: (q: SplineQuality) => void;
  
  // Component tracking actions
  registerComponent: (name: TrackedComponent) => void;
  unregisterComponent: (name: TrackedComponent) => void;
  trackInteraction: (component?: TrackedComponent) => void;
  setComponentVisibility: (name: TrackedComponent, visible: boolean) => void;
  shouldEnableShimmer: (component: TrackedComponent) => boolean;
  getComponentAge: (component: TrackedComponent) => number; // How long since mount
}

// Default state for SSR
const defaultState: FpsOptimizerState = {
  deviceTier: 'high',
  isMobile: false,
  isTablet: false,
  isSafari: false,
  isIOS: false,
  currentFps: 60,
  averageFps: 60,
  shimmerQuality: 'high',
  splineQuality: 'high',
  animationMultiplier: 1,
  enableBlur: true,
  enableShadows: true,
  enable3D: true,
  enableParticles: true,
  enableGlassEffects: true,
  enableHoverAnimations: true,
  enableScrollAnimations: true,
  maxPolygons: 2000000,
  textureQuality: '4k',
  targetFrameRate: 60,
  activeComponents: new Set(),
  componentUsage: new Map(),
  componentInteractionCount: 0,
  timeSinceLastInteraction: 0,
  refreshDeviceInfo: () => {},
  setShimmerQuality: () => {},
  setSplineQuality: () => {},
  registerComponent: () => {},
  unregisterComponent: () => {},
  trackInteraction: () => {},
  setComponentVisibility: () => {},
  shouldEnableShimmer: () => true,
  getComponentAge: () => 0,
};

// ============================================================================
// DEVICE TIER CONFIGURATIONS
// ============================================================================

export interface DeviceTierConfig {
  shimmerQuality: ShimmerQuality;
  splineQuality: SplineQuality;
  animationMultiplier: number;
  enableBlur: boolean;
  enableShadows: boolean;
  enable3D: boolean;
  enableParticles: boolean;
  enableGlassEffects: boolean;
  enableHoverAnimations: boolean;
  enableScrollAnimations: boolean;
  maxPolygons: number;
  textureQuality: '4k' | '2k' | '1k' | '512';
  targetFrameRate: 30 | 60 | 90 | 120;
}

// Pre-computed configurations for each device tier
const TIER_CONFIGS: Record<DeviceTier, DeviceTierConfig> = {
  ultra: {
    shimmerQuality: 'high',
    splineQuality: 'ultra',
    animationMultiplier: 1,
    enableBlur: true,
    enableShadows: true,
    enable3D: true,
    enableParticles: true,
    enableGlassEffects: true,
    enableHoverAnimations: true,
    enableScrollAnimations: true,
    maxPolygons: 3000000,
    textureQuality: '4k',
    targetFrameRate: 120,
  },
  high: {
    shimmerQuality: 'high',
    splineQuality: 'high',
    animationMultiplier: 1,
    enableBlur: true,
    enableShadows: true,
    enable3D: true,
    enableParticles: true,
    enableGlassEffects: true,
    enableHoverAnimations: true,
    enableScrollAnimations: true,
    maxPolygons: 2000000,
    textureQuality: '4k',
    targetFrameRate: 60,
  },
  medium: {
    shimmerQuality: 'medium',
    splineQuality: 'medium',
    animationMultiplier: 0.7,
    enableBlur: true,
    enableShadows: true,
    enable3D: true,
    enableParticles: false,
    enableGlassEffects: true,
    enableHoverAnimations: true,
    enableScrollAnimations: true,
    maxPolygons: 1000000,
    textureQuality: '2k',
    targetFrameRate: 60,
  },
  low: {
    shimmerQuality: 'low',
    splineQuality: 'low',
    animationMultiplier: 0.4,
    enableBlur: false,
    enableShadows: false,
    enable3D: true, // Still render 3D, just lower quality
    enableParticles: false,
    enableGlassEffects: false,
    enableHoverAnimations: false,
    enableScrollAnimations: false,
    maxPolygons: 250000,
    textureQuality: '1k',
    targetFrameRate: 30,
  },
  minimal: {
    shimmerQuality: 'disabled',
    splineQuality: 'low',
    animationMultiplier: 0.1,
    enableBlur: false,
    enableShadows: false,
    enable3D: true, // Still render 3D with fallback quality
    enableParticles: false,
    enableGlassEffects: false,
    enableHoverAnimations: false,
    enableScrollAnimations: false,
    maxPolygons: 100000,
    textureQuality: '512',
    targetFrameRate: 30,
  },
};

/**
 * Compute device tier from DeviceInfo
 */
function computeDeviceTier(info: DeviceInfo | null): DeviceTier {
  if (!info) return 'high';
  
  const gpuTier = info.performance?.gpu?.tier || 'medium';
  const memory = info.performance?.memory?.total || 4;
  const fps = info.live?.fps || 60;
  const cores = info.performance?.cpu?.cores || 4;
  const isMobile = info.device?.type === 'mobile';
  
  // Ultra tier: High-end desktop with discrete GPU and high memory
  if (!isMobile && gpuTier === 'high' && memory >= 16 && cores >= 8 && fps >= 55) {
    return 'ultra';
  }
  
  // High tier: Good GPU, decent memory
  if (gpuTier === 'high' && memory >= 8 && fps >= 50) {
    return 'high';
  }
  
  // Medium tier: Average device
  if (gpuTier === 'medium' || (gpuTier === 'high' && (memory < 8 || fps < 50))) {
    return 'medium';
  }
  
  // Low tier: Older or budget device
  if (gpuTier === 'low' || memory < 4 || fps < 30) {
    // Minimal for very low-end
    if (memory < 2 || fps < 20) {
      return 'minimal';
    }
    return 'low';
  }
  
  return 'medium';
}

/**
 * Safely get device info (only on client-side)
 */
function safeGetDeviceInfo(): DeviceInfo | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  try {
    // Lazy import deviceMonitor only on client-side
    const { deviceMonitor } = require('@/lib/deviceMonitor');
    return deviceMonitor.getInfo();
  } catch (e) {
    console.warn('[FpsOptimizer] Failed to get device info:', e);
    return null;
  }
}

/**
 * Get device tier configuration for initial load optimization
 * Can be called without context for early optimization decisions
 */
export function getDeviceTierConfig(tier?: DeviceTier): DeviceTierConfig {
  if (tier) {
    return TIER_CONFIGS[tier];
  }
  
  // Auto-detect if no tier provided
  if (typeof window === 'undefined') {
    return TIER_CONFIGS.high; // SSR fallback
  }
  
  const info = safeGetDeviceInfo();
  const computedTier = computeDeviceTier(info);
  return TIER_CONFIGS[computedTier];
}

// ============================================================================
// CONTEXT
// ============================================================================

const FpsOptimizerContext = createContext<FpsOptimizerState>(defaultState);

/**
 * Hook to access FPS optimizer state and controls
 */
export function useFpsOptimizer() {
  return useContext(FpsOptimizerContext);
}

// ============================================================================
// CSS CLASS INJECTOR
// ============================================================================

function injectOptimizationClasses(state: FpsOptimizerState) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Clear existing classes
  root.classList.remove(
    'fps-ultra', 'fps-high', 'fps-medium', 'fps-low', 'fps-minimal',
    'shimmer-quality-high', 'shimmer-quality-medium', 'shimmer-quality-low', 'shimmer-quality-disabled',
    'reduce-blur', 'reduce-shadows', 'reduce-animations', 'reduce-particles',
    'is-mobile', 'is-tablet', 'is-safari', 'is-ios'
  );
  
  // Add device tier class
  root.classList.add(`fps-${state.deviceTier}`);
  
  // Add shimmer quality class
  root.classList.add(`shimmer-quality-${state.shimmerQuality}`);
  
  // Add feature reduction classes
  if (!state.enableBlur) root.classList.add('reduce-blur');
  if (!state.enableShadows) root.classList.add('reduce-shadows');
  if (state.animationMultiplier < 0.5) root.classList.add('reduce-animations');
  if (!state.enableParticles) root.classList.add('reduce-particles');
  
  // Add device type classes
  if (state.isMobile) root.classList.add('is-mobile');
  if (state.isTablet) root.classList.add('is-tablet');
  if (state.isSafari) root.classList.add('is-safari');
  if (state.isIOS) root.classList.add('is-ios');
  
  // Set CSS custom properties for animations
  root.style.setProperty('--animation-duration-multiplier', String(state.animationMultiplier));
  root.style.setProperty('--blur-amount', state.enableBlur ? '12px' : '0px');
  root.style.setProperty('--shadow-opacity', state.enableShadows ? '1' : '0');
  root.style.setProperty('--target-fps', String(state.targetFrameRate));
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface FpsOptimizerProviderProps {
  children: ReactNode;
  /** Enable FPS monitoring (default: true on desktop) */
  enableMonitoring?: boolean;
  /** Monitoring interval in ms (default: 1000) */
  monitoringInterval?: number;
  /** How long to wait before starting optimization (default: 3000ms) */
  startDelay?: number;
}

export const FpsOptimizerProvider = memo(function FpsOptimizerProvider({
  children,
  enableMonitoring = true,
  monitoringInterval = 1000,
  startDelay = 3000,
}: FpsOptimizerProviderProps) {
  // State
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);
  const [averageFps, setAverageFps] = useState(60);
  const [shimmerQuality, setShimmerQuality] = useState<ShimmerQuality>('high');
  const [splineQuality, setSplineQuality] = useState<SplineQuality>('high');
  const [config, setConfig] = useState<DeviceTierConfig>(TIER_CONFIGS.high);
  
  // Component tracking - for dynamic optimization based on usage
  const [activeComponents, setActiveComponents] = useState<Set<TrackedComponent>>(new Set());
  const [componentUsage, setComponentUsage] = useState<Map<TrackedComponent, ComponentUsage>>(new Map());
  const [componentInteractionCount, setComponentInteractionCount] = useState(0);
  const [timeSinceLastInteraction, setTimeSinceLastInteraction] = useState(0);
  const lastInteractionTimeRef = useRef(Date.now());
  
  // Refs for FPS monitoring
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const lowFpsCountRef = useRef(0); // Track how many times FPS dropped
  
  // Component registration - components call this when they mount
  const registerComponent = useCallback((name: TrackedComponent) => {
    setActiveComponents(prev => new Set([...prev, name]));
    setComponentUsage(prev => {
      const next = new Map(prev);
      next.set(name, {
        mountedAt: Date.now(),
        lastInteraction: Date.now(),
        interactionCount: 0,
        isVisible: true,
      });
      return next;
    });
    // Add CSS class for component-specific optimization
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(`component-inactive-${name}`);
    }
  }, []);
  
  // Component unregistration - components call this when they unmount
  const unregisterComponent = useCallback((name: TrackedComponent) => {
    setActiveComponents(prev => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    setComponentUsage(prev => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
    // Add CSS class to disable shimmers for unmounted components
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add(`component-inactive-${name}`);
    }
  }, []);
  
  // Set component visibility (for when components are hidden but not unmounted)
  const setComponentVisibility = useCallback((name: TrackedComponent, visible: boolean) => {
    setComponentUsage(prev => {
      const next = new Map(prev);
      const existing = next.get(name);
      if (existing) {
        next.set(name, { ...existing, isVisible: visible });
      }
      return next;
    });
    // Toggle CSS class based on visibility
    if (typeof document !== 'undefined') {
      if (visible) {
        document.documentElement.classList.remove(`component-inactive-${name}`);
      } else {
        document.documentElement.classList.add(`component-inactive-${name}`);
      }
    }
  }, []);
  
  // Track user interactions - more interactions = potentially more lag
  const trackInteraction = useCallback((component?: TrackedComponent) => {
    const now = Date.now();
    lastInteractionTimeRef.current = now;
    setComponentInteractionCount(prev => prev + 1);
    setTimeSinceLastInteraction(0);
    
    if (component) {
      setComponentUsage(prev => {
        const next = new Map(prev);
        const existing = next.get(component);
        if (existing) {
          next.set(component, {
            ...existing,
            lastInteraction: now,
            interactionCount: existing.interactionCount + 1,
          });
        }
        return next;
      });
    }
  }, []);
  
  // Get how long a component has been mounted
  const getComponentAge = useCallback((component: TrackedComponent): number => {
    const usage = componentUsage.get(component);
    return usage ? Date.now() - usage.mountedAt : 0;
  }, [componentUsage]);
  
  // Determine if shimmer should be enabled for a component
  // Disables shimmers on low-priority components when FPS is dropping
  // Also considers component visibility and interaction recency
  const shouldEnableShimmer = useCallback((component: TrackedComponent): boolean => {
    // Always enable if shimmer quality is high
    if (shimmerQuality === 'high') return true;
    
    // Disable all if quality is disabled
    if (shimmerQuality === 'disabled') return false;
    
    // Check if component is visible
    const usage = componentUsage.get(component);
    if (usage && !usage.isVisible) return false;
    
    // Priority: navbar > footer > audioWidget > ultimatePanel > staticTip > movingTip
    const priority: Record<TrackedComponent, number> = {
      navbar: 6,
      footer: 5,
      audioWidget: 4,
      modal: 4,
      ultimatePanel: 3,
      staticTip: 2,
      movingTip: 2,
      spline: 1,
    };
    
    // If FPS is very low, disable all non-essential shimmers
    if (currentFps < 20) {
      return priority[component] >= 6; // Only navbar
    }
    
    // If FPS is low, only enable high-priority components
    if (shimmerQuality === 'low') {
      return priority[component] >= 5; // Only navbar and footer
    }
    
    if (shimmerQuality === 'medium') {
      return priority[component] >= 4; // navbar, footer, audioWidget, modal
    }
    
    // Check if component hasn't been interacted with in a while (30 seconds)
    if (usage && Date.now() - usage.lastInteraction > 30000) {
      // Reduce shimmer priority for inactive components
      return priority[component] >= 5;
    }
    
    return true;
  }, [shimmerQuality, componentUsage, currentFps]);
  
  // Initialize device info
  const refreshDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const info = safeGetDeviceInfo();
    const tier = computeDeviceTier(info);
    const tierConfig = TIER_CONFIGS[tier];
    
    setDeviceTier(tier);
    setIsMobile(window.innerWidth < 768);
    setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    
    // Safari detection
    const ua = navigator.userAgent;
    const safari = /^((?!chrome|android).)*safari/i.test(ua);
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsSafari(safari);
    setIsIOS(ios);
    setConfig(tierConfig);
    setShimmerQuality(tierConfig.shimmerQuality);
    setSplineQuality(tierConfig.splineQuality);
    
    console.log(`[FpsOptimizer] Device tier: ${tier}, Mobile: ${window.innerWidth < 768}, Safari: ${safari}`);
  }, []);
  
  // Initial setup
  useEffect(() => {
    refreshDeviceInfo();
    
    // Listen for resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [refreshDeviceInfo]);
  
  // Track time since last interaction - auto-reduce quality if idle for long
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateIdleTime = () => {
      const idle = Date.now() - lastInteractionTimeRef.current;
      setTimeSinceLastInteraction(idle);
      
      // After 60 seconds of idle, reduce shimmer quality to save resources
      if (idle > 60000 && shimmerQuality === 'high') {
        setShimmerQuality('medium');
        console.log('[FpsOptimizer] Idle detected - reducing shimmer quality');
      }
      
      // After 2 minutes of idle, disable non-essential shimmers
      if (idle > 120000 && shimmerQuality !== 'low' && shimmerQuality !== 'disabled') {
        setShimmerQuality('low');
        console.log('[FpsOptimizer] Extended idle - minimal shimmers');
      }
    };
    
    const idleInterval = setInterval(updateIdleTime, 5000);
    
    // Reset idle on any user interaction
    const resetIdle = () => {
      lastInteractionTimeRef.current = Date.now();
      setTimeSinceLastInteraction(0);
      // Restore quality on interaction if it was reduced due to idle
      if (shimmerQuality === 'low' || shimmerQuality === 'medium') {
        setShimmerQuality(config.shimmerQuality);
      }
    };
    
    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    
    return () => {
      clearInterval(idleInterval);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('scroll', resetIdle);
    };
  }, [shimmerQuality, config.shimmerQuality]);
  
  // FPS monitoring and dynamic optimization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enableMonitoring) return;
    if (isMobile) return; // Skip FPS monitoring on mobile for battery
    
    let animationId: number;
    let started = false;
    
    const measureAndOptimize = (timestamp: number) => {
      if (!started) {
        lastTimeRef.current = timestamp;
        lastUpdateRef.current = timestamp;
        started = true;
        animationId = requestAnimationFrame(measureAndOptimize);
        return;
      }
      
      frameCountRef.current++;
      const elapsed = timestamp - lastTimeRef.current;
      
      if (elapsed >= monitoringInterval) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        setCurrentFps(fps);
        
        // Update history
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        // Calculate average
        const avg = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        setAverageFps(Math.round(avg));
        
        // Only update quality if enough time passed (prevent thrashing)
        const timeSinceLastUpdate = timestamp - lastUpdateRef.current;
        if (timeSinceLastUpdate >= 2000) { // 2 second debounce
          // Dynamic quality adjustment based on FPS
          // More aggressive degradation to prevent crashes
          if (avg < 15) {
            // CRITICAL: Disable everything to prevent crash
            setShimmerQuality('disabled');
            setSplineQuality('low');
            lowFpsCountRef.current++;
            console.warn(`🔴 [FpsOptimizer] CRITICAL FPS (${Math.round(avg)}) - Disabling shimmers`);
          } else if (avg < 25) {
            setShimmerQuality('disabled');
            lowFpsCountRef.current++;
            console.warn(`⚠️ [FpsOptimizer] Very low FPS (${Math.round(avg)}) - Shimmers disabled`);
          } else if (avg < 35) {
            setShimmerQuality('low');
            console.log(`⚡ [FpsOptimizer] Low FPS (${Math.round(avg)}) - Shimmer quality: low`);
          } else if (avg < 50) {
            setShimmerQuality('medium');
          } else {
            // Only restore quality if we haven't had too many low FPS incidents
            if (lowFpsCountRef.current < 3) {
              setShimmerQuality(config.shimmerQuality);
            } else {
              // Keep at medium if we've had FPS issues
              setShimmerQuality('medium');
            }
          }
          lastUpdateRef.current = timestamp;
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = timestamp;
      }
      
      animationId = requestAnimationFrame(measureAndOptimize);
    };
    
    // Delay start to let page settle
    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(measureAndOptimize);
    }, startDelay);
    
    return () => {
      clearTimeout(timeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [enableMonitoring, isMobile, monitoringInterval, startDelay, config.shimmerQuality]);
  
  // Build state object
  const state: FpsOptimizerState = {
    deviceTier,
    isMobile,
    isTablet,
    isSafari,
    isIOS,
    currentFps,
    averageFps,
    shimmerQuality,
    splineQuality,
    animationMultiplier: config.animationMultiplier,
    enableBlur: config.enableBlur,
    enableShadows: config.enableShadows,
    enable3D: config.enable3D,
    enableParticles: config.enableParticles,
    enableGlassEffects: config.enableGlassEffects,
    enableHoverAnimations: config.enableHoverAnimations,
    enableScrollAnimations: config.enableScrollAnimations,
    maxPolygons: config.maxPolygons,
    textureQuality: config.textureQuality,
    targetFrameRate: config.targetFrameRate,
    activeComponents,
    componentUsage,
    componentInteractionCount,
    timeSinceLastInteraction,
    refreshDeviceInfo,
    setShimmerQuality,
    setSplineQuality,
    registerComponent,
    unregisterComponent,
    trackInteraction,
    setComponentVisibility,
    shouldEnableShimmer,
    getComponentAge,
  };
  
  // Inject CSS classes whenever state changes
  useEffect(() => {
    injectOptimizationClasses(state);
  }, [state.deviceTier, state.shimmerQuality, state.enableBlur, state.enableShadows, state.isMobile, state.isSafari]);
  
  return (
    <FpsOptimizerContext.Provider value={state}>
      {children}
    </FpsOptimizerContext.Provider>
  );
});

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for components that need device-aware shimmer quality
 */
export function useShimmerOptimization() {
  const { shimmerQuality, deviceTier, isMobile } = useFpsOptimizer();
  
  return {
    quality: shimmerQuality,
    isDisabled: shimmerQuality === 'disabled',
    speed: shimmerQuality === 'high' ? 'normal' : shimmerQuality === 'medium' ? 'slow' : 'slow',
    intensity: shimmerQuality === 'high' ? 'medium' : 'low',
    deviceTier,
    isMobile,
  };
}

/**
 * Hook for 3D/Spline components
 */
export function useSplineOptimization() {
  const { 
    splineQuality, 
    enable3D, 
    maxPolygons, 
    textureQuality, 
    targetFrameRate,
    deviceTier,
    isMobile 
  } = useFpsOptimizer();
  
  return {
    quality: splineQuality,
    enabled: enable3D,
    maxPolygons,
    textureQuality,
    targetFrameRate,
    deviceTier,
    isMobile,
    // Helper for Spline props
    getSplineProps: () => ({
      renderOnDemand: splineQuality !== 'ultra',
      className: `spline-quality-${splineQuality}`,
    }),
  };
}

/**
 * Hook for animation-heavy components
 */
export function useAnimationOptimization() {
  const { 
    animationMultiplier, 
    enableHoverAnimations, 
    enableScrollAnimations,
    enableParticles,
    shimmerQuality,
  } = useFpsOptimizer();
  
  return {
    durationMultiplier: animationMultiplier,
    enableHover: enableHoverAnimations,
    enableScroll: enableScrollAnimations,
    enableParticles,
    shimmerDisabled: shimmerQuality === 'disabled',
  };
}

export default FpsOptimizerProvider;
