'use client';

/**
 * StoreHeroMedia.tsx
 *
 * Renders the full-bleed hero background based on the resolved slide type:
 *   image | video | world-map | spline
 *
 * Pre-conditions:
 *  - allowHeavyHeroReady gates video / spline / heavy world-map rendering
 *  - onVideoEnded callback signals parent when video finishes (for auto-advance)
 */

import React from 'react';
import { SplineBackground, WorldMapPlaceholder } from '../_lazy/store-dynamics';

type HeroSlide =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; poster?: string; alt?: string }
  | { type: 'world-map' }
  | { type: 'spline'; scene: string };

interface StoreHeroMediaProps {
  slide: HeroSlide;
  allowHeavyHeroReady: boolean;
  onVideoEnded: () => void;
}

export function StoreHeroMedia({
  slide,
  allowHeavyHeroReady,
  onVideoEnded,
}: StoreHeroMediaProps) {
  // ── Spline ────────────────────────────────────────────────────────────────
  if (slide.type === 'spline') {
    return (
      <div
        className="absolute inset-0 z-0 h-full w-full"
        style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
      >
        <SplineBackground
          scene={(slide as any).scene ?? '/scene1.splinecode'}
          className="h-full w-full"
          priority
        />
      </div>
    );
  }

  // ── Static image ──────────────────────────────────────────────────────────
  if (slide.type === 'image') {
    return (
      <img
        src={(slide as any).src}
        alt={(slide as any).alt}
        className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
        style={{ touchAction: 'pan-y' }}
        loading="eager"
        decoding="async"
      />
    );
  }

  // ── Video ─────────────────────────────────────────────────────────────────
  if (slide.type === 'video') {
    // Show poster while heavy assets aren't ready yet
    if (!allowHeavyHeroReady) {
      return (
        <img
          src={(slide as any).poster || '/Img1.jpg'}
          alt="hero"
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
          style={{ touchAction: 'pan-y' }}
          loading="eager"
          decoding="async"
        />
      );
    }
    return (
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
        style={{ touchAction: 'pan-y' }}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="metadata"
        poster={(slide as any).poster}
        onEnded={onVideoEnded}
        onError={onVideoEnded}
      >
        <source src={(slide as any).src} type="video/mp4" />
      </video>
    );
  }

  // ── World map ─────────────────────────────────────────────────────────────
  if (slide.type === 'world-map') {
    if (!allowHeavyHeroReady) {
      return (
        <div
          className="absolute inset-0 z-0 h-full w-full bg-white"
          style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
        />
      );
    }

    return (
      <div
        className="absolute inset-0 z-0 h-full w-full"
        style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
      >
        <div className="absolute inset-0 bg-white">
          <WorldMapPlaceholder className="min-h-0" />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <style>{`
            @keyframes heroLineFlow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -120; } }
            @keyframes heroListPulse { 0%, 100% { opacity: 0.55; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
            @keyframes heroGlow { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.6; } }
          `}</style>
          <div className="absolute left-6 top-6 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
            <p className="text-[10px] uppercase tracking-[0.32em] text-black/45">
              Markets + Sessions
            </p>
            <ul className="mt-2 space-y-1 text-xs font-semibold text-black/70">
              {[
                'Tokyo Session · 00:00-09:00 UTC',
                'London Session · 07:00-16:00 UTC',
                'New York Session · 13:00-22:00 UTC',
                'Crypto · 24/7 Global',
              ].map((item, idx) => (
                <li
                  key={item}
                  style={{
                    animation: 'heroListPulse 6s ease-in-out infinite',
                    animationDelay: `${idx * 0.6}s`,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <svg
            viewBox="0 0 1000 500"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="heroLineBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0A84FF" stopOpacity="0" />
                <stop offset="15%" stopColor="#0A84FF" stopOpacity="0.9" />
                <stop offset="85%" stopColor="#0A84FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              id="route-ny-lon"
              d="M 280 190 Q 460 70 640 170"
              fill="none"
              stroke="url(#heroLineBlue)"
              strokeWidth="2"
              strokeDasharray="10 12"
              style={{ animation: 'heroLineFlow 8s linear infinite' }}
            />
            <path
              id="route-lon-dxb"
              d="M 640 170 Q 700 190 760 240"
              fill="none"
              stroke="url(#heroLineBlue)"
              strokeWidth="2"
              strokeDasharray="10 12"
              style={{ animation: 'heroLineFlow 7s linear infinite' }}
            />
            <path
              id="route-tyo-sg"
              d="M 820 190 Q 760 260 720 300"
              fill="none"
              stroke="url(#heroLineBlue)"
              strokeWidth="2"
              strokeDasharray="10 12"
              style={{ animation: 'heroLineFlow 6s linear infinite' }}
            />
            <g style={{ animation: 'heroGlow 3s ease-in-out infinite' }}>
              <circle cx="280" cy="190" r="4" fill="#0A84FF" />
              <circle cx="640" cy="170" r="4" fill="#0A84FF" />
              <circle cx="760" cy="240" r="4" fill="#0A84FF" />
              <circle cx="820" cy="190" r="4" fill="#0A84FF" />
              <circle cx="720" cy="300" r="4" fill="#0A84FF" />
            </g>
            <g>
              <circle r="7" fill="#0A84FF" opacity="0.9">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#route-ny-lon" />
                </animateMotion>
              </circle>
              <text fontSize="6" fontWeight="700" fill="#000" textAnchor="middle" dy="2">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#route-ny-lon" />
                </animateMotion>
                BTC
              </text>
            </g>
            <g>
              <circle r="7" fill="#0A84FF" opacity="0.9">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.2s">
                  <mpath href="#route-lon-dxb" />
                </animateMotion>
              </circle>
              <text fontSize="6" fontWeight="700" fill="#000" textAnchor="middle" dy="2">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.2s">
                  <mpath href="#route-lon-dxb" />
                </animateMotion>
                ETH
              </text>
            </g>
            <g>
              <circle r="7" fill="#0A84FF" opacity="0.9">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.4s">
                  <mpath href="#route-tyo-sg" />
                </animateMotion>
              </circle>
              <text fontSize="6" fontWeight="700" fill="#000" textAnchor="middle" dy="2">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.4s">
                  <mpath href="#route-tyo-sg" />
                </animateMotion>
                SOL
              </text>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  // ── Fallback: default spline ──────────────────────────────────────────────
  return (
    <div
      className="absolute inset-0 z-0 h-full w-full"
      style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
    >
      <SplineBackground scene="/scene1.splinecode" className="h-full w-full" priority />
    </div>
  );
}
