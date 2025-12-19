"use client";

import React, { Suspense, useState, useEffect, useRef, useTransition, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spline from '@splinetool/react-spline';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { 
  Volume2, Volume1, VolumeX, X, Palette, MessageCircle,
  ChevronUp, ChevronDown, Info, GripVertical, AlertTriangle
} from 'lucide-react'; 

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 

// --- THEME & MUSIC DATA ---
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false, 
  loading: () => null 
});

const FixedThemeConfigurator = dynamic(
  () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
  { ssr: false }
);

// ----------------------------------------------------------------------
// ERROR BOUNDARY
// ----------------------------------------------------------------------
class MobileErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Error Boundary:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-8 z-[999999]">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Safe Mode Active</h2>
            <p className="text-white/60 mb-4 text-sm">
              The experience encountered an issue. Reloading with reduced features.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ----------------------------------------------------------------------
// CACHE MANAGER
// ----------------------------------------------------------------------
const CacheManager = {
  prefix: 'app_cache_v1_',
  
  set: (key: string, value: any, ttl?: number) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl || (24 * 60 * 60 * 1000) // 24h default
      };
      localStorage.setItem(CacheManager.prefix + key, JSON.stringify(item));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  },

  get: (key: string) => {
    try {
      const raw = localStorage.getItem(CacheManager.prefix + key);
      if (!raw) return null;
      
      const item = JSON.parse(raw);
      const age = Date.now() - item.timestamp;
      
      if (age > item.ttl) {
        CacheManager.delete(key);
        return null;
      }
      
      return item.value;
    } catch (e) {
      console.warn('Cache read failed:', e);
      return null;
    }
  },

  delete: (key: string) => {
    try {
      localStorage.removeItem(CacheManager.prefix + key);
    } catch (e) {}
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CacheManager.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }
};

// ----------------------------------------------------------------------
// INPUT ABSTRACTION LAYER (Enhanced)
// ----------------------------------------------------------------------
type InputMode = 'MOUSE' | 'TOUCH' | 'HYBRID';
type InteractionIntent = 'NAVIGATE' | 'MANIPULATE' | 'SCROLL' | 'IDLE';

const getInputMode = (): InputMode => {
  if (typeof window === 'undefined') return 'MOUSE';
  const hasTouch = 'ontouchstart' in window;
  const hasPointer = window.matchMedia('(pointer: fine)').matches;
  if (hasTouch && hasPointer) return 'HYBRID';
  return hasTouch ? 'TOUCH' : 'MOUSE';
};

const useInputMode = () => {
  const [mode, setMode] = useState<InputMode>('MOUSE');
  const [intent, setIntent] = useState<InteractionIntent>('IDLE');
  
  useEffect(() => {
    setMode(getInputMode());
    
    // Detect mode changes on hybrid devices
    const onTouchStart = () => setMode('TOUCH');
    const onMouseMove = () => {
      if (mode === 'TOUCH') setMode('HYBRID');
    };
    
    window.addEventListener('touchstart', onTouchStart, { once: true, passive: true });
    window.addEventListener('mousemove', onMouseMove, { once: true, passive: true });
    
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [mode]);
  
  return { mode, intent, setIntent };
};

const hapticFeedback = (strength: number = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(strength);
    } catch (e) {}
  }
};

// ----------------------------------------------------------------------
// DATA CONFIGURATION
// ----------------------------------------------------------------------
const PAGE_CONFIG = [
  { 
    id: 1, 
    type: 'full', 
    scene: "/scene1.splinecode", 
    label: "HERO",
    infoTitle: "The Hero Moment",
    infoDesc: "This scene establishes the visual language. We use high-fidelity PBR textures and dramatic lighting.",
    heavyAsset: true
  },
  { 
    id: 2, 
    type: 'full', 
    scene: "/scene.splinecode", 
    label: "SHOWCASE",
    infoTitle: "Product Showcase",
    infoDesc: "A 360-degree interactive view. Users can drag to rotate.",
    heavyAsset: true
  },
  { 
    id: 3, 
    type: 'full', 
    scene: "/scene3.splinecode", 
    label: "CONCEPT",
    infoTitle: "Conceptual Abstraction",
    infoDesc: "Pure form. Physics are ignored in favor of aesthetic balance.",
    disableInteraction: true,
    heavyAsset: false
  },
  { 
    id: 4, 
    type: 'split', 
    sceneA: "/scene5.splinecode", 
    sceneB: "/scene4.splinecode", 
    labelA: "WIREFRAME", 
    labelB: "PROTOTYPE",
    infoTitle: "The Split Process",
    infoDesc: "Drag the slider to compare low-fidelity wireframe vs high-fidelity prototype.",
    heavyAsset: true
  },
  { 
    id: 5, 
    type: 'full', 
    scene: "/scene2.splinecode", 
    label: "FINAL",
    infoTitle: "Production Ready",
    infoDesc: "Baked lighting and optimized geometry. Runs at 60fps.",
    heavyAsset: false
  },
  { 
    id: 6, 
    type: 'full', 
    scene: "/scene6.splinecode", 
    label: "INTERACTIVE",
    infoTitle: "User Agency",
    infoDesc: "The final playground. Physics are enabled.",
    heavyAsset: true
  },
];

const FALLBACK_THEME: Partial<Theme> = {
  id: 'default',
  name: 'Loading...',
  filter: 'none',
  mobileFilter: 'none',
};

const THEME_ACCENTS: Record<string, string> = {
  't01': '#3b82f6',
  't02': '#a855f7',
  't03': '#22c55e',
  't04': '#ef4444',
  't05': '#f59e0b',
  't06': '#ec4899',
  't07': '#06b6d4',
  'default': '#3b82f6'
};

const getThemeColor = (id: string) => THEME_ACCENTS[id] || THEME_ACCENTS['default'];

// ----------------------------------------------------------------------
// DEVICE DETECTION
// ----------------------------------------------------------------------
const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    isMobile: false,
    isLowPower: false,
    supportsBackdropFilter: true,
    maxConcurrentScenes: 3
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;
    const isLowPower = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Test backdrop-filter support
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') || 
                                   CSS.supports('-webkit-backdrop-filter', 'blur(10px)');

    setCapabilities({
      isMobile,
      isLowPower,
      supportsBackdropFilter,
      maxConcurrentScenes: isMobile ? 2 : 3
    });
  }, []);

  return capabilities;
};

// ----------------------------------------------------------------------
// GLOBAL STYLES
// ----------------------------------------------------------------------
const GLOBAL_STYLES = `
  @keyframes spin-border {
    0% { --bg-angle: 0deg; }
    100% { --bg-angle: 360deg; }
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
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  html, body { background-color: black; overflow-x: hidden; }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
  }
`;

// ----------------------------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------------------------
const ShineButton = memo(({ children, onClick, active, className = "" }: any) => (
  <button
    onClick={onClick}
    className={`
      shining-border transition-all duration-300 group
      ${active ? 'scale-110 shadow-[0_0_20px_rgba(0,100,255,0.6)]' : 'opacity-70 hover:opacity-100'}
      ${className}
    `}
  >
    <div className="relative z-10 w-full h-full flex items-center justify-center text-blue-100">
      {children}
    </div>
  </button>
));

const OrientationOverlay = memo(({ onDismiss }: { onDismiss: () => void }) => (
  <div className="fixed inset-0 z-[2000000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
    <div className="mb-6 relative">
      <div className="w-16 h-24 border-2 border-blue-500 rounded-lg flex items-center justify-center animate-pulse">
        <div className="text-blue-500 text-2xl">↻</div>
      </div>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Best Experience in Landscape</h2>
    <p className="text-white/60 max-w-xs mb-8 leading-relaxed">
      Please rotate your device for the full immersive experience.
    </p>
    <button onClick={onDismiss} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-bold text-white transition-colors">
      CONTINUE ANYWAY
    </button>
  </div>
));

// ----------------------------------------------------------------------
// AUDIO ENGINE (Isolated)
// ----------------------------------------------------------------------
const useAudioEngine = (themeId: string, isConfiguratorOpen: boolean) => {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(25);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const cached = CacheManager.get('audio_state');
    if (cached) {
      setIsMuted(cached.muted);
      setVolume(cached.volume);
    }
  }, []);

  const persistState = useCallback((muted: boolean, vol: number) => {
    CacheManager.set('audio_state', { muted, volume: vol });
  }, []);

  const safePlay = useCallback(() => {
    if (isMuted || isConfiguratorOpen || !playerRef.current || !isReady) return;
    try {
      playerRef.current.unMute?.();
      playerRef.current.setVolume?.(volume);
      playerRef.current.playVideo?.();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, [isMuted, isConfiguratorOpen, volume, isReady]);

  const safePause = useCallback(() => {
    try {
      playerRef.current?.pauseVideo?.();
    } catch (e) {}
  }, []);

  const handlePlayerReady = useCallback((player: any) => {
    playerRef.current = player;
    setIsReady(true);
    if (isMuted) {
      player.mute?.();
    } else {
      player.unMute?.();
      player.setVolume?.(volume);
    }
  }, [isMuted, volume]);

  const toggleMusic = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    persistState(newMuted, volume);
    if (newMuted) safePause();
    else safePlay();
    hapticFeedback(10);
  }, [isMuted, volume, persistState, safePlay, safePause]);

  const changeVolume = useCallback((newVol: number) => {
    setVolume(newVol);
    persistState(isMuted, newVol);
    playerRef.current?.setVolume?.(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      safePlay();
    }
  }, [isMuted, persistState, safePlay]);

  useEffect(() => {
    if (isConfiguratorOpen) safePause();
    else if (!isMuted) safePlay();
  }, [isConfiguratorOpen, isMuted, safePlay, safePause]);

  return {
    isMuted,
    volume,
    isReady,
    playerRef,
    handlePlayerReady,
    toggleMusic,
    changeVolume,
    safePlay,
    safePause
  };
};

const BackgroundMusicSystem = memo(({ themeId, onReady, volume }: { themeId: string; onReady: (player: any) => void; volume: number; }) => {
  const videoId = (THEME_SOUNDTRACKS && THEME_SOUNDTRACKS[themeId]) ? THEME_SOUNDTRACKS[themeId] : 'jfKfPfyJRdk';
  const opts: YouTubeProps['opts'] = {
    height: '1', width: '1',
    playerVars: { 
      autoplay: 1, 
      controls: 0, 
      loop: 1, 
      playlist: videoId, 
      modestbranding: 1, 
      playsinline: 1, 
      enablejsapi: 1, 
      origin: typeof window !== 'undefined' ? window.location.origin : undefined 
    },
  };
  
  return (
    <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1] overflow-hidden w-px h-px">
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={(e: YouTubeEvent) => { 
          if(e.target) onReady(e.target); 
        }} 
      />
    </div>
  );
});

// ----------------------------------------------------------------------
// 3D SCENE WRAPPERS (Optimized)
// ----------------------------------------------------------------------
const SceneWrapper = memo(({ 
  isVisible, 
  sceneUrl, 
  allowInput = true, 
  forceNoPointer = false,
  isMobile = false 
}: any) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      const cached = CacheManager.get(`scene_${sceneUrl}`);
      if (cached) {
        setHasLoaded(true);
      }
    }
  }, [isVisible, sceneUrl, hasLoaded]);

  const handleLoad = useCallback(() => {
    setHasLoaded(true);
    CacheManager.set(`scene_${sceneUrl}`, true, 7 * 24 * 60 * 60 * 1000); // 7 days
  }, [sceneUrl]);

  const handleError = useCallback(() => {
    console.error('Scene failed to load:', sceneUrl);
    setError(true);
  }, [sceneUrl]);

  if (error) {
    return (
      <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
        <div className="text-white/40 text-xs font-mono">Failed to load scene</div>
      </div>
    );
  }

  return (
    <div className={`
      w-full h-full relative transition-opacity duration-700
      ${isVisible ? 'opacity-100' : 'opacity-0'}
      ${forceNoPointer ? 'pointer-events-none' : (allowInput ? 'pointer-events-auto' : 'pointer-events-none')} 
    `}>
      {isVisible && (
        <Suspense fallback={
          <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
            <div className="text-blue-500/40 font-mono text-[10px] animate-pulse">LOADING...</div>
          </div>
        }>
          <Spline 
            scene={sceneUrl} 
            className="w-full h-full block object-cover" 
            onLoad={handleLoad}
            onError={handleError}
          />
        </Suspense>
      )}
    </div>
  );
});

const FullScreenSection = memo(({ config, activePage, onVisible, isMobile }: any) => {
  const renderWindow = isMobile ? 1 : 1;
  const shouldRender = Math.abs(config.id - activePage) <= renderWindow;
  const isActive = config.id === activePage;
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if(sectionRef.current) onVisible(sectionRef.current, config.id - 1);
  }, [onVisible, config.id]);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-col items-center justify-center"
    >
      <div className="w-full h-full relative">
        <SceneWrapper 
          isVisible={shouldRender} 
          sceneUrl={config.scene} 
          allowInput={!config.disableInteraction} 
          isMobile={isMobile}
        />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        <div className={`
          absolute bottom-24 left-6 md:bottom-20 md:left-10 z-20 pointer-events-none 
          transition-all duration-1000 ease-out max-w-[85%]
          ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          <h2 className="text-4xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter select-none drop-shadow-2xl">
            {config.label}
          </h2>
        </div>
      </div>
    </section>
  );
});

const DraggableSplitSection = memo(({ config, activePage, onVisible, intent, setIntent, isMobile }: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const isActive = config.id === activePage;
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setIntent('MANIPULATE');
    hapticFeedback(10);
  }, [setIntent]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIntent('IDLE');
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, [setIntent]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      setSplitPos(50);
      hapticFeedback(15);
    }
    lastTapTime.current = now;
  }, []);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsLocked(!isLocked);
      hapticFeedback(20);
    }, 500);
  }, [isLocked]);

  const handleDragMove = useCallback((e: any) => {
    if (!containerRef.current || isLocked || intent === 'SCROLL') return;
    
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relativeX = clientX - rect.left;
      const newPos = (relativeX / rect.width) * 100;
      if (newPos > 5 && newPos < 95) setSplitPos(newPos);
    });
  }, [isLocked, intent]);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      handleDragMove(e);
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (containerRef.current) onVisible(containerRef.current, config.id - 1);
  }, [onVisible, config.id]);

  const renderWindow = isMobile ? 1 : 1;
  const shouldRender = Math.abs(config.id - activePage) <= renderWindow;

  return (
    <section 
      ref={containerRef} 
      className={`relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-row ${isDragging ? 'select-none cursor-grabbing' : ''}`}
    >
      {isDragging && <div className="absolute inset-0 z-[60] bg-transparent" />}
      
      <div 
        style={{ width: `${splitPos}%`, height: '100%' }} 
        className={`relative overflow-hidden bg-[#050505] border-blue-500/50 border-r ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
      >
        <div className="absolute inset-0 w-full h-full"> 
          <SceneWrapper 
            isVisible={shouldRender} 
            sceneUrl={config.sceneA} 
            forceNoPointer={isDragging}
            isMobile={isMobile}
          />
        </div>
        <div className="absolute top-8 left-8 z-20 pointer-events-none">
          <div className={`text-2xl md:text-4xl font-bold text-white/90 transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {config.labelA}
          </div>
        </div>
      </div>
      
      <div 
        onMouseDown={handleDragStart} 
        onTouchStart={(e) => {
          handleDragStart();
          handleLongPressStart();
          handleDoubleTap();
        }}
        onTouchEnd={handleDragEnd}
        className="absolute z-50 flex items-center justify-center group outline-none touch-none w-12 h-full top-0 -ml-6 cursor-col-resize" 
        style={{ left: `${splitPos}%` }}
      >
        <div className="w-[1px] h-full bg-blue-500/50 shadow-[0_0_15px_rgba(0,100,255,0.5)]" />
        <div className={`absolute w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform ${isLocked ? 'bg-blue-500/40 border-blue-400' : 'bg-black/40 border-white/20'}`}>
          <GripVertical size={16} className="text-white" />
        </div>
      </div>
      
      <div 
        style={{ width: `${100 - splitPos}%`, height: '100%' }} 
        className={`relative overflow-hidden bg-black ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
      >
        <div className="absolute inset-0 w-full h-full">
          <SceneWrapper 
            isVisible={shouldRender} 
            sceneUrl={config.sceneB} 
            forceNoPointer={isDragging}
            isMobile={isMobile}
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
// BOTTOM CONTROLS
// ----------------------------------------------------------------------
const BottomControls = memo(({ isPlaying, onToggleMusic, onOpenTheme, themeName, volume, onVolumeChange, visible, accentColor }: any) => {
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
        className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border p-2 rounded-full transition-colors duration-500"
        style={containerStyle}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenTheme(); }} 
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-gray-400 transition-all duration-300 border border-transparent group relative hover:text-white hover:bg-white/10"
        >
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: accentColor }} />
          <Palette size={18} style={{ color: isHovered ? accentColor : undefined }} />
        </button>
        
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleMusic(); }} 
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 relative" 
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
});

const SupportWidget = memo(({ accentColor }: { accentColor: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => { 
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`absolute bottom-8 right-8 z-[9999] pointer-events-auto transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
      <a 
        href="https://t.me/+dlP_A0ebMXs3NTg0" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1"
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
});

// ----------------------------------------------------------------------
// GESTURE NAVIGATION (Mobile Optimized)
// ----------------------------------------------------------------------
const GestureNavigation = memo(({ activePage, onNavigate, intent, setIntent }: any) => {
  const [startY, setStartY] = useState(0);
  const isProcessing = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (intent === 'MANIPULATE') return;
      setStartY(e.touches[0].clientY);
      setIntent('SCROLL');
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isProcessing.current || intent !== 'SCROLL') return;
      
      const deltaY = startY - e.changedTouches[0].clientY;
      
      if (Math.abs(deltaY) > 80) {
        isProcessing.current = true;
        hapticFeedback(15);
        
        if (deltaY > 0) {
          onNavigate(Math.min(activePage + 1, PAGE_CONFIG.length));
        } else {
          onNavigate(Math.max(activePage - 1, 1));
        }
        
        setTimeout(() => {
          isProcessing.current = false;
          setIntent('IDLE');
        }, 500);
      } else {
        setIntent('IDLE');
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activePage, startY, intent, setIntent, onNavigate]);

  return null;
});

// ----------------------------------------------------------------------
// PAGE NAVIGATION HOOK
// ----------------------------------------------------------------------
const usePageNavigation = (capabilities: any) => {
  const [activePage, setActivePage] = useState<number>(1);
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [_, startTransition] = useTransition();

  useEffect(() => {
    const cached = CacheManager.get('last_page');
    if (cached && cached >= 1 && cached <= PAGE_CONFIG.length) {
      setActivePage(cached);
    }
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) {
              startTransition(() => {
                setActivePage(index + 1);
                CacheManager.set('last_page', index + 1, 60 * 60 * 1000); // 1 hour
              });
            }
          }
        });
      },
      { threshold: capabilities.isMobile ? 0.3 : 0.4 }
    );

    pageRefs.current.forEach((ref) => { 
      if (ref) observerRef.current?.observe(ref); 
    });

    return () => observerRef.current?.disconnect();
  }, [capabilities.isMobile]);

  const handleRef = useCallback((el: HTMLElement | null, index: number) => {
    pageRefs.current[index] = el;
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  const scrollToPage = useCallback((index: number) => {
    if(index < 0 || index >= PAGE_CONFIG.length) return;
    hapticFeedback(10);
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return { activePage, setActivePage, handleRef, scrollToPage };
};

// ----------------------------------------------------------------------
// THEME ENGINE HOOK
// ----------------------------------------------------------------------
const useThemeEngine = () => {
  const [activeThemeId, setActiveThemeId] = useState<string>('t01');

  useEffect(() => {
    const cached = CacheManager.get('theme');
    if (cached) {
      setActiveThemeId(cached);
    }
  }, []);

  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);

  const accentColor = useMemo(() => getThemeColor(activeThemeId), [activeThemeId]);

  const changeTheme = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    CacheManager.set('theme', themeId);
  }, []);

  return { activeThemeId, activeTheme, accentColor, changeTheme };
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function Home() {
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [orientationDismissed, setOrientationDismissed] = useState(false);

  const capabilities = useDeviceCapabilities();
  const { mode: inputMode, intent, setIntent } = useInputMode();
  const { activeThemeId, activeTheme, accentColor, changeTheme } = useThemeEngine();
  const { activePage, handleRef, scrollToPage } = usePageNavigation(capabilities);
  
  const audioEngine = useAudioEngine(activeThemeId, showConfigurator);

  useEffect(() => {
    setIsClient(true);
    
    // Inject global styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = GLOBAL_STYLES;
    document.head.appendChild(styleSheet);

    // Check orientation
    const checkOrientation = () => {
      const dismissed = CacheManager.get('orientation_dismissed');
      if (dismissed) {
        setOrientationDismissed(true);
        return;
      }

      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;
      if (isPortrait && isMobile && !orientationDismissed) {
        setShowOrientationWarning(true);
      }
    };

    checkOrientation();

    // Check registration
    const hasRegistered = CacheManager.get('vip_registered');
    if (!hasRegistered) {
      setCurrentStage("register");
    } else {
      setCurrentStage("v2");
    }

    // Cleanup
    return () => { 
      document.head.removeChild(styleSheet); 
    };
  }, [orientationDismissed]);

  // Handle orientation changes
  useEffect(() => {
    if (!capabilities.isMobile) return;

    const handleOrientationChange = () => {
      if (orientationDismissed) return;
      
      setTimeout(() => {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait && !orientationDismissed) {
          setShowOrientationWarning(true);
        } else {
          setShowOrientationWarning(false);
        }
      }, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [capabilities.isMobile, orientationDismissed]);

  const handleRegisterComplete = useCallback(() => {
    CacheManager.set('vip_registered', true);
    setCurrentStage("hold"); 
  }, []);
  
  const handleHoldComplete = useCallback(() => {
    setCurrentStage("content");
  }, []);
  
  const handleV2Complete = useCallback(() => { 
    setCurrentStage("content"); 
    audioEngine.safePlay(); 
  }, [audioEngine]);

  const handleThemeChange = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
    changeTheme(themeId);
    if (muted !== audioEngine.isMuted) {
      audioEngine.toggleMusic();
    }
    setShowConfigurator(false);
  }, [changeTheme, audioEngine]);

  const handleOrientationDismiss = useCallback(() => {
    setShowOrientationWarning(false);
    setOrientationDismissed(true);
    CacheManager.set('orientation_dismissed', true, 7 * 24 * 60 * 60 * 1000); // 7 days
  }, []);

  const effectiveFilter = useMemo(() => {
    if (!capabilities.supportsBackdropFilter) return 'none';
    return capabilities.isMobile ? (activeTheme.mobileFilter || 'none') : activeTheme.filter;
  }, [capabilities, activeTheme]);

  if (!isClient) return null;

  return (
    <MobileErrorBoundary>
      <Analytics />
      <SpeedInsights />
      
      <BackgroundMusicSystem 
        themeId={activeThemeId} 
        onReady={audioEngine.handlePlayerReady} 
        volume={audioEngine.volume} 
      />

      {/* LAYER 1: FIXED CONTROLS */}
      <div className="fixed inset-0 z-[400000] pointer-events-none">
        <BottomControls 
          visible={currentStage === 'content'} 
          isPlaying={!audioEngine.isMuted} 
          onToggleMusic={audioEngine.toggleMusic} 
          onOpenTheme={() => setShowConfigurator(true)} 
          themeName={activeTheme.name} 
          volume={audioEngine.volume} 
          onVolumeChange={audioEngine.changeVolume} 
          accentColor={accentColor} 
        />
        <SupportWidget accentColor={accentColor} />
      </div>

      {/* LAYER 2: CONFIGURATOR */}
      {showConfigurator && (
        <div className="fixed inset-0 z-[300000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowConfigurator(false); 
              }} 
              className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
            {/* @ts-ignore */}
            <FixedThemeConfigurator 
              initialThemeId={activeThemeId} 
              onThemeChange={handleThemeChange} 
            />
          </div>
        </div>
      )}

      {/* LAYER 3: GLOBAL THEME LENS */}
      <div 
        className="fixed inset-0 pointer-events-none w-screen h-screen z-[200000]" 
        style={{ 
          backdropFilter: effectiveFilter, 
          WebkitBackdropFilter: effectiveFilter, 
          transition: 'backdrop-filter 0.5s ease' 
        }} 
      />

      {/* LAYER 4: LOADING / GATING SCREENS */}
      {currentStage === "register" && (
        <div 
          className="fixed inset-0 z-[100000] bg-black" 
          style={{ 
            filter: effectiveFilter, 
            WebkitFilter: effectiveFilter, 
            transform: 'translateZ(0)' 
          }}
        >
          {/* @ts-ignore */}
          <RegisterPage onUnlock={handleRegisterComplete} theme={activeTheme} />
        </div>
      )}
      
      {currentStage === "hold" && (
        <div 
          className="fixed inset-0 z-[100000]" 
          style={{ 
            filter: effectiveFilter, 
            WebkitFilter: effectiveFilter, 
            transform: 'translateZ(0)' 
          }}
        >
          {/* @ts-ignore */}
          <BullMoneyGate onUnlock={handleHoldComplete} theme={activeTheme}>
            <></>
          </BullMoneyGate>
        </div>
      )}
      
      {currentStage === "v2" && (
        <div 
          className="fixed inset-0 z-[100000]" 
          style={{ 
            filter: effectiveFilter, 
            WebkitFilter: effectiveFilter, 
            transform: 'translateZ(0)' 
          }}
        >
          {/* @ts-ignore */}
          <MultiStepLoaderV2 onFinished={handleV2Complete} theme={activeTheme} />
        </div>
      )}

      {/* LAYER 5: NAVBAR */}
      {currentStage === 'content' && (
        <header className="fixed top-0 left-0 right-0 z-[250000] w-full transition-all duration-300">
          <Navbar 
            setShowConfigurator={setShowConfigurator} 
            activeThemeId={activeThemeId} 
            accentColor={accentColor}
            onThemeChange={(themeId) => handleThemeChange(themeId, 'MECHANICAL' as SoundProfile, audioEngine.isMuted)} 
          />
        </header>
      )}

      {/* LAYER 6: MAIN CONTENT */}
      <div className={currentStage === 'content' ? 'profit-reveal w-full h-[100dvh] relative' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
        {!capabilities.isMobile && (
          <TargetCursor 
            spinDuration={2} 
            hideDefaultCursor={true} 
            targetSelector=".cursor-target, a, button" 
          />
        )}
        
        <GestureNavigation 
          activePage={activePage} 
          onNavigate={(page: number) => scrollToPage(page - 1)} 
          intent={intent}
          setIntent={setIntent}
        />
        
        <main className="w-full h-full flex flex-col overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-black no-scrollbar text-white relative">
          {showOrientationWarning && !orientationDismissed && (
            <OrientationOverlay onDismiss={handleOrientationDismiss} />
          )}

          {/* NAVIGATION */}
          <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 md:gap-6 items-center pointer-events-auto">
            <button 
              onClick={() => scrollToPage(activePage - 2)} 
              disabled={activePage === 1} 
              className="text-blue-500 hover:text-white disabled:opacity-20 transition-colors p-2"
            >
              <ChevronUp size={capabilities.isMobile ? 20 : 24} />
            </button>
            
            <div className="flex flex-col gap-3 md:gap-4 bg-black/40 backdrop-blur-xl p-2 md:p-3 rounded-2xl border border-white/5 shadow-2xl max-h-[50vh] overflow-y-auto no-scrollbar">
              {PAGE_CONFIG.map((page, index) => (
                <div key={page.id} className="relative group flex items-center justify-end gap-3">
                  <span className={`
                    text-[10px] font-mono tracking-widest text-blue-300 bg-black/80 px-2 py-1 rounded 
                    transition-all duration-300 absolute right-14 whitespace-nowrap pointer-events-none
                    ${activePage === page.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}
                    hidden md:block
                  `}>
                    {page.label}
                  </span>
                  <ShineButton 
                    onClick={() => scrollToPage(index)} 
                    active={activePage === page.id} 
                    className={capabilities.isMobile ? "w-10 h-10 text-xs" : "w-12 h-12 text-sm"}
                  >
                    <span className="font-bold z-10">{index + 1}</span>
                  </ShineButton>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => scrollToPage(activePage)} 
              disabled={activePage === PAGE_CONFIG.length} 
              className="text-blue-500 hover:text-white disabled:opacity-20 transition-colors p-2"
            >
              <ChevronDown size={capabilities.isMobile ? 20 : 24} />
            </button>
          </div>

          {/* INFO BUTTON */}
          <div className="fixed top-24 left-4 z-50 md:bottom-8 md:top-auto md:left-8 pointer-events-auto">
            <ShineButton 
              className={capabilities.isMobile ? "w-10 h-10 rounded-full" : "w-12 h-12 rounded-full"} 
              onClick={() => setModalData(PAGE_CONFIG[activePage - 1])}
            >
              <Info size={capabilities.isMobile ? 16 : 20} />
            </ShineButton>
          </div>

          {/* INFO MODAL */}
          <div className={`
            fixed inset-0 z-[110] flex items-center justify-center px-4 transition-all duration-300 
            ${!!modalData ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}>
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setModalData(null)} 
            />
            {modalData && (
              <div className="relative w-full max-w-lg bg-black/90 border border-blue-500/30 rounded-xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,100,255,0.2)] scale-100">
                <button 
                  onClick={() => setModalData(null)} 
                  className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                  <X size={24} />
                </button>
                <h3 className="text-blue-400 text-xs md:text-sm font-mono tracking-widest mb-2">
                  PAGE 0{modalData.id} ANALYSIS
                </h3>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
                  {modalData.infoTitle}
                </h2>
                <p className="text-white/80 leading-relaxed text-base md:text-lg font-light">
                  {modalData.infoDesc}
                </p>
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
                  intent={intent}
                  setIntent={setIntent}
                  isMobile={capabilities.isMobile}
                />
              ) : (
                <FullScreenSection 
                  config={page} 
                  activePage={activePage} 
                  onVisible={handleRef}
                  isMobile={capabilities.isMobile}
                />
              )}
            </React.Fragment>
          ))}
        </main>
      </div>
    </MobileErrorBoundary>
  );
}