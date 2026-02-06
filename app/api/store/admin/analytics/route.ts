import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// STORE ANALYTICS API — Full E-commerce Dashboard Data
// Queries: store_orders, store_wishlist, store_cart, back_in_stock_subscriptions,
//          gift_cards, discount_codes, recruits, store_analytics
// ============================================================================

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _supabase;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 86400000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

    // ===================== ORDERS =====================
    const { data: allOrders } = await supabase
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false });

    const orders: any[] = allOrders || [];

    // Revenue calculations
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    const totalRevenue = paidOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const paidOrderCount = paidOrders.length;

    // Period comparisons
    const currentPeriodOrders = paidOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
    const previousPeriodOrders = paidOrders.filter(o => {
      const d = new Date(o.created_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const currentRevenue = currentPeriodOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const previousRevenue = previousPeriodOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    const currentOrderCount = currentPeriodOrders.length;
    const previousOrderCount = previousPeriodOrders.length;
    const ordersGrowth = previousOrderCount > 0
      ? Math.round(((currentOrderCount - previousOrderCount) / previousOrderCount) * 100)
      : currentOrderCount > 0 ? 100 : 0;

    // Average order value
    const avgOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;

    // Orders by status
    const ordersByStatus = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      refunded: orders.filter(o => o.status === 'refunded').length,
    };

    // Orders by carrier
    const carrierCounts: Record<string, number> = {};
    orders.filter(o => o.carrier).forEach(o => {
      const c = o.carrier || 'unknown';
      carrierCounts[c] = (carrierCounts[c] || 0) + 1;
    });

    // Fulfillment rate
    const fulfilledOrders = orders.filter(o => o.fulfillment_status === 'fulfilled').length;
    const fulfillmentRate = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0;

    // Orders needing tracking (processing/shipped with no tracking)
    const needsTracking = orders.filter(o =>
      ['processing', 'shipped'].includes(o.status) && !o.tracking_number
    ).length;

    // Revenue by day (last 30 days)
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      revenueByDay[key] = 0;
      ordersByDay[key] = 0;
    }
    paidOrders.forEach(o => {
      const key = new Date(o.created_at).toISOString().split('T')[0];
      if (revenueByDay[key] !== undefined) {
        revenueByDay[key] += parseFloat(o.total_amount || 0);
        ordersByDay[key] = (ordersByDay[key] || 0) + 1;
      }
    });

    // Today's revenue & orders
    const todayKey = today.toISOString().split('T')[0];
    const todayRevenue = revenueByDay[todayKey] || 0;
    const todayOrders = ordersByDay[todayKey] || 0;

    // Top products (from order items)
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    paidOrders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const key = item.product_id || item.id || item.name;
        if (!productSales[key]) {
          productSales[key] = { name: item.name || 'Unknown', quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity || 1;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Shipping countries
    const countryCounts: Record<string, number> = {};
    orders.forEach(o => {
      const country = o.shipping_address?.country || o.metadata?.shipping_country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map(o => ({
      order_number: o.order_number,
      email: o.email,
      customer_name: o.customer_name,
      total: parseFloat(o.total_amount || 0),
      status: o.status,
      payment_status: o.payment_status,
      tracking_number: o.tracking_number,
      carrier: o.carrier,
      items_count: Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0,
      created_at: o.created_at,
    }));

    // ===================== CUSTOMERS =====================
    const uniqueEmails = new Set(orders.map(o => o.email?.toLowerCase()).filter(Boolean));
    const totalCustomers = uniqueEmails.size;

    // Repeat customers (>1 order)
    const emailOrderCount: Record<string, number> = {};
    orders.forEach(o => {
      if (o.email) emailOrderCount[o.email.toLowerCase()] = (emailOrderCount[o.email.toLowerCase()] || 0) + 1;
    });
    const repeatCustomers = Object.values(emailOrderCount).filter(c => c > 1).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    // Top customers by spend
    const customerSpend: Record<string, { email: string; name: string; total: number; orders: number }> = {};
    paidOrders.forEach(o => {
      const email = o.email?.toLowerCase() || '';
      if (!customerSpend[email]) {
        customerSpend[email] = { email, name: o.customer_name || '', total: 0, orders: 0 };
      }
      customerSpend[email].total += parseFloat(o.total_amount || 0);
      customerSpend[email].orders += 1;
    });
    const topCustomers = Object.values(customerSpend)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // New customers (last 7 days)
    const recentCustomerEmails = orders
      .filter(o => new Date(o.created_at) >= sevenDaysAgo)
      .map(o => o.email?.toLowerCase())
      .filter(Boolean);
    const newCustomersThisWeek = new Set(recentCustomerEmails).size;

    // ===================== WISHLIST =====================
    const { data: wishlistData, count: wishlistCount } = await supabase
      .from('store_wishlist')
      .select('*', { count: 'exact' });

    const wishlistItems: any[] = wishlistData || [];
    const wishlistProductCounts: Record<string, { name: string; count: number }> = {};
    wishlistItems.forEach(w => {
      const key = w.product_id;
      if (!wishlistProductCounts[key]) {
        wishlistProductCounts[key] = { name: w.product_name, count: 0 };
      }
      wishlistProductCounts[key].count += 1;
    });
    const topWishlistProducts = Object.values(wishlistProductCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ===================== CART =====================
    const { data: cartData, count: cartCount } = await supabase
      .from('store_cart')
      .select('*', { count: 'exact' });

    const cartItems: any[] = cartData || [];
    const activeCartValue = cartItems.reduce((s, c) => {
      const price = c.product_data?.base_price || 0;
      const adj = c.variant_data?.price_adjustment || 0;
      return s + (price + adj) * (c.quantity || 1);
    }, 0);
    const activeCartUsers = new Set(cartItems.map(c => c.email)).size;

    // ===================== BACK IN STOCK =====================
    const { data: bisData, count: bisCount } = await supabase
      .from('back_in_stock_subscriptions')
      .select('*', { count: 'exact' });

    const bisItems: any[] = bisData || [];
    const bisProductCounts: Record<string, { name: string; count: number }> = {};
    bisItems.forEach(b => {
      const key = b.product_id;
      if (!bisProductCounts[key]) {
        bisProductCounts[key] = { name: b.product_name || 'Unknown', count: 0 };
      }
      bisProductCounts[key].count += 1;
    });
    const topDemandedProducts = Object.values(bisProductCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ===================== GIFT CARDS =====================
    const { data: giftCards } = await supabase
      .from('gift_cards')
      .select('*');

    const gc: any[] = giftCards || [];
    const totalGiftCardsIssued = gc.length;
    const totalGiftCardValue = gc.reduce((s, g) => s + parseFloat(g.amount || 0), 0);
    const totalGiftCardBalance = gc.reduce((s, g) => s + parseFloat(g.balance || 0), 0);
    const activeGiftCards = gc.filter(g => g.is_active && parseFloat(g.balance || 0) > 0).length;

    // ===================== DISCOUNT CODES =====================
    let discountStats = { total: 0, active: 0 };
    try {
      const { data: discounts, count: discountCount } = await supabase
        .from('discount_codes')
        .select('*', { count: 'exact' });
      const dc: any[] = discounts || [];
      discountStats = {
        total: dc.length,
        active: dc.filter((d: any) => d.is_active).length,
      };
    } catch {
      // Table might not exist
    }

    // ===================== STORE ANALYTICS EVENTS =====================
    let eventStats = { page_views: 0, add_to_cart: 0, purchases: 0, searches: 0, wishlist_adds: 0 };
    try {
      const { data: events } = await supabase
        .from('store_analytics')
        .select('event_type')
        .gte('created_at', thirtyDaysAgo.toISOString());

      (events || []).forEach((e: any) => {
        switch (e.event_type) {
          case 'page_view': eventStats.page_views++; break;
          case 'add_to_cart': eventStats.add_to_cart++; break;
          case 'purchase': eventStats.purchases++; break;
          case 'search': eventStats.searches++; break;
          case 'wishlist_add': eventStats.wishlist_adds++; break;
        }
      });
    } catch {
      // Table might not exist yet
    }

    // Conversion rate (purchases / page_views)
    const conversionRate = eventStats.page_views > 0
      ? ((eventStats.purchases / eventStats.page_views) * 100).toFixed(2)
      : '0.00';

    // Cart-to-purchase rate
    const cartToPurchaseRate = eventStats.add_to_cart > 0
      ? ((eventStats.purchases / eventStats.add_to_cart) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      // Overview KPIs
      overview: {
        total_revenue: totalRevenue,
        current_period_revenue: currentRevenue,
        previous_period_revenue: previousRevenue,
        revenue_growth: revenueGrowth,
        avg_order_value: avgOrderValue,
        total_orders: totalOrders,
        paid_orders: paidOrderCount,
        current_period_orders: currentOrderCount,
        orders_growth: ordersGrowth,
        today_revenue: todayRevenue,
        today_orders: todayOrders,
        total_customers: totalCustomers,
        new_customers_this_week: newCustomersThisWeek,
        repeat_customers: repeatCustomers,
        repeat_rate: repeatRate,
        fulfillment_rate: fulfillmentRate,
        needs_tracking: needsTracking,
        conversion_rate: conversionRate,
        cart_to_purchase_rate: cartToPurchaseRate,
      },

      // Orders
      orders: {
        by_status: ordersByStatus,
        by_carrier: carrierCounts,
        recent: recentOrders,
      },

      // Charts
      charts: {
        revenue_by_day: revenueByDay,
        orders_by_day: ordersByDay,
      },

      // Products
      products: {
        top_selling: topProducts,
        top_wishlisted: topWishlistProducts,
        top_demanded: topDemandedProducts,
      },

      // Customers
      customers: {
        top_spenders: topCustomers,
        top_countries: topCountries,
      },

      // Inventory signals
      inventory: {
        wishlist_total: wishlistCount || 0,
        cart_total: cartCount || 0,
        active_cart_value: activeCartValue,
        active_cart_users: activeCartUsers,
        back_in_stock_subs: bisCount || 0,
      },

      // Promos
      promos: {
        gift_cards_issued: totalGiftCardsIssued,
        gift_card_total_value: totalGiftCardValue,
        gift_card_remaining_balance: totalGiftCardBalance,
        active_gift_cards: activeGiftCards,
        discount_codes_total: discountStats.total,
        discount_codes_active: discountStats.active,
      },

      // Events
      events: eventStats,
    });

  } catch (err: any) {
    console.error('Store analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
