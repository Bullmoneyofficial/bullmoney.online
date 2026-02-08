import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction, verifyAmount } from '@/lib/blockchain-verify';
import { sendEmail } from '@/lib/email-service';
import { generateInvoiceHTML, buildCryptoInvoiceData } from '@/lib/invoice-generator';
import { decryptValue, hashValue } from '@/lib/crypto-encryption';

// ============================================================================
// VERIFY CRYPTO PAYMENTS - Cron job / manual trigger
// Checks all pending/confirming payments against the blockchain
// Sends emails to BOTH admin + customer on status changes
//
// Call via:
//   GET /api/crypto-payment/verify              (verify all pending)
//   GET /api/crypto-payment/verify?txHash=0x... (verify one specific)
//
// Vercel Cron: In vercel.json:
//   { "crons": [{ "path": "/api/crypto-payment/verify", "schedule": "*/5 * * * *" }] }
// ============================================================================

const ADMIN_EMAIL = 'officialbullmoneywebsite@gmail.com';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// Protect the cron endpoint with a secret (optional but recommended)
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }
  
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Optional auth check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const specificTxHash = searchParams.get('txHash');
  
  const supabase = getSupabaseAdmin();
  const results: VerifyResult[] = [];

  try {
    // Fetch pending payments
    let query = supabase
      .from('crypto_payments')
      .select('*')
      .in('status', ['pending', 'confirming'])
      .order('submitted_at', { ascending: true })
      .limit(50); // Process max 50 per run

    if (specificTxHash) {
      const clean = specificTxHash.trim();
      const hash = hashValue(clean);
      query = supabase
        .from('crypto_payments')
        .select('*')
        .or(`tx_hash_hash.eq.${hash},tx_hash.eq.${clean}`)
        .limit(1);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('[Verify] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ 
        message: 'No pending payments to verify', 
        checked: 0, 
        results: [] 
      });
    }

    console.log(`[Verify] Checking ${payments.length} pending payment(s)...`);

    // Check each payment against the blockchain
    for (const payment of payments) {
      const result = await verifySinglePayment(supabase, payment);
      results.push(result);
      
      // Small delay between checks to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    const confirmed = results.filter(r => r.newStatus === 'confirmed').length;
    const failed = results.filter(r => r.newStatus === 'failed').length;
    const stillPending = results.filter(r => r.newStatus === 'pending' || r.newStatus === 'confirming').length;

    console.log(`[Verify] Done: ${confirmed} confirmed, ${failed} failed, ${stillPending} still pending`);

    return NextResponse.json({
      message: 'Verification complete',
      checked: results.length,
      confirmed,
      failed,
      stillPending,
      results,
    });
  } catch (error) {
    console.error('[Verify] Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

interface VerifyResult {
  orderNumber: string;
  txHash: string;
  coin: string;
  previousStatus: string;
  newStatus: string;
  confirmations: number;
  required: number;
  blockchainFound: boolean;
  amountCheck?: string;
}

async function verifySinglePayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  payment: Record<string, unknown>
): Promise<VerifyResult> {
  const txHash = decryptValue(payment.tx_hash as string) || (payment.tx_hash as string);
  const coin = payment.coin as string;
  const network = payment.network as string;
  const orderNumber = payment.order_number as string;
  const prevStatus = payment.status as string;
  const required = (payment.required_confirmations as number) || 12;
  const expectedCrypto = payment.amount_crypto as number | null;
  const attempts = (payment.verification_attempts as number) || 0;
  const decryptedWallet = decryptValue(payment.wallet_address as string) || (payment.wallet_address as string);
  const decryptedEmail = decryptValue(payment.guest_email as string) || '';
  const decryptedSender = decryptValue(payment.sender_wallet as string) || null;

  console.log(`[Verify] Checking ${orderNumber}: ${txHash.substring(0, 16)}... (${coin} on ${network})`);

  try {
    // Dev-only shortcut for testing full flow without real chain calls
    const isDevTest = process.env.DEV_CRYPTO_TEST_MODE === 'true' && txHash.startsWith('dev_');
    const txResult = isDevTest
      ? {
          found: true,
          status: 'success' as const,
          confirmations: required,
          valueParsed: expectedCrypto ?? undefined,
        }
      : await verifyTransaction(txHash, coin, network, decryptedWallet);

    const txTimeMs = txResult.timestamp ? txResult.timestamp * 1000 : null;
    const priceLockUntil = payment.price_locked_until as string | null;
    const submittedAt = payment.submitted_at as string | null;
    const outsideWindow = Boolean(
      txTimeMs && (
        (priceLockUntil && txTimeMs > Date.parse(priceLockUntil)) ||
        (submittedAt && txTimeMs + 5 * 60 * 1000 < Date.parse(submittedAt))
      )
    );

    // Determine new status
    let newStatus = prevStatus;
    let amountCheck = 'skipped';

    if (!txResult.found) {
      // Not found — could be too early or invalid hash
      if (attempts >= 60) {
        // After ~5 hours of checking (every 5 min = 60 checks), mark expired
        newStatus = 'expired';
      }
      // else keep pending
    } else if (txResult.status === 'failed') {
      newStatus = 'failed';
    } else if (txResult.status === 'pending') {
      newStatus = 'confirming';
    } else if (txResult.status === 'success') {
      // Check confirmations
      if (txResult.confirmations >= required) {
        if (outsideWindow) {
          newStatus = 'manual_review';
          amountCheck = 'window';
        } else if (expectedCrypto && txResult.valueParsed) {
          // Check amount if we have both expected and actual
          const amtResult = verifyAmount(expectedCrypto, txResult.valueParsed);
          amountCheck = amtResult.status;
          
          if (amtResult.status === 'underpaid') {
            newStatus = 'underpaid';
          } else if (amtResult.status === 'overpaid') {
            // Overpaid is still valid — mark confirmed but flag it
            newStatus = 'confirmed';
            amountCheck = 'overpaid';
          } else {
            newStatus = 'confirmed';
          }
        } else {
          // No amount to verify — mark confirmed (admin can review)
          newStatus = 'confirmed';
          amountCheck = 'no_data';
        }
      } else {
        newStatus = 'confirming';
      }
    }

    // Update in database
    const updateData: Record<string, unknown> = {
      status: newStatus,
      confirmations: txResult.confirmations,
      blockchain_verified: txResult.found,
      verification_attempts: attempts + 1,
      last_verified_at: new Date().toISOString(),
    };

    if (txResult.valueParsed !== undefined) {
      updateData.actual_amount_crypto = txResult.valueParsed;
    }

    if (newStatus === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.amount_verified = amountCheck !== 'no_data';
    }

    if (txResult.error) {
      updateData.verification_error = txResult.error;
    }

    await supabase
      .from('crypto_payments')
      .update(updateData)
      .eq('id', payment.id);

    const safePayment = {
      ...payment,
      guest_email: decryptedEmail,
      wallet_address: decryptedWallet,
      sender_wallet: decryptedSender,
    };

    // On confirmed — auto-create a store_orders record so it appears in admin orders
    if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
      try {
        await createOrderFromCryptoPayment(supabase, safePayment);
      } catch (err) {
        console.error(`[Verify] Order creation failed for ${orderNumber}:`, err);
      }
    }

    // Send admin + customer notification if status changed
    if (newStatus !== prevStatus && (newStatus === 'confirmed' || newStatus === 'failed' || newStatus === 'underpaid' || newStatus === 'expired' || newStatus === 'manual_review')) {
      sendStatusChangeEmail(safePayment, newStatus, txResult.confirmations).catch(
        (err) => console.error('[Verify] Status email failed:', err)
      );
    }

    return {
      orderNumber,
      txHash: txHash.substring(0, 20) + '...',
      coin,
      previousStatus: prevStatus,
      newStatus,
      confirmations: txResult.confirmations,
      required,
      blockchainFound: txResult.found,
      amountCheck,
    };
  } catch (error) {
    console.error(`[Verify] Error checking ${orderNumber}:`, error);

    // Update attempt count even on error
    await supabase
      .from('crypto_payments')
      .update({
        verification_attempts: attempts + 1,
        last_verified_at: new Date().toISOString(),
        verification_error: String(error),
      })
      .eq('id', payment.id);

    return {
      orderNumber,
      txHash: txHash.substring(0, 20) + '...',
      coin,
      previousStatus: prevStatus,
      newStatus: prevStatus,
      confirmations: 0,
      required,
      blockchainFound: false,
      amountCheck: 'error',
    };
  }
}

// ── Auto-create store_orders record when crypto payment confirmed ────────
async function createOrderFromCryptoPayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  payment: Record<string, unknown>
) {
  const orderNumber = payment.order_number as string;
  const email = (payment.guest_email as string) || '';
  const productName = payment.product_name as string || 'Digital Product';
  const quantity = (payment.quantity as number) || 1;
  const amountUSD = (payment.amount_usd as number) || 0;
  const coin = payment.coin as string;
  const network = payment.network as string;
  const txHash = payment.tx_hash as string;

  // Check if order already exists (idempotency)
  const { data: existing } = await supabase
    .from('store_orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (existing) {
    console.log(`[Verify] Order ${orderNumber} already exists, skipping creation`);
    return;
  }

  // Create order in store_orders
  const { data: order, error } = await supabase
    .from('store_orders')
    .insert({
      order_number: orderNumber,
      email: email.toLowerCase(),
      customer_name: email.split('@')[0] || 'Crypto Customer',
      items: [{
        name: productName,
        quantity,
        price: amountUSD / quantity,
      }],
      subtotal: amountUSD,
      total_amount: amountUSD,
      currency: 'usd',
      status: 'processing',
      payment_status: 'paid',
      fulfillment_status: 'unfulfilled',
      payment_method: `crypto_${coin.toLowerCase()}`,
      source: 'crypto',
      metadata: {
        crypto_coin: coin,
        crypto_network: network,
        tx_hash: txHash,
        crypto_payment_id: payment.id,
        amount_crypto: payment.amount_crypto,
        locked_price: payment.locked_price,
        sender_wallet: payment.sender_wallet,
        wallet_address: payment.wallet_address,
      },
    })
    .select()
    .single();

  if (error) {
    console.error(`[Verify] Failed to create order for ${orderNumber}:`, error);
    return;
  }

  // Link order back to crypto_payments record
  await supabase
    .from('crypto_payments')
    .update({ order_id: order.id })
    .eq('order_number', orderNumber);

  console.log(`[Verify] Created store_orders record for ${orderNumber} (order id: ${order.id})`);
}

// ── Status change email — sent to BOTH admin + customer ─────────────────
async function sendStatusChangeEmail(
  payment: Record<string, unknown>,
  newStatus: string,
  confirmations: number
) {
  const customerEmail = payment.guest_email as string;
  const orderNumber = payment.order_number as string;
  const productName = payment.product_name as string;
  const amountUSD = payment.amount_usd as number;
  const amountCrypto = payment.amount_crypto;
  const coin = payment.coin as string;
  const txHash = payment.tx_hash as string;
  const requiredConf = payment.required_confirmations as number;

  // Build explorer URL
  const network = (payment.network as string || '').toLowerCase();
  let explorerUrl = `https://etherscan.io/tx/${txHash}`;
  if (coin === 'BTC') explorerUrl = `https://blockstream.info/tx/${txHash}`;
  else if (coin === 'SOL') explorerUrl = `https://solscan.io/tx/${txHash}`;
  else if (coin === 'XRP') explorerUrl = `https://xrpscan.com/tx/${txHash}`;
  else if (coin === 'DOGE') explorerUrl = `https://dogechain.info/tx/${txHash}`;
  else if (coin === 'BNB' || network.includes('bsc')) explorerUrl = `https://bscscan.com/tx/${txHash}`;
  else if (network.includes('trc') || network.includes('tron')) explorerUrl = `https://tronscan.org/#/transaction/${txHash}`;
  else if (network.includes('base')) explorerUrl = `https://basescan.org/tx/${txHash}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullmoney.shop';

  // Build invoice for confirmed payments
  let invoiceHTML = '';
  if (newStatus === 'confirmed') {
    const invoiceData = buildCryptoInvoiceData({ ...payment, status: 'confirmed' });
    invoiceHTML = generateInvoiceHTML(invoiceData);
  }

  // ── ADMIN EMAIL ──
  const statusLabels: Record<string, { icon: string; color: string; label: string }> = {
    confirmed: { icon: '✅', color: '#22c55e', label: 'CONFIRMED' },
    failed: { icon: '❌', color: '#ef4444', label: 'FAILED' },
    underpaid: { icon: '⚠️', color: '#f59e0b', label: 'UNDERPAID' },
    expired: { icon: '⏰', color: '#6b7280', label: 'EXPIRED' },
    overpaid: { icon: '💰', color: '#3b82f6', label: 'OVERPAID' },
  };

  const sl = statusLabels[newStatus] || { icon: '📋', color: '#888', label: newStatus.toUpperCase() };

  const adminHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 20px; color: ${sl.color};">
        ${sl.icon} Crypto Payment ${sl.label}
      </h1>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Order</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right; font-weight: 600;">${orderNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Customer</td><td style="padding: 6px 0; color: #3b82f6; font-size: 13px; text-align: right;">${customerEmail || 'N/A'}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Product</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">${productName}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Amount</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right; font-weight: 700;">$${amountUSD?.toFixed(2)} (${amountCrypto} ${coin})</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Confirmations</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">${confirmations}/${requiredConf}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">TX</td><td style="padding: 6px 0; font-size: 11px; text-align: right;"><a href="${explorerUrl}" style="color: #3b82f6; font-family: monospace; word-break: break-all;">${txHash.substring(0, 32)}...</a></td></tr>
        </table>
      </div>
      ${newStatus === 'underpaid' ? '<div style="background: #451a03; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 16px;"><p style="color: #fbbf24; font-size: 13px; margin: 0;"><strong>Action required:</strong> Customer sent less than expected. Review in admin panel.</p></div>' : ''}
      ${newStatus === 'confirmed' ? '<div style="background: #052e16; border: 1px solid #22c55e; border-radius: 8px; padding: 12px; margin-bottom: 16px;"><p style="color: #4ade80; font-size: 13px; margin: 0;">Payment verified on blockchain. Order can be fulfilled.</p></div>' : ''}
      <a href="${siteUrl}/admin" style="display: inline-block; padding: 10px 20px; background: #fff; color: #000; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px;">Admin Panel</a>
    </div>
    ${invoiceHTML ? `<div style="margin-top: 32px;">${invoiceHTML}</div>` : ''}
  `;

  // Send admin email
  sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BullMoney] ${sl.icon} Payment ${sl.label}: $${amountUSD?.toFixed(2)} ${coin} — ${orderNumber}`,
    html: adminHtml,
  }).catch((err) => console.error('[Verify] Admin email failed:', err));

  // ── CUSTOMER EMAIL ──
  if (!customerEmail) {
    console.warn(`[Verify] No customer email for ${orderNumber}, skipping customer notification`);
    return;
  }

  let customerSubject = '';
  let customerBody = '';

  if (newStatus === 'confirmed') {
    customerSubject = `BullMoney Order ${orderNumber} — Payment Confirmed!`;
    customerBody = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #052e16; border: 2px solid #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">✅</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #22c55e;">Payment Confirmed</h1>
          <p style="color: #888; font-size: 14px; margin: 0;">Your crypto payment has been verified on the blockchain</p>
        </div>
        <div style="background: #052e16; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
          <p style="color: #4ade80; font-size: 13px; margin: 0 0 4px;">Order Number</p>
          <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">${orderNumber}</p>
        </div>
        <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${productName}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Total</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${amountUSD?.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Paid</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${amountCrypto} ${coin}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Confirmations</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">${confirmations}/${requiredConf}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">Confirmed</td></tr>
          </table>
        </div>
        <div style="background: #0f0f0f; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">Your order is being processed</h3>
          <p style="color: #ccc; font-size: 13px; line-height: 1.6; margin: 0;">Your payment has been verified and your order is now being processed. Digital products will be delivered shortly, and physical items will ship within 2-3 business days.</p>
        </div>
        <div style="text-align: center;">
          <a href="${explorerUrl}" style="display: inline-block; padding: 12px 32px; background: #22c55e; color: #000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">View Transaction</a>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${siteUrl}/store" style="color: #3b82f6; font-size: 13px; text-decoration: underline;">Continue Shopping</a>
          <span style="color: #333; margin: 0 8px;">|</span>
          <a href="mailto:officialbullmoneywebsite@gmail.com" style="color: #3b82f6; font-size: 13px; text-decoration: underline;">Contact Support</a>
        </div>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. Your invoice is included below.</p>
      </div>
      ${invoiceHTML ? `<div style="margin-top: 32px;">${invoiceHTML}</div>` : ''}
    `;
  } else if (newStatus === 'failed') {
    customerSubject = `BullMoney Order ${orderNumber} — Payment Issue`;
    customerBody = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #ef4444;">Payment Could Not Be Verified</h1>
          <p style="color: #888; font-size: 14px; margin: 0;">We were unable to verify your transaction on the blockchain</p>
        </div>
        <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${orderNumber}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${productName}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">$${amountUSD?.toFixed(2)} (${amountCrypto} ${coin})</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">TX Hash</td><td style="padding: 8px 0; font-size: 11px; text-align: right;"><a href="${explorerUrl}" style="color: #3b82f6; font-family: monospace; word-break: break-all;">${txHash.substring(0, 32)}...</a></td></tr>
          </table>
        </div>
        <div style="background: #1c0a0a; border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #fca5a5; font-size: 14px; margin: 0 0 8px;">What to do next</h3>
          <ul style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
            <li>Verify the transaction hash is correct on the block explorer</li>
            <li>Make sure the transaction was sent to the correct wallet address</li>
            <li>If this is an error, contact support with your order number</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="mailto:officialbullmoneywebsite@gmail.com?subject=Payment%20Issue%20${orderNumber}" style="display: inline-block; padding: 12px 32px; background: #fff; color: #000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Contact Support</a>
        </div>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
      </div>
    `;
  } else if (newStatus === 'underpaid') {
    customerSubject = `BullMoney Order ${orderNumber} — Insufficient Payment`;
    customerBody = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #f59e0b;">Payment Underpaid</h1>
          <p style="color: #888; font-size: 14px; margin: 0;">The amount received was less than the required amount</p>
        </div>
        <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${orderNumber}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Expected</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${amountCrypto} ${coin}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #f59e0b; font-size: 14px; text-align: right; font-weight: 600;">Underpaid</td></tr>
          </table>
        </div>
        <div style="background: #1a1400; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #fcd34d; font-size: 13px; margin: 0;">Please contact our support team with your order number. We may ask you to send the remaining amount to complete your order.</p>
        </div>
        <div style="text-align: center;">
          <a href="mailto:officialbullmoneywebsite@gmail.com?subject=Underpayment%20${orderNumber}" style="display: inline-block; padding: 12px 32px; background: #f59e0b; color: #000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Contact Support</a>
        </div>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
      </div>
    `;
  } else if (newStatus === 'expired') {
    customerSubject = `BullMoney Order ${orderNumber} — Payment Expired`;
    customerBody = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #6b7280;">Payment Expired</h1>
          <p style="color: #888; font-size: 14px; margin: 0;">Your transaction could not be found on the blockchain within the time window</p>
        </div>
        <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${orderNumber}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${productName}</td></tr>
            <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">$${amountUSD?.toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="background: #0f0f0f; border: 1px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #ccc; font-size: 13px; margin: 0;">If you believe you made this payment, please contact support with your transaction hash and order number. We can manually review the payment.</p>
        </div>
        <div style="text-align: center;">
          <a href="${siteUrl}/store" style="display: inline-block; padding: 12px 32px; background: #3b82f6; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px; margin-right: 8px;">Try Again</a>
          <a href="mailto:officialbullmoneywebsite@gmail.com?subject=Expired%20Payment%20${orderNumber}" style="display: inline-block; padding: 12px 32px; background: #222; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Contact Support</a>
        </div>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
      </div>
    `;
  }

  if (customerSubject && customerBody) {
    sendEmail({
      to: customerEmail,
      subject: customerSubject,
      html: customerBody,
    }).catch((err) => console.error(`[Verify] Customer email failed for ${orderNumber}:`, err));
    console.log(`[Verify] Customer email sent to ${customerEmail} — ${newStatus} — ${orderNumber}`);
  }
}
