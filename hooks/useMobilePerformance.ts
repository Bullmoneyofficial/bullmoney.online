/**
 * useMobilePerformance Hook
 * 
 * Unified mobile performance optimization hook that provides:
 * - Device detection (mobile/tablet/desktop)
 * - Performance-aware animation variants for framer-motion
 * - CSS class utilities for conditional styling
 * - Reduced motion preferences
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TargetAndTransition, Transition } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

export interface MobilePerformanceProfile {
  // Device type
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Touch/interaction
  isTouch: boolean;
  
  // Performance indicators
  isLowEnd: boolean;
  isHighEnd: boolean;
  prefersReducedMotion: boolean;
  
  // Connection
  isSlowConnection: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  
  // Hardware
  deviceMemory: number;
  hardwareConcurrency: number;
  
  // Browser/OS
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isInAppBrowser: boolean;
  
  // Performance tier for easy decision making
  performanceTier: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
}

// Animation variant type that's compatible with framer-motion
export interface AnimationVariant {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit?: TargetAndTransition;
  transition: Transition;
}

export interface MobileAnimationVariants {
  // Modal animations
  modalBackdrop: AnimationVariant;
  modalContent: AnimationVariant;
  // Fade in animations  
  fadeIn: AnimationVariant;
  // Scale animations
  scaleIn: AnimationVariant;
  // Slide animations
  slideUp: AnimationVariant;
  // List item animations
  listItem: AnimationVariant;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const IN_APP_BROWSER_REGEX = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i;
const MOBILE_UA_REGEX = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;

// ============================================================================
// DEFAULT PROFILE (SSR-safe)
// ============================================================================

const DEFAULT_PROFILE: MobilePerformanceProfile = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouch: false,
  isLowEnd: false,
  isHighEnd: true,
  prefersReducedMotion: false,
  isSlowConnection: false,
  connectionType: 'unknown',
  deviceMemory: 8,
  hardwareConcurrency: 4,
  isIOS: false,
  isAndroid: false,
  isSafari: false,
  isInAppBrowser: false,
  performanceTier: 'high',
};

// ============================================================================
// ANIMATION VARIANTS - Desktop (full quality)
// ============================================================================

const DESKTOP_ANIMATIONS: MobileAnimationVariants = {
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { type: 'spring', duration: 0.4, bounce: 0.2 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', duration: 0.4, bounce: 0.15 },
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 },
    transition: { type: 'spring', duration: 0.4, bounce: 0.1 },
  },
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.25 },
  },
};

// ============================================================================
// ANIMATION VARIANTS - Mobile (optimized for 60fps)
// ============================================================================

const MOBILE_ANIMATIONS: MobileAnimationVariants = {
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }, // Faster
  },
  modalContent: {
    initial: { opacity: 0, y: 20 }, // No scale - saves compositing
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }, // Smaller exit movement
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }, // No spring - linear is faster
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15 },
  },
  scaleIn: {
    initial: { opacity: 0 }, // Skip scale on mobile
    animate: { opacity: 1 },
    transition: { duration: 0.15 },
  },
  slideUp: {
    initial: { opacity: 0, y: 15 }, // Smaller movement
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  listItem: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.1 },
  },
};

// ============================================================================
// ANIMATION VARIANTS - Low-end mobile (minimal animations)
// ============================================================================

const LOW_END_ANIMATIONS: MobileAnimationVariants = {
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 },
  },
  modalContent: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.1 },
  },
  scaleIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.1 },
  },
  slideUp: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 },
  },
  listItem: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.05 },
  },
};

// ============================================================================
// ANIMATION VARIANTS - Reduced motion (instant)
// ============================================================================

const NO_ANIMATIONS: MobileAnimationVariants = {
  modalBackdrop: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  },
  modalContent: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  },
  fadeIn: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    transition: { duration: 0 },
  },
  scaleIn: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    transition: { duration: 0 },
  },
  slideUp: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  },
  listItem: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    transition: { duration: 0 },
  },
};

// ============================================================================
// PROFILE BUILDER
// ============================================================================

function buildProfile(): MobilePerformanceProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_PROFILE;
  }

  const ua = navigator.userAgent || '';
  const width = window.innerWidth;
  
  // Connection info
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  const effectiveType = connection?.effectiveType || '4g';
  const saveData = connection?.saveData === true;
  
  // Hardware info
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  
  // Touch detection
  const isTouch = 'ontouchstart' in window || 
                  navigator.maxTouchPoints > 0 ||
                  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  
  // Device type detection
  const isMobileUA = MOBILE_UA_REGEX.test(ua);
  const isMobile = isTouch && (width < 768 || isMobileUA);
  const isTablet = isTouch && width >= 768 && width < 1024;
  const isDesktop = !isMobile && !isTablet;
  
  // OS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isInAppBrowser = IN_APP_BROWSER_REGEX.test(ua);
  
  // Reduced motion preference
  const prefersReducedMotion = window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Connection quality
  const isSlowConnection = saveData || ['slow-2g', '2g', '3g'].includes(effectiveType);
  const connectionType = (['slow-2g', '2g', '3g', '4g'].includes(effectiveType) 
    ? effectiveType 
    : (connection?.type === 'wifi' ? 'wifi' : 'unknown')) as MobilePerformanceProfile['connectionType'];
  
  // UPDATED 2026.1: Detect mainstream mobile browsers for premium experience
  const isSafariMobile = isSafari && (isIOS || isMobile);
  const isChromeMobile = /chrome/i.test(ua) && isMobile && !isInAppBrowser;
  const isPremiumMobileBrowser = isSafariMobile || isChromeMobile || (isInAppBrowser && /instagram/i.test(ua));

  // Performance classification - UPDATED: Don't mark premium mobile browsers as low-end
  const isLowEnd = (
    memory <= 2 ||
    cores <= 2 ||
    isSlowConnection ||
    (isInAppBrowser && !isPremiumMobileBrowser) ||
    (isIOS && memory <= 3 && !isPremiumMobileBrowser)
  );
  
  const isHighEnd = (
    !isMobile && 
    memory >= 8 && 
    cores >= 4 && 
    !isSlowConnection
  );
  
  // Performance tier calculation
  let performanceTier: MobilePerformanceProfile['performanceTier'];
  
  if (prefersReducedMotion) {
    performanceTier = 'minimal';
  } else if (isLowEnd || (isMobile && isInAppBrowser && !isPremiumMobileBrowser)) {
    performanceTier = 'low';
  } else if (isMobile) {
    // Mobile devices: check memory and connection
    if (memory >= 4 && !isSlowConnection) {
      performanceTier = 'medium';
    } else {
      performanceTier = 'low';
    }
  } else if (isTablet) {
    performanceTier = memory >= 4 ? 'medium' : 'low';
  } else if (isHighEnd) {
    performanceTier = cores >= 8 && memory >= 16 ? 'ultra' : 'high';
  } else {
    performanceTier = 'high';
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isLowEnd,
    isHighEnd,
    prefersReducedMotion,
    isSlowConnection,
    connectionType,
    deviceMemory: memory,
    hardwareConcurrency: cores,
    isIOS,
    isAndroid,
    isSafari,
    isInAppBrowser,
    performanceTier,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useMobilePerformance() {
  const [profile, setProfile] = useState<MobilePerformanceProfile>(DEFAULT_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Build profile on client
    const newProfile = buildProfile();
    setProfile(newProfile);
    setIsHydrated(true);
    
    // Add mobile class to HTML for CSS optimizations
    const html = document.documentElement;
    
    if (newProfile.isMobile) {
      html.classList.add('is-mobile');
      html.classList.remove('is-desktop', 'is-tablet');
    } else if (newProfile.isTablet) {
      html.classList.add('is-tablet');
      html.classList.remove('is-mobile', 'is-desktop');
    } else {
      html.classList.add('is-desktop');
      html.classList.remove('is-mobile', 'is-tablet');
    }
    
    if (newProfile.isLowEnd) {
      html.classList.add('is-low-end');
    } else {
      html.classList.remove('is-low-end');
    }
    
    if (newProfile.isIOS) {
      html.classList.add('is-ios');
    }
    
    if (newProfile.isInAppBrowser) {
      html.classList.add('is-in-app-browser');
    }
    
    // Performance tier class
    html.dataset.performanceTier = newProfile.performanceTier;
    
    // Handle resize
    const handleResize = () => {
      const updated = buildProfile();
      setProfile(updated);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Memoized animation variants based on performance tier
  const animations = useMemo((): MobileAnimationVariants => {
    switch (profile.performanceTier) {
      case 'minimal':
        return NO_ANIMATIONS;
      case 'low':
        return LOW_END_ANIMATIONS;
      case 'medium':
        return MOBILE_ANIMATIONS;
      case 'high':
      case 'ultra':
      default:
        return profile.isMobile ? MOBILE_ANIMATIONS : DESKTOP_ANIMATIONS;
    }
  }, [profile.performanceTier, profile.isMobile]);

  // Utility to get conditional class names
  const getPerformanceClass = useCallback((
    mobileClass: string,
    desktopClass: string = '',
    lowEndClass: string = ''
  ): string => {
    if (profile.isLowEnd && lowEndClass) return lowEndClass;
    if (profile.isMobile || profile.isTablet) return mobileClass;
    return desktopClass;
  }, [profile.isMobile, profile.isTablet, profile.isLowEnd]);

  // Check if should skip heavy effects
  const shouldSkipHeavyEffects = useMemo(() => {
    return profile.isLowEnd || 
           profile.prefersReducedMotion || 
           profile.isSlowConnection ||
           profile.isInAppBrowser;
  }, [profile.isLowEnd, profile.prefersReducedMotion, profile.isSlowConnection, profile.isInAppBrowser]);

  // Check if should use simple animations
  const shouldUseSimpleAnimations = useMemo(() => {
    return profile.isMobile || 
           profile.isTablet || 
           profile.performanceTier === 'low' ||
           profile.performanceTier === 'medium';
  }, [profile.isMobile, profile.isTablet, profile.performanceTier]);

  // Get optimized transition duration
  const getTransitionDuration = useCallback((baseDuration: number = 0.3): number => {
    switch (profile.performanceTier) {
      case 'minimal': return 0;
      case 'low': return baseDuration * 0.3;
      case 'medium': return baseDuration * 0.6;
      case 'high': return baseDuration * 0.8;
      case 'ultra': return baseDuration;
      default: return baseDuration;
    }
  }, [profile.performanceTier]);

  return {
    // Profile data
    ...profile,
    isHydrated,
    
    // Animation variants
    animations,
    
    // Utility functions
    getPerformanceClass,
    shouldSkipHeavyEffects,
    shouldUseSimpleAnimations,
    getTransitionDuration,
    
    // Quick checks
    shouldDisableBackdropBlur: profile.isMobile || profile.isSafari || profile.isLowEnd,
    shouldDisableBoxShadows: profile.isLowEnd,
    shouldDisableTransforms: profile.performanceTier === 'minimal',
    shouldUseNativeScroll: profile.isIOS,
  };
}

// ============================================================================
// SIMPLE HOOK FOR BASIC MOBILE DETECTION
// ============================================================================

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const ua = navigator.userAgent || '';
      const isMobileUA = MOBILE_UA_REGEX.test(ua);
      setIsMobile(isTouch && (window.innerWidth < 768 || isMobileUA));
    };
    
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
}

// ============================================================================
// EXPORT ANIMATION VARIANTS FOR DIRECT USE
// ============================================================================

export { 
  DESKTOP_ANIMATIONS, 
  MOBILE_ANIMATIONS, 
  LOW_END_ANIMATIONS, 
  NO_ANIMATIONS 
};
