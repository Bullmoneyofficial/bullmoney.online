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

    // FIXED: Unified spline preference for mobile and desktop
    // Only disable if user explicitly wants reduced motion (accessibility)
    // Network quality affects rendering quality, not availability
    const savedSplinePref = devicePrefs.get('spline_enabled');
    const hasSavedPreference = savedSplinePref !== null && savedSplinePref !== undefined;

    console.log('[Init] 🔍 Spline initialization check', {
      savedSplinePref,
      hasSavedPreference,
      deviceProfile: {
        isMobile: deviceProfile.isMobile,
        isHighEndDevice: deviceProfile.isHighEndDevice,
        prefersReducedMotion: deviceProfile.prefersReducedMotion,
        prefersReducedData: deviceProfile.prefersReducedData,
        connectionType: effectiveType
      }
    });

    if (hasSavedPreference) {
      // User has made a choice - respect it
      const splineEnabled = savedSplinePref === true || savedSplinePref === 'true';
      setDisableSpline(!splineEnabled);
      console.log('[Init] ✅ Loaded saved Spline preference:', splineEnabled ? 'ENABLED' : 'DISABLED');
    } else {
      // FIXED: Default to ENABLED for ALL devices with WebGL support
      // Only disable for accessibility (reduced motion preference)
      // Quality degradation and memory manager handle device limitations
      const shouldDisableByDefault = deviceProfile.prefersReducedMotion;

      setDisableSpline(shouldDisableByDefault);
      devicePrefs.set('spline_enabled', shouldDisableByDefault ? 'false' : 'true');

      console.log('[Init] 🚀 First visit - Splines', shouldDisableByDefault ? '❌ DISABLED (reduced motion)' : '✅ ENABLED (default)', {
        device: deviceProfile.isMobile ? 'mobile' : 'desktop',
        isHighEnd: deviceProfile.isHighEndDevice,
        reducedMotion: deviceProfile.prefersReducedMotion,
        connectionType: effectiveType,
        note: shouldDisableByDefault ? 'Respecting accessibility preference' : 'Quality will auto-adjust for device'
      });

      // REMOVED: Performance prompt - no longer needed with auto-quality
      // Users can toggle via performance button if they have issues
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
