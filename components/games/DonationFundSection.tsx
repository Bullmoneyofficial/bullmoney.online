'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Heart, Loader2, Target, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { CryptoCheckoutInline } from '@/components/shop/CryptoCheckoutInline';

type DonationTier = {
  id: string;
  label: string;
  minUsd: number;
  reward: string;
};

type RewardStat = DonationTier & {
  donors: number;
};

type DonationResponse = {
  goalUsd: number;
  raisedUsd: number;
  confirmedUsd: number;
  pendingUsd: number;
  remainingUsd: number;
  progressPct: number;
  donationCount: number;
  activeDonorCount: number;
  tiers: DonationTier[];
  rewardStats: RewardStat[];
  lastUpdated: number;
};

const DEFAULT_TIERS: DonationTier[] = [
  { id: 'starter', label: 'Starter', minUsd: 25, reward: 'Early supporter badge' },
  { id: 'builder', label: 'Builder', minUsd: 100, reward: 'Supporter role + thank-you wall' },
  { id: 'champion', label: 'Champion', minUsd: 500, reward: 'Priority beta access + all prior rewards' },
  { id: 'legend', label: 'Legend', minUsd: 1500, reward: 'Legend profile marker + all prior rewards' },
  { id: 'elite', label: 'Elite', minUsd: 2500, reward: 'Gold legacy crest + all prior rewards' },
  { id: 'immortal', label: 'Immortal', minUsd: 5000, reward: 'Founder vault access + concierge support' },
];

const QUICK_AMOUNTS = [25, 100, 250, 500, 1500, 2500];
const DONATION_PRODUCT_ID = process.env.NEXT_PUBLIC_CRYPTO_DONATION_PRODUCT_ID || 'donation-license-fund';

const tierListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const tierItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function usd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function clampAmount(input: string): number {
  const parsed = Number(input.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed)) return QUICK_AMOUNTS[1];
  return Math.min(Math.max(parsed, 5), 100000);
}

export function DonationFundSection() {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [showCryptoCheckout, setShowCryptoCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DonationResponse | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null);

  const fetchStats = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);

    try {
      const res = await fetch('/api/games/donations', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch donation stats');
      const data = (await res.json()) as DonationResponse;
      setStats(data);
    } catch {
      setStats((prev) => prev || {
          goalUsd: 100000,
          raisedUsd: 0,
          confirmedUsd: 0,
          pendingUsd: 0,
          remainingUsd: 100000,
          progressPct: 0,
          donationCount: 0,
          activeDonorCount: 0,
          tiers: DEFAULT_TIERS,
          rewardStats: DEFAULT_TIERS.map((tier) => ({ ...tier, donors: 0 })),
          lastUpdated: Date.now(),
        });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats('initial');
    const id = setInterval(() => fetchStats('refresh'), 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  useEffect(() => {
    setPulseKey((prev) => prev + 1);
  }, [selectedAmount]);

  const tiers = stats?.tiers?.length ? stats.tiers : DEFAULT_TIERS;
  const rewardStats = stats?.rewardStats?.length
    ? stats.rewardStats
    : DEFAULT_TIERS.map((tier) => ({ ...tier, donors: 0 }));

  const selectedTier = useMemo(() => {
    let current = tiers[0];
    for (const tier of tiers) {
      if (selectedAmount >= tier.minUsd) current = tier;
    }
    return current;
  }, [selectedAmount, tiers]);

  const orderedRewardStats = useMemo(() => {
    const next = [...rewardStats];
    next.sort((a, b) => {
      if (a.id === selectedTier.id) return -1;
      if (b.id === selectedTier.id) return 1;
      return a.minUsd - b.minUsd;
    });
    return next;
  }, [rewardStats, selectedTier.id]);

  useEffect(() => {
    setExpandedTierId(selectedTier.id);
  }, [selectedTier.id]);

  if (loading && !stats) {
    return (
      <section className="relative overflow-hidden border-y border-white/10 bg-black py-16">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-6 w-6 animate-spin text-white/70" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden border-y border-white/10 bg-black py-12 sm:py-16"
      style={{ backgroundColor: '#000000' }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 18, 0], opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Gaming License Donation</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Change the future of casinos forever in a crypto-native world.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
              Our future demo casino is built to feel bold, transparent, and community-backed. Your support directly funds
              licensing, compliance, and legal readiness. Every donation is voluntary, tracked, and acknowledged.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Transparent goal tracking', 'Crypto-secured checkout', 'No paywalls for demos', 'Voluntary & non-refundable'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchStats('refresh')}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition hover:border-white/40 hover:text-white"
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Raised</p>
              <p className="mt-2 text-2xl font-bold text-white">{usd(stats?.raisedUsd || 0)}</p>
              <p className="mt-1 text-xs text-white/45">Confirmed {usd(stats?.confirmedUsd || 0)} · Pending {usd(stats?.pendingUsd || 0)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Goal</p>
              <p className="mt-2 text-2xl font-bold text-white">{usd(stats?.goalUsd || 100000)}</p>
              <p className="mt-1 text-xs text-white/45">Remaining {usd(stats?.remainingUsd || 0)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Community</p>
              <p className="mt-2 text-2xl font-bold text-white">{stats?.activeDonorCount || 0} donors</p>
              <p className="mt-1 text-xs text-white/45">{stats?.donationCount || 0} total donations tracked</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.06] via-white/[0.02] to-white/[0.06] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Community momentum</p>
              <p className="mt-1 text-sm text-white/70">Join the donors pushing BullMoney toward regulated launch.</p>
              <p className="mt-1 text-[11px] text-white/55">100% of donations go toward licensing and legal readiness.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1">
                Avg. donation {usd(Math.max(5, Math.round((stats?.raisedUsd || 0) / Math.max(1, stats?.donationCount || 0))))}
              </span>
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1">Updated every 30s</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-white/65">
              <span>Progress meter</span>
              <span>{Math.max(0, Math.min(stats?.progressPct || 0, 100)).toFixed(2)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(stats?.progressPct || 0, 100))}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Donation tiers & rewards</p>
              <motion.div
                className="space-y-3"
                variants={tierListVariants}
                initial="hidden"
                animate="show"
              >
                {orderedRewardStats.map((tier) => {
                  const isQualified = selectedAmount >= tier.minUsd;
                  const isSelected = tier.id === selectedTier.id;
                  const isExpanded = expandedTierId === tier.id;
                  const isGoldTier = tier.minUsd >= 2500;
                  const baseBorder = isGoldTier ? 'border-amber-300/40' : 'border-white/10';
                  const activeBorder = isGoldTier ? 'border-amber-300/70' : 'border-white/45';
                  const activeBg = isGoldTier ? 'bg-amber-500/10' : 'bg-white/[0.1]';
                  const qualifiedBg = isGoldTier ? 'bg-amber-500/5' : 'bg-white/[0.05]';
                  const glowColor = isGoldTier ? '255,200,80' : '255,255,255';

                  return (
                    <motion.div
                      key={tier.id}
                      layout
                      variants={tierItemVariants}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      animate={{
                        scale: isSelected ? 1.015 : 1,
                        boxShadow: isSelected
                          ? `0 0 28px rgba(${glowColor},0.2)`
                          : isQualified
                            ? `0 0 20px rgba(${glowColor},0.14)`
                            : '0 0 0 rgba(0,0,0,0)',
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={`relative overflow-hidden rounded-2xl border ${isSelected ? activeBorder : baseBorder} ${isSelected ? activeBg : isQualified ? qualifiedBg : 'bg-black/30'}`}
                    >
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full blur-2xl"
                        style={{ background: isGoldTier ? 'rgba(251, 191, 36, 0.35)' : 'rgba(255, 255, 255, 0.18)' }}
                        animate={{ opacity: [0.15, 0.35, 0.15], x: [0, 18, 0], y: [0, 10, 0] }}
                        transition={{ duration: isGoldTier ? 5.5 : 7, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {isSelected && (
                        <motion.div
                          key={pulseKey}
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: [0, 0.3, 0], scale: [0.96, 1.03, 1.06] }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                          <div className={`absolute inset-0 rounded-2xl border ${isGoldTier ? 'border-amber-300/40' : 'border-white/30'}`} />
                        </motion.div>
                      )}
                      {isSelected && (
                        <motion.div
                          key={`ripple-${pulseKey}`}
                          aria-hidden="true"
                          className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
                          initial={{ opacity: 0.4, scale: 0.2 }}
                          animate={{ opacity: [0.4, 0], scale: [0.2, 6.5] }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                          style={{
                            border: `1px solid rgba(${glowColor},0.4)`,
                            boxShadow: `0 0 24px rgba(${glowColor},0.25)`,
                          }}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAmount(tier.minUsd);
                          setCustomAmount(String(tier.minUsd));
                          setShowCryptoCheckout(true);
                          setExpandedTierId((prev) => (prev === tier.id ? null : tier.id));
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div>
                          <p className={`text-sm font-semibold ${isGoldTier ? 'text-amber-200' : 'text-white'}`}>{tier.label}</p>
                          <p className="mt-1 text-[11px] text-white/55">{usd(tier.minUsd)}+ minimum</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] uppercase tracking-[0.2em] ${isQualified ? (isGoldTier ? 'text-amber-200/80' : 'text-emerald-200/80') : 'text-white/40'}`}>
                            {isQualified ? 'Unlocked' : 'Locked'}
                          </span>
                          <span className={`text-xs ${isGoldTier ? 'text-amber-200/90' : 'text-white/70'}`}>{usd(tier.minUsd)}+</span>
                          <motion.span
                            aria-hidden="true"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="text-white/50"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="details"
                            initial={{ height: 0, opacity: 0, y: -6 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -6 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4">
                              <p className="text-xs text-white/70">{tier.reward}</p>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
                                <span>{tier.donors} donors unlocked</span>
                                {isGoldTier && <span className="text-amber-200/80">Gold tier</span>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><Heart className="h-4 w-4" /> Donate now</p>
              <p className="mt-2 text-xs text-white/60">Select a tier amount or enter your own amount. Rewards are auto-calculated from lifetime donation totals.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/55">
                {['Secure checkout', 'No stored card data', 'Live progress updates'].map((note) => (
                  <span key={note} className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                    {note}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-2 text-[11px] text-white/60">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span>Immediate impact</span>
                  <span className="text-white/75">Licensing fees + legal review</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span>Reward eligibility</span>
                  <span className="text-white/75">Tier perks + public thanks</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <motion.button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount(String(amount));
                    }}
                    whileTap={{ scale: 0.96 }}
                    animate={{ y: selectedAmount === amount ? -2 : 0 }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedAmount === amount ? 'border-white bg-white text-black' : 'border-white/20 text-white/75 hover:border-white/45 hover:text-white'}`}
                  >
                    {usd(amount)}
                  </motion.button>
                ))}
              </div>

              <label className="mt-4 block text-[11px] uppercase tracking-[0.16em] text-white/45">Custom amount (USD)</label>
              <input
                value={customAmount}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^0-9.]/g, '');
                  setCustomAmount(next);
                  setSelectedAmount(clampAmount(next));
                }}
                className="mt-2 w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-white/60"
                inputMode="decimal"
                placeholder="100"
              />

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/45">This donation qualifies for</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-4 w-4" /> {selectedTier.label}</p>
                <p className="mt-1 text-xs text-white/60">{selectedTier.reward}</p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowCryptoCheckout((prev) => !prev)}
                  className="w-full rounded-xl bg-white text-black px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                >
                  {showCryptoCheckout ? 'Hide Crypto Checkout' : 'Donate with Crypto'}
                </button>

                {showCryptoCheckout && (
                  <div className="mt-2 rounded-xl border border-black/10 bg-white p-2 max-h-[60vh] overflow-y-auto">
                    <CryptoCheckoutInline
                      productName="Gaming License Donation"
                      productImage={null}
                      priceUSD={selectedAmount}
                      productId={DONATION_PRODUCT_ID}
                      quantity={1}
                      inline
                      onClose={() => setShowCryptoCheckout(false)}
                      onPaymentSubmitted={() => {
                        toast.success('Donation submitted. It will update after blockchain confirmation.');
                        setTimeout(() => fetchStats('refresh'), 1200);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/55">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Funds are tracked for licensing, compliance, and legal launch readiness. Demo access remains free for all users.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
