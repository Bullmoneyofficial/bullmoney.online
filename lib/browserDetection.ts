"use client";

/**
 * Browser Detection Utility
 * Detects in-app browsers (Instagram, TikTok, Facebook, etc.) that have
 * restricted WebGL/memory capabilities and can crash on heavy 3D content.
 * 
 * SPECIAL EXCEPTIONS (Full site experience enabled):
 * - Instagram: Full features enabled (2026 update)
 * - Apple Devices: All Macs and iPhones get full experience through 2026
 *   (includes Safari, Chrome on Mac/iOS, Safari WebView on iOS)
 * 
 * @version 2026.1.1
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
  // NEW: Apple device flags for premium experience
  isAppleDevice: boolean;
  isMac: boolean;
  isIOS: boolean;
  hasApplePremiumExperience: boolean;
}

// Cache the result to avoid repeated detection
let cachedInfo: BrowserInfo | null = null;

/**
 * Detect if running in an in-app browser or restricted environment
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
  
  // Device capabilities
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const isVeryLowMemoryDevice = deviceMemory < 2;
  const isLowMemoryDevice = deviceMemory < 4;
  
  // ============================================================================
  // APPLE DEVICE DETECTION - Premium experience for all Apple devices through 2026
  // ============================================================================
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua);
  const isAppleDevice = isIOS || isMac;
  
  // Apple devices get premium experience regardless of browser
  // This includes Safari, Chrome on Mac/iOS, and even in-app browsers on Apple devices
  const hasApplePremiumExperience = isAppleDevice;
  
  // In-app browser detection
  const isInstagram = ua.includes('instagram') || ua.includes('ig_');
  const isTikTok = ua.includes('tiktok') || ua.includes('bytedance') || ua.includes('musical_ly');
  const isFacebook = ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab');
  const isTwitter = ua.includes('twitter');
  const isLinkedIn = ua.includes('linkedin');
  const isSnapchat = ua.includes('snapchat');
  const isWeChat = ua.includes('micromessenger') || ua.includes('wechat');
  const isLine = ua.includes('line/');
  
  // Safari WebView detection (iOS apps that use WKWebView)
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
  const isSafariWebView = isIOS && !isSafari && !standalone && !ua.includes('crios');
  
  // Mobile browser detection
  const isMobileSafari = isIOS && isSafari && !standalone;
  const isMobileChrome = /android/.test(ua) && /chrome/.test(ua);
  
  // Combined in-app browser check
  // EXCEPTIONS: Instagram is now enabled, Apple devices get full experience
  const isInAppBrowserRaw = 
    isInstagram ||  // Instagram is detected but won't be restricted
    isTikTok || 
    isFacebook || 
    isTwitter || 
    isLinkedIn || 
    isSnapchat ||
    isWeChat ||
    isLine ||
    isSafariWebView;
  
  // Instagram gets full features, Apple devices get full features
  // Only restrict non-Apple, non-Instagram in-app browsers
  const isInAppBrowser = isInAppBrowserRaw && !isInstagram && !hasApplePremiumExperience;
  
  // Check for WebGL support
  let canHandleWebGL = true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (!gl) {
      canHandleWebGL = false;
    } else {
      // Check for low-tier GPU that might crash
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Very old/weak GPUs
        if (renderer.includes('mali-4') || renderer.includes('adreno 3') || renderer.includes('powervr sgx')) {
          canHandleWebGL = false;
        }
      }
    }
    canvas.remove();
  } catch (e) {
    canHandleWebGL = false;
  }
  
  // Determine capabilities
  // UPDATED 2026: Instagram and Apple devices get FULL capabilities
  // In-app browsers have severe WebGL memory limits - but not on Apple devices or Instagram
  const canHandle3D = canHandleWebGL && (
    hasApplePremiumExperience ||  // Apple devices always can handle 3D
    isInstagram ||                 // Instagram now enabled
    (!isInAppBrowser && !isVeryLowMemoryDevice)
  );
  
  // WebSocket - now enabled for Instagram and Apple devices
  const canHandleWebSocket = (
    hasApplePremiumExperience ||
    isInstagram ||
    (!isTikTok && 'WebSocket' in window)
  );
  
  // Audio context - enabled for Instagram and Apple devices
  const canHandleAudio = (
    hasApplePremiumExperience ||
    isInstagram ||
    (!isInAppBrowser && ('AudioContext' in window || 'webkitAudioContext' in window))
  );
  
  // Reduce animations for performance
  // Apple devices and Instagram get full animations
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const shouldReduceAnimations = 
    prefersReducedMotion || 
    (!hasApplePremiumExperience && !isInstagram && (
      isInAppBrowser || 
      isLowMemoryDevice
    ));
  
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
  else if (/safari/.test(ua)) browserName = 'Safari';
  
  cachedInfo = {
    isInAppBrowser,
    isInstagram,
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
    // Apple device flags
    isAppleDevice,
    isMac,
    isIOS,
    hasApplePremiumExperience,
  };
  
  // Log detection for debugging
  if (isInAppBrowserRaw || hasApplePremiumExperience) {
    console.log(`[BrowserDetection] Browser detected: ${browserName}`);
    console.log(`[BrowserDetection] Apple Device: ${isAppleDevice} (Mac: ${isMac}, iOS: ${isIOS})`);
    console.log(`[BrowserDetection] Instagram: ${isInstagram}`);
    console.log(`[BrowserDetection] Premium Experience Enabled: ${hasApplePremiumExperience || isInstagram}`);
    console.log(`[BrowserDetection] Capabilities:`, {
      canHandle3D,
      canHandleWebGL,
      canHandleWebSocket,
      canHandleAudio,
      shouldReduceAnimations,
      isInAppBrowser,
    });
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
    canHandle3D: true,
    canHandleWebGL: true,
    canHandleWebSocket: true,
    canHandleAudio: true,
    shouldReduceAnimations: false,
    browserName: 'Unknown',
    deviceMemory: 4,
    hardwareConcurrency: 4,
    // Apple device flags - default to false for SSR
    isAppleDevice: false,
    isMac: false,
    isIOS: false,
    hasApplePremiumExperience: false,
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
