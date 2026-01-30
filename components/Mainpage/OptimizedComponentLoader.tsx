"use client";

import React, { useState, useEffect, useRef, memo, Suspense } from 'react';
import { motion } from 'framer-motion';

// ==========================================
// MEMORY MANAGEMENT & LOADING SYSTEM
// ==========================================

interface LoaderConfig {
  /** Preload distance in pixels before viewport enters */
  preloadDistance?: number;
  /** Unload distance in pixels after viewport exits */
  unloadDistance?: number;
  /** Memory cleanup delay in milliseconds */
  cleanupDelay?: number;
  /** Enable aggressive mobile optimization */
  aggressiveMobile?: boolean;
}

const DEFAULT_CONFIG: LoaderConfig = {
  preloadDistance: 800,
  unloadDistance: 1200,
  cleanupDelay: 2000,
  aggressiveMobile: true,
};

/**
 * Optimized Component Loader
 * - Lazy loads components based on scroll position
 * - Unloads components when far from viewport to save memory
 * - Mobile-first performance optimizations
 */
export const OptimizedComponentLoader = memo<{
  children: React.ReactNode;
  isVisible: boolean;
  componentName: string;
  config?: LoaderConfig;
  priority?: 'high' | 'medium' | 'low';
}>(({ children, isVisible, componentName, config = {}, priority = 'medium' }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldAggressivelyOptimize = isMobile && finalConfig.aggressiveMobile;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Component is in or near viewport - load it
      setShouldLoad(true);
      setShouldRender(true);

      // Clear any pending cleanup
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }

      // Mark as loaded after first successful render
      if (!hasLoaded) {
        const timer = setTimeout(() => {
          if (isMounted.current) setHasLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else if (hasLoaded && shouldAggressivelyOptimize) {
      // Component is far from viewport on mobile - schedule unload
      setShouldRender(false);

      cleanupTimerRef.current = setTimeout(() => {
        if (isMounted.current && !isVisible) {
          setShouldLoad(false);
        }
      }, finalConfig.cleanupDelay);
    }
    return undefined;
  }, [isVisible, hasLoaded, shouldAggressivelyOptimize, finalConfig.cleanupDelay]);

  if (!shouldLoad) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-black/20"
        data-component={componentName}
        data-state="unloaded"
      />
    );
  }

  if (!shouldRender) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-black/20"
        data-component={componentName}
        data-state="suspended"
      >
        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <LoadingSkeleton componentName={componentName} priority={priority} />
      }
    >
      <div
        data-component={componentName}
        data-state="loaded"
        className="w-full h-full"
      >
        {children}
      </div>
    </Suspense>
  );
});
OptimizedComponentLoader.displayName = "OptimizedComponentLoader";

// ==========================================
// LOADING SKELETON COMPONENT
// ==========================================

const LoadingSkeleton = memo<{
  componentName: string;
  priority: 'high' | 'medium' | 'low';
}>(({ componentName, priority }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-neutral-950 to-black relative overflow-hidden"
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-cyan-500/40 rounded-full animate-spin animation-delay-150" />
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 font-mono text-sm tracking-wider uppercase"
          >
            Loading {componentName}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <span className={`w-2 h-2 rounded-full ${
              priority === 'high' ? 'bg-white' :
              priority === 'medium' ? 'bg-yellow-500' :
              'bg-white'
            }`} />
            <span className="text-xs text-white/40 font-mono uppercase">
              {priority} Priority
            </span>
          </motion.div>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Scan Line Effect */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
});
LoadingSkeleton.displayName = "LoadingSkeleton";

// ==========================================
// SCROLL-BASED VISIBILITY TRACKER
// ==========================================

export const useScrollVisibility = (
  ref: React.RefObject<HTMLElement>,
  config: LoaderConfig = {}
) => {
  const [isVisible, setIsVisible] = useState(false);
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        rootMargin: `${finalConfig.preloadDistance}px 0px ${finalConfig.unloadDistance}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [finalConfig.preloadDistance, finalConfig.unloadDistance]);

  return isVisible;
};

// ==========================================
// MEMORY MONITOR (Development Only)
// ==========================================

export const MemoryMonitor = memo(() => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    // Only in development and if performance.memory is available
    if (process.env.NODE_ENV !== 'development') return;

    const checkMemory = () => {
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        // @ts-ignore
        const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const used = Math.round(usedJSHeapSize / 1048576); // MB
        const total = Math.round(jsHeapSizeLimit / 1048576); // MB
        const percentage = Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100);

        setMemoryInfo({ used, total, percentage });
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!memoryInfo) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[999999] pointer-events-none">
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-xs font-mono">
        <div className="text-white/60 mb-1">Memory Usage</div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                memoryInfo.percentage > 80 ? 'bg-red-500' :
                memoryInfo.percentage > 60 ? 'bg-yellow-500' :
                'bg-white'
              }`}
              style={{ width: `${memoryInfo.percentage}%` }}
            />
          </div>
          <span className="text-white/80">
            {memoryInfo.used}MB / {memoryInfo.total}MB ({memoryInfo.percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
});
MemoryMonitor.displayName = "MemoryMonitor";
