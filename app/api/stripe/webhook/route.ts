import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// STRIPE WEBHOOK → AUTO-CREATE ORDER
// When a customer pays → order saved to store_orders as "processing"
// Tracking numbers are added later from REAL carrier shipments only
// ============================================================================

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
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

// ============================================================================
// GENERATE ORDER NUMBER
// ============================================================================
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BM-${code}`;
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded:', (event.data.object as any).id);
      break;

    case 'payment_intent.payment_failed':
      console.log('Payment failed:', (event.data.object as any).id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// ============================================================================
// CHECKOUT COMPLETED → CREATE ORDER (no fake tracking)
// Tracking numbers come from real carriers only — added via
// PUT /api/store/tracking when you actually ship the package
// ============================================================================
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'payment_intent'],
    });

    const email = fullSession.customer_details?.email || fullSession.customer_email || '';
    const customerName = fullSession.customer_details?.name || '';
    const phone = fullSession.customer_details?.phone || '';
    const shippingDetails = (fullSession as any).shipping_details;
    const shippingAddress = shippingDetails?.address || {};
    const orderNumber = generateOrderNumber();

    // Build items from Stripe line items
    const items = (fullSession.line_items?.data || []).map((item: any) => ({
      name: item.description || item.price?.product?.name || 'Product',
      quantity: item.quantity || 1,
      price: (item.amount_total || 0) / 100,
      image: null,
    }));

    const totalAmount = (fullSession.amount_total || 0) / 100;

    // Build shipping address JSON
    const shippingAddressJson = shippingDetails ? {
      name: shippingDetails.name || customerName,
      line1: shippingAddress.line1 || '',
      line2: shippingAddress.line2 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      postal_code: shippingAddress.postal_code || '',
      country: shippingAddress.country || '',
      phone: phone,
    } : null;

    // Idempotency check
    const { data: existing } = await (getSupabaseAdmin() as any)
      .from('store_orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (existing) {
      console.log(`Order already exists for session ${session.id}, skipping`);
      return;
    }

    // Insert order — NO tracking number, NO carrier
    // Real tracking numbers get added later via /api/store/tracking
    const { error } = await (getSupabaseAdmin() as any)
      .from('store_orders')
      .insert({
        order_number: orderNumber,
        email: email.toLowerCase(),
        customer_name: customerName,
        phone,
        items,
        subtotal: totalAmount,
        shipping_cost: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: totalAmount,
        currency: fullSession.currency || 'usd',
        shipping_address: shippingAddressJson,
        shipping_method: 'standard',
        status: 'processing',
        payment_status: 'paid',
        fulfillment_status: 'unfulfilled',
        stripe_session_id: session.id,
        stripe_payment_intent: typeof fullSession.payment_intent === 'string'
          ? fullSession.payment_intent
          : (fullSession.payment_intent as any)?.id || null,
        payment_method: 'stripe',
        // tracking_number, tracking_url, carrier left NULL
        // shipped_at left NULL — set when real tracking is added
        source: 'web',
        metadata: {
          shipping_country: shippingAddress?.country || null,
          session_payment_status: fullSession.payment_status,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create order:', error);
      throw error;
    }

    console.log(`✅ Order ${orderNumber} created — awaiting real tracking number`);

    // Update recruit profile order counts
    const { data: recruit } = await (getSupabaseAdmin() as any)
      .from('recruits')
      .select('store_order_count, store_total_spent')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (recruit) {
      await (getSupabaseAdmin() as any)
        .from('recruits')
        .update({
          store_order_count: (recruit.store_order_count || 0) + 1,
          store_total_spent: parseFloat(String(recruit.store_total_spent || 0)) + totalAmount,
        })
        .eq('email', email.toLowerCase());
    }

  } catch (err) {
    console.error('handleCheckoutCompleted error:', err);
  }
}
