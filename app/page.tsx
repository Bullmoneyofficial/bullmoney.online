"use client";

import React, { Suspense, useState, useEffect, useRef, useTransition, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spline from '@splinetool/react-spline';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { 
  Volume2, Volume1, VolumeX, X, Palette, 
  ChevronRight, GripVertical, Minimize2, Radio,
  Globe, TrendingUp, Layers, Cast, Users, Cpu
} from 'lucide-react'; 

import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 
import { ALL_THEMES, THEME_SOUNDTRACKS } from '@/components/Mainpage/ThemeComponents';

// --- Dynamic Imports ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { ssr: false, loading: () => null });
const FixedThemeConfigurator = dynamic(() => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), { ssr: false });

// --- Data Configuration ---

const PAGE_CONTENT_MAP = [
  { 
    id: 1, 
    icon: Cpu,
    label: "CONTROL CENTER", 
    title: "The Nerve Center", 
    desc: "Real-time analytics and command inputs. Monitor the pulse of the market from a single high-fidelity dashboard.",
    action: "Initialize"
  },
  { 
    id: 2, 
    icon: Globe,
    label: "WHO WE ARE", 
    title: "Global Architects", 
    desc: "We are a collective of fintech innovators pushing the boundaries of what's possible in digital finance and 3D web experiences.",
    action: "Our Vision"
  },
  { 
    id: 3, 
    icon: TrendingUp,
    label: "MARKETS", 
    title: "Multi-Asset Trading", 
    desc: "Seamless execution across Crypto, Gold, Stocks, and Forex. High leverage, low latency, zero compromise.",
    action: "View Assets"
  },
  { 
    id: 4, 
    icon: Layers,
    label: "R&D LAB", 
    title: "Wireframe vs Reality", 
    desc: "See how we transform raw data into immersive experiences. Drag the slider to reveal the engineering behind the art.",
    action: "Explore Tech"
  },
  { 
    id: 5, 
    icon: Cast,
    label: "LIVESTREAM", 
    title: "Live Feed & Blog", 
    desc: "Direct access to our trading floor live streams, daily market analysis, and educational masterclasses.",
    action: "Watch Now"
  },
  { 
    id: 6, 
    icon: Users,
    label: "ABOUT US", 
    title: "Join The Cartel", 
    desc: "We are not just a platform; we are a movement. Connect with thousands of traders worldwide.",
    action: "Contact Us"
  },
];

const PAGE_CONFIG = [
  { id: 1, type: 'full', scene: "/scene1.splinecode", label: "HERO" },
  { id: 2, type: 'full', scene: "/scene.splinecode", label: "SHOWCASE" },
  { id: 3, type: 'full', scene: "/scene3.splinecode", label: "CONCEPT", disableInteraction: true },
  { id: 4, type: 'split', sceneA: "/scene4.splinecode", sceneB: "/scene5.splinecode", labelA: "WIREFRAME", labelB: "PROTOTYPE" },
  { id: 5, type: 'full', scene: "/scene2.splinecode", label: "FINAL" },
  { id: 6, type: 'full', scene: "/scene6.splinecode", label: "INTERACTIVE" },
];

const THEME_ACCENTS: Record<string, string> = {
  't01': '#3b82f6', 't02': '#a855f7', 't03': '#22c55e', 't04': '#ef4444',
  't05': '#f59e0b', 't06': '#ec4899', 't07': '#06b6d4', 'default': '#3b82f6'
};

const getThemeColor = (id: string) => THEME_ACCENTS[id] || THEME_ACCENTS['default'];

// --- Utility Components ---

const ScrambleText = ({ text, isActive, className = "" }: { text: string, isActive: boolean, className?: string }) => {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  
  useEffect(() => {
    if (!isActive) {
        setDisplay(text);
        return;
    }
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((letter, index) => {
        if (index < iterations) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / 2;
    }, 30);
    return () => clearInterval(interval);
  }, [text, isActive]);

  return <span className={className}>{display}</span>;
};

// --- New UI Components ---

/**
 * Left Side Info Panel
 * Updates based on activePage
 */
const LeftInfoPanel = memo(({ activePage, accentColor }: { activePage: number, accentColor: string }) => {
  const content = PAGE_CONTENT_MAP[activePage - 1] || PAGE_CONTENT_MAP[0];
  const Icon = content.icon;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col max-w-[320px] pointer-events-none">
      <div className="relative">
        {/* Animated Background Line */}
        <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-white/10">
          <div 
            className="absolute w-[2px] bg-white transition-all duration-700 ease-out" 
            style={{ 
              height: '60px', 
              top: `${(activePage - 1) * 60}px`,
              boxShadow: `0 0 15px ${accentColor}`
            }} 
          />
        </div>

        {/* Content Card */}
        <div key={content.id} className="pointer-events-auto pl-4 animate-in slide-in-from-left-4 fade-in duration-500">
          <div className="flex items-center gap-3 mb-2 text-white/50">
             <div className="p-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                <Icon size={16} style={{ color: accentColor }} />
             </div>
             <span className="text-xs font-mono tracking-[0.2em]">{content.label}</span>
          </div>

          <h2 className="text-4xl font-black text-white mb-4 leading-none tracking-tight">
            <ScrambleText text={content.title} isActive={true} />
          </h2>

          <p className="text-sm text-white/70 leading-relaxed mb-6 border-l-2 border-white/10 pl-4">
            {content.desc}
          </p>

          <button className="group flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider hover:gap-4 transition-all">
            <span className="w-8 h-[2px]" style={{ backgroundColor: accentColor }} />
            {content.action}
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }} />
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * Mobile Bottom Info Card
 * Collapsed version of Left Info Panel for mobile
 */
const MobileInfoCard = memo(({ activePage, accentColor }: { activePage: number, accentColor: string }) => {
  const content = PAGE_CONTENT_MAP[activePage - 1] || PAGE_CONTENT_MAP[0];
  const Icon = content.icon;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 md:hidden pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
             <Icon size={12} style={{ color: accentColor }} />
             <span className="text-[10px] font-mono tracking-widest text-white/50">{content.label}</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{content.title}</h3>
        </div>
        
        <button className="flex-none w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
});

/**
 * Enhanced Right Navigation Rail
 * Glowing dots with tooltips
 */
const NavigationRail = memo(({ activePage, onNavigate, accentColor }: { activePage: number, onNavigate: (i:number) => void, accentColor: string }) => {
  return (
    <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 items-center pointer-events-auto">
      {PAGE_CONTENT_MAP.map((page, index) => {
        const isActive = activePage === page.id;
        
        return (
          <div key={page.id} className="group relative flex items-center justify-end">
            {/* Tooltip Label (Desktop) */}
            <div className={`
              absolute right-10 md:right-14 
              bg-black/90 backdrop-blur-md border border-white/10 
              px-3 py-1.5 rounded-lg 
              text-[10px] md:text-xs font-bold tracking-wider text-white 
              transition-all duration-300 origin-right
              shadow-[0_0_20px_rgba(0,0,0,0.5)]
              ${isActive ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 translate-x-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0'}
            `}>
              {page.label}
              {/* Connector Arrow */}
              <div className="absolute top-1/2 -right-1 -mt-1 w-2 h-2 bg-black/90 border-t border-r border-white/10 rotate-45 transform" />
            </div>

            {/* Glowing Dot Button */}
            <button 
              onClick={() => onNavigate(index)}
              className="relative w-4 h-4 md:w-3 md:h-12 flex items-center justify-center focus:outline-none"
            >
              {/* Glow Container */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-500 blur-md ${isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-30'}`}
                style={{ backgroundColor: accentColor }}
              />
              
              {/* The Actual Bar/Dot */}
              <div 
                className={`
                  relative z-10 w-2 md:w-1.5 bg-white rounded-full transition-all duration-500 ease-out
                  shadow-[0_0_10px_rgba(255,255,255,0.3)]
                  ${isActive ? 'h-4 md:h-10 bg-white' : 'h-2 md:h-3 bg-white/40 group-hover:bg-white group-hover:h-6'}
                `}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
});

// --- Main Components (Simplified for brevity where unchanged) ---

const SceneWrapper = memo(({ isVisible, sceneUrl, allowInput = true, forceNoPointer = false }: any) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible) timer = setTimeout(() => setShouldLoad(true), 150);
    else setShouldLoad(false);
    return () => clearTimeout(timer);
  }, [isVisible]);
  
  return (
    <div className={`w-full h-full relative transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'} ${forceNoPointer ? 'pointer-events-none' : (allowInput ? 'pointer-events-auto' : 'pointer-events-none')}`}>
      {shouldLoad && <Suspense fallback={null}><Spline scene={sceneUrl} className="w-full h-full block object-cover" /></Suspense>}
    </div>
  );
});

const DraggableSplitSection = memo(({ config, activePage, onVisible, accentColor }: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const isActive = config.id === activePage;
  const shouldRender = Math.abs(config.id - activePage) <= 1;

  const handleDrag = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPos = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 10), 90);
    setSplitPos(newPos);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => handleDrag(e.clientX);
    const up = () => setIsDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDragging, handleDrag]);

  // Touch handlers
  const onTouchStart = () => setIsDragging(true);
  const onTouchMove = (e: React.TouchEvent) => { if (isDragging) handleDrag(e.touches[0].clientX); };
  const onTouchEnd = () => setIsDragging(false);

  useEffect(() => { if (containerRef.current) onVisible(containerRef.current, config.id - 1); }, [onVisible, config.id]);

  return (
    <section ref={containerRef} className="relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-row">
      <div style={{ width: `${splitPos}%` }} className="relative h-full overflow-hidden border-r border-white/10 transition-[width] duration-75 ease-linear">
        <div className="absolute inset-0 w-screen h-full"><SceneWrapper isVisible={shouldRender} sceneUrl={config.sceneA} forceNoPointer={isDragging} /></div>
        <div className={`absolute top-32 left-8 md:left-20 z-20 transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="text-xl md:text-5xl font-bold text-white mb-2">{config.labelA}</div>
          <div className="text-xs font-mono text-white/50 border border-white/20 rounded px-2 py-1 inline-block">LOW FIDELITY</div>
        </div>
      </div>

      <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        className="absolute top-0 bottom-0 z-50 w-16 -ml-8 cursor-col-resize flex items-center justify-center group touch-none" style={{ left: `${splitPos}%` }}>
        <div className="w-[1px] h-full bg-white/20 group-hover:bg-white/60 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        <div className="absolute w-12 h-12 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform" style={{ borderColor: isDragging ? accentColor : 'rgba(255,255,255,0.2)' }}>
          <GripVertical size={20} className={isDragging ? 'text-white' : 'text-white/70'} />
        </div>
      </div>

      <div style={{ width: `${100 - splitPos}%` }} className="relative h-full overflow-hidden transition-[width] duration-75 ease-linear">
        <div className="absolute inset-0 w-screen h-full -left-[100vw] translate-x-full">
            <div className="w-full h-full absolute right-0"><SceneWrapper isVisible={shouldRender} sceneUrl={config.sceneB} forceNoPointer={isDragging} /></div>
        </div>
        <div className={`absolute bottom-32 right-8 md:right-24 z-20 text-right transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <div className="text-xl md:text-5xl font-bold text-white mb-2" style={{ color: accentColor }}>{config.labelB}</div>
          <div className="text-xs font-mono text-white/50 border border-white/20 rounded px-2 py-1 inline-block">HIGH FIDELITY</div>
        </div>
      </div>
    </section>
  );
});

// --- Main Page ---

export default function Home() {
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [isMuted, setIsMuted] = useState(true); 
  const [volume, setVolume] = useState(25);
  const [activePage, setActivePage] = useState<number>(1);
  
  const playerRef = useRef<any>(null);
  const [_, startTransition] = useTransition();
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const accentColor = useMemo(() => getThemeColor(activeThemeId), [activeThemeId]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('user_theme_id');
      const hasRegistered = localStorage.getItem('vip_user_registered') === 'true';
      if (storedTheme) setActiveThemeId(storedTheme);
      if (!hasRegistered) setCurrentStage("register");
    }
  }, []);

  // Sync active page
  useEffect(() => {
    if(currentStage !== 'content') return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) startTransition(() => setActivePage(index + 1));
          }
        });
      }, { threshold: 0.55 }
    );
    pageRefs.current.forEach((ref) => { if (ref) observerRef.current?.observe(ref); });
    return () => observerRef.current?.disconnect();
  }, [currentStage]);

  const handleRef = useCallback((el: HTMLElement | null, index: number) => { pageRefs.current[index] = el; }, []);
  
  const scrollToPage = (index: number) => {
    if(index < 0 || index >= PAGE_CONFIG.length) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleMusic = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (playerRef.current) newState ? playerRef.current.mute() : playerRef.current.unMute();
  };

  if (!isClient) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[999999] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* Audio Player */}
      <div className="fixed opacity-0 pointer-events-none w-px h-px overflow-hidden">
        <YouTube videoId={THEME_SOUNDTRACKS?.[activeThemeId] || 'jfKfPfyJRdk'} opts={{ playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: THEME_SOUNDTRACKS?.[activeThemeId] } }} onReady={(e: { target: { setVolume: (arg0: number) => void; }; }) => { playerRef.current = e.target; if(!isMuted) e.target.setVolume(volume); }} />
      </div>

      {currentStage === "register" && <div className="fixed inset-0 z-[100] bg-black"><RegisterPage onUnlock={() => setCurrentStage("hold")} /></div>}
      {currentStage === "hold" && <div className="fixed inset-0 z-[100]"><BullMoneyGate onUnlock={() => setCurrentStage("content")}><></></BullMoneyGate></div>}
      {currentStage === "v2" && <div className="fixed inset-0 z-[100]"><MultiStepLoaderV2 onFinished={() => setCurrentStage("content")} /></div>}

      {currentStage === 'content' && (
        <>
          <header className="fixed top-0 inset-x-0 z-50">
            <Navbar setShowConfigurator={setShowConfigurator} activeThemeId={activeThemeId} accentColor={accentColor} onThemeChange={setActiveThemeId} />
          </header>

          <main className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black no-scrollbar relative">
            <TargetCursor spinDuration={2} hideDefaultCursor={true} targetSelector="button, a, .cursor-target" />
            
            {/* --- NEW UI ELEMENTS --- */}
            
            {/* Desktop Left Info Panel */}
            <LeftInfoPanel activePage={activePage} accentColor={accentColor} />

            {/* Mobile Bottom Info Card */}
            <MobileInfoCard activePage={activePage} accentColor={accentColor} />

            {/* Glowing Navigation Rail */}
            <NavigationRail activePage={activePage} onNavigate={(i) => scrollToPage(i)} accentColor={accentColor} />

            {/* Bottom Controls (Music/Theme) */}
            <div className="fixed bottom-6 left-6 z-40 flex items-end gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl transition-all hover:border-white/20">
                <button onClick={() => setShowConfigurator(true)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                  <Palette size={18} style={{ color: showConfigurator ? accentColor : undefined }} />
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button onClick={toggleMusic} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                  {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} style={{ color: accentColor }}/>}
                </button>
                {!isMuted && (
                   <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} 
                          className="w-16 h-1 mx-2 bg-white/10 rounded-lg appearance-none cursor-pointer" style={{ accentColor: accentColor }} />
                )}
              </div>
            </div>

            {showConfigurator && (
              <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                <div className="w-full max-w-6xl h-[85vh] bg-[#050505] rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
                  <button onClick={() => setShowConfigurator(false)} className="absolute top-6 right-6 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><Minimize2 size={24} /></button>
                  <FixedThemeConfigurator initialThemeId={activeThemeId} onThemeChange={setActiveThemeId} />
                </div>
              </div>
            )}

            {PAGE_CONFIG.map((page) => (
              <React.Fragment key={page.id}>
                {page.type === 'split' ? 
                  <DraggableSplitSection config={page} activePage={activePage} onVisible={handleRef} accentColor={accentColor} /> : 
                  <section ref={(el) => handleRef(el, page.id - 1)} className="relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-col items-center justify-center">
                    <SceneWrapper isVisible={Math.abs(page.id - activePage) <= 1} sceneUrl={page.scene} allowInput={!page.disableInteraction} />
                  </section>
                }
              </React.Fragment>
            ))}
          </main>
        </>
      )}
    </>
  );
}