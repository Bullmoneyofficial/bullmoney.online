'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  XCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import type { OrderWithItems, OrderStatus } from '@/types/store';

// ============================================================================
// ADMIN ORDERS TABLE - SORTABLE DATA TABLE
// ============================================================================

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

export function AdminOrdersTable() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'total'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const limit = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/store/admin/orders?${params}`);
      const data = await response.json();

      setOrders(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSort = (column: 'created_at' | 'total') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl
                     focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl
                   focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
        >
          <option value="" className="bg-black">All Status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status} className="bg-black">{status}</option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="h-11 w-11 flex items-center justify-center bg-white/5 border border-white/10
                   rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-white/40 text-sm border-b border-white/10 bg-white/5">
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Items</th>
                <th 
                  className="p-4 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('total')}
                >
                  <span className="flex items-center gap-1">
                    Total
                    {sortBy === 'total' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th 
                  className="p-4 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <span className="flex items-center gap-1">
                    Date
                    {sortBy === 'created_at' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/40">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <Link 
                        href={`/store/admin/orders/${order.id}`}
                        className="font-mono text-sm hover:text-white/80"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm">{order.customer_name || 'Guest'}</p>
                        <p className="text-white/40 text-xs">
                          {order.customer_email || order.guest_email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-white/60">
                      {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                    </td>
                    <td className="p-4 font-medium">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="p-4 text-white/60 text-sm">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/store/admin/orders/${order.id}`}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <OrderActionsMenu order={order} onUpdate={fetchOrders} />
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-white/40 text-sm">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
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

function OrderActionsMenu({ order, onUpdate }: { order: OrderWithItems; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await fetch(`/api/store/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-black border border-white/10 rounded-xl shadow-xl z-20 py-1">
            {order.status === 'PAID' && (
              <button
                onClick={() => handleStatusChange('PROCESSING')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                Mark Processing
              </button>
            )}
            {order.status === 'PROCESSING' && (
              <button
                onClick={() => handleStatusChange('SHIPPED')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                Mark Shipped
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button
                onClick={() => handleStatusChange('DELIVERED')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                Mark Delivered
              </button>
            )}
            {!['CANCELLED', 'REFUNDED', 'DELIVERED'].includes(order.status) && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-red-400"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
