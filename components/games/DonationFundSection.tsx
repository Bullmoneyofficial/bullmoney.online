'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Heart, Loader2, Target, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { CryptoCheckoutTrigger } from '@/components/shop/CryptoCheckoutInline';

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
];

const QUICK_AMOUNTS = [25, 100, 250, 500, 1500];
const DONATION_PRODUCT_ID = process.env.NEXT_PUBLIC_CRYPTO_DONATION_PRODUCT_ID || 'donation-license-fund';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DonationResponse | null>(null);

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

  const tiers = stats?.tiers?.length ? stats.tiers : DEFAULT_TIERS;

  const selectedTier = useMemo(() => {
    let current = tiers[0];
    for (const tier of tiers) {
      if (selectedAmount >= tier.minUsd) current = tier;
    }
    return current;
  }, [selectedAmount, tiers]);

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
    <section className="relative overflow-hidden border-y border-white/10 bg-black py-12 sm:py-16">
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
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Help turn demos into legal real-money casino games.</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
              Donations use the same secure crypto checkout as product quick view. Every contribution updates live progress,
              tiers, and reward eligibility math.
            </p>
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
              <div className="grid gap-3 sm:grid-cols-2">
                {(stats?.rewardStats?.length ? stats.rewardStats : DEFAULT_TIERS.map((tier) => ({ ...tier, donors: 0 }))).map((tier) => (
                  <div key={tier.id} className={`rounded-2xl border p-4 ${tier.id === selectedTier.id ? 'border-white/40 bg-white/[0.08]' : 'border-white/10 bg-black/30'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{tier.label}</p>
                      <span className="text-xs text-white/50">{usd(tier.minUsd)}+</span>
                    </div>
                    <p className="mt-2 text-xs text-white/65">{tier.reward}</p>
                    <p className="mt-2 text-[11px] text-white/45">{tier.donors} donors unlocked</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><Heart className="h-4 w-4" /> Donate now</p>
              <p className="mt-2 text-xs text-white/60">Select a tier amount or enter your own amount. Rewards are auto-calculated from lifetime donation totals.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount(String(amount));
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedAmount === amount ? 'border-white bg-white text-black' : 'border-white/20 text-white/75 hover:border-white/45 hover:text-white'}`}
                  >
                    {usd(amount)}
                  </button>
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
                <CryptoCheckoutTrigger
                  productName="Gaming License Donation"
                  productImage={null}
                  priceUSD={selectedAmount}
                  productId={DONATION_PRODUCT_ID}
                  quantity={1}
                  compact
                  onPaymentSubmitted={() => {
                    toast.success('Donation submitted. It will update after blockchain confirmation.');
                    setTimeout(() => fetchStats('refresh'), 1200);
                  }}
                />
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
