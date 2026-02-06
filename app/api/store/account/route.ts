import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ============================================================================
// STORE ACCOUNT API
// GET: Fetch user account data (profile, orders, addresses)
// PATCH: Update user profile/settings
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value 
    || cookieStore.get('supabase-auth-token')?.value;
  
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch recruit profile
    const { data: recruit } = await supabase
      .from('recruits')
      .select('*')
      .eq('email', user.email)
      .single();

    // Fetch orders (from store_orders table if it exists)
    let orders: any[] = [];
    try {
      const { data } = await supabase
        .from('store_orders')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false });
      if (data) orders = data;
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({
      user: {
        email: user.email,
        display_name: recruit?.display_name || recruit?.full_name || '',
        phone: recruit?.phone || recruit?.cell_number || '',
        preferred_currency: recruit?.preferred_currency || 'USD',
        preferred_language: recruit?.preferred_language || 'en',
        is_vip: recruit?.is_vip || false,
        store_customer_since: recruit?.store_customer_since,
      },
      orders: orders.map((o: any) => ({
        id: o.id,
        date: o.created_at,
        status: o.status || 'processing',
        total: o.total_amount || 0,
        items: o.items || [],
        trackingNumber: o.tracking_number,
      })),
      addresses: recruit?.shipping_addresses || [],
    });
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.preferred_currency !== undefined) updates.preferred_currency = body.preferred_currency;
    if (body.preferred_language !== undefined) updates.preferred_language = body.preferred_language;
    if (body.shipping_addresses !== undefined) updates.shipping_addresses = body.shipping_addresses;
    if (body.store_size_preferences !== undefined) updates.store_size_preferences = body.store_size_preferences;

    const { error } = await supabase
      .from('recruits')
      .update(updates)
      .eq('email', user.email);

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
