"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// ✅ PERF: SSR-rendered static shell for instant FCP/LCP
const StorePageClient = dynamic(
  () => import("./StorePageClient").then(m => ({ default: m.StorePageClient })),
  { 
    ssr: false, 
    loading: () => <StorePageShell />
  }
);

// ✅ HYDRATION OPTIMIZED: Tracks mount state for progressive enhancement
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  return hasMounted;
}

// ✅ STATIC SHELL: Instant content for fast FCP/LCP
// Renders immediately while heavy store logic loads
// Enhanced with more meaningful skeleton content to reduce perceived loading time
function StorePageShell() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Inline critical CSS to avoid FOUC */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bm-store-spin { to { transform: rotate(360deg); } }
        @keyframes bm-store-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        .bm-store-pulse { animation: bm-store-pulse 1.5s ease-in-out infinite; }
      `}} />
      
      {/* Store header placeholder - matches actual header */}
      <div className="h-14 bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image
                src="/bullmoney-logo.png"
                alt="BullMoney"
                fill
                priority
                fetchPriority="high"
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold tracking-tight">Store</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Search placeholder */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.03] border border-black/5 w-48">
              <div className="w-4 h-4 rounded bg-black/10" />
              <span className="text-xs text-black/40">Search...</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/5 bm-store-pulse" />
            <div className="w-8 h-8 rounded-full bg-black/5 bm-store-pulse" />
          </div>
        </div>
      </div>
      
      {/* Hero section skeleton - enhanced with gradient */}
      <div 
        className="relative w-full bg-gradient-to-b from-white via-gray-50/50 to-white"
        style={{ contain: 'layout style paint' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col items-center text-center gap-6">
            {/* Logo for LCP - critical element */}
            <div className="relative w-40 h-12 md:w-52 md:h-16">
              <Image
                src="/bullmoney-logo.png"
                alt="BullMoney Store"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 160px, 208px"
                className="object-contain"
              />
            </div>
            
            {/* Headline - SEO optimized */}
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-black/90">
              Premium Trading Lifestyle
            </h1>
            
            <p className="text-sm md:text-base text-black/60 max-w-md">
              Shop exclusive apparel, accessories, and gear for traders
            </p>
            
            {/* Category pills skeleton */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {['All', 'Apparel', 'Accessories', 'Digital'].map((cat, i) => (
                <div 
                  key={cat}
                  className="px-4 py-2 rounded-full bg-black/[0.03] border border-black/5 text-xs font-medium text-black/40"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {cat}
                </div>
              ))}
            </div>
            
            {/* Loading indicator */}
            <div className="flex items-center gap-2 text-black/40 text-sm mt-4">
              <div 
                className="w-4 h-4 border-2 border-black/10 border-t-black/40 rounded-full"
                style={{ animation: 'bm-store-spin 0.8s linear infinite' }}
              />
              <span>Loading products...</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Products grid skeleton - enhanced with realistic aspect ratios */}
      <div 
        className="max-w-7xl mx-auto px-4 py-8"
        style={{ contain: 'layout style paint' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="group flex flex-col rounded-2xl bg-black/[0.02] border border-black/5 overflow-hidden"
              style={{ 
                animationDelay: `${i * 50}ms`,
                contentVisibility: i > 3 ? 'auto' : 'visible',
                containIntrinsicSize: 'auto 380px'
              }}
            >
              {/* Product image skeleton */}
              <div className="aspect-square bg-black/[0.03] bm-store-pulse" />
              {/* Product info skeleton */}
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-black/5 rounded bm-store-pulse" />
                <div className="h-3 w-1/2 bg-black/[0.03] rounded bm-store-pulse" />
                <div className="h-5 w-1/3 bg-black/5 rounded-full bm-store-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Additional sections skeleton - helps with CLS */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" style={{ contain: 'layout style paint' }}>
        {/* Featured section skeleton */}
        <div 
          className="rounded-2xl bg-black/[0.02] border border-black/5 p-6"
          style={{ minHeight: 200, contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}
        >
          <div className="w-24 h-3 bg-black/5 rounded bm-store-pulse mb-3" />
          <div className="w-40 h-6 bg-black/5 rounded bm-store-pulse mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((j) => (
              <div key={j} className="w-40 shrink-0 aspect-square rounded-xl bg-black/[0.03] bm-store-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const hasMounted = useHasMounted();
  
  // Show shell immediately, then swap to client component after mount
  // This prevents hydration mismatches and ensures fastest FCP
  if (!hasMounted) {
    return <StorePageShell />;
  }
  
  return (
    <Suspense fallback={<StorePageShell />}>
      <StorePageClient />
    </Suspense>
  );
}
