"use client";

import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Spline from '@splinetool/react-spline';
import { ChevronDown, ChevronUp, GripHorizontal, GripVertical, Zap } from 'lucide-react';

import { playClick } from '@/lib/interactionUtils';
import { devicePrefs } from '@/lib/smartStorage';
import { CRITICAL_SCENE_BLOB_MAP, CRITICAL_SPLINE_SCENES } from '@/lib/pageConfig';
import { CrashSafeSplineLoader } from '@/components/Mainpage/CrashSafeSplineLoader';
import { SmartSplineLoader } from '@/components/Mainpage/SmartSplineLoader';
import { TSXWrapper, ErrorBoundary } from '@/components/Mainpage/PageElements';

// ----------------------------------------------------------------------
// 3D SCENE WRAPPERS WITH LAZY LOADING
// ----------------------------------------------------------------------
export const SceneWrapper = memo(({ isVisible, sceneUrl, allowInput = true, forceNoPointer = false, parallaxOffset = 0, isHeavy = false, disabled = false, skeletonLabel = '', useCrashSafe = false, forceLiteSpline = false, forceLoadOverride = false, onSceneReady, deviceProfile, eagerLoad = false }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOptIn, setMobileOptIn] = useState(true);
  const isCritical = useMemo(() => CRITICAL_SPLINE_SCENES.includes(sceneUrl), [sceneUrl]);
  const resolvedSceneUrl = CRITICAL_SCENE_BLOB_MAP[sceneUrl] || sceneUrl;
  const hasSignaledReady = useRef(false);

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
    const savedOptIn = devicePrefs.get('mobile_spline_opt_in');
    if (savedOptIn === 'false') {
      setMobileOptIn(false);
    } else {
      setMobileOptIn(true);
      devicePrefs.set('mobile_spline_opt_in', 'true');
    }
  }, []);

  // OPTIMIZED: Reduce aggressive loading delays for better mobile performance
  useEffect(() => {
    const allowLoad = mobileOptIn || !isMobile || forceLiteSpline || forceLoadOverride || isCritical;

    if (isVisible && !isLoaded && !disabled && allowLoad) {
      if (eagerLoad) {
        setIsLoaded(true);
        return;
      }
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
    if (!isVisible && isMobile && isLoaded && !isCritical) {
      const unloadTimer = setTimeout(() => {
        setIsLoaded(false);
      }, 800);  // Reduced from 1000ms for faster cleanup
      return () => clearTimeout(unloadTimer);
    }
  }, [isVisible, isLoaded, isMobile, isHeavy, disabled, mobileOptIn, forceLiteSpline, forceLoadOverride, isCritical, eagerLoad]);

  useEffect(() => {
    hasSignaledReady.current = false;
  }, [sceneUrl]);

  useEffect(() => {
    if (isLoaded && onSceneReady && !hasSignaledReady.current) {
      hasSignaledReady.current = true;
      onSceneReady();
    }
  }, [isLoaded, onSceneReady]);

  if (isMobile && !mobileOptIn && !forceLiteSpline && !disabled && !forceLoadOverride && !isCritical) {
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
                devicePrefs.set('mobile_spline_opt_in', 'true');
              }}
              className="px-4 py-2 rounded-full bg-blue-500/80 text-white font-semibold text-sm shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:bg-blue-500 active:scale-95 transition-all"
            >
              Enable 3D
            </button>
            <button
              onClick={() => devicePrefs.set('mobile_spline_opt_in', 'false')}
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
        isCritical ? (
          <SmartSplineLoader
            scene={resolvedSceneUrl}
            priority="critical"
            enableInteraction={allowInput}
            deviceProfile={deviceProfile}
            onLoad={() => onSceneReady?.()}
            className="w-full h-full"
          />
        ) : useCrashSafe ? (
          <CrashSafeSplineLoader
            sceneUrl={resolvedSceneUrl}
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
                 scene={resolvedSceneUrl}
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

export const FullScreenSection = memo(({ config, activePage, onVisible, parallaxOffset, disableSpline = false, useCrashSafeSpline = false, forceLiteSpline = false, onSceneReady, deviceProfile, eagerRenderSplines = true }: any) => {
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
    const withinRange = distance <= threshold || (isLastPage && activePage >= 8);
    if (config.type === 'tsx') return withinRange;
    if (!eagerRenderSplines) return withinRange;
    return disableSpline ? withinRange : true;
  }, [config.id, config.type, activePage, isLastPage, isMobile, disableSpline, eagerRenderSplines]);

  const isActive = config.id === activePage;
  const allowForceLoad = !disableSpline;

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
            disabled={disableSpline}
            forceLiteSpline={forceLiteSpline}
            forceLoadOverride={allowForceLoad}
            eagerLoad={eagerRenderSplines && !disableSpline}
            skeletonLabel={config.label}
            useCrashSafe={useCrashSafeSpline || config.id === 1}
            onSceneReady={config.id === 1 ? onSceneReady : undefined}
            deviceProfile={deviceProfile}
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

export const DraggableSplitSection = memo(({ config, activePage, onVisible, parallaxOffset, disableSpline = false, useCrashSafeSpline = false, forceLiteSpline = false, deviceProfile, eagerRenderSplines = true }: any) => {
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
    playClick();
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
        if (isMobile) {
            const relativeY = clientY - rect.top;
            newPos = (relativeY / rect.height) * 100;
        } else {
            const relativeX = clientX - rect.left;
            newPos = (relativeX / rect.width) * 100;
        }
        setSplitPos(clampSplit(newPos));
    });
  }, [clampSplit, isMobile]);

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
      if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); nudgeSplit(isMobile ? -4 : -3); }
      if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); nudgeSplit(isMobile ? 4 : 3); }
      if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); handleTargetHit(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, isMobile, handleTargetHit, nudgeSplit]);

  const layoutClass = isMobile ? 'flex-col' : 'flex-row';
  const sizeProp = isMobile ? 'height' : 'width';
  const otherSizeProp = isMobile ? 'width' : 'height';
   
  useEffect(() => {
    if (containerRef.current) onVisible(containerRef.current, config.id - 1);
  }, [onVisible, config.id]);

  const shouldRender = disableSpline || !eagerRenderSplines
    ? (config.id >= activePage - 1) && (config.id <= activePage + 1)
    : true;

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
              onClick={() => { playClick(); nudgeSplit(isMobile ? -4 : -3); }}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:-translate-y-0.5 transition-all"
              aria-label="Move split up"
            >
              <ChevronUp size={16} className="text-blue-400" />
            </button>
            <button
              onClick={() => { playClick(); nudgeSplit(isMobile ? 4 : 3); }}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:translate-y-0.5 transition-all"
              aria-label="Move split down"
            >
              <ChevronDown size={16} className="text-blue-400" />
            </button>
            <button
              onClick={() => { playClick(); handleTargetHit(); }}
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
        className={`relative overflow-hidden bg-[#050505] border-blue-500/50 ${isMobile ? 'border-b' : 'border-r'} ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
      >
        <div className="absolute inset-0 w-full h-full"> 
          <SceneWrapper
            isVisible={shouldRender}
            sceneUrl={config.sceneA}
            forceNoPointer={isDragging}
            parallaxOffset={parallaxOffset * 0.3}
            disabled={false}
            forceLiteSpline={forceLiteSpline}
            forceLoadOverride={!disableSpline}
            eagerLoad={eagerRenderSplines && !disableSpline}
            skeletonLabel={config.labelA}
            useCrashSafe={useCrashSafeSpline || config.id === 6}
            deviceProfile={deviceProfile}
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
        className={`absolute z-50 flex items-center justify-center group outline-none touch-none cursor-pointer ${isMobile ? 'w-full h-12 left-0 -mt-6 cursor-row-resize' : 'w-12 h-full top-0 -ml-6 cursor-col-resize'}`}
        style={isMobile ? { top: `${splitPos}%` } : { left: `${splitPos}%` }}
      >
        <div className={`${isMobile ? 'w-full h-[1px]' : 'w-[1px] h-full'} bg-blue-500/50 shadow-[0_0_15px_rgba(0,100,255,0.5)]`} />
        <div className="absolute w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform hover-lift">
           {isMobile ? <GripHorizontal size={16} className="text-white"/> : <GripVertical size={16} className="text-white"/> }
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
               forceLoadOverride={!disableSpline}
               eagerLoad={eagerRenderSplines && !disableSpline}
               skeletonLabel={config.labelB}
               useCrashSafe={useCrashSafeSpline || config.id === 6}
               deviceProfile={deviceProfile}
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
