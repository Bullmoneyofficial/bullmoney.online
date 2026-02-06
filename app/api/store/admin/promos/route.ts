import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// PROMO MANAGEMENT API — Admin CRUD for discount_codes & gift_cards
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all discount codes + gift cards
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'discounts' | 'gift_cards' | null (both)

    const result: any = {};

    if (!type || type === 'discounts') {
      const { data: discounts, error: dErr } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (dErr) throw dErr;
      result.discounts = discounts || [];
    }

    if (!type || type === 'gift_cards') {
      const { data: giftCards, error: gErr } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (gErr) throw gErr;
      result.gift_cards = giftCards || [];
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Promo GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new discount code or gift card
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (type === 'discount') {
      const { data: created, error } = await supabase
        .from('discount_codes')
        .insert({
          code: data.code?.toUpperCase(),
          description: data.description || null,
          discount_type: data.discount_type || 'percent',
          discount_value: data.discount_value || 0,
          min_order_amount: data.min_order_amount || 0,
          max_discount_amount: data.max_discount_amount || null,
          max_uses: data.max_uses || null,
          use_count: 0,
          max_uses_per_user: data.max_uses_per_user || 1,
          is_active: data.is_active !== false,
          starts_at: data.starts_at || new Date().toISOString(),
          expires_at: data.expires_at || null,
          applies_to: data.applies_to || 'all',
          first_order_only: data.first_order_only || false,
          free_shipping: data.free_shipping || false,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: created });
    }

    if (type === 'gift_card') {
      // Generate code if not provided
      const code = data.code || generateGiftCardCode();
      const { data: created, error } = await supabase
        .from('gift_cards')
        .insert({
          code,
          amount: data.amount || 0,
          balance: data.balance ?? data.amount ?? 0,
          recipient_email: data.recipient_email || '',
          recipient_name: data.recipient_name || null,
          sender_name: data.sender_name || null,
          message: data.message || null,
          is_active: data.is_active !== false,
          expires_at: data.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: created });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Promo POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update a discount code or gift card
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    if (type === 'discount') {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (updates.code !== undefined) updatePayload.code = updates.code.toUpperCase();
      if (updates.description !== undefined) updatePayload.description = updates.description;
      if (updates.discount_type !== undefined) updatePayload.discount_type = updates.discount_type;
      if (updates.discount_value !== undefined) updatePayload.discount_value = updates.discount_value;
      if (updates.min_order_amount !== undefined) updatePayload.min_order_amount = updates.min_order_amount;
      if (updates.max_discount_amount !== undefined) updatePayload.max_discount_amount = updates.max_discount_amount;
      if (updates.max_uses !== undefined) updatePayload.max_uses = updates.max_uses;
      if (updates.max_uses_per_user !== undefined) updatePayload.max_uses_per_user = updates.max_uses_per_user;
      if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active;
      if (updates.starts_at !== undefined) updatePayload.starts_at = updates.starts_at;
      if (updates.expires_at !== undefined) updatePayload.expires_at = updates.expires_at;
      if (updates.applies_to !== undefined) updatePayload.applies_to = updates.applies_to;
      if (updates.first_order_only !== undefined) updatePayload.first_order_only = updates.first_order_only;
      if (updates.free_shipping !== undefined) updatePayload.free_shipping = updates.free_shipping;

      const { data, error } = await supabase
        .from('discount_codes')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (type === 'gift_card') {
      const updatePayload: any = {};
      if (updates.amount !== undefined) updatePayload.amount = updates.amount;
      if (updates.balance !== undefined) updatePayload.balance = updates.balance;
      if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active;
      if (updates.recipient_email !== undefined) updatePayload.recipient_email = updates.recipient_email;
      if (updates.recipient_name !== undefined) updatePayload.recipient_name = updates.recipient_name;
      if (updates.message !== undefined) updatePayload.message = updates.message;
      if (updates.expires_at !== undefined) updatePayload.expires_at = updates.expires_at;

      const { data, error } = await supabase
        .from('gift_cards')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Promo PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a discount code or gift card
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    const table = type === 'discount' ? 'discount_codes' : type === 'gift_card' ? 'gift_cards' : null;
    if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Promo DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `BULL-${segments.join('-')}`;
}
