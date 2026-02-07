'use client';

import dynamic from 'next/dynamic';

// ============================================================================
// PRODUCTION OPTIMIZED DYNAMIC IMPORTS - Priority-based loading
// ============================================================================

// CRITICAL - Load immediately (above the fold)
export const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { 
  ssr: false,
  loading: () => null,
});

export const SearchAutocomplete = dynamic(() => import('@/components/shop/SearchAutocomplete').then(mod => mod.SearchAutocomplete), { 
  ssr: false,
  loading: () => null,
});

// HIGH PRIORITY - Load after initial render (visible on first screen)
export const StoreHero3D = dynamic(() => import('@/components/shop/StoreHero3D').then(mod => ({ default: mod.StoreHero3D })), {
  ssr: false,
  loading: () => <div className="w-full h-100 bg-linear-to-b from-black via-zinc-900/50 to-black" />
});

export const MarketPriceTicker = dynamic(() => import('@/components/shop/MarketPriceTicker'), { 
  ssr: false,
  loading: () => <div className="h-12 bg-black/50" />
});

// MEDIUM PRIORITY - Load when needed (interactive elements)
export const ProductCard = dynamic(() => import('@/components/shop/ProductCard').then(mod => mod.ProductCard), { 
  ssr: false,
  loading: () => <div className="bg-white/5 animate-pulse aspect-3/4 rounded-2xl" />
});

export const FilterSheet = dynamic(() => import('@/components/shop/FilterSheet').then(mod => mod.FilterSheet), { 
  ssr: false,
  loading: () => null,
});

// LOW PRIORITY - Defer until viewport or interaction (below fold)
export const ProductsCarousel = dynamic(() => import('@/components/shop/ProductsCarousel'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-black/50 animate-pulse rounded-3xl" />
});

export const CircularProductGrid = dynamic(() => import('@/components/shop/CircularProductGrid'), { 
  ssr: false,
  loading: () => <div className="h-screen bg-black/50 animate-pulse" />
});

export const AnimatedProductGrid = dynamic(() => import('@/components/shop/AnimatedProductGrid'), { 
  ssr: false,
  loading: () => <div className="h-screen bg-black/50 animate-pulse" />
});

export const HoverEffect = dynamic(() => import('@/components/ui/card-hover-effect').then(mod => mod.HoverEffect), { 
  ssr: false,
  loading: () => null,
});

export const FocusCards = dynamic(() => import('@/components/ui/focus-cards').then(mod => mod.FocusCards), { 
  ssr: false,
  loading: () => <div className="h-96 bg-black/50 animate-pulse rounded-3xl" />
});

export const FeaturedProductsTimeline = dynamic(() => import('@/components/shop/FeaturedProductsTimeline').then(mod => mod.FeaturedProductsTimeline), { 
  ssr: false,
  loading: () => <div className="h-96 bg-black/50 animate-pulse rounded-3xl" />
});

export const GlassProductGrid = dynamic(() => import('@/components/shop/GlassProductGrid').then(mod => mod.GlassProductGrid), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-black/50 animate-pulse rounded-3xl" />
});

// DEFERRED - Load on demand only
export const WorldMap = dynamic(() => import('@/components/ui/world-map'), { 
  ssr: false,
  loading: () => <div className="h-screen bg-black" />
});

export const StoreFluidGlassSection = dynamic(() => import('@/components/shop/StoreFluidGlassSection'), { 
  ssr: false,
  loading: () => <div className="h-screen bg-black/50" />
});

export const StoreFooter = dynamic(() => import('@/components/shop/StoreFooter'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-black/50" />
});

export const RewardsCardBanner = dynamic(() => import('@/components/RewardsCardBanner'), { 
  ssr: false,
  loading: () => null,
});

export const RewardsCard = dynamic(() => import('@/components/RewardsCard'), { 
  ssr: false,
  loading: () => null,
});

// MOTION - Only load when animations are triggered
export const MotionDiv = dynamic(() => import('framer-motion').then(mod => {
  const { motion } = mod;
  return { default: motion.div };
}), { ssr: false });

export const AnimatePresence = dynamic(() => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })), { ssr: false });
