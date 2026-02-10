import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Aggregates crypto payment progress for front-end goal meters.
// Returns confirmed, pending, and failed totals in USD plus counts.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('crypto_payments')
      .select('status, amount_usd')
      .in('status', ['pending', 'confirming', 'confirmed', 'failed', 'expired', 'underpaid', 'manual_review']);

    if (error) {
      console.error('[crypto-payment/metrics] query error', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    const aggregates = data?.reduce(
      (acc, row) => {
        const amount = Number(row.amount_usd) || 0;
        const status = row.status || 'pending';
        if (status === 'confirmed') {
          acc.confirmedUsd += amount;
          acc.confirmedCount += 1;
        } else if (status === 'confirming' || status === 'pending') {
          acc.pendingUsd += amount;
          acc.pendingCount += 1;
        } else if (status === 'failed' || status === 'expired' || status === 'underpaid') {
          acc.failedUsd += amount;
          acc.failedCount += 1;
        } else if (status === 'manual_review') {
          acc.pendingUsd += amount;
          acc.pendingCount += 1;
        }
        acc.totalCount += 1;
        return acc;
      },
      {
        confirmedUsd: 0,
        pendingUsd: 0,
        failedUsd: 0,
        confirmedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        totalCount: 0,
      }
    );

    return NextResponse.json({ ...aggregates, lastUpdated: Date.now() });
  } catch (err) {
    console.error('[crypto-payment/metrics] server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
