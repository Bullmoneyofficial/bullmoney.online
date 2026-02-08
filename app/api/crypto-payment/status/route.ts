import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashValue } from '@/lib/crypto-encryption';

// ============================================================================
// CRYPTO PAYMENT STATUS — Public polling endpoint
// GET /api/crypto-payment/status?orderNumber=BM-CRYPTO-...
// GET /api/crypto-payment/status?txHash=0x...
// GET /api/crypto-payment/status?paymentId=uuid
//
// Returns only safe public fields (no admin data exposed)
// Designed for frontend polling after payment submission
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// Rate limit: 30 requests per minute per IP
const statusRateLimit = new Map<string, { count: number; resetAt: number }>();
const STATUS_RATE_LIMIT_WINDOW = 60 * 1000;
const STATUS_RATE_LIMIT_MAX = 30;

function checkStatusRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = statusRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    statusRateLimit.set(ip, { count: 1, resetAt: now + STATUS_RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= STATUS_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  
  if (!checkStatusRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before polling again.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');
  const txHash = searchParams.get('txHash');
  const paymentId = searchParams.get('paymentId');

  if (!orderNumber && !txHash && !paymentId) {
    return NextResponse.json(
      { error: 'Provide orderNumber, txHash, or paymentId parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('crypto_payments')
      .select('order_number, status, confirmations, required_confirmations, blockchain_verified, amount_verified, coin, network, amount_usd, submitted_at, confirmed_at');

    if (orderNumber) {
      query = query.eq('order_number', orderNumber.trim());
    } else if (paymentId) {
      query = query.eq('id', paymentId.trim());
    } else if (txHash) {
      const clean = txHash.trim();
      const hash = hashValue(clean);
      query = query.or(`tx_hash_hash.eq.${hash},tx_hash.eq.${clean}`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[PaymentStatus] Query error:', error);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Payment not found', status: 'unknown' },
        { status: 404 }
      );
    }

    // Calculate progress percentage for UI
    const confirmations = data.confirmations || 0;
    const required = data.required_confirmations || 12;
    const progress = Math.min(100, Math.round((confirmations / required) * 100));

    // Determine user-friendly message
    let message = '';
    switch (data.status) {
      case 'pending':
        message = 'Searching for your transaction on the blockchain...';
        break;
      case 'confirming':
        message = `Transaction found! Waiting for confirmations (${confirmations}/${required})`;
        break;
      case 'confirmed':
        message = 'Payment confirmed! Your order is being processed.';
        break;
      case 'underpaid':
        message = 'Transaction confirmed but the amount was less than expected. Please contact support.';
        break;
      case 'failed':
        message = 'Transaction failed on the blockchain. Please check the transaction hash.';
        break;
      case 'expired':
        message = 'Payment expired. The transaction was not found within the time window.';
        break;
      case 'manual_review':
        message = 'Payment received outside the verification window. Support will review it.';
        break;
      default:
        message = `Payment status: ${data.status}`;
    }

    return NextResponse.json({
      orderNumber: data.order_number,
      status: data.status,
      confirmations,
      requiredConfirmations: required,
      progress,
      blockchainVerified: data.blockchain_verified,
      amountVerified: data.amount_verified,
      coin: data.coin,
      network: data.network,
      amountUSD: data.amount_usd,
      submittedAt: data.submitted_at,
      confirmedAt: data.confirmed_at,
      message,
      isTerminal: ['confirmed', 'failed', 'expired', 'manual_review'].includes(data.status),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
