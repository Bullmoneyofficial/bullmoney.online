'use client';

/**
 * StorePrintDesignSection.tsx
 *
 * Full-viewport standalone section displaying Print Products and Digital Art
 * side-by-side (stacked on mobile). Data is lazy-loaded and cached on first access.
 */

import { useMemo } from 'react';
import { Typewriter, FallingWords, SlideInLabel } from '@/components/shop/StoreTextEffects';
import { PrintProductsSection, DigitalArtSection } from '../_lazy/store-dynamics';
import type { StudioOpts } from '../_types/store-page.types';

// ── Module-level lazy data cache ───────────────────────────────────────────────
let _cachedPrintProducts: any[] | null = null;
let _cachedDigitalArt: any[] | null = null;

function getSamplePrintProducts(): any[] {
  if (!_cachedPrintProducts) {
    import('@/components/shop/PrintProductsSection').then((m) => {
      _cachedPrintProducts = m.SAMPLE_PRINT_PRODUCTS;
    });
  }
  return _cachedPrintProducts || [];
}

function getSampleDigitalArt(): any[] {
  if (!_cachedDigitalArt) {
    import('@/components/shop/DigitalArtSection').then((m) => {
      _cachedDigitalArt = m.SAMPLE_DIGITAL_ART;
    });
  }
  return _cachedDigitalArt || [];
}

interface StorePrintDesignSectionProps {
  onOpenStudio: (opts?: StudioOpts) => void;
}

export function StorePrintDesignSection({ onOpenStudio }: StorePrintDesignSectionProps) {
  // Trigger cache warm-up on first render
  const printProducts = useMemo(() => getSamplePrintProducts(), []);
  const digitalArts = useMemo(() => getSampleDigitalArt(), []);

  return (
    <section
      id="print-design"
      data-no-theme
      className="relative z-20 w-full min-h-screen flex flex-col justify-center bg-gradient-to-b from-white to-gray-50 border-t border-black/5"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 100vh' }}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 py-20 lg:py-28">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <SlideInLabel className="text-[11px] uppercase tracking-[0.28em] text-black/45">
            Expand Your Collection
          </SlideInLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-black">
            <Typewriter text="Custom Print & Digital Art" />
          </h2>
          <p className="mt-3 text-sm sm:text-base text-black/60 max-w-xl mx-auto">
            <FallingWords text="Professional printing services and premium digital artwork" />
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left — Print Products */}
          <div id="print-products" className="border-r-0 lg:border-r border-black/10 pr-0 lg:pr-10">
            <PrintProductsSection products={printProducts} onOpenStudio={onOpenStudio} />
          </div>

          {/* Right — Digital Art */}
          <div id="digital-art" className="pl-0 lg:pl-6">
            <DigitalArtSection arts={digitalArts} onOpenStudio={onOpenStudio} />
          </div>
        </div>
      </div>
    </section>
  );
}
