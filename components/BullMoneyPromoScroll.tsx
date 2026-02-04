// Component added by Ansh - github.com/ansh-dhanani
// Mobile optimized version

"use client";

import { useEffect, useRef, useState } from 'react';
import GradualBlur from './GradualBlur';

export default function BullMoneyPromoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;
      
      // Calculate when element enters viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        setIsVisible(true);
        
        // Calculate scroll progress through the element
        const scrolled = windowHeight - rect.top;
        const total = windowHeight + elementHeight;
        const progress = Math.min(Math.max(scrolled / total, 0), 1);
        setScrollProgress(progress);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate dynamic values based on scroll progress
  const opacity = Math.min(scrollProgress * 2, 1);
  const scale = 0.9 + (scrollProgress * 0.1);
  const translateY = (1 - scrollProgress) * 100;
  
  // Blur position moves from top to bottom as user scrolls
  const blurTopPosition = scrollProgress * 100; // 0% to 100%
  const blurOpacity = isVisible ? 1 : 0;
  
  // Bottom blur fades out as user scrolls
  const bottomBlurOpacity = Math.max(1 - scrollProgress * 2, 0);

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
          background: `radial-gradient(circle at ${50 + scrollProgress * 10}% ${50 - scrollProgress * 10}%, rgba(255,255,255,0.1), transparent 70%)`,
          opacity: opacity * 0.5
        }}
      />

      {/* Main content container */}
      <div 
        className="relative z-10 max-w-5xl mx-auto text-center"
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          opacity: opacity,
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
        }}
      >
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl"
          style={{
            transform: `translateY(${(1 - scrollProgress) * 30}px)`,
            opacity: opacity
          }}
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
            backgroundClip: 'text',
            transform: `translateY(${(1 - scrollProgress) * 50}px)`,
            opacity: opacity
          }}
        >
          We Are The Future
        </h2>

        {/* Subheading */}
        <p 
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white/70 mb-8"
          style={{
            transform: `translateY(${(1 - scrollProgress) * 60}px)`,
            opacity: opacity * 0.9
          }}
        >
          of Trading Communities
        </p>

        {/* Description */}
        <p 
          className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed"
          style={{
            transform: `translateY(${(1 - scrollProgress) * 70}px)`,
            opacity: opacity * 0.8
          }}
        >
          Our trades are <span className="text-white font-semibold">unmatched</span>. 
          Join thousands of successful traders who trust our signals, analysis, and mentorship.
        </p>

        {/* Stats grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12"
          style={{
            transform: `translateY(${(1 - scrollProgress) * 80}px)`,
            opacity: opacity * 0.9
          }}
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
        <div 
          style={{
            transform: `translateY(${(1 - scrollProgress) * 90}px)`,
            opacity: opacity
          }}
        >
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
            transform: `translate(${scrollProgress * 100}px, ${scrollProgress * -50}px)`,
            opacity: opacity * 0.3
          }}
        />
        <div 
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"
          style={{
            transform: `translate(${scrollProgress * -100}px, ${scrollProgress * 50}px)`,
            opacity: opacity * 0.3
          }}
        />
      </div>

      {/* Dynamic GradualBlur that moves from top to bottom with scroll */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          pointerEvents: 'none',
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          transform: `translateY(${blurTopPosition}%)`,
          opacity: blurOpacity
        }}
      >
        <GradualBlur
          target="parent"
          position="top"
          height="40vh"
          strength={3}
          divCount={8}
          curve="bezier"
          exponential
          opacity={1}
        />
      </div>

      {/* Bottom blur for smooth exit - fades out with scroll */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.1s ease-out',
          opacity: bottomBlurOpacity
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
    </section>
  );
}
