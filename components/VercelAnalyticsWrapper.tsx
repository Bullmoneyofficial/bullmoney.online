'use client';

/**
 * Vercel Analytics & Speed Insights Wrapper
 * 
 * This client component wraps Vercel Analytics and SpeedInsights
 * with beforeSend callbacks that filter bot traffic, internal paths,
 * and respect cookie consent preferences.
 */

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Bot patterns to filter out
const BOT_PATTERNS = /bot|crawler|spider|scraper|headless|puppeteer|lighthouse|pagespeed|gtmetrix/i;

export function VercelAnalyticsWrapper() {
  return (
    <>
      <Analytics 
        mode="production"
        debug={process.env.NODE_ENV === 'development'}
        beforeSend={(event) => {
          // Filter out bot traffic and internal paths
          if (typeof window !== 'undefined') {
            const ua = navigator.userAgent.toLowerCase();
            // Skip bots
            if (BOT_PATTERNS.test(ua)) {
              return null;
            }
            // Skip internal/admin paths from analytics (saves quota)
            if (event.url.includes('/api/') || event.url.includes('/_next/')) {
              return null;
            }
          }
          return event;
        }}
      />
      <SpeedInsights 
        debug={process.env.NODE_ENV === 'development'}
        sampleRate={1}
        beforeSend={(data) => {
          // Filter bot traffic from Speed Insights
          if (typeof window !== 'undefined') {
            const ua = navigator.userAgent.toLowerCase();
            if (BOT_PATTERNS.test(ua)) {
              return null;
            }
          }
          return data;
        }}
      />
    </>
  );
}

export default VercelAnalyticsWrapper;
