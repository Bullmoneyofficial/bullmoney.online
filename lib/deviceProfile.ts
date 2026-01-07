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

  // Enhanced high-end detection: Consider GPU, screen resolution, and device capabilities
  const hasHighResScreen = window.innerWidth >= 1920 || window.devicePixelRatio >= 2;
  const hasModernBrowser = 'IntersectionObserver' in window && 'requestIdleCallback' in window;

  const isHighEndDevice =
    !isMobile &&
    !supportsReducedData &&
    memory >= 4 &&
    cores >= 4 &&
    hasHighResScreen &&
    hasModernBrowser &&
    effectiveType !== '3g'; // Exclude 3G connections even on desktop

  return {
    isMobile,
    isDesktop: !isMobile,
    isWebView,
    isTouch,
    prefersReducedMotion,
    prefersReducedData: !!supportsReducedData,
    isHighEndDevice,
    connectionType: typeof effectiveType === 'string' ? effectiveType : null,
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
