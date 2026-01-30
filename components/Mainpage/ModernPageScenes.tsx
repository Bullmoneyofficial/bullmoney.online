"use client";

/**
 * Modern Page Scenes - 2025 Edition
 * Optimized Spline scene rendering for both mobile and desktop
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, GripHorizontal, GripVertical, Zap } from 'lucide-react';
import { playClick } from '@/lib/interactionUtils';
import { ModernSplineLoader } from '@/components/Mainpage/ModernSplineLoader';
import { TSXWrapper } from '@/components/Mainpage/PageElements';

// ============================================================================
// SCENE WRAPPER - Handles visibility and loading logic
// ============================================================================

interface SceneWrapperProps {
  sceneUrl: string;
  isVisible: boolean;
  allowInput?: boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  disabled?: boolean;
  className?: string;
  onSceneReady?: () => void;
}

const SceneWrapper = memo<SceneWrapperProps>(({
  sceneUrl,
  isVisible,
  allowInput = true,
  priority = 'medium',
  disabled = false,
  className = '',
  onSceneReady
}) => {
  const [shouldLoad, setShouldLoad] = useState(priority === 'critical');
  const hasSignaledReady = useRef(false);

  // Determine when to load based on visibility
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (disabled) {
      setShouldLoad(false);
      return;
    }

    // Critical scenes load immediately
    if (priority === 'critical') {
      setShouldLoad(true);
      return;
    }

    // Other scenes load when visible
    if (isVisible && !shouldLoad) {
      // Use requestIdleCallback for smooth loading
      const scheduleLoad = () => setShouldLoad(true);

      if ('requestIdleCallback' in window) {
        const handle = (window as any).requestIdleCallback(scheduleLoad, {
          timeout: 100
        });
        cleanup = () => (window as any).cancelIdleCallback(handle);
      } else {
        const handle = setTimeout(scheduleLoad, 50);
        cleanup = () => clearTimeout(handle);
      }
    }
    return cleanup;
  }, [isVisible, disabled, priority, shouldLoad]);

  const handleLoad = useCallback(() => {
    if (!hasSignaledReady.current) {
      hasSignaledReady.current = true;
      onSceneReady?.();
    }
  }, [onSceneReady]);

  // Render disabled state
  if (disabled) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-black via-gray-900/60 to-black ${className}`}>
        <div className="text-center px-6 py-5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur">
          <div className="text-white/60 font-mono text-xs tracking-wider mb-2">
            PERFORMANCE MODE
          </div>
          <div className="text-white/90 font-bold text-2xl">3D DISABLED</div>
          <div className="text-white/40 font-mono text-xs mt-2">
            Enable in settings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      {shouldLoad ? (
        <ModernSplineLoader
          scene={sceneUrl}
          priority={priority}
          enableInteraction={allowInput && isVisible}
          onLoad={handleLoad}
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="animate-pulse text-white">
            Preparing scene...
          </div>
        </div>
      )}
    </div>
  );
});

SceneWrapper.displayName = 'SceneWrapper';

// ============================================================================
// FULL SCREEN SECTION
// ============================================================================

interface FullScreenSectionProps {
  config: any;
  activePage: number;
  onVisible: (el: HTMLElement | null, index: number) => void;
  disableSpline?: boolean;
  deviceProfile?: any;
}

export const FullScreenSection = memo<FullScreenSectionProps>(({
  config,
  activePage,
  onVisible,
  disableSpline = false,
  deviceProfile: _deviceProfile
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const isTSX = config.type === 'tsx';
  const isActive = config.id === activePage;

  // Intersection observer
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const root = el.closest('[data-scroll-container]') as Element | null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsInView(entry.isIntersecting && entry.intersectionRatio > 0.25);
      },
      { root, threshold: [0, 0.25, 0.6] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Register with parent
  useEffect(() => {
    if (sectionRef.current) {
      onVisible(sectionRef.current, config.id - 1);
    }
  }, [onVisible, config.id]);

  // Calculate if should render
  const shouldRender = useMemo(() => {
    if (disableSpline && config.type !== 'tsx') return false;

    const distance = Math.abs(config.id - activePage);

    // Hero scene always renders when reasonably close
    if (config.id === 1 && distance <= 3) return true;

    // TSX pages are lightweight
    if (isTSX) return distance <= 3;

    // Spline scenes - render adjacent pages
    return distance <= 2;
  }, [config.id, config.type, activePage, disableSpline, isTSX]);

  // Determine priority
  const priority = config.id === 1 ? 'critical' :
                  isActive ? 'high' : 'medium';

  if (!shouldRender && !isTSX) return null;

  return (
    <section
      ref={sectionRef}
      className={`relative w-full min-h-[100dvh] flex-none bg-black flex flex-col items-center justify-center ${
        isActive ? 'page-flip-active' : ''
      }`}
    >
      <div className={`w-full h-full relative ${isTSX ? 'overflow-y-auto no-scrollbar' : 'overflow-hidden'}`}>
        {isTSX ? (
          <div className="min-h-full py-20 md:py-0">
            <TSXWrapper componentName={config.component} isVisible={shouldRender} />
          </div>
        ) : (
          <>
            <SceneWrapper
              sceneUrl={config.scene}
              isVisible={shouldRender}
              allowInput={isInView && !config.disableInteraction}
              priority={priority}
              disabled={disableSpline}
              className="absolute inset-0"
            />

            {/* Gradient overlays */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

            {/* Label */}
            <div
              className={`absolute bottom-24 left-6 sm:bottom-20 sm:left-8 z-20 pointer-events-none transition-all duration-1000 max-w-[85%] ${
                isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter select-none drop-shadow-2xl">
                {config.label}
              </h2>
            </div>
          </>
        )}
      </div>
    </section>
  );
});

FullScreenSection.displayName = 'FullScreenSection';

// ============================================================================
// DRAGGABLE SPLIT SECTION
// ============================================================================

interface DraggableSplitSectionProps {
  config: any;
  activePage: number;
  onVisible: (el: HTMLElement | null, index: number) => void;
  disableSpline?: boolean;
  deviceProfile?: any;
}

export const DraggableSplitSection = memo<DraggableSplitSectionProps>(({
  config,
  activePage,
  onVisible,
  disableSpline = false,
  deviceProfile: _deviceProfile
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 72, y: 35 });
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeScene, setActiveScene] = useState<'left' | 'right'>('left');
  const isActive = config.id === activePage;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const root = el.closest('[data-scroll-container]') as Element | null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsInView(entry.isIntersecting && entry.intersectionRatio > 0.25);
      },
      { root, threshold: [0, 0.25, 0.6] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Register with parent
  useEffect(() => {
    if (containerRef.current) {
      onVisible(containerRef.current, config.id - 1);
    }
  }, [onVisible, config.id]);

  // Mobile scene switching based on split position
  useEffect(() => {
    if (!isMobile) return;

    const timer = setTimeout(() => {
      const newScene = splitPos < 50 ? 'left' : 'right';
      if (newScene !== activeScene) {
        setActiveScene(newScene);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [splitPos, isMobile, activeScene]);

  const clampSplit = useCallback(
    (value: number) => Math.min(95, Math.max(5, value)),
    []
  );

  const nudgeSplit = useCallback(
    (delta: number) => {
      setSplitPos(prev => clampSplit(prev + delta));
    },
    [clampSplit]
  );

  const handleTargetHit = useCallback(() => {
    setScore(prev => prev + 1);
    if (navigator.vibrate) navigator.vibrate(15);
    setTargetPos({
      x: clampSplit(10 + Math.random() * 80),
      y: clampSplit(10 + Math.random() * 70)
    });
  }, [clampSplit]);

  const handleDragStart = () => {
    playClick();
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    setIsDragging(false);
  };

  const handleDragMove = useCallback(
    (e: any) => {
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
    },
    [clampSplit, isMobile]
  );

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

  const shouldRender = useMemo(() => {
    if (disableSpline) return false;
    const distance = Math.abs(config.id - activePage);
    return distance <= 1;
  }, [config.id, activePage, disableSpline]);

  const layoutClass = isMobile ? 'flex-col' : 'flex-row';
  const sizeProp = isMobile ? 'height' : 'width';
  const otherSizeProp = isMobile ? 'width' : 'height';

  // On mobile, only render active scene
  const shouldRenderSceneA = shouldRender && (!isMobile || activeScene === 'left');
  const shouldRenderSceneB = shouldRender && (!isMobile || activeScene === 'right');

  if (disableSpline) return null;

  return (
    <section
      ref={containerRef}
      className={`relative w-full min-h-[100dvh] flex-none overflow-hidden bg-black flex ${layoutClass} ${
        isDragging ? 'select-none cursor-grabbing' : ''
      }`}
    >
      {/* Controls */}
      <div className="absolute top-4 left-4 z-[70] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        <div className="px-4 py-2 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md text-white">
          <div className="text-xs uppercase tracking-wider text-white font-bold flex items-center gap-2">
            <Zap size={12} className="text-white" /> Split View
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="font-mono text-white">Score {score}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => nudgeSplit(isMobile ? -4 : -3)}
              className="min-w-[44px] min-h-[44px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ChevronUp size={18} className="text-white" />
            </button>
            <button
              onClick={() => nudgeSplit(isMobile ? 4 : 3)}
              className="min-w-[44px] min-h-[44px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ChevronDown size={18} className="text-white" />
            </button>
            <button
              onClick={handleTargetHit}
              className="flex-1 min-h-[44px] px-4 rounded-lg bg-white/20 border border-white/40 text-sm font-bold text-white hover:bg-white/30 transition-colors"
            >
              Fire
            </button>
          </div>
        </div>
      </div>

      {/* Target */}
      {shouldRender && (
        <div
          className="absolute z-[65] pointer-events-auto"
          style={{
            top: `${targetPos.y}%`,
            left: `${targetPos.x}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <button
            onClick={handleTargetHit}
            className="w-16 h-16 rounded-full bg-white/10 border border-white/40 hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-white/60" />
              <div className="h-0.5 w-full bg-white/60" />
            </div>
          </button>
        </div>
      )}

      {/* Panel A */}
      <div
        style={{ [sizeProp]: `${splitPos}%`, [otherSizeProp]: '100%' }}
        className="relative overflow-hidden bg-[#050505]"
      >
        <SceneWrapper
          sceneUrl={config.sceneA}
          isVisible={shouldRenderSceneA}
          allowInput={isInView}
          priority="high"
          disabled={disableSpline}
          className="absolute inset-0"
        />
        <div className="absolute top-8 left-8 z-20 pointer-events-none">
          <div
            className={`text-3xl font-bold text-white/90 transition-all duration-700 ${
              isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {config.labelA}
          </div>
        </div>
      </div>

      {/* Drag Handle */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`absolute z-50 flex items-center justify-center group cursor-pointer ${
          isMobile ? 'w-full h-12 -mt-6 cursor-row-resize' : 'w-12 h-full -ml-6 cursor-col-resize'
        }`}
        style={isMobile ? { top: `${splitPos}%` } : { left: `${splitPos}%` }}
      >
        <div
          className={`${
            isMobile ? 'w-full h-[1px]' : 'w-[1px] h-full'
          } bg-white/50`}
        />
        <div className="absolute w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          {isMobile ? (
            <GripHorizontal size={16} className="text-white" />
          ) : (
            <GripVertical size={16} className="text-white" />
          )}
        </div>
      </div>

      {/* Panel B */}
      <div
        style={{ [sizeProp]: `${100 - splitPos}%`, [otherSizeProp]: '100%' }}
        className="relative overflow-hidden bg-black"
      >
        <SceneWrapper
          sceneUrl={config.sceneB}
          isVisible={shouldRenderSceneB}
          allowInput={isInView}
          priority="high"
          disabled={disableSpline}
          className="absolute inset-0"
        />
        <div className="absolute bottom-8 right-8 z-20 text-right pointer-events-none">
          <div
            className={`text-3xl font-bold text-white/90 transition-all duration-700 ${
              isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {config.labelB}
          </div>
        </div>
      </div>
    </section>
  );
});

DraggableSplitSection.displayName = 'DraggableSplitSection';

// Export components
export default {
  FullScreenSection,
  DraggableSplitSection
};
