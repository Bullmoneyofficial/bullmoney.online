'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { RevenueChart } from './RevenueChart';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import type { AdminStats, RevenueDataPoint, OrderWithItems } from '@/types/store';

// ============================================================================
// ADMIN DASHBOARD - OVERVIEW WITH ANALYTICS
// ============================================================================

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, revenueRes, ordersRes] = await Promise.all([
        fetch('/api/store/admin/stats'),
        fetch('/api/store/admin/revenue'),
        fetch('/api/store/admin/orders?limit=5'),
      ]);

      const [statsData, revenueDataResult, ordersData] = await Promise.all([
        statsRes.json(),
        revenueRes.json(),
        ordersRes.json(),
      ]);

      setStats(statsData);
      setRevenueData(revenueDataResult.data || []);
      setRecentOrders(ordersData.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? useCurrencyLocaleStore.getState().formatPrice(stats.total_revenue) : useCurrencyLocaleStore.getState().formatPrice(0),
      change: stats?.revenue_change || 0,
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: stats?.total_orders.toLocaleString() || '0',
      change: stats?.orders_change || 0,
      icon: ShoppingCart,
    },
    {
      label: 'Products',
      value: stats?.total_products.toLocaleString() || '0',
      change: 0,
      icon: Package,
    },
    {
      label: 'Customers',
      value: stats?.total_customers.toLocaleString() || '0',
      change: 0,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-light">Dashboard</h1>
        <p className="text-white/40 mt-1 text-sm md:text-base">Welcome back to your store admin</p>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-white/60" />
                </div>
                {stat.change !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs md:text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <p className="text-lg md:text-2xl font-light">{stat.value}</p>
              <p className="text-white/40 text-xs md:text-sm mt-0.5 md:mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-white/5 border border-white/10 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium">Revenue Overview</h2>
            <p className="text-white/40 text-sm">Last 30 days performance</p>
          </div>
          <select className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none">
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <RevenueChart data={revenueData} />
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-white/5 border border-white/10 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium">Recent Orders</h2>
            <p className="text-white/40 text-sm">Latest customer orders</p>
          </div>
          <Link
            href="/store/admin/orders"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-white/40 text-sm border-b border-white/10">
                <th className="pb-4 font-medium">Order</th>
                <th className="pb-4 font-medium">Customer</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Items</th>
                <th className="pb-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <Link 
                        href={`/store/admin/orders/${order.id}`}
                        className="font-mono text-sm hover:text-white/80"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-4 text-white/60">
                      {order.customer_name || order.guest_email || 'Guest'}
                    </td>
                    <td className="py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-4 text-white/60">
                      {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 text-right font-medium">
                      ${order.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    PAID: 'bg-green-500/20 text-green-400',
    PROCESSING: 'bg-blue-500/20 text-blue-400',
    SHIPPED: 'bg-purple-500/20 text-purple-400',
    DELIVERED: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
    REFUNDED: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusStyles[status] || statusStyles.PENDING}`}>
      {status}
    </span>
  );
}
