"use client";

import dynamic from "next/dynamic";
import { Suspense, ReactNode, useEffect } from "react";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";

// ✅ IMPORT CRITICAL SEO/ANALYTICS DIRECTLY - These are lightweight and critical
import WebVitalsEnhanced from "@/components/WebVitalsEnhanced";
import AllSEOSchemas from "@/components/SEOSchemas";
import AdvancedSEO from "@/components/AdvancedSEO";
import GoogleSEOBoost from "@/components/GoogleSEOBoost";
import VercelAnalyticsWrapper from "@/components/VercelAnalyticsWrapper";

// ✅ OFF-SCREEN ANIMATION CONTROLLER - Pauses animations we can't see
import { OffscreenAnimationController } from "@/hooks/useOffscreenAnimationPause";

// ✅ LOADING FALLBACKS - Mobile optimized
import {
  NavbarSkeleton,
  MinimalFallback,
} from "@/components/MobileLazyLoadingFallback";

// ✅ LAZY LOADED: Performance components
const ClientProviders = dynamic(
  () => import("@/components/ClientProviders").then(mod => ({ default: mod.ClientProviders })),
  { ssr: false }
);

const ShimmerStylesProvider = dynamic(
  () => import("@/components/ui/UnifiedShimmer").then(mod => ({ default: mod.ShimmerStylesProvider })),
  { ssr: false }
);

const CacheManagerProvider = dynamic(
  () => import("@/components/CacheManagerProvider"),
  { ssr: false }
);

// ✅ ULTIMATE HUB - Unified component replacing TradingQuickAccess, CommunityQuickAccess, UltimateControlPanel
// Contains: Left side pills (Trading, Community, TV) + Right side FPS pill with Device Center Panel
const UltimateHub = dynamic(
  () => import("@/components/UltimateHub").then(mod => ({ default: mod.UltimateHub })),
  { ssr: false }
);

// ✅ NAVBAR - Lazy load for mobile (named export)
const Navbar = dynamic(
  () => import("@/components/navbar").then(mod => ({ default: mod.Navbar })),
  { ssr: false, loading: () => <NavbarSkeleton /> }
);

// ✅ CLIENT CURSOR - Must be LAST in DOM to render above EVERYTHING
// Including MultiStepLoaderv2 (z-[9999999]), pagemode (z-[99999999]), and all modals
const ClientCursor = dynamic(
  () => import("@/components/ClientCursor"),
  { ssr: false }
);

// 🔔 NOTIFICATION PERMISSION MODAL - Shows IMMEDIATELY on first load asking for push notifications
// Using eager loading to ensure it appears before anything else
const NotificationPermissionModal = dynamic(
  () => import("@/components/NotificationPermissionModal").then(mod => mod.NotificationPermissionModal),
  { ssr: false, loading: () => null }
);

interface LayoutProvidersProps {
  children: ReactNode;
  modal?: ReactNode;
}

/**
 * LayoutProviders - Client-side wrapper for dynamic components in root layout
 * Handles all lazy-loaded providers and components with ssr: false
 */
export function LayoutProviders({ children, modal }: LayoutProvidersProps) {
  // Only defer navbar/UltimateHub on mobile to avoid blocking first paint
  const { isMobile: isMobileViewport, shouldRender: allowMobileLazy } = useMobileLazyRender(220);

  // Dev-only guard to avoid crash when React tries to remove nodes that were already moved/removed by imperative code
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalRemoveChild = Node.prototype.removeChild;

    const safeRemoveChild: typeof Node.prototype.removeChild = function patchedRemoveChild<T extends Node>(this: Node, child: T): T {
      // If the child was already detached (e.g., moved by a 3rd-party script), skip removal to prevent a NotFoundError
      if (!child || child.parentNode !== this) {
        console.warn("[LayoutProviders] Skipped removeChild for detached node", { parent: this, child });
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    Node.prototype.removeChild = safeRemoveChild;

    return () => {
      Node.prototype.removeChild = originalRemoveChild;
    };
  }, []);

  return (
    <>
      {/* 🔔 NOTIFICATION PERMISSION MODAL - FIRST! Shows immediately on first load 
          Must be rendered FIRST to appear ABOVE everything including welcome screens */}
      <NotificationPermissionModal />
      
      {/* Global Shimmer Styles - ensures all shimmers are synchronized */}
      <ShimmerStylesProvider />
      
      {/* Cache Manager - Handles version-based cache invalidation */}
      <CacheManagerProvider>
        {/* Navbar rendered outside ClientProviders for fixed positioning */}
        {(allowMobileLazy || !isMobileViewport) && <Navbar />}
        
        {/* ✅ ULTIMATE HUB - All-in-one unified component
            - Left side: Trading pill (prices), Community pill (Telegram), TV pill
            - Right side: FPS pill with Device Center Panel (4 tabs: Overview, Network, Performance, Account)
            - All real device data from browser APIs */}
        {(allowMobileLazy || !isMobileViewport) && <UltimateHub />}
        
        {/* ✅ LAZY LOADED: All performance providers bundled */}
        <ClientProviders modal={modal}>
          {/* ✅ OFF-SCREEN ANIMATION PAUSE - Saves CPU by pausing invisible animations */}
          <OffscreenAnimationController>
            <div className="page-full">
              {children}
            </div>
          </OffscreenAnimationController>
        </ClientProviders>
      </CacheManagerProvider>

      {/* ✅ VERCEL TRACKING - Enhanced Analytics & Speed Insights */}
      <VercelAnalyticsWrapper />
      <WebVitalsEnhanced />

      {/* ✅ SEO STRUCTURED DATA - JSON-LD Schemas for Rich Search Results */}
      <AllSEOSchemas />

      {/* ✅ ADVANCED SEO - Additional schemas for Google #1 ranking */}
      <AdvancedSEO />

      {/* ✅ GOOGLE SEO BOOST - Maximum ranking power */}
      <GoogleSEOBoost />
      
      {/* ============================================
          ✅ CLIENT CURSOR - MUST BE LAST IN DOM
          ============================================
          Rendered AFTER everything else to ensure it appears
          ABOVE all content including:
          - MultiStepLoaderv2 (z-[9999999] - z-[999999999])
          - pagemode (z-[99999999])
          - All modals (z-[2147483647])
          
          DOM order matters for same z-index elements.
          Being last in DOM = renders on top.
          ============================================ */}
      <ClientCursor />
    </>
  );
}
