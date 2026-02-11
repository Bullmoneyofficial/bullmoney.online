'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
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
  Trophy,
  Zap,
} from 'lucide-react';
const BullcasinoShell = dynamic(
  () => import('./components/BullcasinoShell'),
  { ssr: false, loading: () => <div className="min-h-[40vh] w-full" /> }
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
    slug: 'slots',
    title: 'Slots Vault',
    description: 'Tap into the slots library when the backend is live.',
    image: '/assets/images/games/other.png',
    accent: 'linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.03))',
  },
];

export function GamesPageClient() {
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const [activeGameCategory, setActiveGameCategory] = useState('all');

  useEffect(() => {
    const id = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Force enable scrolling on mount and after any modal/hub closes
  useEffect(() => {
    // Mark the document as a games page for scripts to detect
    document.documentElement.setAttribute('data-games-page', 'true');
    document.body.setAttribute('data-games-page', 'true');

    const forceEnableScroll = () => {
      const body = document.body;
      const html = document.documentElement;

      // Only fix if scroll is broken (overflow is hidden)
      if (body.style.overflow === 'hidden' || html.style.overflowY === 'hidden') {
        body.style.overflow = 'auto';
        body.style.height = 'auto';
        html.style.overflowY = 'auto';
        html.style.overflowX = 'hidden';
        html.style.height = 'auto';
      }

      // Also ensure touch-action is not restricted
      body.style.touchAction = 'auto';
      html.style.touchAction = 'auto';
    };

    // Run immediately
    forceEnableScroll();

    // Watch for style changes on body and html
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Small delay to let modal logic finish
          setTimeout(forceEnableScroll, 100);
        }
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    // Also re-check periodically as backup (less frequent now)
    const interval = setInterval(forceEnableScroll, 2000);

    // Re-enable scroll when page becomes visible (user returns from another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        forceEnableScroll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Re-enable scroll when user clicks anywhere (catches modal closes)
    const handleClick = () => {
      setTimeout(forceEnableScroll, 150);
    };
    document.addEventListener('click', handleClick, { passive: true });

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const visibleGames = LANDING_GAMES.filter(
    (game) => activeGameCategory === 'all' || game.category === activeGameCategory
  );

  return (
    <>
      <style jsx global>{`
        html, body {
          height: auto !important;
          min-height: 100% !important;
        }
        body {
          overflow-y: auto !important;
        }
        .shell-game-image {
          width: 100%;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        .shell-game-image img {
          width: 72px;
          height: 72px;
          object-fit: contain;
        }
        .shell-game-title {
          font-size: 18px;
          font-weight: 600;
        }
        .shell-game-desc {
          color: #cbd5f5;
          line-height: 1.5;
          font-size: 14px;
        }
        .shell-game-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .shell-game-hint {
          font-size: 12px;
          color: #94a3b8;
        }
        .shell-game-cta {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.25);
          color: #f8fafc;
          font-size: 12px;
        }
        @media (max-width: 780px) {
          .shell-games-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .shell-game-card {
            padding: 12px;
            min-height: 0;
          }
          .shell-game-image {
            padding: 0;
            background: transparent;
            border-radius: 14px;
            overflow: hidden;
          }
          .shell-game-image img {
            width: 100%;
            height: auto;
            display: block;
            aspect-ratio: 4 / 3;
            object-fit: cover;
          }
          .shell-game-title {
            font-size: 14px;
            margin-top: 8px;
          }
          .shell-game-desc,
          .shell-game-footer {
            display: none;
          }
        }
      `}</style>
      <main className="w-full bg-white text-black min-h-screen pb-0" style={{ overflowX: 'hidden' }}>
        <div className="w-full px-2 sm:px-4 lg:pl-[84px] lg:pr-[20px] pt-[90px] lg:pt-[76px] pb-[55px]">
          <section
        className="relative w-full overflow-x-hidden bg-black text-white"
        style={{
          minHeight: 'min(100vh, 800px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 800px',
        }}
        >
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {HERO_BG_IMAGES.map((img, idx) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1800 ease-in-out"
              style={{ opacity: idx === heroBgIndex ? 1 : 0 }}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px] mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-black to-transparent" />
        </div>

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

        <div
          className="games-hero-content relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 sm:px-6 lg:px-10 pt-12 pb-12 lg:pt-[124px]"
          style={{ minHeight: 'min(100vh, 800px)' }}
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
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
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
            <a
              href="/store"
              className="group inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
            >
              Visit Store
            </a>
            <a
              href="#games-iframe"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10"
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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
        </section>

        <section id="games-iframe" className="relative bg-black text-white overflow-x-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=3840&q=80&auto=format&fit=crop"
            alt="Gaming atmosphere"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {visibleGames.map((game) => {
              const GameIcon = game.icon;
              return (
                <button
                  key={game.name}
                  onClick={() => {
                    window.location.href = `/games/${game.slug}`;
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 active:border-white/40 transition-all duration-200 text-left w-full active:scale-[0.97] cursor-pointer select-none"
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                    <img
                      src={game.img}
                      alt={game.name}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-white/90 pointer-events-none">
                      {game.tag}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <GameIcon className="w-4 h-4 text-white/50" />
                      <h3 className="text-sm font-bold tracking-tight text-white/90">{game.name}</h3>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{game.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/games';
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
            >
              <Play className="w-4 h-4" />
              Browse All Games
            </button>
          </div>
        </div>
        </section>
          </div>
      </main>

      <DeferredMount fallback={<div className="min-h-[40vh] w-full bg-[#0b1120]" />}>
        <BullcasinoShell>
        <section className="games__container" style={{ padding: '32px 24px 12px' }}>
          <div
            style={{
              background: 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 45%), radial-gradient(circle at 20% 40%, rgba(251, 191, 36, 0.18), transparent 50%), #0b1120',
              border: '1px solid #1f2937',
              borderRadius: 24,
              padding: '28px 28px 24px',
              boxShadow: '0 20px 60px rgba(2, 6, 23, 0.55)',
              color: '#e2e8f0',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Bullcasino Engine</div>
                <h1 style={{ fontSize: 34, margin: 0, color: '#f8fafc' }}>Play the demo lineup</h1>
                <p style={{ marginTop: 10, color: '#cbd5f5', lineHeight: 1.6 }}>
                  Pick a game, place a virtual bet, and explore the Bullcasino interface in demo mode. All gameplay is for entertainment only.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['Demo balance', 'Instant rounds', 'No deposits'].map((label) => (
                  <div
                    key={label}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 999,
                      border: '1px solid #1f2937',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#e2e8f0',
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="games__container" style={{ padding: '8px 24px 40px' }}>
          <div
            className="shell-games-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 18,
            }}
          >
            {games.map((game) => (
              <a
                key={game.slug}
                href={`/games/${game.slug}`}
                className="shell-game-card"
                style={{
                  textDecoration: 'none',
                  borderRadius: 20,
                  border: '1px solid #1f2937',
                  background: game.accent,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minHeight: 220,
                  color: '#e2e8f0',
                  boxShadow: '0 16px 40px rgba(2, 6, 23, 0.4)',
                }}
              >
                <div className="shell-game-image">
                  <img src={game.image} alt={game.title} />
                </div>
                <div className="shell-game-title">{game.title}</div>
                <div className="shell-game-desc">{game.description}</div>
                <div className="shell-game-footer">
                  <span className="shell-game-hint">Open demo</span>
                  <span className="shell-game-cta">Play</span>
                </div>
              </a>
            ))}
          </div>
        </section>
        </BullcasinoShell>
      </DeferredMount>
    </>
  );
}

export default GamesPageClient;
