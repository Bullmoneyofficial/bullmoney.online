"use client";

import dynamic from "next/dynamic";
import { Suspense, ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { useThemeSelectorModalUI } from "@/contexts/UIStateContext";
import { useUIState } from "@/contexts/UIStateContext";
// ✅ LAZY-LOADED: SEO/analytics/audio deferred to avoid blocking first paint
const ScrollSciFiAudio = dynamic(
  () => import("@/components/ScrollSciFiAudio").then(mod => ({ default: mod.ScrollSciFiAudio })),
  { ssr: false }
);

const WebVitalsEnhanced = dynamic(
  () => import("@/components/WebVitalsEnhanced"),
  { ssr: false }
);

const AllSEOSchemas = dynamic(
  () => import("@/components/SEOSchemas"),
  { ssr: false }
);

const AdvancedSEO = dynamic(
  () => import("@/components/AdvancedSEO"),
  { ssr: false }
);

const GoogleSEOBoost = dynamic(
  () => import("@/components/GoogleSEOBoost"),
  { ssr: false }
);

import VercelAnalyticsWrapper from "@/components/VercelAnalyticsWrapper";

// ✅ OFF-SCREEN ANIMATION CONTROLLER - Pauses animations we can't see
const OffscreenAnimationController = dynamic(
  () => import("@/hooks/useOffscreenAnimationPause").then(mod => ({ default: mod.OffscreenAnimationController })),
  { ssr: false }
);

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

const AppSupportButton = dynamic(
  () => import("@/components/shop/StoreSupportButton").then(mod => ({ default: mod.AppSupportButton })),
  { ssr: false }
);

const StoreSupportButton = dynamic(
  () => import("@/components/shop/StoreSupportButton").then(mod => ({ default: mod.StoreSupportButton })),
  { ssr: false }
);

// ✅ NAVBAR - Lazy load for mobile (named export)
const Navbar = dynamic(
  () => import("@/components/navbar").then(mod => ({ default: mod.Navbar })),
  { ssr: false, loading: () => <NavbarSkeleton /> }
);


// 🔔 NOTIFICATION PERMISSION MODAL - Shows IMMEDIATELY on first load asking for push notifications
// Using eager loading to ensure it appears before anything else
const NotificationPermissionModal = dynamic(
  () => import("@/components/NotificationPermissionModal").then(mod => mod.NotificationPermissionModal),
  { ssr: false, loading: () => null }
);

const CookieConsent = dynamic(
  () => import("@/components/CookieConsent"),
  { ssr: false, loading: () => null }
);

// ThemesPanel needs both ThemesProvider (from AppProviders) AND UIStateProvider (from ClientProviders)
const ThemesPanel = dynamic(
  () => import("@/contexts/ThemesContext").then(m => ({ default: m.ThemesPanel })),
  { ssr: false }
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
  const { isOpen: isThemeSelectorOpen } = useThemeSelectorModalUI();
  const [themePanelReady, setThemePanelReady] = useState(false);
  const [supportReady, setSupportReady] = useState(false);
  
  // Check if we're on store pages, casino pages, desktop page, design page, or app page - hide navbar (replaced with StoreHeader)
  const pathname = usePathname();
  const isStorePage = pathname.startsWith('/store') || pathname.startsWith('/games') || pathname.startsWith('/design');
  const isGamesPage = pathname.startsWith('/games');
  const isDesktopPage = pathname === '/desktop';
  const isAppPage = pathname === '/';
  
  // Global Ultimate Hub visibility - controlled by toggle in navbar & store header
  // Default OFF to prevent heavy component from loading and blocking page render
  const [showUltimateHub, setShowUltimateHub] = useState(false);
  const [mountStage, setMountStage] = useState(0);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readLocalFlag = () => {
        try {
          return window.localStorage.getItem('store_show_ultimate_hub');
        } catch {
          return null;
        }
      };

      const stored = readLocalFlag();
      // Default to false (hidden) — only show when user explicitly enabled it
      setShowUltimateHub(stored === 'true');

      // Listen for changes
      const handleStorageChange = (event: Event) => {
        // Use event detail when available for immediate sync
        const detailValue = (event as CustomEvent<boolean>).detail;
        if (typeof detailValue === 'boolean') {
          setShowUltimateHub(detailValue);
          return;
        }
        const nextStored = readLocalFlag();
        setShowUltimateHub(nextStored === 'true');
      };
      window.addEventListener('store_ultimate_hub_toggle', handleStorageChange);
      return () => window.removeEventListener('store_ultimate_hub_toggle', handleStorageChange);
    }
  }, []);

  // Only run mount stage progression ONCE on initial load, not on every pathname change.
  // Re-running on every navigation causes flicker as components gated on mountStage re-render.
  const mountStageInitialized = useRef(false);
  useEffect(() => {
    if (mountStageInitialized.current) return;
    mountStageInitialized.current = true;
    // Stage 2: Show navbar + children immediately
    setMountStage(2);
    // Stage 3: Cursor + extras after a short delay to not block first paint
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => setMountStage(3), { timeout: 1500 });
    } else {
      setTimeout(() => setMountStage(3), 300);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isThemeSelectorOpen) {
      setThemePanelReady(true);
    }
  }, [isThemeSelectorOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const activate = () => setSupportReady(true);
    if ("requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(activate, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(activate, 350);
    }
    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname]);

  const canShowNavbar = mountStage >= 1;
  const canShowChildren = mountStage >= 2;
  const canShowUltimateHub = mountStage >= 2;
  const canShowCursor = mountStage >= 3;
  const canShowSupport = canShowUltimateHub && supportReady;

  // ============================================
  // ADMIN PANEL KEYBOARD SHORTCUT: Ctrl+A+P
  // ============================================
  const { setAdminModalOpen } = useUIState();
  const [adminKeySequence, setAdminKeySequence] = useState<string[]>([]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (or Cmd on Mac)
      if (e.ctrlKey || e.metaKey) {
        // Add pressed key to sequence
        const key = e.key.toLowerCase();
        
        setAdminKeySequence(prev => {
          const newSequence = [...prev, key].slice(-2); // Keep last 2 keys
          
          // Check if sequence is 'a' then 'p' while holding ctrl
          if (newSequence.length === 2 && newSequence[0] === 'a' && newSequence[1] === 'p') {
            e.preventDefault();
            setAdminModalOpen(true);
            return []; // Reset sequence
          }
          
          return newSequence;
        });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Reset sequence when ctrl/cmd is released
      if (!e.ctrlKey && !e.metaKey) {
        setAdminKeySequence([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setAdminModalOpen]);

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
        <CookieConsent />

        {/* 🔔 NOTIFICATION PERMISSION MODAL - FIRST! Shows immediately on first load 
          Must be rendered FIRST to appear ABOVE everything including welcome screens */}
        <NotificationPermissionModal />
      
      <ScrollSciFiAudio />
      {/* Global Shimmer Styles - ensures all shimmers are synchronized */}
      <ShimmerStylesProvider />
      
      {/* Cache Manager - Handles version-based cache invalidation */}
      <CacheManagerProvider>
        {/* Navbar rendered outside ClientProviders for fixed positioning - HIDDEN on store, desktop & app pages */}
        {canShowNavbar && !isStorePage && !isDesktopPage && !isAppPage && (allowMobileLazy || !isMobileViewport) && <Navbar />}
        
        {/* ✅ ULTIMATE HUB - All-in-one unified component - Controlled by toggle
            - Left side: Trading pill (prices), Community pill (Telegram), TV pill
            - Right side: FPS pill with Device Center Panel (4 tabs: Overview, Network, Performance, Account)
            - All real device data from browser APIs */}
        {canShowUltimateHub && showUltimateHub && (allowMobileLazy || !isMobileViewport) && <UltimateHub />}

        {/* ✅ SUPPORT BUTTON - Global floating support widget (hidden on games pages) */}
        {canShowSupport && !isStorePage && <AppSupportButton />}
        {canShowSupport && isStorePage && !isGamesPage && typeof document !== "undefined" && createPortal(
          <StoreSupportButton />,
          document.body
        )}
        
        {/* ✅ LAZY LOADED: All performance providers bundled */}
        {canShowChildren ? (
          <ClientProviders modal={modal}>
            {/* ✅ OFF-SCREEN ANIMATION PAUSE - Saves CPU by pausing invisible animations */}
            {/* SKIPPED on store pages — its global MutationObserver + IntersectionObserver
                causes a mutation storm with StoreLayoutClient's own overlay-hiding logic */}
            {isStorePage ? (
              <div className="page-full">{children}</div>
            ) : (
              <OffscreenAnimationController>
                <div className="page-full">
                  {children}
                </div>
              </OffscreenAnimationController>
            )}
          </ClientProviders>
        ) : (
          <MinimalFallback />
        )}
      </CacheManagerProvider>

      {/* ✅ VERCEL TRACKING - Enhanced Analytics & Speed Insights */}
      <VercelAnalyticsWrapper />
      {/* Temporarily disabled due to WeakMap error - TODO: Fix useSearchParams issue */}
      {/* <Suspense fallback={null}>
        <WebVitalsEnhanced />
      </Suspense> */}

      {/* ✅ SEO STRUCTURED DATA - Deferred to idle for faster first paint */}
      {canShowCursor && (
        <Suspense fallback={null}>
          <AllSEOSchemas />
          <AdvancedSEO />
          <GoogleSEOBoost />
        </Suspense>
      )}

      {/* Unified Themes Panel (Colors + Effects) — needs UIStateProvider from ClientProviders */}
      {themePanelReady && isThemeSelectorOpen && <ThemesPanel />}
      
    </>
  );
}
