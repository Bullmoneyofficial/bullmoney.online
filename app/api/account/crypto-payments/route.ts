import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { decryptValue, hashValue } from '@/lib/crypto-encryption';

interface SessionPayload {
  id: number;
  email: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = body?.session as SessionPayload | undefined;

    if (!session?.id || !session?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { data: recruit } = await supabase
      .from('recruits')
      .select('id, email')
      .eq('id', session.id)
      .eq('email', session.email)
      .maybeSingle();

    if (!recruit) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const emailHash = hashValue(recruit.email);
    const { data, error } = await supabase
      .from('crypto_payments')
      .select('order_number, tx_hash, coin, network, amount_usd, amount_crypto, status, confirmations, required_confirmations, submitted_at, confirmed_at')
      .eq('guest_email_hash', emailHash)
      .order('submitted_at', { ascending: false })
      .limit(25);

    if (error) {
      return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
    }

    const payments = (data || []).map((p: any) => ({
      ...p,
      tx_hash: decryptValue(p.tx_hash) || p.tx_hash,
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('[AccountCryptoPayments] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
