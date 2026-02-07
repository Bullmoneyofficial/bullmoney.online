// Component added by Ansh - github.com/ansh-dhanani
// Mobile optimized version

"use client";

import { useRef } from 'react';
import GradualBlur from './GradualBlur';

export default function BullMoneyPromoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black"
      style={{
        position: 'relative',
        padding: '6rem 1.5rem'
      }}
    >
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1), transparent 70%)',
          opacity: 0.5
        }}
      />

      {/* Main content container */}
      <div 
        className="relative z-10 max-w-5xl mx-auto text-center"
        style={{
          paddingTop: '20vh'
        }}
      >
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-white/80">
            Live Trading Community
          </span>
        </div>

        {/* Main heading with gradient */}
        <h2 
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #888888)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          We Are The Future
        </h2>

        {/* Subheading */}
        <p 
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white/70 mb-8"
        >
          of Trading Communities
        </p>

        {/* Description */}
        <p 
          className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Our trades are <span className="text-white font-semibold">unmatched</span>. 
          Join thousands of successful traders who trust our signals, analysis, and mentorship.
        </p>

        {/* Stats grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12"
        >
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="text-4xl sm:text-5xl font-black text-white mb-2">10K+</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Active Traders</div>
          </div>
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="text-4xl sm:text-5xl font-black text-white mb-2">95%</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Win Rate</div>
          </div>
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="text-4xl sm:text-5xl font-black text-white mb-2">24/7</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Support</div>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          <a
            href="https://t.me/addlist/gg09afc4lp45YjQ0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black text-lg font-bold shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            <span>Join BullMoney Now</span>
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </a>
        </div>

        {/* Floating elements */}
          <div 
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"
          style={{
            opacity: 0.3
          }}
        />
        <div 
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"
          style={{
            opacity: 0.3
          }}
        />
      </div>

      {/* Top blur - 100% blur fading to 0 at title */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20vh',
          background: 'linear-gradient(to bottom, #000000 0%, #000000 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.3) 85%, transparent 100%)',
          backdropFilter: 'blur(50px)',
          WebkitBackdropFilter: 'blur(50px)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />

      {/* Bottom blur */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none'
        }}
      >
        <GradualBlur
          target="parent"
          position="bottom"
          height="7rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential
          opacity={1}
        />
      </div>

      {/* Left edge blur - text aware */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '35vw',
          background: 'linear-gradient(to right, #000000 0%, #000000 30%, rgba(0,0,0,0.95) 60%, transparent 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />

      {/* Right edge blur - text aware */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '35vw',
          background: 'linear-gradient(to left, #000000 0%, #000000 30%, rgba(0,0,0,0.95) 60%, transparent 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />

      {/* Full vignette overlay to hide all edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 70%, #000000 100%)',
          pointerEvents: 'none',
          zIndex: 6
        }}
      />
    </section>
  );
}
