import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeFpsMeasurement } from '@/lib/FpsMeasurement';
import { detectBrowserCapabilities, selectOptimalMeasurementConfig } from '@/lib/FpsCompatibility';

export function useFpsMonitor() {
  const [fps, setFps] = useState(60);
  const [deviceTier, setDeviceTier] = useState('high');
  const [jankScore, setJankScore] = useState(0);
  const isFrozenRef = useRef(false);
  const engineRef = useRef<ReturnType<typeof initializeFpsMeasurement> | null>(null);
  const fallbackRafRef = useRef<number | null>(null);
  const fallbackLastTimeRef = useRef(0);
  const fallbackFrameCountRef = useRef(0);
  const fallbackDeltaBufferRef = useRef<number[]>([]);
  const fallbackLastUpdateRef = useRef(0);
  const metricsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mapFpsToTier = useCallback((value: number) => {
    if (value >= 100) return 'ultra';
    if (value >= 70) return 'high';
    if (value >= 50) return 'medium';
    if (value >= 35) return 'low';
    return 'minimal';
  }, []);

  const updateFromMetrics = useCallback((nextFps: number, nextJank: number) => {
    setFps(nextFps);
    setJankScore(nextJank);
    setDeviceTier(mapFpsToTier(nextFps));
  }, [mapFpsToTier]);

  const startFallbackRaf = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (fallbackRafRef.current) return;

    fallbackLastTimeRef.current = performance.now();
    fallbackFrameCountRef.current = 0;

    // High-frequency RAF sampler with rolling average to capture real motion (including 90/120Hz)
    fallbackDeltaBufferRef.current = [];
    fallbackLastUpdateRef.current = fallbackLastTimeRef.current;

    const measure = (time: number) => {
      const delta = time - fallbackLastTimeRef.current;
      fallbackLastTimeRef.current = time;

      // Ignore tab switches/long pauses
      if (delta > 0 && delta < 500) {
        fallbackDeltaBufferRef.current.push(delta);
        if (fallbackDeltaBufferRef.current.length > 240) {
          fallbackDeltaBufferRef.current.shift();
        }
      }

      fallbackFrameCountRef.current += 1;

      // Update visible FPS ~2x per second with rolling average (captures drops and 90/120Hz)
      if (time - fallbackLastUpdateRef.current >= 450) {
        const deltas = fallbackDeltaBufferRef.current;
        const avgDelta = deltas.length
          ? deltas.reduce((a, b) => a + b, 0) / deltas.length
          : 0;
        const currentFps = avgDelta > 0 ? Math.round(1000 / avgDelta) : Math.max(1, Math.round((fallbackFrameCountRef.current / Math.max(1, time - fallbackLastUpdateRef.current)) * 1000));
        // Jank ratio scaled from 60fps target but bounded to [0,1]
        const jankRatio = Math.min(1, Math.max(0, (60 - currentFps) / 60));
        updateFromMetrics(currentFps, jankRatio);

        fallbackFrameCountRef.current = 0;
        fallbackLastUpdateRef.current = time;
      }

      fallbackRafRef.current = requestAnimationFrame(measure);
    };

    fallbackRafRef.current = requestAnimationFrame(measure);
  }, [updateFromMetrics]);

  // Listen for battery saver freeze/unfreeze events
  useEffect(() => {
    const handleFreeze = () => {
      isFrozenRef.current = true;
      console.log('[useFpsMonitor] 🔋 Frozen - continuing FPS measurement');
    };
    const handleUnfreeze = () => {
      isFrozenRef.current = false;
      console.log('[useFpsMonitor] ✓ Unfrozen - resuming normal FPS measurement');
    };

    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);

    return () => {
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
    };
  }, []);

  // Prefer the advanced FPS engine, with a RAF fallback to avoid stale readings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const setupEngine = async () => {
      try {
        const capabilities = detectBrowserCapabilities();
        const nav = navigator as any;
        const isLowBattery = nav.getBattery
          ? await nav.getBattery().then((b: any) => b.level < 0.3 && !b.charging)
          : false;
        const config = selectOptimalMeasurementConfig(capabilities, isLowBattery);
        const win = window as any;

        if (!win.__bullmoneyFpsEngine) {
          win.__bullmoneyFpsEngine = initializeFpsMeasurement(config);
        } else if (typeof win.__bullmoneyFpsEngine.start === 'function') {
          win.__bullmoneyFpsEngine.start();
        }

        engineRef.current = win.__bullmoneyFpsEngine;
      } catch (err) {
        console.warn('[useFpsMonitor] Falling back to requestAnimationFrame FPS meter:', err);
        startFallbackRaf();
      }
    };

    setupEngine();

    metricsTimerRef.current = setInterval(() => {
      if (cancelled) return;

      const engine = engineRef.current;
      if (engine?.getMetrics) {
        const metrics = engine.getMetrics();
        if (metrics.sampleCount > 0) {
          const nextFps = Math.max(1, Math.round(metrics.currentFps || metrics.averageFps || 0));
          const nextJank = Math.min(1, Math.max(0, metrics.jankScore || 0));
          updateFromMetrics(nextFps, nextJank);
        }
      }

      // Keep RAF fallback alive for high-refresh and edge cases
      if (!fallbackRafRef.current) {
        startFallbackRaf();
      }
    }, 400);

    return () => {
      cancelled = true;
      if (metricsTimerRef.current) clearInterval(metricsTimerRef.current);
      if (fallbackRafRef.current) cancelAnimationFrame(fallbackRafRef.current);
      fallbackRafRef.current = null;
      engineRef.current?.stop?.();
    };
  }, [startFallbackRaf, updateFromMetrics]);

  return { fps, deviceTier, jankScore, engine: engineRef.current };
}
