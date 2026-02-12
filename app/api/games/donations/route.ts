import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_GOAL_USD = 100000;
const DEFAULT_DONATION_PRODUCT_ID = 'donation-license-fund';

const DONATION_TIERS = [
  {
    id: 'starter',
    label: 'Starter',
    minUsd: 25,
    reward: 'Early supporter badge',
  },
  {
    id: 'builder',
    label: 'Builder',
    minUsd: 100,
    reward: 'Supporter role + thank-you wall',
  },
  {
    id: 'champion',
    label: 'Champion',
    minUsd: 500,
    reward: 'Priority beta access + all prior rewards',
  },
  {
    id: 'legend',
    label: 'Legend',
    minUsd: 1500,
    reward: 'Legend profile marker + all prior rewards',
  },
] as const;

type DonationRow = {
  order_number: string;
  status: string;
  amount_usd: number | string | null;
  coin: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  guest_email_hash: string | null;
  product_id: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getDonationProductIds(): string[] {
  return (process.env.CRYPTO_DONATION_PRODUCT_IDS || DEFAULT_DONATION_PRODUCT_ID)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function getLicenseGoalUsd(): number {
  const parsed = Number(process.env.GAMES_LICENSE_GOAL_USD || DEFAULT_GOAL_USD);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_GOAL_USD;
  return Math.round(parsed * 100) / 100;
}

function getTierForAmount(totalUsd: number) {
  const sorted = [...DONATION_TIERS].sort((a, b) => a.minUsd - b.minUsd);
  let current = sorted[0];
  for (const tier of sorted) {
    if (totalUsd >= tier.minUsd) current = tier;
  }
  return current;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const donationProductIds = getDonationProductIds();
    const goalUsd = getLicenseGoalUsd();

    const { data, error } = await supabase
      .from('crypto_payments')
      .select('order_number, status, amount_usd, coin, submitted_at, confirmed_at, guest_email_hash, product_id')
      .in('product_id', donationProductIds)
      .order('submitted_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('[games/donations] query error:', error);
      return NextResponse.json({ error: 'Failed to load donation data' }, { status: 500 });
    }

    const rows = (data || []) as DonationRow[];
    const confirmedStatuses = new Set(['confirmed']);
    const pendingStatuses = new Set(['pending', 'confirming', 'manual_review']);
    const failedStatuses = new Set(['failed', 'expired', 'underpaid']);

    let confirmedUsd = 0;
    let pendingUsd = 0;
    let failedUsd = 0;

    const donorTotals = new Map<string, number>();

    for (const row of rows) {
      const amount = Number(row.amount_usd || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      if (confirmedStatuses.has(row.status)) {
        confirmedUsd += amount;
      } else if (pendingStatuses.has(row.status)) {
        pendingUsd += amount;
      } else if (failedStatuses.has(row.status)) {
        failedUsd += amount;
      }

      if (confirmedStatuses.has(row.status) || pendingStatuses.has(row.status)) {
        const donorKey = row.guest_email_hash || `anon:${row.order_number}`;
        donorTotals.set(donorKey, (donorTotals.get(donorKey) || 0) + amount);
      }
    }

    const raisedUsd = confirmedUsd + pendingUsd;
    const remainingUsd = Math.max(goalUsd - raisedUsd, 0);
    const progressPct = goalUsd > 0 ? Math.min((raisedUsd / goalUsd) * 100, 100) : 0;

    const rewardStats = DONATION_TIERS.map((tier) => {
      let donors = 0;
      for (const total of donorTotals.values()) {
        if (total >= tier.minUsd) donors += 1;
      }
      return {
        ...tier,
        donors,
      };
    });

    const recentDonations = rows
      .filter((row) => {
        const amount = Number(row.amount_usd || 0);
        return (confirmedStatuses.has(row.status) || pendingStatuses.has(row.status)) && Number.isFinite(amount) && amount > 0;
      })
      .slice(0, 8)
      .map((row) => {
        const amount = Number(row.amount_usd || 0);
        const donorKey = row.guest_email_hash || row.order_number;
        const donorTotal = donorTotals.get(donorKey) || amount;
        const tier = getTierForAmount(donorTotal);

        return {
          orderNumber: row.order_number,
          amountUsd: amount,
          coin: row.coin,
          status: row.status,
          submittedAt: row.submitted_at,
          confirmedAt: row.confirmed_at,
          donorLabel: `donor_${donorKey.slice(0, 6)}`,
          donorTotalUsd: donorTotal,
          tier: {
            id: tier.id,
            label: tier.label,
          },
        };
      });

    return NextResponse.json({
      goalUsd,
      raisedUsd,
      confirmedUsd,
      pendingUsd,
      failedUsd,
      remainingUsd,
      progressPct,
      donationCount: rows.length,
      activeDonorCount: donorTotals.size,
      tiers: DONATION_TIERS,
      rewardStats,
      recentDonations,
      productIds: donationProductIds,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('[games/donations] server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
