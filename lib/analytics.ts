/**
 * Vercel Analytics Wrapper for BullMoney
 * 
 * This module provides comprehensive event tracking using Vercel Analytics.
 * It includes both client-side and server-side tracking capabilities.
 * 
 * @see https://vercel.com/docs/analytics/custom-events
 * 
 * Features:
 * - Client-side event tracking with debouncing
 * - Type-safe event tracking with predefined event types
 * - Bot detection to filter out non-human traffic
 * - Development mode logging
 * - Error handling with silent failures
 * 
 * Usage:
 *   import { trackEvent, useAnalytics } from '@/lib/analytics';
 *   
 *   // Direct tracking
 *   trackEvent('signup', { location: 'hero' });
 *   
 *   // Hook usage in components
 *   const { track, trackClick, trackView } = useAnalytics();
 *   track('purchase', { productId: '123', price: 49.99 });
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Predefined event names for type-safety and consistency
 */
export type AnalyticsEventName =
  // User Actions
  | 'signup'
  | 'login'
  | 'logout'
  | 'profile_view'
  | 'profile_edit'
  
  // Modal/UI Events
  | 'modal_open'
  | 'modal_close'
  | 'theme_change'
  | 'menu_toggle'
  
  // E-commerce Events
  | 'product_view'
  | 'add_to_cart'
  | 'purchase'
  | 'checkout_start'
  | 'checkout_complete'
  
  // Content Engagement
  | 'blog_view'
  | 'video_play'
  | 'video_complete'
  | 'share'
  | 'comment'
  | 'like'
  
  // Navigation
  | 'page_view'
  | 'scroll_depth'
  | 'cta_click'
  | 'nav_click'
  | 'external_link'
  
  // Feature Usage
  | 'feature_used'
  | 'search'
  | 'filter_applied'
  | 'download'
  
  // Trading/Finance Specific (BullMoney)
  | 'analysis_view'
  | 'chart_interaction'
  | 'ticker_click'
  | 'live_stream_join'
  | 'affiliate_click'
  | 'affiliate_signup'
  | 'vip_interest'
  | 'spline_interaction'
  
  // Errors & Performance
  | 'error'
  | 'performance_issue'
  
  // Custom (allows any string for flexibility)
  | string;

/**
 * Custom data that can be passed with events
 * Follows Vercel Analytics limitations:
 * - Nested objects are not supported
 * - Allowed values: strings, numbers, booleans, null
 * - Max 255 characters for keys and values
 */
export type AnalyticsEventData = Record<string, string | number | boolean | null>;

/**
 * Configuration options for the analytics module
 */
interface AnalyticsConfig {
  // Enable/disable tracking (useful for dev/staging)
  enabled: boolean;
  // Debounce time in milliseconds
  debounceMs: number;
  // Enable console logging in development
  debugMode: boolean;
  // List of event names that should always be tracked
  alwaysTrack: string[];
}

// ============================================
// CONFIGURATION
// ============================================

const config: AnalyticsConfig = {
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'production',
  debounceMs: 500,
  debugMode: process.env.NODE_ENV === 'development',
  alwaysTrack: [
    'signup',
    'login',
    'purchase',
    'checkout_complete',
    'affiliate_signup',
    'error',
  ],
};

// Debounce tracking map
const trackingDebounce = new Map<string, number>();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if the current user is likely a bot
 */
function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent.toLowerCase();
  return /bot|crawler|spider|scraper|headless|lighthouse|googlebot|bingbot|yandex/i.test(ua);
}

/**
 * Truncate string to max 255 characters (Vercel limit)
 */
function truncateString(str: string): string {
  return str.length > 255 ? str.substring(0, 252) + '...' : str;
}

/**
 * Clean and validate event data
 */
function cleanEventData(data: AnalyticsEventData): AnalyticsEventData {
  const cleaned: AnalyticsEventData = {};
  
  for (const [key, value] of Object.entries(data)) {
    const cleanKey = truncateString(key);
    
    if (value === null || value === undefined) {
      cleaned[cleanKey] = null;
    } else if (typeof value === 'string') {
      cleaned[cleanKey] = truncateString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      cleaned[cleanKey] = value;
    }
    // Skip objects/arrays (not supported by Vercel)
  }
  
  return cleaned;
}

/**
 * Check if event should be debounced
 */
function shouldDebounce(eventKey: string, eventName: string): boolean {
  // Never debounce critical events
  if (config.alwaysTrack.includes(eventName)) return false;
  
  const lastTrack = trackingDebounce.get(eventKey) || 0;
  const now = Date.now();
  
  if (now - lastTrack < config.debounceMs) {
    return true;
  }
  
  trackingDebounce.set(eventKey, now);
  return false;
}

// ============================================
// CLIENT-SIDE TRACKING
// ============================================

/**
 * Track a custom event on the client-side
 * 
 * @param eventName - The name of the event to track
 * @param eventData - Optional custom data to attach to the event
 * 
 * @example
 * ```ts
 * // Simple event
 * trackEvent('signup');
 * 
 * // Event with data
 * trackEvent('purchase', { 
 *   productName: 'Premium Plan',
 *   price: 99.99,
 *   currency: 'USD'
 * });
 * ```
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  eventData?: AnalyticsEventData
): Promise<void> {
  // Skip tracking in SSR
  if (typeof window === 'undefined') return;
  
  // Skip if disabled or bot
  if (!config.enabled && !config.debugMode) return;
  if (isBot()) return;
  
  // Clean event name
  const cleanName = truncateString(eventName);
  
  // Create debounce key
  const debounceKey = `${cleanName}-${JSON.stringify(eventData || {})}`;
  if (shouldDebounce(debounceKey, cleanName)) return;
  
  // Clean event data
  const cleanData = eventData ? cleanEventData({
    ...eventData,
    page: window.location.pathname,
    timestamp: Date.now(),
  }) : {
    page: window.location.pathname,
    timestamp: Date.now(),
  };
  
  // Development logging
  if (config.debugMode) {
    console.log(`[Analytics] ${cleanName}`, cleanData);
  }
  
  // Only send to Vercel in production
  if (config.enabled) {
    try {
      const { track } = await import('@vercel/analytics');
      track(cleanName, cleanData);
    } catch (error) {
      // Silent fail - analytics should never break the app
      if (config.debugMode) {
        console.warn('[Analytics] Failed to track event:', error);
      }
    }
  }
}

/**
 * Track a click event with element context
 */
export function trackClick(
  elementName: string,
  additionalData?: AnalyticsEventData
): void {
  trackEvent('cta_click', {
    element: elementName,
    ...additionalData,
  });
}

/**
 * Track a page or section view
 */
export function trackView(
  viewName: string,
  additionalData?: AnalyticsEventData
): void {
  trackEvent('page_view', {
    view: viewName,
    ...additionalData,
  });
}

/**
 * Track an error event
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  additionalData?: AnalyticsEventData
): void {
  trackEvent('error', {
    type: errorType,
    message: truncateString(errorMessage),
    ...additionalData,
  });
}

// ============================================
// UI STATE TRACKING (Optimized for Modal Tracking)
// ============================================

// Components that should always be tracked (important for conversion)
const TRACKED_UI_COMPONENTS = new Set([
  'affiliateModal',
  'productsModal',
  'servicesModal',
  'adminModal',
  'authModal',
  'analysisModal',
  'liveStreamModal',
  'checkoutModal',
]);

/**
 * Track UI state changes (modal opens/closes)
 * Optimized to only track opens for important components
 */
export function trackUIStateChange(
  component: string,
  action: 'open' | 'close',
  additionalData?: AnalyticsEventData
): void {
  // Only track opens (closes are implied - saves quota)
  if (action === 'close') return;
  
  // Only track important components
  if (!TRACKED_UI_COMPONENTS.has(component)) {
    if (config.debugMode) {
      console.log(`[Analytics] UI: ${component} ${action} (not tracked)`);
    }
    return;
  }
  
  trackEvent('modal_open', {
    modal: component,
    ...additionalData,
  });
}

// ============================================
// SERVER-SIDE TRACKING (for API routes)
// ============================================

/**
 * Track an event from the server-side
 * Use this in API routes and server actions
 * 
 * @example
 * ```ts
 * // In an API route or server action
 * import { trackServerEvent } from '@/lib/analytics';
 * 
 * export async function purchase() {
 *   await trackServerEvent('purchase', {
 *     productId: '123',
 *     amount: 99.99,
 *   });
 * }
 * ```
 */
export async function trackServerEvent(
  eventName: AnalyticsEventName,
  eventData?: AnalyticsEventData
): Promise<void> {
  // Only track in production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics:Server] ${eventName}`, eventData);
    return;
  }
  
  try {
    const { track } = await import('@vercel/analytics/server');
    await track(eventName, eventData ? cleanEventData(eventData) : undefined);
  } catch (error) {
    console.warn('[Analytics:Server] Failed to track event:', error);
  }
}

// ============================================
// PREDEFINED TRACKING HELPERS (BullMoney specific)
// ============================================

export const BullMoneyAnalytics = {
  // User events
  trackSignup: (method: 'email' | 'google' | 'twitter', source?: string) =>
    trackEvent('signup', { method, source: source || 'direct' }),
    
  trackLogin: (method: 'email' | 'google' | 'twitter') =>
    trackEvent('login', { method }),
  
  // Affiliate events  
  trackAffiliateClick: (affiliateCode: string, source: string) =>
    trackEvent('affiliate_click', { code: affiliateCode, source }),
    
  trackAffiliateSignup: (affiliateCode: string) =>
    trackEvent('affiliate_signup', { code: affiliateCode }),
  
  // Trading/Analysis events
  trackAnalysisView: (analysisId: string, ticker?: string) =>
    trackEvent('analysis_view', { id: analysisId, ticker: ticker || null }),
    
  trackTickerClick: (ticker: string, source: string) =>
    trackEvent('ticker_click', { ticker, source }),
    
  trackLiveStreamJoin: (streamId?: string) =>
    trackEvent('live_stream_join', { streamId: streamId || 'main' }),
  
  // Product events
  trackProductView: (productId: string, productName: string) =>
    trackEvent('product_view', { id: productId, name: productName }),
    
  trackPurchase: (productId: string, price: number, currency: string = 'USD') =>
    trackEvent('purchase', { productId, price, currency }),
  
  // Theme events
  trackThemeChange: (themeId: string, themeName: string) =>
    trackEvent('theme_change', { themeId, themeName }),
  
  // 3D/Spline events
  trackSplineInteraction: (sceneName: string, interactionType: string) =>
    trackEvent('spline_interaction', { scene: sceneName, type: interactionType }),
};

export default trackEvent;
