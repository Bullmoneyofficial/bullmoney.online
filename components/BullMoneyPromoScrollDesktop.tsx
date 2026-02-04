// Component added by Ansh - github.com/ansh-dhanani
// Desktop optimized version

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import GradualBlur from './GradualBlur';

export default function BullMoneyPromoScrollDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
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
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  // Smooth easing function for better animation
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedProgress = easeOutCubic(scrollProgress);
  
  // Calculate dynamic values based on eased scroll progress
  const opacity = Math.min(easedProgress * 1.5, 1);
  const scale = 0.95 + (easedProgress * 0.05);
  const translateY = (1 - easedProgress) * 80;
  
  // Blur position moves from top to bottom as user scrolls
  const blurTopPosition = easedProgress * 100;
  const blurOpacity = isVisible ? 1 : 0;
  
  // Bottom blur fades out as user scrolls
  const bottomBlurOpacity = Math.max(1 - easedProgress * 1.5, 0);

  return (
    <section 
      ref={containerRef}
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        position: 'relative',
        minHeight: '120vh',
        padding: '10rem 4rem',
        backgroundColor: '#000000'
      }}
    >
      {/* Animated background gradient - matching mobile style */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at ${50 + easedProgress * 10}% ${50 - easedProgress * 10}%, rgba(255,255,255,0.1), transparent 70%)`,
          opacity: opacity * 0.5
        }}
      />

      {/* Main content container */}
      <div 
        className="relative z-10 w-full max-w-7xl mx-auto text-center px-8"
        style={{
          transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
          opacity: opacity,
          willChange: 'transform, opacity'
        }}
      >
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-3 px-6 py-3 mb-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl"
          style={{
            transform: `translate3d(0, ${(1 - easedProgress) * 30}px, 0)`,
            opacity: opacity
          }}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-semibold tracking-wider uppercase text-white/80">
            Live Trading Community
          </span>
        </div>

        {/* Main heading with gradient */}
        <h2 
          className="font-black tracking-tight mb-8"
          style={{
            fontSize: 'clamp(3.5rem, 8vw, 8rem)',
            lineHeight: '1.05',
            background: 'linear-gradient(180deg, #ffffff 0%, #888888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transform: `translate3d(0, ${(1 - easedProgress) * 40}px, 0)`,
            opacity: opacity
          }}
        >
          We Are The Future
        </h2>

        {/* Subheading */}
        <p 
          className="font-bold mb-10"
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 3.5rem)',
            lineHeight: '1.2',
            color: 'rgba(255, 255, 255, 0.7)',
            transform: `translate3d(0, ${(1 - easedProgress) * 50}px, 0)`,
            opacity: opacity * 0.9
          }}
        >
          of Trading Communities
        </p>

        {/* Description */}
        <p 
          className="max-w-4xl mx-auto mb-14 leading-relaxed"
          style={{
            fontSize: 'clamp(1.125rem, 1.8vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.6)',
            transform: `translate3d(0, ${(1 - easedProgress) * 60}px, 0)`,
            opacity: opacity * 0.8
          }}
        >
          Our trades are <span style={{ color: '#ffffff', fontWeight: 600 }}>unmatched</span>. 
          Join thousands of successful traders who trust our signals, analysis, and mentorship.
        </p>

        {/* Stats grid */}
        <div 
          className="grid grid-cols-3 gap-8 max-w-5xl mx-auto mb-14"
          style={{
            transform: `translate3d(0, ${(1 - easedProgress) * 70}px, 0)`,
            opacity: opacity * 0.9
          }}
        >
          <div 
            className="p-8 rounded-2xl"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="text-5xl lg:text-6xl font-black text-white mb-3">10K+</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Active Traders</div>
          </div>
          <div 
            className="p-8 rounded-2xl"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="text-5xl lg:text-6xl font-black text-white mb-3">95%</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Win Rate</div>
          </div>
          <div 
            className="p-8 rounded-2xl"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="text-5xl lg:text-6xl font-black text-white mb-3">24/7</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Support</div>
          </div>
        </div>

        {/* CTA Button */}
        <div 
          style={{
            transform: `translate3d(0, ${(1 - easedProgress) * 80}px, 0)`,
            opacity: opacity
          }}
        >
          <a
            href="https://t.me/addlist/gg09afc4lp45YjQ0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-bold shadow-2xl hover:scale-105 transition-transform duration-300"
            style={{ fontSize: '1.25rem' }}
          >
            <span>Join BullMoney Now</span>
            <svg 
              className="w-6 h-6" 
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

        {/* Floating elements - simplified for performance */}
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '-15%',
            left: '-5%',
            width: '20rem',
            height: '20rem',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%)',
            filter: 'blur(40px)',
            transform: `translate3d(${easedProgress * 60}px, ${easedProgress * -30}px, 0)`,
            opacity: opacity * 0.3
          }}
        />
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            bottom: '-15%',
            right: '-5%',
            width: '24rem',
            height: '24rem',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1), transparent 70%)',
            filter: 'blur(40px)',
            transform: `translate3d(${easedProgress * -60}px, ${easedProgress * 30}px, 0)`,
            opacity: opacity * 0.3
          }}
        />
      </div>

      {/* Dynamic GradualBlur that moves from top to bottom with scroll */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          transform: `translate3d(0, ${blurTopPosition}%, 0)`,
          opacity: blurOpacity,
          willChange: 'transform, opacity'
        }}
      >
        <GradualBlur
          target="parent"
          position="top"
          height="35vh"
          strength={3}
          divCount={6}
          curve="bezier"
          exponential
          opacity={1}
        />
      </div>

      {/* Bottom blur for smooth exit - fades out with scroll */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          opacity: bottomBlurOpacity,
          willChange: 'opacity'
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
