w"use client";

/**
 * Browser Detection Utility
 * Detects in-app browsers (Instagram, TikTok, Facebook, etc.) that have
 * restricted WebGL/memory capabilities and can crash on heavy 3D content.
 * 
 * @version 2026.1.0
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
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
  const isSafariWebView = isIOS && !isSafari && !standalone && !ua.includes('crios');
  
  // Mobile browser detection
  const isMobileSafari = isIOS && isSafari && !standalone;
  const isMobileChrome = /android/.test(ua) && /chrome/.test(ua);
  
  // Combined in-app browser check
  const isInAppBrowser = 
    isInstagram || 
    isTikTok || 
    isFacebook || 
    isTwitter || 
    isLinkedIn || 
    isSnapchat ||
    isWeChat ||
    isLine ||
    isSafariWebView;
  
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
  // In-app browsers have severe WebGL memory limits - disable 3D entirely
  const canHandle3D = canHandleWebGL && !isInAppBrowser && !isVeryLowMemoryDevice;
  
  // WebSocket can fail in some in-app browsers
  const canHandleWebSocket = !isInstagram && !isTikTok && 'WebSocket' in window;
  
  // Audio context is restricted in many in-app browsers
  const canHandleAudio = !isInAppBrowser && ('AudioContext' in window || 'webkitAudioContext' in window);
  
  // Reduce animations for performance
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const shouldReduceAnimations = 
    prefersReducedMotion || 
    isInAppBrowser || 
    isLowMemoryDevice ||
    (isIOS && deviceMemory < 4);
  
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
  };
  
  // Log detection for debugging
  if (isInAppBrowser) {
    console.log(`[BrowserDetection] In-app browser detected: ${browserName}`);
    console.log(`[BrowserDetection] Capabilities:`, {
      canHandle3D,
      canHandleWebGL,
      canHandleWebSocket,
      canHandleAudio,
      shouldReduceAnimations,
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
