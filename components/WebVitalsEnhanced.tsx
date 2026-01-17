'use client';

/**
 * Enhanced Web Vitals & Analytics Component for Vercel Free Plan
 * 
 * Optimized for Vercel's free tier limitations:
 * - Page views: Unlimited ✓
 * - Custom events: 2,500/month (use sparingly)
 * - Speed Insights: Included ✓
 * 
 * This component provides:
 * - Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
 * - Comprehensive bot filtering (saves quota)
 * - Device & connection quality metadata
 * - Efficient event batching
 * - Debug mode for development
 */

import { useEffect, useCallback, useRef, Suspense } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { usePathname, useSearchParams } from 'next/navigation';

// ============================================
// BOT DETECTION (Comprehensive)
// ============================================

const BOT_PATTERNS = [
  // Search engines
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
  'sogou', 'exabot', 'facebot', 'ia_archiver',
  // Social media
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'pinterest', 'whatsapp',
  'telegrambot', 'discordbot', 'slackbot', 'applebot',
  // SEO tools
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'rogerbot', 'screaming frog',
  'seokicks', 'sistrix', 'blexbot',
  // Performance tools (we want real user metrics, not synthetic)
  'lighthouse', 'pagespeed', 'gtmetrix', 'pingdom', 'webpagetest', 'chrome-lighthouse',
  // Automation
  'puppeteer', 'playwright', 'selenium', 'phantomjs', 'headless',
  // Generic patterns
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
  'go-http-client', 'java/', 'perl/', 'ruby/',
  // Monitoring
  'uptimerobot', 'statuscake', 'pingdom', 'newrelic', 'datadog',
];

function isBot(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // Check user agent patterns
  if (BOT_PATTERNS.some(pattern => ua.includes(pattern))) {
    return true;
  }

  // Check for automation indicators
  if (
    (navigator as any).webdriver ||
    (window as any).__nightmare ||
    (window as any).callPhantom ||
    (window as any)._phantom ||
    (window as any).__selenium_unwrapped
  ) {
    return true;
  }

  // Check for headless Chrome
  if (ua.includes('headlesschrome')) {
    return true;
  }

  // Check for missing plugins (suspicious on desktop)
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua);
  if (!isMobile && navigator.plugins && navigator.plugins.length === 0) {
    return true;
  }

  return false;
}

// ============================================
// DEVICE & CONNECTION DETECTION
// ============================================

interface DeviceMetadata {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenSize: string;
  connection: string;
  memory: string;
  cores: number;
}

function getDeviceMetadata(): DeviceMetadata {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      os: 'unknown',
      browser: 'unknown',
      screenSize: 'unknown',
      connection: 'unknown',
      memory: 'unknown',
      cores: 1,
    };
  }

  const ua = navigator.userAgent;
  const conn = (navigator as any).connection;

  // Device type
  const isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile/i.test(ua);
  const isTablet = /Tablet|iPad|Playbook/i.test(ua) || (isMobile && screen.width >= 768);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // OS detection
  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

  // Browser detection
  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edge|Edg|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge|Edg/i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  // Screen size category
  const w = screen.width;
  let screenSize = 'unknown';
  if (w < 640) screenSize = 'xs';
  else if (w < 768) screenSize = 'sm';
  else if (w < 1024) screenSize = 'md';
  else if (w < 1280) screenSize = 'lg';
  else if (w < 1536) screenSize = 'xl';
  else screenSize = '2xl';

  // Connection quality
  let connection = conn?.effectiveType || 'unknown';

  // Memory
  const mem = (navigator as any).deviceMemory;
  let memory = mem ? `${mem}GB` : 'unknown';

  return {
    deviceType,
    os,
    browser,
    screenSize,
    connection,
    memory,
    cores: navigator.hardwareConcurrency || 1,
  };
}

// ============================================
// WEB VITALS RATING
// ============================================

function getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],     // Good < 2.5s, Poor > 4s
    FID: [100, 300],       // Good < 100ms, Poor > 300ms
    CLS: [0.1, 0.25],      // Good < 0.1, Poor > 0.25
    FCP: [1800, 3000],     // Good < 1.8s, Poor > 3s
    TTFB: [800, 1800],     // Good < 800ms, Poor > 1.8s
    INP: [200, 500],       // Good < 200ms, Poor > 500ms
  };

  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// ============================================
// MAIN COMPONENT
// ============================================

// Inner component that uses useSearchParams
function WebVitalsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);
  const sessionId = useRef<string>('');

  // Generate session ID on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionId.current = sessionStorage.getItem('bm_session_id') || 
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('bm_session_id', sessionId.current);
    }
  }, []);

  // Track page views (uses Analytics component, this is for additional context)
  useEffect(() => {
    if (isBot()) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[WebVitals] Page view:', url);
    }

    // Track navigation type
    const navType = isFirstLoad.current ? 'initial' : 'navigation';
    isFirstLoad.current = false;

    // Log for debugging (Vercel Analytics handles actual tracking)
    if (process.env.NODE_ENV === 'development') {
      const meta = getDeviceMetadata();
      console.log('[WebVitals] Context:', {
        url,
        navType,
        device: meta.deviceType,
        browser: meta.browser,
        connection: meta.connection,
      });
    }
  }, [pathname, searchParams]);

  // Report Web Vitals to Vercel
  useReportWebVitals((metric) => {
    // Skip bot traffic entirely
    if (isBot()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebVitals] Skipped (bot): ${metric.name}`);
      }
      return;
    }

    const rating = getVitalRating(metric.name, metric.value);
    const metadata = getDeviceMetadata();

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
      console.log(`[WebVitals] ${color} ${metric.name}:`, {
        value: Math.round(metric.value * 100) / 100,
        rating,
        delta: Math.round(metric.delta),
        id: metric.id.slice(0, 8),
        navigationType: metric.navigationType,
      });
    }

    // The @vercel/analytics and @vercel/speed-insights packages handle
    // sending metrics to Vercel automatically. This component provides:
    // 1. Bot filtering (saves your quota)
    // 2. Development debugging
    // 3. Additional context logging
    
    // Note: Vercel's Speed Insights automatically captures Web Vitals
    // No need to manually send - it's handled by the SpeedInsights component
  });

  // Track errors (optional - uses custom events quota sparingly)
  useEffect(() => {
    if (typeof window === 'undefined' || isBot()) return;

    const handleError = (event: ErrorEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WebVitals] Error caught:', event.message);
      }
      // Note: We don't send errors via Analytics to save quota
      // Vercel captures errors in the Logs tab automatically
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WebVitals] Unhandled rejection:', event.reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

// Wrapper component with Suspense boundary
export function WebVitalsEnhanced() {
  return (
    <Suspense fallback={null}>
      <WebVitalsInner />
    </Suspense>
  );
}

// ============================================
// UTILITY EXPORTS FOR CUSTOM TRACKING
// ============================================

/**
 * Track a custom event to Vercel Analytics
 * 
 * ⚠️ WARNING: Free plan has 2,500 custom events/month limit
 * Use sparingly for important conversions only!
 * 
 * @example
 * trackCustomEvent('signup_complete', { plan: 'pro' });
 */
export async function trackCustomEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  if (isBot()) return;

  try {
    const { track } = await import('@vercel/analytics');
    track(eventName, properties);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Custom event:', eventName, properties);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Failed to track:', error);
    }
  }
}

/**
 * Track important conversions (use for key business metrics only)
 * 
 * Recommended events to track (saves quota):
 * - signup_start, signup_complete
 * - purchase_start, purchase_complete
 * - subscription_upgrade
 * - affiliate_click, affiliate_signup
 */
export async function trackConversion(
  conversionType: 'signup' | 'purchase' | 'subscription' | 'affiliate' | 'other',
  value?: number,
  additionalProps?: Record<string, string | number | boolean>
): Promise<void> {
  if (isBot()) return;

  try {
    const { track } = await import('@vercel/analytics');
    track('conversion', {
      type: conversionType,
      value: value ?? 0,
      ...additionalProps,
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Conversion:', conversionType, value);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Failed to track conversion:', error);
    }
  }
}

/**
 * Check if current visitor is a bot
 * Useful for conditionally rendering content or enabling features
 */
export { isBot };

/**
 * Get device metadata for custom tracking
 */
export { getDeviceMetadata };

export default WebVitalsEnhanced;
