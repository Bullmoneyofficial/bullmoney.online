'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Activity,
  ArrowDown,
  Crown,
  Dice5,
  Gamepad2,
  Play,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { DonationFundSection } from '@/components/games/DonationFundSection';
import { forceEnableScrolling } from '@/lib/forceScrollEnabler';
import { useShowcaseScroll } from '@/hooks/useShowcaseScroll';
const StoreHeader = dynamic(
  () => import('@/components/store/StoreHeader').then(mod => ({ default: mod.StoreHeader })),
  { ssr: false }
);

function DeferredMount({
  children,
  rootMargin = '400px',
  fallback = null,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  fallback?: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ready, rootMargin]);

  return <div ref={hostRef}>{ready ? children : fallback}</div>;
}

const HERO_BG_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=3840&q=80&auto=format&fit=crop', alt: 'Slots — Casino slot machines' },
  { src: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=3840&q=80&auto=format&fit=crop', alt: 'Crash — Rocket launching upward' },
  { src: 'https://images.unsplash.com/photo-1522069213448-443a614da9b6?w=3840&q=80&auto=format&fit=crop', alt: 'Dice — Red dice rolling' },
  { src: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=3840&q=80&auto=format&fit=crop', alt: 'Mines — Glowing gems in the dark' },
  { src: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=3840&q=80&auto=format&fit=crop', alt: 'Wheel — Roulette wheel spinning' },
  { src: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=3840&q=80&auto=format&fit=crop', alt: 'Jackpot — Gold coins treasure' },
];

const HERO_BG_SIZES = [1200, 1920, 2560] as const;
const buildHeroSrcSet = (src: string) => (
  HERO_BG_SIZES
    .map((size) => `${src.replace('w=3840', `w=${size}`)} ${size}w`)
    .join(', ')
);

const GAME_CATEGORIES = [
  { key: 'all', label: 'All Games', icon: Gamepad2 },
  { key: 'slots', label: 'Slots', icon: Dice5 },
  { key: 'originals', label: 'Originals', icon: Zap },
  { key: 'multiplayer', label: 'Multiplayer', icon: Crown },
];

const LANDING_GAMES = [
  { name: 'Slots', slug: 'slots', category: 'slots', icon: Dice5, img: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600&q=80&auto=format&fit=crop', tag: 'Popular', desc: 'Spin the reels' },
  { name: 'Crash', slug: 'crash', category: 'originals', icon: Activity, img: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=600&q=80&auto=format&fit=crop', tag: 'Live', desc: 'Cash out before crash' },
  { name: 'Dice', slug: 'dice', category: 'originals', icon: Dice5, img: 'https://images.unsplash.com/photo-1522069213448-443a614da9b6?w=600&q=80&auto=format&fit=crop', tag: 'Classic', desc: 'Roll high or low' },
  { name: 'Mines', slug: 'mines', category: 'originals', icon: Sparkles, img: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&q=80&auto=format&fit=crop', tag: 'Strategy', desc: 'Avoid the mines' },
  { name: 'Plinko', slug: 'plinko', category: 'originals', icon: Target, img: '/assets/images/games/plinko.svg', tag: 'New', desc: 'Drop and chase multipliers' },
  { name: 'Flappy Bird', slug: 'flappybird', category: 'originals', icon: Play, img: '/assets/images/games/flappybird.svg', tag: 'Hot', desc: 'Fly through pipes' },
  { name: 'Wheel', slug: 'wheel', category: 'multiplayer', icon: Star, img: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600&q=80&auto=format&fit=crop', tag: 'Spin', desc: 'Multiplayer wheel' },
  { name: 'Jackpot', slug: 'jackpot', category: 'multiplayer', icon: Trophy, img: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80&auto=format&fit=crop', tag: '$$$', desc: 'Winner takes all' },
];

const games = [
  {
    slug: 'dice',
    title: 'Dice Duel',
    description: 'Pick your edge and ride the curve in fast rounds.',
    image: '/assets/images/games/dice.png',
    accent: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18), rgba(251, 191, 36, 0.02))',
  },
  {
    slug: 'mines',
    title: 'Mines Grid',
    description: 'Tap tiles, dodge bombs, cash out anytime.',
    image: '/assets/images/games/mines.png',
    accent: 'linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(248, 113, 113, 0.03))',
  },
  {
    slug: 'wheel',
    title: 'Wheel Rush',
    description: 'Pick a color and spin into the multiplier lane.',
    image: '/assets/images/games/wheel.png',
    accent: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.02))',
  },
  {
    slug: 'jackpot',
    title: 'Jackpot Pool',
    description: 'Join the round and watch the pot climb.',
    image: '/assets/images/games/jackpot.png',
    accent: 'linear-gradient(135deg, rgba(253, 224, 71, 0.22), rgba(253, 224, 71, 0.03))',
  },
  {
    slug: 'crash',
    title: 'Crash Orbit',
    description: 'Cash out before the curve snaps.',
    image: '/assets/images/games/crash.png',
    accent: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.02))',
  },
  {
    slug: 'plinko',
    title: 'Plinko Drop',
    description: 'Drop balls through pegs and hunt the edge multipliers.',
    image: '/assets/images/games/plinko.svg',
    accent: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.03))',
  },
  {
    slug: 'flappybird',
    title: 'Flappy Bird',
    description: 'Tap to flap, avoid pipes, and multiply your bet with each pass.',
    image: '/assets/images/games/flappybird.svg',
    accent: 'linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(59, 130, 246, 0.03))',
  },
  {
    slug: 'slots',
    title: 'Slots Vault',
    description: 'Tap into the slots library when the backend is live.',
    image: '/assets/images/games/other.png',
    accent: 'linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.03))',
  },
];

type GamesPageClientProps = {
  embedMode?: boolean;
};

export function GamesPageClient({ embedMode = false }: GamesPageClientProps) {
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const [activeGameCategory, setActiveGameCategory] = useState('all');

  // Prefetching is handled automatically by <Link prefetch={true}> on each game card

  useEffect(() => {
    if (embedMode) return;
    const firstHero = HERO_BG_IMAGES[0]?.src;
    if (!firstHero) return;
    const preload = new Image();
    preload.src = firstHero.replace('w=3840', 'w=1920');
  }, [embedMode]);

  useEffect(() => {
    if (embedMode) return;
    const id = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, [embedMode]);

  // Showcase scroll animation — uses hook defaults for lightweight perf
  useShowcaseScroll({
    startDelay: 1000,
    enabled: !embedMode,
    pageId: 'games',
  });

  // Force enable scrolling on mount and watch for changes
  useEffect(() => {
    if (embedMode) return;
    // Mark the document as a games page for scripts to detect
    document.documentElement.setAttribute('data-games-page', 'true');
    document.body.setAttribute('data-games-page', 'true');

    // Use the new scroll enabler utility
    const cleanup = forceEnableScrolling();

    return () => {
      cleanup?.();
      document.documentElement.removeAttribute('data-games-page');
      document.body.removeAttribute('data-games-page');
    };
  }, [embedMode]);

  const visibleGames = LANDING_GAMES.filter(
    (game) => activeGameCategory === 'all' || game.category === activeGameCategory
  );

  return (
    <>
      {!embedMode && (
        <style jsx global>{`
          html, body {
            height: auto !important;
            min-height: 100% !important;
          }
          body {
            overflow-y: auto !important;
          }
          
          /* CRITICAL: Ensure all decorative/background elements pass through touch */
          [data-games-page] [aria-hidden="true"],
          [data-games-page] [aria-hidden="true"] > * {
            pointer-events: none !important;
          }
          
          /* Ensure game page sections allow scrolling via touch */
          [data-games-page] section,
          [data-games-page] main {
            touch-action: pan-y pan-x !important;
          }
          
          /* Samsung browser scroll fixes */
          @supports (-webkit-appearance: none) and (not (-webkit-touch-callout: none)) {
            html[data-games-page], body[data-games-page] {
              overflow-y: auto !important;
              overflow-x: hidden !important;
              touch-action: pan-y pan-x !important;
              -webkit-overflow-scrolling: touch !important;
              transform: none !important;
              height: auto !important;
              position: relative !important;
            }
          }
          
          /* Chrome/Safari/In-app browser scroll fixes */
          html.chrome-browser[data-games-page],
          html.safari-browser[data-games-page],
          html.inapp-browser[data-games-page],
          html.instagram-browser[data-games-page],
          html.facebook-browser[data-games-page],
          html.google-browser[data-games-page] {
            overflow-y: auto !important;
            touch-action: pan-y pan-x !important;
            -webkit-overflow-scrolling: touch !important;
            transform: none !important;
          }
          
          /* ─── Full-width responsive games grid ─── */
          .bullcasino-page .shell-games-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: clamp(10px, 2vw, 20px) !important;
            width: 100% !important;
            height: auto !important;
            box-sizing: border-box !important;
            padding: 0 !important;
          }
          .bullcasino-page .shell-game-card {
            text-decoration: none !important;
            border-radius: clamp(12px, 2vw, 20px) !important;
            border: 1px solid #1f2937 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            color: #e2e8f0 !important;
            box-shadow: 0 8px 30px rgba(2, 6, 23, 0.4) !important;
            box-sizing: border-box !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            overflow: hidden !important;
          }
          .bullcasino-page .shell-game-card:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 16px 48px rgba(2, 6, 23, 0.6) !important;
          }
          .bullcasino-page .shell-game-image {
            width: 100% !important;
            aspect-ratio: 16 / 10 !important;
            height: auto !important;
            border-radius: 0 !important;
            background: rgba(15, 23, 42, 0.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: clamp(12px, 3vw, 24px) !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .bullcasino-page .shell-game-image img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            max-height: 120px !important;
          }
          .bullcasino-page .shell-game-title {
            font-size: clamp(14px, 1.8vw, 20px) !important;
            font-weight: 700 !important;
            margin: 0 !important;
            padding: clamp(8px, 1.5vw, 16px) clamp(10px, 2vw, 18px) 0 !important;
          }
          .bullcasino-page .shell-game-desc {
            color: #cbd5f5 !important;
            line-height: 1.5 !important;
            font-size: clamp(12px, 1.2vw, 15px) !important;
            margin: 0 !important;
            padding: 4px clamp(10px, 2vw, 18px) 0 !important;
          }
          .bullcasino-page .shell-game-footer {
            margin-top: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: clamp(8px, 1.5vw, 16px) clamp(10px, 2vw, 18px) !important;
          }
          .bullcasino-page .shell-game-hint {
            font-size: clamp(10px, 1vw, 13px) !important;
            color: #94a3b8 !important;
          }
          .bullcasino-page .shell-game-cta {
            padding: 8px 16px !important;
            border-radius: 999px !important;
            background: rgba(15, 23, 42, 0.9) !important;
            border: 1px solid rgba(148, 163, 184, 0.25) !important;
            color: #f8fafc !important;
            font-size: clamp(11px, 1vw, 13px) !important;
            font-weight: 600 !important;
            transition: background 0.2s ease !important;
          }
          .bullcasino-page .shell-game-cta:hover {
            background: rgba(255, 255, 255, 0.15) !important;
          }

          /* ─── 2xl+ screens: 3 columns ─── */
          @media (min-width: 1280px) {
            .bullcasino-page .shell-games-grid {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 24px !important;
            }
          }

          /* ─── Tablet: 2 columns ─── */
          @media (max-width: 900px) {
            .bullcasino-page .shell-games-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 14px !important;
            }
          }

          /* ─── Small mobile: 2 columns with breathing room ─── */
          @media (max-width: 640px) {
            .bullcasino-page .shell-games-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
            .bullcasino-page .shell-game-card {
              border-radius: 14px !important;
            }
            .bullcasino-page .shell-game-image {
              aspect-ratio: 4 / 3 !important;
              padding: 14px !important;
            }
            .bullcasino-page .shell-game-image img {
              max-height: 80px !important;
            }
            .bullcasino-page .shell-game-title {
              font-size: 14px !important;
              padding: 10px 12px 2px !important;
            }
            .bullcasino-page .shell-game-desc {
              font-size: 11px !important;
              padding: 2px 12px 0 !important;
            }
            .bullcasino-page .shell-game-footer {
              padding: 8px 12px 10px !important;
            }
          }

          /* ─── Tiny mobile: single column full width ─── */
          @media (max-width: 400px) {
            .bullcasino-page .shell-games-grid {
              grid-template-columns: 1fr !important;
              gap: 14px !important;
            }
            .bullcasino-page .shell-game-image {
              aspect-ratio: 16 / 9 !important;
              padding: 16px !important;
            }
            .bullcasino-page .shell-game-image img {
              max-height: 100px !important;
            }
            .bullcasino-page .shell-game-title {
              font-size: 16px !important;
              padding: 12px 14px 2px !important;
            }
            .bullcasino-page .shell-game-desc {
              display: block !important;
              font-size: 12px !important;
              padding: 2px 14px 0 !important;
            }
            .bullcasino-page .shell-game-footer {
              padding: 10px 14px 12px !important;
            }
          }
          
          /* Container isolation — full width */
          .bullcasino-page .games__container {
            overflow: visible !important;
            position: relative !important;
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        `}</style>
      )}
      {!embedMode && (
      <main
        className="w-full bg-black text-white pb-0"
        style={{
          overflow: 'visible',
          overflowX: 'hidden',
          overflowY: embedMode ? 'visible' : undefined,
          position: 'relative',
          zIndex: 1,
          minHeight: 'auto',
          flex: embedMode ? undefined : '0 0 auto',
          touchAction: 'pan-y pan-x',
        }}
      >
        <div className="w-full pb-0" style={{ paddingTop: embedMode ? 0 : undefined }}>
          {!embedMode && <div className="pt-4 lg:pt-2" />}
          <section
        className="relative w-full bg-black text-white"
        style={{
            minHeight: embedMode ? 'auto' : 'min(80svh, 700px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          touchAction: 'pan-y pan-x',
        }}
        >
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          {HERO_BG_IMAGES.map((img, idx) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1800 ease-in-out pointer-events-none"
              style={{ opacity: idx === heroBgIndex ? 1 : 0, willChange: 'opacity' }}
              srcSet={buildHeroSrcSet(img.src)}
              sizes="100vw"
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          ))}
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px] mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-black to-transparent pointer-events-none" />
        </div>

        {!embedMode && (
        <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden" aria-hidden="true">
          <style>{`
            @keyframes heroFloat1 { 0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.07; } 50% { transform: translateY(-30px) rotate(8deg); opacity: 0.14; } }
            @keyframes heroFloat2 { 0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.06; } 50% { transform: translateY(-22px) rotate(-6deg); opacity: 0.12; } }
            @keyframes heroFloat3 { 0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.05; } 50% { transform: translateY(-26px) rotate(5deg); opacity: 0.1; } }
            @keyframes heroPulseRing { 0% { transform: scale(1); opacity: 0.25; } 100% { transform: scale(2.5); opacity: 0; } }
          `}</style>
          <Gamepad2 className="absolute top-[15%] left-[8%] w-16 h-16 text-white" style={{ animation: 'heroFloat1 7s ease-in-out infinite' }} />
          <Dice5 className="absolute top-[25%] right-[12%] w-12 h-12 text-white" style={{ animation: 'heroFloat2 9s ease-in-out infinite 1s' }} />
          <Trophy className="absolute bottom-[30%] left-[15%] w-14 h-14 text-white" style={{ animation: 'heroFloat3 8s ease-in-out infinite 0.5s' }} />
          <Star className="absolute top-[60%] right-[20%] w-10 h-10 text-white" style={{ animation: 'heroFloat1 10s ease-in-out infinite 2s' }} />
          <Zap className="absolute top-[40%] left-[45%] w-8 h-8 text-white" style={{ animation: 'heroFloat2 6s ease-in-out infinite 1.5s' }} />
          <Crown className="absolute bottom-[22%] right-[35%] w-11 h-11 text-white" style={{ animation: 'heroFloat3 11s ease-in-out infinite 0.8s' }} />
        </div>
        )}

        <div
          className={`games-hero-content relative z-10 mx-auto flex w-full flex-col px-4 sm:px-6 ${embedMode ? 'pt-6 pb-6' : 'max-w-6xl lg:px-10 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-28'}`}
          style={{ touchAction: 'pan-y pan-x' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/IMG_2921.PNG"
              alt="BullMoney"
              className="h-14 w-auto sm:h-16"
              loading="eager"
              decoding="async"
            />
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/50">BullMoney Games</p>
          </div>

          <h1
            className={`font-black tracking-tight leading-[0.95] ${embedMode ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-6xl lg:text-7xl'}`}
            style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            Play. Compete.
            <br />
            <span className="bg-linear-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              Win bragging rights.
            </span>
          </h1>

          <p
            className="mt-5 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed"
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
          >
            Free-to-play demo games with virtual currency. No deposits, no risk — just pure entertainment and skill.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/store"
              prefetch={true}
              className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(120deg, rgba(45,212,191,0.95), rgba(56,189,248,0.95))',
                color: '#0b1324',
                boxShadow: '0 12px 30px rgba(56,189,248,0.2)',
              }}
            >
              Visit Store
            </Link>
            <a
              href="#games-iframe"
              className="group inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-semibold uppercase tracking-[0.06em] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: 'rgba(45,212,191,0.5)',
                background: 'rgba(15, 23, 42, 0.45)',
                color: 'rgba(226, 253, 245, 0.9)',
              }}
            >
              <Play className="w-4 h-4 transition-transform group-hover:scale-110" />
              Browse Games
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {[
              { icon: Gamepad2, label: 'Demo Games' },
              { icon: Shield, label: '18+ Only' },
              { icon: Dice5, label: 'Virtual Currency' },
              { icon: Trophy, label: 'No Account Needed' },
            ].map((pill) => {
              const PillIcon = pill.icon;
              return (
                <div
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur-sm"
                >
                  <PillIcon className="w-3 h-3" />
                  {pill.label}
                </div>
              );
            })}
          </div>
        </div>

        {!embedMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/30 pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
        )}
        </section>

        <DonationFundSection />

        <section
          id="games-iframe"
          className="relative bg-black text-white"
          style={{ touchAction: 'pan-y pan-x', backgroundColor: '#000000' }}
        >
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=3840&q=80&auto=format&fit=crop"
            alt="Gaming atmosphere"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/60 to-black pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
        </div>

        <div
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
          style={{ backgroundColor: '#000000' }}
        >
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40 mb-3">Explore</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05]">Pick your game.</h2>
            <p className="mt-3 text-sm sm:text-base text-white/50 max-w-md mx-auto leading-relaxed">
              Browse categories, tap to play — all free, all demo, no risk.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-10" style={{ touchAction: 'manipulation' }}>
            {GAME_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              const isActive = activeGameCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveGameCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                      : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/90 active:bg-white/20'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  <CatIcon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full">
            {visibleGames.map((game) => {
              const GameIcon = game.icon;
              return (
                <Link
                  key={game.name}
                  href={`/games/${game.slug}`}
                  prefetch={true}
                  className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 active:border-white/40 transition-all duration-200 text-left w-full active:scale-[0.97] cursor-pointer select-none"
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  onClick={(event) => {
                    event.preventDefault();
                    window.location.assign(`/games/${game.slug}`);
                  }}
                >
                  <div className="relative w-full aspect-4/3">
                    <img
                      src={game.img}
                      alt={game.name}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/15 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/90 pointer-events-none">
                      {game.tag}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <GameIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                      <h3 className="text-sm sm:text-base font-bold tracking-tight text-white/90">{game.name}</h3>
                    </div>
                    <p className="text-[11px] sm:text-xs text-white/40 mt-1">{game.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/games"
              prefetch={true}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(120deg, rgba(251,191,36,0.95), rgba(251,113,133,0.95))',
                color: '#1f0f1a',
                boxShadow: '0 14px 32px rgba(251,113,133,0.18)',
              }}
            >
              <Play className="w-4 h-4" />
              Browse All Games
            </Link>
          </div>
        </div>
        </section>
          </div>
      </main>
      )}

      {embedMode ? (
        <div style={{ position: 'relative', zIndex: 2, isolation: 'isolate' }}>
          <section className="games__container" style={{ padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 24px) clamp(16px, 2vw, 24px)', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'clamp(16px, 3vw, 28px)',
              padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 36px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
                }} />
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 500,
                  letterSpacing: '0.1em', 
                  textTransform: 'uppercase', 
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  Demo Mode Active
                </span>
              </div>
              <h2 style={{ 
                fontSize: 'clamp(28px, 5vw, 44px)', 
                fontWeight: 600,
                margin: 0, 
                color: '#ffffff',
                letterSpacing: '-0.025em',
                lineHeight: 1.1
              }}>
                Choose your game
              </h2>
              <p style={{ 
                maxWidth: 440,
                margin: 0,
                fontSize: 15, 
                color: 'rgba(255,255,255,0.55)', 
                lineHeight: 1.6,
                fontWeight: 400
              }}>
                Explore the full collection below. No account needed, no deposits — just tap and play.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 4
              }}>
                {[
                  { label: 'Free to play', icon: '✦' },
                  { label: 'Instant start', icon: '⚡' },
                  { label: 'Virtual chips', icon: '🎰' }
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 100,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: 10 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </section>

          <section className="games__container" style={{ padding: 'clamp(8px, 2vw, 16px) clamp(12px, 3vw, 32px) clamp(24px, 4vw, 48px)', position: 'relative', zIndex: 2 }}>
          <div
            className="shell-games-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(10px, 2vw, 20px)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {games.map((game) => (
              <div
                key={game.slug}
                className="shell-game-card"
                style={{
                  textDecoration: 'none',
                  borderRadius: 'clamp(12px, 2vw, 20px)',
                  border: '1px solid #1f2937',
                  background: game.accent,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  minHeight: 0,
                  color: '#e2e8f0',
                  boxShadow: '0 8px 30px rgba(2, 6, 23, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Link
                  href={`/games/${game.slug}`}
                  prefetch={true}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    textDecoration: 'none',
                    touchAction: 'pan-y pan-x',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    window.location.assign(`/games/${game.slug}`);
                  }}
                  aria-label={`Play ${game.title}`}
                />
                <div className="shell-game-image" style={{ aspectRatio: '16/10', width: '100%' }}>
                  <img src={game.image} alt={game.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="shell-game-title" style={{ padding: 'clamp(8px, 1.5vw, 16px) clamp(10px, 2vw, 18px) 0' }}>{game.title}</div>
                <div className="shell-game-desc" style={{ padding: '4px clamp(10px, 2vw, 18px) 0' }}>{game.description}</div>
                <div className="shell-game-footer" style={{ padding: 'clamp(8px, 1.5vw, 16px) clamp(10px, 2vw, 18px)' }}>
                  <span className="shell-game-hint">Open demo</span>
                  <span className="shell-game-cta">Play</span>
                </div>
              </div>
            ))}
          </div>
          </section>
          </div>
      ) : (
        <DeferredMount fallback={<div className="min-h-[40vh] w-full bg-[#0b1120]" />}>
          <div>

          </div>
        </DeferredMount>
      )}
    </>
  );
}

export default GamesPageClient;
