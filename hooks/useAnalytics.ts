"use client";

/**
 * Vercel Analytics React Hook for BullMoney
 * 
 * This hook provides memoized tracking functions for use in React components.
 * Import this in client components that need analytics tracking with hooks.
 * 
 * @see https://vercel.com/docs/analytics/custom-events
 * 
 * Usage:
 * ```tsx
 * import { useAnalytics } from '@/hooks/useAnalytics';
 * 
 * function MyComponent() {
 *   const { track, trackClick } = useAnalytics();
 *   
 *   return (
 *     <button onClick={() => trackClick('signup_button', { location: 'hero' })}>
 *       Sign Up
 *     </button>
 *   );
 * }
 * ```
 */

import { useCallback, useRef } from 'react';
import { 
  trackEvent, 
  trackClick, 
  trackView, 
  trackError, 
  trackUIStateChange,
  type AnalyticsEventName,
  type AnalyticsEventData 
} from '@/lib/analytics';

/**
 * React hook for analytics tracking
 * Provides memoized tracking functions for use in components
 */
export function useAnalytics() {
  // Track component mount time for performance metrics
  const mountTime = useRef(Date.now());
  
  const track = useCallback((
    eventName: AnalyticsEventName,
    eventData?: AnalyticsEventData
  ) => {
    trackEvent(eventName, eventData);
  }, []);
  
  const trackClickEvent = useCallback((
    elementName: string,
    additionalData?: AnalyticsEventData
  ) => {
    trackClick(elementName, additionalData);
  }, []);
  
  const trackViewEvent = useCallback((
    viewName: string,
    additionalData?: AnalyticsEventData
  ) => {
    trackView(viewName, additionalData);
  }, []);
  
  const trackErrorEvent = useCallback((
    errorType: string,
    errorMessage: string,
    additionalData?: AnalyticsEventData
  ) => {
    trackError(errorType, errorMessage, additionalData);
  }, []);
  
  const trackUIChange = useCallback((
    component: string,
    action: 'open' | 'close',
    additionalData?: AnalyticsEventData
  ) => {
    trackUIStateChange(component, action, additionalData);
  }, []);
  
  // Track time spent when component unmounts
  const trackTimeSpent = useCallback((componentName: string) => {
    const timeSpent = Math.round((Date.now() - mountTime.current) / 1000);
    if (timeSpent > 5) { // Only track if spent more than 5 seconds
      trackEvent('feature_used', {
        component: componentName,
        timeSpentSeconds: timeSpent,
      });
    }
  }, []);
  
  return {
    track,
    trackClick: trackClickEvent,
    trackView: trackViewEvent,
    trackError: trackErrorEvent,
    trackUI: trackUIChange,
    trackTimeSpent,
  };
}

export default useAnalytics;
