import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';
import { generateInvoiceHTML, buildCryptoInvoiceData } from '@/lib/invoice-generator';
import { decryptValue } from '@/lib/crypto-encryption';

// ============================================================================
// CRYPTO REFUND API — Full refund lifecycle
//
//   POST  — Customer requests a refund
//   GET   — Check refund status
//   PATCH — Admin approve / deny / process
//
// Policy: NO refunds under $100 (auto-denied). Over $100 = 14-day window.
// All status changes email BOTH admin + customer.
// ============================================================================

const ADMIN_EMAIL = 'officialbullmoneywebsite@gmail.com';
const MIN_REFUND_AMOUNT = 100; // USD
const REFUND_WINDOW_DAYS = 14;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

function isAdminAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const bearerAuth = request.headers.get('authorization');
  if (cronSecret && bearerAuth === `Bearer ${cronSecret}`) return true;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminToken = process.env.ADMIN_API_TOKEN;
  const authEmail = request.headers.get('x-admin-email');
  const authToken = request.headers.get('x-admin-token');

  if (!adminEmail || !authEmail) return false;
  if (authEmail !== adminEmail) return false;
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !adminToken) return false;
  if (!adminToken) return true;
  if (authToken !== adminToken) return false;

  return true;
}

// ── POST: Customer requests a refund ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, reason, customerWallet, customerEmail } = body;

    if (!orderNumber || !reason) {
      return NextResponse.json(
        { error: 'orderNumber and reason are required' },
        { status: 400 }
      );
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedCustomerEmail = customerEmail.trim().toLowerCase();

    const supabase = getSupabaseAdmin();

    // Find the original crypto payment
    const { data: payment, error: findErr } = await supabase
      .from('crypto_payments')
      .select('*')
      .eq('order_number', orderNumber.trim())
      .maybeSingle();

    if (findErr || !payment) {
      return NextResponse.json(
        { error: 'Payment not found for this order number' },
        { status: 404 }
      );
    }

    const storedEmail = decryptValue(payment.guest_email) || payment.guest_email || '';
    if (storedEmail && storedEmail.toLowerCase() !== normalizedCustomerEmail) {
      return NextResponse.json(
        { error: 'Email does not match payment record' },
        { status: 403 }
      );
    }

    // Check if already refunded
    if (payment.refund_status === 'completed' || payment.refund_status === 'approved' || payment.refund_status === 'processing') {
      return NextResponse.json(
        { error: 'A refund has already been initiated for this order' },
        { status: 409 }
      );
    }

    // Check payment is confirmed (can't refund pending payments)
    if (payment.status !== 'confirmed' && payment.status !== 'overpaid') {
      return NextResponse.json(
        { error: 'Refunds are only available for confirmed payments. Your payment status: ' + payment.status },
        { status: 400 }
      );
    }

    const amountUSD = Number(payment.amount_usd);

    // ── POLICY CHECK: No refunds under $100 ──
    const policyPassed = amountUSD >= MIN_REFUND_AMOUNT;
    let policyDetails = '';

    if (!policyPassed) {
      policyDetails = `Refund denied: Order total $${amountUSD.toFixed(2)} is under the $${MIN_REFUND_AMOUNT} minimum. Crypto payments under $100 are non-refundable due to blockchain transaction fees.`;

      // Auto-create a denied refund record
      await supabase.from('crypto_refunds').insert({
        payment_id: payment.id,
        order_number: orderNumber,
        status: 'denied',
        refund_amount_usd: amountUSD,
        original_amount_usd: amountUSD,
        coin: payment.coin,
        network: payment.network,
        customer_email: normalizedCustomerEmail,
        customer_wallet: customerWallet || null,
        reason,
        policy_check_passed: false,
        policy_check_details: policyDetails,
        denial_reason: `Auto-denied: Order $${amountUSD.toFixed(2)} below $${MIN_REFUND_AMOUNT} minimum`,
        reviewed_at: new Date().toISOString(),
      });

      // Update crypto_payments
      await supabase.from('crypto_payments').update({
        refund_status: 'denied',
      }).eq('id', payment.id);

      // Email customer about denial
      sendRefundDeniedEmail(payment, customerEmail, policyDetails).catch(
        (err) => console.error('[Refund] Denial email failed:', err)
      );

      return NextResponse.json({
        success: false,
        status: 'denied',
        message: policyDetails,
        policy: {
          minimumAmount: MIN_REFUND_AMOUNT,
          orderAmount: amountUSD,
          eligible: false,
        },
      });
    }

    // Check 14-day refund window
    const confirmDate = new Date(payment.confirmed_at || payment.submitted_at);
    const now = new Date();
    const daysSinceConfirm = (now.getTime() - confirmDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceConfirm > REFUND_WINDOW_DAYS) {
      const windowMsg = `Refund window expired. Must request within ${REFUND_WINDOW_DAYS} days of payment confirmation. Days elapsed: ${Math.floor(daysSinceConfirm)}.`;

      await supabase.from('crypto_refunds').insert({
        payment_id: payment.id,
        order_number: orderNumber,
        status: 'denied',
        refund_amount_usd: amountUSD,
        original_amount_usd: amountUSD,
        coin: payment.coin,
        network: payment.network,
        customer_email: normalizedCustomerEmail,
        customer_wallet: customerWallet || null,
        reason,
        policy_check_passed: false,
        policy_check_details: windowMsg,
        denial_reason: windowMsg,
        reviewed_at: new Date().toISOString(),
      });

      await supabase.from('crypto_payments').update({
        refund_status: 'denied',
      }).eq('id', payment.id);

      sendRefundDeniedEmail(payment, customerEmail, windowMsg).catch(
        (err) => console.error('[Refund] Denial email failed:', err)
      );

      return NextResponse.json({
        success: false,
        status: 'denied',
        message: windowMsg,
      });
    }

    // ── Policy passed — create pending refund ──
    policyDetails = `Eligible: $${amountUSD.toFixed(2)} >= $${MIN_REFUND_AMOUNT} minimum, within ${REFUND_WINDOW_DAYS}-day window (${Math.floor(daysSinceConfirm)} days since confirmation).`;

    const { data: refund, error: insertErr } = await supabase.from('crypto_refunds').insert({
      payment_id: payment.id,
      order_number: orderNumber,
      status: 'requested',
      refund_amount_usd: amountUSD,
      original_amount_usd: amountUSD,
      coin: payment.coin,
      network: payment.network,
      customer_email: normalizedCustomerEmail,
      customer_wallet: customerWallet || null,
      reason,
      policy_check_passed: true,
      policy_check_details: policyDetails,
    }).select().single();

    if (insertErr) {
      console.error('[Refund] Insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
    }

    // Update crypto_payments
    await supabase.from('crypto_payments').update({
      refund_status: 'requested',
      refund_id: refund.id,
    }).eq('id', payment.id);

    // Email admin about new refund request
    sendRefundRequestAdminEmail(payment, refund, normalizedCustomerEmail).catch(
      (err) => console.error('[Refund] Admin email failed:', err)
    );

    // Email customer confirmation of request
    sendRefundRequestCustomerEmail(payment, refund, normalizedCustomerEmail).catch(
      (err) => console.error('[Refund] Customer email failed:', err)
    );

    return NextResponse.json({
      success: true,
      status: 'requested',
      refundId: refund.id,
      message: 'Refund request submitted. You will receive an email update once reviewed.',
      policy: {
        minimumAmount: MIN_REFUND_AMOUNT,
        orderAmount: amountUSD,
        eligible: true,
        daysRemaining: Math.max(0, REFUND_WINDOW_DAYS - Math.floor(daysSinceConfirm)),
      },
    });
  } catch (error) {
    console.error('[Refund] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── GET: Check refund status ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');
  const refundId = searchParams.get('refundId');
  const customerEmail = searchParams.get('customerEmail');

  if (!orderNumber && !refundId) {
    return NextResponse.json({ error: 'Provide orderNumber or refundId' }, { status: 400 });
  }

  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Valid customerEmail required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('crypto_refunds')
    .select('id, order_number, status, refund_amount_usd, coin, reason, denial_reason, policy_check_passed, policy_check_details, requested_at, reviewed_at, completed_at');

  if (refundId) {
    query = query.eq('id', refundId);
  } else if (orderNumber) {
    query = query.eq('order_number', orderNumber.trim());
  }

  query = query.eq('customer_email', customerEmail.toLowerCase());

  const { data, error } = await query.order('requested_at', { ascending: false }).limit(1).maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// ── PATCH: Admin approve / deny / complete ──────────────────────────────
export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminEmail = request.headers.get('x-admin-email') || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin';

  try {
    const body = await request.json();
    const { refundId, action, reviewNotes, refundTxHash, refundWallet } = body;

    if (!refundId || !action) {
      return NextResponse.json({ error: 'refundId and action required' }, { status: 400 });
    }

    const validActions = ['approve', 'deny', 'complete', 'cancel'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be: ${validActions.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get the refund
    const { data: refund, error: findErr } = await supabase
      .from('crypto_refunds')
      .select('*, crypto_payments(*)')
      .eq('id', refundId)
      .single();

    if (findErr || !refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      reviewed_by: adminEmail,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || null,
    };

    let paymentRefundStatus = '';

    switch (action) {
      case 'approve':
        updateData.status = 'approved';
        paymentRefundStatus = 'approved';
        break;
      case 'deny':
        updateData.status = 'denied';
        updateData.denial_reason = reviewNotes || 'Denied by admin';
        paymentRefundStatus = 'denied';
        break;
      case 'complete':
        if (!refundTxHash) {
          return NextResponse.json({ error: 'refundTxHash required to complete refund' }, { status: 400 });
        }
        updateData.status = 'completed';
        updateData.refund_tx_hash = refundTxHash;
        updateData.refund_wallet_used = refundWallet || null;
        updateData.completed_at = new Date().toISOString();
        updateData.processed_at = new Date().toISOString();
        paymentRefundStatus = 'completed';
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        paymentRefundStatus = 'cancelled';
        break;
    }

    // Update refund
    const { data: updated, error: updateErr } = await supabase
      .from('crypto_refunds')
      .update(updateData)
      .eq('id', refundId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Update crypto_payments refund status
    if (paymentRefundStatus) {
      await supabase.from('crypto_payments').update({
        refund_status: paymentRefundStatus,
        refund_amount_usd: action === 'complete' ? refund.refund_amount_usd : undefined,
      }).eq('id', refund.payment_id);

      // If completed, also update store_orders status
      if (action === 'complete') {
        await supabase.from('store_orders').update({
          status: 'refunded',
          payment_status: 'refunded',
          metadata: {
            refund_id: refundId,
            refund_tx_hash: refundTxHash,
            refund_amount: refund.refund_amount_usd,
            refunded_at: new Date().toISOString(),
          },
        }).eq('order_number', refund.order_number);
      }
    }

    // Send status emails
    const payment = refund.crypto_payments || {};

    if (action === 'approve') {
      sendRefundApprovedEmail(payment, refund).catch(err => console.error('[Refund] Approve email failed:', err));
    } else if (action === 'deny') {
      sendRefundDeniedEmail(payment, refund.customer_email, updateData.denial_reason as string).catch(
        err => console.error('[Refund] Deny email failed:', err)
      );
    } else if (action === 'complete') {
      sendRefundCompletedEmail(payment, { ...refund, ...updateData }).catch(
        err => console.error('[Refund] Complete email failed:', err)
      );
    }

    return NextResponse.json({ success: true, refund: updated });
  } catch (error) {
    console.error('[Refund] PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================================================
// REFUND EMAIL FUNCTIONS
// ============================================================================

async function sendRefundRequestAdminEmail(
  payment: Record<string, unknown>,
  refund: Record<string, unknown>,
  customerEmail: string
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullmoney.shop';
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 20px; color: #f59e0b;">
        Refund Request Received
      </h1>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Order</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right; font-weight: 600;">${payment.order_number}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Customer</td><td style="padding: 6px 0; color: #3b82f6; font-size: 13px; text-align: right;">${customerEmail}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Amount</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right; font-weight: 700;">$${Number(payment.amount_usd).toFixed(2)} (${payment.amount_crypto} ${payment.coin})</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Product</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">${payment.product_name}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Reason</td><td style="padding: 6px 0; color: #fbbf24; font-size: 13px; text-align: right;">${refund.reason}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Policy</td><td style="padding: 6px 0; color: #22c55e; font-size: 13px; text-align: right;">PASSED ($${Number(payment.amount_usd).toFixed(2)} >= $${MIN_REFUND_AMOUNT})</td></tr>
          ${refund.customer_wallet ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Refund Wallet</td><td style="padding: 6px 0; color: #fff; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all;">${refund.customer_wallet}</td></tr>` : ''}
        </table>
      </div>
      <div style="background: #451a03; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="color: #fbbf24; font-size: 13px; margin: 0;"><strong>Action required:</strong> Review and approve/deny in admin panel.</p>
      </div>
      <a href="${siteUrl}/admin" style="display: inline-block; padding: 10px 20px; background: #fff; color: #000; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px;">Admin Panel</a>
    </div>
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BullMoney] Refund Request: $${Number(payment.amount_usd).toFixed(2)} ${payment.coin} — ${payment.order_number}`,
    html,
  });
}

async function sendRefundRequestCustomerEmail(
  payment: Record<string, unknown>,
  refund: Record<string, unknown>,
  customerEmail: string
) {
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #fff;">Refund Request Received</h1>
        <p style="color: #888; font-size: 14px; margin: 0;">We've received your refund request and will review it shortly</p>
      </div>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${payment.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${Number(payment.amount_usd).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #f59e0b; font-size: 14px; text-align: right; font-weight: 600;">Under Review</td></tr>
        </table>
      </div>
      <div style="background: #0f0f0f; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">What happens next</h3>
        <ol style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
          <li>Our team will review your refund request (usually within 24 hours)</li>
          <li>You'll receive an email when a decision is made</li>
          <li>If approved, the refund will be sent to your crypto wallet</li>
        </ol>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #666; font-size: 12px;">Refund Policy: Crypto payments over $${MIN_REFUND_AMOUNT} are eligible within ${REFUND_WINDOW_DAYS} days. Payments under $${MIN_REFUND_AMOUNT} are non-refundable.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
    </div>
  `;

  await sendEmail({
    to: customerEmail,
    subject: `BullMoney Refund Request — ${payment.order_number}`,
    html,
  });
}

async function sendRefundDeniedEmail(
  payment: Record<string, unknown>,
  customerEmail: string,
  reason: string
) {
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #ef4444;">Refund Request — Not Eligible</h1>
        <p style="color: #888; font-size: 14px; margin: 0;">Your refund request could not be processed</p>
      </div>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${payment.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">$${Number(payment.amount_usd).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #ef4444; font-size: 14px; text-align: right; font-weight: 600;">Denied</td></tr>
        </table>
      </div>
      <div style="background: #1c0a0a; border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #fca5a5; font-size: 13px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <div style="background: #0f0f0f; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">Refund Policy</h3>
        <ul style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
          <li>Crypto payments under $${MIN_REFUND_AMOUNT} are <strong>non-refundable</strong> due to blockchain transaction fees</li>
          <li>Refunds must be requested within ${REFUND_WINDOW_DAYS} days of payment confirmation</li>
          <li>Refunds are processed in the original cryptocurrency at the current market rate</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="mailto:officialbullmoneywebsite@gmail.com?subject=Refund%20Question%20${payment.order_number}" style="display: inline-block; padding: 12px 32px; background: #222; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Contact Support</a>
      </div>
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
    </div>
  `;

  // Send to customer
  await sendEmail({
    to: customerEmail,
    subject: `BullMoney Order ${payment.order_number} — Refund Request Update`,
    html,
  });

  // Send admin copy
  sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ADMIN] Refund Denied: $${Number(payment.amount_usd).toFixed(2)} — ${payment.order_number}`,
    html,
  }).catch((err) => console.error('[Refund] Admin denial copy failed:', err));
}

async function sendRefundApprovedEmail(
  payment: Record<string, unknown>,
  refund: Record<string, unknown>
) {
  const customerEmail = refund.customer_email as string;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #3b82f6;">Refund Approved</h1>
        <p style="color: #888; font-size: 14px; margin: 0;">Your refund has been approved and will be processed shortly</p>
      </div>
      <div style="background: #0a1628; border: 1px solid #1d4ed8; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <p style="color: #93c5fd; font-size: 13px; margin: 0 0 4px;">Refund Amount</p>
        <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">$${Number(refund.refund_amount_usd).toFixed(2)}</p>
      </div>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${refund.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Original Payment</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${payment.amount_crypto || ''} ${payment.coin || refund.coin}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #3b82f6; font-size: 14px; text-align: right; font-weight: 600;">Approved — Processing</td></tr>
        </table>
      </div>
      <p style="color: #ccc; font-size: 13px; line-height: 1.6;">The refund will be sent in ${refund.coin} to ${refund.customer_wallet ? 'your provided wallet' : 'a wallet you provide'}. If you haven't provided a wallet address, please reply to this email with your ${refund.coin} wallet address.</p>
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
    </div>
  `;

  await sendEmail({ to: customerEmail, subject: `BullMoney Refund Approved — ${refund.order_number}`, html });

  // Admin copy
  sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ADMIN] Refund Approved: $${Number(refund.refund_amount_usd).toFixed(2)} — ${refund.order_number}`,
    html,
  }).catch(() => {});
}

async function sendRefundCompletedEmail(
  payment: Record<string, unknown>,
  refund: Record<string, unknown>
) {
  const customerEmail = refund.customer_email as string;
  const invoiceData = buildCryptoInvoiceData({
    ...payment,
    status: 'refunded',
    refund_amount_usd: refund.refund_amount_usd,
  });
  const invoiceHTML = generateInvoiceHTML(invoiceData);

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #22c55e;">Refund Completed</h1>
        <p style="color: #888; font-size: 14px; margin: 0;">Your refund has been sent to your crypto wallet</p>
      </div>
      <div style="background: #052e16; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <p style="color: #4ade80; font-size: 13px; margin: 0 0 4px;">Refunded Amount</p>
        <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">$${Number(refund.refund_amount_usd).toFixed(2)}</p>
      </div>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${refund.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Refund TX</td><td style="padding: 8px 0; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all; color: #3b82f6;">${refund.refund_tx_hash || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Coin</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${refund.coin}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">Completed</td></tr>
        </table>
      </div>
      <p style="color: #ccc; font-size: 13px; text-align: center;">The refund transaction may take a few minutes to appear in your wallet depending on the blockchain network.</p>
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
    </div>
    <div style="margin-top: 32px;">${invoiceHTML}</div>
  `;

  await sendEmail({ to: customerEmail, subject: `BullMoney Refund Completed — ${refund.order_number}`, html });

  // Admin copy
  sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ADMIN] Refund Completed: $${Number(refund.refund_amount_usd).toFixed(2)} — ${refund.order_number} — TX: ${refund.refund_tx_hash}`,
    html,
  }).catch(() => {});
}
