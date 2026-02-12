'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SAMPLE_PRINT_PRODUCTS } from '@/components/shop/PrintProductsSection';
import { SAMPLE_DIGITAL_ART } from '@/components/shop/DigitalArtSection';

const PrintDesignPromoGrid = dynamic(() => import('@/components/shop/PrintDesignPromoGrid'), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse bg-[#fafafa]" />,
});

const PrintProductsSection = dynamic(
  () => import('@/components/shop/PrintProductsSection').then(m => ({ default: m.PrintProductsSection })),
  { ssr: false, loading: () => <div className="h-80 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);

const DigitalArtSection = dynamic(
  () => import('@/components/shop/DigitalArtSection').then(m => ({ default: m.DigitalArtSection })),
  { ssr: false, loading: () => <div className="h-80 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);

const PrintDesignStudio = dynamic(
  () => import('@/components/shop/PrintDesignStudio').then(m => ({ default: m.PrintDesignStudio })),
  { ssr: false }
);

type StudioOpts = {
  tab?: 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs';
  productId?: string;
  artId?: string;
  productType?: string;
};

export default function DesignPrintSections() {
  const [studioState, setStudioState] = useState<{ open: boolean } & StudioOpts>({ open: false });

  const openStudio = useCallback((opts?: StudioOpts) => {
    setStudioState({ open: true, ...opts });
  }, []);

  return (
    <>
      {/* Print & Design Promo Grid */}
      <PrintDesignPromoGrid onOpenStudio={openStudio} />

      {/* Print Products & Digital Art Section */}
      <section
        id="print-design"
        data-no-theme
        className="relative z-20 w-full min-h-screen flex flex-col justify-center bg-gradient-to-b from-white to-gray-50 border-t border-black/5"
        style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 100vh' }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 py-20 lg:py-28">
          <div className="mb-16 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Expand Your Collection</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-black">Custom Print & Digital Art</h2>
            <p className="mt-3 text-sm sm:text-base text-black/60 max-w-xl mx-auto">Professional printing services and premium digital artwork</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div id="print-products" className="border-r-0 lg:border-r border-black/10 pr-0 lg:pr-10">
              <PrintProductsSection products={SAMPLE_PRINT_PRODUCTS} onOpenStudio={openStudio} />
            </div>
            <div id="digital-art" className="pl-0 lg:pl-6">
              <DigitalArtSection arts={SAMPLE_DIGITAL_ART} onOpenStudio={openStudio} />
            </div>
          </div>
        </div>
      </section>

      {/* Print Design Studio Modal */}
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
    </>
  );
}
