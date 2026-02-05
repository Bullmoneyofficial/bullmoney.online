import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// ============================================================================
// ADMIN STATS API - DASHBOARD ANALYTICS
// ============================================================================

export async function GET() {
  try {
    const supabase = createServerSupabase();

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

    // Get current period stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Total revenue (current period)
    const { data: currentRevenue } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('status', ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']);

    const totalRevenue = currentRevenue?.reduce((sum, order) => sum + order.total, 0) || 0;

    // Total revenue (previous period)
    const { data: previousRevenue } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())
      .in('status', ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']);

    const prevTotalRevenue = previousRevenue?.reduce((sum, order) => sum + order.total, 0) || 0;

    // Revenue change percentage
    const revenueChange = prevTotalRevenue > 0 
      ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
      : 0;

    // Total orders (current period)
    const { count: currentOrderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Total orders (previous period)
    const { count: previousOrderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Orders change percentage
    const ordersChange = (previousOrderCount || 0) > 0
      ? Math.round((((currentOrderCount || 0) - (previousOrderCount || 0)) / (previousOrderCount || 1)) * 100)
      : 0;

    // Total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    // Total customers (unique user_ids and guest emails from orders)
    const { data: customers } = await supabase
      .from('orders')
      .select('user_id, guest_email');

    const uniqueCustomers = new Set();
    customers?.forEach(c => {
      if (c.user_id) uniqueCustomers.add(`user_${c.user_id}`);
      if (c.guest_email) uniqueCustomers.add(`guest_${c.guest_email}`);
    });

    return NextResponse.json({
      total_revenue: totalRevenue,
      revenue_change: revenueChange,
      total_orders: currentOrderCount || 0,
      orders_change: ordersChange,
      total_products: totalProducts || 0,
      total_customers: uniqueCustomers.size,
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
