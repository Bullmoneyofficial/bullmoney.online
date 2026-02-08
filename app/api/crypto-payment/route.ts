import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';
import { generateInvoiceHTML, buildCryptoInvoiceData } from '@/lib/invoice-generator';
import { ALL_WALLETS } from '@/lib/crypto-wallets';
import { encryptValue, hashValue } from '@/lib/crypto-encryption';

// ============================================================================
// CRYPTO PAYMENT API — Production pipeline
// POST: Submit a new crypto payment → Supabase + admin/customer emails + invoice
// GET: Check payment status by txHash or order_number
//
// Emails go to:
//   1. officialbullmoneywebsite@gmail.com (admin — full details + invoice)
//   2. Customer email (receipt + invoice)
// ============================================================================

const ADMIN_EMAIL = 'officialbullmoneywebsite@gmail.com';

// ── In-memory rate limiting (per IP, 5 submissions per 10 mins) ─────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;

const emailLimitMap = new Map<string, { count: number; resetAt: number }>();
const walletLimitMap = new Map<string, { count: number; resetAt: number }>();
const ABUSE_WINDOW = 60 * 60 * 1000; // 1 hour
const ABUSE_MAX = 8;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function checkAbuseLimit(map: Map<string, { count: number; resetAt: number }>, key: string): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + ABUSE_WINDOW });
    return true;
  }
  if (entry.count >= ABUSE_MAX) return false;
  entry.count++;
  return true;
}

// Clean up stale rate limit entries every 30 mins
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
    for (const [key, val] of emailLimitMap) {
      if (now > val.resetAt) emailLimitMap.delete(key);
    }
    for (const [key, val] of walletLimitMap) {
      if (now > val.resetAt) walletLimitMap.delete(key);
    }
  }, 30 * 60 * 1000);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// Generate a human-readable order number
function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BM-CRYPTO-${ts}-${rand}`;
}

// Get block explorer URL for a given coin/network
function getExplorerUrl(txHash: string, coin: string, network: string): string {
  const upper = coin.toUpperCase();
  const net = network.toLowerCase();
  if (upper === 'BTC') return `https://blockstream.info/tx/${txHash}`;
  if (upper === 'SOL') return `https://solscan.io/tx/${txHash}`;
  if (upper === 'XRP') return `https://xrpscan.com/tx/${txHash}`;
  if (upper === 'DOGE') return `https://dogechain.info/tx/${txHash}`;
  if (upper === 'BNB' || net.includes('bsc') || net.includes('bnb') || net.includes('bep')) return `https://bscscan.com/tx/${txHash}`;
  if (net.includes('trc') || net.includes('tron')) return `https://tronscan.org/#/transaction/${txHash}`;
  if (net.includes('base')) return `https://basescan.org/tx/${txHash}`;
  if (net.includes('uniswap')) return `https://basescan.org/tx/${txHash}`;
  // Default ETH / ERC-20
  return `https://etherscan.io/tx/${txHash}`;
}

// ── POST: Submit crypto payment ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many payment submissions. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    const {
      txHash,
      coin,
      network,
      walletAddress,
      senderWallet,
      amountUSD,
      amountCrypto,
      lockedPrice,
      productId,
      variantId,
      quantity,
      productName,
      customerEmail,
    } = body;

    // Validate required fields
    if (!txHash || !coin || !network || !walletAddress || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: txHash, coin, network, walletAddress, productId' },
        { status: 400 }
      );
    }

    // Validate customer email
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required for your receipt.' },
        { status: 400 }
      );
    }

    // Basic tx hash format validation
    const cleanHash = txHash.trim();
    if (cleanHash.length < 10 || cleanHash.length > 128) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Validate that walletAddress is one of our KNOWN wallets (prevent fraud)
    const knownWallet = ALL_WALLETS.find(
      (w) => w.address.toLowerCase() === walletAddress.trim().toLowerCase()
    );
    if (!knownWallet) {
      console.error(`[CryptoPayment] FRAUD ATTEMPT: Unknown wallet ${walletAddress} from ${clientIp}`);
      return NextResponse.json(
        { error: 'Invalid payment address. Please use the address shown on our checkout page.' },
        { status: 400 }
      );
    }

    // Validate coin matches the wallet's coin
    if (knownWallet.coin.toUpperCase() !== coin.toUpperCase()) {
      return NextResponse.json(
        { error: `Wallet address does not match coin ${coin}. Expected ${knownWallet.coin}.` },
        { status: 400 }
      );
    }

    // Validate quantity
    const normalizedQuantity = Number.isFinite(quantity) ? Number(quantity) : 1;
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    // Validate amount is positive and reasonable (fallback if price lookup fails)
    if (typeof amountUSD !== 'number' || amountUSD <= 0 || amountUSD > 1000000) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const productIdClean = String(productId).trim();
    const variantIdClean = variantId ? String(variantId).trim() : null;

    // Validate product/variant pricing server-side (prevent client-side price tampering)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, base_price')
      .eq('id', productIdClean)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Invalid product. Please refresh and try again.' },
        { status: 400 }
      );
    }

    let variantAdjustment = 0;
    let resolvedVariantId: string | null = null;
    if (variantIdClean) {
      const { data: variant, error: variantError } = await supabase
        .from('variants')
        .select('id, product_id, price_adjustment')
        .eq('id', variantIdClean)
        .maybeSingle();

      if (variantError || !variant || variant.product_id !== product.id) {
        return NextResponse.json(
          { error: 'Invalid variant for this product.' },
          { status: 400 }
        );
      }

      variantAdjustment = Number(variant.price_adjustment || 0);
      resolvedVariantId = variant.id;
    }

    const basePrice = Number(product.base_price);
    const unitPrice = basePrice + variantAdjustment;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid product pricing. Please contact support.' },
        { status: 400 }
      );
    }

    const expectedAmountUSD = Number((unitPrice * normalizedQuantity).toFixed(2));
    if (Math.abs(expectedAmountUSD - Number(amountUSD)) > 0.01) {
      return NextResponse.json(
        { error: 'Payment amount mismatch. Please refresh and try again.' },
        { status: 400 }
      );
    }
    const orderNumber = generateOrderNumber();

    const txHashHash = hashValue(cleanHash);
    const emailHash = hashValue(emailPlain);

    // Check for duplicate tx hash
    const { data: existing } = await supabase
      .from('crypto_payments')
      .select('id, order_number')
      .or(`tx_hash_hash.eq.${txHashHash},tx_hash.eq.${cleanHash}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Payment already recorded.',
        orderNumber: existing.order_number,
        txHash: cleanHash,
        status: 'duplicate',
        paymentId: existing.id,
      });
    }

    // Get required confirmations per coin
    const confirmationsMap: Record<string, number> = {
      BTC: 3,
      ETH: 12,
      SOL: 32,
      XRP: 1,
      USDT: 12,
      USDC: 12,
      DOGE: 6,
      BNB: 15,
    };

    // Use known wallet's minConfirmations if available, otherwise fallback
    const requiredConfirmations = knownWallet?.minConfirmations 
      || confirmationsMap[coin.toUpperCase()] 
      || 12;

    const emailPlain = customerEmail.trim().toLowerCase();
    const walletKey = walletAddress.trim().toLowerCase();

    if (!checkAbuseLimit(emailLimitMap, emailPlain)) {
      return NextResponse.json(
        { error: 'Too many attempts for this email. Please wait before trying again.' },
        { status: 429 }
      );
    }

    if (!checkAbuseLimit(walletLimitMap, walletKey)) {
      return NextResponse.json(
        { error: 'Too many attempts for this wallet address. Please wait before trying again.' },
        { status: 429 }
      );
    }
    const encryptedEmail = encryptValue(emailPlain);
    const encryptedWallet = encryptValue(walletAddress);
    const encryptedSender = senderWallet ? encryptValue(senderWallet) : null;
    const encryptedTxHash = encryptValue(cleanHash);
    const safeLockedPrice = typeof lockedPrice === 'number' && lockedPrice > 0 ? lockedPrice : null;
    const expectedAmountCrypto = safeLockedPrice
      ? Number((expectedAmountUSD / safeLockedPrice).toFixed(12))
      : (typeof amountCrypto === 'number' ? amountCrypto : null);

    // Insert into Supabase
    const record = {
      order_number: orderNumber,
      tx_hash: encryptedTxHash,
      tx_hash_hash: txHashHash,
      guest_email_hash: emailHash,
      coin,
      network,
      wallet_address: encryptedWallet,
      sender_wallet: encryptedSender,
      amount_usd: expectedAmountUSD,
      amount_crypto: expectedAmountCrypto,
      locked_price: safeLockedPrice,
      product_id: productIdClean,
      variant_id: resolvedVariantId,
      product_name: product.name,
      quantity: normalizedQuantity,
      guest_email: encryptedEmail,
      status: 'pending' as const,
      required_confirmations: requiredConfirmations,
      price_locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('crypto_payments')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('[CryptoPayment] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to record payment. Please contact support.', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[CryptoPayment] Recorded: ${orderNumber} | ${cleanHash} | ${amountCrypto} ${coin} | ${emailPlain}`);

    // Build invoice HTML for attachment
    const invoiceData = buildCryptoInvoiceData({
      ...record,
      tx_hash: cleanHash,
      guest_email: emailPlain,
      wallet_address: walletAddress,
      sender_wallet: senderWallet || null,
    });
    const invoiceHTML = generateInvoiceHTML(invoiceData);
    const explorerUrl = getExplorerUrl(cleanHash, coin, network);

    const emailRecord = {
      ...record,
      tx_hash: cleanHash,
      guest_email: emailPlain,
      wallet_address: walletAddress,
      sender_wallet: senderWallet || null,
    };

    // Send BOTH admin and customer emails (non-blocking)
    Promise.allSettled([
      sendAdminPaymentEmail(emailRecord, invoiceHTML, explorerUrl),
      sendCustomerPaymentEmail(emailRecord, invoiceHTML, explorerUrl),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[CryptoPayment] Email ${i === 0 ? 'admin' : 'customer'} failed:`, r.reason);
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded. Verification in progress. Check your email for confirmation.',
      orderNumber,
      txHash: cleanHash,
      status: 'pending',
      paymentId: data.id,
    });
  } catch (error: unknown) {
    console.error('[CryptoPayment] Error:', error);
    return NextResponse.json(
      { error: 'Server error recording payment' },
      { status: 500 }
    );
  }
}

// ── GET: Check payment status ───────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('txHash');
  const orderNumber = searchParams.get('orderNumber');

  if (!txHash && !orderNumber) {
    return NextResponse.json(
      { error: 'Provide txHash or orderNumber parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('crypto_payments')
      .select('order_number, coin, network, amount_usd, amount_crypto, status, confirmations, required_confirmations, blockchain_verified, amount_verified, submitted_at, confirmed_at');

    if (txHash) {
      const clean = txHash.trim();
      const hash = hashValue(clean);
      query = query.or(`tx_hash_hash.eq.${hash},tx_hash.eq.${clean}`);
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber.trim());
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[CryptoPayment] GET error:', error);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Payment not found', status: 'unknown' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================================================
// EMAIL: Admin notification — full details + invoice to officialbullmoneywebsite@gmail.com
// ============================================================================
async function sendAdminPaymentEmail(
  record: Record<string, unknown>,
  invoiceHTML: string,
  explorerUrl: string
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullmoney.shop';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 24px; color: #3b82f6;">
        New Crypto Payment Received
      </h1>
      
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${record.order_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 8px 0; color: #3b82f6; font-size: 14px; text-align: right;">${record.guest_email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${record.product_name} x${record.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Amount (USD)</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${Number(record.amount_usd).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Crypto</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${record.amount_crypto || '—'} ${record.coin}</td>
          </tr>
          ${record.locked_price ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Locked Rate</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">1 ${record.coin} = $${Number(record.locked_price).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Network</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${record.network}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">TX Hash</td>
            <td style="padding: 8px 0; color: #3b82f6; font-size: 12px; text-align: right; font-family: monospace; word-break: break-all;">
              <a href="${explorerUrl}" style="color: #3b82f6; text-decoration: underline;">${record.tx_hash}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">To Wallet</td>
            <td style="padding: 8px 0; color: #fff; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all;">${record.wallet_address}</td>
          </tr>
          ${record.sender_wallet ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">From Wallet</td>
            <td style="padding: 8px 0; color: #fff; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all;">${record.sender_wallet}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="background: #0a1628; border: 1px solid #1d4ed8; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
        <p style="color: #93c5fd; font-size: 13px; margin: 0;">
          Status: <strong>PENDING VERIFICATION</strong> — Auto-verifying on blockchain every 5 min.
        </p>
      </div>

      <div style="margin-top: 16px;">
        <a href="${explorerUrl}" style="display: inline-block; padding: 10px 20px; background: #1d4ed8; color: #fff; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px; margin-right: 8px;">
          View on Explorer
        </a>
        <a href="${siteUrl}/admin" style="display: inline-block; padding: 10px 20px; background: #fff; color: #000; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px;">
          Admin Panel
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="color: #666; font-size: 11px; margin: 0;">Invoice attached below. Sent from BullMoney automated payment system.</p>
    </div>
    
    <div style="margin-top: 32px;">
      ${invoiceHTML}
    </div>
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BullMoney] New Crypto Payment: $${Number(record.amount_usd).toFixed(2)} (${record.amount_crypto || ''} ${record.coin}) — ${record.order_number}`,
    html,
  });

  console.log(`[CryptoPayment] Admin email sent to ${ADMIN_EMAIL} for ${record.order_number}`);
}

// ============================================================================
// EMAIL: Customer confirmation — receipt + invoice
// ============================================================================
async function sendCustomerPaymentEmail(
  record: Record<string, unknown>,
  invoiceHTML: string,
  explorerUrl: string
) {
  const email = record.guest_email as string;
  if (!email) {
    console.warn('[CryptoPayment] No customer email, skipping customer notification');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullmoney.shop';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #fff;">
          Payment Received
        </h1>
        <p style="color: #888; font-size: 14px; margin: 0;">Thank you for your purchase from BullMoney</p>
      </div>
      
      <div style="background: #0a1628; border: 1px solid #1d4ed8; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <p style="color: #93c5fd; font-size: 13px; margin: 0 0 4px;">Order Number</p>
        <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">${record.order_number}</p>
      </div>

      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 500;">${record.product_name} x${record.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Total (USD)</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${Number(record.amount_usd).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Paid</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${record.amount_crypto || '—'} ${record.coin}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Network</td>
            <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${record.network}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td>
            <td style="padding: 8px 0; color: #f59e0b; font-size: 14px; text-align: right; font-weight: 600;">Pending Verification</td>
          </tr>
        </table>
      </div>

      <div style="background: #111; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
        <p style="color: #888; font-size: 12px; margin: 0 0 6px;">Transaction Hash</p>
        <a href="${explorerUrl}" style="color: #3b82f6; font-size: 12px; font-family: monospace; word-break: break-all; text-decoration: underline;">${record.tx_hash}</a>
      </div>

      <div style="background: #0f0f0f; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">What happens next?</h3>
        <ol style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
          <li>Our system is verifying your transaction on the blockchain</li>
          <li>You'll receive an email once payment is confirmed</li>
          <li>Your order will be processed automatically after confirmation</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <a href="${explorerUrl}" style="display: inline-block; padding: 12px 32px; background: #1d4ed8; color: #fff; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 10px;">
          Track on Blockchain
        </a>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${siteUrl}/store" style="color: #3b82f6; font-size: 13px; text-decoration: underline;">Continue Shopping</a>
        <span style="color: #333; margin: 0 8px;">|</span>
        <a href="mailto:officialbullmoneywebsite@gmail.com" style="color: #3b82f6; font-size: 13px; text-decoration: underline;">Contact Support</a>
      </div>

      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />

      <div style="text-align: center;">
        <p style="color: #666; font-size: 11px; margin: 0 0 4px;">Refund Policy: Crypto payments over $100 are eligible for refund within 14 days.</p>
        <p style="color: #666; font-size: 11px; margin: 0 0 4px;">Payments under $100 are non-refundable due to processing fees.</p>
        <p style="color: #444; font-size: 11px; margin: 8px 0 0;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
      </div>
    </div>
    
    <div style="margin-top: 32px;">
      ${invoiceHTML}
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Your BullMoney Order ${record.order_number} — Payment Received`,
    html,
  });

  console.log(`[CryptoPayment] Customer email sent to ${email} for ${record.order_number}`);
}
