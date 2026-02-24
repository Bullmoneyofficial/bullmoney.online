'use client';

/**
 * StorePageClient.tsx — Store page orchestrator.
 *
 * Wires together all focused hooks + section components.
 * Zero inline business logic — one source of truth per concern.
 *
 * Render order:
 *   TelegramGate / LoaderGuard → QuickAddPanel → Hero → BrokerSignup →
 *   About Timeline → Dashboards → NetworkShowcase → Timer/Products →
 *   Features (mobile) → Testimonials (mobile) → MetaQuotes (mobile+trader) →
 *   Footer → Modals (PrintDesignStudio, CheckoutModal, ViewerPortal)
 *
 * ✅ printDesignSection is intentionally NOT rendered here.
 */

import React, { useMemo, useEffect } from 'react';
import { useHeroMode } from '@/hooks/useHeroMode';
import { hasActiveFilters } from './store.utils';
import { useStoreSection } from './StoreMemoryContext';
import type { StorePageProps } from './_types/store-page.types';

// ── Focused hooks ─────────────────────────────────────────────────────────────
import { useStoreResponsive }   from './_hooks/useStoreResponsive';
import { useStoreHero }         from './_hooks/useStoreHero';
import { useStoreProducts }     from './_hooks/useStoreProducts';
import { useStoreCartActions }  from './_hooks/useStoreCartActions';
import { useStorePageState }    from './_hooks/useStorePageState';

// ── Lazy dynamics (ssr:false imports) ─────────────────────────────────────────
import {
  TelegramUnlockScreen,
  MultiStepLoaderV2,
  LazyShowcaseScroll,
  PrintDesignStudio,
  BrokerSignupSection,
  StoreAboutTimeline,
} from './_lazy/store-dynamics';

// ── Section & modal components ─────────────────────────────────────────────────
import { StoreHeroSection }         from './_components/StoreHeroSection';
import { StoreDashboardsSection }   from './_components/StoreDashboardsSection';
import { StoreProductsSection }     from './_components/StoreProductsSection';
import { StoreTimerSection }        from './_components/StoreTimerSection';
import { StoreQuickAddPanel }       from './_components/StoreQuickAddPanel';
import { StoreCheckoutModal }       from './_components/StoreCheckoutModal';
import { StoreProductViewerPortal } from './_components/StoreProductViewerPortal';
import {
  StoreFeaturesSection,
  StoreMetaMarketSection,
  StoreMetaQuotesSection,
  StoreTestimonialsSection,
  StoreFooterSection,
} from './_components/StoreStaticSections';
import { StoreNetworkShowcase } from './_sections/StoreNetworkShowcase';

// ── Grid animation CSS (injected once per page mount) ─────────────────────────
const GRID_ANIMATION_CSS = `
  @keyframes gridStaggerIn {
    0%   { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes gridFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes spotlightPulse {
    0%, 100% { box-shadow: 0 0 0 rgba(245,158,11,0.12); }
    50%       { box-shadow: 0 22px 60px rgba(245,158,11,0.2); }
  }
  .stagger-item {
    opacity: 0;
    animation: gridStaggerIn 320ms ease-out forwards;
  }
  .grid-float  { animation: gridFloat 10s ease-in-out infinite; }
  .spotlight-card.spotlight-active {
    animation: spotlightPulse 2.8s ease-in-out infinite;
  }
  .grid-perf {
    content-visibility: auto;
    contain: layout paint style;
    contain-intrinsic-size: 900px 1200px;
  }
  .grid-card {
    content-visibility: auto;
    contain: layout paint style;
    contain-intrinsic-size: 280px 420px;
  }
  @media (max-width: 767px) {
    .grid-card { contain: layout style; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stagger-item, .grid-float {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export function StorePageClient({
  routeBase = '/store',
  syncUrl = true,
  showProductSections = true,
}: StorePageProps) {
  // ── Responsive breakpoints ───────────────────────────────────────────────
  const { isDesktop, isMobile, isUltraWide } = useStoreResponsive();

  // ── Shared hero mode ─────────────────────────────────────────────────────
  const { heroMode, setHeroMode: setSharedHeroMode } = useHeroMode();
  const showProducts = showProductSections && heroMode === 'store';

  // ── Section refs (IntersectionObserver callback refs from context) ───────
  const hero            = useStoreSection('hero');
  const productsSection = useStoreSection('products');
  const featuredSection = useStoreSection('featured');
  const footerSection   = useStoreSection('footer');

  // ── Page-level state (gate, studio, grid toggles, nav handlers) ──────────
  const {
    hasMounted,
    showLoader,
    showStoreTelegramGate,
    handleStoreTelegramUnlock,
    studioState,
    setStudioState,
    desktopMarketIntelCollapsed,
    toggleDesktopMarketIntel,
    useGridLayouts,
    setUseGridLayouts,
    productsGridVariant,
    setProductsGridVariant,
    featuredGridVariant,
    setFeaturedGridVariant,
    timelineGridVariant,
    setTimelineGridVariant,
    paddingBoost,
    formatPrice,
    normalizeAssetUrl,
    handleOpenVip,
    handleVisitShop,
  } = useStorePageState({ isDesktop, showProducts, showProductSections });

  // ── Hero carousel state ──────────────────────────────────────────────────
  const { allowHeavyHeroReady, resolvedHeroSlide, showHeroMapOverlay, onVideoEnded } =
    useStoreHero(hasMounted);

  // ── Products data + filters ──────────────────────────────────────────────
  const {
    products,
    loading,
    loadingMore,
    hasMore,
    page,
    total,
    filters,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    storeDisplayMode,
    timerEnd,
    timerHeadline,
    timerSubtext,
    fetchProducts,
    handleFilterChange,
    clearFilters,
  } = useStoreProducts({ routeBase, syncUrl, showProducts });

  // ── Cart / checkout / quick-add / viewer ────────────────────────────────
  const {
    expandedProduct,
    setExpandedProduct,
    checkoutOpen,
    setCheckoutOpen,
    checkoutProduct,
    paymentMethod,
    setPaymentMethod,
    viewerProduct,
    setViewerProduct,
    viewerMounted,
    setViewerMounted,
    isVipProduct,
    canAddToCart,
    handleAddClick,
    handleCheckoutAction,
    handleExpandedBuy,
  } = useStoreCartActions(isDesktop);

  // ── Derived product slices ───────────────────────────────────────────────
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const timelineProducts = useMemo(() => products.slice(4, 8), [products]);
  const activeFilters    = hasActiveFilters(filters, debouncedSearch);

  // ── Viewer media resolution ──────────────────────────────────────────────
  const viewerMedia = useMemo(() => {
    if (!viewerProduct) return null;
    const media = (viewerProduct as any).media as
      | Array<{ url: string; media_type?: string; is_primary?: boolean }>
      | undefined;
    const primaryImage =
      viewerProduct.primary_image ||
      viewerProduct.images?.find((img) => img.is_primary)?.url ||
      viewerProduct.images?.[0]?.url;
    if (primaryImage) return { url: normalizeAssetUrl(primaryImage), type: 'image' as const };
    const primaryMedia = media?.find((i) => i.is_primary) || media?.[0];
    if (primaryMedia?.url)
      return {
        url: normalizeAssetUrl(primaryMedia.url),
        type: (primaryMedia.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
      };
    return null;
  }, [viewerProduct, normalizeAssetUrl]);

  // ── Side-effects ─────────────────────────────────────────────────────────

  // Force-enable scrolling (deferred import — keeps bundle lean)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import('@/lib/forceScrollEnabler').then((mod) => {
      cleanup = mod.forceEnableScrolling();
    });
    return () => cleanup?.();
  }, []);

  // Sync heroMode to 'store' on mount
  useEffect(() => {
    if (heroMode !== 'store') setSharedHeroMode('store');
  }, [heroMode, setSharedHeroMode]);

  // Deferred viewer mount flag
  useEffect(() => {
    setViewerMounted(true);
  }, [setViewerMounted]);

  // Collapse expanded product on mobile
  useEffect(() => {
    if (!isDesktop) setExpandedProduct(null);
  }, [isDesktop, setExpandedProduct]);

  // Keyboard dismiss — expanded product
  useEffect(() => {
    if (!expandedProduct) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedProduct(null);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [expandedProduct, setExpandedProduct]);

  // Keyboard dismiss — viewer
  useEffect(() => {
    if (!viewerProduct) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerProduct(null);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [viewerProduct, setViewerProduct]);

  // Keyboard dismiss — checkout
  useEffect(() => {
    if (!checkoutOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCheckoutOpen(false);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [checkoutOpen, setCheckoutOpen]);

  // ── Gate / loader guards ─────────────────────────────────────────────────

  if (showStoreTelegramGate) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black">
        <TelegramUnlockScreen
          onUnlock={handleStoreTelegramUnlock}
          onConfirmationClicked={() => undefined}
          isXM={false}
          neonIconClass="neon-blue-icon"
        />
      </div>
    );
  }

  if (showLoader) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white">
        <MultiStepLoaderV2
          loading
          loop={false}
          duration={700}
          theme="light"
          loadingStates={[
            { text: 'Preparing store…' },
            { text: 'Loading drops…' },
            { text: 'Ready.' },
          ]}
        />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div
      data-store-page
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'rgb(255,255,255)',
        color: '#1d1d1f',
      }}
    >
      {/* Showcase scroll side-effect (deferred, no DOM output) */}
      {hasMounted && (
        <LazyShowcaseScroll startDelay={1000} enabled pageId="store" />
      )}

      {/* Grid animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: GRID_ANIMATION_CSS }} />

      {/* ── Quick-add panel (desktop, hovers over page) ── */}
      <StoreQuickAddPanel
        expandedProduct={expandedProduct}
        onClose={() => setExpandedProduct(null)}
        onBuy={handleExpandedBuy}
        formatPrice={formatPrice}
        isVipProduct={isVipProduct}
        canAddToCart={canAddToCart}
      />

      {/* ── Hero ── */}
      {heroMode === 'store' && (
        <StoreHeroSection
          heroRef={hero.ref as any}
          resolvedHeroSlide={resolvedHeroSlide}
          allowHeavyHeroReady={allowHeavyHeroReady}
          showHeroMapOverlay={showHeroMapOverlay}
          onVideoEnded={onVideoEnded}
          paddingBoost={paddingBoost}
          onOpenVip={handleOpenVip}
          onVisitShop={handleVisitShop}
        />
      )}

      {/* ── Broker signup ── */}
      <BrokerSignupSection />

      {/* ── About timeline ── */}
      <StoreAboutTimeline />

      {/* ── Desktop market-intel dashboards ── */}
      <StoreDashboardsSection
        desktopMarketIntelCollapsed={desktopMarketIntelCollapsed}
        onToggle={toggleDesktopMarketIntel}
      />

      {/* ── Social network showcase ── */}
      <StoreNetworkShowcase />

      {/* ── Timer mode banner ── */}
      {storeDisplayMode === 'timer' && (
        <StoreTimerSection
          timerEnd={timerEnd}
          timerHeadline={timerHeadline}
          timerSubtext={timerSubtext}
        />
      )}

      {/* ── Products grid (hidden during timer mode) ── */}
      {showProducts && storeDisplayMode !== 'timer' && (
        <StoreProductsSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          handleFilterChange={handleFilterChange}
          hasActiveFilters={activeFilters}
          clearFilters={clearFilters}
          products={products}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          page={page}
          total={total}
          fetchProducts={fetchProducts as any}
          featuredProducts={featuredProducts}
          timelineProducts={timelineProducts}
          useGridLayouts={useGridLayouts}
          setUseGridLayouts={setUseGridLayouts}
          productsGridVariant={productsGridVariant}
          setProductsGridVariant={setProductsGridVariant}
          featuredGridVariant={featuredGridVariant}
          setFeaturedGridVariant={setFeaturedGridVariant}
          timelineGridVariant={timelineGridVariant}
          setTimelineGridVariant={setTimelineGridVariant}
          productsRef={productsSection.ref as any}
          featuredRef={featuredSection.ref as any}
          shouldAnimateProducts={productsSection.shouldAnimate}
          shouldAnimateFeatured={featuredSection.shouldAnimate}
          heroMode={heroMode}
          onViewProduct={(p) => setViewerProduct(p)}
          onAddClick={handleAddClick}
          canAddToCart={canAddToCart}
          formatPrice={formatPrice}
          paddingBoost={paddingBoost}
          isMobile={isMobile}
          isUltraWide={isUltraWide}
        />
      )}

      {/* ── Mobile-only supplementary sections ── */}
      {!isDesktop && <StoreFeaturesSection />}
      {!isDesktop && heroMode === 'trader' && <StoreMetaMarketSection />}
      {!isDesktop && <StoreTestimonialsSection />}
      {!isDesktop && heroMode === 'trader' && <StoreMetaQuotesSection />}

      {/* ── Footer ── */}
      <StoreFooterSection sectionRef={footerSection.ref as any} />

      {/* ── Print / Design Studio modal ── */}
      {studioState.open && (
        <PrintDesignStudio
          onClose={() => setStudioState({ open: false })}
          userEmail="bullmoneytraders@gmail.com"
          initialTab={studioState.tab}
          initialProductId={studioState.productId}
          initialArtId={studioState.artId}
          initialProductType={studioState.productType}
        />
      )}

      {/* ── Checkout modal ── */}
      <StoreCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        checkoutProduct={checkoutProduct}
        paymentMethod={paymentMethod}
        onSelectPaymentMethod={setPaymentMethod}
        onConfirm={handleCheckoutAction}
        formatPrice={formatPrice}
        isVipProduct={isVipProduct}
      />

      {/* ── Product viewer portal ── */}
      {viewerProduct && viewerMounted && (
        <StoreProductViewerPortal
          viewerProduct={viewerProduct}
          viewerMedia={viewerMedia}
          onClose={() => setViewerProduct(null)}
        />
      )}
    </div>
  );
}

export default StorePageClient;
