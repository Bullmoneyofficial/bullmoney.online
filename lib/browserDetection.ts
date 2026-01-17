"use client";

/**
 * Browser Detection Utility
 * 
 * UPDATED 2026.1.17: ALL FEATURES ENABLED FOR ALL DEVICES
 * - All in-app browsers (Instagram, TikTok, Facebook, etc.) now get FULL experience
 * - All Android devices get FULL experience  
 * - All desktop browsers get FULL experience
 * - All iOS/Apple devices get FULL experience
 * - No restrictions based on device memory or browser type
 * 
 * The detection is still performed for analytics/logging purposes,
 * but NO FEATURES ARE DISABLED based on detection results.
 * 
 * @version 2026.1.17 - Universal Full Experience
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
  // ALL CAPABILITIES ENABLED - No restrictions for any device or browser
  // ============================================================================
  
  // Always report as NOT in-app browser (so nothing gets disabled)
  const isInAppBrowser = false;
  
  // Memory flags (for analytics only, no restrictions)
  const isVeryLowMemoryDevice = deviceMemory < 2;
  const isLowMemoryDevice = deviceMemory < 4;
  
  // ALL FEATURES ENABLED for all devices
  const canHandleWebGL = true;
  const canHandle3D = true;
  const canHandleWebSocket = true;
  const canHandleAudio = true;
  
  // Only respect user's system preference for reduced motion
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const shouldReduceAnimations = prefersReducedMotion;
  
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
    isInAppBrowser,           // Always false - no restrictions
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
    isLowMemoryDevice,        // For analytics only
    isVeryLowMemoryDevice,    // For analytics only
    canHandle3D: true,        // ALWAYS TRUE
    canHandleWebGL: true,     // ALWAYS TRUE
    canHandleWebSocket: true, // ALWAYS TRUE
    canHandleAudio: true,     // ALWAYS TRUE
    shouldReduceAnimations,   // Only respects user preference
    browserName,
    deviceMemory,
    hardwareConcurrency,
    // Device flags (analytics only)
    isAppleDevice,
    isMac,
    isIOS,
    isAndroid,
    hasApplePremiumExperience: true, // Everyone gets premium
  };
  
  // Log detection for debugging
  if (isInAppBrowserRaw) {
    console.log(`[BrowserDetection] In-app browser detected: ${browserName}`);
    console.log(`[BrowserDetection] ALL FEATURES ENABLED - No restrictions applied`);
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
