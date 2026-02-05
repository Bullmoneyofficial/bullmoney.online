import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// ============================================================================
// ADMIN ORDERS API - LIST & MANAGE ORDERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(count)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: orders, count, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedOrders = orders?.map(order => ({
      ...order,
      item_count: order.items?.[0]?.count || 0,
    }));

    return NextResponse.json({
      data: transformedOrders,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
