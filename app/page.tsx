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
  Layers, Map as MapIcon, Lock, Unlock, Zap
} from 'lucide-react';

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar";
import RegisterPage from "./register/pagemode";
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock";
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2";
import InlineFaq from "@/components/Mainpage/InlineFaq";
import { Footer } from "@/components/Mainpage/footer";

// --- THEME & MUSIC DATA ---
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';

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
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0; }
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
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .mobile-optimize {
      will-change: auto;
      transform: translateZ(0);
    }
  }
  
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y pinch-zoom;
    overscroll-behavior: contain;
  }
  
  section {
    touch-action: pan-y pinch-zoom;
  }
`;

// ----------------------------------------------------------------------
// 3. UI COMPONENTS
// ----------------------------------------------------------------------

const ShineButton = ({ children, onClick, active, className = "" }: any) => (
  <button
    onClick={(e) => {
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(10);
      onClick(e);
    }}
    className={`
      shining-border transition-all duration-300 group hover-lift
      ${active ? 'scale-110 shadow-[0_0_20px_rgba(0,100,255,0.6)]' : 'opacity-70 hover:opacity-100'}
      ${className}
    `}
  >
    <div className="relative z-10 w-full h-full flex items-center justify-center text-blue-100">
      {children}
    </div>
  </button>
);

const OrientationOverlay = ({ onDismiss }: { onDismiss: () => void }) => (
    <div className="fixed inset-0 z-[2000000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
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
        onClick={() => {
          playClickSound();
          onDismiss();
        }} 
        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-bold text-white transition-colors hover-lift">
          CONTINUE ANYWAY
      </button>
    </div>
);

// Info Panel Component
const InfoPanel = ({ config, isOpen, onClose, accentColor }: any) => (
  <div 
    className={`fixed left-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r z-[600000] transition-transform duration-500 ease-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}
    style={{ borderColor: `${accentColor}40` }}
  >
    <button
      onClick={onClose}
      className="absolute top-6 right-6 text-white/50 hover:text-white p-2 transition-colors"
    >
      <X size={24} />
    </button>
    
    <div className="p-8 h-full overflow-y-auto no-scrollbar flex flex-col gap-6">
      {/* Encrypted Title */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs font-mono tracking-wider" style={{ color: accentColor }}>
            ENCRYPTED
          </span>
        </div>
        <h3 className="font-mono text-lg text-white/90 break-all">
          {config?.encryptedTitle || 'X39yRz1'}
        </h3>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Main Title */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {config?.infoTitle || 'Information'}
        </h2>
        <p className="text-white/70 text-sm leading-relaxed">
          {config?.infoDesc || 'Description not available'}
        </p>
      </div>
      
      {/* Fun Fact Section */}
      {config?.funFact && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: `${accentColor}15`,
            borderColor: `${accentColor}40`
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-xs font-bold tracking-wider" style={{ color: accentColor }}>
                FUN FACT
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {config.funFact}
            </p>
          </div>
        </>
      )}
      
      {/* Page Number Badge */}
      <div className="mt-auto">
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

// Sound effect helper
const playClickSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {}
};

// ----------------------------------------------------------------------
// 4. MUSIC SYSTEM
// ----------------------------------------------------------------------
const BackgroundMusicSystem = ({ themeId, onReady, volume }: { themeId: string; onReady: (player: any) => void; volume: number; }) => {
  const videoId = (THEME_SOUNDTRACKS && THEME_SOUNDTRACKS[themeId]) ? THEME_SOUNDTRACKS[themeId] : 'jfKfPfyJRdk';
  const opts: YouTubeProps['opts'] = {
    height: '1', width: '1',
    playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: videoId, modestbranding: 1, playsinline: 1, enablejsapi: 1, origin: typeof window !== 'undefined' ? window.location.origin : undefined },
  };
  return (
    <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1] overflow-hidden w-px h-px">
      <YouTube videoId={videoId} opts={opts} onReady={(e: YouTubeEvent) => { if(e.target) onReady(e.target); }} />
    </div>
  );
};

// ----------------------------------------------------------------------
// 5. 3D SCENE WRAPPERS WITH LAZY LOADING
// ----------------------------------------------------------------------
const SceneWrapper = memo(({ isVisible, sceneUrl, allowInput = true, forceNoPointer = false, parallaxOffset = 0 }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLoaded]);

  return (
    <div
      className={`
        w-full h-full relative transition-opacity duration-700 parallax-layer
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${forceNoPointer ? 'pointer-events-none' : (allowInput ? 'pointer-events-auto' : 'pointer-events-none')}
      `}
      style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
    >
      {isVisible && isLoaded && (
        <Suspense fallback={
          <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center text-blue-500/20 font-mono text-[10px]">
            LOADING ASSET...
          </div>
        }>
           <Spline scene={sceneUrl} className="w-full h-full block object-cover" />
        </Suspense>
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

const FullScreenSection = memo(({ config, activePage, onVisible, parallaxOffset }: any) => {
  const isHeavyScene = config.id === 5;
  const isTSX = config.type === 'tsx';
  const shouldRender = isTSX
    ? (config.id >= activePage - 1) && (config.id <= activePage + 1)
    : config.id === activePage;
  const isActive = config.id === activePage;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if(sectionRef.current) onVisible(sectionRef.current, config.id - 1);
  }, [onVisible, config.id]);

  // TSX components get natural height with breathing room; Spline scenes stay fixed-height for snap scrolling
  const sectionClass = isTSX
    ? 'relative w-full min-h-[125dvh] h-auto flex-none snap-start bg-black mobile-optimize overflow-visible py-12 md:py-16'
    : 'relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-col items-center justify-center mobile-optimize';

  return (
    <section
      ref={sectionRef}
      className={`${sectionClass} ${isActive ? 'page-flip-active' : ''}`}
    >
      <div className={`w-full ${isTSX && isMobile ? 'h-auto min-h-full' : 'h-full'} relative`}>
        {config.type === 'tsx' ? (
          <div className="pb-20 md:pb-28">
            <TSXWrapper componentName={config.component} isVisible={shouldRender} />
          </div>
        ) : (
            <SceneWrapper
              isVisible={shouldRender}
              sceneUrl={config.scene}
              allowInput={!config.disableInteraction}
              parallaxOffset={isHeavyScene ? parallaxOffset * 0.15 : parallaxOffset}
            />
        )}
        {/* Only show label for Spline scenes, not TSX components */}
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

const DraggableSplitSection = memo(({ config, activePage, onVisible, isMobileView, parallaxOffset }: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 72, y: 35 });
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const isActive = config.id === activePage;

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

  const handleDragMove = useCallback((e: any) => {
    if (!containerRef.current) return;
    requestAnimationFrame(() => {
        const rect = containerRef.current!.getBoundingClientRect();
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
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
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

  return (
    <section 
      ref={containerRef} 
      className={`relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex ${layoutClass} ${isDragging ? 'select-none cursor-grabbing' : ''} mobile-optimize`}
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
// 6. BOTTOM CONTROLS & WIDGETS
// ----------------------------------------------------------------------
const BottomControls = ({ isPlaying, onToggleMusic, onOpenTheme, themeName, volume, onVolumeChange, visible, accentColor }: any) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const containerStyle = {
        borderColor: `${accentColor}40`,
        boxShadow: `0 0 20px ${accentColor}15`
    };

    if (!visible) return null;
    
    return (
        <div 
          className="pointer-events-auto flex flex-col items-start gap-4 transition-all duration-700 ease-in-out absolute bottom-8 left-8" 
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }} 
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
            <div 
              className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border p-2 rounded-full transition-colors duration-500 hover-lift"
              style={containerStyle}
            >
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    playClickSound();
                    if (navigator.vibrate) navigator.vibrate(10);
                    onOpenTheme(); 
                  }} 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-gray-400 transition-all duration-300 border border-transparent group relative hover:text-white hover:bg-white/10"
                >
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity shimmer-effect" style={{ backgroundColor: accentColor }} />
                    <Palette size={18} style={{ color: isHovered ? accentColor : undefined }} />
                </button>
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    playClickSound();
                    if (navigator.vibrate) navigator.vibrate(10);
                    onToggleMusic(); 
                  }} 
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 relative`} 
                  style={{ 
                      backgroundColor: isPlaying ? `${accentColor}33` : '#1f2937', 
                      color: isPlaying ? accentColor : '#6b7280', 
                      boxShadow: isPlaying ? `0 0 15px ${accentColor}4d` : 'none' 
                  }}
                >
                    {isPlaying ? (volume > 50 ? <Volume2 size={18}/> : <Volume1 size={18}/>) : <VolumeX size={18}/>}
                    {isPlaying && <span className="absolute inset-0 rounded-full border animate-ping opacity-20" style={{ borderColor: accentColor }} />}
                </button>
                
                <div className={`flex items-center transition-all duration-500 overflow-hidden ${isHovered ? 'w-24 px-2 opacity-100' : 'w-0 opacity-0'}`}>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={(e) => onVolumeChange(parseInt(e.target.value))} 
                      className="w-full h-1 rounded-lg appearance-none cursor-pointer" 
                      style={{ accentColor: accentColor, backgroundColor: `${accentColor}44` }} 
                    />
                </div>
            </div>
            
            <div className={`hidden md:flex flex-col overflow-hidden transition-all duration-500 pl-2 ${isPlaying ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                <span className="text-[10px] uppercase tracking-wider font-bold transition-colors duration-500" style={{ color: accentColor }}>
                  Now Streaming
                </span>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-white truncate font-mono">{themeName} Radio</span>
                    <div className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 h-full animate-music-bar-1" style={{ backgroundColor: accentColor }}/>
                        <span className="w-0.5 h-full animate-music-bar-2" style={{ backgroundColor: accentColor }}/>
                        <span className="w-0.5 h-full animate-music-bar-3" style={{ backgroundColor: accentColor }}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SupportWidget = ({ accentColor }: { accentColor: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => { setTimeout(() => setIsVisible(true), 500); }, []);
    
    return (
      <div className={`absolute bottom-8 right-8 z-[9999] pointer-events-auto transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
        <a 
          href="https://t.me/+dlP_A0ebMXs3NTg0" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1 hover-lift"
          onClick={() => {
            playClickSound();
            if (navigator.vibrate) navigator.vibrate(20);
          }}
        >
          <div 
            className="absolute inset-0 rounded-full blur-[20px] opacity-40 animate-pulse group-hover:opacity-80 group-hover:scale-110 transition-all duration-500" 
            style={{ backgroundColor: accentColor }} 
          />
          
          <div 
            className="relative flex items-center justify-center w-full h-full rounded-full shadow-inner border overflow-hidden z-10" 
            style={{ 
                background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}, ${accentColor}99)`, 
                borderColor: `${accentColor}88` 
            }}
          >
              <MessageCircle className="w-7 h-7 text-white relative z-30 drop-shadow-md" strokeWidth={2.5} />
          </div>
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
  const [isTouch, setIsTouch] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);
    
  const accentColor = useMemo(() => getThemeColor(activeThemeId), [activeThemeId]);
  const isPlaying = useMemo(() => !isMuted, [isMuted]);

  // --- INIT ---
  useEffect(() => {
    setIsClient(true);
    
    // Inject Styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = GLOBAL_STYLES;
    document.head.appendChild(styleSheet);
    
    setIsTouch(matchMedia && matchMedia('(pointer: coarse)').matches);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    // Handle both modern and legacy APIs
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      // Fallback for older browsers
      (mediaQuery as any).addListener(handleMotionChange);
    }

    // Parallax scroll effect
    const handleScroll = () => {
      if (!prefersReducedMotion) {
        requestAnimationFrame(() => {
          setParallaxOffset(window.scrollY);
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial Layout Check
    const checkLayout = () => {
        const isNarrow = window.innerWidth < 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isNarrow && isPortrait) {
            setIsMobileView(true);
            setShowOrientationWarning(true);
        } else {
            setIsMobileView(false);
        }
    };
    
    checkLayout();
    window.addEventListener('resize', checkLayout);
    
    // Load User Prefs
    const storedTheme = localStorage.getItem('user_theme_id');
    const storedMute = localStorage.getItem('user_is_muted');
    const storedVol = localStorage.getItem('user_volume');
    const hasRegistered = localStorage.getItem('vip_user_registered') === 'true';
    
    if (storedTheme) setActiveThemeId(storedTheme);
    if (storedMute !== null) setIsMuted(storedMute === 'true');
    if (storedVol) setVolume(parseInt(storedVol));
    if (!hasRegistered) setCurrentStage("register");
    else setCurrentStage("v2");
    
    // Cleanup
    return () => {
      document.head.removeChild(styleSheet);
      window.removeEventListener('resize', checkLayout);
      window.removeEventListener('scroll', handleScroll);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        (mediaQuery as any).removeListener(handleMotionChange);
      }
    };
  }, [prefersReducedMotion]);

  // --- SCROLL OBSERVER ---
  useEffect(() => {
    if(currentStage !== 'content') return;
     
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) {
              startTransition(() => {
                setActivePage(index + 1);
                setParticleTrigger(prev => prev + 1);
              });
            }
          }
        });
      },
      { threshold: 0.4 } 
    );
    
    pageRefs.current.forEach((ref) => { if (ref) observerRef.current?.observe(ref); });
    return () => observerRef.current?.disconnect();
  }, [currentStage]);

  const handleRef = useCallback((el: HTMLElement | null, index: number) => {
    pageRefs.current[index] = el;
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  const scrollToPage = (index: number) => {
    if(index < 0 || index >= PAGE_CONFIG.length) return;
    setIsMobileNavOpen(false);
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(10);
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      localStorage.setItem('user_is_muted', String(newMutedState));
      if (newMutedState) safePause(); else safePlay();
  }, [isMuted, safePlay, safePause]);

  const handleVolumeChange = (newVol: number) => {
      setVolume(newVol);
      localStorage.setItem('user_volume', newVol.toString());
      if(playerRef.current) playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) { setIsMuted(false); safePlay(); }
  };

  // --- GATING HANDLERS ---
  const handleRegisterComplete = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('vip_user_registered', 'true'); 
    setCurrentStage("hold"); 
  }, []);
  
  const handleHoldComplete = useCallback(() => setCurrentStage("content"), []);
  
  const handleV2Complete = useCallback(() => { 
    setCurrentStage("content"); 
    safePlay(); 
    setParticleTrigger(prev => prev + 1);
  }, [safePlay]);
   
  const handleThemeChange = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
    setActiveThemeId(themeId);
    setIsMuted(muted); 
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
        localStorage.setItem('user_is_muted', String(muted));
    }
    setShowConfigurator(false); 
    setParticleTrigger(prev => prev + 1);
  }, []);

  if (!isClient) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <BackgroundMusicSystem themeId={activeThemeId} onReady={handlePlayerReady} volume={volume} />
      <ParticleEffect trigger={particleTrigger} />
      {!isTouch && <CustomCursor accentColor={accentColor} />}

      {/* --- INFO PANEL --- */}
      <InfoPanel 
        config={PAGE_CONFIG[activePage - 1]} 
        isOpen={infoPanelOpen} 
        onClose={() => setInfoPanelOpen(false)}
        accentColor={accentColor}
      />
      
      {/* --- FAQ OVERLAY --- */}
      {faqOpen && (
        <div className="fixed inset-0 z-[950000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl">
            <button 
              onClick={() => setFaqOpen(false)} 
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
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

      {/* --- LAYER 1: FIXED CONTROLS --- */}
      <div className="fixed inset-0 z-[400000] pointer-events-none">
          <BottomControls 
            visible={currentStage === 'content'} 
            isPlaying={isPlaying} 
            onToggleMusic={toggleMusic} 
            onOpenTheme={() => {
              setShowConfigurator(true);
              setParticleTrigger(prev => prev + 1);
            }} 
            themeName={activeTheme.name} 
            volume={volume} 
            onVolumeChange={handleVolumeChange} 
            accentColor={accentColor} 
          />
          <SupportWidget accentColor={accentColor} />
      </div>

      {/* --- LAYER 2: CONFIGURATOR --- */}
      {showConfigurator && (
        <div className="fixed inset-0 z-[300000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    playClickSound();
                    setShowConfigurator(false); 
                  }} 
                  className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-colors hover-lift"
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
        <main className={`w-full h-full flex flex-col overflow-y-scroll overflow-x-hidden ${isTouch ? '' : 'snap-y snap-mandatory'} scroll-smooth bg-black no-scrollbar text-white relative mobile-scroll`}>
            
            {showOrientationWarning && (<OrientationOverlay onDismiss={() => setShowOrientationWarning(false)} />)}

            {/* DESKTOP NAV */}
            <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-6 items-center pointer-events-auto">
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
                  onClick={() => {
                    playClickSound();
                    if (navigator.vibrate) navigator.vibrate(20);
                    setIsMobileNavOpen(true);
                  }}
                >
                  <Layers size={24} />
                </ShineButton>
            </div>

            {/* MOBILE NAV HUD */}
            <div className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl transition-all duration-500 flex flex-col items-center justify-center p-6 ${isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-10'}`}>
                <button 
                  onClick={() => {
                    playClickSound();
                    setIsMobileNavOpen(false);
                  }} 
                  className="absolute top-6 right-6 text-white/50 hover:text-white p-2 hover-lift"
                >
                  <X size={32} />
                </button>
                
                <h2 className="text-white/40 font-mono text-sm tracking-[0.3em] mb-8">MISSION CONTROL</h2>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    {PAGE_CONFIG.map((page, index) => (
                        <button 
                          key={page.id} 
                          onClick={() => scrollToPage(index)} 
                          className={`relative h-24 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 hover-lift ${
                            activePage === page.id 
                              ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(0,100,255,0.3)]' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                            <span className="text-2xl font-bold text-white">{index + 1}</span>
                            <span className="text-[10px] font-mono text-blue-300 tracking-wider uppercase">
                              {page.label}
                            </span>
                        </button>
                    ))}
                </div>
                
                <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => { 
                        playClickSound();
                        setIsMobileView(!isMobileView); 
                        setIsMobileNavOpen(false); 
                      }} 
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover-lift"
                    >
                        {isMobileView ? <Smartphone size={16} /> : <Monitor size={16} />}
                        {isMobileView ? "MOBILE LAYOUT" : "DESKTOP LAYOUT"}
                    </button>
                </div>
            </div>

            {/* INFO BUTTON */}
            <div className="fixed top-24 left-4 z-50 md:bottom-8 md:top-auto md:left-8 pointer-events-auto">
                 <button 
                   onClick={() => {
                     playClickSound();
                     if (navigator.vibrate) navigator.vibrate(10);
                     setInfoPanelOpen(!infoPanelOpen);
                   }} 
                   className="md:hidden text-white/50 hover:text-white p-2 bg-black/20 backdrop-blur rounded-full mb-2 hover-lift"
                 >
                   {infoPanelOpen ? <Unlock size={24} /> : <Lock size={24} />}
                 </button>
                 
                 <div className="hidden md:block">
                   <ShineButton 
                     className="w-12 h-12 rounded-full" 
                     onClick={() => {
                       playClickSound();
                       if (navigator.vibrate) navigator.vibrate(10);
                       setInfoPanelOpen(!infoPanelOpen);
                     }}
                   >
                     {infoPanelOpen ? <Unlock size={20} /> : <Lock size={20} />}
                   </ShineButton>
                 </div>
                 
                 <div className="mt-3">
                   <ShineButton
                     className="w-12 h-12 rounded-full"
                     onClick={() => {
                       playClickSound();
                       if (navigator.vibrate) navigator.vibrate(10);
                       setFaqOpen(true);
                     }}
                   >
                     <Info size={20} />
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
                    />
                ) : (
                    <FullScreenSection 
                      config={page} 
                      activePage={activePage} 
                      onVisible={handleRef}
                      parallaxOffset={parallaxOffset}
                    />
                )}
                </React.Fragment>
            ))}
            
            <div className="w-full mt-10">
              <Footer />
            </div>
        </main>
      </div>
    </>
  );
}
