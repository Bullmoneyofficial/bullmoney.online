"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from 'react-dom';
import { detectBrowser } from '@/lib/browserDetection';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence,
  useWillChange,
  useAnimation
} from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2, Edit2, Save, X, Trash2, Upload, Instagram, Send } from "lucide-react";

const SPLINE_VIEWER_SCRIPT_SRC = "https://unpkg.com/@splinetool/viewer@1.12.36/build/spline-viewer.js";

type HeroSplineSource = {
  runtimeUrl: string;
  viewerUrl: string;
  preferViewer?: boolean;
};

type HeroSplineSceneConfig = HeroSplineSource & {
  id: string;
  label: string;
  weight: number;
};

const HERO_SPLINE_SCENES: readonly HeroSplineSceneConfig[] = [
  {
    id: "timefold",
    label: "Timefold Odyssey",
    runtimeUrl: "https://prod.spline.design/S-nBNkFCGU9KbFxY/scene.splinecode",
    viewerUrl: "https://my.spline.design/timefoldodyssey-s3vKRBOk0ESLxu0qgZIB1IOD/",
    preferViewer: true,
    weight: 35,
  },
  {
    id: "nexbot",
    label: "Nexbot Vanguard",
    runtimeUrl: "https://prod.spline.design/iWLVJpgyHSJpuCnD/scene.splinecode",
    viewerUrl: "https://my.spline.design/nexbotrobotcharacterconcept-pJvW8Dq4jVXayg6xUDiM8nPp/",
    preferViewer: true,
    weight: 35,
  },
  {
    id: "followers-focus",
    label: "100 Followers Focus",
    runtimeUrl: "https://prod.spline.design/IomoYEa50DmuiTXE/scene.splinecode",
    viewerUrl: "https://my.spline.design/100followersfocus-55tpQJYDbng5lAQ3P1tq5abx/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "loading-bar",
    label: "The Loading Bar",
    runtimeUrl: "https://prod.spline.design/TOPNo0pcBjY8u6Ls/scene.splinecode",
    viewerUrl: "https://my.spline.design/theloadingbarvertical-J0jRfhBsRDUAUKzNRxMvZXak/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "cannon",
    label: "Cannon Dynamics",
    runtimeUrl: "https://prod.spline.design/C0mBZel0m7zXQaoD/scene.splinecode",
    viewerUrl: "https://my.spline.design/cannon-vOk1Cc5VyFBvcSq1ozXuhK1n/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "xgamer",
    label: "XGamer Flux",
    runtimeUrl: "https://prod.spline.design/1HGlyIYtYszh-B-r/scene.splinecode",
    viewerUrl: "https://my.spline.design/xgamer-RZ9X6L57SHESs7L04p6IDisA/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "r4xbot",
    label: "R4X Bot Sentinel",
    runtimeUrl: "https://prod.spline.design/G3yn-KsfkIAbK2Mz/scene.splinecode",
    viewerUrl: "https://my.spline.design/r4xbot-2RZeOpfgJ0Vr36G9Jd9EHlFB/",
    preferViewer: true,
    weight: 6,
  },
] as const;

const HERO_SPLINE_BLOCK_SIZE = 5;
const HERO_SPLINE_STORAGE_KEY = "heroSplineCycleIndex";
const HERO_SPLINE_LEGACY_KEY = "heroSplineReloadCount";
const HERO_SPLINE_DEFAULT_INDEX = 0;

const createHeroSplineSchedule = (
  scenes: readonly HeroSplineSceneConfig[],
): HeroSplineSceneConfig[] => {
  if (!scenes.length) {
    return [];
  }

  const normalizedScenes = scenes.map((scene) => ({
    scene,
    remaining: Number.isFinite(scene.weight)
      ? Math.max(1, Math.round(scene.weight))
      : 1,
  }));

  const totalSlots = normalizedScenes.reduce((sum, entry) => sum + entry.remaining, 0);
  if (totalSlots <= 0) {
    return [scenes[0]];
  }

  const schedule: HeroSplineSceneConfig[] = [];
  let remaining = totalSlots;

  while (remaining > 0) {
    for (const entry of normalizedScenes) {
      if (entry.remaining > 0) {
        schedule.push(entry.scene);
        entry.remaining -= 1;
        remaining -= 1;
      }
    }
  }

  return schedule;
};

const HERO_SPLINE_SCHEDULE = createHeroSplineSchedule(HERO_SPLINE_SCENES);
const HERO_SPLINE_CYCLE_LENGTH = Math.max(HERO_SPLINE_SCHEDULE.length, 1);
let heroSplineResolvedThisLoad = false;
let heroSplineCachedResolution: HeroSplineResolution | null = null;

const getStoredHeroSplineIndex = (): number => {
  if (typeof window === "undefined") {
    return HERO_SPLINE_DEFAULT_INDEX;
  }

  try {
    if (window.localStorage.getItem(HERO_SPLINE_LEGACY_KEY) !== null) {
      window.localStorage.removeItem(HERO_SPLINE_LEGACY_KEY);
    }

    const storedValue = window.localStorage.getItem(HERO_SPLINE_STORAGE_KEY);
    const parsedValue = storedValue ? parseInt(storedValue, 10) : Number.NaN;

    if (Number.isInteger(parsedValue) && parsedValue >= 0 && parsedValue < HERO_SPLINE_CYCLE_LENGTH) {
      return parsedValue;
    }

    window.localStorage.setItem(HERO_SPLINE_STORAGE_KEY, String(HERO_SPLINE_DEFAULT_INDEX));
    return HERO_SPLINE_DEFAULT_INDEX;
  } catch (error) {
    console.warn("[HeroSpline] Failed to read stored index", error);
    return HERO_SPLINE_DEFAULT_INDEX;
  }
};

const setStoredHeroSplineIndex = (index: number) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HERO_SPLINE_STORAGE_KEY, String(index));
  } catch (error) {
    console.warn("[HeroSpline] Failed to persist index", error);
  }
};

const sceneFromIndex = (index: number): HeroSplineSceneConfig => {
  if (!HERO_SPLINE_SCHEDULE.length) {
    return HERO_SPLINE_SCENES[0]!;
  }

  const normalizedIndex = index % HERO_SPLINE_CYCLE_LENGTH;
  return HERO_SPLINE_SCHEDULE[normalizedIndex] ?? HERO_SPLINE_SCHEDULE[0]!;
};

const blockStepFromIndex = (index: number): number =>
  (index % HERO_SPLINE_BLOCK_SIZE) + 1;

type HeroSplineResolution = {
  scene: HeroSplineSceneConfig;
  blockStep: number;
};

const resolveHeroSplineScene = (): HeroSplineResolution => {
  if (typeof window === "undefined") {
    return { scene: HERO_SPLINE_SCENES[0]!, blockStep: 1 };
  }

  if (heroSplineResolvedThisLoad && heroSplineCachedResolution) {
    return heroSplineCachedResolution;
  }

  const currentIndex = getStoredHeroSplineIndex();
  const nextIndex = (currentIndex + 1) % HERO_SPLINE_CYCLE_LENGTH;
  setStoredHeroSplineIndex(nextIndex);

  heroSplineResolvedThisLoad = true;
  heroSplineCachedResolution = {
    scene: sceneFromIndex(currentIndex),
    blockStep: blockStepFromIndex(currentIndex),
  };

  return heroSplineCachedResolution;
};

const useHeroSplineSource = () => {
  const [resolution] = useState(() => resolveHeroSplineScene());
  return {
    scene: resolution.scene.id,
    label: resolution.scene.label,
    blockStep: resolution.blockStep,
    source: resolution.scene,
  } as const;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        url: string;
        loading?: "lazy" | "eager";
        "events-target"?: string;
      };
    }
  }
}

// --- CONTEXT INTEGRATION ---
import { useStudio, type Project } from "@/context/StudioContext";
import { useMobileMenu, useServicesModalUI, useUltimatePanelUI } from "@/contexts/UIStateContext";

// --- CRASH TRACKING ---
import { useComponentTracking, useTrackModal } from "@/lib/CrashTracker";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";

// --- EXTERNAL COMPONENTS ---
import ServicesShowcaseModal from "@/components/ui/ServicesShowcaseModal";
import AdminModal from "@/components/AdminModal";
import ReflectiveCard from '@/components/ReflectiveCard';
import HiddenYoutubePlayer from "@/components/Mainpage/HiddenYoutubePlayer";
import { ThemeConfigModal } from "@/components/Mainpage/ThemeConfigModal";
import { ALL_THEMES, type ThemeCategory } from "@/constants/theme-data";
import type { SoundProfile } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";

// UltimateControlPanel - direct import, it handles its own internal mount/unmount
import UltimateControlPanel from "@/components/UltimateControlPanel";

// --- TYPE EXTENSION FOR GRID ---
type GridItem = Project & {
    _source: 'project' | 'service' | 'hero_placeholder';
    uniqueKey: string;
};

type ProjectFormData = {
  title: string;
  thumbnail: string;
  description: string;
  price: string;
  duration: string;
  technique: string;
  link: string;
};

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enhanced device detection hook - includes desktop tier and in-app browser check
const useDeviceInfo = () => {
    const [deviceInfo, setDeviceInfo] = useState({
        isMobile: false,
        isDesktop: true,
        isHighEndDesktop: true,
        isAppleSilicon: false,
        isInAppBrowser: false,
        canHandle3D: true,
    });
    
    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = window.innerWidth < 768;
        const memory = (navigator as any).deviceMemory || 8;
        const cores = navigator.hardwareConcurrency || 4;
        const isMac = /macintosh|mac os x/i.test(ua);
        
        // Check for in-app browsers
        const browserInfo = detectBrowser();
        
        // Detect Apple Silicon
        let isAppleSilicon = false;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                    isAppleSilicon = renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer));
                }
            }
        } catch (e) {}
        
        // Fallback for Macs
        if (isMac && !isAppleSilicon && cores >= 8) {
            isAppleSilicon = true;
        }
        
        // High-end desktop detection
        const isHighEndDesktop = !isMobile && (
            isAppleSilicon ||
            (memory >= 8 && cores >= 4)
        );
        
        setDeviceInfo({
            isMobile,
            isDesktop: !isMobile,
            isHighEndDesktop: browserInfo.isInAppBrowser ? false : isHighEndDesktop,
            isAppleSilicon,
            isInAppBrowser: browserInfo.isInAppBrowser,
            canHandle3D: browserInfo.canHandle3D,
        });
        
        const handleResize = () => {
            setDeviceInfo(prev => ({
                ...prev,
                isMobile: window.innerWidth < 768,
                isDesktop: window.innerWidth >= 768,
            }));
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return deviceInfo;
};

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        setIsMobile(mediaQuery.matches);
        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        } else {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);
    return isMobile;
};

  const useSplineViewerScript = () => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      if (typeof window === "undefined") return;

      if (typeof window !== "undefined" && window.customElements?.get("spline-viewer")) {
        setReady(true);
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>('script[data-spline-viewer]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          setReady(true);
          return;
        }
        const handleExistingLoad = () => setReady(true);
        const handleExistingError = () => setReady(false);
        existing.addEventListener("load", handleExistingLoad);
        existing.addEventListener("error", handleExistingError);
        return () => {
          existing.removeEventListener("load", handleExistingLoad);
          existing.removeEventListener("error", handleExistingError);
        };
      }

      const script = document.createElement("script");
      script.type = "module";
      script.src = SPLINE_VIEWER_SCRIPT_SRC;
      script.async = true;
      script.dataset.splineViewer = "true";

      const handleLoad = () => {
        script.dataset.loaded = "true";
        setReady(true);
      };
      const handleError = () => setReady(false);

      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      document.head.appendChild(script);

      return () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };
    }, []);

    return ready;
  };

// --- 0. CONTACT MODAL COMPONENT ---
const ContactSelectionModal = ({ 
    isOpen, 
    onClose, 
    instagramLink, 
    telegramLink 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    instagramLink: string; 
    telegramLink: string;
}) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    // Don't render during SSR or before mount
    if (!mounted || typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div 
                    key="contact-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" 
                    onClick={onClose}
                >
                    <motion.div 
                        key="contact-modal-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-950 p-8 pt-12 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden"
                        style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.3)', borderWidth: '1px', borderStyle: 'solid' }}
                    >
                        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('/noise.png')]"></div>
                         <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'linear-gradient(to bottom right, rgba(var(--accent-rgb, 59, 130, 246), 0.1), transparent)' }}></div>

                        <button 
                            onClick={onClose} 
                            className="absolute top-3 right-3 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all shadow-lg"
                            style={{ '--hover-border': 'var(--accent-color, #3b82f6)' } as React.CSSProperties}
                            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)')}
                            onMouseOut={(e) => (e.currentTarget.style.borderColor = '')}
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className="text-2xl font-serif font-bold text-center mb-2 z-10 relative theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }}>Choose Platform</h3>
                        <p className="text-center text-neutral-400 text-sm mb-6 z-10 relative">How would you like to connect?</p>

                        <div className="space-y-4 z-10 relative">
                            <a 
                                href={instagramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block w-full overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50"
                                style={{ '--tw-ring-color': 'var(--accent-color, #3b82f6)' } as React.CSSProperties}
                            >
                                <span className="absolute inset-[-1000%] shimmer-conic-border" style={{ background: `conic-gradient(from 90deg at 50% 50%, var(--accent-color, #3b82f6) 0%, rgba(var(--accent-rgb, 59, 130, 246), 0.3) 50%, var(--accent-color, #3b82f6) 100%)` }} />
                                <span className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition-colors group-hover:bg-neutral-900">
                                     <div className="p-2 rounded-full mr-4" style={{ backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)' }}>
                                        <Instagram size={24} className="theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }} />
                                    </div>
                                    <span className="font-bold tracking-wide text-lg theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }}>Instagram</span>
                                </span>
                            </a>

                            <a 
                                href={telegramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block w-full overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50"
                                style={{ '--tw-ring-color': 'var(--accent-color, #3b82f6)' } as React.CSSProperties}
                            >
                                <span className="absolute inset-[-1000%] shimmer-conic-border" style={{ background: `conic-gradient(from 90deg at 50% 50%, var(--accent-color, #3b82f6) 0%, rgba(var(--accent-rgb, 59, 130, 246), 0.3) 50%, var(--accent-color, #3b82f6) 100%)` }} />
                                <span className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition-colors group-hover:bg-neutral-900">
                                    <div className="p-2 rounded-full mr-4" style={{ backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)' }}>
                                        <Send size={24} className="theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }} />
                                    </div>
                                    <span className="font-bold tracking-wide text-lg theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }}>Telegram</span>
                                </span>
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

// --- 2. PRODUCT CARD ---
const ProductCard = React.memo(({
  project,
  uniqueLayoutId, 
  translate,
  setActive,
  isMobile
}: {
  project: GridItem;
  uniqueLayoutId: string;
  translate: MotionValue<number>;
  setActive: (project: GridItem, layoutId: string) => void; 
  isMobile: boolean;
}) => {
  const willChange = useWillChange();
  return (
    <motion.div
      style={{ x: translate, willChange }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActive(project, uniqueLayoutId)} 
      className="group/product h-[20rem] w-[18rem] md:h-[30rem] md:w-[28rem] relative flex-shrink-0 cursor-pointer backface-hidden transform-gpu"
    >
      <div className="block h-full w-full group-hover/product:shadow-2xl transition-all duration-500 rounded-xl safari-fix-layer">
        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-full w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 safari-mask-fix"
        >
            <Image
                src={project.thumbnail}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center absolute h-full w-full inset-0 transition-transform duration-700 group-hover/product:scale-110 opacity-80 group-hover/product:opacity-100"
                alt={project.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/product:opacity-90 transition-opacity duration-500" />
            <div className="absolute bottom-6 left-6 translate-y-2 group-hover/product:translate-y-0 transition-transform duration-500 w-[90%]">
                <h2 className="text-white font-serif tracking-wide text-xl md:text-2xl drop-shadow-md truncate">
                   {project.title}
                </h2>
                {project.price && (
                    <p className="font-bold text-sm mt-1 flex items-center gap-2 theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }}>
                        {project.price} 
                        {project.duration && (
                            <>
                                <span className="w-1 h-1 bg-white rounded-full"></span> 
                                {project.duration}
                            </>
                        )}
                    </p>
                )}
                {project._source === 'service' && (
                    <span className="absolute -top-10 right-0 bg-white/10 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">Serviço</span>
                )}
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

const SplineSceneEmbed = React.memo(({ preferViewer, runtimeUrl, viewerUrl }: { preferViewer: boolean; runtimeUrl: string; viewerUrl: string }) => {
  const viewerReady = useSplineViewerScript();
  const [forceIframeFallback, setForceIframeFallback] = useState(false);

  useEffect(() => {
    setForceIframeFallback(false);
  }, [runtimeUrl]);

  useEffect(() => {
    if (!preferViewer || typeof window === "undefined") return;

    const handleViewerError = (event: ErrorEvent) => {
      const message = event?.message || "";
      const source = event?.filename || "";
      if (message.includes("Data read, but end of buffer not reached") && source.includes("@splinetool/viewer")) {
        console.warn("[HeroSpline] Viewer parsing failed, falling back to iframe for", runtimeUrl);
        setForceIframeFallback(true);
      }
    };

    window.addEventListener("error", handleViewerError);
    return () => window.removeEventListener("error", handleViewerError);
  }, [preferViewer, runtimeUrl]);

  const shouldUseViewer = preferViewer && viewerReady && !forceIframeFallback;

  return (
    <div className="relative w-full h-full" aria-label="BullMoney hero spline">
      <div className="absolute inset-0 w-full h-full">
        {shouldUseViewer ? (
          <spline-viewer
            url={runtimeUrl}
            loading="lazy"
            data-testid="hero-spline-viewer"
            events-target="global"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "transparent",
            }}
          />
        ) : (
          <iframe
            src={viewerUrl}
            title="BullMoney hero scene"
            frameBorder="0"
            allow="fullscreen; autoplay; xr-spatial-tracking"
            loading="lazy"
            className="w-full h-full border-0"
            data-testid="hero-spline-iframe"
          />
        )}
      </div>
    </div>
  );
});
SplineSceneEmbed.displayName = "SplineSceneEmbed";

// --- 3. MAIN HERO PARALLAX ---
const HeroParallax = () => {
  const { 
    state, 
    updateProject, 
    deleteProject, 
    updateServiceItem, 
    deleteServiceItem, 
    uploadFile 
  } = useStudio();
  
  const { projects, serviceItems, hero, loading, isAuthenticated, isAdmin } = state;
  
  const isMobile = useIsMobile();
  const { isMobileMenuOpen } = useMobileMenu();
  const willChange = useWillChange();

  const buttonText = hero?.button_text || "View Trading Setups";
  const {
    scene: heroSplineScene,
    label: heroSplineSceneLabel,
    source: heroSplineSource,
    blockStep: heroSplineBlockStep,
  } = useHeroSplineSource();
  const showReloadCue = heroSplineBlockStep >= 2 && heroSplineBlockStep <= HERO_SPLINE_BLOCK_SIZE;

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[HeroSpline] Active hero scene: ${heroSplineSceneLabel} (${heroSplineScene})`);
    }
  }, [heroSplineScene, heroSplineSceneLabel]);

  // Global Theme Context - syncs across entire app
  const { activeThemeId, setTheme, accentColor } = useGlobalTheme();
  
  // Local UI state for theme modal
  const [activeCategory, setActiveCategory] = useState<'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC' | 'LOCATION' | 'ELEMENTAL' | 'CONCEPTS' | 'MEME' | 'SEASONAL'>('SPECIAL');
  const [currentSound, setCurrentSound] = useState<SoundProfile>('MECHANICAL');
  const [isMuted, setIsMuted] = useState(false);
  const [hoverThemeId, setHoverThemeId] = useState<string | null>(null);

  // Audio engine
  const audioProfile = currentSound === 'MECHANICAL' || currentSound === 'SOROS' || currentSound === 'SCI-FI' || currentSound === 'SILENT'
    ? currentSound
    : 'MECHANICAL';
  const sfx = useAudioEngine(!isMuted, audioProfile);

  const [isUcpOpen, setIsUcpOpenLocal] = useState(false);
  // Use UIState context for mutual exclusion - panel auto-hides when other components open
  const { shouldHide: shouldHideUcp, setUltimatePanelOpen } = useUltimatePanelUI();
  const [isReflectiveCardOpen, setIsReflectiveCardOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Wrapped setIsUcpOpen that notifies context for mutual exclusion
  const setIsUcpOpen = useCallback((open: boolean) => {
    setIsUcpOpenLocal(open);
    // Notify context when UCP opens (closes other components)
    if (open) {
      setUltimatePanelOpen(true);
    }
  }, [setUltimatePanelOpen]);

  // Auto-close UCP when other UI components open (mobile menu, modals, etc.)
  useEffect(() => {
    if (shouldHideUcp && isUcpOpen) {
      setIsUcpOpenLocal(false);
    }
  }, [shouldHideUcp, isUcpOpen]);

  // Load saved sound preferences from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem('bullmoney_sound_profile') as SoundProfile | null;
    const savedMuted = localStorage.getItem('bullmoney_muted');
    if (savedSound) setCurrentSound(savedSound);
    if (savedMuted === 'true') setIsMuted(true);
  }, []);

  const currentTheme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  const displayTheme = hoverThemeId ? ALL_THEMES.find(t => t.id === hoverThemeId) : currentTheme;
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  
  // MOBILE CRASH FIX: State for mobile-safe Spline settings
  const [splineSettings, setSplineSettings] = useState({
    targetFPS: 60,
    maxDpr: 1.5,
    minDpr: 0.5,
    shouldRender: true,
  });

  // Track viewport size and set mobile-safe Spline settings
  useEffect(() => {
    const calcSize = () => {
      // Use visualViewport for in-app browsers (Instagram, TikTok, etc.)
      const vv = window.visualViewport;
      const w = vv?.width || window.innerWidth;
      const h = vv?.height || window.innerHeight;
      const isBigDevice = w >= 1440;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      const isMobileDevice = /iphone|ipad|ipod|android|mobile/i.test(ua);
      const isInAppBrowser = /instagram|fban|fbav|twitter|tiktok|snapchat|linkedin|wechat|line|kakaotalk/i.test(ua);
      const memory = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || 4 : 4;
      const isLowEndMobile = isMobileDevice && (memory < 3 || w < 375);
      
      // IN-APP BROWSER FIX: Use full viewport dimensions
      // In-app browsers often report wrong dimensions, so use 100% of available space
      const mobileWidth = isInAppBrowser ? w : Math.min(w, 768);
      const mobileHeight = isInAppBrowser ? h : Math.min(h * 0.85, 700);
      
      setHeroSize({
        // FIXED: Full width/height for mobile and in-app browsers
        width: Math.max(320, isMobileDevice ? mobileWidth : (isBigDevice ? Math.min(w, 2560) : Math.min(w, 1600))),
        height: Math.max(400, isMobileDevice ? mobileHeight : (isBigDevice ? Math.min(h * 0.9, 1200) : Math.min(h * 0.95, 1000))),
      });
      
      // MOBILE CRASH FIX: Set conservative settings for mobile
      setSplineSettings({
        targetFPS: isLowEndMobile ? 24 : (isMobileDevice ? 30 : 60),
        maxDpr: isLowEndMobile ? 0.75 : (isMobileDevice ? 1.0 : 1.5),
        minDpr: isLowEndMobile ? 0.5 : 0.5,
        shouldRender: !isLowEndMobile || memory >= 2, // Only disable on very low-end devices
      });
    };
    calcSize();
    window.addEventListener('resize', calcSize);
    return () => window.removeEventListener('resize', calcSize);
  }, []);

  const parallaxItems = useMemo(() => {
    const formattedProjects: GridItem[] = projects.map((p: Project) => ({
        ...p,
        _source: 'project' as const,
        uniqueKey: `proj-${p.id}`
    }));

    const heroImages = hero?.hero_images || [];
    const formattedServices: GridItem[] = serviceItems.map((s: any, index: number) => {
        const serviceData = s as any;
        const specificImage = serviceData.image_url || serviceData.thumbnail;
        const hasSpecificImage = specificImage && typeof specificImage === 'string' && specificImage.trim() !== "";
        const displayImg = hasSpecificImage
            ? specificImage
            : (heroImages.length > 0
                ? heroImages[index % heroImages.length]
                : "https://via.placeholder.com/800x1000/000000/10b981?text=BullMoney");

        return {
            id: s.id, 
            title: s.name,
            thumbnail: displayImg,
            description: s.detail_includes || "Professional Trading Service",
            price: s.price,
            duration: s.detail_time,
            technique: s.detail_type || "Service",
            link: null,
            _source: 'service' as const,
            uniqueKey: `serv-${s.id}`
        };
    });

    const formattedHeroImages: GridItem[] = heroImages.map((img: string, i: number) => ({
        id: -1 * (i + 1),
        title: `Trading Setup ${i + 1}`,
        thumbnail: img,
        description: "Exclusive BullMoney trading setup with entry, exit, and risk management.",
        price: null,
        duration: null,
        technique: null,
        link: null,
        _source: 'hero_placeholder' as const,
        uniqueKey: `hero-${i}`
    }));

    let combinedItems = [...formattedProjects, ...formattedServices];
    if (combinedItems.length < 6) {
        combinedItems = [...combinedItems, ...formattedHeroImages];
    }
    if (combinedItems.length === 0) return [];

    let filledProjects = [...combinedItems];
    const limit = isMobile ? 6 : 15;
    while (filledProjects.length < limit) {
      filledProjects = [...filledProjects, ...combinedItems];
    }
    
    return filledProjects.slice(0, limit).map((p, i) => ({
      ...p,
      uniqueKey: `${p.uniqueKey}-copy-${i}`,
    }));
  }, [projects, serviceItems, hero, isMobile]);

  const ref = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? 100 : 600]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? -100 : -600]), springConfig);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<GridItem | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const quickEditFileInputRef = useRef<HTMLInputElement>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { isOpen: isServicesModalOpen, setIsOpen: setIsServicesModalOpen } = useServicesModalUI();

  const [editForm, setEditForm] = useState<ProjectFormData>({
    title: "",
    thumbnail: "",
    description: "",
    price: "",
    duration: "",
    technique: "",
    link: ""
  });

  const handleOpen = useCallback((project: GridItem, layoutId: string) => {
    setActiveProject(project);
    setActiveLayoutId(layoutId); 
    setEditForm({
      title: project.title,
      thumbnail: project.thumbnail,
      description: project.description || "",
      price: project.price || "",
      duration: project.duration || "",
      technique: project.technique || "",
      link: project.link || ""
    });
    setIsEditing(false);
  }, []);

  const handleClose = useCallback(() => {
    setActiveProject(null);
    setActiveLayoutId(null);
    setIsEditing(false);
  }, []);

  const sanitizeData = (form: ProjectFormData) => {
      return {
          ...form,
          description: form.description === "" ? null : form.description,
          price: form.price === "" ? null : form.price,
          duration: form.duration === "" ? null : form.duration,
          technique: form.technique === "" ? null : form.technique,
          link: form.link === "" ? null : form.link,
      };
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if(!activeProject) return;

    if(activeProject._source === 'hero_placeholder') {
        alert("This is a placeholder image. Manage it in the Hero Settings.");
        return;
    }

    setIsSaving(true);
    try {
      const sanitizedForm = sanitizeData(editForm);

      if (activeProject._source === 'project') {
         await updateProject(activeProject.id, sanitizedForm);
      } else if (activeProject._source === 'service') {
         await updateServiceItem(activeProject.id, {
            name: sanitizedForm.title || "", 
            price: sanitizedForm.price || "", 
            detail_time: sanitizedForm.duration,      
            detail_type: sanitizedForm.technique,     
            detail_includes: sanitizedForm.description, 
            image_url: sanitizedForm.thumbnail 
         } as any);
      }

      setActiveProject(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!activeProject) return;
    
    if(activeProject._source === 'hero_placeholder') {
        alert("Delete this image in the Hero Settings.");
        return;
    }

    if(window.confirm("Are you sure? This cannot be undone.")) {
      setIsSaving(true);
      try {
        if (activeProject._source === 'project') {
            await deleteProject(activeProject.id);
        } else if (activeProject._source === 'service') {
            await deleteServiceItem(activeProject.id);
        }
        handleClose();
      } catch (error: any) {
         console.error("Error deleting:", error);
         alert(`Failed to delete: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    }
  }

  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploadingImage(true);
    const file = e.target.files[0];

    try {
      const { url, error } = await uploadFile(file);
      if (error) {
        alert("Upload failed: " + error);
      } else if (url) {
        setEditForm(prev => ({ ...prev, thumbnail: url }));
      }
    } catch (err) {
      alert("Unexpected error during upload.");
    } finally {
      setIsUploadingImage(false);
      if (quickEditFileInputRef.current) quickEditFileInputRef.current.value = ""; 
    }
  };

  useEffect(() => {
    // Only disable scroll on mobile/tablet when a modal is open
    // On desktop, keep scroll enabled so user can see content behind modal
    const isMobileViewport = window.innerWidth < 768;
    if (isMobileViewport && (activeProject || isAdminOpen || isContactModalOpen || isServicesModalOpen || isThemeModalOpen)) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; }
  }, [activeProject, isAdminOpen, isContactModalOpen, isServicesModalOpen, isThemeModalOpen]);

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-neutral-950" style={{ color: 'var(--accent-color, #3b82f6)' }}>
              <Loader2 className="animate-spin w-10 h-10 theme-accent" />
          </div>
      )
  }

  const canEdit = isAdmin && activeProject?._source !== 'hero_placeholder';

  return (
    <>
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .animate-shimmer { animation: shimmer 3s linear infinite; }
      .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
      .transform-gpu { transform: translate3d(0,0,0); -webkit-transform: translate3d(0,0,0); }
      .safari-mask-fix { -webkit-mask-image: -webkit-radial-gradient(white, black); mask-image: radial-gradient(white, black); isolation: isolate; }
      .safari-fix-layer { transform: translateZ(0); -webkit-transform: translateZ(0); }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--accent-color, #3b82f6); border-radius: 3px; }
    `}</style>

    {isAdmin && <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />}

    <ContactSelectionModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        instagramLink="https://www.instagram.com/bullmoney.online/"
        telegramLink="https://t.me/addlist/gg09afc4lp45YjQ0"
    />

    {/* Services Modal - Controlled externally */}
    <ServicesShowcaseModal
      btnText={buttonText}
      isOpen={isServicesModalOpen}
      onOpenChange={setIsServicesModalOpen}
      showTrigger={false}
    />

    {/* UltimateControlPanel - Always mounted, internal content mounts/unmounts based on isOpen */}
    <UltimateControlPanel 
      isOpen={isUcpOpen && !shouldHideUcp} 
      onOpenChange={setIsUcpOpen}
      onServicesClick={() => setIsServicesModalOpen(true)}
      onContactClick={() => setIsContactModalOpen(true)}
      onThemeClick={() => setIsThemeModalOpen(true)}
      onAdminClick={() => setIsAdminOpen(true)}
      onIdentityClick={() => setIsReflectiveCardOpen(true)}
      isAdmin={isAdmin}
      isAuthenticated={isAuthenticated}
    />

    {/* Theme Configuration Modal */}
    <ThemeConfigModal
      isOpen={isThemeModalOpen}
      onClose={() => setIsThemeModalOpen(false)}
      onSave={(themeId, sound, muted) => {
        // Use global theme context - applies CSS overlay across entire app
        setTheme(themeId);
        setCurrentSound(sound);
        setIsMuted(muted);
        
        // Get full theme data for comprehensive storage
        const selectedTheme = ALL_THEMES.find(t => t.id === themeId);
        
        // Persist sound preferences locally
        localStorage.setItem('bullmoney_sound_profile', sound);
        localStorage.setItem('bullmoney_muted', String(muted));
        
        // Save comprehensive theme settings as JSON for CSS overlay persistence
        if (selectedTheme) {
          const themeSettings = {
            id: themeId,
            name: selectedTheme.name,
            category: selectedTheme.category,
            accentColor: selectedTheme.accentColor,
            filter: selectedTheme.filter,
            mobileFilter: selectedTheme.mobileFilter,
            illusion: selectedTheme.illusion,
            overlay: selectedTheme.overlay,
            bgImage: selectedTheme.bgImage,
            bgBlendMode: selectedTheme.bgBlendMode,
            bgOpacity: selectedTheme.bgOpacity,
            youtubeId: selectedTheme.youtubeId,
            soundProfile: sound,
            isMuted: muted,
            savedAt: Date.now()
          };
          localStorage.setItem('bullmoney_theme_settings', JSON.stringify(themeSettings));
          
          // Dispatch event so other components can react
          window.dispatchEvent(new CustomEvent('bullmoney-theme-saved', { 
            detail: themeSettings 
          }));
        }
      }}
      initialThemeId={activeThemeId}
      initialCategory={activeCategory}
      initialSound={currentSound}
      initialMuted={isMuted}
      isMobile={isMobile}
    />
    
    {displayTheme?.youtubeId && (
      <HiddenYoutubePlayer
        videoId={displayTheme.youtubeId}
        isPlaying={!isMuted}
        volume={isMuted ? 0 : 15}
      />
    )}
    
    <AnimatePresence>
        {isReflectiveCardOpen && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[999] grid place-items-center bg-black/80"
                onClick={() => setIsReflectiveCardOpen(false)}
            >
                <div onClick={(e) => e.stopPropagation()}>
                    <ReflectiveCard onVerificationComplete={() => {
                        setTimeout(() => setIsReflectiveCardOpen(false), 2000);
                    }} />
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    <AnimatePresence>
      {activeProject && activeLayoutId && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] grid place-items-center bg-black/90 md:backdrop-blur-xl p-0 md:p-4 will-change-opacity"
            onClick={handleClose}
        >
          <motion.div
            layoutId={activeLayoutId} 
            className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:h-[85vh] md:max-h-[800px] safari-fix-layer"
            onClick={(e) => e.stopPropagation()} 
          >
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur border border-white/10 rounded-full text-white hover:bg-white hover:text-black transition-colors"
            >
                <X size={20} />
            </button>

            {canEdit && !isEditing && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="absolute top-4 left-4 md:left-auto md:right-16 z-50 p-2 rounded-full text-black transition-colors shadow-lg flex gap-2 items-center px-4 font-bold text-xs theme-accent-bg"
                style={{ backgroundColor: 'var(--accent-color, #3b82f6)' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                  <Edit2 size={14} /> Edit {activeProject._source === 'service' ? 'Service' : 'Look'}
              </button>
            )}

            <div className="w-full md:w-3/5 h-[40vh] md:h-full relative bg-neutral-200 dark:bg-neutral-800 group/image">
                 <Image
                    src={isEditing ? editForm.thumbnail : activeProject.thumbnail}
                    fill
                    priority={true}
                    className="object-cover"
                    alt={activeProject.title}
                />
                 {isEditing && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); !isUploadingImage && quickEditFileInputRef.current?.click(); }}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/70 transition-colors z-20"
                  >
                    {isUploadingImage ? (
                        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                      ) : (
                        <>
                          <Upload className="text-blue-500 w-8 h-8 mb-2" />
                          <p className="text-white text-xs font-bold uppercase tracking-widest">Click to Change Image</p>
                        </>
                      )}
                  </div>
                )}
                <input type="file" ref={quickEditFileInputRef} className="hidden" accept="image/*" onChange={handleQuickImageUpload} />
                
                {!isEditing && activeProject._source === 'service' && (
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-[10px] uppercase font-bold tracking-widest border border-white/20">
                        Service Info
                    </div>
                )}
                
                {!isEditing && <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80 md:hidden" />}
                {!isEditing && (
                    <div className="absolute bottom-4 left-4 md:hidden">
                         <h3 className="text-3xl font-serif font-bold text-white">{activeProject.title}</h3>
                    </div>
                )}
            </div>

            <div className="w-full md:w-2/5 p-6 md:p-12 flex flex-col overflow-y-auto bg-white dark:bg-neutral-900 custom-scrollbar relative">
                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in duration-300 pb-20" onClick={(e) => e.stopPropagation()}>
                      
                      <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl">
                          <div>
                             <label className="text-[10px] uppercase text-neutral-500 font-bold">Title / Name</label>
                             <input 
                              value={editForm.title} 
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              className="w-full bg-transparent p-2 border-b border-neutral-300 dark:border-neutral-700 outline-none text-neutral-900 dark:text-white text-base md:text-sm"
                              style={{ '--focus-border': 'var(--accent-color, #3b82f6)' } as React.CSSProperties}
                              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)')}
                              onBlur={(e) => (e.currentTarget.style.borderColor = '')}
                            />
                          </div>
                          <div className="mt-4">
                             <label className="text-[10px] uppercase text-neutral-500 font-bold">Description / Includes</label>
                             <textarea 
                              rows={5}
                              value={editForm.description || ""} 
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              className="w-full bg-transparent p-2 border-b border-neutral-300 dark:border-neutral-700 outline-none text-neutral-900 dark:text-white resize-none text-base md:text-sm"
                              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)')}
                              onBlur={(e) => (e.currentTarget.style.borderColor = '')}
                            />
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase text-neutral-500 font-bold">Price</label>
                          <input 
                            value={editForm.price || ""} 
                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg outline-none border border-transparent text-base md:text-sm"
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-neutral-500 font-bold">Duration</label>
                          <input 
                            value={editForm.duration || ""} 
                            onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg outline-none border border-transparent text-base md:text-sm"
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] uppercase text-neutral-500 font-bold">Technique / Type</label>
                        <input 
                            value={editForm.technique || ""} 
                            onChange={(e) => setEditForm({...editForm, technique: e.target.value})}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg outline-none border border-transparent text-base md:text-sm"
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                        />
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4 md:relative fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-900 p-4 md:p-0 z-50 md:z-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
                        <button 
                          onClick={handleSaveEdit} 
                          disabled={isSaving || isUploadingImage}
                          className="flex-1 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 theme-accent-bg"
                          style={{ backgroundColor: 'var(--accent-color, #3b82f6)' }}
                        >
                          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} /> Save</>}
                        </button>
                        <button 
                          onClick={handleDelete}
                          disabled={isSaving}
                          className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-3 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                          className="text-neutral-500 hover:text-black dark:hover:text-white text-xs px-2"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="h-20 md:hidden"></div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:block"
                    >
                         <h3 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 dark:text-white mb-2 leading-tight">
                            {activeProject.title}
                        </h3>
                         <div className="h-1 w-20 mb-6 theme-accent-bg" style={{ backgroundColor: 'var(--accent-color, #3b82f6)' }} />
                    </motion.div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm md:text-base leading-relaxed whitespace-pre-line flex-grow"
                    >
                        {activeProject.description || "Professional trading setup with detailed entry points, stop loss, take profit levels, and risk management strategy tailored for maximum profitability."}
                    </motion.div>
                    
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4 mb-10 bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-xl border border-neutral-100 dark:border-neutral-800"
                    >
                        {activeProject.duration && (
                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3 last:border-b-0">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Duration</span>
                                <span className="text-sm dark:text-neutral-200 font-mono">{activeProject.duration}</span>
                            </div>
                        )}
                        {activeProject.technique && (
                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3 last:border-b-0">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Technique</span>
                                <span className="text-sm dark:text-neutral-200 font-mono">{activeProject.technique}</span>
                            </div>
                        )}
                        {activeProject.price && (
                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3 last:border-b-0">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Investment</span>
                                <span className="text-xl font-bold theme-accent" style={{ color: 'var(--accent-color, #3b82f6)' }}>{activeProject.price}</span>
                            </div>
                        )}
                    </motion.div>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                        Get This Trading Setup
                    </motion.button>
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div
        ref={ref}
        className="h-screen pt-10 pb-0 antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d] hero"
        style={{ 
          contain: typeof window !== 'undefined' && window.innerWidth >= 1440 ? 'layout style' : 'layout', 
          touchAction: 'pan-y',
          minHeight: typeof window !== 'undefined' && window.innerWidth >= 1440 ? 'calc(100vh - 80px)' : '100dvh',
          height: typeof window !== 'undefined' && window.innerWidth >= 1440 ? 'auto' : '100vh',
        }}
        data-allow-scroll
        data-content
        data-theme-aware
        data-hero
    >
        {/* CLS FIX: Hero Spline wrapper with fixed dimensions */}
        <div 
          className="absolute inset-0 w-full h-full z-0 hero-spline-wrapper"
          style={{ 
            contain: 'strict',
            isolation: 'isolate',
            touchAction: 'pan-y',
            minHeight: '100dvh',
            pointerEvents: 'auto',
          }}
          data-allow-scroll
        >
          <div 
            className="w-full h-full relative"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              contain: 'strict',
              touchAction: 'pan-y',
              minHeight: '100dvh',
              pointerEvents: 'auto',
            }}
          >
            <AnimatePresence mode="popLayout">
              {showReloadCue && (
                <motion.div
                  key={`hero-reload-cue-${heroSplineScene}-${heroSplineBlockStep}`}
                  initial={{ opacity: 0, y: -12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.95 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="pointer-events-none absolute top-6 right-6 z-30"
                >
                  <motion.div
                    animate={{ opacity: [0.8, 1, 0.8], scale: [0.98, 1, 0.98] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="rounded-full px-4 py-2 bg-black/70 backdrop-blur border border-white/10 text-white text-xs md:text-sm font-semibold tracking-wide shadow-lg flex items-center gap-2"
                  >
                    <span aria-hidden="true">↻</span>
                    Reloading changes Spline scenes
                    <span className="text-[10px] text-white/70">{heroSplineBlockStep}/{HERO_SPLINE_BLOCK_SIZE}</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-full h-full flex items-center justify-center">
              {/* CLS FIX: Fixed dimensions prevent layout shift */}
              <div
                className="w-full h-full spline-container"
                data-spline-scene
                style={{
                  width: heroSize.width > 0 ? `${heroSize.width}px` : '100%',
                  height: heroSize.height > 0 ? `${heroSize.height}px` : '100%',
                  maxWidth: '100vw',
                  maxHeight: '100dvh', // Dynamic viewport height for in-app browsers
                  minWidth: 320,
                  minHeight: 400,
                  contain: 'layout style',
                  touchAction: 'pan-y',
                  pointerEvents: 'auto',
                  // In-app browser fix: ensure full coverage
                  aspectRatio: 'unset',
                }}
              >
                {/* MOBILE-SAFE HERO EMBED: Prefer custom viewer when possible, fallback to iframe everywhere else */}
                {splineSettings.shouldRender ? (
                  <SplineSceneEmbed
                    key={heroSplineScene}
                    preferViewer={heroSplineSource.preferViewer !== false}
                    runtimeUrl={heroSplineSource.runtimeUrl}
                    viewerUrl={heroSplineSource.viewerUrl}
                  />
                ) : (
                  // Fallback for very low-end devices
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🐂</div>
                      <div className="text-white/60 text-sm">BullMoney</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl relative mx-auto pt-32 pb-12 md:py-32 px-4 w-full z-20 mb-10 md:mb-32">
            
            {/* SwipableButtons (Actions Panel) REMOVED here */}
            
        </div>
    </div>

    <div ref={containerRef} className="absolute bottom-0 w-full h-px" />
    </>
  );
};

export default HeroParallax;
