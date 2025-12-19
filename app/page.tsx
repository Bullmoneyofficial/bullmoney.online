"use client";

import React, { Suspense, useState, useEffect, useRef, useTransition, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spline from '@splinetool/react-spline';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  Volume2, Volume1, VolumeX, X, Palette, Sparkles, MessageCircle,
  ChevronUp, ChevronDown, Info, MousePointer2,
  GripVertical, GripHorizontal, Smartphone, Monitor,
  Layers, Map as MapIcon, Lock, Unlock, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';

// --- INTERACTION UTILITIES ---
import { playClick, playHover, playSwipe, createSwipeHandlers } from '@/lib/interactionUtils';

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar";
import RegisterPage from "./register/pagemode";
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock";
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2";
import InlineFaq from "@/components/Mainpage/InlineFaq";
import { Footer } from "@/components/Mainpage/footer";
import { CrashSafeSplineLoader } from "@/components/Mainpage/CrashSafeSplineLoader";

// --- THEME & MUSIC DATA ---
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';
import { safeGetItem, safeSetItem } from '@/lib/localStorage';

// --- TSX PAGE IMPORTS ---
import ChartNews from "@/app/Blogs/Chartnews";
import ShopScrollFunnel from "@/app/shop/ShopScrollFunnel";
import HeroMain from "@/app/VIP/heromain";
import ProductsSection from "@/app/VIP/ProductsSection";

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false, 
  loading: () => <div className="hidden">Loading...</div> 
});

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { ssr: false }
);

// --- PARTICLE COMPONENT ---
const ParticleEffect = memo(({ trigger }: { trigger: number }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  
  useEffect(() => {
    if (trigger === 0) return;
    
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      color: ['#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#f59e0b'][Math.floor(Math.random() * 5)]
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
    }, 2000);
  }, [trigger]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[500000]">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-particle-float"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            animation: 'particleFloat 2s ease-out forwards'
          }}
        />
      ))}
    </div>
  );
});

// ----------------------------------------------------------------------
// 1. DATA CONFIGURATION
// ----------------------------------------------------------------------
const PAGE_CONFIG = [
  { 
    id: 1, 
    type: 'full', 
    scene: "/scene1.splinecode", 
    label: "HERO",
    encryptedTitle: "X39yRz1_HERO",
    infoTitle: "The Hero Moment",
    infoDesc: "This scene establishes the visual language. We use high-fidelity PBR textures and dramatic lighting to create an unforgettable first impression.",
    funFact: "Did you know? This scene renders at 60fps using advanced GPU optimization techniques!"
  },
  { 
    id: 2, 
    type: 'tsx',
    component: 'ChartNews',
    label: "NEWS",
    encryptedTitle: "N3ws_D4t4_F33d",
    infoTitle: "Latest Market Intelligence",
    infoDesc: "Real-time chart analysis and breaking news from the financial frontier.",
    funFact: "Our AI scans 10,000+ sources per second to bring you the most relevant updates!"
  },
  { 
    id: 3, 
    type: 'full', 
    scene: "/scene.splinecode", 
    label: "SHOWCASE",
    encryptedTitle: "Pr0duct_360_V1ew",
    infoTitle: "Product Showcase",
    infoDesc: "A 360-degree interactive view. Users can drag to rotate and explore every angle of our premium offerings.",
    funFact: "Each model contains over 2 million polygons for photorealistic detail!"
  },
  { 
    id: 4, 
    type: 'tsx',
    component: 'HeroMain',
    label: "VIP ACCESS",
    encryptedTitle: "V1P_Acc3ss_P0rt4l",
    infoTitle: "Exclusive VIP Experience",
    infoDesc: "Enter the world of premium membership. Unlock features that transform your trading journey.",
    funFact: "VIP members gain access to algorithms that predict market movements 72 hours in advance!"
  },
  { 
    id: 5, 
    type: 'full', 
    scene: "/scene3.splinecode", 
    label: "CONCEPT",
    encryptedTitle: "C0nc3pt_Abs7ract",
    infoTitle: "Conceptual Abstraction",
    infoDesc: "Pure form. Physics are ignored in favor of aesthetic balance. This is where art meets technology.",
    disableInteraction: true,
    funFact: "This scene was inspired by non-Euclidean geometry and M.C. Escher's impossible architectures!"
  },
  { 
    id: 6, 
    type: 'split', 
    sceneA: "/scene5.splinecode", 
    sceneB: "/scene4.splinecode", 
    labelA: "WIREFRAME", 
    labelB: "PROTOTYPE",
    encryptedTitle: "D3s1gn_Pr0c3ss",
    infoTitle: "The Split Process",
    infoDesc: "Drag the slider to compare low-fidelity wireframe vs high-fidelity prototype. Witness the transformation from concept to reality.",
    funFact: "This comparison shows 6 months of iterative design compressed into a single interactive moment!"
  },
  { 
    id: 7, 
    type: 'tsx',
    component: 'ProductsSection',
    label: "PRODUCTS",
    encryptedTitle: "Pr0d_C4t4l0g_X1",
    infoTitle: "Product Gallery",
    infoDesc: "Browse our curated collection of trading tools, signals, and automation systems.",
    funFact: "Our products have generated over $100M in combined user profits!"
  },
  { 
    id: 8, 
    type: 'full', 
    scene: "/scene2.splinecode", 
    label: "FINAL",
    encryptedTitle: "F1n4l_R3nd3r",
    infoTitle: "Production Ready",
    infoDesc: "Baked lighting and optimized geometry. Runs at 60fps on devices from 2018 onwards.",
    funFact: "We compressed 8GB of raw assets into just 12MB without quality loss!"
  },
  { 
    id: 9, 
    type: 'tsx',
    component: 'ShopScrollFunnel',
    label: "SHOP",
    encryptedTitle: "Sh0p_Funn3l_V2",
    infoTitle: "Shopping Experience",
    infoDesc: "A scroll-driven funnel that guides you through our offerings with precision.",
    funFact: "This funnel converts 3x better than traditional e-commerce layouts!"
  },
  { 
    id: 10, 
    type: 'full', 
    scene: "/scene6.splinecode", 
    label: "INTERACTIVE",
    encryptedTitle: "1nt3r4ct_M0de",
    infoTitle: "User Agency",
    infoDesc: "The final playground. Physics are enabled. Click, drag, and discover hidden interactions.",
    funFact: "Try throwing objects at 45°—there's a secret Easter egg waiting for you!"
  },
];

const CRITICAL_SPLINE_SCENES = ["/scene1.splinecode", "/scene5.splinecode", "/scene4.splinecode"];

// --- FALLBACK THEME ---
const FALLBACK_THEME: Partial<Theme> = {
    id: 'default',
    name: 'Loading...',
    filter: 'none',
    mobileFilter: 'none',
};

// --- THEME COLOR MAPPING ---
const THEME_ACCENTS: Record<string, string> = {
    't01': '#3b82f6', // Blue
    't02': '#a855f7', // Purple
    't03': '#22c55e', // Green
    't04': '#ef4444', // Red
    't05': '#f59e0b', // Amber
    't06': '#ec4899', // Pink
    't07': '#06b6d4', // Cyan
    'default': '#3b82f6'
};

const getThemeColor = (id: string) => THEME_ACCENTS[id] || THEME_ACCENTS['default'];

// ----------------------------------------------------------------------
// 2. GLOBAL STYLES (Enhanced with new animations)
// ----------------------------------------------------------------------
const GLOBAL_STYLES = `
  :root {
    --apple-font: "SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    --apple-surface: rgba(255,255,255,0.04);
    --apple-border: rgba(255,255,255,0.12);
    --apple-highlight: rgba(255,255,255,0.75);
    --apple-shadow: 0 30px 80px rgba(0,0,0,0.45);
    --apple-gradient: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.08), transparent 35%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.05), transparent 40%);
  }

  body, button, input, textarea {
    font-family: var(--apple-font);
    letter-spacing: -0.01em;
  }

  body {
    background-image: var(--apple-gradient);
    background-color: black;
  }

  .apple-surface {
    background-color: var(--apple-surface);
    border: 1px solid var(--apple-border);
    box-shadow: var(--apple-shadow);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
  }

  .apple-divider {
    height: 1px;
    width: 100%;
    background: linear-gradient(90deg, transparent, var(--apple-border), transparent);
  }

  .apple-cta {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75));
    color: #0f172a;
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  }

  .apple-cta::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0.4), transparent 55%);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .apple-cta:hover::after {
    opacity: 1;
  }

  /* --- MOBILE SCROLL FIXES START --- */
  // FIX #1: Remove fixed positioning that causes scroll issues
  html, body {
    background-color: black;
    overflow: hidden; /* Prevent native window scroll */
    overscroll-behavior-y: none; /* Kill rubber-banding vertically */
    width: 100%;
    height: 100%;
  }

  // FIX #1: Remove snap-scroll on mobile for smooth Instagram/TikTok-like scrolling
  .mobile-scroll {
    overflow-y: auto;
    overflow-x: hidden;
    height: 100dvh; /* Dynamic viewport height */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: none; /* Changed from 'contain' */
  }

  /* Remove scrollbars but keep functionality */
  .mobile-scroll::-webkit-scrollbar { display: none; }
  .mobile-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  // FIX #5: Use min-height for flexibility instead of fixed height
  section {
    width: 100%;
    min-height: 100dvh; /* Changed from fixed height */
    position: relative;
    overflow: hidden;
    will-change: transform;
  }

  /* Desktop only: Enable snap scrolling */
  @media (min-width: 769px) {
    .mobile-scroll {
      scroll-snap-type: y mandatory;
    }
    section {
      scroll-snap-align: start;
      scroll-snap-stop: always;
      height: 100dvh;
    }
  }
  /* --- MOBILE SCROLL FIXES END --- */

  @keyframes spin-border {
    0% { --bg-angle: 0deg; }
    100% { --bg-angle: 360deg; }
  }
  @keyframes particleFloat {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-100vh) scale(0); opacity: 0; }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOutLeft {
    from { transform: translateX(0) scale(1); opacity: 1; }
    to { transform: translateX(-200px) scale(0.5); opacity: 0; }
  }

  @keyframes slideOutRight {
    from { transform: translateX(0) scale(1); opacity: 1; }
    to { transform: translateX(200px) scale(0.5); opacity: 0; }
  }

  .animate-slideOutLeft {
    animation: slideOutLeft 0.5s ease-out forwards;
  }

  .animate-slideOutRight {
    animation: slideOutRight 0.5s ease-out forwards;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes pageFlip {
    0% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
    50% { transform: perspective(1000px) rotateY(90deg); opacity: 0.5; }
    100% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
  }
  
  .shining-border {
    position: relative;
    border-radius: 0.5rem;
    z-index: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .shining-border::before {
    content: "";
    position: absolute;
    inset: -2px;
    z-index: -1;
    background: conic-gradient(
      from var(--bg-angle),
      transparent 0%,
      #0088ff 20%,
      #0000ff 40%,
      transparent 60%
    );
    animation: spin-border 3s linear infinite;
  }
  
  .shining-border::after {
    content: "";
    position: absolute;
    inset: 1px;
    z-index: -1;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 0.5rem;
  }
  
  @property --bg-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
   
  .profit-reveal {
    animation: profitReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes profitReveal {
    0% { transform: scale(1.05); opacity: 0; filter: blur(15px); }
    100% { transform: scale(1); opacity: 1; filter: blur(0px); }
  }
  
  @keyframes music-bar-1 { 0%, 100% { height: 33%; } 50% { height: 100%; } }
  @keyframes music-bar-2 { 0%, 100% { height: 66%; } 50% { height: 33%; } }
  @keyframes music-bar-3 { 0%, 100% { height: 100%; } 50% { height: 66%; } }
  
  .animate-music-bar-1 { animation: music-bar-1 0.8s ease-in-out infinite; }
  .animate-music-bar-2 { animation: music-bar-2 1.1s ease-in-out infinite; }
  .animate-music-bar-3 { animation: music-bar-3 0.9s ease-in-out infinite; }
  
  .shimmer-effect {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .hover-lift {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-5px) scale(1.02);
  }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  html, body { 
    background-color: black; 
    overflow-x: hidden;
    cursor: none; /* Custom cursor */
  }
  
  /* Custom Cursor Trail */
  .cursor-trail {
    position: fixed;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999999;
    mix-blend-mode: screen;
  }
  
  /* Parallax layers */
  .parallax-layer {
    transition: transform 0.1s ease-out;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* ULTRA-OPTIMIZED Mobile performance - Locked 60fps target */
  @media (max-width: 768px) {
    .mobile-optimize {
      will-change: transform;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      -webkit-perspective: 1000;
      perspective: 1000;
    }

    /* GPU-accelerated everything for mobile */
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    /* Optimize heavy animations for mobile - slower = smoother */
    .shining-border::before {
      animation-duration: 6s !important;
      will-change: auto;  /* Remove will-change after animation starts */
    }

    /* Smooth transitions optimized for 60fps with hardware acceleration */
    section {
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: auto;
      transform: translate3d(0, 0, 0);
    }

    /* Reduce layout shifts - force GPU layer */
    button, a, .hover-lift {
      transform: translate3d(0, 0, 0);
      will-change: transform;
      transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    /* Optimize input elements */
    input, select, textarea {
      font-size: 16px !important;  /* Prevent zoom on iOS */
      transform: translateZ(0);
    }

    /* Reduce animation complexity on mobile */
    @keyframes particleFloat {
      0% { opacity: 1; transform: translateY(0) scale(1) translateZ(0); }
      100% { opacity: 0; transform: translateY(-50vh) scale(0.5) translateZ(0); }
    }
  }

  // FIX #1: Remove restrictive touch-action that blocks swipe gestures
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y; /* Removed pinch-zoom restriction */
    overscroll-behavior-y: none; /* Changed from contain */
    scroll-behavior: smooth;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  section {
    touch-action: pan-y; /* Removed pinch-zoom restriction */
    contain: layout style paint;
    /* Ensure smooth rendering in all browsers */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  /* Performance hints */
  .spline-container {
    will-change: transform;
    transform: translateZ(0);
    contain: strict;
    /* Force GPU acceleration on iOS */
    -webkit-transform: translate3d(0,0,0);
    transform: translate3d(0,0,0);
  }

  /* Prevent layout shifts */
  img, video, iframe {
    max-width: 100%;
    height: auto;
  }

  /* Fix for Instagram/TikTok in-app browsers */
  html, body {
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
    position: relative;
  }

  /* Ensure scrolling works like desktop on mobile */
  html {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }

  @media (max-width: 768px) {
    html {
      scroll-snap-type: y proximity; /* Less strict on mobile */
    }
  }
`;

// ----------------------------------------------------------------------
// 3. UI COMPONENTS
// ----------------------------------------------------------------------

const ShineButton = ({ children, onClick, active, className = "", disabled = false }: any) => (
  <button
    onClick={(e) => {
      if (disabled) return;
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(10);
      onClick(e);
    }}
    onTouchStart={(e) => {
      if (disabled) return;
      e.currentTarget.style.transform = 'scale(0.95)';
    }}
    onTouchEnd={(e) => {
      e.currentTarget.style.transform = '';
    }}
    disabled={disabled}
    className={`
      shining-border transition-all duration-300 group hover-lift
      min-w-[44px] min-h-[44px] touch-manipulation select-none
      ${active ? 'scale-110 shadow-[0_0_20px_rgba(0,100,255,0.6)]' : 'opacity-70 hover:opacity-100'}
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
      ${className}
    `}
    style={{
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
    }}
  >
    <div className="relative z-10 w-full h-full flex items-center justify-center text-blue-100">
      {children}
    </div>
  </button>
);

// FIX #3: Add swipe-to-close functionality to OrientationOverlay
const OrientationOverlay = ({ onDismiss }: { onDismiss: () => void }) => {
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(), 4800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Swipe down to close
    if (deltaY > 100) {
      onDismiss();
    }
    touchStartY.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[2000000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-6 relative">
         <Smartphone className="w-16 h-16 text-blue-500 animate-pulse" />
         <div className="absolute top-0 right-0 -mr-4 -mt-2">
            <Monitor className="w-8 h-8 text-white/30" />
         </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">Best Experience in Landscape</h2>
      <p className="text-white/60 max-w-xs mb-8 leading-relaxed">
        Please rotate your device for the full immersive experience.
      </p>
      <button 
        type="button"
        onClick={() => {
          playClickSound();
          onDismiss();
        }} 
        onTouchStart={(e) => {
          e.stopPropagation();
          playClickSound();
          onDismiss();
        }}
        onDoubleClick={onDismiss}
        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-bold text-white transition-colors hover-lift active:scale-95"
      >
          CONTINUE ANYWAY
      </button>
    </div>
  );
};


// Info Panel Component
const InfoPanel = ({ config, isOpen, onClose, accentColor }: any) => {
  const handleClose = useCallback(() => {
    playClick();
    onClose();
  }, [onClose]);

  const swipeHandlers = useMemo(
    () =>
      createSwipeHandlers({
        onSwipeLeft: () => onClose(),
        threshold: 70,
        velocityThreshold: 0.25,
        preventScroll: false,
      }),
    [onClose]
  );

  return (
    <div 
      className={`fixed left-0 top-0 h-full w-[22rem] md:w-[26rem] apple-surface bg-black/70 backdrop-blur-2xl border-r z-[600000] transition-transform duration-500 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ 
        borderColor: `${accentColor}35`, 
        boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
        backgroundImage: `linear-gradient(160deg, ${accentColor}12, rgba(255,255,255,0.02))`,
        touchAction: 'pan-y' 
      }}
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
      onMouseDown={swipeHandlers.onMouseDown}
      onMouseMove={swipeHandlers.onMouseMove}
      onMouseUp={swipeHandlers.onMouseUp}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onTouchStart={(e) => { 
          e.stopPropagation(); 
          handleClose(); 
        }}
        onMouseEnter={() => playHover()}
        className="absolute top-6 right-6 text-white/50 hover:text-white p-2 transition-colors"
        aria-label="Close info panel"
      >
        <X size={24} />
      </button>
    
      <div className="p-8 h-full overflow-y-auto no-scrollbar flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
              <MousePointer2 size={16} style={{ color: accentColor }} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-mono tracking-[0.28em] text-white/60">NOW VIEWING</span>
              <span className="text-sm text-white/80">Scene dossier</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80">
            {config?.label || 'PAGE'}
          </div>
        </div>

        <div className="apple-divider" />

        {/* Main Title */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {config?.infoTitle || 'Information'}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            {config?.infoDesc || 'Description not available'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-white/60 font-mono">
            <Lock className="w-4 h-4" style={{ color: accentColor }} />
            <span className="truncate">{config?.encryptedTitle || 'X39yRz1'}</span>
          </div>
        </div>
        
        {/* Fun Fact Section */}
        {config?.funFact && (
          <div className="rounded-2xl border apple-surface p-4 space-y-2" style={{ 
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}30`
          }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-xs font-bold tracking-[0.2em]" style={{ color: accentColor }}>
                INSIGHT
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {config.funFact}
            </p>
          </div>
        )}
        
        {/* Page Number Badge */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="font-mono tracking-widest">Precision tuned</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-white/50">PAGE</span>
            <span className="text-xl font-bold" style={{ color: accentColor }}>
              {String(config?.id || 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Legacy sound effect helper (deprecated - use playClick from interactionUtils instead)
const playClickSound = playClick;

// ----------------------------------------------------------------------
// 4. MUSIC SYSTEM
// ----------------------------------------------------------------------
const BackgroundMusicSystem = ({ themeId, onReady, volume, trackKey }: { themeId: string; onReady: (player: any) => void; volume: number; trackKey?: number; }) => {
  const videoId = (THEME_SOUNDTRACKS && THEME_SOUNDTRACKS[themeId]) ? THEME_SOUNDTRACKS[themeId] : 'jfKfPfyJRdk';
  const opts: YouTubeProps['opts'] = {
    height: '1', width: '1',
    playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: videoId, modestbranding: 1, playsinline: 1, enablejsapi: 1, origin: typeof window !== 'undefined' ? window.location.origin : undefined },
  };
  return (
    <div key={`music-${themeId}-${trackKey}`} className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1] overflow-hidden w-px h-px">
      <YouTube videoId={videoId} opts={opts} onReady={(e: YouTubeEvent) => { if(e.target) onReady(e.target); }} />
    </div>
  );
};

// ----------------------------------------------------------------------
// 5. ERROR BOUNDARY FOR SPLINE SCENES
// ----------------------------------------------------------------------
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Spline scene error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ----------------------------------------------------------------------
// 6. 3D SCENE WRAPPERS WITH LAZY LOADING
// ----------------------------------------------------------------------
const SceneWrapper = memo(({ isVisible, sceneUrl, allowInput = true, forceNoPointer = false, parallaxOffset = 0, isHeavy = false, disabled = false, skeletonLabel = '', useCrashSafe = false, forceLiteSpline = false, forceLoadOverride = false }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldUnload, setShouldUnload] = useState(false);
  const [mobileOptIn, setMobileOptIn] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();

    // Debounce resize for better performance
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 150);
    };

    window.addEventListener('resize', debouncedResize, { passive: true });
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Load saved opt-in for mobile Spline
  useEffect(() => {
    const savedOptIn = safeGetItem('mobile_spline_opt_in');
    if (savedOptIn === 'true') setMobileOptIn(true);
  }, []);

  // OPTIMIZED: Reduce aggressive loading delays for better mobile performance
  useEffect(() => {
    if (isVisible && !isLoaded && !disabled && (mobileOptIn || !isMobile || forceLiteSpline || forceLoadOverride)) {
      // Ultra-fast loading on all devices for smooth experience
      const delay = isMobile ? (isHeavy ? 150 : 0) : 50;

      // Use requestIdleCallback for non-critical scenes
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window && !isHeavy) {
        const handle = (window as any).requestIdleCallback(() => {
          setIsLoaded(true);
        }, { timeout: delay });
        return () => (window as any).cancelIdleCallback(handle);
      } else {
        const timer = setTimeout(() => setIsLoaded(true), delay);
        return () => clearTimeout(timer);
      }
    }

    // Aggressive memory management: Unload scenes that are far away
    if (!isVisible && isMobile && isLoaded) {
      const unloadTimer = setTimeout(() => {
        setShouldUnload(true);
        setIsLoaded(false);
      }, 800);  // Reduced from 1000ms for faster cleanup
      return () => clearTimeout(unloadTimer);
    }
  }, [isVisible, isLoaded, isMobile, isHeavy, disabled, mobileOptIn, forceLiteSpline, forceLoadOverride]);

  if (isMobile && !mobileOptIn && !forceLiteSpline && !disabled && !forceLoadOverride) {
    return (
      <div
        className="w-full h-full relative transition-opacity duration-700 parallax-layer flex items-center justify-center bg-gradient-to-br from-black via-gray-900/60 to-black"
        style={{ transform: `translateY(${parallaxOffset * 0.4}px) translateZ(0)` }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.12), transparent 45%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.1), transparent 45%)',
          }}
        />
        <div className="relative z-10 text-center space-y-3 px-6 py-6 max-w-md mx-auto rounded-2xl border border-white/10 bg-black/60 backdrop-blur">
          <div className="text-[10px] font-mono text-blue-300/80 tracking-[0.25em]">MOBILE SAFE VIEW</div>
          <div className="text-lg font-semibold text-white">Load 3D Preview?</div>
          <p className="text-white/60 text-sm">
            To avoid Safari/mobile crashes, 3D stays paused. Enable once to load a lightweight version.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setMobileOptIn(true);
                safeSetItem('mobile_spline_opt_in', 'true');
              }}
              className="px-4 py-2 rounded-full bg-blue-500/80 text-white font-semibold text-sm shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:bg-blue-500 active:scale-95 transition-all"
            >
              Enable 3D
            </button>
            <button
              onClick={() => safeSetItem('mobile_spline_opt_in', 'false')}
              className="px-3 py-2 rounded-full border border-white/10 text-white/70 text-xs hover:bg-white/5 active:scale-95 transition-all"
            >
              Keep Safe Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (disabled && !forceLiteSpline && !forceLoadOverride) {
    return (
      <div
        className="w-full h-full relative transition-opacity duration-700 parallax-layer flex items-center justify-center bg-gradient-to-br from-black via-gray-900/60 to-black"
        style={{
          transform: `translateY(${parallaxOffset * 0.5}px) translateZ(0)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.25), transparent 45%), radial-gradient(circle at 70% 80%, rgba(59,130,246,0.18), transparent 50%)',
          }}
        />
        <div className="relative z-10 text-center px-6 py-5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur">
          <div className="text-blue-400/70 font-mono text-[10px] tracking-[0.3em] mb-2">SAFE MODE PREVIEW</div>
          <div className="text-white/90 font-bold text-xl md:text-2xl">
            {skeletonLabel || 'SPLINE SCENE'}
          </div>
          <div className="text-white/40 font-mono text-[10px] mt-2">Skeleton render for mobile stability</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full h-full relative transition-opacity duration-700 parallax-layer spline-container
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${forceNoPointer ? 'pointer-events-none' : (allowInput ? 'pointer-events-auto' : 'pointer-events-none')}
      `}
      style={{
        transform: `translateY(${parallaxOffset * 0.5}px) translateZ(0)`,
        willChange: isVisible ? 'transform' : 'auto'
      }}
    >
      {isVisible && isLoaded && (
        useCrashSafe ? (
          <CrashSafeSplineLoader
            sceneUrl={sceneUrl}
            isVisible={isVisible && isLoaded}
            allowInput={allowInput}
            className="w-full h-full"
          />
        ) : (
          <Suspense fallback={
            <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center text-blue-500/20 font-mono text-[10px]">
              LOADING ASSET...
            </div>
          }>
             <ErrorBoundary fallback={
               <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                 <div className="text-white/60 text-sm font-mono">Scene unavailable</div>
               </div>
             }>
               <Spline
                 scene={sceneUrl}
                 className="w-full h-full block object-cover"
                 style={{
                   transform: 'translateZ(0)',
                   backfaceVisibility: 'hidden',
                   WebkitBackfaceVisibility: 'hidden'
                 }}
               />
             </ErrorBoundary>
          </Suspense>
        )
      )}
      {isVisible && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 to-black/60 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
});

// TSX Component Wrapper - Production Ready
const TSXWrapper = memo(({ componentName, isVisible }: { componentName: string; isVisible: boolean }) => {
  const components: Record<string, React.ComponentType> = {
    ChartNews,
    ShopScrollFunnel,
    HeroMain,
    ProductsSection
  };

  const Component = components[componentName];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
    }
  }, [isVisible]);

  if (!Component) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/50">
        Component "{componentName}" not found
      </div>
    );
  }

  return (
    <div className={`w-full h-auto min-h-screen transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {isMounted && <Component />}
    </div>
  );
});

const FullScreenSection = memo(({ config, activePage, onVisible, parallaxOffset, disableSpline = false, useCrashSafeSpline = false, forceLiteSpline = false, sensitiveMode = false }: any) => {
  const isHeavyScene = config.id === 5 || config.id === 6 || config.id === 10;
  const isMobileSensitive = config.id === 3 || config.id === 4;
  const isLastPage = config.id === 10;
  const isTSX = config.type === 'tsx';
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // OPTIMIZED: Render fewer adjacent pages on mobile for lightweight rendering
  const shouldRender = useMemo(() => {
    const distance = Math.abs(config.id - activePage);
    const threshold = isMobile ? 1 : 2;
    return distance <= threshold || (isLastPage && activePage >= 8);
  }, [config.id, activePage, isLastPage, isMobile]);

  const isActive = config.id === activePage;
  const forceAlwaysSpline = config.id === 1 || config.id === 3;
  const suppressSpline = sensitiveMode && !forceAlwaysSpline;

  useEffect(() => {
    if(sectionRef.current) onVisible(sectionRef.current, config.id - 1);
  }, [onVisible, config.id]);

  // FIX #7: Remove snap classes on mobile, use dynamic heights
  return (
    <section
      ref={sectionRef}
      className={`relative w-full ${isMobile ? 'min-h-[100dvh]' : 'h-[100dvh]'} flex-none bg-black flex flex-col items-center justify-center ${isActive ? 'page-flip-active' : ''}`}
    >
      <div className={`w-full h-full relative ${isTSX ? 'overflow-y-auto no-scrollbar' : 'overflow-hidden'}`}>
        {config.type === 'tsx' ? (
          <div className="min-h-full py-20 md:py-0"> 
            <TSXWrapper componentName={config.component} isVisible={shouldRender} />
          </div>
        ) : (
            <SceneWrapper
              isVisible={shouldRender}
              sceneUrl={config.scene}
              allowInput={!config.disableInteraction}
              parallaxOffset={isHeavyScene ? parallaxOffset * 0.15 : (isMobileSensitive || isLastPage) ? parallaxOffset * 0.3 : parallaxOffset}
              isHeavy={isHeavyScene || isMobileSensitive || isLastPage}
              disabled={forceAlwaysSpline ? false : (disableSpline || suppressSpline)}
              forceLiteSpline={forceLiteSpline}
              forceLoadOverride={forceAlwaysSpline}
              skeletonLabel={config.label}
              useCrashSafe={useCrashSafeSpline}
            />
        )}
        {!isTSX && (
          <>
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            <div className={`absolute bottom-24 left-6 md:bottom-20 md:left-10 z-20 pointer-events-none transition-all duration-1000 ease-out max-w-[85%] ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter select-none drop-shadow-2xl hover-lift">
                {config.label}
              </h2>
            </div>
          </>
        )}
      </div>
    </section>
  );
});

const DraggableSplitSection = memo(({ config, activePage, onVisible, isMobileView, parallaxOffset, disableSpline = false, useCrashSafeSpline = false, forceLiteSpline = false, sensitiveMode = false }: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 72, y: 35 });
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const isActive = config.id === activePage;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
    audio.volume = 0.25;
    hitSoundRef.current = audio;
  }, []);

  const clampSplit = useCallback((value: number) => Math.min(95, Math.max(5, value)), []);

  const nudgeSplit = useCallback((delta: number) => {
    setSplitPos(prev => clampSplit(prev + delta));
  }, [clampSplit]);

  const handleTargetHit = useCallback(() => {
    setScore(prev => prev + 1);
    if (navigator.vibrate) navigator.vibrate(15);
    try {
      if (hitSoundRef.current) {
        hitSoundRef.current.currentTime = 0;
        hitSoundRef.current.play().catch(() => {});
      }
    } catch (e) {}
    setTargetPos({
      x: clampSplit(10 + Math.random() * 80),
      y: clampSplit(10 + Math.random() * 70)
    });
  }, [clampSplit]);

  const handleDragStart = () => {
    playClickSound();
    try {
      if (hitSoundRef.current) {
        hitSoundRef.current.currentTime = 0;
        hitSoundRef.current.play().catch(() => {});
      }
    } catch (e) {}
    setIsDragging(true);
  };
  
  const handleDragEnd = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    setIsDragging(false);
  };

  const rafRef = useRef<number>();

  const handleDragMove = useCallback((e: any) => {
    if (!containerRef.current) return;

    // Cancel previous RAF to prevent queue buildup
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let newPos;
        if (isMobileView) {
            const relativeY = clientY - rect.top;
            newPos = (relativeY / rect.height) * 100;
        } else {
            const relativeX = clientX - rect.left;
            newPos = (relativeX / rect.width) * 100;
        }
        setSplitPos(clampSplit(newPos));
    });
  }, [clampSplit, isMobileView]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove, { passive: true });
      window.addEventListener('touchmove', handleDragMove, { passive: true });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      // Cleanup RAF
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging, handleDragMove]);

  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); nudgeSplit(isMobileView ? -4 : -3); }
      if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); nudgeSplit(isMobileView ? 4 : 3); }
      if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); handleTargetHit(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, isMobileView, handleTargetHit, nudgeSplit]);

  const layoutClass = isMobileView ? 'flex-col' : 'flex-row';
  const sizeProp = isMobileView ? 'height' : 'width';
  const otherSizeProp = isMobileView ? 'width' : 'height';
   
  useEffect(() => {
    if (containerRef.current) onVisible(containerRef.current, config.id - 1);
  }, [onVisible, config.id]);

  const shouldRender = (config.id >= activePage - 1) && (config.id <= activePage + 1);

  // FIX #7: Remove snap classes on split section for mobile
  return (
    <section
      ref={containerRef}
      className={`relative w-full ${isMobile ? 'min-h-[100dvh]' : 'h-[100dvh]'} flex-none overflow-hidden bg-black flex ${layoutClass} ${isDragging ? 'select-none cursor-grabbing' : ''} mobile-optimize`}
    >
      {isDragging && <div className="absolute inset-0 z-[60] bg-transparent" />}

      {/* Arcade HUD */}
      <div className="absolute top-4 left-4 z-[70] flex flex-col gap-2 pointer-events-auto">
        <div className="px-4 py-2 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md text-white shadow-[0_0_20px_rgba(0,0,0,0.35)]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-blue-300 font-bold flex items-center gap-2">
            <Zap size={12} className="text-blue-500" /> Split Arcade
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="font-mono text-blue-400">Score {score}</span>
            <span className="text-white/50">•</span>
            <span className="font-mono text-white/60">Use arrows / WASD</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { playClickSound(); nudgeSplit(isMobileView ? -4 : -3); }}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:-translate-y-0.5 transition-all"
              aria-label="Move split up"
            >
              <ChevronUp size={16} className="text-blue-400" />
            </button>
            <button
              onClick={() => { playClickSound(); nudgeSplit(isMobileView ? 4 : 3); }}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:translate-y-0.5 transition-all"
              aria-label="Move split down"
            >
              <ChevronDown size={16} className="text-blue-400" />
            </button>
            <button
              onClick={() => { playClickSound(); handleTargetHit(); }}
              className="flex-1 px-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-xs font-bold text-blue-100 hover:bg-blue-500/30 transition-colors"
              aria-label="Fire at target"
            >
              Fire
            </button>
          </div>
        </div>
      </div>

      {/* Target Mini-Game */}
      {shouldRender && (
        <div
          className="absolute z-[65] pointer-events-auto transition-transform duration-300"
          style={{ top: `${targetPos.y}%`, left: `${targetPos.x}%`, transform: 'translate(-50%, -50%)' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleTargetHit(); }}
            className="relative w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/40 shadow-[0_0_20px_rgba(0,100,255,0.3)] hover:scale-105 transition-transform"
            aria-label="Hit target"
          >
            <div className="absolute inset-1 rounded-full border border-white/10" />
            <div className="absolute inset-3 rounded-full border border-blue-400/60" />
            <div className="absolute inset-6 rounded-full bg-blue-500/70 blur-[10px] opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-white/60" />
              <div className="h-0.5 w-full bg-white/60" />
            </div>
          </button>
        </div>
      )}
      
      {/* PANEL A */}
      <div 
        style={{ [sizeProp]: `${splitPos}%`, [otherSizeProp]: '100%' }} 
        className={`relative overflow-hidden bg-[#050505] border-blue-500/50 ${isMobileView ? 'border-b' : 'border-r'} ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
      >
        <div className="absolute inset-0 w-full h-full"> 
          <SceneWrapper
            isVisible={shouldRender}
            sceneUrl={config.sceneA}
            forceNoPointer={isDragging}
            parallaxOffset={parallaxOffset * 0.3}
            disabled={false}
            forceLiteSpline={forceLiteSpline}
            forceLoadOverride
            skeletonLabel={config.labelA}
            useCrashSafe={useCrashSafeSpline}
          />
        </div>
        <div className="absolute top-8 left-8 z-20 pointer-events-none">
           <div className={`text-2xl md:text-4xl font-bold text-white/90 transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
             {config.labelA}
           </div>
        </div>
      </div>
      
      {/* DRAG HANDLE */}
      <div 
        onMouseDown={handleDragStart} 
        onTouchStart={handleDragStart} 
        className={`absolute z-50 flex items-center justify-center group outline-none touch-none cursor-pointer ${isMobileView ? 'w-full h-12 left-0 -mt-6 cursor-row-resize' : 'w-12 h-full top-0 -ml-6 cursor-col-resize'}`} 
        style={isMobileView ? { top: `${splitPos}%` } : { left: `${splitPos}%` }}
      >
        <div className={`${isMobileView ? 'w-full h-[1px]' : 'w-[1px] h-full'} bg-blue-500/50 shadow-[0_0_15px_rgba(0,100,255,0.5)]`} />
        <div className="absolute w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform hover-lift">
           {isMobileView ? <GripHorizontal size={16} className="text-white"/> : <GripVertical size={16} className="text-white"/> }
        </div>
      </div>
      
      {/* PANEL B */}
      <div 
        style={{ [sizeProp]: `${100 - splitPos}%`, [otherSizeProp]: '100%' }} 
        className={`relative overflow-hidden bg-black ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
      >
        <div className="absolute inset-0 w-full h-full">
             <SceneWrapper
               isVisible={shouldRender}
               sceneUrl={config.sceneB}
               forceNoPointer={isDragging}
               parallaxOffset={parallaxOffset * 0.7}
               disabled={false}
               forceLiteSpline={forceLiteSpline}
               forceLoadOverride
               skeletonLabel={config.labelB}
               useCrashSafe={useCrashSafeSpline}
             />
        </div>
        <div className="absolute bottom-8 right-8 z-20 text-right pointer-events-none">
             <div className={`text-2xl md:text-4xl font-bold text-white/90 transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
               {config.labelB}
             </div>
        </div>
      </div>
    </section>
  );
});

// ----------------------------------------------------------------------
// 7. BOTTOM CONTROLS & WIDGETS
// ----------------------------------------------------------------------
const BottomControls = ({ isPlaying, onToggleMusic, onOpenTheme, themeName, volume, onVolumeChange, visible, accentColor, disableSpline, onTogglePerformance }: any) => {
    const containerStyle = {
        borderColor: `${accentColor}40`,
        boxShadow: `0 0 20px ${accentColor}15`
    };

    if (!visible) return null;
    
    return (
        <div
          className="pointer-events-auto flex flex-col items-start gap-4 transition-all duration-700 ease-in-out absolute bottom-4 left-4 md:bottom-8 md:left-8 z-[100]"
          style={{ 
            opacity: visible ? 1 : 0, 
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            left: 'calc(env(safe-area-inset-left, 0px) + 12px)',
            right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
            maxWidth: 'calc(100% - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px)',
          }}
        >
            <div 
              className="apple-surface rounded-[28px] px-5 py-4 w-full max-w-[520px] transition-all duration-500 hover:-translate-y-0.5"
              style={containerStyle}
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
                      <Sparkles size={18} style={{ color: accentColor }} />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] font-mono tracking-[0.28em] text-white/60 uppercase">Control Center</span>
                      <span className="text-base font-semibold text-white">Precision mode engaged</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          if (navigator.vibrate) navigator.vibrate(10);
                          onOpenTheme(e);
                        }}
                        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onTouchEnd={(e) => { e.currentTarget.style.transform = ''; }}
                        className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:-translate-y-0.5 transition-all shadow-lg touch-manipulation active:scale-95"
                        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                        aria-label="Open theme settings"
                      >
                        <Palette size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          if (navigator.vibrate) navigator.vibrate(12);
                          onTogglePerformance();
                        }}
                        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onTouchEnd={(e) => { e.currentTarget.style.transform = ''; }}
                        className={`w-11 h-11 rounded-2xl border transition-all hover:-translate-y-0.5 shadow-lg touch-manipulation active:scale-95 ${
                          disableSpline
                            ? 'bg-white text-black border-white/70'
                            : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                        }`}
                        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                        aria-label="Toggle performance mode"
                      >
                        <Zap size={18} style={{ color: disableSpline ? accentColor : 'inherit' }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          if (navigator.vibrate) navigator.vibrate(10);
                          onToggleMusic();
                        }}
                        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onTouchEnd={(e) => { e.currentTarget.style.transform = ''; }}
                        className="relative w-12 h-12 rounded-[14px] border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:-translate-y-0.5 transition-all shadow-lg touch-manipulation active:scale-95"
                        style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            boxShadow: isPlaying ? `0 12px 30px ${accentColor}40` : undefined,
                            borderColor: isPlaying ? `${accentColor}55` : 'rgba(255,255,255,0.1)',
                        }}
                        aria-label="Toggle music"
                      >
                          {isPlaying ? (volume > 50 ? <Volume2 size={18}/> : <Volume1 size={18}/>) : <VolumeX size={18}/>}
                          {isPlaying && <span className="absolute inset-0 rounded-[14px] border animate-ping opacity-20" style={{ borderColor: accentColor }} />}
                      </button>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-semibold text-white/60">Volume</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={volume} 
                          onChange={(e) => onVolumeChange(parseInt(e.target.value))} 
                          className="w-24 h-1 rounded-lg appearance-none cursor-pointer" 
                          style={{ accentColor: accentColor, backgroundColor: `${accentColor}25` }} 
                        />
                      </div>
                  </div>
                </div>

                <div className="apple-divider my-3" />
                
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                      <span className="font-mono tracking-widest uppercase">Immersive audio</span>
                    </div>
                    <div className={`flex flex-col md:flex-row md:items-center overflow-hidden transition-all duration-500 gap-1 md:gap-3 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}>
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: accentColor }}>
                          Now Streaming
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white truncate">{themeName} Radio</span>
                            <div className="flex gap-1 items-end h-3">
                                <span className="w-0.5 h-full animate-music-bar-1" style={{ backgroundColor: accentColor }}/>
                                <span className="w-0.5 h-full animate-music-bar-2" style={{ backgroundColor: accentColor }}/>
                                <span className="w-0.5 h-full animate-music-bar-3" style={{ backgroundColor: accentColor }}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SupportWidget = ({ accentColor }: { accentColor: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPulsing, setIsPulsing] = useState(true);

    useEffect(() => {
      setTimeout(() => setIsVisible(true), 500);
      const timer = setTimeout(() => setIsPulsing(false), 5000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div
        className={`absolute z-[100] pointer-events-auto transition-all duration-700 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
        }}
      >
        <a
          href="https://t.me/+dlP_A0ebMXs3NTg0"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            playClickSound();
            if (navigator.vibrate) navigator.vibrate([15, 5, 15]);
          }}
          onMouseEnter={() => playHover()}
          onTouchStart={(e) => {
            playHover();
            e.currentTarget.style.transform = 'scale(0.9)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = '';
          }}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-[18px] apple-surface border border-white/10 text-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', borderColor: `${accentColor}33` }}
        >
          <div className={`absolute inset-0 rounded-[18px] blur-3xl opacity-30 transition-all duration-500 ${isPulsing ? 'animate-pulse' : ''}`} style={{ backgroundColor: accentColor }} />
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-white/5 shadow-inner overflow-hidden">
              <MessageCircle className="w-6 h-6 text-white relative z-10 drop-shadow-md group-hover:scale-110 transition-transform" strokeWidth={2.4} />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-20 group-hover:animate-ping" style={{ backgroundColor: accentColor }} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-white/60 tracking-[0.12em] uppercase">Human Concierge</span>
            <span className="text-sm font-semibold text-white">Need a hand?</span>
          </div>
          <div className="ml-auto px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] text-white/70">
            Live
          </div>
          {isPulsing && <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />}
        </a>
      </div>
    );
};

// Custom Cursor Component
const CustomCursor = ({ accentColor }: { accentColor: string }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      setTrails(prev => {
        const newTrail = { x: e.clientX, y: e.clientY, id: Date.now() };
        const updated = [newTrail, ...prev].slice(0, 10);
        return updated;
      });
    };
    
    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);
  
  return (
    <>
      {trails.map((trail, i) => (
        <div
          key={trail.id}
          className="cursor-trail"
          style={{
            left: trail.x,
            top: trail.y,
            backgroundColor: accentColor,
            opacity: (10 - i) / 10 * 0.3,
            transform: `translate(-50%, -50%) scale(${(10 - i) / 10})`
          }}
        />
      ))}
      <div
        className="fixed w-6 h-6 rounded-full border-2 pointer-events-none z-[9999999] mix-blend-difference"
        style={{
          left: position.x,
          top: position.y,
          borderColor: accentColor,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.1s ease-out'
        }}
      />
    </>
  );
};

// ----------------------------------------------------------------------
// 7. MAIN COMPONENT
// ----------------------------------------------------------------------
export default function Home() {
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [isMuted, setIsMuted] = useState(false); 
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
   
  // File 1 States
  const [activePage, setActivePage] = useState<number>(1);
  const [modalData, setModalData] = useState<any>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
   
  const [_, startTransition] = useTransition();
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const assetsWarmedRef = useRef(false);
  const parallaxRafRef = useRef<number>(0);
  const prefersReducedMotionRef = useRef(false);
  const orientationDismissedRef = useRef(false);
  const touchStartRef = useRef(0);
  const [isTouch, setIsTouch] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [musicKey, setMusicKey] = useState(0);
  const [disableSpline, setDisableSpline] = useState(false);
  const [showThemeQuickPick, setShowThemeQuickPick] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [showEdgeSwipeHints, setShowEdgeSwipeHints] = useState(false);
  const edgeHintsShownRef = useRef(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const handleOrientationDismiss = useCallback(() => {
    setShowOrientationWarning(false);
    orientationDismissedRef.current = true;
  }, []);

  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);
    
  const accentColor = useMemo(() => getThemeColor(activeThemeId), [activeThemeId]);
  const isPlaying = useMemo(() => !isMuted, [isMuted]);

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  // --- INIT ---
  useEffect(() => {
    setIsClient(true);

    // Inject Styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = GLOBAL_STYLES;
    document.head.appendChild(styleSheet);

    setIsTouch(matchMedia && matchMedia('(pointer: coarse)').matches);

    // Auto-disable Spline by default; preserve user preference when available
    const savedSplinePref = safeGetItem('spline_enabled');
    const ua = navigator.userAgent || '';
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    setIsSafari(isSafariBrowser);
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isInApp =
      /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);
    const shouldSafeMode = isIOS || isInApp;
    setIsSafeMode(shouldSafeMode);
    if (shouldSafeMode && savedSplinePref === null) {
      // On iOS/in-app browsers default to performance mode to avoid WebGL crashes
      setDisableSpline(true);
      safeSetItem('spline_enabled', 'true');
    } else if (savedSplinePref !== null) {
      setDisableSpline(savedSplinePref === 'true');
    } else {
      setDisableSpline(false);
      safeSetItem('spline_enabled', 'false');
    }

    if (!shouldSafeMode) {
      // PERFORMANCE: Preload critical Spline scenes
      const preloadScenes = [
        "/scene1.splinecode", // Hero scene
        "/scene.splinecode",  // Showcase
      ];

      preloadScenes.forEach((scene) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = scene;
        link.as = "fetch";
        document.head.appendChild(link);
      });
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    prefersReducedMotionRef.current = mediaQuery.matches;
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      prefersReducedMotionRef.current = e.matches;
    };
    
    // Handle both modern and legacy APIs
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      // Fallback for older browsers
      (mediaQuery as any).addListener(handleMotionChange);
    }

    // ========================================
    // CRITICAL: Prevent page reloads on mobile browsers
    // ========================================
    const handleTouchStart = (e: TouchEvent) => {
      const scrollable = (e.target as HTMLElement)?.closest('.mobile-scroll');
      if (scrollable && e.touches.length > 0) {
        touchStartRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = (e.target as HTMLElement)?.closest('.mobile-scroll');
      if (!scrollable || e.touches.length === 0) return;

      const currentY = e.touches[0].clientY;
      const isPullingDown = currentY - touchStartRef.current > 0;
      if (scrollable.scrollTop <= 0 && isPullingDown) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Disable pull-to-refresh on the body
    document.body.style.overscrollBehavior = 'contain';

    // ULTRA-OPTIMIZED: 60fps scroll with advanced RAF throttling
    let rafId: number | null = null;
    let lastScrollTime = 0;
    let ticking = false;

    const handleScroll = () => {
      if (prefersReducedMotionRef.current) return;

      const now = performance.now();

      // Advanced throttling: Only update on actual frame boundaries
      if (now - lastScrollTime < 16.67) return;

      lastScrollTime = now;

      // Use RAF ticking pattern for guaranteed 60fps
      if (!ticking) {
        if (rafId !== null) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const scrollTop = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : window.scrollY;

          // Batch state update to reduce re-renders
          setParallaxOffset(scrollTop);

          ticking = false;
          rafId = null;
        });

        ticking = true;
      }
    };

    const scrollElement = scrollContainerRef.current || window;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollElement !== window) window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial Layout Check
    const checkLayout = () => {
        const isNarrow = window.innerWidth < 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isNarrow && isPortrait) {
            setIsMobileView(true);
            if (!orientationDismissedRef.current) {
              setShowOrientationWarning(true);
            }
        } else {
            setIsMobileView(false);
            setShowOrientationWarning(false);
        }
    };
    
    checkLayout();
    handleScroll();
    window.addEventListener('resize', checkLayout);
    
    // Load User Prefs
    const storedTheme = safeGetItem('user_theme_id');
    const storedMute = safeGetItem('user_is_muted');
    const storedVol = safeGetItem('user_volume');
    const hasRegisteredUser = safeGetItem('vip_user_registered') === 'true';
    
    if (storedTheme) setActiveThemeId(storedTheme);
    if (storedMute !== null) setIsMuted(storedMute === 'true');
    if (storedVol) setVolume(parseInt(storedVol));
    setHasRegistered(hasRegisteredUser);
    setCurrentStage("v2");
    
    // Cleanup
    return () => {
      document.head.removeChild(styleSheet);
      window.removeEventListener('resize', checkLayout);
      scrollElement.removeEventListener('scroll', handleScroll);
      if (scrollElement !== window) window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        (mediaQuery as any).removeListener(handleMotionChange);
      }
    };
  }, []);

  // Warm key assets once to keep subsequent visits snappy
  useEffect(() => {
    if (!isClient || assetsWarmedRef.current || isSafeMode) return;
    assetsWarmedRef.current = true;

    const warmAssets = async () => {
      const sceneUrls = PAGE_CONFIG.flatMap((page) => {
        if (page.type === 'full') return [page.scene];
        if (page.type === 'split') return [page.sceneA, page.sceneB];
        return [];
      }).filter(Boolean) as string[];

      const uniqueScenes = Array.from(new Set(sceneUrls));
      try {
        const cache = typeof window !== 'undefined' && 'caches' in window ? await caches.open('bullmoney-prewarm-v1') : null;
        await Promise.all(uniqueScenes.map(async (url) => {
          try {
            const req = new Request(url, { cache: 'force-cache' });
            if (cache) {
              const match = await cache.match(req);
              if (match) return;
              const res = await fetch(req);
              if (res.ok) await cache.put(req, res.clone());
            } else {
              await fetch(req);
            }
          } catch (e) {}
        }));
      } catch (e) {}
    };

    const scheduleWarm = () => { warmAssets().catch(() => {}); };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(scheduleWarm, { timeout: 2000 });
    } else {
      setTimeout(scheduleWarm, 800);
    }
  }, [isClient, isSafeMode]);

  // Force-warm critical spline scenes even in safe/in-app browsers to avoid first-load failures
  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;

    const prefetchWithRetry = async (url: string) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (cancelled) return;
        try {
          const req = new Request(url, { cache: 'force-cache', mode: 'cors' });
          const res = await fetch(req);
          if (cancelled) return;
          if (res.ok && typeof window !== 'undefined' && 'caches' in window) {
            const cache = await caches.open('bullmoney-critical-splines');
            await cache.put(req, res.clone());
          }
          return;
        } catch (err) {
          await new Promise((resolve) => setTimeout(resolve, 180));
        }
      }
    };

    const prefetchAll = async () => {
      for (const scene of CRITICAL_SPLINE_SCENES) {
        await prefetchWithRetry(scene);
      }
    };

    const schedule = () => { prefetchAll().catch(() => {}); };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(schedule, { timeout: 800 });
    } else {
      setTimeout(schedule, 400);
    }

    return () => { cancelled = true; };
  }, [isClient]);

  useEffect(() => {
    if (currentStage !== 'content' || !isTouch || edgeHintsShownRef.current) return;
    edgeHintsShownRef.current = true;
    setShowEdgeSwipeHints(true);
    const timer = setTimeout(() => setShowEdgeSwipeHints(false), 4500);
    return () => clearTimeout(timer);
  }, [currentStage, isTouch]);

  // --- SCROLL OBSERVER ---
  // ULTRA-OPTIMIZED: Intersection observer with multiple thresholds for smooth detection
  useEffect(() => {
    if(currentStage !== 'content') return;

    const isMobile = window.innerWidth < 768;

    // Multiple thresholds for more accurate detection
    const thresholds = isMobile
      ? [0.25, 0.5, 0.75]  // Lower thresholds on mobile for faster response
      : [0.3, 0.5, 0.7];    // Standard thresholds on desktop

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger on primary threshold crossing (50%)
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = pageRefs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1 && index + 1 !== activePage) {
              // Use transition for smooth state updates
              startTransition(() => {
                setActivePage(index + 1);
                setParticleTrigger(prev => prev + 1);
                // Subtle haptic feedback on page change
                if (navigator.vibrate) navigator.vibrate(8);
              });
            }
          }
        });
      },
      {
        threshold: thresholds,
        root: scrollContainerRef.current || null,
        rootMargin: isMobile ? '0px' : '-10% 0px'  // Trigger slightly before on desktop
      }
    );

    pageRefs.current.forEach((ref) => { if (ref) observerRef.current?.observe(ref); });
    return () => observerRef.current?.disconnect();
  }, [currentStage, activePage]);

  const handleRef = useCallback((el: HTMLElement | null, index: number) => {
    pageRefs.current[index] = el;
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  // FIX #4: Improved page navigation with haptic feedback
  const scrollToPage = (index: number) => {
    if(index < 0 || index >= PAGE_CONFIG.length) return;
    setIsMobileNavOpen(false);
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(10);
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // OPTIMIZED: Swipe navigation between pages
  const [swipeIndicator, setSwipeIndicator] = useState<'left' | 'right' | null>(null);

  const navigateToNextPage = useCallback(() => {
    if (activePage < PAGE_CONFIG.length) {
      playSwipe();
      scrollToPage(activePage); // activePage is 1-indexed, scrollToPage expects 0-indexed
      setSwipeIndicator('left');
      setTimeout(() => setSwipeIndicator(null), 500);
    }
  }, [activePage]);

  const navigateToPrevPage = useCallback(() => {
    if (activePage > 1) {
      playSwipe();
      scrollToPage(activePage - 2); // activePage is 1-indexed, scrollToPage expects 0-indexed
      setSwipeIndicator('right');
      setTimeout(() => setSwipeIndicator(null), 500);
    }
  }, [activePage]);

  // Create swipe handlers for page navigation
  const swipeHandlers = useMemo(() =>
    createSwipeHandlers({
      onSwipeLeft: navigateToNextPage,
      onSwipeRight: navigateToPrevPage,
      threshold: 80,
      velocityThreshold: 0.4,
      preventScroll: false,
    }),
    [navigateToNextPage, navigateToPrevPage]
  );

  // FIX #4: Add hold-to-switch functionality for page buttons
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const handlePageButtonHoldStart = (index: number) => {
    setIsHolding(true);
    const timer = setTimeout(() => {
      scrollToPage(index);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]); // Double vibration for hold action
      setIsHolding(false);
    }, 500); // 500ms hold time
    setHoldTimer(timer);
  };

  const handlePageButtonHoldEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setIsHolding(false);
  };

  // --- MUSIC HANDLERS ---
  const safePlay = useCallback(() => {
      if (isMuted || showConfigurator || !playerRef.current) return;
      try {
          if(typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
          if(typeof playerRef.current.setVolume === 'function') playerRef.current.setVolume(volume);
          if(typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
      } catch (e) { }
  }, [isMuted, showConfigurator, volume]);

  const safePause = useCallback(() => { 
    try { 
      playerRef.current?.pauseVideo?.(); 
    } catch (e) {} 
  }, []);

  const handlePlayerReady = useCallback((player: any) => {
      playerRef.current = player;
      if (isMuted) player.mute?.();
      else { player.unMute?.(); player.setVolume?.(volume); }
      if (!isMuted && !showConfigurator) player.playVideo?.();
  }, [isMuted, showConfigurator, volume]);

  const toggleMusic = useCallback(() => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      safeSetItem('user_is_muted', String(newMutedState));
      if (newMutedState) safePause(); else safePlay();
  }, [isMuted, safePlay, safePause]);

  const handleVolumeChange = (newVol: number) => {
      setVolume(newVol);
      safeSetItem('user_volume', newVol.toString());
      if(playerRef.current) playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) { setIsMuted(false); safePlay(); }
  };

  const handlePerformanceToggle = useCallback(() => {
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(12);
      const newState = !disableSpline;
      setDisableSpline(newState);
      safeSetItem('spline_enabled', String(newState));
  }, [disableSpline]);

  // --- GATING HANDLERS ---
  const handleRegisterComplete = useCallback(() => {
    safeSetItem('vip_user_registered', 'true');
    setHasRegistered(true);
    setCurrentStage("hold"); 
  }, []);
  
  const handleHoldComplete = useCallback(() => setCurrentStage("content"), []);
  
  const handleV2Complete = useCallback(() => { 
    safePlay(); 
    setParticleTrigger(prev => prev + 1);
    if (hasRegistered) {
      setCurrentStage("content"); 
    } else {
      setCurrentStage("register");
    }
  }, [hasRegistered, safePlay]);
   
  const handleThemeChange = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
    setActiveThemeId(themeId);
    setIsMuted(muted);
    safeSetItem('user_theme_id', themeId);
    safeSetItem('user_is_muted', String(muted));
    setShowConfigurator(false);
    setParticleTrigger(prev => prev + 1);
    setMusicKey(prev => prev + 1); // Force music player reload
  }, []);

  const handleQuickThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    safeSetItem('user_theme_id', themeId);
    setParticleTrigger(prev => prev + 1);
    setMusicKey(prev => prev + 1);
    playClickSound();
  }, []);

  const useCrashSafeSpline = isSafeMode || isTouch || isSafari;
  const forceLiteSpline = isSafari;

  if (!isClient) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <BackgroundMusicSystem themeId={activeThemeId} onReady={handlePlayerReady} volume={volume} trackKey={musicKey} />
      {!isSafeMode && <ParticleEffect trigger={particleTrigger} />}
      {!isTouch && <CustomCursor accentColor={accentColor} />}

      {/* Quick Theme Picker */}
      {/* FIX #3: Add swipe-to-close to Quick Theme Picker */}
      {showThemeQuickPick && (
        <div
          className="fixed inset-0 z-[800000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => {
            playClick();
            setShowThemeQuickPick(false);
          }}
          onDoubleClick={() => setShowThemeQuickPick(false)}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._swipeStartY;
            if (startY) {
              const endY = e.changedTouches[0].clientY;
              if (Math.abs(endY - startY) > 120) {
                playSwipe();
                setShowThemeQuickPick(false);
              }
            }
          }}
        >
          <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto bg-black/80 rounded-3xl border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Quick Theme Switch</h2>
              <button 
                onClick={() => {
                  playClick();
                  setShowThemeQuickPick(false);
                }} 
                onDoubleClick={() => setShowThemeQuickPick(false)} 
                onMouseEnter={() => playHover()}
                className="text-white/50 hover:text-white p-2"
                aria-label="Close quick theme picker"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ALL_THEMES.filter(t => t.status === 'AVAILABLE').slice(0, 16).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    handleQuickThemeChange(theme.id);
                    setShowThemeQuickPick(false);
                  }}
                  className={`p-4 rounded-xl border transition-all hover:scale-105 ${
                    theme.id === activeThemeId
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={{
                    filter: theme.filter,
                    WebkitFilter: theme.filter
                  }}
                >
                  <div className="text-sm font-bold text-white mb-1">{theme.name}</div>
                  <div className="text-[10px] text-white/60">{theme.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- INFO PANEL --- */}
      <InfoPanel
        config={PAGE_CONFIG[activePage - 1]}
        isOpen={infoPanelOpen}
        onClose={() => setInfoPanelOpen(false)}
        accentColor={accentColor}
      />

      {/* FIX #10: Add edge peeker for Info Panel (left edge) */}
      {!infoPanelOpen && currentStage === 'content' && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[500000] w-1 h-32 bg-gradient-to-r from-blue-500/50 to-transparent cursor-pointer hover:w-2 transition-all"
          style={{ background: `linear-gradient(to right, ${accentColor}80, transparent)` }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._swipeStartX;
            if (startX !== undefined && startX < 50) {
              const endX = e.changedTouches[0].clientX;
              if (endX - startX > 50) {
                playSwipe();
                setInfoPanelOpen(true);
              }
            }
          }}
          onClick={() => {
            playClick();
            setInfoPanelOpen(true);
          }}
          onMouseEnter={() => playHover()}
        >
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <Info size={12} className="text-white" />
          </div>
        </div>
      )}
      
      {/* --- FAQ OVERLAY --- */}
      {/* FIX #3: Add swipe-to-close to FAQ overlay */}
      {faqOpen && (
        <div
          className="fixed inset-0 z-[950000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._swipeStartY;
            if (startY) {
              const endY = e.changedTouches[0].clientY;
              if (Math.abs(endY - startY) > 100) {
                setFaqOpen(false);
                if (navigator.vibrate) navigator.vibrate(15);
              }
            }
          }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => {
                playClick();
                if (navigator.vibrate) navigator.vibrate(10);
                setFaqOpen(false);
              }}
              onDoubleClick={() => setFaqOpen(false)}
              onTouchStart={(e) => {
                playHover();
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = '';
              }}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Close FAQ"
            >
              <X size={22} />
            </button>
            <div className="rounded-3xl border border-white/10 bg-black/80 shadow-[0_10px_60px_rgba(0,0,0,0.5)] overflow-hidden">
              <InlineFaq />
            </div>
          </div>
        </div>
      )}

      {/* FIX #4: Add progress bar showing scroll position through all pages */}
      {currentStage === 'content' && (
        <div className="fixed top-0 left-0 right-0 z-[450000] h-1 bg-black/50 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((activePage - 1) / (PAGE_CONFIG.length - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* --- LAYER 1: FIXED CONTROLS --- */}
      <div className="fixed inset-0 z-[400000] pointer-events-none">
          <BottomControls
            visible={currentStage === 'content'}
            isPlaying={isPlaying}
            onToggleMusic={toggleMusic}
            onOpenTheme={(e?: any) => {
              const isDouble = (e?.detail ?? 1) >= 2;
              if (showConfigurator || isDouble) {
                setShowConfigurator(false);
                return;
              }
              setShowConfigurator(true);
              setParticleTrigger(prev => prev + 1);
            }} 
            themeName={activeTheme.name} 
            volume={volume} 
            onVolumeChange={handleVolumeChange} 
            accentColor={accentColor} 
            disableSpline={disableSpline}
            onTogglePerformance={handlePerformanceToggle}
          />
          {currentStage === 'content' && !showConfigurator && <SupportWidget accentColor={accentColor} />}
      </div>

      {/* --- LAYER 2: CONFIGURATOR --- */}
      {/* FIX #3: Add swipe-to-close to Theme Configurator */}
      {showConfigurator && (
        <div
          className="fixed inset-0 z-[300000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._swipeStartY;
            if (startY) {
              const endY = e.changedTouches[0].clientY;
              if (Math.abs(endY - startY) > 100) {
                setShowConfigurator(false);
                if (navigator.vibrate) navigator.vibrate(15);
              }
            }
          }}
        >
            <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    if (navigator.vibrate) navigator.vibrate(10);
                    setShowConfigurator(false);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setShowConfigurator(false);
                  }}
                  onTouchStart={(e) => {
                    playHover();
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                  className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-all hover-lift min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <X size={28} />
                </button>
                {/* @ts-ignore */}
                <FixedThemeConfigurator initialThemeId={activeThemeId} onThemeChange={handleThemeChange} />
            </div>
        </div>
      )}

      {/* --- LAYER 3: GLOBAL THEME LENS --- */}
      <div 
        className="fixed inset-0 pointer-events-none w-screen h-screen z-[200000]" 
        style={{ 
          backdropFilter: prefersReducedMotion ? 'none' : activeTheme.filter, 
          WebkitBackdropFilter: prefersReducedMotion ? 'none' : activeTheme.filter, 
          transition: 'backdrop-filter 0.5s ease' 
        }} 
      />

      {/* --- LAYER 4: LOADING / GATING SCREENS --- */}
      {currentStage === "register" && (
         <div className="fixed inset-0 z-[100000] bg-black" style={{ filter: activeTheme.filter, WebkitFilter: activeTheme.filter, transform: 'translateZ(0)' }}>
             {/* @ts-ignore */}
             <RegisterPage onUnlock={handleRegisterComplete} theme={activeTheme} />
         </div>
      )}
      {currentStage === "hold" && (
         <div className="fixed inset-0 z-[100000]" style={{ filter: activeTheme.filter, WebkitFilter: activeTheme.filter, transform: 'translateZ(0)' }}>
             {/* @ts-ignore */}
             <BullMoneyGate onUnlock={handleHoldComplete} theme={activeTheme}><></></BullMoneyGate>
         </div>
      )}
      {currentStage === "v2" && (
         <div className="fixed inset-0 z-[100000]" style={{ filter: activeTheme.filter, WebkitFilter: activeTheme.filter, transform: 'translateZ(0)' }}>
             {/* @ts-ignore */}
             <MultiStepLoaderV2 onFinished={handleV2Complete} theme={activeTheme} />
         </div>
      )}

      {/* --- LAYER 5: NAVBAR --- */}
      {currentStage === 'content' && (
         <header className="fixed top-0 left-0 right-0 z-[250000] w-full transition-all duration-300">
             <Navbar 
                setShowConfigurator={setShowConfigurator} 
                activeThemeId={activeThemeId} 
                accentColor={accentColor}
                onThemeChange={(themeId) => handleThemeChange(themeId, 'MECHANICAL' as SoundProfile, isMuted)} 
             />
         </header>
      )}


      {/* --- LAYER 6: MAIN CONTENT (3D SCROLL LAYOUT) --- */}
      <div className={currentStage === 'content' ? 'profit-reveal w-full h-[100dvh] relative' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
        {!isTouch && <TargetCursor spinDuration={2} hideDefaultCursor={false} targetSelector=".cursor-target, a, button" />}
        
        {/* --- SCROLL CONTAINER --- */}
        <main
          ref={scrollContainerRef}
          data-scroll-container
          className={`w-full h-full flex flex-col overflow-y-scroll overflow-x-hidden ${isTouch ? '' : 'snap-y snap-mandatory'} scroll-smooth bg-black no-scrollbar text-white relative mobile-scroll`}
          onTouchStart={swipeHandlers.onTouchStart}
          onTouchMove={swipeHandlers.onTouchMove}
          onTouchEnd={swipeHandlers.onTouchEnd}
          onMouseDown={swipeHandlers.onMouseDown}
          onMouseMove={swipeHandlers.onMouseMove}
          onMouseUp={swipeHandlers.onMouseUp}
          style={{
            WebkitOverflowScrolling: 'touch',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'pan-y',
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
          }}
        >
            
            {showOrientationWarning && (
              <OrientationOverlay 
                onDismiss={handleOrientationDismiss} 
              />
            )}

            {/* DESKTOP NAV */}
            <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-6 items-center pointer-events-auto">
                {/* Theme Quick Switcher */}
                <div className="relative group">
                    <button
                      onClick={(e) => {
                        playClickSound();
                        if (navigator.vibrate) navigator.vibrate(10);
                        if (e.detail >= 2 || showThemeQuickPick) {
                          setShowThemeQuickPick(false);
                          return;
                        }
                        setShowThemeQuickPick(true);
                      }}
                      className="w-10 h-10 bg-black/40 backdrop-blur rounded-full border border-white/20 flex items-center justify-center text-purple-400 hover:text-white transition-colors mb-4 hover-lift"
                    >
                        <Palette size={18} />
                    </button>
                    <span className="absolute right-12 top-2 text-[10px] font-mono bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        QUICK THEME
                    </span>
                </div>

                
                {/* Desktop/Mobile View Toggle */}
                <div className="relative group">
                    <button
                      onClick={() => {
                        playClickSound();
                        if (navigator.vibrate) navigator.vibrate(10);
                        setIsMobileView(!isMobileView);
                      }}
                      className="w-10 h-10 bg-black/40 backdrop-blur rounded-full border border-white/20 flex items-center justify-center text-blue-400 hover:text-white transition-colors mb-4 hover-lift"
                    >
                        {isMobileView ? <Smartphone size={18} /> : <Monitor size={18} />}
                    </button>
                    <span className="absolute right-12 top-2 text-[10px] font-mono bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isMobileView ? "MOBILE VIEW" : "DESKTOP VIEW"}
                    </span>
                </div>
                
                <button 
                  onClick={() => scrollToPage(activePage - 2)} 
                  disabled={activePage === 1} 
                  className="text-blue-500 hover:text-white disabled:opacity-20 transition-colors hover-lift"
                >
                  <ChevronUp size={24} />
                </button>
                
                <div className="flex flex-col gap-4 bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/5 shadow-2xl max-h-[50vh] overflow-y-auto no-scrollbar">
                    {PAGE_CONFIG.map((page, index) => (
                        <div key={page.id} className="relative group flex items-center justify-end gap-3">
                            <span className={`text-[10px] font-mono tracking-widest text-blue-300 bg-black/80 px-2 py-1 rounded transition-all duration-300 absolute right-14 whitespace-nowrap pointer-events-none ${activePage === page.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                              {page.label}
                            </span>
                            <ShineButton 
                              onClick={() => scrollToPage(index)} 
                              active={activePage === page.id} 
                              className="w-12 h-12 text-sm"
                            >
                              <span className="font-bold z-10">{index + 1}</span>
                            </ShineButton>
                        </div>
                    ))}
                </div>
                
                <button 
                  onClick={() => scrollToPage(activePage)} 
                  disabled={activePage === PAGE_CONFIG.length} 
                  className="text-blue-500 hover:text-white disabled:opacity-20 transition-colors hover-lift"
                >
                  <ChevronDown size={24} />
                </button>
            </div>

            {/* MOBILE NAV FAB */}
            <div className="md:hidden fixed right-4 bottom-24 z-50 flex flex-col gap-4 items-end pointer-events-auto">
                <ShineButton 
                  className="w-14 h-14 rounded-full shadow-2xl bg-black/80" 
                  onClick={(e: any) => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    if (e?.detail >= 2) {
                      setIsMobileNavOpen(false);
                      return;
                    }
                    setIsMobileNavOpen(true);
                  }}
                >
                  <Layers size={24} />
                </ShineButton>
            </div>

            {/* MOBILE NAV HUD */}
            {/* FIX #3: Add swipe-to-close to Mobile Navigation */}
            <div
              className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl transition-all duration-500 flex flex-col items-center justify-center p-6 ${isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-10'}`}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (e.currentTarget as any)._swipeStartY = touch.clientY;
              }}
              onTouchEnd={(e) => {
                const startY = (e.currentTarget as any)._swipeStartY;
                if (startY) {
                  const endY = e.changedTouches[0].clientY;
                  if (Math.abs(endY - startY) > 100) {
                    setIsMobileNavOpen(false);
                    if (navigator.vibrate) navigator.vibrate(15);
                  }
                }
              }}
            >
                <button
                  onClick={() => {
                    playClickSound();
                    if (navigator.vibrate) navigator.vibrate(10);
                    setIsMobileNavOpen(false);
                  }}
                  onDoubleClick={() => setIsMobileNavOpen(false)}
                  onTouchStart={(e) => {
                    playHover();
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                  className="absolute top-6 right-6 text-white/50 hover:text-white p-2 hover-lift min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90 transition-all"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <X size={32} />
                </button>
                
                <h2 className="text-white/40 font-mono text-sm tracking-[0.3em] mb-8">MISSION CONTROL</h2>
                
                {/* FIX #4: Add hold-to-switch and haptic feedback to mobile nav buttons */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    {PAGE_CONFIG.map((page, index) => (
                        <button
                          key={page.id}
                          onClick={() => {
                            playClick();
                            if (navigator.vibrate) navigator.vibrate(12);
                            scrollToPage(index);
                          }}
                          onTouchStart={() => {
                            playHover();
                            handlePageButtonHoldStart(index);
                          }}
                          onTouchEnd={handlePageButtonHoldEnd}
                          onMouseDown={() => handlePageButtonHoldStart(index)}
                          onMouseUp={handlePageButtonHoldEnd}
                          onMouseLeave={handlePageButtonHoldEnd}
                          className={`relative h-24 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 hover-lift touch-manipulation active:scale-95 ${
                            activePage === page.id
                              ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(0,100,255,0.3)]'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          } ${isHolding ? 'scale-95' : ''}`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <span className="text-2xl font-bold text-white">{index + 1}</span>
                            <span className="text-[10px] font-mono text-blue-300 tracking-wider uppercase">
                              {page.label}
                            </span>
                            {/* Hold indicator */}
                            <div className="absolute inset-0 rounded-xl bg-blue-500/20 opacity-0 transition-opacity" style={{ opacity: isHolding ? 1 : 0 }} />
                        </button>
                    ))}
                </div>
                
                <div className="mt-10 flex flex-col gap-3 w-full max-w-sm">
                    <button
                      onClick={() => {
                        playClickSound();
                        if (navigator.vibrate) navigator.vibrate(10);
                        setIsMobileView(!isMobileView);
                        setIsMobileNavOpen(false);
                      }}
                      onTouchStart={(e) => {
                        playHover();
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = '';
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover-lift min-h-[44px] touch-manipulation active:scale-95 transition-all"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {isMobileView ? <Smartphone size={16} /> : <Monitor size={16} />}
                        {isMobileView ? "MOBILE LAYOUT" : "DESKTOP LAYOUT"}
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        if (navigator.vibrate) navigator.vibrate(15);
                        handlePerformanceToggle();
                        setIsMobileNavOpen(false);
                      }}
                      onTouchStart={(e) => {
                        playHover();
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = '';
                      }}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold border transition-all hover-lift min-h-[44px] touch-manipulation active:scale-95 ${
                        disableSpline
                          ? 'bg-blue-500 text-black border-blue-400 shadow-[0_10px_40px_rgba(59,130,246,0.3)]'
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        <Zap size={16} />
                        {disableSpline ? "ENABLE FULL 3D" : "GO PERFORMANCE MODE"}
                    </button>
                </div>
            </div>

            {/* INFO PANEL & FAQ CONTROLS - Unified for Mobile/Desktop */}
            <div className="fixed top-24 left-4 z-50 md:bottom-8 md:top-auto md:left-8 pointer-events-auto">
                 <div className="flex flex-col gap-3">
                   {/* Info Panel Toggle - Mobile Optimized Card */}
                   <button
                     onClick={(e) => {
                       playClick();
                       if (navigator.vibrate) navigator.vibrate(10);
                       if (e.detail >= 2 || infoPanelOpen) {
                         setInfoPanelOpen(false);
                         return;
                       }
                       setInfoPanelOpen(true);
                     }}
                     onMouseEnter={() => playHover()}
                     onTouchStart={(e) => {
                       playHover();
                       e.currentTarget.style.transform = 'scale(0.95)';
                     }}
                     onTouchEnd={(e) => {
                       e.currentTarget.style.transform = '';
                     }}
                     className="md:hidden flex items-center gap-3 bg-black/50 backdrop-blur border border-white/10 px-4 py-3 rounded-2xl text-left shadow-lg active:scale-95 transition-all hover:bg-black/60 min-h-[44px] touch-manipulation"
                     style={{ WebkitTapHighlightColor: 'transparent' }}
                   >
                     <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                       {infoPanelOpen ? <Unlock size={20} className="text-green-400" /> : <Lock size={20} className="text-blue-400" />}
                     </div>
                     <div className="flex flex-col">
                       <span className="text-xs text-white/60 tracking-widest">INFO PANEL</span>
                       <span className="text-sm font-bold text-white">{infoPanelOpen ? "Tap to close" : "Swipe or tap"}</span>
                     </div>
                   </button>

                   {/* Info Panel Toggle - Desktop Compact */}
                   <ShineButton
                     className="hidden md:flex w-12 h-12 rounded-full"
                     onClick={(e: any) => {
                       playClick();
                       if (e?.detail >= 2 || infoPanelOpen) {
                         setInfoPanelOpen(false);
                         return;
                       }
                       setInfoPanelOpen(true);
                     }}
                     onMouseEnter={() => playHover()}
                   >
                     {infoPanelOpen ? <Unlock size={20} className="text-green-400" /> : <Lock size={20} className="text-blue-400" />}
                   </ShineButton>

                   {/* FAQ Toggle */}
                   <ShineButton
                     className="w-12 h-12 rounded-full"
                     onClick={(e: any) => {
                       playClick();
                       if (e?.detail >= 2 || faqOpen) {
                         setFaqOpen(false);
                         return;
                       }
                       setFaqOpen(true);
                     }}
                     onMouseEnter={() => playHover()}
                   >
                     <Info size={20} className={faqOpen ? "text-green-400" : "text-white"} />
                   </ShineButton>
                 </div>
            </div>

            {/* INFO MODAL (Legacy - kept for compatibility) */}
            <div className={`fixed inset-0 z-[110] flex items-center justify-center px-4 transition-all duration-300 ${!!modalData ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div 
                  className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                  onClick={() => setModalData(null)} 
                />
                {modalData && (
                    <div className="relative w-full max-w-lg bg-black/90 border border-blue-500/30 rounded-xl p-8 shadow-[0_0_50px_rgba(0,100,255,0.2)] scale-100">
                        <button 
                          onClick={() => {
                            playClickSound();
                            setModalData(null);
                          }} 
                          className="absolute top-4 right-4 text-white/50 hover:text-white hover-lift"
                        >
                          <X size={24} />
                        </button>
                        
                        <h3 className="text-blue-400 text-sm font-mono tracking-widest mb-2">
                          PAGE {String(modalData.id).padStart(2, '0')} ANALYSIS
                        </h3>
                        <h2 className="text-3xl font-bold text-white mb-6">{modalData.infoTitle}</h2>
                        <p className="text-white/80 leading-relaxed text-lg font-light">{modalData.infoDesc}</p>
                    </div>
                )}
            </div>

            {/* SCROLL PAGES */}
            {PAGE_CONFIG.map((page) => (
                <React.Fragment key={page.id}>
                {page.type === 'split' ? (
                    <DraggableSplitSection
                      config={page}
                      activePage={activePage}
                      onVisible={handleRef}
                      isMobileView={isMobileView}
                      parallaxOffset={parallaxOffset}
                      disableSpline={disableSpline}
                      useCrashSafeSpline={useCrashSafeSpline}
                      forceLiteSpline={forceLiteSpline}
                      sensitiveMode={isMobileView || isSafari}
                    />
                ) : (
                    <FullScreenSection
                      config={page}
                      activePage={activePage}
                      onVisible={handleRef}
                      parallaxOffset={parallaxOffset}
                      disableSpline={disableSpline}
                      useCrashSafeSpline={useCrashSafeSpline}
                      forceLiteSpline={forceLiteSpline}
                      sensitiveMode={isMobileView || isSafari}
                    />
                )}
                </React.Fragment>
            ))}
            
            <div className="w-full mt-10">
              <Footer />
            </div>
        </main>

        {/* SWIPE NAVIGATION INDICATORS */}
        {showEdgeSwipeHints && (
          <>
            <div
              className="fixed left-0 top-1/2 -translate-y-1/2 z-[100000] pointer-events-none"
              style={{ color: accentColor }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-r-full bg-black/60 border border-white/10 backdrop-blur animate-pulse">
                <ChevronRight size={18} />
                <span className="text-[10px] font-mono tracking-widest text-white/70">SWIPE</span>
              </div>
            </div>
            <div
              className="fixed right-0 top-1/2 -translate-y-1/2 z-[100000] pointer-events-none"
              style={{ color: accentColor }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-l-full bg-black/60 border border-white/10 backdrop-blur animate-pulse">
                <span className="text-[10px] font-mono tracking-widest text-white/70">SWIPE</span>
                <ChevronLeft size={18} />
              </div>
            </div>
          </>
        )}
        {swipeIndicator && (
          <div className="fixed inset-0 pointer-events-none z-[100000] flex items-center justify-center">
            <div
              className={`text-white/40 text-6xl font-bold animate-pulse transition-all duration-300 ${
                swipeIndicator === 'left' ? 'animate-slideOutLeft' : 'animate-slideOutRight'
              }`}
              style={{ textShadow: `0 0 20px ${accentColor}` }}
            >
              {swipeIndicator === 'left' ? <ChevronLeft size={80} /> : <ChevronRight size={80} />}
            </div>
          </div>
        )}

        {/* SWIPE HELPER - Shows on first load */}
        {currentStage === 'content' && activePage === 1 && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[50] pointer-events-none animate-bounce">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
              <ChevronLeft size={16} className="text-white/60" />
              <span className="text-xs text-white/60 font-medium">Swipe to navigate</span>
              <ChevronRight size={16} className="text-white/60" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
