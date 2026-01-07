"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { Lock, MousePointer2, Sparkles, Smartphone, Monitor, X } from 'lucide-react';

import { playClick, playHover, createSwipeHandlers } from '@/lib/interactionUtils';
import { THEME_SOUNDTRACKS } from '@/components/Mainpage/ThemeComponents';
import { UI_LAYERS } from '@/lib/uiLayers';

// --- PARTICLE COMPONENT ---
export const ParticleEffect = memo(({ trigger }: { trigger: number }) => {
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
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: UI_LAYERS.PARTICLES }}>
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
// 3. UI COMPONENTS
// ----------------------------------------------------------------------

export const ShineButton = ({ children, onClick, active, className = "", disabled = false }: any) => (
  <button
    onClick={(e) => {
      if (disabled) return;
      playClick();
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
export const OrientationOverlay = ({ onDismiss }: { onDismiss: () => void }) => {
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
      className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500"
      style={{ zIndex: UI_LAYERS.ORIENTATION_WARNING }}
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
          playClick();
          onDismiss();
        }} 
        onTouchStart={(e) => {
          e.stopPropagation();
          playClick();
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
export const InfoPanel = ({ config, isOpen, onClose, accentColor }: any) => {
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
      className={`fixed left-0 top-0 h-full w-[85vw] sm:w-[22rem] md:w-[26rem] max-w-md apple-surface bg-black/70 backdrop-blur-2xl border-r transition-transform duration-500 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        zIndex: UI_LAYERS.INFO_PANEL,
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

// ----------------------------------------------------------------------
// 4. MUSIC SYSTEM
// ----------------------------------------------------------------------
export const BackgroundMusicSystem = ({ themeId, onReady, volume, trackKey }: { themeId: string; onReady: (player: any) => void; volume: number; trackKey?: number; }) => {
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
export class ErrorBoundary extends React.Component<
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

// TSX Component Wrapper - Production Ready
const TSXLoadingFallback = ({ label }: { label: string }) => (
  <div className="flex h-full min-h-[240px] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-12 w-12 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
      <span className="text-[10px] font-semibold tracking-[0.4em] uppercase text-white/50">
        {label}
      </span>
    </div>
  </div>
);

const dynamicTSXComponents: Record<string, React.ComponentType<any>> = {
  ChartNews: dynamic(() => import('@/app/Blogs/Chartnews').then((mod) => mod.default || mod), {
    ssr: false,
    loading: () => <TSXLoadingFallback label="Chart news" />,
  }),
  ShopScrollFunnel: dynamic(() => import('@/app/shop/ShopScrollFunnel').then((mod) => mod.default || mod), {
    ssr: false,
    loading: () => <TSXLoadingFallback label="Shop funnel" />,
  }),
  HeroMain: dynamic(() => import('@/app/VIP/heromain').then((mod) => mod.default || mod), {
    ssr: false,
    loading: () => <TSXLoadingFallback label="Hero" />,
  }),
  ProductsSection: dynamic(() => import('@/app/VIP/ProductsSection').then((mod) => mod.default || mod), {
    ssr: false,
    loading: () => <TSXLoadingFallback label="Products" />,
  }),
};

export const TSXWrapper = memo(({ componentName, isVisible }: { componentName: string; isVisible: boolean }) => {
  const Component = dynamicTSXComponents[componentName];
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

// Custom Cursor Component
export const CustomCursor = ({ accentColor }: { accentColor: string }) => {
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
        className="fixed w-6 h-6 rounded-full border-2 pointer-events-none mix-blend-difference"
        style={{
          left: position.x,
          top: position.y,
          borderColor: accentColor,
          zIndex: UI_LAYERS.CURSOR,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.1s ease-out'
        }}
      />
    </>
  );
};

export const HeroLoaderOverlay = memo(({ visible, message, accentColor }: { visible: boolean; message: string; accentColor: string }) => (
  <div
    className={`fixed inset-0 flex items-center justify-center transition-opacity duration-400 ${
      visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}
    style={{ zIndex: UI_LAYERS.THEME_CONFIGURATOR, backgroundColor: 'rgba(0,0,0,0.92)' }}
  >
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-black/80 px-8 py-12 text-center shadow-[0_30px_120px_rgba(0,0,0,0.8)]">
      <div
        className="relative h-16 w-16 rounded-full border-4 border-white/10 animate-spin"
        style={{ borderTopColor: accentColor }}
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.5em] text-white/40">Loading hero</p>
      <h3 className="text-lg font-semibold text-white">{message}</h3>
      <p className="text-xs text-white/60 tracking-[0.3em]">Adaptive spline warm-up in progress</p>
    </div>
  </div>
));
