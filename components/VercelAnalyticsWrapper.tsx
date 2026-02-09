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

// Only render on Vercel (VERCEL env var is set automatically on Vercel deployments)
const IS_VERCEL = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL;

export function VercelAnalyticsWrapper() {
  // Skip entirely in local dev — the CDN scripts aren't reachable off-platform
  if (!IS_VERCEL) return null;

  return (
    <>
      <Analytics 
        mode="production"
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
