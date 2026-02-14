'use client';

import dynamic from 'next/dynamic';

// ✅ PERF: Inline shimmer components instead of importing UnifiedShimmer (1,561 lines)
// Only ShimmerSpinner and ShimmerRadialGlow were used — inline them to save compile time
const ShimmerSpinner = ({ size = 48, color = "white" }: { size?: number; color?: string }) => (
  <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTop: `2px solid ${color}`, borderRadius: '50%', animation: 'bm-spin 0.8s linear infinite' }} />
);
const ShimmerRadialGlow = ({ color = "white", intensity = "low" }: { color?: string; intensity?: string }) => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${color}${intensity === 'low' ? '0a' : '1a'} 0%, transparent 70%)` }} />
);

// ============================================================================
// ✅ PRODUCTION OPTIMIZED DYNAMIC IMPORTS - Priority-based loading
// Matches app/page.tsx patterns: webpackChunkName, webpackPrefetch, shimmer fallbacks
// ============================================================================

// Lightweight shimmer fallback matching home page style
const ShimmerFallback = () => (
  <div className="w-full h-24 flex items-center justify-center">
    <ShimmerSpinner size={24} color="white" />
  </div>
);

// CRITICAL - Load immediately (above the fold)
export const CookieConsent = dynamic(
  () => import(/* webpackChunkName: "store-cookie" */ '@/components/CookieConsent'),
  { ssr: false, loading: () => null }
);

export const SearchAutocomplete = dynamic(
  () => import(/* webpackChunkName: "store-search", webpackPrefetch: true */ '@/components/shop/SearchAutocomplete').then(mod => mod.SearchAutocomplete),
  { ssr: false, loading: () => null }
);

// HIGH PRIORITY - Load after initial render (visible on first screen)
export const StoreHero3D = dynamic(
  () => import(/* webpackChunkName: "store-hero-3d", webpackPrefetch: true */ '@/components/shop/StoreHero3D').then(mod => ({ default: mod.StoreHero3D })),
  { ssr: false, loading: () => <div className="w-full h-100 bg-linear-to-b from-black via-zinc-900/50 to-black flex items-center justify-center"><ShimmerRadialGlow color="white" intensity="low" /><ShimmerSpinner size={48} color="white" /></div> }
);

export const MarketPriceTicker = dynamic(
  () => import(/* webpackChunkName: "store-ticker", webpackPrefetch: true */ '@/components/shop/MarketPriceTicker'),
  { ssr: false, loading: () => <div className="h-12 bg-black/50" /> }
);

// MEDIUM PRIORITY - Load when needed (interactive elements)
export const ProductCard = dynamic(
  () => import(/* webpackChunkName: "store-product-card" */ '@/components/shop/ProductCard').then(mod => mod.ProductCard),
  { ssr: false, loading: () => <div className="bg-white/5 animate-pulse aspect-3/4 rounded-2xl" /> }
);

export const FilterSheet = dynamic(
  () => import(/* webpackChunkName: "store-filters" */ '@/components/shop/FilterSheet').then(mod => mod.FilterSheet),
  { ssr: false, loading: () => null }
);

// LOW PRIORITY - Defer until viewport or interaction (below fold)
export const ProductsCarousel = dynamic(
  () => import(/* webpackChunkName: "store-carousel" */ '@/components/shop/ProductsCarousel'),
  { ssr: false, loading: () => <ShimmerFallback /> }
);

export const CircularProductGrid = dynamic(
  () => import(/* webpackChunkName: "store-circular-grid" */ '@/components/shop/CircularProductGrid'),
  { ssr: false, loading: () => <ShimmerFallback /> }
);

export const AnimatedProductGrid = dynamic(
  () => import(/* webpackChunkName: "store-animated-grid" */ '@/components/shop/AnimatedProductGrid'),
  { ssr: false, loading: () => <ShimmerFallback /> }
);

export const HoverEffect = dynamic(
  () => import(/* webpackChunkName: "store-hover" */ '@/components/ui/card-hover-effect').then(mod => mod.HoverEffect),
  { ssr: false, loading: () => null }
);

export const FocusCards = dynamic(
  () => import(/* webpackChunkName: "store-focus-cards" */ '@/components/ui/focus-cards').then(mod => mod.FocusCards),
  { ssr: false, loading: () => <ShimmerFallback /> }
);

export const FeaturedProductsTimeline = dynamic(
  () => import(/* webpackChunkName: "store-timeline" */ '@/components/shop/FeaturedProductsTimeline').then(mod => mod.FeaturedProductsTimeline),
  { ssr: false, loading: () => <ShimmerFallback /> }
);

export const GlassProductGrid = dynamic(
  () => import(/* webpackChunkName: "store-glass-grid" */ '@/components/shop/GlassProductGrid').then(mod => mod.GlassProductGrid),
  { ssr: false, loading: () => <ShimmerFallback /> }
);

// DEFERRED - Load on demand only (heavy 3D / below fold)
export const WorldMap = dynamic(
  () => import(/* webpackChunkName: "store-world-map" */ '@/components/ui/world-map'),
  { ssr: false, loading: () => <div className="h-screen bg-black" /> }
);

export const InfiniteMenu = dynamic(
  () => import(/* webpackChunkName: "store-infinite-menu" */ '@/components/InfiniteMenu'),
  { ssr: false, loading: () => <div className="h-screen bg-black" /> }
);

export const FlyingPosters = dynamic(
  () => import(/* webpackChunkName: "store-flying-posters" */ '@/components/FlyingPosters'),
  { ssr: false, loading: () => <div className="h-screen bg-black" /> }
);

export const StoreFluidGlassSection = dynamic(
  () => import(/* webpackChunkName: "store-fluid-glass" */ '@/components/shop/StoreFluidGlassSection'),
  { ssr: false, loading: () => <div className="h-screen bg-black/50" /> }
);

export const StoreFooter = dynamic(
  () => import(/* webpackChunkName: "store-footer" */ '@/components/shop/StoreFooter'),
  { ssr: false, loading: () => <div className="h-48 bg-black/50" /> }
);

export const RewardsCardBanner = dynamic(
  () => import(/* webpackChunkName: "store-rewards-banner" */ '@/components/RewardsCardBanner'),
  { ssr: false, loading: () => null }
);

export const RewardsCard = dynamic(
  () => import(/* webpackChunkName: "store-rewards-card" */ '@/components/RewardsCard'),
  { ssr: false, loading: () => null }
);

// MOTION - Only load when animations are triggered
export const MotionDiv = dynamic(
  () => import(/* webpackChunkName: "framer-motion" */ 'framer-motion').then(mod => {
    const { motion } = mod;
    return { default: motion.div };
  }),
  { ssr: false }
);

export const AnimatePresence = dynamic(
  () => import(/* webpackChunkName: "framer-motion" */ 'framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
);
