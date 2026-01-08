import { useState, useCallback, useMemo } from 'react';
import { devicePrefs } from '@/lib/smartStorage';
import { playClick } from '@/lib/interactionUtils';

/**
 * Manages performance mode (3D scenes vs speed mode)
 */
export function usePerformanceState() {
  const [disableSpline, setDisableSpline] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [heroSceneReady, setHeroSceneReady] = useState(false);
  const [heroLoaderHidden, setHeroLoaderHidden] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  const handlePerformanceToggle = useCallback((
    setPerfToast: (toast: {message: string; type: 'success' | 'info' | 'warning'} | null) => void,
    setParticleTrigger: React.Dispatch<React.SetStateAction<number>>
  ) => {
    // Haptic feedback
    playClick();
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);

    const nextDisabled = !disableSpline;

    // Immediate state update for better UX
    setDisableSpline(nextDisabled);
    devicePrefs.set('spline_enabled', String(!nextDisabled));

    // Visual feedback
    setParticleTrigger(prev => prev + 1);

    // Show toast notification
    const toastConfig = nextDisabled
      ? {
          message: '⚡ SPEED MODE - Instant page loads, 3x faster trading',
          type: 'success' as const
        }
      : {
          message: '✨ PREMIUM MODE - Full 3D experience enabled',
          type: 'success' as const
        };

    setPerfToast(toastConfig);

    // Log for debugging
    console.log('[Performance]', nextDisabled ? '⚡ Speed Mode' : '✨ Premium Mode', {
      splinesDisabled: nextDisabled,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
        ? `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB`
        : 'N/A'
    });

    // Clear toast after 4 seconds
    setTimeout(() => setPerfToast(null), 4000);

    // Trigger particle effect again for smooth transition
    setTimeout(() => setParticleTrigger(prev => prev + 1), 150);
  }, [disableSpline]);

  const splinesEnabled = useMemo(() => !disableSpline, [disableSpline]);

  return {
    disableSpline,
    setDisableSpline,
    isSafeMode,
    setIsSafeMode,
    isSafari,
    setIsSafari,
    isTouch,
    setIsTouch,
    isCompactViewport,
    setIsCompactViewport,
    heroSceneReady,
    setHeroSceneReady,
    heroLoaderHidden,
    setHeroLoaderHidden,
    parallaxOffset,
    setParallaxOffset,
    handlePerformanceToggle,
    splinesEnabled,
  };
}
