"use client";

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

// ✅ STATIC SHELL: Instant content for fast FCP/LCP
// Renders immediately while heavy store logic loads
function StorePageShell() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Store header placeholder - 48px height */}
      <div className="h-12 bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image
                src="/bullmoney-logo.png"
                alt="BullMoney"
                fill
                priority
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold tracking-tight">Store</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-black/5 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-black/5 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Hero section skeleton */}
      <div className="relative w-full bg-linear-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col items-center text-center gap-6">
            {/* Logo for LCP */}
            <div className="relative w-40 h-12 md:w-55 md:h-[66px]">
              <Image
                src="/bullmoney-logo.png"
                alt="BullMoney Store"
                fill
                priority
                sizes="(max-width: 768px) 160px, 220px"
                className="object-contain"
              />
            </div>
            
            {/* Headline */}
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-black/90">
              Premium Trading Lifestyle
            </h1>
            
            <p className="text-sm md:text-base text-black/60 max-w-md">
              Shop exclusive apparel, accessories, and gear
            </p>
            
            {/* Loading indicator */}
            <div className="flex items-center gap-2 text-black/40 text-sm mt-4">
              <div 
                className="w-4 h-4 border-2 border-black/10 border-t-black/50 rounded-full"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
              <span>Loading products...</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Products grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="aspect-3/4 rounded-2xl bg-black/5 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function StorePage() {
  return <StorePageClient />;
}
