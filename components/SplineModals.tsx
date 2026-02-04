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
