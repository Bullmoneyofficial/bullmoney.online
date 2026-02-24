'use client';

/**
 * useStorePageState.ts
 *
 * Centralises all page-level state that is NOT owned by the more focused hooks:
 *  - useStoreProducts   (products data / filters)
 *  - useStoreHero       (hero carousel)
 *  - useStoreResponsive (breakpoints)
 *  - useStoreCartActions (cart / checkout / viewer)
 *
 * Owns: mount guard, Telegram gate, loader, studio modal, desktop market-intel
 * panels, grid-layout UI state, and all navigation/action handlers.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProductsModalUI } from '@/contexts/UIStateHook';
import { useHeroMode } from '@/hooks/useHeroMode';
import type { GridVariant } from '../_constants/grid.constants';
import type { StudioOpts } from '../_types/store-page.types';

// ─── Lazy sound helpers (side-effect only — no compile-time import) ──────────
const playSoundEffect = (effect: 'click') => {
  import('@/app/hooks/useSoundEffects')
    .then((m) => m.SoundEffects.play(effect))
    .catch(() => {});
};
const clickSound = () => {
  import('@/app/hooks/useSoundEffects')
    .then((m) => m.SoundEffects.click())
    .catch(() => {});
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UseStorePageStateOptions {
  isDesktop: boolean;
  showProducts: boolean;
  showProductSections: boolean;
}

export type DesktopMarketIntelKey = 'community' | 'quotes' | 'news';

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStorePageState({
  isDesktop,
  showProducts,
  showProductSections,
}: UseStorePageStateOptions) {
  const router = useRouter();
  const { setHeroMode: setSharedHeroMode } = useHeroMode();
  const { open: openProductsModal } = useProductsModalUI();

  // ── Mount guard (SSR-safe hydration flag) ──────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Telegram gate — locks store for first-time visitors ────────────────────
  const [showStoreTelegramGate, setShowStoreTelegramGate] = useState(false);
  useEffect(() => {
    try {
      const confirmed = localStorage.getItem('bullmoney_telegram_confirmed');
      if (confirmed !== 'true') {
        setShowStoreTelegramGate(true);
      }
    } catch {
      // localStorage unavailable (private mode / SSR) — skip gate
    }
  }, []);

  // ── Full-page loader ────────────────────────────────────────────────────────
  const [showLoader, setShowLoader] = useState(false);

  // ── Print Design Studio modal ───────────────────────────────────────────────
  const [studioState, setStudioState] = useState<{ open: boolean } & StudioOpts>(
    { open: false },
  );

  // ── Desktop market-intel collapsible panels ─────────────────────────────────
  const [desktopMarketIntelCollapsed, setDesktopMarketIntelCollapsed] = useState<
    Record<DesktopMarketIntelKey, boolean>
  >({
    community: true,
    quotes: true,
    news: true,
  });

  // ── Grid layout UI state ────────────────────────────────────────────────────
  const [useGridLayouts, setUseGridLayouts] = useState(true);
  const [productsGridVariant, setProductsGridVariant] =
    useState<GridVariant>('spotlight');
  const [featuredGridVariant, setFeaturedGridVariant] =
    useState<GridVariant>('animated');
  const [timelineGridVariant, setTimelineGridVariant] =
    useState<GridVariant>('snug');

  // ── Derived values ──────────────────────────────────────────────────────────
  const paddingBoost = isDesktop ? 60 : 15;

  /** Stable Intl currency formatter — never re-created unless mount changes */
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    [],
  );

  const formatPrice = useCallback(
    (value: number) => currencyFormatter.format(value || 0),
    [currencyFormatter],
  );

  /**
   * Strips accidental double-slash prefixes (e.g. /https://...) that can
   * appear when Supabase storage URLs are stored with a leading slash.
   */
  const normalizeAssetUrl = useCallback((src: string) => {
    let normalized = src;
    if (
      normalized.startsWith('/http://') ||
      normalized.startsWith('/https://')
    ) {
      normalized = normalized.substring(1);
    }
    if (
      normalized.startsWith('http://') ||
      normalized.startsWith('https://')
    ) {
      return normalized;
    }
    return normalized.startsWith('/')
      ? normalized
      : `/${normalized.replace(/^public\//, '')}`;
  }, []);

  // ── Navigation / action handlers ────────────────────────────────────────────

  const handleModeChange = useCallback(
    (mode: 'store' | 'trader' | 'design') => {
      playSoundEffect('click');
      setSharedHeroMode(mode);
      if (mode === 'design') {
        router.push('/design');
      } else if (mode === 'trader') {
        router.push('/');
      }
    },
    [router, setSharedHeroMode],
  );

  const handleOpenVip = useCallback(() => {
    clickSound();
    openProductsModal();
  }, [openProductsModal]);

  const handleVisitShop = useCallback(() => {
    clickSound();
    if (!showProducts && showProductSections) {
      setSharedHeroMode('store');
      setTimeout(() => {
        document
          .querySelector('[data-products-grid]')
          ?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 0);
      return;
    }
    document
      .querySelector('[data-products-grid]')
      ?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [showProducts, showProductSections, setSharedHeroMode]);

  const handleStoreAccountClick = useCallback(() => {
    clickSound();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bullmoney_open_account_drawer'));
      return;
    }
    router.push('/');
  }, [router]);

  const openStudio = useCallback((opts?: StudioOpts) => {
    setStudioState({ open: true, ...opts });
  }, []);

  const toggleDesktopMarketIntel = useCallback(
    (key: DesktopMarketIntelKey) => {
      setDesktopMarketIntelCollapsed((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    [],
  );

  /**
   * Called when the user clicks "I joined" on the Telegram gate.
   * Opens broker sign-up tabs (background), records confirmation, hides gate.
   */
  const handleStoreTelegramUnlock = useCallback(() => {
    try {
      localStorage.setItem('bullmoney_telegram_confirmed', 'true');
      const alreadyRedirected = localStorage.getItem(
        'bullmoney_xm_redirect_done',
      );
      if (alreadyRedirected !== 'true') {
        try {
          navigator.clipboard.writeText('X3R7P').catch(() => {});
        } catch {}
        const xmTab = window.open('https://affs.click/t5wni', '_blank');
        try {
          xmTab?.blur();
          window.focus();
        } catch {}
        setTimeout(() => {
          const vTab = window.open('https://vigco.co/iQbe2u', '_blank');
          try {
            vTab?.blur();
            window.focus();
          } catch {}
        }, 600);
        localStorage.setItem('bullmoney_xm_redirect_done', 'true');
      }
    } catch {}
    setShowStoreTelegramGate(false);
  }, []);

  // ── Return ──────────────────────────────────────────────────────────────────
  return {
    // Mount
    hasMounted,

    // Gate / loader
    showLoader,
    setShowLoader,
    showStoreTelegramGate,
    setShowStoreTelegramGate,
    handleStoreTelegramUnlock,

    // Studio
    studioState,
    setStudioState,
    openStudio,

    // Market intel panels
    desktopMarketIntelCollapsed,
    toggleDesktopMarketIntel,

    // Grid layout UI
    useGridLayouts,
    setUseGridLayouts,
    productsGridVariant,
    setProductsGridVariant,
    featuredGridVariant,
    setFeaturedGridVariant,
    timelineGridVariant,
    setTimelineGridVariant,

    // Derived / utils
    paddingBoost,
    formatPrice,
    normalizeAssetUrl,

    // Handlers
    handleModeChange,
    handleOpenVip,
    handleVisitShop,
    handleStoreAccountClick,
  } as const;
}
