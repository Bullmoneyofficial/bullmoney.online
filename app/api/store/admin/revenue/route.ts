import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// ============================================================================
// ADMIN REVENUE API - CHART DATA
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

    // Get revenue data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('status', ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
      .order('created_at', { ascending: true });

    // Group by date
    const revenueByDate: Record<string, { revenue: number; orders: number }> = {};

    // Initialize all dates with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueByDate[dateStr] = { revenue: 0, orders: 0 };
    }

    // Fill in actual data
    orders?.forEach(order => {
      const dateStr = new Date(order.created_at).toISOString().split('T')[0];
      if (revenueByDate[dateStr]) {
        revenueByDate[dateStr].revenue += order.total;
        revenueByDate[dateStr].orders += 1;
      }
    });

    // Convert to array
    const data = Object.entries(revenueByDate).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      orders: stats.orders,
    }));

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Admin revenue error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
