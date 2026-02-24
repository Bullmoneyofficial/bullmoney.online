import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { ColorPickerPanel } from './ColorPickerPanel';
import { loadBgPreferences, loadColorPreferences, saveBgPreferences, saveColorPreferences } from './preferences';
import { BullMoneyHeroText, YouTubePlayer } from './Overlays';
import { FaultyTerminal } from './FaultyTerminal';
import { SplineBackground } from './SplineBackground';
import { ALL_EFFECTS, EFFECT_NAMES, type BackgroundEffect, type CyclingBackgroundProps } from './types';
import {
  DESKTOP_DEFAULT_SCENE_INDEX,
  SPLINE_CACHE_NAME,
  SPLINE_SCENE_NAMES,
  SPLINE_SCENES,
  clearGlobalSplineMemoryCache,
  clearSplineMemoryCache,
  hasCacheAPI,
  initSplineCache,
  isSplineCached,
  putSplineSceneInMemoryCache,
  resetSplineCacheInitialization,
} from '../spline/splineCache';

// Import the cool background effects
import LiquidEther from '@/components/LiquidEther';
import DarkVeil from '@/components/DarkVeil';
import LightPillar from '@/components/LightPillar';
import { GridScan } from '@/components/GridScan';
import Galaxy from '@/components/Galaxy';
import LetterGlitch from '@/components/LetterGlitch';
import Ballpit from '@/components/Ballpit';
import GridDistortion from '@/components/GridDistortion';

// Helper to get initial effect index from localStorage (runs only once)
// FAVORITES PRIORITY: If user has favorites, ALWAYS show one of their favorites (100%)
const getInitialEffectIndex = (effectsLength: number, reloadsPerCycle: number): number => {
  // SSR safety - always return Spline (index 0)
  if (typeof window === 'undefined') return 0;

  try {
    // Check for user favorites FIRST - they take 100% priority
    const prefsStr = localStorage.getItem('bg-preferences');
    if (prefsStr) {
      const prefs = JSON.parse(prefsStr);
      const favorites: BackgroundEffect[] = prefs.favorites || [];
      const enabled: BackgroundEffect[] = prefs.enabled || [];

      // If user has favorites, ALWAYS show one of them (100% of the time)
      if (favorites.length > 0) {
        // Pick a random favorite
        const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
        const favIndex = ALL_EFFECTS.indexOf(randomFav);
        if (favIndex !== -1) {
          console.log('[CyclingBG] Showing FAVORITE:', randomFav, 'at index', favIndex);
          localStorage.setItem('bg-effect-index', favIndex.toString());
          return favIndex;
        }
      }

      // If no favorites but has enabled list, pick from enabled
      if (enabled.length > 0) {
        const randomEnabled = enabled[Math.floor(Math.random() * enabled.length)];
        const enabledIndex = ALL_EFFECTS.indexOf(randomEnabled);
        if (enabledIndex !== -1) {
          console.log('[CyclingBG] Showing enabled effect:', randomEnabled, 'at index', enabledIndex);
          localStorage.setItem('bg-effect-index', enabledIndex.toString());
          return enabledIndex;
        }
      }
    }

    // FORCE CLEAR old cache on version change - ensures Spline shows
    const VERSION_KEY = 'bullmoney-bg-version';
    const CURRENT_VERSION = 'v4-favorites-first';
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== CURRENT_VERSION) {
      // Clear all old data and force Spline
      localStorage.removeItem('bg-effect-index');
      localStorage.removeItem('bg-reload-count');
      sessionStorage.removeItem('bullmoney-bg-session-started');
      sessionStorage.removeItem('bg-first-effect-shown');
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      console.log('[CyclingBG] Version change detected - clearing cache, showing Spline');
    }

    // SKIP SPLINE ON VERY FIRST LOAD — it's too heavy for first impressions
    // After first visit, Spline is allowed
    const FIRST_VISIT_KEY = 'bullmoney-has-visited';
    const hasEverVisited = localStorage.getItem(FIRST_VISIT_KEY);
    const isFirstEverLoad = !hasEverVisited;
    if (isFirstEverLoad) {
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
    }

    // ALWAYS show Spline on first load of each browser session (if no favorites)
    // UNLESS it's the very first visit ever
    const sessionKey = 'bullmoney-bg-session-started';
    const hasSessionStarted = sessionStorage.getItem(sessionKey);

    if (!hasSessionStarted) {
      sessionStorage.setItem(sessionKey, Date.now().toString());
      if (isFirstEverLoad) {
        // First ever load — skip GridScan, show darkVeil (index 4)
        const fallbackIndex = 4; // darkVeil
        localStorage.setItem('bg-effect-index', fallbackIndex.toString());
        localStorage.setItem('bg-reload-count', '0');
        console.log('[CyclingBG] First ever visit — skipping GridScan, showing darkVeil');
        return fallbackIndex;
      }
      // Returning session — show GridScan
      localStorage.setItem('bg-effect-index', '0');
      localStorage.setItem('bg-reload-count', '0');
      console.log('[CyclingBG] First session load - showing GridScan (index 0)');
      return 0;
    }

    const storedIndex = localStorage.getItem('bg-effect-index');
    const storedReloads = localStorage.getItem('bg-reload-count');

    let effectIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
    let reloadCount = storedReloads ? parseInt(storedReloads, 10) : 0;

    // Increment reload count
    reloadCount += 1;

    // Check if we should cycle to next effect
    if (reloadCount >= reloadsPerCycle) {
      // GRIDSCAN PRIORITY: 80% chance to show GridScan, 20% chance for random other effect
      const random = Math.random();
      if (random < 0.8) {
        // 80% - Go back to GridScan
        effectIndex = 0;
      } else {
        // 20% - Pick a RANDOM non-GridScan effect (never in order)
        // Generate random index from 1 to effectsLength-1 (excluding GridScan at 0)
        const randomNonGridScanIndex = Math.floor(Math.random() * (effectsLength - 1)) + 1;
        effectIndex = randomNonGridScanIndex;
      }
      reloadCount = 0;
    }

    // Store updated values
    localStorage.setItem('bg-effect-index', effectIndex.toString());
    localStorage.setItem('bg-reload-count', reloadCount.toString());

    console.log('[CyclingBG] Showing effect index:', effectIndex, '(0=GridScan, 1=LiquidEther, etc)');
    return effectIndex;
  } catch (e) {
    console.error('[CyclingBG] Error:', e);
    return 0; // Fallback - show GridScan
  }
};

export const CyclingBackground: React.FC<CyclingBackgroundProps> = ({
  reloadsPerCycle = 2, // Switch background every 2 reloads
  // GRIDSCAN FIRST (index 0) - prioritized 60% of the time
  effects = ['gridScan', 'liquidEther', 'galaxy', 'terminal', 'darkVeil', 'lightPillar', 'letterGlitch', 'spline', 'ballpit', 'gridDistortion'],
  videoId = 'jfKfPfyJRdk',
  videoLoading = false,
  videoError = false,
  onVideoError,
  onOpenHub,
  onOpenShop,
  onOpenNewShop,
}) => {
  // Use lazy initialization to get index synchronously on first render - prevents flicker
  const [currentIndex, setCurrentIndex] = useState(() => getInitialEffectIndex(effects.length, reloadsPerCycle));
  const [isReady, setIsReady] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showSpline, setShowSpline] = useState(true); // Control Spline visibility
  const [currentSplineScene, setCurrentSplineScene] = useState(SPLINE_SCENES[DESKTOP_DEFAULT_SCENE_INDEX]); // Default to Scene 1 for desktop
  const [showSplinePanel, setShowSplinePanel] = useState(false); // Spline selector panel
  const [downloadingScenes, setDownloadingScenes] = useState<Set<string>>(new Set());
  const [cacheVersion, setCacheVersion] = useState(0); // forces UI refresh on cache changes
  const [toast, setToast] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<BackgroundEffect[]>([]);
  const [enabledEffects, setEnabledEffects] = useState<BackgroundEffect[]>(effects as BackgroundEffect[]);
  const [showGrayscale, setShowGrayscale] = useState(false);

  // Color System State
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'custom'>('color');
  const [customColor, setCustomColor] = useState({ h: 0, s: 50, l: 50, a: 0.5 }); // HSL for easier manipulation
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [show3DOverlay] = useState(true);
  const [isSceneSwitching, setIsSceneSwitching] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadBgPreferences();
    if (prefs.favorites.length > 0) {
      setFavorites(prefs.favorites);
    }
    if (prefs.enabled.length > 0) {
      setEnabledEffects(prefs.enabled);
    }

    // Load color preferences
    const colorPrefs = loadColorPreferences();
    setColorMode(colorPrefs.mode);
    setCustomColor(colorPrefs.color);
    setShowGrayscale(colorPrefs.mode === 'grayscale');
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // DESKTOP ORCHESTRATOR INTEGRATION — Control Spline rendering
  // Listen to hero-controller events for performance-based 3D management
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSplineEnable = () => {
      setShowSpline(true);
      console.log('[HeroDesktop] Orchestrator enabled Spline');
    };

    const handleSplineSuspend = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setShowSpline(false);
      console.log('[HeroDesktop] Orchestrator suspended Spline -', detail.reason);
    };

    const handleSplineResume = () => {
      setShowSpline(true);
      console.log('[HeroDesktop] Orchestrator resumed Spline');
    };

    const handleQualityChange = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      // Future: adjust Spline LOD/quality based on detail.quality
      console.log('[HeroDesktop] Quality changed to:', detail.quality);
    };

    const handleQualityLow = () => handleQualityChange({ detail: { quality: 'low' } } as any);
    const handleQualityHigh = () => handleQualityChange({ detail: { quality: 'high' } } as any);

    // Listen for orchestrator events (via custom events)
    window.addEventListener('bm-hero:spline-enable', handleSplineEnable);
    window.addEventListener('bm-hero:spline-suspend', handleSplineSuspend);
    window.addEventListener('bm-hero:spline-resume', handleSplineResume);
    window.addEventListener('bm-hero:spline-quality-low', handleQualityLow);
    window.addEventListener('bm-hero:spline-quality-high', handleQualityHigh);

    return () => {
      window.removeEventListener('bm-hero:spline-enable', handleSplineEnable);
      window.removeEventListener('bm-hero:spline-suspend', handleSplineSuspend);
      window.removeEventListener('bm-hero:spline-resume', handleSplineResume);
      window.removeEventListener('bm-hero:spline-quality-low', handleQualityLow);
      window.removeEventListener('bm-hero:spline-quality-high', handleQualityHigh);
    };
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Switch to specific background
  const switchToBackground = useCallback(
    (index: number) => {
      if (index >= 0 && index < effects.length) {
        const effect = effects[index] as BackgroundEffect;
        if (!enabledEffects.includes(effect)) {
          showToast(`${EFFECT_NAMES[effect]} is disabled`);
          return;
        }
        setCurrentIndex(index);
        localStorage.setItem('bg-effect-index', index.toString());
        localStorage.setItem('bg-reload-count', '0');
        showToast(`Switched to ${EFFECT_NAMES[effect]}`);
      }
    },
    [effects, enabledEffects, showToast],
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    (effect: BackgroundEffect) => {
      setFavorites(prev => {
        const newFavs = prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect];
        saveBgPreferences(newFavs, enabledEffects);
        return newFavs;
      });
    },
    [enabledEffects],
  );

  // Toggle enabled/disabled
  const toggleEnabled = useCallback(
    (effect: BackgroundEffect) => {
      setEnabledEffects(prev => {
        // Don't allow disabling the last enabled effect
        if (prev.length === 1 && prev.includes(effect)) {
          showToast('At least one background must be enabled');
          return prev;
        }
        const newEnabled = prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect];
        saveBgPreferences(favorites, newEnabled);
        return newEnabled;
      });
    },
    [favorites, showToast],
  );

  // Enable all effects
  const enableAll = useCallback(() => {
    setEnabledEffects(effects as BackgroundEffect[]);
    saveBgPreferences(favorites, effects as BackgroundEffect[]);
    showToast('All backgrounds enabled');
  }, [effects, favorites, showToast]);

  // Enable only favorites
  const enableFavoritesOnly = useCallback(() => {
    if (favorites.length === 0) {
      showToast('No favorites set');
      return;
    }
    setEnabledEffects(favorites);
    saveBgPreferences(favorites, favorites);
    showToast('Showing favorites only');
  }, [favorites, showToast]);

  // Download (cache to app) a specific spline scene — no file download, just stores in Cache API
  const downloadSplineScene = useCallback(
    async (sceneUrl: string) => {
      // Already cached? Skip
      if (isSplineCached(sceneUrl)) {
        showToast(`${SPLINE_SCENE_NAMES[sceneUrl]} already cached`);
        return;
      }
      setDownloadingScenes(prev => new Set(prev).add(sceneUrl));
      try {
        const response = await fetch(sceneUrl, { cache: 'force-cache', priority: 'low' as RequestPriority });
        if (!response.ok) throw new Error('Failed to fetch');
        const responseClone = response.clone();
        if (hasCacheAPI) {
          const cache = await caches.open(SPLINE_CACHE_NAME);
          await cache.put(sceneUrl, responseClone);
        }
        const buffer = await response.arrayBuffer();
        putSplineSceneInMemoryCache(sceneUrl, buffer);
        setCacheVersion(v => v + 1); // force UI update
        showToast(`${SPLINE_SCENE_NAMES[sceneUrl]} cached ✓`);
      } catch (err) {
        console.error('Failed to cache scene:', err);
        showToast('Failed to cache scene');
      } finally {
        setDownloadingScenes(prev => {
          const next = new Set(prev);
          next.delete(sceneUrl);
          return next;
        });
      }
    },
    [showToast],
  );

  // Download all spline scenes to app cache
  const downloadAllSplineScenes = useCallback(async () => {
    const uncached = SPLINE_SCENES.filter(s => !isSplineCached(s));
    if (uncached.length === 0) {
      showToast('All scenes already cached ✓');
      return;
    }
    for (const scene of uncached) {
      await downloadSplineScene(scene);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    showToast(`${uncached.length} scenes cached ✓`);
  }, [downloadSplineScene, showToast]);

  // Clear all cached spline scenes (forces re-download)
  const clearAllSplineCache = useCallback(async () => {
    try {
      // Delete entire Cache API store
      if (hasCacheAPI) await caches.delete(SPLINE_CACHE_NAME);
      // Clear memory cache
      clearSplineMemoryCache();
      // Clear global cache if present
      clearGlobalSplineMemoryCache();
      // Reset to default scene
      setCurrentSplineScene(SPLINE_SCENES[0]);
      localStorage.removeItem('currentSplineScene');
      // Re-cache scene1 (always available)
      resetSplineCacheInitialization();
      await initSplineCache();
      setCacheVersion(v => v + 1); // force UI update
      showToast('Cache cleared — scene 1 re-cached');
    } catch (err) {
      console.error('Failed to clear cache:', err);
      showToast('Failed to clear cache');
    }
  }, [showToast]);

  // Switch to a specific spline scene (only if cached or default)
  // Pauses other work so Spline can load smoothly
  const switchSplineScene = useCallback(
    (sceneUrl: string) => {
      const isDefault = sceneUrl === SPLINE_SCENES[0];
      if (!isDefault && !isSplineCached(sceneUrl)) {
        showToast('Download this scene first');
        return;
      }
      if (sceneUrl === currentSplineScene) return; // already active

      // Phase 1: unmount old scene + pause animations
      setIsSceneSwitching(true);

      // Phase 2: after a frame, swap the scene URL so only one Spline instance loads
      requestAnimationFrame(() => {
        setTimeout(() => {
          setCurrentSplineScene(sceneUrl);
          localStorage.setItem('currentSplineScene', sceneUrl);
          // Phase 3: resume after Spline has started mounting
          setTimeout(() => {
            setIsSceneSwitching(false);
            showToast(`Switched to ${SPLINE_SCENE_NAMES[sceneUrl]}`);
          }, 300);
        }, 50);
      });
    },
    [showToast, currentSplineScene],
  );

  // Handle color mode changes
  const handleColorModeChange = useCallback(
    (mode: 'color' | 'grayscale' | 'custom') => {
      setColorMode(mode);
      setShowGrayscale(mode === 'grayscale');
      saveColorPreferences(mode, customColor);

      const modeNames = { color: 'Full Color', grayscale: 'Black & White', custom: 'Custom Color' };
      showToast(`${modeNames[mode]} mode`);
    },
    [customColor, showToast],
  );

  // Handle custom color changes
  const handleCustomColorChange = useCallback(
    (color: { h: number; s: number; l: number; a: number }) => {
      setCustomColor(color);
      saveColorPreferences(colorMode, color);
    },
    [colorMode],
  );

  // Load saved spline scene on mount (only if still cached)
  useEffect(() => {
    const saved = localStorage.getItem('currentSplineScene');
    if (saved && SPLINE_SCENES.includes(saved)) {
      const isDefault = saved === SPLINE_SCENES[0] || saved === SPLINE_SCENES[DESKTOP_DEFAULT_SCENE_INDEX];
      if (isDefault || isSplineCached(saved)) {
        setCurrentSplineScene(saved);
      } else {
        // Scene was cleared from cache — reset to desktop default (Scene 1)
        localStorage.removeItem('currentSplineScene');
        setCurrentSplineScene(SPLINE_SCENES[DESKTOP_DEFAULT_SCENE_INDEX]);
      }
    }
  }, []);

  // Keyboard shortcuts: Ctrl + 1-12 (or 0 for 10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl key (or Cmd on Mac)
      if (!e.ctrlKey && !e.metaKey) return;

      let index = -1;

      // Number keys 1-9 for backgrounds 1-9
      if (e.key >= '1' && e.key <= '9') {
        index = parseInt(e.key, 10) - 1;
      }
      // 0 key for background 10
      else if (e.key === '0') {
        index = 9;
      }
      // - key for background 11
      else if (e.key === '-') {
        index = 10;
      }
      // = key for background 12
      else if (e.key === '=') {
        index = 11;
      }
      // B key to toggle panel
      else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowPanel(prev => !prev);
        return;
      }

      if (index >= 0 && index < effects.length) {
        e.preventDefault();
        switchToBackground(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effects.length, switchToBackground]);

  // Small delay to ensure component is fully mounted before showing
  useEffect(() => {
    // Use requestAnimationFrame to ensure we're past the paint
    const raf = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentEffect = effects[currentIndex] as BackgroundEffect;

  const contentOverlay = useMemo(() => {
    switch (currentEffect) {
      case 'spline':
        return null; // No overlay for Spline - let it shine on its own
      case 'liquidEther':
      case 'galaxy':
      case 'terminal':
      case 'darkVeil':
        return <BullMoneyHeroText onOpenHub={onOpenHub} onOpenShop={onOpenShop} onOpenNewShop={onOpenNewShop} />;
      case 'lightPillar':
        return <YouTubePlayer videoId={videoId} loading={videoLoading} error={videoError} onError={onVideoError} />;
      case 'letterGlitch':
      case 'gridScan':
      case 'ballpit':
      case 'gridDistortion':
      default:
        return null;
    }
  }, [currentEffect, onOpenHub, onOpenShop, onOpenNewShop, onVideoError, videoError, videoId, videoLoading]);

  // Render a single effect component - only one at a time for memory efficiency
  const renderedEffect = useMemo(() => {
    switch (currentEffect) {
      case 'spline':
        return showSpline ? <SplineBackground grayscale={showGrayscale} sceneUrl={currentSplineScene} /> : null;
      case 'liquidEther':
        return (
          <LiquidEther
            colors={['#ffffff', '#e8e8e8', '#d0d0d0']}
            mouseForce={10}
            cursorSize={60}
            isViscous={false}
            viscous={15}
            iterationsViscous={8}
            iterationsPoisson={8}
            resolution={0.25}
            isBounce={false}
            autoDemo
            autoSpeed={0.3}
            autoIntensity={1.2}
            takeoverDuration={0.3}
            autoResumeDelay={3000}
            autoRampDuration={0.5}
          />
        );
      case 'darkVeil':
        return (
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <DarkVeil
              hueShift={0}
              noiseIntensity={0.01}
              scanlineIntensity={0}
              speed={0.3}
              scanlineFrequency={0}
              warpAmount={0.05}
              resolutionScale={1}
            />
          </div>
        );
      case 'lightPillar':
        return (
          <LightPillar
            topColor="#ffffff"
            bottomColor="#cccccc"
            intensity={0.6}
            rotationSpeed={0.15}
            glowAmount={0.002}
            pillarWidth={2}
            pillarHeight={0.3}
            noiseIntensity={0.2}
            pillarRotation={15}
            interactive={false}
            mixBlendMode="screen"
            quality="low"
          />
        );
      case 'gridScan':
        return (
          <GridScan
            sensitivity={0.4}
            lineThickness={1}
            linesColor="#444444"
            gridScale={0.15}
            scanColor="#ffffff"
            scanOpacity={0.3}
            enablePost={false}
            bloomIntensity={0}
            chromaticAberration={0}
            noiseIntensity={0.005}
            scanDuration={4}
            scanDelay={2}
          />
        );
      case 'galaxy':
        return (
          <Galaxy
            mouseRepulsion={false}
            mouseInteraction={false}
            density={0.8}
            glowIntensity={0.4}
            saturation={0}
            hueShift={0}
            twinkleIntensity={0.05}
            rotationSpeed={0.015}
            repulsionStrength={1}
            autoCenterRepulsion={0}
            starSpeed={0.15}
            speed={0.2}
            transparent={false}
            disableAnimation={false}
          />
        );
      case 'letterGlitch':
        return (
          <LetterGlitch
            glitchColors={['#ffffff', '#dddddd', '#bbbbbb']}
            glitchSpeed={80}
            centerVignette={true}
            outerVignette={true}
            smooth={false}
            characters="BULLMONEY"
          />
        );
      case 'ballpit':
        return <Ballpit count={40} gravity={0.005} friction={0.99} wallBounce={0.85} followCursor={false} />;
      case 'gridDistortion':
        return (
          <GridDistortion
            imageSrc="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=60"
            grid={8}
            mouse={0.08}
            strength={0.08}
            relaxation={0.95}
          />
        );
      case 'terminal':
        return (
          <FaultyTerminal
            scale={1.5}
            gridMul={[1.5, 1]}
            digitSize={1}
            timeScale={0.3}
            scanlineIntensity={0.4}
            glitchAmount={0.5}
            flickerAmount={0.4}
            noiseAmp={0.8}
            curvature={0.03}
            tint="#ffffff"
            mouseReact={false}
            mouseStrength={0}
            pageLoadAnimation={false}
            brightness={0.5}
            dpr={0.75}
          />
        );
      default:
        return null;
    }
  }, [currentEffect, currentSplineScene, showGrayscale, showSpline]);

  // Get shortcut key label
  const getShortcutKey = (index: number): string => {
    if (index < 9) return `Ctrl+${index + 1}`;
    if (index === 9) return 'Ctrl+0';
    if (index === 10) return 'Ctrl+-';
    if (index === 11) return 'Ctrl+=';
    return '';
  };

  return (
    <div className={`cycling-bg-layer${isSceneSwitching ? ' scene-switching' : ''}`}>
      {/* Single effect - only one rendered at a time for memory efficiency */}
      <div className={`cycling-bg-item ${isReady ? 'active' : ''}`} key={`effect-${currentIndex}`}>
        {isSceneSwitching && currentEffect === 'spline' ? null : renderedEffect}
      </div>

      {/* 3D Spline Overlay — shown/hidden by 3D toggle button */}
      {show3DOverlay && showSpline && !isSceneSwitching && (
        <div className="cycling-bg-item active" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <SplineBackground grayscale={showGrayscale} sceneUrl={currentSplineScene} />
        </div>
      )}

      {/* Universal Color Overlay System - applies to ALL backgrounds */}
      {colorMode === 'grayscale' && (
        <>
          {/* Grayscale filter overlay - color kill */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: 100,
              backgroundColor: '#808080',
              mixBlendMode: 'color',
              WebkitMixBlendMode: 'color',
              pointerEvents: 'none',
              transition: 'opacity 300ms ease-out',
            } as React.CSSProperties}
          />

          {/* Extra saturation kill overlay */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: 101,
              backgroundColor: 'rgba(128, 128, 128, 0.3)',
              mixBlendMode: 'saturation',
              WebkitMixBlendMode: 'saturation',
              pointerEvents: 'none',
              transition: 'opacity 300ms ease-out',
            } as React.CSSProperties}
          />
        </>
      )}

      {colorMode === 'custom' && (
        <>
          {/* Custom color overlay with user-selected color */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: 100,
              backgroundColor: `hsla(${customColor.h}, ${customColor.s}%, ${customColor.l}%, ${customColor.a})`,
              mixBlendMode: 'color',
              WebkitMixBlendMode: 'color',
              pointerEvents: 'none',
              transition: 'background-color 300ms ease-out',
            } as React.CSSProperties}
          />

          {/* Additional overlay for enhanced color effect */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: 101,
              background: `radial-gradient(circle at 50% 50%, hsla(${customColor.h}, ${customColor.s}%, ${customColor.l}%, ${customColor.a * 0.3}) 0%, transparent 70%)`,
              pointerEvents: 'none',
              transition: 'background 300ms ease-out',
            } as React.CSSProperties}
          />
        </>
      )}

      {isReady && (
        <div className={`hero-content-overlay ${contentOverlay ? 'has-content' : 'picker-only'}`}>
          {/* Content wrapper for centering the actual content */}
          {contentOverlay && <div className="hero-content-wrapper">{contentOverlay}</div>}
        </div>
      )}

      {/* Unified BG Picker Button — fixed center, matching mobile Discord hero style */}
      <div
        style={{
          position: 'fixed',
          top: '140px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 2147483647,
          pointerEvents: 'none',
        }}
      >
        {/* Main BG Picker Button */}
        <button
          className="bg-selector-toggle"
          style={{
            position: 'relative',
            top: 'auto',
            left: 'auto',
            transform: 'none',
            pointerEvents: 'auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
            color: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.8)',
          }}
          onClick={() => setShowBgMenu(!showBgMenu)}
          title="Background Settings (Ctrl+B)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span style={{ color: '#000000' }}>BG Picker</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: 14,
              height: 14,
              marginLeft: 4,
              transform: showBgMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Smart Dropdown Menu with Quick BG Picker */}
        <AnimatePresence>
          {showBgMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.9)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                minWidth: 200,
                maxWidth: 280,
              }}
            >
              {/* Quick Background Switcher */}
              <div style={{ marginBottom: 4 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 8,
                    paddingLeft: 4,
                  }}
                >
                  Quick Switch
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 6,
                  }}
                >
                  {(effects as BackgroundEffect[]).slice(0, 10).map((effect, index) => {
                    const isActive = currentIndex === index;
                    const isEnabled = enabledEffects.includes(effect);
                    const bgIcons: Record<string, string> = {
                      gridScan: '▦',
                      spline: '◇',
                      liquidEther: '◎',
                      galaxy: '✦',
                      terminal: '▤',
                      darkVeil: '◐',
                      lightPillar: '▮',
                      letterGlitch: 'A̷',
                      ballpit: '●',
                      gridDistortion: '◫',
                    };
                    return (
                      <button
                        key={effect}
                        onClick={() => {
                          if (isEnabled) {
                            switchToBackground(index);
                          }
                        }}
                        disabled={!isEnabled}
                        title={EFFECT_NAMES[effect]}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          border: isActive ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)'
                            : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                          fontSize: 16,
                          cursor: isEnabled ? 'pointer' : 'not-allowed',
                          opacity: isEnabled ? 1 : 0.3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {bgIcons[effect] || '◌'}
                      </button>
                    );
                  })}
                </div>
                {/* Current BG Label */}
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {EFFECT_NAMES[effects[currentIndex] as BackgroundEffect]}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

              {/* Quick Toggle Row */}
              <div style={{ display: 'flex', gap: 6 }}>
                {/* Color Toggle */}
                <button
                  onClick={() => {
                    // Cycle through color modes
                    const modes: ('color' | 'grayscale' | 'custom')[] = ['color', 'grayscale', 'custom'];
                    const currentModeIndex = modes.indexOf(colorMode);
                    const nextMode = modes[(currentModeIndex + 1) % modes.length];
                    setColorMode(nextMode);
                    setShowGrayscale(nextMode === 'grayscale');
                    saveColorPreferences(nextMode, customColor);
                    showToast(`Color: ${nextMode === 'grayscale' ? 'B&W' : nextMode === 'custom' ? 'Custom' : 'Normal'}`);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    background: colorMode !== 'color' ? 'rgba(41, 151, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: colorMode !== 'color' ? '1px solid rgba(41, 151, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{colorMode === 'grayscale' ? '◐' : colorMode === 'custom' ? '◉' : '○'}</span>
                  {colorMode === 'grayscale' ? 'B&W' : colorMode === 'custom' ? 'Tint' : 'Color'}
                </button>

                {/* 3D Toggle */}
                <button
                  onClick={() => {
                    setShowSpline(prev => {
                      const next = !prev;
                      showToast(`3D: ${next ? 'ON' : 'OFF'}`);
                      return next;
                    });
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    background: showSpline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: showSpline ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: showSpline ? '#86efac' : '#fff',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 14 }}>◇</span>
                  3D {showSpline ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* More Options */}
              <button
                onClick={() => {
                  setShowPanel(true);
                  setShowBgMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                More Options →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spline Scene Selector Panel */}
      {showSplinePanel && (
        <div className="bg-selector-panel" style={{ top: '140px' }}>
          <div className="bg-selector-header">
            <div>
              <h3 className="bg-selector-title">3D Spline Scenes</h3>
              <p className="bg-selector-subtitle">Hold 3D button to open • Click to switch</p>
            </div>
            <button
              onClick={() => setShowSplinePanel(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div className="bg-selector-list">
            {SPLINE_SCENES.map((sceneUrl, index) => {
              const isActive = currentSplineScene === sceneUrl;
              const isDownloading = downloadingScenes.has(sceneUrl);
              // cacheVersion forces re-eval after clear/download
              const isCached = cacheVersion >= 0 && isSplineCached(sceneUrl);
              const isDefault = index === 0; // scene1 = always available

              return (
                <div key={sceneUrl} className={`bg-selector-item ${isActive ? 'active' : ''}`}>
                  <div className="bg-item-toggle enabled" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {index + 1}
                  </div>

                  <div
                    className="bg-item-info"
                    onClick={() => {
                      if (isCached || isDefault) {
                        switchSplineScene(sceneUrl);
                      } else {
                        // Must download first — don't auto-switch
                        showToast('Download this scene first');
                      }
                    }}
                  >
                    <div className="bg-item-name">
                      {SPLINE_SCENE_NAMES[sceneUrl]}
                      {isDefault && <span style={{ marginLeft: 6, fontSize: '9px', opacity: 0.5 }}>DEFAULT</span>}
                      {!isDefault && isCached && <span style={{ marginLeft: 6, fontSize: '9px', opacity: 0.5 }}>CACHED</span>}
                    </div>
                  </div>

                  {!isDefault && (
                    <button
                      className="bg-item-fav"
                      onClick={e => {
                        e.stopPropagation();
                        downloadSplineScene(sceneUrl);
                      }}
                      disabled={isDownloading || isCached}
                      title={isCached ? 'Scene cached in app' : 'Cache this scene to app'}
                      style={{
                        opacity: isDownloading ? 0.5 : isCached ? 0.3 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isDownloading ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spline-dl-spin 1s linear infinite' }}>
                          <circle
                            cx="8"
                            cy="8"
                            r="6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="28"
                            strokeDashoffset="8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : isCached ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8.5L6.5 12L13 4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 2v8m0 0L5 7m3 3l3-3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  )}

                  <button className="bg-item-select" onClick={() => switchSplineScene(sceneUrl)}>
                    {isActive ? 'Active' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-selector-footer">
            <button className="bg-footer-btn" onClick={downloadAllSplineScenes} disabled={downloadingScenes.size > 0}>
              Cache All ({SPLINE_SCENES.length})
            </button>
            <button
              className="bg-footer-btn"
              onClick={clearAllSplineCache}
              disabled={downloadingScenes.size > 0}
              style={{ color: '#ff6b6b' }}
            >
              Clear Cache
            </button>
            <button className="bg-footer-btn primary" onClick={() => setShowSplinePanel(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Background Selector Panel */}
      {showPanel && (
        <div className="bg-selector-panel">
          <div className="bg-selector-header">
            <div>
              <h3 className="bg-selector-title">Background Effects</h3>
              <p className="bg-selector-subtitle">Use Ctrl+1-0,-,= to quick switch</p>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div className="bg-selector-list">
            {(effects as BackgroundEffect[]).map((effect, index) => {
              const isActive = currentIndex === index;
              const isEnabled = enabledEffects.includes(effect);
              const isFavorite = favorites.includes(effect);

              return (
                <div key={effect} className={`bg-selector-item ${isActive ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}>
                  <div
                    className={`bg-item-toggle ${isEnabled ? 'enabled' : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      toggleEnabled(effect);
                    }}
                    title={isEnabled ? 'Click to disable' : 'Click to enable'}
                  >
                    {isEnabled ? '✓' : ''}
                  </div>

                  <div className="bg-item-info" onClick={() => isEnabled && switchToBackground(index)}>
                    <div className="bg-item-name">{EFFECT_NAMES[effect]}</div>
                    {index < 12 && <div className="bg-item-shortcut">{getShortcutKey(index)}</div>}
                  </div>

                  <button
                    className={`bg-item-fav ${isFavorite ? 'favorited' : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(effect);
                    }}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite ? '★' : '☆'}
                  </button>

                  <button className="bg-item-select" onClick={() => isEnabled && switchToBackground(index)} disabled={!isEnabled}>
                    {isActive ? 'Active' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-selector-footer">
            <button className="bg-footer-btn" onClick={enableAll}>
              Enable All
            </button>
            <button className="bg-footer-btn primary" onClick={enableFavoritesOnly}>
              Favorites Only
            </button>
          </div>
        </div>
      )}

      {/* Color Picker Panel */}
      <ColorPickerPanel
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        colorMode={colorMode}
        customColor={customColor}
        onColorModeChange={handleColorModeChange}
        onCustomColorChange={handleCustomColorChange}
      />

      {/* Toast notification */}
      {toast && <div className="bg-shortcut-toast">{toast}</div>}
    </div>
  );
};
