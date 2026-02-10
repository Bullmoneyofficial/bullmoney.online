'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, Copy, ExternalLink, Check, Sparkles, Activity, ChevronDown, Wallet, Heart, Zap, Crown, Star, Shield, DollarSign, Scale, Gamepad2, Dice5, Trophy, Play, ArrowDown } from 'lucide-react';
import dynamic from 'next/dynamic';


const CryptoCheckoutTrigger = dynamic(
  () => import('@/components/shop/CryptoCheckoutInline').then(m => ({ default: m.CryptoCheckoutTrigger })),
  { ssr: false, loading: () => <div className="h-11 rounded-xl bg-neutral-100 animate-pulse" /> }
);

const ElectricBorder = dynamic(() => import('@/components/ElectricBorder'), { ssr: false });
// Custom bullcasino footer for games page

const GAMES_URL = process.env.NEXT_PUBLIC_CASINO_URL || 'https://www.bullmoney.online/demogames';

const donationGoalUsd = 50000;
const fallbackContributions = [
  { label: 'Community pledges', amount: 12400 },
  { label: 'Team match', amount: 7500 },
  { label: 'Partners', amount: 5600 },
];

const donationAddresses = [
  { chain: 'Bitcoin', short: 'BTC', address: 'bc1purm66ng2asctqsl87jrjp6sk0sml6q8fpeymsl90pxdgsa70hm2qtramdl', hint: 'Taproot', color: '#F7931A' },
  { chain: 'Ethereum', short: 'ETH', address: '0xcd010464272d0190de122093bfc9106c5f37b1f3', hint: 'ERC20 / USDT', color: '#627EEA' },
  { chain: 'Solana', short: 'SOL', address: 'AMRcDPbT5aM8iUabH5dFvFmSmyjpcd6eEpijnjytYrJ', hint: 'SPL tokens', color: '#9945FF' },
  { chain: 'USDT', short: 'TRC20', address: 'TZ4T5Z5RmjXVcWLfvpb6fQDibBFSFyEVoH', hint: 'Tron · low fees', color: '#26A17B' },
  { chain: 'BNB', short: 'BSC', address: '0xcd010464272d0190de122093bfc9106c5f37b1f3', hint: 'BEP20', color: '#F0B90B' },
  { chain: 'Dogecoin', short: 'DOGE', address: 'DJX6PqD3y3cygeYtD9imbzHcEcuNScwenG', hint: 'DOGE network', color: '#C2A633' },
  { chain: 'Base ETH', short: 'BASE', address: '0xa54530764D2FfAA8153E91389d877533c42D9f7e', hint: 'Base L2', color: '#0052FF' },
  { chain: 'XRP', short: 'XRP', address: 'rad8MFtd6UnBHwVcJZbK8LSG7WYNGHUCmB', hint: 'XRP Ledger', color: '#23292F' },
  { chain: 'USDC', short: 'ERC20', address: '0xfC851C016d1f4D4031f7d20320252cb283169DF3', hint: 'Ethereum', color: '#2775CA' },
];

// Donation tiers as real products — processed through the crypto payment system
const DONATION_TIERS = [
  {
    id: 'donation-community-supporter',
    name: 'Community Supporter',
    price: 25,
    icon: Heart,
    perk: 'Name on supporters wall',
    badge: 'Supporter',
    color: '#22c55e',
  },
  {
    id: 'donation-starter-boost',
    name: 'Starter Boost',
    price: 50,
    icon: Zap,
    perk: 'Shout-out on launch stream',
    badge: 'Booster',
    color: '#f59e0b',
  },
  {
    id: 'donation-license-champion',
    name: 'License Champion',
    price: 250,
    icon: Crown,
    perk: 'Early access + exclusive badge',
    badge: 'Champion',
    color: '#a855f7',
  },
  {
    id: 'donation-founding-whale',
    name: 'Founding Whale',
    price: 1000,
    icon: Star,
    perk: 'VIP lifetime + governance vote',
    badge: 'Whale',
    color: '#3b82f6',
  },
  {
    id: 'donation-license-guardian',
    name: 'License Guardian',
    price: 5000,
    icon: Shield,
    perk: 'Co-founder credits + revenue share',
    badge: 'Guardian',
    color: '#ef4444',
  },
];

function DonationCard({ tier, onPaymentSubmitted }: {
  tier: typeof DONATION_TIERS[number];
  onPaymentSubmitted?: (txHash: string, coin: string, network: string) => void;
}) {
  const Icon = tier.icon;
  return (
    <div className="group relative rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all">
      {/* Top color bar */}
      <div className="h-1" style={{ background: tier.color }} />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: tier.color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">{tier.name}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tier.color }}>{tier.badge}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black">${tier.price}</div>
            <div className="text-[10px] text-neutral-400 uppercase">USD</div>
          </div>
        </div>
        {/* Perk */}
        <div className="text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 shrink-0 animate-pulse" style={{ color: tier.color }} />
          {tier.perk}
        </div>
        {/* Real crypto checkout button */}
        <CryptoCheckoutTrigger
          productName={`Donation: ${tier.name}`}
          productImage={null}
          priceUSD={tier.price}
          productId={tier.id}
          compact
          theme="light"
          onPaymentSubmitted={onPaymentSubmitted}
        />
      </div>
    </div>
  );
}

const carouselSlides = [
  {
    title: 'License Fund Momentum',
    caption: 'Every sat moves us closer to a compliant, real casino launch.',
    bg: 'from-neutral-900 via-neutral-800 to-black',
    badge: 'Goal Tracker',
  },
  {
    title: 'Built for Fair Play',
    caption: 'Open odds, transparent math, and verifiable game logs.',
    bg: 'from-black via-neutral-900 to-neutral-800',
    badge: 'Integrity',
  },
  {
    title: 'Community-Powered',
    caption: 'No VCs. Just players who want a licensed, safe experience.',
    bg: 'from-neutral-800 via-black to-neutral-900',
    badge: 'Players First',
  },
];

// 4K gaming hero backgrounds — matches "Pick your game" card images
const HERO_BG_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=3840&q=80&auto=format&fit=crop', alt: 'Slots — Casino slot machines' },
  { src: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=3840&q=80&auto=format&fit=crop', alt: 'Crash — Rocket launching upward' },
  { src: 'https://images.unsplash.com/photo-1522069213448-443a614da9b6?w=3840&q=80&auto=format&fit=crop', alt: 'Dice — Red dice rolling' },
  { src: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=3840&q=80&auto=format&fit=crop', alt: 'Mines — Glowing gems in the dark' },
  { src: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=3840&q=80&auto=format&fit=crop', alt: 'Wheel — Roulette wheel spinning' },
  { src: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=3840&q=80&auto=format&fit=crop', alt: 'Jackpot — Gold coins treasure' },
];

function BitcoinMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="black" />
      <path
        fill="white"
        d="M18.9 17.4c1.4-.4 2.3-1.5 2.1-3.2-.2-1.5-1.3-2.4-3-2.7l.1-2.8-1.7-.1-.1 2.7h-1.3l.1-2.7-1.7-.1-.1 2.7H10l-.1 1.6h1.2l-.2 5.4H9.8L9.7 20h1.3l-.1 2.7 1.7.1.1-2.7h1.3l-.1 2.7 1.7.1.1-2.8c2.5-.3 3.9-1.6 4.2-3.4.3-1.5-.5-2.7-2-3.3ZM14 13.4h2.4c1 0 1.8.5 2 1.3.2.9-.3 1.7-1.4 1.9l-3.1.5.1-3.7Zm2.3 6.6-2.9-.1.1-3.2 3.3-.5c1.2-.2 1.9.4 1.9 1.4 0 1.2-.8 2.2-2.4 2.4Z"
      />
    </svg>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-3 rounded-full bg-neutral-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-black transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function CryptoLogo({ chain, color }: { chain: string; color: string }) {
  const letter = chain === 'USDT' ? '₮' : chain === 'USDC' ? '$' : chain === 'Base ETH' ? 'Ξ' : chain.charAt(0);
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: color }}
    >
      {letter}
    </div>
  );
}

function WalletCard({ chain, short, address, hint, color, copied, onCopy }: {
  chain: string; short: string; address: string; hint: string; color: string; copied: boolean; onCopy: () => void;
}) {
  const truncated = address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;
  return (
    <button
      onClick={onCopy}
      className="group relative flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left hover:border-neutral-400 hover:shadow-md active:scale-[0.98] transition-all w-full"
      title={`Copy ${chain} address`}
    >
      <CryptoLogo chain={chain} color={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold leading-tight">{chain}</span>
          <span className="text-[10px] font-medium text-neutral-400 uppercase">{short}</span>
        </div>
        <div className="text-[11px] text-neutral-500 font-mono truncate">{truncated}</div>
        <div className="text-[10px] text-neutral-400">{hint}</div>
      </div>
      <div className="shrink-0">
        {copied ? (
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-neutral-50 group-hover:bg-neutral-100 flex items-center justify-center transition-colors">
            <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700" />
          </div>
        )}
      </div>
    </button>
  );
}

function WalletToggle({ copiedChain, onCopy }: { copiedChain: string | null; onCopy: (address: string, chain: string) => void }) {
  const [open, setOpen] = useState(false);
  // Show top 3 always, rest behind toggle
  const visible = open ? donationAddresses : donationAddresses.slice(0, 3);
  const hiddenCount = donationAddresses.length - 3;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold text-neutral-800 hover:text-black transition-colors"
      >
        <span className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Donate with Crypto
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          {donationAddresses.length} wallets
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Compact 2-col grid on desktop, 1-col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {visible.map((row) => (
          <WalletCard
            key={row.chain}
            chain={row.chain}
            short={row.short}
            address={row.address}
            hint={row.hint}
            color={row.color}
            copied={copiedChain === row.chain}
            onCopy={() => onCopy(row.address, row.chain)}
          />
        ))}
      </div>

      {!open && hiddenCount > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-center text-xs font-medium text-neutral-500 hover:text-black py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Show {hiddenCount} more wallets
        </button>
      )}

      {copiedChain && (
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
          <Check className="w-3 h-3" />
          {copiedChain} copied
        </div>
      )}
    </div>
  );
}

// Bullcasino layout containing the iframe shell and donation hero
export default function BullcasinoLayout() {
  const [loading, setLoading] = useState(true);
  const [copiedChain, setCopiedChain] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    confirmedUsd: number;
    pendingUsd: number;
    failedUsd: number;
    confirmedCount: number;
    pendingCount: number;
    failedCount: number;
    totalCount: number;
    lastUpdated: number;
  } | null>(null);
  const totalRaised = useMemo(() => {
    if (metrics) return metrics.confirmedUsd;
    return fallbackContributions.reduce((sum, item) => sum + item.amount, 0);
  }, [metrics]);
  const progress = useMemo(() => Math.min(100, Math.round((totalRaised / donationGoalUsd) * 100)), [totalRaised]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const [liveEvents, setLiveEvents] = useState<{ status: string; orderNumber?: string; coin?: string } | null>(null);
  const [activeGameCategory, setActiveGameCategory] = useState('all');
  const [iframeSrc, setIframeSrc] = useState(GAMES_URL);


  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 4800);
    return () => clearInterval(id);
  }, []);

  // Hero background image rotation
  useEffect(() => {
    const id = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadMetrics = async () => {
      try {
        const res = await fetch('/api/crypto-payment/metrics');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMetrics(data);
      } catch {
        // stay silent, fallback will be used
      }
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { status?: string; orderNumber?: string; coin?: string };
      if (!detail) return;
      const status = detail.status || 'submitted';
      setLiveEvents({ status, orderNumber: detail.orderNumber, coin: detail.coin });
      setMetrics((prev) => {
        if (!prev) return prev;
        if (status === 'confirmed') return { ...prev, confirmedCount: prev.confirmedCount + 1 };
        if (status === 'failed') return { ...prev, failedCount: prev.failedCount + 1 };
        return { ...prev, pendingCount: prev.pendingCount + 1 };
      });
      setTimeout(() => setLiveEvents(null), 6000);
    };
    window.addEventListener('crypto-payment-status', handler as EventListener);
    window.addEventListener('crypto-payment-submitted', handler as EventListener);
    return () => {
      window.removeEventListener('crypto-payment-status', handler as EventListener);
      window.removeEventListener('crypto-payment-submitted', handler as EventListener);
    };
  }, []);

  const handleCopy = (text: string, chain: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedChain(chain);
      setTimeout(() => setCopiedChain(null), 1800);
    });
  };

  return (
    <main className="w-full bg-white text-black min-h-screen pb-0" style={{ overflowX: 'hidden' }}>
      {/* Games Hero */}
      <section className="relative w-full overflow-x-hidden bg-black text-white" style={{ minHeight: 'min(100vh, 800px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Crossfading Unsplash 4K backgrounds */}
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
          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px] mix-blend-overlay" />
          {/* Radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)]" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-black to-transparent" />
        </div>

        {/* Floating animated icons */}
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

        {/* Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 sm:px-6 lg:px-10" style={{ minHeight: 'min(100vh, 800px)', paddingTop: 48, paddingBottom: 48 }}>
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

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            Play. Compete.
            <br />
            <span className="bg-linear-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">Win bragging rights.</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
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

          {/* Info pills */}
          <div className="mt-10 flex flex-wrap gap-2">
            {[
              { icon: Gamepad2, label: 'Demo Games' },
              { icon: Shield, label: '18+ Only' },
              { icon: Dice5, label: 'Virtual Currency' },
              { icon: Trophy, label: 'No Account Needed' },
            ].map((pill) => {
              const PillIcon = pill.icon;
              return (
                <div key={pill.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur-sm">
                  <PillIcon className="w-3 h-3" />
                  {pill.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* Hero: License Drive */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-semibold text-neutral-600">
              <BitcoinMark />
              <span className="inline-flex items-center gap-2">License Drive · Community Powered</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-black text-white rounded-full text-xs font-semibold uppercase tracking-tight">
                    <Sparkles className="w-4 h-4" />
                    Make Bullcasino Real
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                    Help us fund a compliant, licensed launch.
                  </h1>
                  <p className="text-base sm:text-lg text-neutral-700 leading-relaxed max-w-2xl">
                    We are demo-only today—no gambling rights, no payouts. Your crypto donations go toward licensing, audits, and responsible gambling tooling so we can launch the real, fully compliant version.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>License Goal: ${donationGoalUsd.toLocaleString()}</span>
                    <span>{progress}% funded (${totalRaised.toLocaleString()} raised)</span>
                  </div>
                  <ProgressBar percent={progress} />
                  <div className="grid sm:grid-cols-3 gap-3 text-xs text-neutral-600">
                    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium">
                      <div className="text-neutral-500">Confirmed</div>
                      <div className="text-black text-sm">${(metrics?.confirmedUsd ?? totalRaised).toLocaleString()}</div>
                      <div className="text-[11px] text-green-600 font-semibold">{metrics?.confirmedCount ?? '—'} tx</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium">
                      <div className="text-neutral-500">Pending</div>
                      <div className="text-black text-sm">${(metrics?.pendingUsd ?? 0).toLocaleString()}</div>
                      <div className="text-[11px] text-blue-600 font-semibold">{metrics?.pendingCount ?? '—'} tx</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium">
                      <div className="text-neutral-500">Failed</div>
                      <div className="text-black text-sm">${(metrics?.failedUsd ?? 0).toLocaleString()}</div>
                      <div className="text-[11px] text-red-600 font-semibold">{metrics?.failedCount ?? '—'} tx</div>
                    </div>
                  </div>
                </div>

                <WalletToggle
                  copiedChain={copiedChain}
                  onCopy={handleCopy}
                />

                <div className="text-sm text-neutral-600">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer font-semibold text-neutral-800 text-xs uppercase tracking-wide py-1.5">
                      <span>Safety &amp; Compliance</span>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-neutral-500">
                      <li>Sitewide demo-only banner and disabled wallet CTA</li>
                      <li>Deposit/withdraw/history pages replaced with disabled messaging</li>
                      <li>Server-side wallet disablement and callbacks blocked</li>
                      <li>History queries removed while wallets are off</li>
                    </ul>
                  </details>
                  {liveEvents && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800">
                      <Activity className="w-4 h-4" />
                      <span>{liveEvents.status === 'confirmed' ? 'Live: payment confirmed' : liveEvents.status === 'failed' ? 'Live: payment failed' : 'Live: payment submitted'}</span>
                      {liveEvents.orderNumber && <span className="text-neutral-500">{liveEvents.orderNumber}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {/* Donation Product Cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Quick Donate</div>
                    <div className="text-[10px] text-neutral-400">Pay with any crypto</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DONATION_TIERS.slice(0, 4).map((tier) => (
                      <DonationCard
                        key={tier.id}
                        tier={tier}
                        onPaymentSubmitted={(txHash, coin) => {
                          window.dispatchEvent(new CustomEvent('crypto-payment-submitted', {
                            detail: { status: 'submitted', coin, orderNumber: txHash.slice(0, 8) }
                          }));
                        }}
                      />
                    ))}
                  </div>

                </div>

                {/* Vision Reel Carousel */}
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white/60 to-white/30" />
                  <div className="relative p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      <span>Vision Reel</span>
                      <div className="flex gap-1">
                        {carouselSlides.map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 w-4 rounded-full transition ${idx === slideIndex ? 'bg-black' : 'bg-neutral-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden bg-neutral-900 text-white">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${carouselSlides[slideIndex].bg} transition-all duration-700`}
                      />
                      <div className="relative h-full w-full flex flex-col justify-between p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                          {carouselSlides[slideIndex].badge}
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight">{carouselSlides[slideIndex].title}</h3>
                          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                            {carouselSlides[slideIndex].caption}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Apple-Style Game Picker ── */}
      <section className="relative bg-black text-white overflow-x-hidden">
        {/* Unsplash cinematic media background */}
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
          {/* Section header — Apple typography */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40 mb-3">Explore</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Pick your game.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/50 max-w-md mx-auto leading-relaxed">
              Browse categories, tap to play — all free, all demo, no risk.
            </p>
          </div>

          {/* Category pills — horizontal scroll, pill style like Apple tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10" style={{ touchAction: 'manipulation' }}>
            {[
              { key: 'all', label: 'All Games', icon: Gamepad2 },
              { key: 'slots', label: 'Slots', icon: Dice5 },
              { key: 'originals', label: 'Originals', icon: Zap },
              { key: 'multiplayer', label: 'Multiplayer', icon: Crown },
            ].map((cat) => {
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

          {/* Game cards grid — real Bullcasino games */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: 'Slots', route: '/slots', category: 'slots', icon: Dice5, img: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600&q=80&auto=format&fit=crop', tag: 'Popular', desc: 'Spin the reels' },
              { name: 'Crash', route: '/crash', category: 'originals', icon: Activity, img: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=600&q=80&auto=format&fit=crop', tag: 'Live', desc: 'Cash out before crash' },
              { name: 'Dice', route: '/dice', category: 'originals', icon: Dice5, img: 'https://images.unsplash.com/photo-1522069213448-443a614da9b6?w=600&q=80&auto=format&fit=crop', tag: 'Classic', desc: 'Roll high or low' },
              { name: 'Mines', route: '/mines', category: 'originals', icon: Sparkles, img: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&q=80&auto=format&fit=crop', tag: 'Strategy', desc: 'Avoid the mines' },
              { name: 'Wheel', route: '/wheel', category: 'multiplayer', icon: Star, img: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600&q=80&auto=format&fit=crop', tag: 'Spin', desc: 'Multiplayer wheel' },
              { name: 'Jackpot', route: '/jackpot', category: 'multiplayer', icon: Trophy, img: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80&auto=format&fit=crop', tag: '$$$', desc: 'Winner takes all' },
            ]
              .filter((g) => activeGameCategory === 'all' || g.category === activeGameCategory)
              .map((game) => {
                const GameIcon = game.icon;
                return (
                  <button
                    key={game.name}
                    onClick={() => {
                      setIframeSrc(GAMES_URL.replace(/\/$/, '') + game.route);
                      setLoading(true);
                      document.getElementById('games-iframe')?.scrollIntoView({ behavior: 'smooth' });
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

          {/* CTA to scroll to iframe */}
          <div className="text-center mt-10">
            <button
              onClick={() => {
                setIframeSrc(GAMES_URL);
                setLoading(true);
                document.getElementById('games-iframe')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
            >
              <Play className="w-4 h-4" />
              Browse All Games
            </button>
          </div>
        </div>
      </section>

      {/* License Guardian — Premium Standalone Section */}
      <section className="border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="relative z-10 text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-red-600 mb-3">
              <Shield className="w-3.5 h-3.5" />
              Highest Impact
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">License Guardian</h2>
          </div>

          <div className="relative">
            {/* Red ambient glow behind the card */}

          <ElectricBorder
            color="#ef4444"
            speed={1}
            chaos={0.12}
            borderRadius={16}
            style={{ borderRadius: 16, background: 'black' }}
          >
            <div className="bg-white rounded-2xl p-6 sm:p-8">
              <p className="text-sm text-neutral-600 text-center mb-5 max-w-lg mx-auto">
                Become a co-founder of the licensed Bullcasino. Your $5,000 pledge earns permanent revenue share,
                co-founder credits, and governance rights over the platform&apos;s future.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Icon + Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/25">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-xl font-black leading-tight">$5,000</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-red-500 mt-0.5">Guardian Tier</div>
                  </div>
                </div>
                {/* Perks */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { icon: Shield, text: 'Co-founder credits', anim: 'animate-pulse' },
                      { icon: DollarSign, text: 'Revenue share', anim: 'animate-bounce' },
                      { icon: Scale, text: 'Governance vote', anim: 'animate-pulse' },
                      { icon: Crown, text: 'Lifetime VIP status', anim: 'animate-bounce' },
                    ].map((perk) => {
                      const PerkIcon = perk.icon;
                      return (
                        <div key={perk.text} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700">
                          <PerkIcon className={`w-4 h-4 text-red-500 shrink-0 ${perk.anim}`} style={{ animationDuration: '2.5s' }} />
                          <span className="font-medium">{perk.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                <CryptoCheckoutTrigger
                  productName="Donation: License Guardian"
                  productImage={null}
                  priceUSD={5000}
                  productId="donation-license-guardian"
                  theme="light"
                  onPaymentSubmitted={(txHash, coin) => {
                    window.dispatchEvent(new CustomEvent('crypto-payment-submitted', {
                      detail: { status: 'submitted', coin, orderNumber: txHash.slice(0, 8) }
                    }));
                  }}
                />
              </div>
            </div>
          </ElectricBorder>
          </div>

          <p className="text-center text-[11px] text-neutral-400 mt-4">
            All donations are final. Revenue share terms finalized upon license approval.
          </p>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">
            DEMO MODE: Play money only • No real gambling • Entertainment purposes • 18+ • Not available in jurisdictions where prohibited
          </span>
        </div>
      </div>

      {/* Games Iframe - full height below */}
      <div
        id="games-iframe"
        data-game-iframe
        className="relative w-full bg-white"
        style={{
          height: 'calc(100dvh - 48px)',
          minHeight: '500px',
          maxHeight: '900px',
          touchAction: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading demo games...</p>
            </div>
          </div>
        )}
        <iframe
          data-game-frame
          src={iframeSrc}
          title="BullMoney Demo Games - Entertainment Only"
          onLoad={() => setLoading(false)}
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; payment; camera; microphone; display-capture; web-share"
          referrerPolicy="origin"
          loading="lazy"
          className="w-full h-full border-0"
          style={{
            display: loading ? 'none' : 'block',
            pointerEvents: 'auto',
            touchAction: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            zIndex: 5,
            transform: 'translateZ(0)',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Store Footer below iframe */}
      <footer className="bg-white border-t border-neutral-200 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-800">
                BC
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-neutral-900">Bullcasino Demo</p>
                <p className="text-xs text-neutral-500">Entertainment only · Play money · 18+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <a href="/community" className="hover:text-black">Community</a>
              <span className="text-neutral-300">•</span>
              <a href="/games" className="hover:text-black">Games</a>
              <span className="text-neutral-300">•</span>
              <a href="/community" className="hover:text-black">Support</a>
            </div>
          </div>
          <div className="text-[11px] text-neutral-500 leading-relaxed">
            This demo does not offer real-money gambling. No deposits, no withdrawals, and no payouts. Gameplay uses virtual funds only.
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
            <span>© {new Date().getFullYear()} Bullcasino Demo</span>
            <span className="text-neutral-300">|</span>
            <span>Licensed launch coming soon—help fund the license drive above.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

