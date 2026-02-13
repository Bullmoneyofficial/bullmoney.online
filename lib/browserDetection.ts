"use client";

/**
 * Browser Detection Utility
 *
 * UPDATED 2026.2.9: Real in-app detection enabled
 * - In-app browsers and low-memory devices reduce heavy features
 * - Desktop/high-end devices keep full experience
 */

export interface BrowserInfo {
  isInAppBrowser: boolean;
  isInstagram: boolean;
  isTikTok: boolean;
  isFacebook: boolean;
  isTwitter: boolean;
  isLinkedIn: boolean;
  isSnapchat: boolean;
  isSafariWebView: boolean;
  isWeChat: boolean;
  isLine: boolean;
  isMobileSafari: boolean;
  isMobileChrome: boolean;
  isLowMemoryDevice: boolean;
  isVeryLowMemoryDevice: boolean;
  canHandle3D: boolean;
  canHandleWebGL: boolean;
  canHandleWebSocket: boolean;
  canHandleAudio: boolean;
  shouldReduceAnimations: boolean;
  browserName: string;
  deviceMemory: number;
  hardwareConcurrency: number;
  // Device flags (for analytics only, no restrictions)
  isAppleDevice: boolean;
  isMac: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasApplePremiumExperience: boolean;
  // Enhanced device capabilities for Spline optimization
  isUltraLowMemoryDevice: boolean; // < 1GB or heavily constrained
  isSmallViewport: boolean; // < 400px width
  isTinyViewport: boolean; // < 320px width
  gpuTier: 'high' | 'medium' | 'low' | 'minimal';
  recommendedSplineQuality: 'high' | 'medium' | 'low' | 'disabled';
  shouldDisableSpline: boolean; // Emergency flag for problematic devices
}

// Cache the result to avoid repeated detection
let cachedInfo: BrowserInfo | null = null;

/**
 * Detect browser info for analytics - ALL FEATURES ENABLED FOR ALL DEVICES
 */
export function detectBrowser(): BrowserInfo {
  // Return cached result if available
  if (cachedInfo !== null) {
    return cachedInfo;
  }

  // SSR safety
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return getDefaultInfo();
  }

  const ua = navigator.userAgent.toLowerCase();
  const standalone = (window.navigator as any).standalone;
  
  // Device capabilities (for analytics only)
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  // ============================================================================
  // DEVICE DETECTION - For analytics only, NO RESTRICTIONS APPLIED
  // ============================================================================
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua);
  const isAppleDevice = isIOS || isMac;
  const isAndroid = /android/.test(ua);
  
  // All devices get premium experience - no restrictions
  const hasApplePremiumExperience = true; // Everyone gets premium now
  
  // In-app browser detection (for analytics only)
  const isInstagram = ua.includes('instagram') || ua.includes('ig_');
  const isTikTok = ua.includes('tiktok') || ua.includes('bytedance') || ua.includes('musical_ly');
  const isFacebook = ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab');
  const isTwitter = ua.includes('twitter');
  const isLinkedIn = ua.includes('linkedin');
  const isSnapchat = ua.includes('snapchat');
  const isWeChat = ua.includes('micromessenger') || ua.includes('wechat');
  const isLine = ua.includes('line/');
  
  // Safari WebView detection
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
  const isSafariWebView = isIOS && !isSafari && !standalone && !ua.includes('crios');
  
  // Mobile browser detection
  const isMobileSafari = isIOS && isSafari && !standalone;
  const isMobileChrome = isAndroid && /chrome/.test(ua);
  
  // For analytics: Track if it's an in-app browser (but don't restrict anything)
  const isInAppBrowserRaw = 
    isInstagram || isTikTok || isFacebook || isTwitter || 
    isLinkedIn || isSnapchat || isWeChat || isLine || isSafariWebView;
  
  // ============================================================================
  // CAPABILITIES - Reduce heavy features for in-app/low-memory devices
  // ============================================================================

  // Real in-app browser flag
  const isInAppBrowser = isInAppBrowserRaw;
  
  // Memory flags (for analytics only, no restrictions)
  const isVeryLowMemoryDevice = deviceMemory < 2;
  const isLowMemoryDevice = deviceMemory < 4;
  
  // Enhanced device capability detection for Spline optimization
  const isUltraLowMemoryDevice = deviceMemory < 1 || hardwareConcurrency < 2;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isSmallViewport = viewportWidth < 400;
  const isTinyViewport = viewportWidth < 320;
  
  // GPU tier detection based on device characteristics
  let gpuTier: 'high' | 'medium' | 'low' | 'minimal' = 'medium';
  
  if (isAppleDevice) {
    // Apple devices generally have good GPU performance
    if (isMac) {
      gpuTier = deviceMemory >= 8 ? 'high' : 'medium';
    } else if (isIOS) {
      // iOS devices: iPhone 12+ and iPad Air 4+ have good 3D performance
      const isModernIOS = /iphone.*os (1[4-9]|[2-9][0-9])/.test(ua) || /ipad.*os (1[4-9]|[2-9][0-9])/.test(ua);
      gpuTier = isModernIOS && !isSmallViewport ? 'medium' : 'low';
    }
  } else if (isAndroid) {
    // Android GPU performance varies widely
    if (deviceMemory >= 6 && hardwareConcurrency >= 8) {
      gpuTier = 'high';
    } else if (deviceMemory >= 4 && hardwareConcurrency >= 4) {
      gpuTier = 'medium';
    } else if (deviceMemory >= 2) {
      gpuTier = 'low';
    } else {
      gpuTier = 'minimal';
    }
  } else {
    // Desktop devices
    if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
      gpuTier = 'high';
    } else if (deviceMemory >= 4) {
      gpuTier = 'medium';
    } else {
      gpuTier = 'low';
    }
  }
  
  // Recommended Spline quality based on device capabilities
  let recommendedSplineQuality: 'high' | 'medium' | 'low' | 'disabled' = 'medium';
  let shouldDisableSpline = false;
  
  // Quality tiers based on device capability - ALWAYS render, just lower quality
  // In-app browsers (Discord, Instagram, etc.) and iOS Safari MUST still render Spline
  if (gpuTier === 'minimal' || isUltraLowMemoryDevice || isTinyViewport) {
    recommendedSplineQuality = 'low';
    // NEVER disable Spline — always render at lower quality instead
    shouldDisableSpline = false;
  } else if (isInAppBrowser || gpuTier === 'low' || isVeryLowMemoryDevice || isSmallViewport) {
    recommendedSplineQuality = 'low';
  } else if (gpuTier === 'medium' || isLowMemoryDevice) {
    recommendedSplineQuality = 'medium';
  } else {
    recommendedSplineQuality = 'high';
  }

  // ALWAYS allow 3D and WebGL — in-app browsers (Discord, Instagram, Safari) can handle Spline
  // Quality reduction is handled by recommendedSplineQuality, not by blocking rendering
  const canHandleWebGL = true;
  const canHandle3D = true;
  const canHandleWebSocket = true;
  const canHandleAudio = true;

  // Reduce animations in in-app browsers or low-memory devices
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const shouldReduceAnimations = prefersReducedMotion || isInAppBrowser || isLowMemoryDevice;
  
  // Determine browser name for logging
  let browserName = 'Unknown';
  if (isInstagram) browserName = 'Instagram';
  else if (isTikTok) browserName = 'TikTok';
  else if (isFacebook) browserName = 'Facebook';
  else if (isTwitter) browserName = 'Twitter/X';
  else if (isLinkedIn) browserName = 'LinkedIn';
  else if (isSnapchat) browserName = 'Snapchat';
  else if (isWeChat) browserName = 'WeChat';
  else if (isLine) browserName = 'Line';
  else if (isSafariWebView) browserName = 'Safari WebView';
  else if (isMobileSafari) browserName = 'Mobile Safari';
  else if (isMobileChrome) browserName = 'Mobile Chrome';
  else if (/chrome/.test(ua)) browserName = 'Chrome';
  else if (/firefox/.test(ua)) browserName = 'Firefox';
  else if (/edge/.test(ua)) browserName = 'Edge';
  else if (/samsung/.test(ua)) browserName = 'Samsung Browser';
  else if (/opera|opr/.test(ua)) browserName = 'Opera';
  else if (/safari/.test(ua)) browserName = 'Safari';
  
  cachedInfo = {
    isInAppBrowser,
    isInstagram,              // Detection for analytics
    isTikTok,
    isFacebook,
    isTwitter,
    isLinkedIn,
    isSnapchat,
    isSafariWebView,
    isWeChat,
    isLine,
    isMobileSafari,
    isMobileChrome,
    isLowMemoryDevice,
    isVeryLowMemoryDevice,
    canHandle3D,
    canHandleWebGL,
    canHandleWebSocket,
    canHandleAudio,
    shouldReduceAnimations,
    browserName,
    deviceMemory,
    hardwareConcurrency,
    // Device flags (analytics only)
    isAppleDevice,
    isMac,
    isIOS,
    isAndroid,
    hasApplePremiumExperience: true, // Everyone gets premium
    // Enhanced device capabilities
    isUltraLowMemoryDevice,
    isSmallViewport,
    isTinyViewport,
    gpuTier,
    recommendedSplineQuality,
    shouldDisableSpline,
  };
  
  // Log detection for debugging
  if (isInAppBrowserRaw) {
    console.log(`[BrowserDetection] In-app browser detected: ${browserName}`);
  }
  
  return cachedInfo;
}

function getDefaultInfo(): BrowserInfo {
  return {
    isInAppBrowser: false,
    isInstagram: false,
    isTikTok: false,
    isFacebook: false,
    isTwitter: false,
    isLinkedIn: false,
    isSnapchat: false,
    isSafariWebView: false,
    isWeChat: false,
    isLine: false,
    isMobileSafari: false,
    isMobileChrome: false,
    isLowMemoryDevice: false,
    isVeryLowMemoryDevice: false,
    canHandle3D: true,       // ALWAYS TRUE
    canHandleWebGL: true,    // ALWAYS TRUE
    canHandleWebSocket: true,// ALWAYS TRUE
    canHandleAudio: true,    // ALWAYS TRUE
    shouldReduceAnimations: false,
    browserName: 'Unknown',
    deviceMemory: 4,
    hardwareConcurrency: 4,
    // Device flags
    isAppleDevice: false,
    isMac: false,
    isIOS: false,
    isAndroid: false,
    hasApplePremiumExperience: true, // Everyone gets premium
    // Enhanced device capabilities (safe defaults)
    isUltraLowMemoryDevice: false,
    isSmallViewport: false,
    isTinyViewport: false,
    gpuTier: 'medium',
    recommendedSplineQuality: 'medium',
    shouldDisableSpline: false,
  };
}

/**
 * React hook for browser detection
 */
export function useBrowserDetection(): BrowserInfo {
  // SSR safety - return default on server
  if (typeof window === 'undefined') {
    return getDefaultInfo();
  }
  
  return detectBrowser();
}

/**
 * Clear cached browser info (useful for testing)
 */
export function clearBrowserCache(): void {
  cachedInfo = null;
}

export default detectBrowser;
