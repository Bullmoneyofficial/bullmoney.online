"use client";

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSplineAudio, useSplineAudioHandlers, SplineAudioProfile } from '@/app/hooks/useSplineAudio';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import type { SplineWrapperProps } from '@/lib/spline-wrapper';

// Dynamic import for the heavy Spline runtime
const SplineBase = dynamic<SplineWrapperProps>(() => import('@/lib/spline-wrapper') as any, { 
  ssr: false,
  loading: () => null 
});

interface SplineWithAudioProps {
  scene: string;
  className?: string;
  placeholder?: string | null;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  priority?: boolean;
  isHero?: boolean;
  targetFPS?: number;
  maxDpr?: number;
  minDpr?: number;
  // Audio-specific props
  audioEnabled?: boolean;
  audioProfile?: SplineAudioProfile;
  audioVolume?: number;
}

/**
 * SplineWithAudio - Spline 3D component with 20 unique interaction sounds
 * 
 * Interaction Types:
 * - Click sounds (click, doubleClick, longPress)
 * - Hover sounds (hover, hoverExit)
 * - Drag sounds (drag, dragStart, dragEnd)
 * - Scroll/Zoom sounds (scroll, zoom, rotate)
 * - Touch sounds (touch, touchEnd)
 * - Swipe sounds (swipeLeft, swipeRight, swipeUp, swipeDown)
 * - Multi-touch sounds (pinch, spread)
 * - Object interaction (objectSelect)
 * 
 * Audio Profiles:
 * - CYBER: Futuristic electronic sounds
 * - ORGANIC: Natural, soft sounds
 * - MECHANICAL: Industrial, mechanical sounds
 * - SILENT: No audio
 */
function SplineWithAudioComponent({
  scene,
  className = '',
  placeholder,
  onLoad,
  onError,
  priority = false,
  isHero = false,
  targetFPS,
  maxDpr,
  minDpr,
  audioEnabled = true,
  audioProfile = 'CYBER',
  audioVolume = 0.4,
}: SplineWithAudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineAppRef = useRef<any>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clickRipples, setClickRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [dragTrail, setDragTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [dragRotation, setDragRotation] = useState(0);
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
  const [interactionHint, setInteractionHint] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(50); // 0-100 for timeline (start at center)
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [sceneTransform, setSceneTransform] = useState({ rotateY: 0, scale: 1 }); // Visual transform
  const rippleIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const totalDragDistance = useRef(0);
  const animationDuration = useRef(5000); // Default 5 second animation cycle
  
  // Get global theme for potential audio profile syncing
  const { activeTheme } = useGlobalTheme();
  
  // Determine audio profile based on theme or prop
  const effectiveAudioProfile: SplineAudioProfile = (() => {
    if (!audioEnabled) return 'SILENT';
    if (audioProfile !== 'CYBER') return audioProfile;
    
    // Auto-sync with theme categories
    const category = activeTheme?.category?.toLowerCase() || '';
    if (category.includes('nature') || category.includes('organic')) return 'ORGANIC';
    if (category.includes('industrial') || category.includes('mechanical')) return 'MECHANICAL';
    return 'CYBER';
  })();
  
  // Initialize Spline audio engine
  const audioPlayer = useSplineAudio({
    enabled: audioEnabled,
    profile: effectiveAudioProfile,
    volume: audioVolume,
  });
  
  // Get all audio event handlers
  const audioHandlers = useSplineAudioHandlers(audioPlayer, containerRef);

  // Initialize audio on first user interaction
  useEffect(() => {
    if (!audioEnabled) return;
    
    const initAudio = () => {
      audioPlayer.init();
    };
    
    // Try to init immediately (may fail without user gesture)
    audioPlayer.init();
    
    // Also listen for first interaction
    const container = containerRef.current;
    if (container) {
      container.addEventListener('pointerdown', initAudio, { once: true });
      container.addEventListener('touchstart', initAudio, { once: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('pointerdown', initAudio);
        container.removeEventListener('touchstart', initAudio);
      }
    };
  }, [audioEnabled, audioPlayer]);

  // Track interaction state for touch handling
  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setTimeout(() => setIsInteracting(false), 300);
  }, []);

  // Handle Spline app instance - enables timeline scrubbing
  const handleSplineApp = useCallback((app: any) => {
    splineAppRef.current = app;
    console.log('[SplineWithAudio] Spline app captured for timeline control');
    
    // Explore what's available for animation control
    try {
      // Log available methods for debugging
      const methods = Object.keys(app).filter(k => typeof app[k] === 'function');
      console.log('[SplineWithAudio] Available methods:', methods);
      
      // Check for animation-related properties
      if (app._mixer) console.log('[SplineWithAudio] Has _mixer');
      if (app._proxyStates) console.log('[SplineWithAudio] Has _proxyStates:', Object.keys(app._proxyStates).length);
      if (app._renderer) console.log('[SplineWithAudio] Has _renderer');
      
      // Try to get all objects and find animation info
      const objects = app.getAllObjects?.();
      if (objects) {
        console.log('[SplineWithAudio] Scene objects:', objects.length);
        objects.forEach((obj: any, i: number) => {
          if (obj.animation) {
            console.log(`[SplineWithAudio] Object ${i} has animation:`, obj.name, obj.animation);
          }
        });
      }
      
      // Get variables that might control animation
      const vars = app.getVariables?.();
      if (vars) {
        console.log('[SplineWithAudio] Scene variables:', vars);
      }
      
      // Try to pause initial animation to allow scrubbing
      if (app.stop) {
        // Don't stop immediately, let scene play first
        setTimeout(() => {
          // app.stop(); // Uncomment to start paused for scrubbing
        }, 2000);
      }
    } catch (e) {
      console.debug('[SplineWithAudio] Exploration error:', e);
    }
  }, []);

  // Control scene via drag - applies visual rotation transform
  const scrubTimeline = useCallback((deltaX: number) => {
    // Calculate rotation based on drag (drag right = rotate right, drag left = rotate left)
    const sensitivity = 1.5; // How much drag affects rotation
    const rotationDelta = deltaX * sensitivity;
    
    setSceneTransform(prev => {
      // Accumulate rotation (with limits)
      const newRotation = Math.max(-180, Math.min(180, prev.rotateY + rotationDelta));
      // Scale slightly during interaction
      const newScale = 1 + Math.abs(rotationDelta) * 0.002;
      return { 
        rotateY: newRotation, 
        scale: Math.min(1.1, newScale)
      };
    });
    
    // Update progress bar based on rotation position (-180 to 180 mapped to 0-100)
    setAnimationProgress(prev => {
      const newProgress = Math.max(0, Math.min(100, prev + deltaX * 0.3));
      return newProgress;
    });
    
    // Also try Spline API methods that might work
    try {
      const app = splineAppRef.current;
      if (app) {
        // Try emitEvent for rotation control if scene supports it
        app.emitEvent?.('rotate', 'scene');
        
        // Try setting variables that might control the scene
        app.setVariable?.('rotation', sceneTransform.rotateY);
        app.setVariable?.('dragX', deltaX);
      }
    } catch (e) {
      // API methods not available
    }
  }, [sceneTransform.rotateY]);

  // Reset scene rotation to left position
  const rewindAnimation = useCallback(() => {
    setAnimationProgress(0);
    setSceneTransform({ rotateY: -90, scale: 1 });
    setInteractionHint('⏪ Rotated left!');
    setTimeout(() => setInteractionHint(''), 1000);
  }, []);

  // Rotate scene to right position
  const fastForwardAnimation = useCallback(() => {
    setAnimationProgress(100);
    setSceneTransform({ rotateY: 90, scale: 1 });
    setInteractionHint('⏩ Rotated right!');
    setTimeout(() => setInteractionHint(''), 1000);
  }, []);

  // Reset scene to center
  const resetScene = useCallback(() => {
    setAnimationProgress(50);
    setSceneTransform({ rotateY: 0, scale: 1 });
    setInteractionHint('🔄 Reset to center!');
    setTimeout(() => setInteractionHint(''), 1000);
  }, []);

  // Add ripple effect at position
  const addRipple = useCallback((x: number, y: number) => {
    rippleIdRef.current += 1;
    const newRipple = { x, y, id: rippleIdRef.current };
    setClickRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 700);
  }, []);

  // Add trail particle at position
  const addTrailParticle = useCallback((x: number, y: number) => {
    trailIdRef.current += 1;
    const newParticle = { x, y, id: trailIdRef.current };
    setDragTrail(prev => [...prev.slice(-15), newParticle]); // Keep last 15 particles
    setTimeout(() => {
      setDragTrail(prev => prev.filter(p => p.id !== newParticle.id));
    }, 500);
  }, []);

  // Handle load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Combined handlers that include both audio and interaction tracking + visual feedback
  const combinedHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      handleInteractionStart();
      setIsDragging(true);
      setInteractionHint('⬅️➡️ Drag to rotate 3D scene');
      // Store start position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        dragStartPos.current = { x, y };
        lastMousePos.current = { x, y };
        addRipple(x, y);
      }
      audioHandlers.onMouseDown(e);
    },
    onMouseUp: (e: React.MouseEvent) => {
      handleInteractionEnd();
      setIsDragging(false);
      setDragRotation(0);
      setDragVelocity({ x: 0, y: 0 });
      setDragTrail([]);
      setIsScrubbing(false);
      // Smoothly return to normal scale (keep rotation)
      setSceneTransform(prev => ({ ...prev, scale: 1 }));
      setTimeout(() => setShowTimeline(false), 1500); // Hide timeline after delay
      setInteractionHint(isHovering ? '👆 Click & drag' : '');
      audioHandlers.onMouseUp(e);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      setIsHovering(true);
      setInteractionHint('👆 Click & drag to explore');
      audioHandlers.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleInteractionEnd();
      setIsHovering(false);
      setIsDragging(false);
      setDragRotation(0);
      setDragVelocity({ x: 0, y: 0 });
      setDragTrail([]);
      setInteractionHint('');
      audioHandlers.onMouseLeave(e);
    },
    onMouseMove: (e: React.MouseEvent) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate velocity for cool effects
        const vx = x - lastMousePos.current.x;
        const vy = y - lastMousePos.current.y;
        setDragVelocity({ x: vx, y: vy });
        
        // Calculate rotation based on drag direction
        const rotation = Math.atan2(vy, vx) * (180 / Math.PI);
        setDragRotation(rotation);
        
        // Timeline scrubbing - horizontal drag controls animation
        // Scrub on ANY horizontal movement for better responsiveness
        if (Math.abs(vx) > 1) {
          scrubTimeline(vx);
          setIsScrubbing(true);
          setShowTimeline(true);
          setInteractionHint(vx < 0 ? '⬅️ Rotating left' : '➡️ Rotating right');
        }
        
        // Add trail particle every few pixels
        const distance = Math.sqrt(vx * vx + vy * vy);
        if (distance > 8) {
          addTrailParticle(x, y);
        }
        
        // ALWAYS update position for accurate velocity calculation
        lastMousePos.current = { x, y };
      }
      audioHandlers.onMouseMove(e);
    },
    onTouchStart: (e: React.TouchEvent) => {
      handleInteractionStart();
      setIsDragging(true);
      setInteractionHint('⬅️➡️ Swipe to rotate 3D');
      // Add ripple at touch position
      if (e.touches[0] && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        dragStartPos.current = { x, y };
        lastMousePos.current = { x, y };
        addRipple(x, y);
      }
      audioHandlers.onTouchStart(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      handleInteractionEnd();
      setIsDragging(false);
      setDragRotation(0);
      setDragVelocity({ x: 0, y: 0 });
      setDragTrail([]);
      setIsScrubbing(false);
      // Smoothly return to normal scale (keep rotation)
      setSceneTransform(prev => ({ ...prev, scale: 1 }));
      setTimeout(() => setShowTimeline(false), 1500);
      setInteractionHint('');
      audioHandlers.onTouchEnd(e);
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (isDragging && e.touches[0] && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        // Calculate velocity
        const vx = x - lastMousePos.current.x;
        const vy = y - lastMousePos.current.y;
        setDragVelocity({ x: vx, y: vy });
        
        // Calculate rotation
        const rotation = Math.atan2(vy, vx) * (180 / Math.PI);
        setDragRotation(rotation);
        
        // Timeline scrubbing - horizontal swipe controls animation
        if (Math.abs(vx) > 1) {
          scrubTimeline(vx);
          setIsScrubbing(true);
          setShowTimeline(true);
          setInteractionHint(vx < 0 ? '⬅️ Rotating left' : '➡️ Rotating right');
        }
        
        // Add trail particle
        const distance = Math.sqrt(vx * vx + vy * vy);
        if (distance > 10) {
          addTrailParticle(x, y);
        }
        
        // ALWAYS update position for accurate velocity calculation
        lastMousePos.current = { x, y };
      }
      audioHandlers.onTouchMove(e);
    },
    onWheel: (e: React.WheelEvent) => {
      setInteractionHint('🔍 Zooming');
      audioHandlers.onWheel(e);
      setTimeout(() => setInteractionHint(''), 800);
    },
    onDoubleClick: (e: React.MouseEvent) => {
      // Double-click to reset scene to center
      resetScene();
      setShowTimeline(true);
      audioHandlers.onDoubleClick(e);
      setTimeout(() => {
        setShowTimeline(false);
      }, 1500);
    },
    onContextMenu: audioHandlers.onContextMenu,
  };

  return (
    <div
      ref={containerRef}
      className={`spline-audio-container relative w-full h-full ${className}`}
      style={{
        touchAction: isHero ? 'pan-y' : (isInteracting ? 'none' : 'pan-y'),
        // MOBILE/IN-APP FIX: Ensure full coverage
        width: '100%',
        height: '100%',
        minHeight: isHero ? '100%' : 'auto',
        maxWidth: '100vw',
        maxHeight: '100dvh', // Dynamic viewport height for in-app browsers
      }}
      {...combinedHandlers}
    >
      {/* VISUAL INTERACTION FEEDBACK LAYER */}
      
      {/* Hover glow effect - subtle edge glow on hover */}
      <AnimatePresence>
        {isHovering && !isDragging && isHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[5] pointer-events-none rounded-xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(var(--accent-rgb, 59, 130, 246), 0.08) 0%, transparent 70%)',
              boxShadow: 'inset 0 0 60px rgba(var(--accent-rgb, 59, 130, 246), 0.1)',
            }}
          />
        )}
      </AnimatePresence>

      {/* DRAG TRAIL PARTICLES - Cool glowing trail when dragging */}
      {isHero && dragTrail.map((particle, index) => (
        <motion.div
          key={particle.id}
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute z-[8] pointer-events-none"
          style={{
            left: particle.x - 8,
            top: particle.y - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(var(--accent-rgb, 59, 130, 246), ${0.8 - index * 0.05}) 0%, transparent 70%)`,
            boxShadow: `0 0 ${12 - index}px rgba(var(--accent-rgb, 59, 130, 246), 0.6)`,
          }}
        />
      ))}

      {/* VELOCITY INDICATOR - Shows drag direction with glowing arrow or timeline control */}
      <AnimatePresence>
        {isDragging && isHero && (Math.abs(dragVelocity.x) > 3 || Math.abs(dragVelocity.y) > 3) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute z-[9] pointer-events-none"
            style={{
              left: lastMousePos.current.x - 25,
              top: lastMousePos.current.y - 25,
              width: 50,
              height: 50,
            }}
          >
            {/* Scrubbing or rotation indicator */}
            <motion.div
              animate={{ 
                rotate: isScrubbing ? 0 : dragRotation,
                scale: isScrubbing ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex items-center justify-center"
            >
              <div 
                className="text-2xl font-bold"
                style={{
                  filter: `drop-shadow(0 0 10px ${isScrubbing 
                    ? (dragVelocity.x < 0 ? 'rgba(255, 100, 100, 0.9)' : 'rgba(100, 255, 100, 0.9)')
                    : 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)'})`,
                  transform: isScrubbing ? 'none' : 'scaleX(1.5)',
                  color: isScrubbing 
                    ? (dragVelocity.x < 0 ? '#ff6b6b' : '#51cf66')
                    : 'rgba(var(--accent-rgb, 59, 130, 246), 1)',
                }}
              >
                {isScrubbing ? (dragVelocity.x < 0 ? '⏪' : '⏩') : '→'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAG INTENSITY RING - Expands based on drag speed */}
      <AnimatePresence>
        {isDragging && isHero && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1 + Math.min(Math.sqrt(dragVelocity.x ** 2 + dragVelocity.y ** 2) / 50, 0.5),
              opacity: 0.6
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute z-[7] pointer-events-none rounded-full"
            style={{
              left: lastMousePos.current.x - 30,
              top: lastMousePos.current.y - 30,
              width: 60,
              height: 60,
              border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
              boxShadow: `0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.4), inset 0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.2)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Active/Dragging glow effect - dynamic based on velocity */}
      <AnimatePresence>
        {isDragging && isHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.3 + Math.min(Math.sqrt(dragVelocity.x ** 2 + dragVelocity.y ** 2) / 100, 0.4)
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 z-[5] pointer-events-none rounded-xl overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at ${lastMousePos.current.x}px ${lastMousePos.current.y}px, rgba(var(--accent-rgb, 59, 130, 246), 0.25) 0%, transparent 50%)`,
              boxShadow: 'inset 0 0 100px rgba(var(--accent-rgb, 59, 130, 246), 0.25), 0 0 60px rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Pulsing border effect when dragging */}
      <AnimatePresence>
        {isDragging && isHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[4] pointer-events-none rounded-xl"
            style={{
              border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
              boxShadow: '0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Click/Touch ripple effects */}
      {isHero && clickRipples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 5, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute z-[6] pointer-events-none rounded-full"
          style={{
            left: ripple.x - 30,
            top: ripple.y - 30,
            width: 60,
            height: 60,
            background: 'radial-gradient(circle, rgba(var(--accent-rgb, 59, 130, 246), 0.5) 0%, transparent 70%)',
          }}
        />
      ))}

      {/* Interaction hint tooltip */}
      <AnimatePresence>
        {interactionHint && isHero && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-24 md:bottom-32 left-1/2 transform -translate-x-1/2 z-[20] pointer-events-none"
          >
            <div 
              className="px-5 py-2.5 rounded-full backdrop-blur-xl text-sm font-semibold shadow-2xl flex items-center gap-2"
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1.5px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
                color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
              }}
            >
              {interactionHint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner status indicator */}
      {isHero && isLoaded && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute top-4 left-4 z-[15] pointer-events-none"
        >
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.35)',
            }}
          >
            <motion.div
              animate={isDragging ? { 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 0.4, repeat: isDragging ? Infinity : 0 }}
              className="text-base"
            >
              {isDragging ? '🔄' : isHovering ? '👆' : '🎮'}
            </motion.div>
            <span 
              className="text-xs font-medium"
              style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.9)' }}
            >
              {isDragging ? 'Rotating' : isHovering ? 'Interactive' : '3D Scene'}
            </span>
          </div>
        </motion.div>
      )}

      {/* QUICK ACCESS BAR - Shows when dragging or scene is rotated */}
      <AnimatePresence>
        {isHero && isLoaded && (isDragging || Math.abs(sceneTransform.rotateY) > 5) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[25]"
          >
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.4)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.15)',
            }}
          >
            {/* Rotate Left Button */}
            <motion.button
              onClick={rewindAnimation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.15)',
                border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
              }}
              whileHover={{ 
                scale: 1.05,
                background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.25)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base">⬅️</span>
              <span 
                className="text-xs font-medium hidden sm:inline"
                style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }}
              >
                Left
              </span>
            </motion.button>

            {/* Reset/Center Button */}
            <motion.button
              onClick={resetScene}
              className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.25)',
                border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
                boxShadow: '0 0 15px rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
              }}
              whileHover={{ 
                scale: 1.08,
                boxShadow: '0 0 25px rgba(var(--accent-rgb, 59, 130, 246), 0.4)',
              }}
              whileTap={{ scale: 0.92 }}
            >
              <motion.span
                animate={{ rotate: sceneTransform.rotateY !== 0 ? [0, -360] : 0 }}
                transition={{ duration: 2, repeat: sceneTransform.rotateY !== 0 ? Infinity : 0, ease: 'linear' }}
                className="text-lg"
              >
                🔄
              </motion.span>
              <span 
                className="text-xs font-bold"
                style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }}
              >
                Reset
              </span>
            </motion.button>

            {/* Rotate Right Button */}
            <motion.button
              onClick={fastForwardAnimation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.15)',
                border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
              }}
              whileHover={{ 
                scale: 1.05,
                background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.25)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span 
                className="text-xs font-medium hidden sm:inline"
                style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }}
              >
                Right
              </span>
              <span className="text-base">➡️</span>
            </motion.button>

            {/* Divider */}
            <div 
              className="w-px h-8 mx-1"
              style={{ background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.3)' }}
            />

            {/* Rotation indicator */}
            <div className="flex flex-col items-center px-2">
              <span 
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Rotation
              </span>
              <span 
                className="text-sm font-bold tabular-nums"
                style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }}
              >
                {Math.round(sceneTransform.rotateY)}°
              </span>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Initial interaction prompt - shows briefly after load on mobile */}
      <AnimatePresence>
        {isHero && isLoaded && !isHovering && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 4, times: [0, 0.1, 0.8, 1], delay: 1.5 }}
            className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center md:hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: 2, ease: 'easeInOut' }}
              className="px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.6)',
                boxShadow: '0 0 40px rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
              }}
            >
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl"
              >
                🖐️
              </motion.span>
              <div className="flex flex-col">
                <span 
                  className="font-bold text-sm"
                  style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }}
                >
                  Touch to interact
                </span>
                <span className="text-xs text-white/60">
                  Drag to explore 3D
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual Spline scene with CSS transform for drag control */}
      <motion.div
        className="w-full h-full"
        animate={{
          rotateY: sceneTransform.rotateY,
          scale: sceneTransform.scale,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 20,
          mass: 0.5,
        }}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          minHeight: '100%',
        }}
      >
        <SplineBase
          scene={scene}
          placeholder={placeholder}
          className="w-full h-full min-h-full"
          onLoad={handleLoad}
          onError={onError}
          priority={priority}
          isHero={isHero}
          targetFPS={targetFPS}
          maxDpr={maxDpr}
          minDpr={minDpr}
          onSplineApp={handleSplineApp}
          animationProgress={animationProgress}
        />
      </motion.div>

      {/* Timeline scrubbing indicator */}
      <AnimatePresence>
        {isHero && showTimeline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-[25] pointer-events-none"
          >
            <div 
              className="px-6 py-3 rounded-2xl backdrop-blur-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.7)',
                boxShadow: '0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.4)',
              }}
            >
              {/* Progress bar */}
              <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${animationProgress * 100}%`,
                    background: 'linear-gradient(90deg, rgba(var(--accent-rgb, 59, 130, 246), 1), rgba(var(--accent-rgb, 59, 130, 246), 0.7))',
                    boxShadow: '0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  }}
                  animate={{
                    boxShadow: isScrubbing 
                      ? ['0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.8)', '0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 1)', '0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.8)']
                      : '0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  }}
                  transition={{ duration: 0.5, repeat: isScrubbing ? Infinity : 0 }}
                />
              </div>
              
              {/* Labels */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 flex items-center gap-1">
                  <span>⏪</span>
                  <span>Drag left</span>
                </span>
                <span 
                  className="font-bold px-2 py-0.5 rounded-full text-[10px]"
                  style={{ 
                    background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
                    color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)',
                  }}
                >
                  {Math.round(animationProgress * 100)}%
                </span>
                <span className="text-white/60 flex items-center gap-1">
                  <span>Drag right</span>
                  <span>⏩</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Audio feedback indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && audioPlayer.isInitialized && (
        <div className="absolute top-2 right-2 text-[10px] text-white/40 bg-black/20 px-1 rounded pointer-events-none">
          🔊 {effectiveAudioProfile}
        </div>
      )}
    </div>
  );
}

export const SplineWithAudio = memo(SplineWithAudioComponent);
export default SplineWithAudio;
