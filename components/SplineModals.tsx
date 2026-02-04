"use client";

import { Suspense, useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  ShimmerBorder,
  ShimmerLine,
} from "@/components/ui/UnifiedShimmer";

const SplineSkeleton = dynamic(
  () => import("@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.SplineSkeleton })),
  { ssr: true }
);

const DraggableSplit = dynamic(
  () => import('@/components/DraggableSplit'),
  { ssr: true }
);

const Orb = dynamic(
  () => import('@/components/Orb'),
  { ssr: false }
);

// Type definitions
export type RemoteSplineMeta = {
  id: string;
  title: string;
  subtitle?: string;
  viewer: string;
  runtime: string;
  accent?: string;
  badge?: string;
  aspectRatio?: string;
};

// Constants
export const DRAGGABLE_SPLIT_SCENES: Record<'glassCurtain' | 'orbScroll', RemoteSplineMeta> = {
  glassCurtain: {
    id: 'glassCurtain',
    runtime: "https://prod.spline.design/pERFMZP1PEeizk2N/scene.splinecode",
    viewer: "https://my.spline.design/glasscurtain-a6oJvU7009VpSevqPvEeVyI7/",
    title: "Market Depth Analyzer",
    subtitle: "Dual-chart order book monitoring",
    accent: '#ffffff',
    aspectRatio: '4 / 3'
  },
  orbScroll: {
    id: 'orbScroll',
    runtime: "https://prod.spline.design/QfpAnXg8I-cL9KnC/scene.splinecode",
    viewer: "https://my.spline.design/orbscrolltriggerforhero-cukhAyxazfE0BSBUcFrD8NBf/",
    title: "Price Action Indicator",
    subtitle: "Real-time volatility tracking",
    accent: '#ffffff',
    aspectRatio: '4 / 3'
  }
};

export const ADDITIONAL_SPLINE_PAGES: RemoteSplineMeta[] = [
  {
    id: 'followers-focus',
    title: 'Liquidity Scanner',
    subtitle: 'Live trading signal detection network',
    viewer: 'https://my.spline.design/100followersfocus-55tpQJYDbng5lAQ3P1tq5abx/',
    runtime: 'https://prod.spline.design/IomoYEa50DmuiTXE/scene.splinecode',
    accent: '#ffffff',
    badge: 'Live Trading',
    aspectRatio: '16 / 9'
  },
  {
    id: 'loading-bar-vertical',
    title: 'Portfolio Progress Tracker',
    subtitle: 'Vertical growth momentum visualization',
    viewer: 'https://my.spline.design/theloadingbarvertical-J0jRfhBsRDUAUKzNRxMvZXak/',
    runtime: 'https://prod.spline.design/TOPNo0pcBjY8u6Ls/scene.splinecode',
    accent: '#ffffff',
    badge: 'Portfolio',
    aspectRatio: '9 / 16'
  },
  {
    id: 'cannon-lab',
    title: 'Launch Momentum Engine',
    subtitle: 'Breakout detection and entry signals',
    viewer: 'https://my.spline.design/cannon-vOk1Cc5VyFBvcSq1ozXuhK1n/',
    runtime: 'https://prod.spline.design/C0mBZel0m7zXQaoD/scene.splinecode',
    accent: '#ffffff',
    badge: 'Advanced',
    aspectRatio: '16 / 9'
  },
  {
    id: 'x-gamer',
    title: 'Trading Arena Dashboard',
    subtitle: 'Multi-asset performance battle station',
    viewer: 'https://my.spline.design/xgamer-RZ9X6L57SHESs7L04p6IDisA/',
    runtime: 'https://prod.spline.design/1HGlyIYtYszh-B-r/scene.splinecode',
    accent: '#ffffff',
    badge: 'Competitive',
    aspectRatio: '16 / 9'
  }
];

export const R4X_BOT_SCENE: RemoteSplineMeta = {
  id: 'r4x-bot',
  title: '',
  subtitle: '',
  viewer: 'https://my.spline.design/r4xbot-2RZeOpfgJ0Vr36G9Jd9EHlFB/',
  runtime: 'https://prod.spline.design/G3yn-KsfkIAbK2Mz/scene.splinecode',
  accent: '#ffffff',
  badge: 'AI Trading',
  aspectRatio: '16 / 9'
};

export const ALL_REMOTE_SPLINES: RemoteSplineMeta[] = [
  ...(Object.values(DRAGGABLE_SPLIT_SCENES) as RemoteSplineMeta[]),
  ...ADDITIONAL_SPLINE_PAGES,
  R4X_BOT_SCENE,
];

// Orb with button to launch all 5 spline scenes
export function OrbSplineLauncher({ 
  onOpenScenes 
}: { 
  onOpenScenes: () => void;
}) {
  return (
    <div className="relative w-full min-h-screen bg-black" style={{ height: '100vh', backgroundColor: '#000000' }}>
      {/* Interactive Orb Background */}
      <div className="absolute inset-0">
        <Orb
          hoverIntensity={2}
          rotateOnHover
          hue={0}
          forceHoverState={false}
          backgroundColor="#000000"
        />
      </div>
      
      {/* Centered Title and Button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        {/* Title */}
        <div className="text-center px-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight glass-text">
            3D TRADING EXPERIENCES
          </h2>
          <p className="text-sm mt-4 glass-text-gray max-w-2xl mx-auto">Interactive 3D scenes with trading-inspired visuals. Built with Spline for fun exploration.</p>
          <div className="flex justify-center mt-4">
            <div className="w-24 h-[2px] glass-border" />
          </div>
        </div>
        
        {/* Button */}
        <button
          onClick={onOpenScenes}
          className="pointer-events-auto group relative px-8 py-4 rounded-full font-bold text-black bg-white
            shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)]
            hover:scale-105 active:scale-95
            transition-all duration-300 cursor-pointer
            border border-white/50 hover:border-white"
        >
          <span className="flex items-center gap-3 text-lg">
            <span>Explore 3D Scenes</span>
            <span className="text-sm opacity-70">(5)</span>
          </span>
        </button>
      </div>
    </div>
  );
}

// Multi-scene modal for viewing all 5 spline scenes
export function AllScenesModal({ 
  open, 
  onClose,
  onSelectScene 
}: { 
  open: boolean; 
  onClose: () => void;
  onSelectScene: (scene: RemoteSplineMeta) => void;
}) {
  const [portalNode, setPortalNode] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalNode(document.body);
    }
  }, []);

  if (!open || !portalNode) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl"
        style={{
          background: 'rgba(10, 10, 12, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-6 border-b border-white/10 bg-black/80 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-white/50">3D Experiences</p>
            <h3 className="text-2xl font-bold mt-1 text-white">Interactive Spline Scenes</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-3 bg-white/5 hover:bg-white/10 transition-all hover:scale-110"
            aria-label="Close"
          >
            <span className="text-white text-lg">✕</span>
          </button>
        </div>

        {/* Grid of scenes */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADDITIONAL_SPLINE_PAGES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                onSelectScene(scene);
                onClose();
              }}
              className="group relative rounded-2xl p-5 text-left overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-white/40 mb-2">
                <span>▪</span>
                <span>{scene.id}</span>
                {scene.badge && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/70">
                    {scene.badge}
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-white mb-1">{scene.title}</h4>
              {scene.subtitle && (
                <p className="text-sm text-white/50">{scene.subtitle}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                <span>Open</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    portalNode
  );
}

// Components
function RemoteSplineFrame({ viewerSrc, sceneSrc, title }: { viewerSrc: string; sceneSrc: string; title: string }) {
  const [useFallback] = useState(false);

  if (useFallback) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-white/50">Scene unavailable</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black overflow-hidden rounded-lg">
      <iframe
        src={viewerSrc}
        title={title}
        loading="lazy"
        allow="fullscreen; autoplay; xr-spatial-tracking"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0 bg-black"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          transform: "scale(0.94)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}

export function RemoteSplineShowcase({ scene, onOpen }: { scene: RemoteSplineMeta; onOpen: (scene: RemoteSplineMeta) => void }) {
  return (
    <div
      className="group relative rounded-3xl p-6 md:p-8 flex flex-col gap-4 overflow-hidden cursor-pointer glass-card transition-all duration-300 hover:scale-[1.02]"
      onClick={() => onOpen(scene)}
    >
      <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-bold">
        <span className="glass-text-gray">▪</span>
        <span className="glass-text-gray">{scene.id}</span>
        {scene.badge && (
          <span
            className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold glass-card"
          >
            <span className="glass-text">{scene.badge}</span>
          </span>
        )}
      </div>
      <div>
        <h3 className="text-xl md:text-2xl font-bold glass-text">
          {scene.title}
        </h3>
        {scene.subtitle && (
          <p className="text-sm mt-2 glass-text-gray">
            {scene.subtitle}
          </p>
        )}
      </div>
      <div className="flex-1" />
      <button
        onClick={() => onOpen(scene)}
        className="relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold glass-button transition-all duration-300"
      >
        <span>Launch Scene</span>
        <span>→</span>
      </button>
    </div>
  );
}

export function DraggableSplitExperience({ style }: { style?: CSSProperties } = {}) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden spline-container"
      style={{
        height: '800px',
        minHeight: '500px',
        contain: 'strict',
        ...style,
      }}
    >
      <ShimmerBorder color="white" intensity="low" speed="normal" />
      <div className="relative z-10 w-full h-full bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
        <ShimmerLine color="white" className="z-20" />
        <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
          <DraggableSplit>
            <RemoteSplineFrame
              viewerSrc={DRAGGABLE_SPLIT_SCENES.glassCurtain.viewer}
              sceneSrc={DRAGGABLE_SPLIT_SCENES.glassCurtain.runtime}
              title={DRAGGABLE_SPLIT_SCENES.glassCurtain.title}
            />
            <RemoteSplineFrame
              viewerSrc={DRAGGABLE_SPLIT_SCENES.orbScroll.viewer}
              sceneSrc={DRAGGABLE_SPLIT_SCENES.orbScroll.runtime}
              title={DRAGGABLE_SPLIT_SCENES.orbScroll.title}
            />
          </DraggableSplit>
        </Suspense>
      </div>
    </div>
  );
}

export function SplitExperienceCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="relative rounded-3xl p-6 md:p-8 flex flex-col gap-4 overflow-hidden group cursor-pointer glass-card transition-all duration-300 hover:scale-[1.02]"
      onClick={onOpen}
    >
      <span className="relative text-xs uppercase tracking-[0.3em] font-bold glass-text-gray">▪ Dual Chart Monitor</span>
      <h3 className="relative text-xl md:text-2xl font-bold glass-text">Trading Split View</h3>
      <p className="relative text-sm glass-text-gray">
        Compare real-time charts side-by-side with advanced trading controls and instant execution.
      </p>
      <div className="flex-1" />
      <button
        onClick={onOpen}
        className="relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold glass-button transition-all duration-300"
      >
        <span>Launch Trading View</span>
        <span>→</span>
      </button>
    </div>
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  accent = 'var(--accent-color, #ffffff)',
  subtitle,
  children,
  contentAspectRatio = '16 / 9',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentAspectRatio?: string | null;
}) {
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalNode(document.body);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const evaluate = () => setIsCompact(window.innerWidth < 640);
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  if (!open || !portalNode) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${isCompact ? 'max-w-sm' : 'max-w-6xl'} h-[90vh] md:h-[85vh] min-h-0 overflow-hidden rounded-3xl glass-card bg-black`}
        style={{
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          className="relative z-10 flex items-start justify-between gap-4 p-4 sm:p-6 border-b shrink-0"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-bold glass-text-gray">
              ▪ Interactive Terminal
            </p>
            <h3 className="text-2xl font-bold mt-2 glass-text">
              {title}
            </h3>
            {subtitle && <p className="text-sm mt-1 glass-text-gray">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2.5 glass-card transition-all hover:scale-110 inline-flex h-10 w-10 items-center justify-center"
            aria-label="Close modal"
          >
            <span className="glass-text text-lg">✕</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 p-3 sm:p-6 overflow-hidden flex items-center justify-center relative z-10">
          <div
            className="w-full h-full rounded-xl overflow-hidden glass-border bg-black"
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              ...(contentAspectRatio
                ? {
                    aspectRatio: contentAspectRatio,
                    width: '100%',
                    maxWidth: isCompact ? 'min(80vw, 420px)' : '90vw',
                  }
                : {
                    minHeight: '100%',
                    height: '100%',
                    width: '100%',
                  }),
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    portalNode
  );
}

export function RemoteSceneModal({ scene, onClose }: { scene: RemoteSplineMeta | null; onClose: () => void }) {
  if (!scene) return null;

  return (
    <ModalShell
      open={!!scene}
      onClose={onClose}
      title={scene.title}
      subtitle={scene.subtitle}
      accent={scene.accent}
      contentAspectRatio={scene.aspectRatio ?? '16 / 9'}
    >
      <div className="w-full h-full">
        <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
          <RemoteSplineFrame viewerSrc={scene.viewer} sceneSrc={scene.runtime} title={scene.title} />
        </Suspense>
      </div>
    </ModalShell>
  );
}

export function SplitSceneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Interactive Split Lab"
      subtitle="Dual-scene comparison"
      accent="#ffffff"
      contentAspectRatio="4 / 3"
    >
      <DraggableSplitExperience style={{ height: '100%', minHeight: '0px' }} />
    </ModalShell>
  );
}
