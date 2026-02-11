"use client";

import dynamic from 'next/dynamic';
import { CardSkeleton } from '@/components/MobileLazyLoadingFallback';
import { useMobileLazyRender } from '@/hooks/useMobileLazyRender';

// ✅ LAZY LOAD PRODUCTS SECTION - Mobile optimized
const ProductsSection = dynamic(
  () => import("@/components/ProductsSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }
);

export default function ProductsPage() {
  const { shouldRender } = useMobileLazyRender(220);

  return (
    <main>
      {shouldRender ? (
        <ProductsSection />
      ) : (
        <div className="min-h-screen pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
