import { useEffect } from 'react';
import { GLOBAL_STYLES } from '@/styles/globalStyles';
import { userStorage, devicePrefs } from '@/lib/smartStorage';

interface UsePageInitializationProps {
  setIsClient: (value: boolean) => void;
  setIsTouch: (value: boolean) => void;
  setIsSafari: (value: boolean) => void;
  setIsSafeMode: (value: boolean) => void;
  setDisableSpline: (value: boolean) => void;
  setActiveThemeId: (value: string) => void;
  setIsMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setHasSeenIntro: (value: boolean) => void;
  setHasSeenHold: (value: boolean) => void;
  setHasRegistered: (value: boolean) => void;
  setCurrentStage: (value: "register" | "hold" | "v2" | "content") => void;
  setIsCompactViewport: (value: boolean) => void;
  setShowPerfPrompt?: (value: boolean) => void;
  isTouchRef: React.MutableRefObject<boolean>;
  prefersReducedMotionRef: React.MutableRefObject<boolean>;
  deviceProfile: any;
}

/**
 * Handles initial page setup, style injection, device detection, and user preference loading
 */
export function usePageInitialization({
  setIsClient,
  setIsTouch,
  setIsSafari,
  setIsSafeMode,
  setDisableSpline,
  setActiveThemeId,
  setIsMuted,
  setVolume,
  setHasSeenIntro,
  setHasSeenHold,
  setHasRegistered,
  setCurrentStage,
  setIsCompactViewport,
  setShowPerfPrompt,
  isTouchRef,
  prefersReducedMotionRef,
  deviceProfile,
}: UsePageInitializationProps) {
  useEffect(() => {
    setIsClient(true);

    // Inject global styles only once
    const STYLE_ID = 'bullmoney-global-styles';
    let styleSheet = document.getElementById(STYLE_ID) as HTMLStyleElement;

    if (!styleSheet) {
      styleSheet = document.createElement("style");
      styleSheet.id = STYLE_ID;
      styleSheet.innerText = GLOBAL_STYLES;
      document.head.appendChild(styleSheet);
      console.log('[Init] Global styles injected');
    } else {
      console.log('[Init] Global styles already exist, skipping injection');
    }

    // Detect touch device
    const touch = !!(matchMedia && matchMedia('(pointer: coarse)').matches);
    isTouchRef.current = touch;
    setIsTouch(touch);

    // Detect Safari and in-app browsers
    const ua = navigator.userAgent || '';
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    setIsSafari(isSafariBrowser);

    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isInApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);

    // Detect network conditions
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const effectiveType = connection?.effectiveType || connection?.type || '4g';
    const prefersReducedData = connection?.saveData === true || ['slow-2g', '2g', '3g'].includes(effectiveType);

    const shouldSafeMode = isIOS || isInApp || prefersReducedData;
    setIsSafeMode(shouldSafeMode);

    // Determine Spline preference with cleaner logic
    const savedSplinePref = devicePrefs.get('spline_enabled');
    const hasSavedPreference = savedSplinePref !== null;

    if (hasSavedPreference) {
      // User has made a choice - respect it
      setDisableSpline(savedSplinePref !== 'true');
    } else {
      // First time - use intelligent defaults based on device profile
      const shouldEnableSpline =
        deviceProfile.isHighEndDevice &&
        !deviceProfile.prefersReducedMotion &&
        !deviceProfile.prefersReducedData &&
        !shouldSafeMode;

      setDisableSpline(!shouldEnableSpline);
      devicePrefs.set('spline_enabled', shouldEnableSpline ? 'true' : 'false');

      console.log('[Init] First visit - Spline preference set to:', shouldEnableSpline ? 'enabled' : 'disabled', {
        isHighEnd: deviceProfile.isHighEndDevice,
        isMobile: deviceProfile.isMobile,
        reducedMotion: deviceProfile.prefersReducedMotion,
        reducedData: deviceProfile.prefersReducedData,
        safeMode: shouldSafeMode
      });

      // Show performance prompt for first-time users after intro completes
      // Only show if device is capable of 3D but user might prefer speed mode
      if (setShowPerfPrompt && deviceProfile.isHighEndDevice) {
        setTimeout(() => {
          const currentStage = userStorage.get('bm_intro_seen');
          if (currentStage === 'true') {
            setShowPerfPrompt(true);
          }
        }, 2000); // Show 2 seconds after content loads
      }
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };

    if (mediaQuery) {
      prefersReducedMotionRef.current = mediaQuery.matches;
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMotionChange);
      } else {
        (mediaQuery as any).addListener(handleMotionChange);
      }
    }

    // Load user preferences
    const storedTheme = userStorage.get('user_theme_id');
    const storedMute = userStorage.get('user_is_muted');
    const storedVol = userStorage.get('user_volume');
    const hasRegisteredUser = userStorage.get('vip_user_registered') === 'true';
    const introSeenFlag = userStorage.get('bm_intro_seen') === 'true';
    const holdSeenFlag = userStorage.get('bm_hold_seen') === 'true';

    if (storedTheme) setActiveThemeId(storedTheme);
    if (storedMute !== null) setIsMuted(storedMute === 'true');
    if (storedVol) setVolume(parseInt(storedVol));
    setHasSeenIntro(introSeenFlag);
    setHasSeenHold(holdSeenFlag);
    setHasRegistered(hasRegisteredUser);
    setCurrentStage("v2");

    // Viewport resize handler
    const handleViewportResize = () => {
      setIsCompactViewport(window.innerWidth < 1100);
    };
    handleViewportResize();
    window.addEventListener('resize', handleViewportResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleViewportResize);
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMotionChange);
        } else {
          (mediaQuery as any).removeListener(handleMotionChange);
        }
      }
    };
  }, []);
}
