"use client";

import dynamic from "next/dynamic";
import { NavbarSkeleton } from "@/components/MobileLazyLoadingFallback";

// ✅ LAZY-LOADED: SEO/analytics/audio deferred to avoid blocking first paint
export const ScrollSciFiAudio = dynamic(
  () => import("@/components/ScrollSciFiAudio").then(mod => ({ default: mod.ScrollSciFiAudio })),
  { ssr: false }
);

export const AllSEOSchemas = dynamic(
  () => import("@/components/SEOSchemas"),
  { ssr: false }
);

export const AdvancedSEO = dynamic(
  () => import("@/components/AdvancedSEO"),
  { ssr: false }
);

export const GoogleSEOBoost = dynamic(
  () => import("@/components/GoogleSEOBoost"),
  { ssr: false }
);

export const MemoryBoostClient = dynamic(
  () => import("@/components/MemoryBoostClient"),
  { ssr: false }
);

export const HreflangMeta = dynamic(
  () => import("@/components/HreflangMeta").then((mod) => ({ default: mod.HreflangMeta })),
  { ssr: false }
);

// ✅ PERF: VercelAnalytics lazy-loaded to avoid compile-time weight
export const VercelAnalyticsWrapper = dynamic(
  () => import("@/components/VercelAnalyticsWrapper"),
  { ssr: false }
);

// ✅ OFF-SCREEN ANIMATION CONTROLLER - Pauses animations we can't see
export const OffscreenAnimationController = dynamic(
  () => import("@/hooks/useOffscreenAnimationPause").then(mod => ({ default: mod.OffscreenAnimationController })),
  { ssr: false }
);

// ✅ LAZY LOADED: Performance components
export const ClientProviders = dynamic(
  () => import("@/components/ClientProviders").then(mod => ({ default: mod.ClientProviders })),
  { ssr: false }
);

export const ShimmerStylesProvider = dynamic(
  () => import("@/components/ui/UnifiedShimmer").then(mod => ({ default: mod.ShimmerStylesProvider })),
  { ssr: false }
);

export const CacheManagerProvider = dynamic(
  () => import("@/components/CacheManagerProvider"),
  { ssr: false }
);

// ✅ ULTIMATE HUB - Unified component replacing TradingQuickAccess, CommunityQuickAccess, UltimateControlPanel
// Contains: Left side pills (Trading, Community, TV) + Right side FPS pill with Device Center Panel
export const UltimateHub = dynamic(
  () => import("@/components/UltimateHub").then(mod => ({ default: mod.UltimateHub })),
  { ssr: false }
);

export const AppSupportButton = dynamic(
  () => import("@/components/shop/StoreSupportButton").then(mod => ({ default: mod.AppSupportButton })),
  { ssr: false }
);

// ✅ NAVBAR - Lazy load for mobile (named export)
export const Navbar = dynamic(
  () => import("@/components/navbar").then(mod => ({ default: mod.Navbar })),
  { ssr: false, loading: () => <NavbarSkeleton /> }
);

// ✅ StoreHeader - Used for standalone (installed) home screen app navigation
export const StoreHeader = dynamic(
  () => import("@/components/store/StoreHeader").then(mod => ({ default: mod.StoreHeader })),
  { ssr: false }
);

// 🔔 NOTIFICATION PERMISSION MODAL - Shows IMMEDIATELY on first load asking for push notifications
// Using eager loading to ensure it appears before anything else
export const NotificationPermissionModal = dynamic(
  () => import("@/components/NotificationPermissionModal").then(mod => mod.NotificationPermissionModal),
  { ssr: false, loading: () => null }
);

export const CookieConsent = dynamic(
  () => import("@/components/CookieConsent"),
  { ssr: false, loading: () => null }
);

// ✅ PERF: PWAInstallPrompt pulls in framer-motion; keep it out of the critical path
export const PWAInstallPrompt = dynamic(
  () => import("@/components/PWAInstallPrompt"),
  { ssr: false, loading: () => null }
);

// ✅ GLOBAL V3 LOADER - Shows randomly on ~20% of reloads across ALL pages
export const GlobalV3Loader = dynamic(
  () => import("@/components/GlobalV3Loader"),
  { ssr: false, loading: () => null }
);

// ThemesPanel needs both ThemesProvider (from AppProviders) AND UIStateProvider (from ClientProviders)
export const ThemesPanel = dynamic(
  () => import("@/contexts/ThemesContext").then(m => ({ default: m.ThemesPanel })),
  { ssr: false }
);
