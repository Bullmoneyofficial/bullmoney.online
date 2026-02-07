import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CRYPTO PAYMENT API - Record and track crypto payment submissions
// POST: Submit a new crypto payment for verification
// GET: Check payment status by txHash
// ============================================================================

// In-memory store (replace with Supabase table in production)
// For a persistent solution, create a `crypto_payments` table in Supabase
const pendingPayments = new Map<string, CryptoPaymentRecord>();

interface CryptoPaymentRecord {
  txHash: string;
  coin: string;
  network: string;
  walletAddress: string;
  amountUSD: number;
  amountCrypto: number | null;
  productId: string;
  variantId?: string;
  quantity: number;
  productName: string;
  status: 'pending' | 'confirmed' | 'failed';
  submittedAt: string;
  confirmedAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      txHash,
      coin,
      network,
      walletAddress,
      amountUSD,
      amountCrypto,
      productId,
      variantId,
      quantity,
      productName,
    } = body;

    if (!txHash || !coin || !network || !walletAddress || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const record: CryptoPaymentRecord = {
      txHash,
      coin,
      network,
      walletAddress,
      amountUSD: amountUSD || 0,
      amountCrypto: amountCrypto || null,
      productId,
      variantId,
      quantity: quantity || 1,
      productName: productName || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    // Store the payment record
    pendingPayments.set(txHash, record);

    // Log for manual review (visible in server logs / Vercel dashboard)
    console.log('=== CRYPTO PAYMENT SUBMITTED ===');
    console.log(JSON.stringify(record, null, 2));
    console.log('================================');

    // TODO: In production, insert into Supabase:
    // await supabase.from('crypto_payments').insert(record);
    
    // TODO: Send notification email to admin
    // await sendAdminNotification(record);

    return NextResponse.json({
      success: true,
      message: 'Payment recorded. Verification in progress.',
      txHash,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Crypto payment error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('txHash');

  if (!txHash) {
    return NextResponse.json(
      { error: 'txHash parameter required' },
      { status: 400 }
    );
  }

  const record = pendingPayments.get(txHash);
  
  if (!record) {
    return NextResponse.json(
      { error: 'Payment not found', status: 'unknown' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    txHash: record.txHash,
    status: record.status,
    coin: record.coin,
    network: record.network,
    amountUSD: record.amountUSD,
    submittedAt: record.submittedAt,
    confirmedAt: record.confirmedAt,
  });
}
