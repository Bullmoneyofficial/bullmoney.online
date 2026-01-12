import React from 'react';

export interface DeviceProfile {
  isMobile: boolean;
  isDesktop: boolean;
  isWebView: boolean;
  isTouch: boolean;
  prefersReducedMotion: boolean;
  prefersReducedData: boolean;
  isHighEndDevice: boolean;
  connectionType: string | null;
  // NEW: Desktop-specific optimizations
  isAppleSilicon: boolean;
  isHighRefreshDesktop: boolean;
  desktopTier: 'ultra' | 'high' | 'medium' | 'low';
  gpuTier: 'integrated' | 'discrete' | 'apple-gpu' | 'unknown';
}

const IN_APP_BROWSER_REGEX = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i;
const MOBILE_USER_AGENT_REGEX = /Mobi|Android|iPhone|iPad|iPod/i;

export const DEFAULT_DEVICE_PROFILE: DeviceProfile = {
  isMobile: false,
  isDesktop: true,
  isWebView: false,
  isTouch: false,
  prefersReducedMotion: false,
  prefersReducedData: false,
  isHighEndDevice: true,
  connectionType: null,
  // Desktop defaults
  isAppleSilicon: false,
  isHighRefreshDesktop: false,
  desktopTier: 'high',
  gpuTier: 'unknown',
};

const buildProfile = (): DeviceProfile => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_DEVICE_PROFILE };
  }

  const ua = navigator.userAgent || '';
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  const effectiveType = connection?.effectiveType || connection?.type || '4g';
  const supportsReducedData = connection?.saveData === true || ['slow-2g', '2g', '3g'].includes(effectiveType);
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch =
    window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isMobile =
    isTouch ||
    window.innerWidth < 768 ||
    MOBILE_USER_AGENT_REGEX.test(ua) ||
    ('standalone' in navigator && !!(navigator as any).standalone);
  const isWebView = IN_APP_BROWSER_REGEX.test(ua) || ('standalone' in navigator && !!(navigator as any).standalone);

  // Check for WebGL support (critical for 3D)
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  })();

  // FIXED: Ultra-inclusive device detection - quality degradation handles limitations
  // Philosophy: If device has WebGL, it can render 3D (quality will auto-adjust)
  const isHighEndDevice = (() => {
    // Must have WebGL - without it, can't render 3D at all
    if (!hasWebGL) {
      console.log('[DeviceProfile] ❌ No WebGL support - 3D disabled');
      return false;
    }

    if (!isMobile) {
      // Desktop: Very low bar - virtually all desktops can handle it
      // Even 2GB RAM is enough with quality reduction
      const canHandle = memory >= 2 && cores >= 2;
      console.log('[DeviceProfile] 🖥️ Desktop:', canHandle ? '✅ Supported' : '⚠️ Low-spec', {
        memory: `${memory}GB`,
        cores
      });
      return canHandle;
    } else {
      // Mobile: VERY inclusive - support 3G and up
      // Only exclude 2G/slow-2G (too slow for any quality level)
      const isFastEnough = !['slow-2g', '2g'].includes(effectiveType);
      const hasMinimumRAM = memory >= 2; // Support down to 2GB (iPhone 7+, budget Android)

      // FIXED: Don't require hasModernBrowser on mobile - it's too strict for older iOS
      // Quality degradation will handle older browsers
      const canHandle = hasMinimumRAM && isFastEnough;

      console.log('[DeviceProfile] 📱 Mobile:', canHandle ? '✅ Supported' : '❌ Too low', {
        memory: `${memory}GB`,
        connection: effectiveType,
        note: canHandle ? 'Quality will auto-adjust' : 'Need 2GB+ RAM and 3G+ connection'
      });

      return canHandle;
    }
  })();

  // NEW: Apple Silicon detection (M1, M2, M3, M4+)
  const isAppleSilicon = (() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    // macOS with ARM architecture
    const isMac = /macintosh|mac os x/i.test(ua);
    if (!isMac) return false;
    
    // Check for WebGL renderer containing Apple GPU
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          // Apple Silicon GPUs are identified as "apple m1/m2/m3/m4" or "apple gpu"
          return renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer));
        }
      }
    } catch (e) {}
    
    // Fallback: High core count Mac is likely Apple Silicon
    return isMac && cores >= 8;
  })();

  // NEW: Desktop tier classification
  const desktopTier = ((): 'ultra' | 'high' | 'medium' | 'low' => {
    if (isMobile) return 'medium';
    
    // Apple Silicon Macs are ultra tier
    if (isAppleSilicon) return 'ultra';
    
    // High-end desktop: 16GB+ RAM, 8+ cores
    if (memory >= 16 && cores >= 8) return 'ultra';
    
    // Good desktop: 8GB+ RAM, 4+ cores
    if (memory >= 8 && cores >= 4) return 'high';
    
    // Basic desktop: 4GB+ RAM, 2+ cores
    if (memory >= 4 && cores >= 2) return 'medium';
    
    return 'low';
  })();

  // NEW: GPU tier detection
  const gpuTier = ((): 'integrated' | 'discrete' | 'apple-gpu' | 'unknown' => {
    if (isAppleSilicon) return 'apple-gpu';
    
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          // Discrete GPU brands
          if (renderer.includes('nvidia') || renderer.includes('geforce') || 
              renderer.includes('radeon') || renderer.includes('amd') ||
              renderer.includes('rx ') || renderer.includes('rtx') || renderer.includes('gtx')) {
            return 'discrete';
          }
          // Integrated GPUs
          if (renderer.includes('intel') || renderer.includes('uhd') || renderer.includes('iris')) {
            return 'integrated';
          }
        }
      }
    } catch (e) {}
    
    return 'unknown';
  })();

  // NEW: High refresh desktop detection
  const isHighRefreshDesktop = !isMobile && (
    isAppleSilicon || // Apple Silicon Macs with ProMotion displays
    desktopTier === 'ultra' || // High-end desktops likely have high-refresh monitors
    window.screen.width >= 2560 // Ultra-wide/4K monitors often 120Hz+
  );

  return {
    isMobile,
    isDesktop: !isMobile,
    isWebView,
    isTouch,
    prefersReducedMotion,
    prefersReducedData: !!supportsReducedData,
    isHighEndDevice,
    connectionType: typeof effectiveType === 'string' ? effectiveType : null,
    // NEW desktop fields
    isAppleSilicon,
    isHighRefreshDesktop,
    desktopTier,
    gpuTier,
  };
};

export const useDeviceProfile = () => {
  const [profile, setProfile] = React.useState<DeviceProfile>(() => buildProfile());

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleChange = () => setProfile(buildProfile());
    const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    window.addEventListener('resize', handleChange);
    if (motionQuery && motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleChange);
    }
    if (connection && typeof connection.addEventListener === 'function') {
      connection.addEventListener('change', handleChange);
    }

    return () => {
      window.removeEventListener('resize', handleChange);
      if (motionQuery && motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleChange);
      }
      if (connection && typeof connection.removeEventListener === 'function') {
        connection.removeEventListener('change', handleChange);
      }
    };
  }, []);

  return profile;
};
