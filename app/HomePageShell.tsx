"use client";

import Image from "next/image";

export default function HomePageShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Inline critical CSS to avoid FOUC */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bm-shell-spin { to { transform: rotate(360deg); } }
        @keyframes bm-shell-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .bm-shell-pulse { animation: bm-shell-pulse 1.5s ease-in-out infinite; }
      `}} />

      {/* Header skeleton - matches StoreHeader height */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-black/80 backdrop-blur-xl border-b border-white/5">
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
            <span className="text-sm font-semibold tracking-tight text-white/90">BullMoney</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-7 rounded-full bg-white/5 bm-shell-pulse" />
            <div className="w-8 h-8 rounded-full bg-white/5 bm-shell-pulse" />
          </div>
        </div>
      </div>

      {/* Hero section skeleton - matches actual hero dimensions */}
      <div
        className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-14 md:pt-16"
        style={{ contain: "layout style paint" }}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black"
          aria-hidden="true"
        />

        {/* Logo and loading - positioned for LCP optimization */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-4">
          {/* Logo - critical for LCP */}
          <div className="relative w-48 h-14 md:w-64 md:h-20">
            <Image
              src="/bullmoney-logo.png"
              alt="BullMoney - Free Trading Community"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 192px, 256px"
              className="object-contain"
            />
          </div>

          {/* Tagline - helps with SEO and perceived performance */}
          <p className="text-sm md:text-base text-white/60 text-center max-w-md">
            Free Trading Community • Crypto • Gold • Forex
          </p>

          {/* Loading indicator */}
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <div
              className="w-4 h-4 border-2 border-white/15 border-t-white/60 rounded-full"
              style={{ animation: "bm-shell-spin 0.8s linear infinite" }}
            />
            <span>Loading experience...</span>
          </div>
        </div>

        {/* Decorative radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Below-fold skeleton content - helps with CLS */}
      <div className="bg-black px-4 py-12 space-y-8" style={{ contain: "layout style paint" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="max-w-7xl mx-auto rounded-2xl bg-white/[0.02] border border-white/5 p-6"
            style={{ minHeight: 200, contentVisibility: "auto", containIntrinsicSize: "auto 200px" }}
          >
            <div className="w-32 h-3 bg-white/5 rounded bm-shell-pulse mb-4" />
            <div className="w-48 h-6 bg-white/5 rounded bm-shell-pulse mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="aspect-video rounded-lg bg-white/[0.03] bm-shell-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
