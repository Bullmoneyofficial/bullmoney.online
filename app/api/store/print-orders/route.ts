import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: create a print order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, productId, digitalArtId, sizeLabel, width, height, quantity, unitPrice, totalPrice, customImageUrl, notes } = body;

    if (!userEmail || !sizeLabel || !unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('print_orders').insert({
      user_email: userEmail,
      product_id: productId || null,
      digital_art_id: digitalArtId || null,
      size_label: sizeLabel,
      width: width || null,
      height: height || null,
      quantity: quantity || 1,
      unit_price: unitPrice,
      total_price: totalPrice || unitPrice * (quantity || 1),
      custom_image_url: customImageUrl || null,
      notes: notes || null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (err: any) {
    console.error('[print-orders] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}

// GET: fetch user's orders
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { data, error } = await supabase
      .from('print_orders')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (err: any) {
    console.error('[print-orders] GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
