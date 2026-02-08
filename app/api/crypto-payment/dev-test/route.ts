import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';
import { buildCryptoInvoiceData, generateInvoiceHTML } from '@/lib/invoice-generator';
import { getWalletsForCoin } from '@/lib/crypto-wallets';
import { decryptValue, encryptValue, hashValue } from '@/lib/crypto-encryption';

// ============================================================================
// DEV-ONLY CRYPTO PAYMENT TESTING
// POST /api/crypto-payment/dev-test
//
// Requires header: x-dev-key = DEV_CRYPTO_TEST_KEY
// Disabled in production.
// ============================================================================

const ADMIN_EMAIL = 'officialbullmoneywebsite@gmail.com';

function isDevAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const expected = process.env.DEV_CRYPTO_TEST_KEY;
  if (!expected) return false;
  const provided = request.headers.get('x-dev-key');
  return provided === expected;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

function makeOrderNumber() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEV-${Date.now()}-${suffix}`;
}

function makeTxHash() {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function createOrderFromCryptoPayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  payment: Record<string, unknown>
) {
  const orderNumber = payment.order_number as string;
  const email = (payment.guest_email as string) || '';
  const productName = (payment.product_name as string) || 'Dev Test Product';
  const quantity = (payment.quantity as number) || 1;
  const amountUSD = (payment.amount_usd as number) || 0;
  const coin = payment.coin as string;
  const network = payment.network as string;
  const txHash = payment.tx_hash as string;

  const { data: existing } = await supabase
    .from('store_orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (existing) return;

  const { data: order, error } = await supabase
    .from('store_orders')
    .insert({
      order_number: orderNumber,
      email: email.toLowerCase(),
      customer_name: email.split('@')[0] || 'Crypto Customer',
      items: [{
        name: productName,
        quantity,
        price: quantity ? amountUSD / quantity : amountUSD,
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
        dev_test: true,
      },
    })
    .select()
    .single();

  if (!error && order?.id) {
    await supabase
      .from('crypto_payments')
      .update({ order_id: order.id })
      .eq('order_number', orderNumber);
  }
}

async function sendDevEmails(payment: Record<string, unknown>) {
  const customerEmail = decryptValue(payment.guest_email as string) || '';
  if (!customerEmail) return;

  const invoiceData = buildCryptoInvoiceData({
    ...payment,
    status: 'confirmed',
  });
  const invoiceHTML = generateInvoiceHTML(invoiceData);

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">Dev Test Payment Confirmed</h1>
      <p style="font-size: 13px; color: #bbb; margin: 0 0 16px;">This is a development-only confirmation email.</p>
      <div style="background: #111; padding: 16px; border-radius: 12px;">
        <p style="font-size: 12px; color: #888; margin: 0 0 6px;">Order</p>
        <p style="font-size: 14px; margin: 0;">${payment.order_number}</p>
      </div>
    </div>
    <div style="margin-top: 24px;">${invoiceHTML}</div>
  `;

  await sendEmail({
    to: [customerEmail, ADMIN_EMAIL],
    subject: `[DEV] Crypto Payment Confirmed — ${payment.order_number}`,
    html,
  });
}

export async function POST(request: NextRequest) {
  if (!isDevAllowed(request)) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const action = body.action || 'create';

    const supabase = getSupabaseAdmin();

    if (action === 'create') {
      const orderNumber = makeOrderNumber();
      const txHash = body.txHash || makeTxHash();
      const coin = body.coin || 'USDT';
      const network = body.network || 'ethereum';
      const amountUSD = Number(body.amountUSD || 25);
      const quantity = Number(body.quantity || 1);
      const productName = body.productName || 'Dev Test Product';
      const customerEmail = body.customerEmail || '';
      const wallets = getWalletsForCoin(coin);
      const walletAddress = body.walletAddress || wallets[0]?.address || 'dev_wallet';

      const emailLower = customerEmail.toLowerCase();
      const encryptedEmail = encryptValue(emailLower);
      const encryptedWallet = encryptValue(walletAddress);
      const txHashHash = hashValue(txHash);
      const emailHash = hashValue(emailLower);

      const { data, error } = await supabase
        .from('crypto_payments')
        .insert({
          order_number: orderNumber,
          tx_hash: encryptValue(txHash),
          tx_hash_hash: txHashHash,
          guest_email_hash: emailHash,
          coin,
          network,
          wallet_address: encryptedWallet,
          amount_usd: amountUSD,
          amount_crypto: body.amountCrypto || null,
          locked_price: body.lockedPrice || null,
          product_name: productName,
          quantity,
          guest_email: encryptedEmail,
          status: 'pending',
          confirmations: 0,
          required_confirmations: 1,
          blockchain_verified: false,
          amount_verified: false,
          verification_attempts: 0,
          price_locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          admin_notes: 'dev-test',
        })
        .select()
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        paymentId: data.id,
        orderNumber,
        txHash,
      });
    }

    if (action === 'confirm') {
      const paymentId = body.paymentId;
      const orderNumber = body.orderNumber;
      const sendEmails = Boolean(body.sendEmails);

      if (!paymentId && !orderNumber) {
        return NextResponse.json({ error: 'paymentId or orderNumber required' }, { status: 400 });
      }

      let query = supabase.from('crypto_payments').select('*');
      if (paymentId) query = query.eq('id', paymentId);
      if (orderNumber) query = query.eq('order_number', orderNumber);
      const { data: payment, error } = await query.maybeSingle();

      if (error || !payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const required = payment.required_confirmations || 1;
      const { data: updated, error: updateErr } = await supabase
        .from('crypto_payments')
        .update({
          status: 'confirmed',
          confirmations: required,
          blockchain_verified: true,
          amount_verified: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .select()
        .single();

      if (updateErr || !updated) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }

      await createOrderFromCryptoPayment(supabase, updated);

      if (sendEmails) {
        await sendDevEmails(updated);
      }

      return NextResponse.json({ success: true, payment: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[DevTest] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
