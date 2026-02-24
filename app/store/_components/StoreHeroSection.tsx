'use client';

/**
 * StoreHeroSection.tsx
 *
 * Full-height hero section — renders the hero media background, overlays,
 * and the CTA content (headline, VIP + Shop buttons).
 */

import React from 'react';
import Link from 'next/link';
import { Typewriter, FallingWords, SlideInLabel } from '@/components/shop/StoreTextEffects';
import { WorldMap } from '../_lazy/store-dynamics';
import { StoreHeroMedia } from './StoreHeroMedia';
import { HERO_WORLD_MAP_DOTS } from '../_constants/hero.constants';

interface StoreHeroSectionProps {
  heroRef: React.RefObject<HTMLElement | null>;
  resolvedHeroSlide: any;
  allowHeavyHeroReady: boolean;
  showHeroMapOverlay: boolean;
  onVideoEnded: () => void;
  paddingBoost: number;
  onOpenVip: () => void;
  onVisitShop: () => void;
}

export function StoreHeroSection({
  heroRef,
  resolvedHeroSlide,
  allowHeavyHeroReady,
  showHeroMapOverlay,
  onVideoEnded,
  paddingBoost,
  onOpenVip,
  onVisitShop,
}: StoreHeroSectionProps) {
  const heroIsWorldMap = resolvedHeroSlide?.type === 'world-map';
  const heroTitleColor = 'rgb(255,255,255)';
  const heroMetaColor = 'rgb(255,255,255)';
  const heroBodyColor = 'rgb(255,255,255)';
  const heroTextShadow = heroIsWorldMap ? 'none' : '0 6px 18px rgba(0,0,0,0.45)';
  const heroTitleShadow = heroIsWorldMap ? 'none' : '0 10px 30px rgba(0,0,0,0.5)';
  const heroBodyShadow = heroIsWorldMap ? 'none' : '0 8px 22px rgba(0,0,0,0.4)';
  const shouldShowHeroMapOverlay = allowHeavyHeroReady && showHeroMapOverlay;

  return (
    <section
      ref={heroRef as React.RefObject<HTMLElement>}
      data-apple-section
      data-store-hero
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-visible">
        {/* Hero media background */}
        {resolvedHeroSlide && (
          <StoreHeroMedia
            slide={resolvedHeroSlide}
            allowHeavyHeroReady={allowHeavyHeroReady}
            onVideoEnded={onVideoEnded}
          />
        )}

        {/* Optional world-map overlay (5% chance) */}
        {shouldShowHeroMapOverlay && (
          <div className="absolute inset-0 z-[2] pointer-events-none bg-white/85">
            <WorldMap
              dots={HERO_WORLD_MAP_DOTS as any}
              lineColor="#00D4FF"
              forceVisible
              forceLite
              showCryptoCoins
            />
          </div>
        )}

        {/* Dark overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: 'rgba(0,0,0,0.35)',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />

        {/* Hero content */}
        <div
          className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 sm:px-10 pointer-events-none"
          style={{ paddingTop: 48 + paddingBoost, paddingBottom: 40 + paddingBoost, touchAction: 'pan-y' }}
        >
          <div className="flex items-center gap-3" style={{ color: heroTitleColor, textShadow: heroTextShadow }}>
            <img
              src="/IMG_2921.PNG"
              alt="BullMoney"
              className="h-16 w-auto sm:h-18"
              loading="eager"
              decoding="async"
            />
            <SlideInLabel className="text-[11px] uppercase tracking-[0.32em]" style={{ color: heroMetaColor }}>
              BullMoney Store
            </SlideInLabel>
          </div>

          <h1
            className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight"
            style={{ color: heroTitleColor, textShadow: heroTitleShadow }}
          >
            <Typewriter text="Premium trading essentials, built for focus." />
          </h1>

          <p
            className="mt-4 max-w-2xl text-sm sm:text-base"
            style={{ color: heroBodyColor, textShadow: heroBodyShadow }}
          >
            <FallingWords
              text="Clean materials, calm layouts, and purposeful gear for traders who value clarity."
              delay={0.3}
            />
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 pointer-events-auto sm:flex-row lg:flex-col lg:items-start lg:w-full">
            <button
              type="button"
              onClick={onOpenVip}
              className="rounded-full border-2 border-white/40 bg-white/10 px-5 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.08em] !text-white backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
            >
              GET VIP
            </button>
            <button
              type="button"
              onClick={onVisitShop}
              className="rounded-full border-2 px-5 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.08em] text-white transition-transform duration-200 hover:-translate-y-0.5 lg:self-end"
              style={{
                background: 'linear-gradient(135deg, rgba(41, 151, 255, 0.2), rgba(41, 151, 255, 0.1))',
                borderColor: 'rgba(41, 151, 255, 0.45)',
              }}
            >
              Visit Shop
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
