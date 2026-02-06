import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// AUTO-CREATE ORDER (Success Page Fallback)
// Called from success page when Stripe webhook isn't configured
// Idempotent: won't duplicate if webhook already created the order
// NO fake tracking — real tracking numbers added later via /api/store/tracking
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BM-${code}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, email, customer_name, amount_total, currency, line_items, shipping_details } = body;

    if (!session_id || !email) {
      return NextResponse.json({ error: 'session_id and email required' }, { status: 400 });
    }

    // Idempotency: check if order already exists for this session
    const { data: existing } = await supabase
      .from('store_orders')
      .select('order_number, tracking_number, carrier, status')
      .eq('stripe_session_id', session_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        order_number: existing.order_number,
        tracking_number: existing.tracking_number,
        carrier: existing.carrier,
        status: existing.status,
        already_exists: true,
      });
    }

    const orderNumber = generateOrderNumber();

    // Build items
    const items = (line_items || []).map((item: any) => ({
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      price: (item.amount || 0) / 100,
    }));

    const totalAmount = (amount_total || 0) / 100;

    // Build shipping address
    const shippingAddress = shipping_details ? {
      name: shipping_details.name || customer_name || '',
      line1: shipping_details.address?.line1 || '',
      line2: shipping_details.address?.line2 || '',
      city: shipping_details.address?.city || '',
      state: shipping_details.address?.state || '',
      postal_code: shipping_details.address?.postal_code || '',
      country: shipping_details.address?.country || '',
    } : null;

    // Insert order — NO tracking, status = processing
    // Real tracking numbers get added later via PUT /api/store/tracking
    const { error } = await supabase
      .from('store_orders')
      .insert({
        order_number: orderNumber,
        email: email.toLowerCase(),
        customer_name: customer_name || '',
        items,
        subtotal: totalAmount,
        total_amount: totalAmount,
        currency: currency || 'usd',
        shipping_address: shippingAddress,
        status: 'processing',
        payment_status: 'paid',
        fulfillment_status: 'unfulfilled',
        stripe_session_id: session_id,
        payment_method: 'stripe',
        // tracking_number, tracking_url, carrier, shipped_at = NULL
        source: 'web',
        metadata: {
          shipping_country: shipping_details?.address?.country || null,
          created_by: 'success_page_fallback',
        },
      });

    if (error) {
      console.error('Auto-create order error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update recruit order count
    const { data: recruit } = await supabase
      .from('recruits')
      .select('store_order_count, store_total_spent')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (recruit) {
      await supabase
        .from('recruits')
        .update({
          store_order_count: (recruit.store_order_count || 0) + 1,
          store_total_spent: parseFloat(String(recruit.store_total_spent || 0)) + totalAmount,
        })
        .eq('email', email.toLowerCase());
    }

    return NextResponse.json({
      order_number: orderNumber,
      status: 'processing',
    });

  } catch (err: any) {
    console.error('Auto-create order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
