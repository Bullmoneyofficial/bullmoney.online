/**
 * Optimized Spline Loader
 * - Progressive loading with progress bar
 * - Streaming for large files
 * - Smart caching with IndexedDB
 * - Adaptive quality based on connection
 * - Instant perceived performance
 */

"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { smartLoader } from '@/lib/smartLoading';
import { SplineSkeleton, LoadingProgress } from './SkeletonScreens';

interface OptimizedSplineLoaderProps {
  sceneUrl: string;
  isVisible: boolean;
  allowInput?: boolean;
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  label?: string;
}

// IndexedDB cache for Spline scenes
class SplineCache {
  private dbName = 'spline-cache';
  private storeName = 'scenes';
  private db: IDBDatabase | null = null;

  async init() {
    if (typeof window === 'undefined' || this.db) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async set(key: string, value: Blob): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const splineCache = new SplineCache();

export const OptimizedSplineLoader = memo<OptimizedSplineLoaderProps>(({
  sceneUrl,
  isVisible,
  allowInput = true,
  className = '',
  onReady,
  onError,
  priority = 'medium',
  label,
}) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error' | 'fallback'>('idle');
  const [progress, setProgress] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [Spline, setSpline] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Check if we should load Spline at all
  const shouldLoad = smartLoader.shouldLoadSpline();
  const quality = smartLoader.getSplineQuality();

  // Load Spline module
  useEffect(() => {
    if (!shouldLoad) {
      setLoadState('fallback');
      return;
    }

    import('@splinetool/react-spline')
      .then((mod) => {
        if (mountedRef.current) {
          setSpline(() => mod.default);
        }
      })
      .catch((err) => {
        console.error('[OptimizedSplineLoader] Failed to load Spline module:', err);
        if (mountedRef.current) setLoadState('fallback');
      });
  }, [shouldLoad]);

  // Load scene with progress and caching
  useEffect(() => {
    if (!isVisible || !shouldLoad || !Spline || loadState === 'loaded') return;

    const loadScene = async () => {
      try {
        setLoadState('loading');
        setProgress(0);

        // Try cache first
        const cached = await splineCache.get(sceneUrl);
        if (cached && mountedRef.current) {
          const url = URL.createObjectURL(cached);
          setBlobUrl(url);
          setProgress(100);
          setLoadState('loaded');
          if (onReady) onReady();
          return;
        }

        // Load with progress
        abortControllerRef.current = new AbortController();

        const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };
        const blob = await smartLoader.loadWithPriority(
          sceneUrl,
          priorityMap[priority],
          (prog) => {
            if (mountedRef.current) setProgress(prog);
          }
        );

        if (!mountedRef.current) return;

        // Cache for next time
        await splineCache.set(sceneUrl, blob);

        // Create blob URL
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoadState('loaded');
        if (onReady) onReady();

      } catch (error: any) {
        console.error('[OptimizedSplineLoader] Load error:', error);
        if (mountedRef.current) {
          setLoadState('error');
          if (onError) onError(error);
        }
      }
    };

    // Delay non-critical loads
    const delay = smartLoader.getLoadDelay(priority);
    const timer = setTimeout(loadScene, delay);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isVisible, shouldLoad, Spline, sceneUrl, priority, onReady, onError, loadState]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Render fallback for low-quality connections
  if (loadState === 'fallback' || quality === 'low') {
    return (
      <div className={`w-full h-full ${className}`}>
        <SplineSkeleton label={label || 'Scene'} />
      </div>
    );
  }

  // Render loading state
  if (loadState === 'loading') {
    return (
      <div className={`w-full h-full relative ${className}`}>
        <SplineSkeleton label={label} />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
          <LoadingProgress progress={progress} />
        </div>
      </div>
    );
  }

  // Render error state
  if (loadState === 'error') {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-linear-to-br from-neutral-950 to-black ${className}`}>
        <div className="text-center text-white/40 p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-sm">3D scene unavailable</div>
        </div>
      </div>
    );
  }

  // Render Spline scene
  if (loadState === 'loaded' && blobUrl && Spline) {
    return (
      <div className={`w-full h-full ${className}`}>
        <Spline
          scene={blobUrl}
          className={`w-full h-full ${allowInput ? '' : 'pointer-events-none'}`}
          onError={(err: Error) => {
            console.error('[OptimizedSplineLoader] Runtime error:', err);
            setLoadState('error');
            if (onError) onError(err);
          }}
        />
      </div>
    );
  }

  // Initial state
  return (
    <div className={`w-full h-full ${className}`}>
      <SplineSkeleton label={label} />
    </div>
  );
});

OptimizedSplineLoader.displayName = 'OptimizedSplineLoader';

export default OptimizedSplineLoader;
