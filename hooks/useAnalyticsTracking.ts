'use client';

/**
 * Analytics Tracking Hooks - OPTIMIZED FOR VERCEL FREE PLAN
 * 
 * ⚠️ IMPORTANT: Vercel Free Plan limits:
 * - Page views: Unlimited ✓
 * - Custom events: 2,500/month
 * 
 * These hooks are designed to be quota-conscious.
 * Only use for IMPORTANT conversions and business metrics.
 * 
 * RECOMMENDED TO TRACK:
 * ✓ Signups / Registrations
 * ✓ Purchases / Transactions
 * ✓ Affiliate conversions
 * ✓ Important modal opens (products, services)
 * 
 * NOT RECOMMENDED (uses quota):
 * ✗ Every click
 * ✗ Every scroll milestone
 * ✗ Form field interactions
 * ✗ Video progress (unless critical)
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  trackEvent, 
  trackConversion, 
  isBot,
  getDeviceInfo,
  DeviceInfo
} from '@/components/WebVitals';

// ============================================
// CONVERSION TRACKING (Important - worth quota)
// ============================================

/**
 * Track signup funnel
 * Use for registration/signup flows
 */
export function useSignupTracking() {
  const trackSignupStart = useCallback(() => {
    trackEvent('signup_start', {
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });
  }, []);

  const trackSignupComplete = useCallback((method?: string) => {
    trackConversion('signup', undefined, undefined, {
      method: method || 'email',
    });
  }, []);

  return { trackSignupStart, trackSignupComplete };
}

/**
 * Track purchase funnel
 * Use for e-commerce conversions
 */
export function usePurchaseTracking() {
  const trackCheckoutStart = useCallback((cartValue: number, itemCount: number) => {
    trackEvent('checkout_start', {
      value: cartValue,
      items: itemCount,
    });
  }, []);

  const trackPurchaseComplete = useCallback((
    orderId: string,
    totalValue: number,
    currency?: string
  ) => {
    trackConversion('purchase', totalValue, currency, {
      order_id: orderId,
    });
  }, []);

  return { trackCheckoutStart, trackPurchaseComplete };
}

/**
 * Track affiliate conversions
 * Use for affiliate program tracking
 */
export function useAffiliateTracking() {
  const trackAffiliateClick = useCallback((affiliateId: string, source?: string) => {
    trackEvent('affiliate_click', {
      affiliate_id: affiliateId,
      source: source || 'direct',
    });
  }, []);

  const trackAffiliateSignup = useCallback((affiliateId: string, referralCode?: string) => {
    trackConversion('affiliate', undefined, undefined, {
      affiliate_id: affiliateId,
      referral_code: referralCode || null,
    });
  }, []);

  return { trackAffiliateClick, trackAffiliateSignup };
}

// ============================================
// MODAL TRACKING (Use sparingly)
// ============================================

/**
 * Track important modal interactions
 * Only tracks OPENS to save quota (closes are implied)
 */
export function useModalTracking(modalName: string, isImportant: boolean = false) {
  const trackOpen = useCallback(() => {
    // Only track if marked as important
    if (!isImportant) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Modal] ${modalName} opened (not tracked - set isImportant=true to track)`);
      }
      return;
    }
    
    trackEvent('modal_open', {
      modal: modalName,
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });
  }, [modalName, isImportant]);

  // Don't track closes to save quota
  const trackClose = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Modal] ${modalName} closed (not tracked to save quota)`);
    }
  }, [modalName]);

  return { trackOpen, trackClose };
}

// ============================================
// TIME ON PAGE (Free - doesn't use custom events)
// ============================================

/**
 * Measure time on page (for internal use, doesn't send events)
 * Vercel Analytics tracks this automatically via page views
 */
export function useTimeOnPage() {
  const startTime = useRef<number | null>(null);
  const timeSpent = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || isBot()) return;
    startTime.current = Date.now();

    return () => {
      if (startTime.current) {
        timeSpent.current = Date.now() - startTime.current;
        // Don't send event - just for internal measurement
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Time] Page time: ${Math.round(timeSpent.current / 1000)}s`);
        }
      }
    };
  }, []);

  return { getTimeSpent: () => timeSpent.current };
}

// ============================================
// ERROR TRACKING (Critical errors only)
// ============================================

/**
 * Track critical errors
 * Only tracks errors marked as critical to save quota
 */
export function useCriticalErrorTracking() {
  const trackCriticalError = useCallback((errorMessage: string, errorType?: string) => {
    trackEvent('critical_error', {
      type: errorType || 'runtime',
      message: errorMessage.slice(0, 200),
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    });
  }, []);

  return { trackCriticalError };
}

// ============================================
// CLICK TRACKING (Local only - no quota used)
// ============================================

/**
 * Track clicks locally for debugging (doesn't use quota)
 */
export function useClickTracking() {
  const trackClick = useCallback((
    elementName: string,
    elementType: string,
  ) => {
    // Only log in development, don't send to analytics
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Click] ${elementType}: ${elementName}`);
    }
  }, []);

  return { trackClick };
}

// ============================================
// SEARCH TRACKING (Important for UX insights)
// ============================================

/**
 * Track search queries (use if search is important feature)
 */
export function useSearchTracking() {
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    // Only track if no results (helps identify content gaps)
    if (resultsCount === 0) {
      trackEvent('search_no_results', {
        query: query.slice(0, 50),
      });
    }
  }, []);

  return { trackSearch };
}

// ============================================
// UTILITY EXPORTS
// ============================================

export {
  trackEvent,
  trackConversion,
  isBot,
  getDeviceInfo,
};

export type { DeviceInfo };

// ============================================
// QUOTA HELPER
// ============================================

/**
 * Get current monthly quota usage estimate
 */
export function getQuotaUsage(): { used: number; remaining: number; percentage: number } {
  if (typeof window === 'undefined') {
    return { used: 0, remaining: 2500, percentage: 0 };
  }
  
  const stored = localStorage.getItem('bm_analytics_count');
  const used = stored ? parseInt(stored, 10) : 0;
  const remaining = Math.max(0, 2500 - used);
  const percentage = Math.round((used / 2500) * 100);
  
  return { used, remaining, percentage };
}
