import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';

// ============================================================================
// STRIPE WEBHOOK HANDLER
// Handles payment_intent.succeeded and updates order status
// All payment events email officialbullmoneywebsite@gmail.com + customer
// ============================================================================

const ADMIN_EMAIL = 'officialbullmoneywebsite@gmail.com';

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabaseAdmin;
}

function getWebhookSecret(): string {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook handler error:', message);
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    );
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  
  if (!orderId) {
    console.error('No order_id in payment intent metadata');
    return;
  }

  console.log(`Processing successful payment for order: ${orderId}`);

  // Update order status to PAID
  const { data: order, error: updateError } = await (getSupabaseAdmin() as any)
    .from('orders')
    .update({
      status: 'PAID',
      stripe_charge_id: paymentIntent.latest_charge as string,
      paid_at: new Date().toISOString(),
      metadata: {
        payment_method: paymentIntent.payment_method,
        receipt_email: paymentIntent.receipt_email,
        amount_received: paymentIntent.amount_received,
      },
    })
    .eq('id', orderId)
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update order:', updateError);
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  console.log(`Order ${order.order_number} marked as PAID`);

  // Send confirmation email (integrate with your email service)
  await sendOrderConfirmationEmail(order);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  
  if (!orderId) {
    console.error('No order_id in payment intent metadata');
    return;
  }

  console.log(`Payment failed for order: ${orderId}`);

  // Update order with failure info
  const { error } = await (getSupabaseAdmin() as any)
    .from('orders')
    .update({
      metadata: {
        payment_failed: true,
        failure_message: paymentIntent.last_payment_error?.message,
        failure_code: paymentIntent.last_payment_error?.code,
      },
    })
    .eq('id', orderId);

  if (error) {
    console.error('Failed to update order with failure info:', error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  
  if (!paymentIntentId) {
    return;
  }

  console.log(`Processing refund for payment intent: ${paymentIntentId}`);

  // Find and update the order
  const { data: order, error: findError } = await (getSupabaseAdmin() as any)
    .from('orders')
    .select('id, order_number')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (findError || !order) {
    console.error('Order not found for refund:', findError);
    return;
  }

  // Check if full or partial refund
  const isFullRefund = charge.amount_refunded === charge.amount;

  const { error: updateError } = await (getSupabaseAdmin() as any)
    .from('orders')
    .update({
      status: isFullRefund ? 'REFUNDED' : 'PAID',
      metadata: {
        refund_amount: charge.amount_refunded / 100,
        refund_status: isFullRefund ? 'full' : 'partial',
        refunded_at: new Date().toISOString(),
      },
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('Failed to update order with refund:', updateError);
  }

  console.log(`Order ${order.order_number} refund processed (${isFullRefund ? 'full' : 'partial'})`);
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = dispute.payment_intent as string;
  
  if (!paymentIntentId) {
    return;
  }

  console.log(`Dispute created for payment intent: ${paymentIntentId}`);

  // Find and flag the order
  const { error } = await (getSupabaseAdmin() as any)
    .from('orders')
    .update({
      metadata: {
        dispute_id: dispute.id,
        dispute_status: dispute.status,
        dispute_reason: dispute.reason,
        dispute_created_at: new Date().toISOString(),
      },
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (error) {
    console.error('Failed to update order with dispute:', error);
  }

  // Alert admin (integrate with notification service)
  console.warn(`ALERT: Dispute created for payment ${paymentIntentId}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function sendOrderConfirmationEmail(order: {
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  total: number;
  shipping_address: unknown;
}) {
  // Get customer email
  let email: string | null = order.guest_email;
  
  if (order.user_id && !email) {
    const { data: profile } = await (getSupabaseAdmin() as any)
      .from('profiles')
      .select('email')
      .eq('id', order.user_id)
      .single();
    
    email = profile?.email || null;
  }

  if (!email) {
    console.error('No email found for order confirmation');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullmoney.shop';

  const customerHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #22c55e;">Payment Successful</h1>
        <p style="color: #888; font-size: 14px; margin: 0;">Thank you for your purchase from BullMoney</p>
      </div>
      <div style="background: #052e16; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <p style="color: #4ade80; font-size: 13px; margin: 0 0 4px;">Order Number</p>
        <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">${order.order_number}</p>
      </div>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Total</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${(order.total / 100).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Payment Method</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">Card (Stripe)</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">Confirmed</td></tr>
        </table>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${siteUrl}/store" style="display: inline-block; padding: 12px 32px; background: #fff; color: #000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Continue Shopping</a>
      </div>
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="color: #444; font-size: 11px; margin: 0; text-align: center;">&copy; ${new Date().getFullYear()} BullMoney. All rights reserved.</p>
    </div>
  `;

  // Send customer email
  sendEmail({
    to: email,
    subject: `BullMoney Order ${order.order_number} — Payment Confirmed`,
    html: customerHtml,
  }).catch((err) => console.error('[Stripe] Customer email failed:', err));

  // Send admin notification with full details
  const adminHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 32px; border-radius: 16px;">
      <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 20px; color: #22c55e;">New Stripe Payment</h1>
      <div style="background: #111; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Order</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right; font-weight: 600;">${order.order_number}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Customer</td><td style="padding: 6px 0; color: #3b82f6; font-size: 13px; text-align: right;">${email}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Total</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right; font-weight: 700;">$${(order.total / 100).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Method</td><td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">Stripe (Card)</td></tr>
        </table>
      </div>
      <a href="${siteUrl}/admin" style="display: inline-block; padding: 10px 20px; background: #fff; color: #000; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px;">Admin Panel</a>
    </div>
  `;

  sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BullMoney] New Payment: $${(order.total / 100).toFixed(2)} — ${order.order_number} — ${email}`,
    html: adminHtml,
  }).catch((err) => console.error('[Stripe] Admin email failed:', err));

  console.log(`[Stripe] Emails sent for order ${order.order_number} to ${email} + admin`);
}

// Note: In Next.js App Router, body parsing is disabled by default for route handlers
// The deprecated config export has been removed
