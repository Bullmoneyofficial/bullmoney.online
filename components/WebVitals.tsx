'use client';

/**
 * Web Vitals & Analytics Utilities
 * 
 * IMPORTANT: This file provides utility functions for analytics tracking.
 * The main tracking component is WebVitalsEnhanced.tsx which should be used
 * in the root layout.
 * 
 * ⚠️ VERCEL FREE PLAN LIMITS:
 * - Page views: Unlimited ✓
 * - Custom events: 2,500/month (use sparingly!)
 * - Speed Insights: Included ✓
 * 
 * RECOMMENDATION: Only track important conversions:
 * - signups, purchases, subscriptions, affiliate actions
 * - Don't track every click or scroll
 */

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useCallback } from 'react';

// ============================================
// BOT DETECTION UTILITIES
// ============================================

const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'scraper', 'headless',
  'puppeteer', 'playwright', 'selenium', 'phantomjs',
  'googlebot', 'bingbot', 'yandex', 'baidu', 'duckduckbot',
  'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'lighthouse', 'pagespeed', 'gtmetrix', 'webpagetest',
  'ahrefsbot', 'semrushbot', 'curl', 'wget',
];

/**
 * Comprehensive bot detection
 */
export function isBot(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  const ua = navigator.userAgent.toLowerCase();
  
  if (BOT_PATTERNS.some(pattern => ua.includes(pattern))) {
    return true;
  }

  if ((navigator as any).webdriver || (window as any).__nightmare) {
    return true;
  }

  return false;
}

/**
 * Get bot type for analytics
 */
export function getBotInfo(): { isBot: boolean; botType: string | null } {
  if (typeof window === 'undefined') {
    return { isBot: true, botType: 'ssr' };
  }

  const ua = navigator.userAgent.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'search': ['googlebot', 'bingbot', 'yandex', 'baidu', 'duckduckbot'],
    'social': ['facebookexternalhit', 'twitterbot', 'linkedinbot', 'discord'],
    'seo': ['ahrefsbot', 'semrushbot', 'mj12bot'],
    'perf': ['lighthouse', 'pagespeed', 'gtmetrix', 'webpagetest'],
    'auto': ['puppeteer', 'playwright', 'selenium', 'headless'],
  };

  for (const [type, patterns] of Object.entries(categories)) {
    if (patterns.some(p => ua.includes(p))) {
      return { isBot: true, botType: type };
    }
  }

  if ((navigator as any).webdriver) {
    return { isBot: true, botType: 'auto' };
  }

  return { isBot: false, botType: null };
}

// ============================================
// DEVICE DETECTION
// ============================================

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  connection: string | null;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { type: 'desktop', os: 'unknown', browser: 'unknown', connection: null };
  }

  const ua = navigator.userAgent;
  const conn = (navigator as any).connection;
  
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  
  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge/i.test(ua)) browser = 'Edge';

  return {
    type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    os,
    browser,
    connection: conn?.effectiveType || null,
  };
}

// ============================================
// QUOTA-AWARE EVENT TRACKING
// ============================================

// Track monthly usage locally to warn about quota
let monthlyEventCount = 0;
const MONTHLY_QUOTA = 2500;
const QUOTA_WARNING_THRESHOLD = 2000;

function checkQuota(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Get stored count
  const stored = localStorage.getItem('bm_analytics_count');
  const storedMonth = localStorage.getItem('bm_analytics_month');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  if (storedMonth !== currentMonth) {
    // New month, reset counter
    monthlyEventCount = 0;
    localStorage.setItem('bm_analytics_month', currentMonth);
    localStorage.setItem('bm_analytics_count', '0');
  } else if (stored) {
    monthlyEventCount = parseInt(stored, 10);
  }
  
  if (monthlyEventCount >= MONTHLY_QUOTA) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Monthly quota reached! Events will not be tracked.');
    }
    return false;
  }
  
  if (monthlyEventCount >= QUOTA_WARNING_THRESHOLD && process.env.NODE_ENV === 'development') {
    console.warn(`[Analytics] Warning: ${monthlyEventCount}/${MONTHLY_QUOTA} events used this month`);
  }
  
  return true;
}

function incrementQuota(): void {
  if (typeof window === 'undefined') return;
  monthlyEventCount++;
  localStorage.setItem('bm_analytics_count', monthlyEventCount.toString());
}

/**
 * Track custom event to Vercel Analytics
 * 
 * ⚠️ Uses quota - only use for important events!
 */
export function trackEvent(
  eventName: string, 
  properties?: Record<string, string | number | boolean | null>
): void {
  if (isBot()) return;
  if (!checkQuota()) return;

  try {
    import('@vercel/analytics').then(({ track }) => {
      track(eventName, properties as any);
      incrementQuota();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] Event: ${eventName}`, properties);
      }
    }).catch(() => {});
  } catch {}
}

/**
 * Track page-specific events
 */
export function trackPageEvent(
  eventName: string,
  pagePath: string,
  additionalProps?: Record<string, string | number | boolean | null>
): void {
  const device = getDeviceInfo();
  trackEvent(eventName, {
    page: pagePath,
    device: device.type,
    ...additionalProps,
  });
}

/**
 * Track UI component interactions (quota-aware)
 * Only use for important modals
 */
export function trackUIInteraction(
  componentName: string,
  action: 'open' | 'close' | 'interact',
  additionalProps?: Record<string, string | number | boolean | null>
): void {
  // Only track opens to save quota
  if (action !== 'open') return;
  
  trackEvent('ui_open', {
    component: componentName,
    page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    ...additionalProps,
  });
}

/**
 * Track conversion events (these are worth the quota!)
 */
export function trackConversion(
  type: string,
  value?: number,
  currency?: string,
  additionalProps?: Record<string, string | number | boolean | null>
): void {
  trackEvent('conversion', {
    type,
    value: value ?? null,
    currency: currency ?? 'USD',
    ...additionalProps,
  });
}

/**
 * Track errors (use sparingly)
 */
export function trackError(
  errorType: string,
  errorMessage: string
): void {
  // Only track critical errors to save quota
  if (!errorMessage.includes('critical') && !errorMessage.includes('fatal')) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Analytics] Error (not tracked): ${errorType}`, errorMessage);
    }
    return;
  }
  
  trackEvent('error', {
    type: errorType,
    message: errorMessage.slice(0, 200),
  });
}

// ============================================
// LEGACY WEB VITALS COMPONENT
// ============================================

/**
 * @deprecated Use WebVitalsEnhanced instead
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (isBot()) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}`);
    }
    // Note: Vercel SpeedInsights handles Web Vitals automatically
  });

  return null;
}

export default WebVitals;
